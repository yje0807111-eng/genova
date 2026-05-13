export function profileHandle(displayName: string, id: string): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
  if (slug.length >= 2) return slug.slice(0, 32);
  return `user_${id.replace(/-/g, "").slice(0, 8)}`;
}
