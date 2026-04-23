/** DB에 저장된 `runtime` 문자열(예: "12분")에서 분 단위 숫자 추출 */
export function parseRuntimeMinutes(runtime: string): number {
  const m = runtime.match(/(\d+)/);
  if (m) return Math.max(1, parseInt(m[1], 10));
  return 5;
}
