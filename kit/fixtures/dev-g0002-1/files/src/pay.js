// Takes the payment of an order through the gateway. Called by the pay button (src/ui/pay-button.js).
// A second call for the same order while the first is still running gets the first call's promise:
// the button can be pressed twice before the page re-renders, and a customer must never be charged twice.
export function createCapture(gateway) {
  const running = new Map();
  return function capture(order) {
    if (order.paid) return Promise.resolve(order.receipt);
    if (running.has(order.id)) return running.get(order.id);
    const p = gateway
      .charge(order.id, order.total)
      .then((receipt) => {
        order.paid = true;
        order.receipt = receipt;
        return receipt;
      })
      .finally(() => running.delete(order.id));
    running.set(order.id, p);
    return p;
  };
}
