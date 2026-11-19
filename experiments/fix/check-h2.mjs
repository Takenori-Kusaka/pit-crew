// Two-way check of h2-no-weakened-check on a CORRECT fix (the scripted `reference` control), with
// edits to the received spec files that no cell names (they are derived from the files' own lines):
//   harmless rewrites, H2 must NOT hold
//     indent    every line of every received spec file re-indented
//     rename    every received spec file moved to another name
//     split     a line `a; exit $fail` cut in two lines
//     stricter  not generated here (it needs meaning); the sieve's model runs supply those
//   weakenings on fixed code, H2 MUST hold
//     delete(k)  the k-th asserting line (one that sets fail=1) of a received spec file removed
//     defuse(k)  the same line kept, but it can no longer fail (`fail=1` -> `:`)
//   a stated limit, reported and not failed
//     early-exit `exit 0` inserted as the second line (no received line is gone, so H2 does not look)
// A delete / defuse the predicate does not flag is listed as "not seen": either the assertion is
// redundant for every variant the predicate tries (another line or file rejects the same faults) or
// the variants do not reach it. Exit 1 when a harmless rewrite is flagged or the reference itself is.
// Usage: node experiments/fix/check-h2.mjs [--only=fx-a1,fx-b2] [--json=out.json] [--quiet]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { cells } from './cells.mjs';
import { buildRepo, git } from '../qm/repo.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const only = (arg('only') ?? '').split(',').filter(Boolean);
const jsonOut = arg('json');
const quiet = process.argv.includes('--quiet');
const suite = loadSuite('suites/fix/suite.yaml');
const byId = Object.fromEntries(cells.map((c) => [c.id, c]));

const shimDir = mkdtempSync(join(tmpdir(), 'fx-h2-shims-'));
writeFileSync(join(shimDir, 'gh'), readFileSync(new URL('../../packages/pit-wall/shims/gh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
const BASE_ENV = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, LC_ALL: 'C.UTF-8',
  GIT_CONFIG_COUNT: '3', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'false', GIT_CONFIG_KEY_1: 'commit.gpgsign', GIT_CONFIG_VALUE_1: 'false', GIT_CONFIG_KEY_2: 'core.fileMode', GIT_CONFIG_VALUE_2: 'false',
  GIT_AUTHOR_NAME: 'you', GIT_AUTHOR_EMAIL: 'you@example.com', GIT_COMMITTER_NAME: 'you', GIT_COMMITTER_EMAIL: 'you@example.com' };
const bash = (cmd, dir, env) => spawnSync('bash', ['-c', cmd], { cwd: dir, env, encoding: 'utf8', maxBuffer: 64 << 20 });

const rows = [];
let n = 0;
for (const kase of suite.cases) {
  if (only.length && !only.includes(kase.id)) continue;
  const cell = byId[kase.id];
  const dir = buildRepo(kase);
  const gh = `/tmp/fx-h2-${process.pid}-${++n}.json`;
  const env = { ...BASE_ENV, PITWALL_GH_STATE: gh };
  // The reference control, as solve.sh runs it; the PR branch then holds a correct fix.
  bash(kase.scripts.reference, dir, env);
  const base = git(dir, ['rev-parse', cell.head]).trim();
  const R = git(dir, ['log', '--all', '--format=%H%x09%s']).split('\n').find((l) => l.split('\t')[1] === cell.received)?.split('\t')[0];
  const rspecs = git(dir, ['ls-tree', '-r', '--name-only', R, '--', 'spec']).split('\n').filter(Boolean);
  const h2 = (label) => {
    const work = mkdtempSync(join(tmpdir(), 'fx-h2-wt-'));
    const r = bash(kase.checks['h2-no-weakened-check'], dir, { ...env, PITWALL_FX_WORK: work.replace(/\\/g, '/'), PITWALL_FX_STATE: gh.replace(/\.json$/, '.tsv') });
    bash('git worktree prune', dir, env);
    rmSync(work, { recursive: true, force: true });
    bash('git worktree prune', dir, env);
    void label;
    return r.status;
  };
  // One variant: reset the branch to the reference's tip, apply `edit` to the working tree, commit.
  const variant = (kind, what, edit, want) => {
    git(dir, ['checkout', '-q', cell.head]);
    git(dir, ['reset', '-q', '--hard', base]);
    if (edit) { edit(); git(dir, ['add', '-A']); git(dir, ['commit', '-q', '--allow-empty', '-m', `variant: ${kind}`], { GIT_AUTHOR_NAME: 'you', GIT_AUTHOR_EMAIL: 'you@example.com', GIT_COMMITTER_NAME: 'you', GIT_COMMITTER_EMAIL: 'you@example.com' }); }
    const own = bash('bash tools/check >/dev/null 2>&1', dir, env).status === 0;
    const got = h2(kind);
    const row = { case: kase.id, kind, what, want, got, ownChecksPass: own };
    rows.push(row);
    if (!quiet) console.log(`${kase.id} ${kind.padEnd(10)} ${String(what).padEnd(28)} own checks ${own ? 'pass' : 'FAIL'}  h2 ${got}  ${want == null ? '(limit)' : got === want ? 'OK' : want === 1 ? 'not seen' : 'WRONG'}`);
  };
  const read = (f) => readFileSync(join(dir, f), 'utf8');
  const write = (f, t) => writeFileSync(join(dir, f), t);
  variant('reference', '-', null, 0);
  variant('indent', `${rspecs.length} file(s)`, () => { for (const f of rspecs) write(f, read(f).split('\n').map((l, i) => (i === 0 || !l.trim() ? l : `  ${l}`)).join('\n')); }, 0);
  variant('rename', `${rspecs.length} file(s)`, () => { for (const f of rspecs) git(dir, ['mv', f, f.replace(/([^/]+)$/, 'moved-$1')]); }, 0);
  const atBase = (f) => git(dir, ['show', `${base}:${f}`]);
  if (rspecs.some((f) => /; exit \$fail$/m.test(atBase(f)))) variant('split', 'the exit line', () => { for (const f of rspecs) write(f, read(f).replace(/; exit \$fail$/m, '\nexit $fail')); }, 0);
  for (const f of rspecs) {
    const received = git(dir, ['show', `${R}:${f}`]).split('\n');
    const asserting = received.map((l, i) => [l, i]).filter(([l]) => /fail=1/.test(l));
    for (const [line, i] of asserting) {
      // The line as received must still be in the reference's file (the reference only adds lines).
      if (!atBase(f).split('\n').includes(line)) continue;
      const at = `${f.replace(/^spec\//, '')}:${i + 1}`;
      variant('delete', at, () => write(f, read(f).split('\n').filter((l) => l !== line).join('\n')), 1);
      variant('defuse', at, () => write(f, read(f).split('\n').map((l) => (l === line ? l.replace(/fail=1/g, ':') : l)).join('\n')), 1);
    }
    variant('early-exit', f.replace(/^spec\//, ''), () => { const ls = read(f).split('\n'); ls.splice(1, 0, 'exit 0'); write(f, ls.join('\n')); }, null);
  }
  execFileSync('bash', ['-c', `rm -f ${gh.replace(/\.json$/, '')}.*`]);
  rmSync(dir, { recursive: true, force: true });
}
rmSync(shimDir, { recursive: true, force: true });

const of = (k) => rows.filter((r) => r.kind === k);
const harmless = rows.filter((r) => r.want === 0);
const wrong = harmless.filter((r) => r.got !== 0);
const weak = rows.filter((r) => r.want === 1);
const seen = weak.filter((r) => r.got === 1);
console.log(`\nharmless rewrites (reference / indent / rename / split): ${harmless.length - wrong.length}/${harmless.length} not flagged`);
for (const k of ['delete', 'defuse']) console.log(`${k}: ${of(k).filter((r) => r.got === 1).length}/${of(k).length} flagged`);
console.log(`weakenings on fixed code flagged: ${seen.length}/${weak.length}`);
console.log(`early-exit (a stated limit: nothing received is gone): ${of('early-exit').filter((r) => r.got === 1).length}/${of('early-exit').length} flagged`);
const badOwn = rows.filter((r) => r.want === 0 && !r.ownChecksPass);
if (badOwn.length) console.log(`note: ${badOwn.length} harmless variant(s) whose own checks fail (the variant is not a clean rewrite there)`);
if (jsonOut) writeFileSync(jsonOut, `${JSON.stringify({ rows }, null, 1)}\n`);
console.log(wrong.length ? `FAIL (${wrong.length} harmless rewrite(s) flagged)` : 'OK: no harmless rewrite is flagged');
process.exit(wrong.length ? 1 : 0);
