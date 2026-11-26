import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPayButton } from '../../src/ui/pay-button.js';

test('a click takes the payment and shows the receipt number', async () => {
  const shown = [];
  const button = createPayButton({
    capture: async (order) => ({ id: 'ch_1', orderId: order.id, amount: order.total }),
    order: { id: 'o-1', total: 1200 },
    show: (text) => shown.push(text),
  });
  await button.click();
  assert.deepEqual(shown, ['Paid: ch_1']);
});
