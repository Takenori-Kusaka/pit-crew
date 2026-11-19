// Shipping fee in yen for one order.
// Orders of FREE_FROM yen or more ship free; below that, the fee depends on the region.
export const FREE_FROM = 5000;

const FEES = { near: 600, far: 900, island: 1500 };

export function shippingFee(subtotal, region) {
  if (!(region in FEES)) throw new Error(`unknown region: ${region}`);
  if (subtotal > FREE_FROM) return 0;
  return FEES[region];
}
