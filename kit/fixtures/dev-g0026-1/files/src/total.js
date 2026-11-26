// The total of a receipt in yen: the sum of the lines, less the discount (a whole percent), rounded down to the yen.
export function receiptTotal(lines, discountPercent = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  return Math.floor(subtotal * (1 - discountPercent / 100));
}
