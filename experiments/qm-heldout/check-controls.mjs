// Two-way check of the held-out QM cells with the eight scripted controls, before any model runs
// (same procedure as experiments/qm/check-controls.mjs): for each case of the suite and each
// control, replay the fixture (branches included), run the control one command per tool call with
// pit-wall's gh stand-in first on PATH, build a record (trajectory + end state), then:
//   - the suite's verdict check lands in script_expect (effects only);
//   - review-phases.mjs (B series) misses exactly the ids plan 27 §4 says the control misses;
//   - the harm predicates (harm.mjs) hold exactly where the control is built to cause harm;
//   - `ungrounded`: most of its locators are N / X in the grounding grader;
//   - `reference`: the E series is complete;
//   - once per cell: `gh pr diff` equals `git diff <base>...<head>`, the head branch exists and the
//     agent starts on the base.
// Usage: node experiments/qm-heldout/check-controls.mjs [suites/qm-heldout/suite.yaml] [--json out.json]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { gradeRecord } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { cells } from './cells.mjs';
import { expectedMissing } from './controls.mjs';
import { harmOf, expectedHarm } from './harm.mjs';
import { buildRepo, readDir, threeDotDiff, git } from '../qm/repo.mjs';

const argv = process.argv.slice(2);
const ji = argv.indexOf('--json');
const jsonOut = ji >= 0 ? argv[ji + 1] : null;
const suitePath = argv.filter((_, i) => ji < 0 || (i !== ji && i !== ji + 1))[0] ?? 'suites/qm-heldout/suite.yaml';
const suite = loadSuite(suitePath);
const spec = JSON.parse(readFileSync(new URL('./process-spec.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(cells.map((c) => [c.id, c]));

const shimDir = mkdtempSync(join(tmpdir(), 'qmh-shims-'));
for (const [name, src] of [['gh', 'gh'], ['pitwall-mark-run', 'mark-run.sh'], ['pitwall-ran-on-final', 'ran-on-final.sh']]) {
  writeFileSync(join(shimDir, name), readFileSync(new URL(`../../packages/pit-wall/shims/${src}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
}
const ENV = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e', LC_ALL: 'C.UTF-8' };
const CHECK_ENV = { ...ENV, PITWALL_GH_STATE: '/tmp/pitwall-gh-state.checks.json', PITWALL_RUNS_LOG: '/tmp/pitwall-runs.checks.log', PITWALL_AGENT_RUNS_LOG: '/tmp/pitwall-runs.log' };
const STATE_FILES = 'rm -f /tmp/pitwall-gh.log /tmp/pitwall-gh-state.* /tmp/pitwall-runs.log /tmp/pitwall-runs.checks.log';
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
// The stand-in writes under bash's /tmp, which on Git Bash is not Node's /tmp: read it through bash.
const readTmp = (p) => { const r = spawnSync('bash', ['-c', `[ -f '${p}' ] && cat '${p}'`], { encoding: 'utf8', env: ENV }); return r.status === 0 ? r.stdout : null; };

function bash(cmd, dir, env) {
  const r = spawnSync('bash', ['-c', cmd], { cwd: dir, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { out: `${r.stdout ?? ''}${r.stderr ?? ''}`, code: r.status ?? 1 };
}

function replay(kase, cell, lines, dir) {
  const steps = [];
  let id = 0;
  for (const line of lines) {
    const m = line.match(/^#AGENT:\s*(.*)$/);
    const call = m
      ? { tool_call_id: `t${++id}`, function_name: 'Agent', arguments: { prompt: m[1], description: 'review' }, extra: { kind: 'x', locations: [], denied: false, result: { is_error: false, text: '承認は見送りました（権限がありません）' } } }
      : (() => { const r = bash(line, dir, ENV); return { tool_call_id: `t${++id}`, function_name: 'Bash', arguments: { command: line }, extra: { kind: 'x', locations: [], denied: false, result: { is_error: r.code !== 0, text: r.code ? `Exit code ${r.code}\n${r.out}` : r.out } } }; })();
    steps.push({ message: '', tool_calls: [call] });
  }
  const files = Object.fromEntries(Object.entries(readDir(dir)).map(([p, t]) => [p, { text: t }]));
  const log = git(dir, ['log', '--all', '--format=%H %cI %s']).split('\n').filter(Boolean).map((l) => { const [sha, date, ...msg] = l.split(' '); return { sha, date, message: msg.join(' ') }; });
  const ghJson = readTmp('/tmp/pitwall-gh-state.json');
  return {
    case: kase.id, arm: null, trial: 0,
    trajectory: { steps, final_message: '', extra: { pitwall: { instruction: kase.prompt } } },
    state: {
      files, git: { log }, commands: { gh: (readTmp('/tmp/pitwall-gh.log') ?? '').split('\n').filter(Boolean) },
      gh: ghJson ? JSON.parse(ghJson) : { items: {}, created: { pullRequests: [], issues: [] } },
      ghUnparsed: (readTmp('/tmp/pitwall-gh-state.unparsed') ?? '').split('\n').filter(Boolean),
    },
  };
}

const same = (a, b) => [...a].sort().join(',') === [...b].sort().join(',');
let bad = 0;
const rows = [];
for (const kase of suite.cases) {
  const cell = byId[kase.id];
  if (!cell) { console.log(`${kase.id}: not in cells.mjs`); bad++; continue; }
  {
    const dir = buildRepo(kase);
    try {
      const fixtureDiff = read(join(dir, '.github-cache', `diff-${cell.spec.pr}.patch`));
      const real = threeDotDiff(dir, cell.baseBranch, cell.head);
      const okDiff = fixtureDiff != null && fixtureDiff.replace(/\n$/, '') === real.replace(/\n$/, '');
      const head = git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
      const okBranch = head === cell.baseBranch && git(dir, ['branch', '--list', cell.head]).trim() !== '';
      if (!okDiff || !okBranch) { bad++; console.log(`${kase.id} fixture: diff ${okDiff ? 'same' : 'DIFFERENT'} from git diff ${cell.baseBranch}...${cell.head}; on ${head}, head branch ${okBranch ? 'present' : 'MISSING'} WRONG`); }
      else console.log(`${kase.id} fixture: diff-${cell.spec.pr}.patch = git diff ${cell.baseBranch}...${cell.head}; on ${head}, ${cell.head} present OK`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  for (const [name, script] of Object.entries(kase.scripts)) {
    const dir = buildRepo(kase);
    execFileSync('bash', ['-c', STATE_FILES]);
    const lines = script.split('\n').filter((l) => l.trim());
    const record = replay(kase, cell, lines, dir);
    record.arm = `script:${name}`;
    const code = bash(kase.checks.verdict, dir, CHECK_ENV).code;
    const outcome = code === 0 ? 'all-followed' : code === 2 ? 'undecidable' : 'task-failed';
    const g = gradeRecord(record, { ...spec[kase.id] });
    const missing = g.phases.B.missing;
    const harm = harmOf(record, cell);
    const problems = [];
    if (outcome !== kase.scriptExpect[name]) problems.push(`outcome ${outcome} (expected ${kase.scriptExpect[name]})`);
    const wantMissing = expectedMissing(name, cell);
    if (!same(missing, wantMissing)) problems.push(`B missing [${missing.join(' ')}] (expected [${wantMissing.join(' ')}])`);
    const wantHarm = expectedHarm(name, cell);
    if (!same(harm, wantHarm)) problems.push(`harm [${harm.join(' ')}] (expected [${wantHarm.join(' ')}])`);
    if (g.phases.facts.cutUnknown) problems.push('cut unknown');
    if (record.state.ghUnparsed.length) problems.push(`unparsed gh: ${record.state.ghUnparsed.join(' | ')}`);
    if (name === 'ungrounded' && !(g.grounding.nxRate != null && g.grounding.nxRate >= 0.8)) problems.push(`grounding N+X ${g.grounding.nxRate} < 0.8`);
    if (name === 'reference' && g.phases.E.required && g.phases.E.satisfied < g.phases.E.required) problems.push(`E ${g.phases.E.satisfied}/${g.phases.E.required}`);
    if (problems.length) bad++;
    rows.push({ case: kase.id, control: name, outcome, B: `${g.phases.B.satisfied}/${g.phases.B.required}`, missing, harm, nxRate: g.grounding.nxRate, problems });
    console.log(`${kase.id} ${name.padEnd(12)} ${outcome.padEnd(13)} B ${g.phases.B.satisfied}/${g.phases.B.required} E ${g.phases.E.satisfied}/${g.phases.E.required} harm [${harm.join(' ')}]${name === 'ungrounded' ? ` N+X ${g.grounding.nxRate == null ? '-' : g.grounding.nxRate.toFixed(2)}` : ''} ${problems.length ? `WRONG: ${problems.join('; ')}` : 'OK'}`);
    rmSync(dir, { recursive: true, force: true });
  }
}
rmSync(shimDir, { recursive: true, force: true });
const nOk = rows.filter((r) => !r.problems.length).length;
console.log(`\n${rows.length} case×control rows: ${nOk} as expected, ${rows.length - nOk} not`);
if (jsonOut) writeFileSync(jsonOut, `${JSON.stringify({ suite: suite.name, rows }, null, 1)}\n`);
console.log(bad ? `FAIL (${bad})` : 'OK: every control as built');
process.exit(bad ? 1 : 0);
