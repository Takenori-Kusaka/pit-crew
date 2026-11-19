import { total } from './cart.js';

// Invoices for wholesale orders (#7). The amount due is the cart total as it is:
// wholesale customers order from a printed price list that follows the same rules —
// list price below 10 lines, 5% off from 10 lines, half a yen rounded up.
export function invoice(customer, items) {
  return { customer, due: total(items) };
}
