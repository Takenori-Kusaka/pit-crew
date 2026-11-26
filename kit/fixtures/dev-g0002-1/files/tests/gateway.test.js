import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxGateway } from '../src/gateway.js';

test('the sandbox keeps every charge', async () => {
  const gateway = createSandboxGateway({ delayMs: 0 });
  await gateway.charge('o-1', 500);
  const second = await gateway.charge('o-2', 700);
  assert.deepEqual(second, { id: 'ch_2', orderId: 'o-2', amount: 700 });
  assert.equal(gateway.charges.length, 2);
});
