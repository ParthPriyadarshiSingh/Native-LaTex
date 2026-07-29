import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Renders LaTeX to a base64 image.
   * @param expression The LaTeX string
   * @param textSize The font size in pixels (e.g., 40 for block, 24 for inline)
   */
  renderLatex(
    expression: string,
    textSize: number,
  ): Promise<{
    uri: string;
    width: number;
    height: number;
  }>;
}

// Nullable lookup: the native implementation currently exists only on
// Android. getEnforcing would throw during bundle evaluation on iOS and
// prevent the app from registering.
export default TurboModuleRegistry.get<Spec>('NativeLatexRenderer');
