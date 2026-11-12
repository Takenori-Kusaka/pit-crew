// The cells' substance, checked by running the code (no control, no grader):
//   1. the fixture: the agent starts on develop, the PR's head branch exists, and
//      .github-cache/diff-N.patch (from the suite) equals `git diff develop...<head>`;
//   2. on the head: `bash tools/lint` passes and `bash tools/check` fails with exactly the failure the
//      cell registers (one spec file, or the base guard for the (g) cells);
//   3. on the head: every finding to fix shows its defect (probe fails) and every finding to reject
//      has its evidence (probe holds);
//   4. with the reference fixes applied (all findings to fix, nothing else): both required checks
//      pass, every probe holds, and no policy file changed;
//   5. each fix alone changes only the files it registers (`touches`).
// Usage (bash on PATH): node experiments/fix/check-heads.mjs [--only fx-a1,fx-b2]
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cells, POLICY } from './cells.mjs';
import { PROBE_HELPERS } from './checks.mjs';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { buildRepo, git, threeDotDiff } from '../qm/repo.mjs';

const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);
const suite = loadSuite('suites/fix/suite.yaml');
const byId = Object.fromEntries(suite.cases.map((k) => [k.id, k]));
const ENV = { ...process.env, LC_ALL: 'C.UTF-8', GIT_CONFIG_COUNT: '3', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'false', GIT_CONFIG_KEY_1: 'commit.gpgsign', GIT_CONFIG_VALUE_1: 'false', GIT_CONFIG_KEY_2: 'core.fileMode', GIT_CONFIG_VALUE_2: 'false', GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
const sh = (dir, cmd, env = {}) => { const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', env: { ...ENV, ...env } }); return { code: r.status, out: `${r.stdout}${r.stderr}` }; };
const probe = (dir, f, env) => sh(dir, `${PROBE_HELPERS}\n{ ${f.probe}; } >/dev/null 2>&1`, env).code === 0;

let bad = 0;
const fail = (id, msg) => { bad++; console.log(`${id} WRONG: ${msg}`); };
for (const c of cells) {
  if (only.length && !only.includes(c.id)) continue;
  const kase = byId[c.id];
  if (!kase) { fail(c.id, 'not in suites/fix/suite.yaml (run gen-fix.mjs)'); continue; }
  const dir = buildRepo(kase);
  try {
    const notes = [];
    // 1. the fixture
    const start = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    if (start !== c.baseBranch) fail(c.id, `the agent starts on ${start}`);
    if (!git(dir, ['branch', '--list', c.head]).trim()) fail(c.id, `no branch ${c.head}`);
    const fixtureDiff = readFileSync(join(dir, '.github-cache', `diff-${c.pr}.patch`), 'utf8');
    if (fixtureDiff.replace(/\n$/, '') !== threeDotDiff(dir, c.baseBranch, c.head).replace(/\n$/, '')) fail(c.id, `diff-${c.pr}.patch differs from git diff ${c.baseBranch}...${c.head}`);
    const R = git(dir, ['rev-parse', c.head]).trim();
    const D0 = git(dir, ['rev-parse', c.baseBranch]).trim();
    const env = { R, D0 };
    if (git(dir, ['log', '-1', '--format=%s', c.head]).trim() !== c.received) fail(c.id, 'the head commit is not the registered one');
    if (git(dir, ['log', '-1', '--format=%s', c.baseBranch]).trim() !== c.developTip) fail(c.id, 'the develop tip is not the registered one');
    const stale = sh(dir, `git merge-base --is-ancestor ${c.baseBranch} ${c.head}`).code !== 0;
    if (stale !== c.movedBase) fail(c.id, `develop ${stale ? 'is not' : 'is'} contained in the head`);
    // 2. the checks on the head
    git(dir, ['checkout', '-q', c.head]);
    const lint = sh(dir, 'bash tools/lint');
    if (lint.code !== 0) fail(c.id, `tools/lint fails on the head:\n${lint.out}`);
    const chk = sh(dir, 'bash tools/check');
    const fails = chk.out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.split(' ')[1].replace(/:$/, ''));
    const want = c.movedBase ? ['base'] : [c.silence.file];
    if (chk.code === 0 || fails.join(',') !== want.join(',')) fail(c.id, `tools/check on the head: exit ${chk.code}, FAIL [${fails.join(' ')}] (expected [${want.join(' ')}])\n${chk.out}`);
    // the assertion the silence control deletes is in the failing spec
    if (!c.movedBase && !readFileSync(join(dir, c.silence.file), 'utf8').includes(c.silence.pattern)) fail(c.id, `${c.silence.file} has no line "${c.silence.pattern}"`);
    // 3. the probes on the head
    for (const f of c.findings.filter((x) => x.probe)) {
      const ok = probe(dir, f, env);
      if (f.expect === 'fix' && ok) fail(c.id, `${f.id}: the probe already holds on the head (no defect)`);
      if (f.expect === 'reject' && !ok) fail(c.id, `${f.id}: the evidence does not hold on the head`);
    }
    // 5. each fix alone touches only what it registers (fresh checkout per finding)
    for (const f of c.findings.filter((x) => x.expect === 'fix')) {
      git(dir, ['checkout', '-q', '-f', c.head]); sh(dir, 'git reset -q --hard && git clean -qfd -e var');
      for (const cmd of f.fix) sh(dir, cmd);
      const changed = sh(dir, `git diff --name-only ${R}; git ls-files --others --exclude-standard`).out.split('\n').filter(Boolean).filter((p) => !p.startsWith('var/'));
      // A merge brings develop's files; the finding registers what the fixer writes by hand.
      const mine = f.merge ? changed.filter((p) => f.touches.includes(p)) : changed;
      if ([...mine].sort().join(',') !== [...f.touches].sort().join(',')) fail(c.id, `${f.id}: the fix changes [${mine.join(' ')}], registered [${f.touches.join(' ')}]`);
      if (!f.merge && !probe(dir, f, env)) notes.push(`${f.id} alone does not satisfy its probe (depends on another fix)`);
      sh(dir, `git merge --abort 2>/dev/null; git reset -q --hard ${R}`);
    }
    // 4. all reference fixes
    git(dir, ['checkout', '-q', '-f', c.head]); sh(dir, `git reset -q --hard ${R} && git clean -qfd`);
    const fixes = [...c.findings.filter((x) => x.expect === 'fix')].sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0));
    if (c.conflict) { const m = sh(dir, fixes.find((x) => x.merge).fix[0]); if (m.code === 0) fail(c.id, 'the merge was expected to conflict'); sh(dir, `git merge --abort; git reset -q --hard ${R}`); }
    for (const f of fixes) for (const cmd of f.fix) sh(dir, cmd);
    const chk2 = sh(dir, 'bash tools/check'); const lint2 = sh(dir, 'bash tools/lint');
    if (chk2.code !== 0 || lint2.code !== 0) fail(c.id, `after the reference fixes: tools/check exit ${chk2.code}, tools/lint exit ${lint2.code}\n${chk2.out}${lint2.out}`);
    for (const f of c.findings.filter((x) => x.probe)) if (!probe(dir, f, env)) fail(c.id, `${f.id}: the probe does not hold after the reference fixes`);
    const pol = sh(dir, `git status --porcelain -- ${POLICY.filter((p) => p !== '.claude/').join(' ')}; git diff --name-only ${c.movedBase ? D0 : R} -- ${POLICY.join(' ')}`).out.trim();
    if (pol) fail(c.id, `the reference fixes touch policy files:\n${pol}`);
    console.log(`${c.id.padEnd(6)} head ${c.head}: lint pass, check FAIL [${fails.join(' ')}]; ${c.findings.length} findings (${c.findings.map((f) => f.expect[0]).join('')}); reference fixes -> both checks pass, probes hold${notes.length ? ` | note: ${notes.join('; ')}` : ''}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log(bad ? `FAIL (${bad})` : 'OK: every head as built');
process.exit(bad ? 1 : 0);
