import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCapture } from '../src/pay.js';
import { createSandboxGateway } from '../src/gateway.js';

test('an order is charged and marked paid', async () => {
  const gateway = createSandboxGateway();
  const capture = createCapture(gateway);
  const order = { id: 'o-1', total: 1200 };
  const receipt = await capture(order);
  assert.equal(order.paid, true);
  assert.equal(receipt.amount, 1200);
  assert.equal(gateway.charges.length, 1);
});

test('a paid order is not charged again', async () => {
  const gateway = createSandboxGateway();
  const capture = createCapture(gateway);
  const order = { id: 'o-2', total: 800 };
  await capture(order);
  await capture(order);
  assert.equal(gateway.charges.length, 1);
});
