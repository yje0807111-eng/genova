/** Vimeo URL에서 숫자 ID만 추출 */
export function extractVimeoId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return s;
  const patterns = [
    /vimeo\.com\/(?:video\/)?(\d+)/i,
    /player\.vimeo\.com\/video\/(\d+)/i,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}
