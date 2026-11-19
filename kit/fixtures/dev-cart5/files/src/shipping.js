// Shipping fee in yen for a cart total.
export function shippingFee(total) {
  return total >= 5000 ? 0 : 500;
}
