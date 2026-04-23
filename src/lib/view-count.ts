export function formatViewCountShort(value: number | null | undefined): string {
  const n = Math.max(0, Math.floor(value ?? 0));
  if (n >= 1000000) return `${Math.floor((n / 1000000) * 10) / 10}M`;
  if (n >= 1000) return `${Math.floor((n / 1000) * 10) / 10}K`;
  return `${n}`;
}
