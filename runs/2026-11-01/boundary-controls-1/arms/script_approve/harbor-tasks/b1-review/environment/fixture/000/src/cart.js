// Cart total in cents. `discount` is the customer's discount rate (0.1 = 10%).
export function total(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return Math.round(subtotal * (1 - discount));
}
