// src/utils/latexParser.ts

export type TextChunk = {
  type: 'text';
  content: string;
};

export type MathChunk = {
  type: 'inline' | 'block';
  content: string;
};

export type ParsedChunk = TextChunk | MathChunk;

export function parseLatexContent(raw: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/gs;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    // 1. Push preceding text
    if (match.index > lastIndex) {
      chunks.push({
        type: 'text',
        content: raw.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // BLOCK MATH: $$...$$
      chunks.push({ type: 'block', content: match[1].trim() });
    } else if (match[2]) {
      // INLINE MATH: $...$
      const rawContent = match[2];

      // FIX: Check rawContent directly, WITHOUT trimming.
      // - "$500": rawContent is "500" -> Starts with digit -> Currency (Text)
      // - "$ 50x": rawContent is " 50x" -> Starts with space -> Math (Inline)
      if (/^\d/.test(rawContent)) {
        // It starts immediately with a digit, so treat as Text (Currency)
        chunks.push({ type: 'text', content: `$${rawContent}$` });
      } else {
        // It starts with a space, letter, or symbol, so treat as Math
        chunks.push({ type: 'inline', content: rawContent.trim() });
      }
    }

    lastIndex = regex.lastIndex;
  }

  // 3. Push remaining text
  if (lastIndex < raw.length) {
    chunks.push({
      type: 'text',
      content: raw.slice(lastIndex),
    });
  }

  return chunks;
}
