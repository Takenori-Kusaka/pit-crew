// Boundary fitness test: L1/L2 (this package) must not know about any harness.
// If this fails, harness-specific knowledge leaked into the framework; move it to a suite (L3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FORBIDDEN = [
  /pit-crew/i,                 // the harness this repo ships
  /ganbari/i,                  // the project the harness came from
  /needs-(tech|po|dev|qm)/,    // a specific harness's label vocabulary
  /\.\.\/\.\.\/(suites|plugins)\//, // imports reaching into L3 or subjects
];

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'test') return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

test('framework source contains no harness-specific knowledge', () => {
  const leaks = [];
  for (const f of files(ROOT)) {
    const text = readFileSync(f, 'utf8');
    for (const re of FORBIDDEN) if (re.test(text)) leaks.push(`${f.replace(ROOT, '')}: ${re}`);
  }
  assert.deepEqual(leaks, []);
});

// Editing through scripts once left raw NUL bytes in a source file: still valid JS,
// but git treated the file as binary, so its diffs went unreviewed.
test('framework source is plain text (no control characters, no CR)', () => {
  const bad = [];
  for (const f of files(ROOT)) {
    const b = readFileSync(f);
    if (b.some((x) => x < 9 || (x > 10 && x < 32) || x === 13)) bad.push(f.replace(ROOT, ''));
  }
  assert.deepEqual(bad, []);
});
