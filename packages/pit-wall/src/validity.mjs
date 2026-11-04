// Run and case validity: catch false verdicts caused by the evaluation itself,
// not by the agent. Three questions, asked before any score is trusted:
//
//   1. Did the run measure the agent?      (assessRun)   environment faults
//   2. Can the case tell good from bad?    (assessCases) control discrimination
//   3. Does the case give the answer away? (lintCase)    answer leakage
//
// Nothing here knows a harness or a runner: runner-specific noise arrives as
// `noise` patterns from the runner adapter.

import { toolCalls } from './normalize/claude-stream.mjs';

// Fault kinds and how much they damage a run.
//   invalid: the run did not measure the agent; drop it from scores and report it.
//   suspect: the run measured the agent under distorted conditions; keep it, report it.
export const FAULTS = {
  'runner-error': 'invalid',     // the runner failed (no trajectory, crash, abort)
  'oom-killed': 'invalid',       // the kernel killed a process for the container's memory limit (a resource, not the agent)
  'judge-missing': 'invalid',    // a judge grader has no verdict from pit-wall's judge
  'state-missing': 'invalid',    // a state-graded case has no captured end state
  'tool-unavailable': 'invalid', // a tool the case provides could not execute (127, missing interpreter)
  'not-executable': 'suspect',   // the agent ran a workspace file that lacks the execute bit (126,
                                 // Permission denied): the agent's own recoverable error, the same
                                 // in every arm (EXP-19/20: `bin/price 999`; every such run went on and finished)
  'turn-limit': 'suspect',       // the agent used up its max turns: an agent outcome, graded on the state it left
  'compact-thrash': 'suspect',   // Claude Code stopped because auto-compaction kept refilling the context
                                 // (a forced small window): a harness outcome of the condition, graded on state
  'shim-escape': 'invalid',      // the agent reached a real binary behind a stand-in
  'shim-fault': 'invalid',       // a stand-in itself failed (its own script error)
  'env-readonly': 'suspect',     // a write the agent attempted hit a read-only filesystem
  'harness-denied': 'suspect',   // the runner's permission layer refused a call
  'runner-noise': 'suspect',     // a known runner artifact appeared in tool output
  'check-undecidable': 'suspect', // a tristate check exited 2: it could not tell from the end state
                                 // whether the rule was followed; not scored as pass or fail
                                 // (added by the grading step, not by assessRun)
};

const UNAVAILABLE = /Exit code 12[67]\b|cannot execute|command not found|required file not found|bad interpreter/i;
// 126 from running a relative path (a file of the case) without the execute bit.
const NOT_EXECUTABLE = /^(?:\/bin\/(?:ba)?sh: line \d+: )?(?!\/)[\w./-]+: Permission denied$/m;
const READONLY = /Read-only file system/i;

function resultText(c) { return c.extra.result?.text ?? ''; }

// shims: names of binaries the case replaces with stand-ins (e.g. ['gh']).
// noise: [{ name, pattern }] known runner artifacts; matched lines are classified
//        as runner-noise instead of env-readonly etc.
export function assessRun(rec, { shims = [], noise = [] } = {}) {
  const faults = [];
  // An agent that stopped on its own limit (max turns, compaction thrash) still left a
  // trajectory and a state: that is an outcome of the run, not a runner failure.
  // rec.agentStop = { subtype, text } from the agent's own final result event.
  const stop = rec.agentStop ?? {};
  // A process killed for the container's memory limit (state-capture.sh reads the cgroup's
  // oom_kill count) makes the outcome a resource failure, whatever the checks say.
  if ((rec.state?.oomKills ?? 0) > 0) { faults.push({ kind: 'oom-killed', evidence: `oom_kill=${rec.state.oomKills}` }); return finish(faults); }
  if (rec.error && rec.trajectory && stop.subtype === 'error_max_turns') faults.push({ kind: 'turn-limit', evidence: stop.subtype });
  else if (rec.error && rec.trajectory && /Autocompact is thrashing/.test(stop.text ?? '')) faults.push({ kind: 'compact-thrash', evidence: String(stop.text).slice(0, 80) });
  else if (rec.error || !rec.trajectory) {
    faults.push({ kind: 'runner-error', evidence: String(rec.error ?? 'no trajectory') });
    return finish(faults);
  }
  for (const c of toolCalls(rec.trajectory)) {
    const cmd = c.extra.kind === 'execute' ? String(c.arguments.command ?? '') : '';
    let text = resultText(c);
    for (const n of noise) {
      if (new RegExp(n.pattern).test(text)) {
        faults.push({ kind: 'runner-noise', name: n.name, call: c.tool_call_id });
        text = text.split('\n').filter((l) => !new RegExp(n.pattern).test(l)).join('\n');
      }
    }
    if (c.extra.result?.is_error && /Exit code 126\b/.test(text) && NOT_EXECUTABLE.test(text) && !/cannot execute|bad interpreter|required file not found|command not found/i.test(text)) {
      faults.push({ kind: 'not-executable', call: c.tool_call_id, evidence: `${cmd.slice(-60)} => ${text.match(NOT_EXECUTABLE)[0]}` });
    } else if (c.extra.result?.is_error && UNAVAILABLE.test(text)) {
      faults.push({ kind: 'tool-unavailable', call: c.tool_call_id, evidence: `${cmd.slice(0, 80)} => ${text.match(UNAVAILABLE)[0]}` });
    }
    if (READONLY.test(text)) faults.push({ kind: 'env-readonly', call: c.tool_call_id, evidence: cmd.slice(0, 80) });
    for (const s of shims) {
      // A shell stand-in's own runtime error reads `<path>/s: line N: ...`.
      const own = text.match(new RegExp(String.raw`(^|/)${s}: line \d+: .*`, 'm'));
      if (own) faults.push({ kind: 'shim-fault', call: c.tool_call_id, evidence: own[0].slice(0, 100) });
      // In command position, an absolute path, `command s`, `env s` or `\s`
      // bypasses a PATH stand-in. (`ls /usr/bin/s` only looks, so it is not flagged.)
      const esc = new RegExp(`(^|[;&|(\\n])\\s*(/\\S*/${s}|command\\s+${s}|env\\s+${s}|\\\\${s})(\\s|$)`);
      if (esc.test(cmd)) faults.push({ kind: 'shim-escape', call: c.tool_call_id, evidence: cmd.slice(0, 80) });
    }
  }
  for (const d of rec.trajectory.extra?.pitwall?.permission_denials ?? []) {
    faults.push({ kind: 'harness-denied', call: d.tool_call_id, evidence: d.tool });
  }
  return finish(faults);
}

// A check that could not decide (a tristate check's exit 2) is reported on the run, not
// scored as a failure: the run is kept and marked suspect (never made better than it was).
export function markUndecidable(validity, results) {
  const names = results.filter((r) => r.undecidable).map((r) => r.name);
  if (!names.length) return validity;
  validity.faults.push({ kind: 'check-undecidable', evidence: names.join(', ') });
  if (validity.status === 'ok') validity.status = 'suspect';
  return validity;
}

function finish(faults) {
  const severities = faults.map((f) => FAULTS[f.kind]);
  const status = severities.includes('invalid') ? 'invalid' : severities.includes('suspect') ? 'suspect' : 'ok';
  return { status, faults };
}

// Case discrimination from control arms. rates: { [arm]: { k, n } } for one case
// and dimension. A case only supports a verdict if the good control beats the bad
// control. Flags:
//   non-discriminating  good <= bad: the case cannot tell the controls apart
//   ceiling             the baseline already passes every run: no room to improve
//   floor               the good control never passes: the case may be unpassable
export function assessCase(rates, { good, bad, baseline }) {
  const r = (a) => (rates[a]?.n ? rates[a].k / rates[a].n : null);
  const flags = [];
  if (r(good) != null && r(bad) != null && r(good) <= r(bad)) flags.push('non-discriminating');
  if (r(baseline) === 1) flags.push('ceiling');
  if (r(good) === 0) flags.push('floor');
  return flags;
}

// Answer leakage: a protocol target (e.g. the label the harness should use) must
// not appear in the materials the agent sees, or any arm can copy it.
export function lintCase(kase) {
  const materials = [kase.prompt, kase.issue?.body ?? '', ...Object.values(kase.files ?? {})].join('\n');
  const problems = [];
  for (const g of kase.graders) {
    const t = g.params?.target;
    if (g.dimension === 'protocol' && t && materials.includes(t)) {
      problems.push(`grader ${g.name}: protocol target "${t}" appears in the case materials`);
    }
  }
  return problems;
}

// Harness leakage (the reverse of lintCase): text given to an arm (skills, a policy in
// the system prompt) that repeats material specific to a cell lets a run copy the
// cell's answer instead of applying a rule. Reported for a person to read:
//   tokens   numbers of two or more digits and path-like tokens found in both
//   words    words of 5+ letters found in both, except words of the prompt (the task
//            statement is shared by design) and a short list of generic words
//   phrases  runs of 4 words found in both
// Lexical only: a paraphrased example is not caught.
const GENERIC = new Set(['about', 'after', 'before', 'which', 'their', 'there', 'these', 'those', 'would', 'should', 'could', 'other', 'every', 'since', 'still', 'value', 'values', 'where', 'while', 'without', 'document', 'documents', 'change', 'changed', 'record', 'records', 'reason', 'decision', 'decided']);
const wordsOf = (t) => t.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
const tokensOf = (t) => new Set(t.match(/(?:[\w.-]+\/)+[\w.-]+|\b\d{2,}(?:\.\d+)?\b/g) ?? []);
const grams = (ws) => new Set(ws.slice(0, Math.max(0, ws.length - 3)).map((_, i) => ws.slice(i, i + 4).join(' ')));
export function leakOverlap(armText, kase) {
  const material = [kase.issue?.body ?? '', ...(kase.history ?? []).flatMap((c) => [c.message, ...Object.keys(c.files ?? {}), ...Object.values(c.files ?? {}).filter((x) => x != null)]), ...Object.keys(kase.files ?? {}), ...Object.values(kase.files ?? {})].join('\n');
  const prompt = new Set(wordsOf(kase.prompt ?? ''));
  const mt = tokensOf(material);
  const tokens = [...tokensOf(armText)].filter((x) => mt.has(x));
  const mw = new Set(wordsOf(material));
  const words = [...new Set(wordsOf(armText))].filter((w) => w.length >= 5 && mw.has(w) && !prompt.has(w) && !GENERIC.has(w));
  const mg = grams(wordsOf(material));
  const phrases = [...grams(wordsOf(armText))].filter((g) => mg.has(g));
  return { tokens, words, phrases };
}

// A contrast group defeats a shortcut when the shortcut's script misses the expected
// outcome in at least one cell. A shortcut that is right in every cell means the group
// cannot tell it from the rule, so no agent result on the group shows the rule.
export function checkGroups(records, suite) {
  const byId = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const rows = (suite.groups ?? []).flatMap((g) => g.shortcuts.map((s) => {
    const cells = g.cases.map((id) => {
      const r = records.find((x) => x.case === id && x.arm === `script:${s}`);
      return { id, got: r?.outcome ?? null, right: r ? r.outcome === byId[id]?.expectOutcome : null };
    });
    const missing = cells.filter((c) => c.got === null).map((c) => c.id);
    const missedIn = cells.filter((c) => c.right === false).map((c) => c.id);
    // A shortcut not run in any cell is outside this run (no claim either way); one run in
    // only some cells cannot show the group defeats it.
    const absent = missing.length === cells.length;
    return { group: g.id, shortcut: s, rightIn: cells.filter((c) => c.right).map((c) => c.id), missedIn, missing, absent, ok: absent || (!missing.length && missedIn.length > 0) };
  }));
  const text = ['| group | shortcut | right in | missed in | defeated |', '|---|---|---|---|---|',
    ...rows.map((x) => `| ${x.group} | ${x.shortcut} | ${x.rightIn.join(' ') || '-'} | ${x.missedIn.join(' ') || '-'}${x.missing.length ? ` (not run: ${x.missing.join(' ')})` : ''} | ${x.absent ? 'not in this run' : x.ok ? 'yes' : '**NO**'} |`)].join('\n');
  return { rows, text };
}
