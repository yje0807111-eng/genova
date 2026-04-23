export const MAX_VIDEO_TAGS = 5;

/** 쉼표로 구분, # 접두 허용 → 고유 태그 문자열 배열 (최대 5) */
export function parseHashtagTagInput(raw: string): string[] {
  const segments = raw.split(/[,，]/);
  const out: string[] = [];
  for (const seg of segments) {
    let s = seg.trim();
    if (!s) continue;
    if (s.startsWith("#")) s = s.slice(1).trim();
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
    if (out.length >= MAX_VIDEO_TAGS) break;
  }
  return out;
}
