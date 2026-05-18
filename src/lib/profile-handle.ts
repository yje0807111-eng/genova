export function profileHandle(displayName: string, id: string): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
  if (slug.length >= 2) return slug.slice(0, 32);
  return `user_${id.replace(/-/g, "").slice(0, 8)}`;
}

/** 사용자가 직접 입력하는 아이디 규칙: 영소문자/숫자/언더스코어 3~20자. */
export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

/** 입력값을 핸들 형식으로 정규화(소문자·공백제거·허용문자만). */
export function normalizeHandleInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

export function isValidHandle(value: string): boolean {
  return HANDLE_PATTERN.test(value);
}
