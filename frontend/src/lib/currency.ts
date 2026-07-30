/**
 * Fixed ZP -> VND display rate (informational only — VND is never an actual payment
 * currency, ZP/ZTARO checkout amounts are unaffected). Rate: 10,000 ZP = 26,300 VND.
 */
export const VND_PER_10000_ZP = 26300;

export function zpToVnd(priceAp: number): number {
  return Math.round((priceAp * VND_PER_10000_ZP) / 10000);
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

export const ZP_VND_RATE_LABEL = `10,000 ZP = ${VND_PER_10000_ZP.toLocaleString()} VND`;
