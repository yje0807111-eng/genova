export function formatPrizeWithConversion(
  prizeKo: string | null | undefined,
  prizeEn: string | null | undefined,
  prizeJa: string | null | undefined,
  prizeFallback: string,
  locale: string,
  baseCurrency: string | null | undefined,
  usdToKrw: number,
  usdToJpy: number,
): string {
  const usdToKrwRate = usdToKrw || 1350;
  const usdToJpyRate = usdToJpy || 148;
  const krwToUsd = 1 / usdToKrwRate;
  const krwToJpy = usdToJpyRate / usdToKrwRate;
  const jpyToUsd = 1 / usdToJpyRate;
  const jpyToKrw = usdToKrwRate / usdToJpyRate;
  const base = baseCurrency ?? "USD";

  const extractAmount = (text: string): number | null => {
    const match = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!match) return null;
    const n = parseFloat(match[0]);
    return isNaN(n) ? null : n;
  };

  const formatKRW = (n: number) => `₩${Math.round(n).toLocaleString()}`;
  const formatUSD = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const formatJPY = (n: number) => `¥${Math.round(n).toLocaleString()}`;

  if (locale === "ko") {
    const text = prizeKo || prizeEn || prizeFallback;
    const amount = extractAmount(text);
    if (!amount) return text;
    if (base === "USD") return `${formatUSD(amount)} (약 ${formatKRW(amount * usdToKrwRate)})`;
    if (base === "JPY") return `${formatJPY(amount)} (약 ${formatKRW(amount * jpyToKrw)})`;
    return formatKRW(amount);
  }

  if (locale === "ja") {
    const text = prizeJa || prizeEn || prizeFallback;
    const amount = extractAmount(text);
    if (!amount) return text;
    if (base === "USD") return `${formatUSD(amount)} (約 ${formatJPY(amount * usdToJpyRate)})`;
    if (base === "KRW") return `${formatKRW(amount)} (約 ${formatJPY(amount * krwToJpy)})`;
    return formatJPY(amount);
  }

  // en
  const text = prizeEn || prizeKo || prizeFallback;
  const amount = extractAmount(text);
  if (!amount) return text;
  if (base === "KRW") return `${formatKRW(amount)} (≈ ${formatUSD(amount * krwToUsd)})`;
  if (base === "JPY") return `${formatJPY(amount)} (≈ ${formatUSD(amount * jpyToUsd)})`;
  return formatUSD(amount);
}
