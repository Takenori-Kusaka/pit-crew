// Q1: process conformance (design 23 §3.1, research §2.1-2.2), checked as Declare-style
// constraints over the event table: existence (AtLeastOne) and precedence (x before the first
// y). Extra steps, repeats and loops back are never penalised; only a required step that is
// missing or comes after what it must precede counts (alignment: model moves only).
//
// Steps are judged by function, not by the kind of action: "a failure was observed before
// the fix" is satisfied by a reproduction script, a single test run, or running the program
// (research §2.1, Or). The expected trajectory (T0 / T1 / T2) and the cell facts (is it a bug
// fix, is the base stale) are registered by the evaluator and passed in; the agent's own
// trajectory call never sets the requirements (research §2.1).
//
// Series: B = behaviour (what was opened, run, edited and in what order), deterministic and
// fair to an arm that does not know the rules; E = statements (a plan, a test list, design
// alternatives written anywhere). They are reported separately and never summed (design §2.1).

import { eventTable, fileRole } from './events.mjs';
import { authoredTexts, contentTypes } from './authored.mjs';
import { visibility, seen } from './visibility.mjs';
import { esc } from './paths.mjs';

// Failure in a run's output. Upper-case FAIL is a test-runner word; lower-case "fail" alone is
// not matched because catted test scripts contain `fail=0` / `fail=1`.
const FAIL_CASED = /\bFAIL(?:ED|URE|S)?\b/;
const FAIL_RE = /\b(failed|failing|failures?|AssertionError|assert(?:ion)? ?failed|Traceback|panicked|[1-9]\d* (?:failed|failing|failures?|errors?))\b|^not ok\b|expected[^\n]{0,80}\b(?:got|but (?:was|got)|received|actual)\b|✗|✘|\brc=[1-9]|\bexit(?: code| status)?[ =:]+[1-9]/im;
export const failureSignal = (text) => FAIL_CASED.test(String(text ?? '')) || FAIL_RE.test(String(text ?? ''));
// The outcome of the last thing a call printed: a call that shows red then green ("red rc=1",
// fix, "rc=0") ends green. Used for "the run that supports a pass claim".
export function endsInFailure(text) {
  const t = String(text ?? '');
  // The last printed exit status decides, when the agent printed one (`echo rc=$?`).
  const codes = [...t.matchAll(/\b(?:rc|exit(?: code| status)?)[ =:]+(\d+)/gi)];
  if (codes.length) return Number(codes.at(-1)[1]) !== 0;
  return failureSignal(t.trim().split('\n').slice(-3).join('\n'));
}

// "Passed" claims in prose. A sentence with a negation is not a claim of passing.
const PASS_CLAIM = /\b(pass(?:es|ed|ing)?|green|succeed(?:s|ed)?|all (?:tests|checks) ok|tests? (?:are )?ok)\b|通っ|通る|通過|成功し|グリーン|パスし/i;
const NEGATION = /\b(not|n't|never|no longer|fails?|failed|failing|unable)\b|ない|ません|未|失敗/i;
export function passClaims(text) {
  // Japanese sentences end at 。 with no space after it.
  return String(text ?? '').split(/(?<=[。！？])|(?<=[.!?])\s+|\n+/).filter((s) => PASS_CLAIM.test(s) && !NEGATION.test(s)).map((s) => s.trim());
}

const BASE_CHECK = (a) => a.type === 'git' && (a.sub === 'merge-base' || a.sub === 'fetch' || a.args.some((x) => /\bmain\.\.\.|\.\.\.main\b|(^|\/)main\.\.|\.\.(origin\/)?main\b|^origin\/main$/.test(x)))
  || (a.type === 'history' && a.args.some((x) => /(^|\.\.\.?|\/)main$|^main\.\.\.?/.test(x)));
const BRING_MAIN = (a) => a.type === 'git' && ['rebase', 'merge', 'pull'].includes(a.sub) && a.args.some((x) => /(^|\/)main$/.test(x));

// The facts the constraints are evaluated on.
export function phaseFacts(record, opts = {}) {
  const { implFiles = [] } = opts;
  const table = opts.table ?? eventTable(record);
  const authored = opts.authored ?? authoredTexts(record, table);
  const vis = opts.vis ?? visibility(table, authored);
  const role = (p) => fileRole(p, { implFiles });
  const acts = table.events.flatMap((e) => e.actions.map((a) => ({ ...a, event: e })));
  // Implementation edits: the agent's own changes to source. Reverts (git checkout / restore)
  // restore the old text and are not the start of the implementation.
  const implEdits = acts.filter((a) => a.type === 'write' && role(a.path) === 'impl' && !/^git /.test(a.how ?? ''));
  const testWrites = acts.filter((a) => a.type === 'write' && role(a.path) === 'test');
  const relevantWrites = acts.filter((a) => (a.type === 'write' || a.type === 'delete') && ['impl', 'test'].includes(role(a.path)));
  const firstImpl = implEdits[0]?.pos ?? null;
  const cutoff = firstImpl ?? Infinity;
  const changed = [...new Set(implEdits.map((a) => a.path))];
  const firstEditOf = (p) => implEdits.find((a) => a.path === p)?.pos ?? null;
  const runs = acts.filter((a) => a.type === 'run');
  const testRuns = runs.filter((a) => a.isTest);
  const ranOk = (a) => a.event.shown;
  // Failure observation before the first implementation edit (Or of three functions).
  const repro = (a) => a.target == null || role(a.target) === 'scratch' || (vis.firstWrite.get(a.target) ?? Infinity) < a.pos;
  const obs = runs.filter((a) => a.pos < cutoff && ranOk(a)).map((a) => {
    // The exit code belongs to the call's last command, so it speaks for this run only when the
    // run is that command.
    const failed = failureSignal(a.event.resultText) || (a.event.exitCode > 0 && a.event.actions.at(-1)?.pos === a.pos);
    const via = a.isTest ? 'test' : repro(a) ? 'repro' : 'program';
    // Running the program records its behaviour; that is the observation (the wrong output is
    // shown), whether or not the program itself reports an error.
    return { pos: a.pos, via, failed, counts: via === 'program' ? !!a.event.resultText.trim() : failed };
  });
  const failureObserved = obs.find((o) => o.counts) ?? null;
  const firstTestWrite = testWrites[0]?.pos ?? null;
  // TDD: a test written, then a test run that fails, then the implementation edit.
  const red = testWrites.length && testRuns.find((r) => r.pos > firstTestWrite && r.pos < cutoff && ranOk(r) && failureSignal(r.event.resultText));
  const searches = acts.filter((a) => a.type === 'search' || (a.type === 'history' && a.pickaxe));
  // Callers: other source files whose end-state text names a changed file.
  const callers = [];
  for (const c of changed) {
    const base = c.replace(/^.*\//, '');
    const stem = base.replace(/\.[^.]+$/, '');
    for (const [p, t] of Object.entries(vis.files)) {
      if (p === c || t == null || role(p) !== 'impl' || changed.includes(p)) continue;
      if (t.includes(c) || (base !== stem && t.includes(base)) || new RegExp(`\\b(source|require|import|from)\\b[^\\n]*\\b${esc(stem)}\\b`).test(t)) callers.push(p);
    }
  }
  const lastRelevantWrite = relevantWrites.at(-1)?.pos ?? null;
  const prose = authored.filter((a) => a.prose);
  const typed = prose.map((a) => ({ ...a, types: contentTypes(a.text) }));
  const before = (pos) => (x) => x.pos < pos;
  const namesChanged = (t) => changed.some((c) => t.includes(c) || t.includes(c.replace(/^.*\//, '')));
  // Claims of passing, each checked against the latest test run before it.
  const claims = [];
  for (const a of prose) for (const s of passClaims(a.text)) {
    const run = testRuns.filter((r) => r.pos < a.pos && ranOk(r)).at(-1) ?? null;
    let status;
    if (!run) status = 'unsupported';
    else if (relevantWrites.some((w) => w.pos > run.pos && w.pos < a.pos)) status = 'stale';
    else if (endsInFailure(run.event.resultText)) status = 'failed-run';
    else status = 'ok';
    claims.push({ pos: a.pos, where: a.where, status, run: run?.pos ?? null, text: s.slice(0, 160) });
  }
  return {
    table, authored, vis, firstImpl, changed, callers: [...new Set(callers)], firstTestWrite,
    openedChanged: changed.map((p) => ({ path: p, seen: seen(vis, p, firstEditOf(p)) })),
    openedCallers: [...new Set(callers)].map((p) => ({ path: p, seen: seen(vis, p, cutoff) })),
    searchedBefore: searches.filter(before(cutoff)).length,
    baseChecked: acts.some((a) => a.pos < cutoff && BASE_CHECK(a)),
    broughtMain: acts.some((a) => a.pos < cutoff && BRING_MAIN(a)),
    observations: obs, failureObserved,
    testWrittenBeforeImpl: firstTestWrite != null && firstTestWrite < cutoff,
    redBeforeImpl: !!red,
    testRunBeforeImpl: testRuns.some((r) => r.pos < cutoff && ranOk(r)),
    testRunAfterLastEdit: lastRelevantWrite == null ? testRuns.some(ranOk) : testRuns.some((r) => r.pos > lastRelevantWrite && ranOk(r)),
    claims,
    stated: {
      trajectory: typed.some((x) => x.pos < cutoff && x.types.trajectory),
      plan: typed.some((x) => x.pos < cutoff && (namesChanged(x.text) && (x.types.plan || x.where === 'file'))),
      hypothesis: typed.some((x) => x.pos < cutoff && x.types.hypothesis),
      testList: typed.some((x) => x.pos < (firstTestWrite ?? cutoff) && x.types.testList),
      alternatives: typed.some((x) => x.pos < cutoff && x.types.alternatives),
      report: !!table.finalMessage.trim(),
    },
    // Exploratory counts (EXP-30 observation: the no-harness arm called tools 5-7 times before
    // its first edit).
    callsBeforeImpl: firstImpl == null ? table.nCalls : Math.ceil(firstImpl),
    filesOpenedBeforeImpl: new Set(vis.views.filter((v) => v.pos < cutoff && !v.auto && ['full', 'lines', 'tail', 'filtered'].includes(v.range.kind) && !/^\//.test(v.path)).map((v) => v.path)).size,
  };
}

const atLeast = (level, want) => !!level && ({ O: 3, P: 2, M: 1 }[level.level] >= { O: 3, P: 2, M: 1 }[want]);
const T = (...ts) => (o) => ts.includes(o.trajectory);

// The constraint table. applies(opts) selects by expected trajectory and cell facts;
// check(f) returns true / false, or null when it cannot apply to this trial (nothing to check).
export const CONSTRAINTS = [
  { id: 'intake.trajectory', phase: 0, series: 'E', applies: T('T0', 'T1', 'T2'), check: (f) => f.stated.trajectory },
  { id: 'research.opened-changed', phase: 1, series: 'B', applies: T('T0', 'T1', 'T2'), check: (f) => (f.changed.length ? f.openedChanged.every((x) => atLeast(x.seen, 'O')) : null) },
  { id: 'research.opened-callers', phase: 1, series: 'B', applies: T('T0', 'T1', 'T2'), check: (f) => (f.callers.length ? f.openedCallers.every((x) => atLeast(x.seen, 'P')) : null) },
  { id: 'research.searched', phase: 1, series: 'B', applies: T('T1', 'T2'), check: (f) => f.searchedBefore > 0 },
  { id: 'research.base-checked', phase: 1, series: 'B', applies: (o) => !!o.base && o.trajectory !== 'T0', check: (f) => f.baseChecked },
  { id: 'research.base-brought', phase: 1, series: 'B', applies: (o) => o.base === 'stale', check: (f) => f.broughtMain },
  { id: 'research.failure-observed', phase: 1, series: 'B', applies: (o) => !!o.bug && o.trajectory !== 'T0', check: (f) => !!f.failureObserved },
  { id: 'research.plan', phase: 1, series: 'E', applies: T('T1', 'T2'), check: (f) => f.stated.plan },
  { id: 'design.alternatives', phase: 2, series: 'E', applies: T('T2'), check: (f) => f.stated.alternatives },
  { id: 'test-design.list', phase: 3, series: 'E', applies: T('T2'), check: (f) => f.stated.testList },
  { id: 'test.run-before-change', phase: 3, series: 'B', applies: T('T0'), check: (f) => f.testRunBeforeImpl },
  { id: 'test.written-before-impl', phase: 4, series: 'B', applies: T('T1', 'T2'), check: (f) => f.testWrittenBeforeImpl },
  { id: 'test.red-before-impl', phase: 4, series: 'B', applies: T('T1', 'T2'), check: (f) => f.redBeforeImpl },
  { id: 'eval.run-after-last-edit', phase: 6, series: 'B', applies: T('T0', 'T1', 'T2'), check: (f) => f.testRunAfterLastEdit },
  { id: 'eval.no-stale-claim', phase: 6, series: 'B', applies: T('T0', 'T1', 'T2'), check: (f) => f.claims.every((c) => c.status === 'ok') },
  { id: 'report.final', phase: 8, series: 'E', applies: T('T0', 'T1', 'T2'), check: (f) => f.stated.report },
];

// opts: { trajectory: 'T0'|'T1'|'T2', bug: boolean, base: false|true|'stale', implFiles: [] }
// Returns per-series satisfied / required counts, the share, and the missing constraint ids.
export function gradePhases(record, opts = {}) {
  const o = { trajectory: 'T1', bug: false, base: false, ...opts };
  if (!['T0', 'T1', 'T2'].includes(o.trajectory)) throw new Error(`unknown trajectory: ${o.trajectory}`);
  const f = phaseFacts(record, o);
  const checks = CONSTRAINTS.filter((c) => c.applies(o)).map((c) => ({ id: c.id, phase: c.phase, series: c.series, result: c.check(f) }));
  const series = (s) => {
    const req = checks.filter((c) => c.series === s && c.result !== null);
    const sat = req.filter((c) => c.result === true).length;
    return { satisfied: sat, required: req.length, share: req.length ? sat / req.length : null, missing: req.filter((c) => c.result === false).map((c) => c.id) };
  };
  return {
    trajectory: o.trajectory, checks, B: series('B'), E: series('E'),
    facts: {
      firstImpl: f.firstImpl, changed: f.changed, callers: f.callers, callsBeforeImpl: f.callsBeforeImpl,
      filesOpenedBeforeImpl: f.filesOpenedBeforeImpl, searchedBefore: f.searchedBefore,
      failureObserved: f.failureObserved, observations: f.observations, claims: f.claims,
      openedChanged: f.openedChanged.map((x) => ({ path: x.path, level: x.seen?.level ?? null, via: x.seen?.via ?? null })),
    },
  };
}
