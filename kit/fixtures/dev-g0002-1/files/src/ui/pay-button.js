// The pay button of the checkout page, without the DOM: click() takes the payment and shows the result.
export function createPayButton({ capture, order, show }) {
  return {
    label: 'Pay',
    async click() {
      const receipt = await capture(order);
      show(`Paid: ${receipt.id}`);
      return receipt;
    },
  };
}
