//
//  LatexRenderer.swift
//  LatexNative
//
//  iOS counterpart of NativeLatexRendererModule.kt. Turns a LaTeX string into a
//  transparent PNG (as a base64 data URI) plus the point size JS needs to lay it out.
//

import Foundation
import UIKit
import iosMath

/// `@objc(LatexRenderer)` publishes this Swift type to the Objective-C runtime under
/// the name `LatexRenderer`, which is how the ObjC++ TurboModule shim reaches it.
@objc(LatexRenderer)
final class LatexRenderer: NSObject {

  /// Ceiling on the rasterised bitmap, mirroring MAX_TEXTURE_SIZE on Android:
  /// textures larger than this are not safe to upload to the GPU.
  private static let maxPixelDimension: CGFloat = 4096

  /// Same padding the Android module asks JLaTeXMath for.
  private static let contentInsets = UIEdgeInsets(top: 4, left: 2, bottom: 4, right: 2)

  /// PNG encoding and base64 are CPU-bound, so they run here instead of on the main
  /// thread. `userInitiated` because a visible list is blocked waiting on the result.
  private static let encodingQueue = DispatchQueue(
    label: "com.latexnative.latex-encoding",
    qos: .userInitiated
  )

  /// Resolved once and cached. `UIScreen` is main-thread-only, hence the hop.
  private static let displayScale: CGFloat = {
    Thread.isMainThread
      ? UIScreen.main.scale
      : DispatchQueue.main.sync { UIScreen.main.scale }
  }()

  /// Renders `expression` at `textSize` points.
  ///
  /// On success `completion` receives a dictionary of `uri`/`width`/`height`; on failure
  /// it receives an error code and message instead. It may be called on any thread.
  @objc(renderExpression:textSize:completion:)
  static func render(
    expression: String,
    textSize: Double,
    completion: @escaping (_ result: [String: Any]?, _ errorCode: String?, _ errorMessage: String?) -> Void
  ) {
    guard !expression.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      completion(nil, "INVALID_INPUT", "Empty LaTeX expression")
      return
    }

    // MTMathUILabel is a UIView and UIKit/CoreAnimation are not thread-safe, so
    // everything that touches it — typesetting, layout, rasterising — stays on main.
    DispatchQueue.main.async {
      let label = MTMathUILabel()
      label.latex = expression
      label.fontSize = CGFloat(textSize)
      label.textColor = .black
      label.labelMode = .display
      label.textAlignment = .center
      label.contentInsets = contentInsets
      label.backgroundColor = .clear

      // iosMath reports parse failures here rather than throwing.
      if let error = label.error {
        completion(nil, "RENDER_ERROR", error.localizedDescription)
        return
      }

      let fitting = label.sizeThatFits(
        CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
      )
      guard fitting.width.isFinite, fitting.height.isFinite else {
        completion(nil, "RENDER_ERROR", "Typesetting produced an invalid size")
        return
      }

      let width = max(ceil(fitting.width), 1)
      let height = max(ceil(fitting.height), 1)

      label.frame = CGRect(x: 0, y: 0, width: width, height: height)
      // Typesets the expression and positions it inside those bounds.
      label.layoutIfNeeded()

      guard let displayList = label.displayList else {
        completion(nil, "RENDER_ERROR", "Typesetting produced no drawable output")
        return
      }

      // Draw at retina resolution, but back off if that would blow past the texture
      // limit. Only the pixel density drops — the reported point size stays the same,
      // so layout in JS is unaffected.
      let format = UIGraphicsImageRendererFormat()
      format.opaque = false
      format.scale = max(min(displayScale, maxPixelDimension / max(width, height)), 0.1)

      let renderer = UIGraphicsImageRenderer(
        size: CGSize(width: width, height: height),
        format: format
      )
      let image = renderer.image { context in
        let cg = context.cgContext
        // iosMath positions glyphs in Core Graphics coordinates — origin bottom-left,
        // y growing upward — but UIKit hands us a context flipped the other way, with a
        // pre-flipped text matrix to match. Reset both, or the result comes out
        // vertically mirrored: upside-down glyphs and swapped fraction halves.
        cg.textMatrix = .identity
        cg.translateBy(x: 0, y: height)
        cg.scaleBy(x: 1, y: -1)
        displayList.draw(cg)
      }

      encodingQueue.async {
        guard let png = image.pngData() else {
          completion(nil, "RENDER_ERROR", "Could not encode the rendered image as PNG")
          return
        }

        completion(
          [
            "uri": "data:image/png;base64,\(png.base64EncodedString())",
            // Points, not pixels: JS feeds these straight into <Image> style.
            "width": Double(width),
            "height": Double(height),
          ],
          nil,
          nil
        )
      }
    }
  }
}
