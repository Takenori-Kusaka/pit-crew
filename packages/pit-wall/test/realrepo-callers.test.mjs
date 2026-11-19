// Caller registration for R2 (plan 34 §9 instrument 7): changed symbols -> importing
// implementation files, the three cap variants, and "opened" read from tool calls in any form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedSymbols, declarations, hunkRanges, importersOf, imports, openedCallers, r2Level, registerCallers, resolveSpec } from '../src/realrepo/callers.mjs';
import { rec } from './process-helpers.mjs';

const MOD = `import { z } from './z';

const RATE = 0.9;

// Member price.
export function price(n: number) {
  return round(n * RATE);
}

function round(n: number) {
  return Math.floor(n);
}

export const label = (n: number) => \`\${n} yen\`;

export class Cart {
  total() { return 0; }
}
`;

test('declarations and the hunks of a diff are placed by line', () => {
  const d = declarations(MOD);
  assert.deepEqual(d.map((x) => [x.name, x.exported, x.from, x.to]), [['RATE', false, 3, 4], ['price', true, 5, 9], ['round', false, 10, 13], ['label', true, 14, 15], ['Cart', true, 16, 19]]);
  assert.deepEqual(hunkRanges('@@ -7 +7 @@\n-a\n+b\n@@ -10,3 +10,4 @@\n@@ -20,0 +22,2 @@\n'), [{ from: 7, to: 7 }, { from: 10, to: 12 }, { from: 20, to: 21 }]);
});

test('changed symbols: the touched export, the exports that use a touched internal, all when unplaced', () => {
  assert.deepEqual(changedSymbols(MOD, [{ from: 7, to: 7 }]).symbols, ['price']);
  assert.deepEqual(changedSymbols(MOD, [{ from: 11, to: 11 }]).symbols, ['price']); // round is internal; price uses it
  assert.deepEqual(changedSymbols(MOD, [{ from: 3, to: 3 }]).symbols, ['price']); // RATE -> price
  assert.deepEqual(changedSymbols(MOD, [{ from: 14, to: 14 }]).symbols, ['label']);
  const wide = changedSymbols(MOD, [{ from: 1, to: 1 }]); // the import line: no declaration
  assert.deepEqual([wide.symbols, wide.wide], [['Cart', 'label', 'price'], true]);
  assert.deepEqual(changedSymbols('const a = 1;\nconst b = 2;\nexport { a, b as bee };\n', [{ from: 2, to: 2 }]).symbols, ['bee']);
});

test('imports are read in their forms and resolved to files of the tree', () => {
  const i = imports(`import def, { a, b as c } from './m';\nimport type { T } from "$lib/t";\nimport * as ns from '../n.js';\nexport * from './bar';\nexport { x as y } from './bar';\nconst l = await import('./lazy');\nimport 'side';\n`);
  assert.deepEqual(i.map((x) => [x.spec, x.names.map((n) => `${n.imported}>${n.local}`).join(','), x.namespace, x.def, x.star, x.reexport, x.dynamic]), [
    ['./m', 'a>a,b>c', null, 'def', false, false, false], ['$lib/t', 'T>T', null, null, false, false, false], ['../n.js', '', 'ns', null, false, false, false],
    ['./bar', '', null, null, true, true, false], ['./bar', 'x>y', null, null, false, true, false], ['./lazy', '', null, null, false, false, true]]);
  const paths = new Set(['src/lib/a.ts', 'src/lib/dir/index.ts', 'src/lib/n.ts', 'src/routes/p.svelte']);
  assert.equal(resolveSpec('./a', 'src/lib/b.ts', paths), 'src/lib/a.ts');
  assert.equal(resolveSpec('../n.js', 'src/lib/dir/x.ts', paths), 'src/lib/n.ts'); // .js written for a .ts file
  assert.equal(resolveSpec('$lib/dir', 'src/routes/p.svelte', paths), 'src/lib/dir/index.ts');
  assert.equal(resolveSpec('vitest', 'src/lib/b.ts', paths), null);
});

const TREE = {
  'src/lib/price.ts': MOD,
  'src/lib/z.ts': 'export const z = 1;\n',
  'src/lib/quote.ts': "import { price } from './price';\nexport const quote = (n: number) => price(n);\n",
  'src/lib/labels.ts': "import { label } from './price';\nexport const l = label(1);\n", // takes another symbol
  'src/lib/index.ts': "export * from './price';\n", // a barrel
  'src/lib/renamed.ts': "export { price as memberPrice } from './price';\n", // a renaming barrel
  'src/routes/page.svelte': '<script lang="ts">\nimport { price } from "$lib";\n</script>\n{price(1)}\n',
  'src/routes/other.ts': "import { memberPrice } from '$lib/renamed';\nexport const o = memberPrice(2);\n",
  'src/routes/ns.ts': "import * as p from '$lib/price';\nexport const v = p.price(3);\n",
  'src/routes/ns-unused.ts': "import * as p from '$lib/price';\nexport const v = p.label(3);\n",
  'src/routes/mention.ts': '// see src/lib/price.ts and price()\nexport const m = 1;\n', // names the file, imports nothing
  'tests/unit/price.test.ts': "import { price } from '../../src/lib/price';\n",
};

test('importers: files that take a changed symbol, through barrels too; mentions and tests are not callers', () => {
  const files = new Map(Object.entries(TREE));
  const r = importersOf(files, { 'src/lib/price.ts': ['price'] });
  assert.deepEqual(r.callers, ['src/lib/quote.ts', 'src/routes/ns.ts', 'src/routes/other.ts', 'src/routes/page.svelte']);
  assert.deepEqual(r.barrels, ['src/lib/index.ts', 'src/lib/renamed.ts']);
  assert.deepEqual(r.via['src/routes/ns.ts'], ['namespace']);
  assert.deepEqual(importersOf(files, { 'src/lib/price.ts': ['label'] }).callers, ['src/lib/labels.ts', 'src/routes/ns-unused.ts']);
});

test('registration from two commits of a repository', () => {
  const d = mkdtempSync(join(tmpdir(), 'pw-call-'));
  const g = (...a) => { const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', ...a], { cwd: d, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
  g('init', '-q', '.');
  for (const [p, t] of Object.entries(TREE)) { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), t); }
  g('add', '-A'); g('commit', '-q', '-m', 'pre'); const pre = g('rev-parse', 'HEAD');
  writeFileSync(join(d, 'src/lib/price.ts'), MOD.replace('Math.floor(n)', 'Math.round(n)'));
  writeFileSync(join(d, 'src/lib/new.ts'), 'export const n = 1;\n');
  g('add', '-A'); g('commit', '-q', '-m', 'fix'); const ref = g('rev-parse', 'HEAD');
  const r = registerCallers(d, pre, ref, ['src/lib/price.ts', 'src/lib/new.ts']);
  assert.deepEqual(r.callers, ['src/lib/quote.ts', 'src/routes/ns.ts', 'src/routes/other.ts', 'src/routes/page.svelte']);
  assert.deepEqual([r.n, r.newFiles, r.perFile['src/lib/price.ts'].symbols], [4, 1, 1]);
});

test('R2 level: all N registered, the cap only in the level; three variants', () => {
  assert.equal(r2Level(0, 0), null); // nothing to open: not applicable
  assert.deepEqual([r2Level(0, 8, 5), r2Level(1, 8, 5), r2Level(4, 8, 5), r2Level(5, 8, 5), r2Level(8, 8, 5)], [0, 1, 1, 2, 2]);
  assert.deepEqual([r2Level(3, 8, 3), r2Level(3, 8, 5), r2Level(3, 8, Infinity)], [2, 1, 1]);
  assert.deepEqual([r2Level(2, 2, 5), r2Level(1, 2, 5)], [2, 1]); // N below the cap: all of them
});

test('"opened" is read from Read, Grep hits, cat in Bash and text shown by a loop; a listing is not opened', () => {
  const callers = ['src/lib/quote.ts', 'src/routes/ns.ts', 'src/routes/other.ts', 'src/routes/page.svelte', 'src/lib/labels.ts'];
  const texts = Object.fromEntries(callers.map((p) => [p, TREE[p]]));
  const r = rec([
    ['Read', { file_path: '/app/src/lib/quote.ts' }, `     1\t${TREE['src/lib/quote.ts'].replace(/\n/g, '\n     2\t')}`],
    ['Grep', { pattern: 'price', path: 'src/routes', output_mode: 'content' }, 'src/routes/ns.ts:2:export const v = p.price(3);'],
    ['Bash', 'for f in src/routes/o*.ts; do cat "$f"; done', TREE['src/routes/other.ts']],
    ['Bash', 'ls src/routes', 'ns.ts\nother.ts\npage.svelte\n'],
    ['Edit', { file_path: '/app/src/lib/price.ts', old_string: 'Math.floor(n)', new_string: 'Math.round(n)' }, 'ok'],
    ['Bash', 'cat src/lib/labels.ts', TREE['src/lib/labels.ts']], // after the edit: too late
  ]);
  const o = openedCallers(r, callers, { cutoff: 4, texts });
  assert.deepEqual(o.rows.map((x) => [x.path, x.opened]), [['src/lib/quote.ts', true], ['src/routes/ns.ts', true], ['src/routes/other.ts', true], ['src/routes/page.svelte', false], ['src/lib/labels.ts', false]]);
  assert.deepEqual([o.opened, o.n], [3, 5]);
  assert.deepEqual(o.levels, { cap3: 2, cap5: 1, none: 1 });
  assert.equal(openedCallers(r, callers, { texts }).opened, 4); // with no cutoff the late cat counts
  assert.deepEqual(openedCallers(r, [], { texts }).levels, { cap3: null, cap5: null, none: null });
});
