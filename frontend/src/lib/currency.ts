/**
 * Fixed ZP -> VND display rate (informational only — VND is never an actual payment
 * currency, ZP/ZTARO checkout amounts are unaffected). Rate: 1 ZP = 1 VND, matching product
 * pricing's fixed peg (ztaro-pricing.service.ts's USDT_TO_ZP_RATE). This is intentionally
 * unrelated to the live USD/VND rate used for USDT deposit/withdrawal charging
 * (wallet.service.ts's fetchUsdVndRate) — product prices stay fixed regardless of that rate.
 */
export const VND_PER_10000_ZP = 10000;

export function zpToVnd(priceAp: number): number {
  return Math.round((priceAp * VND_PER_10000_ZP) / 10000);
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

export const ZP_VND_RATE_LABEL = `1 ZP = 1 VND`;
