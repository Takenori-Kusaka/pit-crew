import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSigningKeyConfigured, readSigningKey, sign, verify } from '../src/hooks/signing.js';

describe('readSigningKey', () => {
  test('reads the key from the environment', () => {
    assert.equal(readSigningKey({ HOOK_SIGNING_KEY: ' k-2041 ' }), 'k-2041');
  });
  test('no key set: there is no key', () => {
    assert.equal(readSigningKey({}), null);
  });
});

describe('assertSigningKeyConfigured', () => {
  test('production without a key: the start stops', () => {
    assert.throws(() => assertSigningKeyConfigured({ NODE_ENV: 'production' }), /HOOK_SIGNING_KEY is required/);
  });
  test('production with a v1: key: the start stops', () => {
    assert.throws(() => assertSigningKeyConfigured({ NODE_ENV: 'production', HOOK_SIGNING_KEY: 'v1:abc' }), /not accepted/);
  });
  test('production with a key: the key is returned', () => {
    assert.equal(assertSigningKeyConfigured({ NODE_ENV: 'production', HOOK_SIGNING_KEY: 'k-2041' }), 'k-2041');
  });
  test('development without a key: it starts, with no key', () => {
    assert.equal(assertSigningKeyConfigured({ NODE_ENV: 'development' }), null);
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
