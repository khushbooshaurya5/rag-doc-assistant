/** Split text into ~maxChars chunks on sentence/whitespace boundaries. */
export function chunkText(text: string, maxChars = 1000, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + maxChars, clean.length);
    if (end < clean.length) {
      const dot = clean.lastIndexOf(". ", end);
      if (dot > i + maxChars * 0.5) end = dot + 1;
    }
    chunks.push(clean.slice(i, end).trim());
    if (end >= clean.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks.filter(Boolean);
}
