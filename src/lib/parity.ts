// Compare semantic text, not differences in smart punctuation or the two known
// legacy Markdown parser quirks. Content files themselves remain byte-identical.
export function normalizeLegacyText(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\|/g, " ")
    .replace(/like \*?looking up\*{0,2}/g, "like looking up")
    .replace(/https:\/\/hackerone.comjontsai/g, "https://hackerone.com/jontsai")
    .replace(/\s+/g, " ")
    .trim();
}
