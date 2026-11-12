// The guard for owner decision 3 (plan 34 §9 instrument 9): a tracked file that carries the
// subject repository's lines stops the check; pointers, hashes and this repository's own lines do not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findHits, keysOf, lineKey, pointerCommits, scanRepo, subjectHashes } from '../src/realrepo/gq-content.mjs';

const CLI = fileURLToPath(new URL('../src/gates.mjs', import.meta.url));
const g = (cwd, ...a) => { const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...a], { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
const put = (root, files) => { for (const [p, t] of Object.entries(files)) { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); } };
const SUBJECT_LINE = 'export function memberPriceInCents(amount: number): number {';
const SHARED_LINE = "import assert from 'node:assert/strict';";
const ISSUE_LINE = 'The member price is rounded up instead of down when the amount ends in 5.';

function setup() {
  const subject = mkdtempSync(join(tmpdir(), 'pw-gqs-'));
  g(subject, 'init', '-q', '.');
  put(subject, { 'src/price.ts': `${SHARED_LINE}\n${SUBJECT_LINE}\n  return 1;\n}\n`, 'img.bin': Buffer.from([0, 1, 2, 3]) });
  g(subject, 'add', '-A'); g(subject, 'commit', '-q', '-m', 'c1');
  const c1 = g(subject, 'rev-parse', 'HEAD');
  const texts = mkdtempSync(join(tmpdir(), 'pw-gqt-'));
  put(texts, { 't1/instruction.md': `# Bug\n${ISSUE_LINE}\n` });
  const repo = mkdtempSync(join(tmpdir(), 'pw-gqr-'));
  g(repo, 'init', '-q', '.');
  put(repo, { 'packages/a.mjs': `${SHARED_LINE}\nexport const mine = 'a line of this repository, long enough to count';\n`, 'docs/plan.md': 'plan\n', '.gitignore': 'local/\n' });
  g(repo, 'add', '-A'); g(repo, 'commit', '-q', '-m', 'base');
  return { subject, c1, texts, repo, base: g(repo, 'rev-parse', 'HEAD') };
}
const scan = (s, extra = {}) => scanRepo({ repo: s.repo, subjectKeys: subjectHashes({ subject: s.subject, commits: [s.c1], texts: s.texts }).keys, base: s.base, ...extra });

test('a line counts from 30 characters without whitespace, whatever its spacing', () => {
  assert.equal(lineKey('const a = 1;'), null);
  assert.equal(lineKey('x'.repeat(29)), null);
  assert.ok(lineKey('x'.repeat(30)));
  assert.equal(lineKey(`  ${SUBJECT_LINE}  `), lineKey(SUBJECT_LINE.replace(/ /g, '\t ')));
  assert.equal(keysOf(`${SUBJECT_LINE}\nshort\n${SHARED_LINE}`).size, 2);
});

test('pointers pass; a copied source line, test line or issue sentence stops, in new and in modified files', () => {
  const s = setup();
  put(s.repo, { 'experiments/task.json': JSON.stringify({ repo: 'o/r', prefix_commit: s.c1, hidden_checks: ['tests/unit/price.test.ts'], sha256: 'a'.repeat(64) }, null, 1), 'packages/b.mjs': `${SHARED_LINE}\nexport const b = 'another line of this repository, long enough';\n` });
  assert.deepEqual(scan(s).hits, []); // pointers and a line this repository already had
  put(s.repo, { 'experiments/leak.md': `as the source says:\n    ${SUBJECT_LINE}\n` });
  put(s.repo, { 'docs/plan.md': `plan\n${ISSUE_LINE}\n` }); // a tracked file, modified
  const r = scan(s);
  assert.deepEqual(r.hits.map((h) => [h.path, h.line]).sort(), [['docs/plan.md', 2], ['experiments/leak.md', 2]]);
  assert.equal(JSON.stringify(r.hits).includes('memberPrice'), false); // the report carries positions and hashes, not text
  // The allow list (hashes, reviewed) lets a generic line through.
  assert.deepEqual(scan(s, { allow: new Set([lineKey(SUBJECT_LINE), lineKey(ISSUE_LINE)]) }).hits, []);
});

test('ignored paths are not scanned; --all covers files outside the change', () => {
  const s = setup();
  put(s.repo, { 'local/exp/tree/src/price.ts': `${SUBJECT_LINE}\n` }); // git-ignored: the place for the content
  assert.deepEqual(scan(s).hits, []);
  put(s.repo, { 'old/copied.ts': `${SUBJECT_LINE}\n` });
  g(s.repo, 'add', '-A'); g(s.repo, 'commit', '-q', '-m', 'leak committed');
  const head = g(s.repo, 'rev-parse', 'HEAD');
  assert.deepEqual(scanRepo({ repo: s.repo, subjectKeys: subjectHashes({ subject: s.subject, commits: [s.c1] }).keys, base: head }).hits, []); // nothing changed since
  assert.deepEqual(scanRepo({ repo: s.repo, subjectKeys: subjectHashes({ subject: s.subject, commits: [s.c1] }).keys, base: s.base, all: true }).hits.map((h) => h.path), ['old/copied.ts']);
});

test('CLI: exit 0 clean, 1 on a hit, 1 when the clone is missing (cannot check is not a pass)', () => {
  const s = setup();
  put(s.repo, { 'experiments/exp48/no-gq-content.json': JSON.stringify({ base: s.base, subject: s.subject, texts: s.texts, commits: [s.c1], pointers: 'experiments/exp48', allow: [] }) });
  const run = (...a) => spawnSync(process.execPath, [CLI, 'no-gq-content', '--repo', s.repo, ...a], { encoding: 'utf8' });
  assert.equal(run().status, 0, run().stdout + run().stderr);
  assert.match(run().stdout, /no-gq-content: ok/);
  put(s.repo, { 'experiments/exp48/note.md': `${ISSUE_LINE}\n` });
  const bad = run();
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /experiments\/exp48\/note\.md: 1 line/);
  assert.equal(bad.stdout.includes('rounded up'), false);
  // An allow entry counts only once a reviewer has signed it.
  const cfgFile = join(s.repo, 'experiments/exp48/no-gq-content.json');
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  writeFileSync(cfgFile, JSON.stringify({ ...cfg, allow: [{ key: lineKey(ISSUE_LINE), reason: 'x', reviewed_by: null }] }));
  assert.equal(run().status, 1);
  assert.match(run().stdout, /proposed but not reviewed/);
  writeFileSync(cfgFile, JSON.stringify({ ...cfg, allow: [{ key: lineKey(ISSUE_LINE), reason: 'x', reviewed_by: 'reviewer' }] }));
  assert.equal(run().status, 0);
  assert.equal(run('--subject', join(s.subject, 'nowhere')).status, 1);
  assert.match(run('--subject', join(s.subject, 'nowhere')).stdout, /cannot check/);
});

test('commit ids in pointer files are picked up, so their trees are compared too', () => {
  const d = mkdtempSync(join(tmpdir(), 'pw-ptr-'));
  put(d, { 'tasks/a.json': JSON.stringify({ prefix_commit: 'a'.repeat(40), reference_commit: 'b'.repeat(40), other: 'c'.repeat(40) }) });
  assert.deepEqual(pointerCommits(d).sort(), ['a'.repeat(40), 'b'.repeat(40)]);
  assert.deepEqual(findHits('short\n', new Set(['x'])), []);
});
