// The payment gateway's sandbox, used in development and in the tests. Every charge is kept in `charges`.
// A charge takes a little time, as the real gateway does.
export function createSandboxGateway({ delayMs = 5 } = {}) {
  const charges = [];
  return {
    charges,
    async charge(orderId, amount) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const receipt = { id: `ch_${charges.length + 1}`, orderId, amount };
      charges.push(receipt);
      return receipt;
    },
  };
}
