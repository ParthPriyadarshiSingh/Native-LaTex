package com.latexnative

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import ru.noties.jlatexmath.JLatexMathDrawable
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors

class NativeLatexRendererModule(reactContext: ReactApplicationContext) :
    NativeLatexRendererSpec(reactContext) {

    private val executor = Executors.newFixedThreadPool(2)

    override fun getName(): String = NAME

    // NOTE: 'width' parameter is GONE. We only need expression and textSize.
    override fun renderLatex(expression: String, textSize: Double, promise: Promise) {
        executor.execute {
            try {
                if (expression.isBlank()) {
                    promise.reject("INVALID_INPUT", "Empty LaTeX expression")
                    return@execute
                }

                // 1. Setup Drawable with exact requested text size
                val drawable = JLatexMathDrawable.builder(expression)
                    .textSize(textSize.toFloat())
                    .padding(2,4,2,4)
                    .background(0x00FFFF00) // Transparent
                    .color(Color.BLACK)
                    .align(JLatexMathDrawable.ALIGN_CENTER)
                    .build()

                val originalWidth = drawable.intrinsicWidth
                val originalHeight = drawable.intrinsicHeight

                // 2. SAFETY CAP: Hardware limit (4096 is safe for 99% of phones)
                // We only scale down if it violates hardware limits, NOT screen limits.
                val MAX_TEXTURE_SIZE = 4096
                val scaleFactor = if (originalWidth > MAX_TEXTURE_SIZE) {
                    MAX_TEXTURE_SIZE.toFloat() / originalWidth.toFloat()
                } else {
                    1.0f
                }

                val finalWidth = (originalWidth * scaleFactor).toInt().coerceAtLeast(1)
                val finalHeight = (originalHeight * scaleFactor).toInt().coerceAtLeast(1)

                // 3. Create Bitmap
                val bitmap = Bitmap.createBitmap(finalWidth, finalHeight, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                if (scaleFactor != 1.0f) {
                    canvas.scale(scaleFactor, scaleFactor)
                }

                drawable.setBounds(0, 0, originalWidth, originalHeight)
                drawable.draw(canvas)

                // 4. Compress
                val outputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                val base64Image = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
                bitmap.recycle()

                // 5. Return Dimensions so JS knows if it needs to Scroll
                val result = Arguments.createMap().apply {
                    putString("uri", "data:image/png;base64,$base64Image")
                    putDouble("width", finalWidth.toDouble())
                    putDouble("height", finalHeight.toDouble())
                }

                promise.resolve(result)

            } catch (e: Exception) {
                promise.reject("RENDER_ERROR", e.message)
            }
        }
    }

    companion object {
        const val NAME = "NativeLatexRenderer"
    }
}