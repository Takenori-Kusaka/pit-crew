import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readSigningKey, sign, verify } from '../src/hooks/signing.js';

describe('readSigningKey', () => {
  test('reads the key from the environment', () => {
    assert.equal(readSigningKey({ HOOK_SIGNING_KEY: ' k-2041 ' }), 'k-2041');
  });
  test('no key set: there is no key', () => {
    assert.equal(readSigningKey({}), null);
  });
});

describe('signatures', () => {
  test('a body signed with the key is accepted', () => {
    assert.equal(verify('{"id":1}', sign('{"id":1}', 'k-2041'), 'k-2041'), true);
  });
  test('a body signed with another key is refused', () => {
    assert.equal(verify('{"id":1}', sign('{"id":1}', 'other'), 'k-2041'), false);
  });
  test('without a key nothing is accepted', () => {
    assert.equal(verify('{"id":1}', sign('{"id":1}', 'k-2041'), null), false);
  });
});
