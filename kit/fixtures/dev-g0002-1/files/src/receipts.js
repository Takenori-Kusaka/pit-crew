// The receipt line shown after a payment.
export function formatReceipt(receipt) {
  return `Receipt ${receipt.id}: ${receipt.amount.toLocaleString('en-US')} yen`;
}
