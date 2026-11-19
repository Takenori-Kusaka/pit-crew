// Second-lineage audit with TypeSafe Jev (plan 34 §7, instrument 8). Jev answers typed yes/no
// questions (Noul: a probability) about an excerpt of one trial; the answers are mapped to the
// level of each graded item by a table written here, before any trial is seen.
//
// What is sent: the ORDER OF CALLS only — number, tool, command or path, exit code — and the
// run records (tool, arguments, exit code, source tree, failed tests count). The bodies of
// tool results are not sent. The excerpt does not contain the grader's own facts or levels.
//
// Context: Jev takes 32k tokens per question and 64k per request. An excerpt that does not fit
// is cut into windows of consecutive calls; the same question is asked of every window and the
// window answers are combined in code ("true in some window"). A question about what comes
// before call n is not asked of windows that start at or after n.
//
// Cost: every request is entered in a ledger (amounts only), and a batch whose estimate would
// take the cumulative total over the limit is NOT sent: BudgetStop is thrown before the first
// request of that batch. Dry run builds the requests and the estimate and calls nothing.
//
// The question texts and the thresholds are defaults for the audit's designer to review
// (the implementer does not decide the audit). Thresholds follow the vendor's starting
// values: >= 0.7 yes, <= 0.3 no, between = undecidable.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { systemOne } from './jev.mjs';

export const PRICE_USD_PER_MTOK = 0.042; // input; output is free (docs/research/research-typesafe.md §2)
export const LIMIT_USD = 2; // owner decision 4 (plan 34 §0)
export const QUESTION_TOKENS = 32000;
export const WINDOW_TOKENS = 24000; // state per request: leaves room for the questions
export const YES = 0.7, NO = 0.3;
// The smallest request was billed 300 input tokens (connectivity check, 2026-11-13): a fixed part
// per request that the character count does not see.
export const REQUEST_OVERHEAD_TOKENS = 300;

// Tokens are not countable offline for this model; 1 token per 2 characters overestimates
// English and code (about 4 and 3 characters per token) and is close for Japanese.
export const estimateTokens = (text) => Math.ceil(String(text).length / 2);
export const usd = (tokens) => (tokens / 1e6) * PRICE_USD_PER_MTOK;

export class BudgetStop extends Error {
  constructor(msg, detail) { super(msg); this.name = 'BudgetStop'; this.detail = detail; }
}

// ---- ledger ---------------------------------------------------------------------------------
export function readLedger(file) {
  if (!existsSync(file)) return { limit_usd: LIMIT_USD, price_usd_per_mtok_input: PRICE_USD_PER_MTOK, total_usd: 0, total_input_tokens: 0, requests: 0, entries: [] };
  return JSON.parse(readFileSync(file, 'utf8'));
}
function writeLedger(file, l) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, `${JSON.stringify(l, null, 1)}\n`); }
// Would sending `tokens` more keep the total within the limit? Throws BudgetStop when not.
export function reserve(file, tokens, purpose) {
  const l = readLedger(file);
  const after = l.total_usd + usd(tokens);
  if (after > l.limit_usd) throw new BudgetStop(`Jev budget: ${l.total_usd.toFixed(4)} USD spent, this batch is estimated at ${usd(tokens).toFixed(4)} USD, limit ${l.limit_usd} USD — not sent; ask the owner`, { spent: l.total_usd, estimate: usd(tokens), limit: l.limit_usd, purpose });
  return { spent: l.total_usd, estimate: usd(tokens), after };
}
export function charge(file, { purpose, requests, inputTokens, estimated = false, now = new Date() }) {
  const l = readLedger(file);
  l.entries.push({ ts: now.toISOString(), purpose, requests, input_tokens: inputTokens, usd: Number(usd(inputTokens).toFixed(6)), tokens_estimated: estimated });
  l.total_input_tokens += inputTokens; l.requests += requests;
  l.total_usd = Number(l.entries.reduce((s, e) => s + e.usd, 0).toFixed(6));
  writeLedger(file, l);
  return l;
}

// ---- excerpt --------------------------------------------------------------------------------
const short = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };
// One line per tool call, from a pit-wall trajectory ({ steps: [{ tool_calls }] }). No result text.
export function callLines(trajectory, { maxCommand = 400 } = {}) {
  const out = [];
  for (const s of trajectory?.steps ?? []) for (const c of s.tool_calls ?? []) {
    const n = out.length + 1;
    const tool = c.function_name ?? c.name;
    const a = c.arguments ?? c.input ?? {};
    const res = c.extra?.result ?? {};
    const exit = (String(res.text ?? '').match(/^Exit code (\d+)/) ?? [null, res.is_error ? 'error' : '0'])[1];
    const what = tool === 'Bash' ? `$ ${short(a.command, maxCommand)}`
      : a.file_path ? `${a.file_path}${a.offset || a.limit ? ` (lines ${a.offset ?? 1}..${a.limit ? (a.offset ?? 1) + a.limit - 1 : 'end'})` : ''}`
        : a.pattern ? `pattern=${short(a.pattern, 120)} path=${a.path ?? '.'}${a.output_mode ? ` mode=${a.output_mode}` : ''}`
          : short(JSON.stringify(a), 200);
    out.push({ n, text: `#${n} ${tool} ${what} -> exit ${exit}` });
  }
  return out;
}
// One line per recorded run of a check tool (recorder.mjs), placed by time; `callOf(record)`
// gives the number of the call it ran in when the caller can tell (null otherwise).
export function recordLines(records, { finalSrcTree = null, callOf = () => null } = {}) {
  return (records ?? []).map((r, i) => {
    const failed = r.tests?.summary?.failed ?? null;
    const files = (r.tests?.files ?? []).map((f) => `${f.file}:${f.status}`).slice(0, 12).join(' ');
    const tree = r.startSrcTree ?? r.srcTree ?? null;
    return { call: callOf(r), text: `run ${i + 1}: ${r.tool} args=[${short((r.argv ?? []).slice(1).join(' '), 300)}] cwd=${r.cwd} exit=${r.ended ? r.exit : 'none (killed or timed out)'}${r.signal ? ` signal=${r.signal}` : ''} source-tree=${tree ? tree.slice(0, 10) : '?'}${finalSrcTree && tree ? (tree === finalSrcTree ? ' (= final)' : ' (not final)') : ''}${failed != null ? ` tests-failed=${failed}` : ''}${files ? ` files: ${files}` : ''}` };
  });
}

// Cut numbered lines into windows of consecutive calls that fit `budget` tokens with the header.
export function windows(lines, { header = '', budget = WINDOW_TOKENS } = {}) {
  const out = [];
  let cur = [], size = estimateTokens(header);
  for (const l of lines) {
    const t = estimateTokens(l.text) + 1;
    if (cur.length && size + t > budget) { out.push(cur); cur = []; size = estimateTokens(header); }
    // A single line over the budget is cut to it rather than dropped.
    cur.push(t + estimateTokens(header) > budget ? { ...l, text: `${l.text.slice(0, Math.max(0, (budget - estimateTokens(header)) * 2 - 20))}… [cut]`, cut: true } : l);
    size += t;
  }
  if (cur.length) out.push(cur);
  return out.map((w) => ({ first: w[0].n, last: w.at(-1).n, text: `${header}${w.map((l) => l.text).join('\n')}`, cut: w.some((l) => l.cut) }));
}

// ---- questions and levels -------------------------------------------------------------------
const q = (instructions, yes, no) => ({ type: 'noul', instructions, criteria: { true: yes, false: no } });
// facts: { cutoff: n | null, implFiles: [paths], callers: [paths], callersNeeded: k, relatedTests: [paths] }
// Each item: questions(facts) -> { id: { q, before, scope } } and level(answers) -> 0..max | null.
// answers[id] is true / false / null (undecidable). `before: n` limits the windows asked;
// scope 'runs' asks the run records only, 'all' the calls.
export const ITEMS = {
  R1: {
    max: 2,
    questions: (f) => ({
      any: { before: f.cutoff, q: q(`Before call #${f.cutoff}, was the content of at least one of the files in \`impl_files\` shown (Read, cat, sed -n, head, grep output lines)?`, 'A call numbered below the cutoff shows content of one of those files', 'No such call, or only a listing of names') },
      all: { before: f.cutoff, q: q(`Before call #${f.cutoff}, was the content of EVERY file in \`impl_files\` shown?`, 'Each listed file has a call below the cutoff that shows its content', 'At least one listed file was not shown before the cutoff') },
    }),
    level: (a) => (a.any === null ? null : !a.any ? 0 : a.all === null ? null : a.all ? 2 : 1),
  },
  R2: {
    max: 2,
    questions: (f) => ({
      any: { before: f.cutoff, q: q(`Before call #${f.cutoff}, was the content of at least one of the files in \`callers\` shown?`, 'A call below the cutoff shows content of one of those files', 'None of those files was shown before the cutoff') },
      enough: { before: f.cutoff, combine: 'count', q: q(`Before call #${f.cutoff}, was the content of at least ${f.callersNeeded} DIFFERENT files in \`callers\` shown?`, `${f.callersNeeded} or more different listed files were shown`, `Fewer than ${f.callersNeeded}`) },
    }),
    applies: (f) => (f.callers ?? []).length > 0,
    level: (a) => (a.any === null ? null : !a.any ? 0 : a.enough === null ? null : a.enough ? 2 : 1),
  },
  R3: {
    max: 1,
    questions: (f) => ({ search: { before: f.cutoff, q: q(`Before call #${f.cutoff}, is there a search over source files (Grep, grep, rg, git grep, find with a name pattern)?`, 'Yes, such a call exists below the cutoff', 'No search call below the cutoff') } }),
    level: (a) => (a.search === null ? null : a.search ? 1 : 0),
  },
  R4: {
    max: 1,
    questions: (f) => ({ history: { before: f.cutoff, q: q(`Before call #${f.cutoff}, is there a git log, git blame or git show call?`, 'Yes', 'No') } }),
    level: (a) => (a.history === null ? null : a.history ? 1 : 0),
  },
  R5: {
    max: 2,
    questions: (f) => ({
      redEarlier: { before: f.cutoff, scope: 'runs', q: q(`Is there a run, in a call numbered below #${f.cutoff}, that includes one of the \`related_tests\` and ended with a non-zero exit code or with tests failed?`, 'Such a run exists in an earlier call', 'No such run before the cutoff call') },
      redSame: { scope: 'runs', q: q(`Is there a failing run of one of the \`related_tests\` in call #${f.cutoff} itself, or a run of a hand-written reproduction (node -e, a scratch script) before call #${f.cutoff}?`, 'Yes', 'No') },
    }),
    level: (a) => (a.redEarlier === null ? null : a.redEarlier ? 2 : a.redSame === null ? null : a.redSame ? 1 : 0),
  },
  W1: {
    max: 2,
    questions: (f) => ({
      wrote: { q: q('Did any call create or edit a test file (a path ending in .test.ts / .spec.ts or under a tests directory)?', 'Yes', 'No test file was written') },
      first: { before: f.cutoff, q: q(`Is there a call numbered below #${f.cutoff} that creates or edits a test file?`, 'Yes', 'No') },
    }),
    level: (a) => (a.wrote === null ? null : !a.wrote ? 0 : a.first === null ? null : a.first ? 2 : 1),
  },
  W2: {
    max: 2,
    questions: (f) => ({
      red: { before: f.cutoff, scope: 'runs', q: q(`Is there a run, in a call numbered below #${f.cutoff}, in which a test of a test file the agent wrote failed?`, 'Yes, a test of an agent-written file failed before the cutoff call', 'No') },
      ran: { scope: 'runs', q: q('Was a test file the agent wrote run at all (passing, or in the same call as the first implementation edit)?', 'Yes', 'No') },
    }),
    level: (a) => (a.red === null ? null : a.red ? 2 : a.ran === null ? null : a.ran ? 1 : 0),
  },
  E1: {
    max: 2,
    questions: () => ({
      final: { scope: 'runs', q: q('Is there a run marked "(= final)" that includes one of the `related_tests` and ended with exit 0?', 'Yes', 'No') },
      any: { scope: 'runs', q: q('Is there any run of the test runner (vitest, npm test) at all?', 'Yes', 'No') },
    }),
    level: (a) => (a.final === null ? null : a.final ? 2 : a.any === null ? null : a.any ? 1 : 0),
  },
  E2: {
    max: 2,
    questions: () => ({
      types: { scope: 'runs', q: q('Is there a run of a type check (svelte-check or tsc)?', 'Yes', 'No') },
      lint: { scope: 'runs', q: q('Is there a run of a linter (biome, eslint or `npm run lint`)?', 'Yes', 'No') },
    }),
    level: (a) => (a.types === null || a.lint === null ? null : Number(a.types) + Number(a.lint)),
  },
};

export const verdict = (p, { yes = YES, no = NO } = {}) => (typeof p !== 'number' ? null : p >= yes ? true : p <= no ? false : null);
// Window answers -> one answer: true when some window says true; false when every asked window
// says false; null when none says true and some window was undecidable or unreadable.
export function combine(answers) {
  if (!answers.length) return false; // nothing before the cutoff to ask about
  if (answers.some((a) => a === true)) return true;
  return answers.every((a) => a === false) ? false : null;
}

// The requests for one trial: [{ item, qid, window, state, questions, tokens }].
// excerpt: { calls: [{ n, text }], runs: [{ call, text }] }.
export function buildRequests(trial, { items = Object.keys(ITEMS), budget = WINDOW_TOKENS } = {}) {
  const f = trial.facts;
  const base = { impl_files: f.implFiles ?? [], callers: f.callers ?? [], related_tests: f.relatedTests ?? [] };
  const runLines = (trial.excerpt.runs ?? []).map((r, i) => ({ n: r.call ?? Infinity, text: `${r.call != null ? `[in call #${r.call}] ` : ''}${r.text}`, i }));
  const out = [], skipped = [];
  for (const item of items) {
    const def = ITEMS[item];
    if (def.applies && !def.applies(f)) { skipped.push({ item, why: 'not applicable' }); continue; }
    for (const [qid, spec] of Object.entries(def.questions(f))) {
      if ('before' in spec && spec.before == null) { skipped.push({ item, qid, why: 'no cutoff' }); continue; }
      const lines = spec.scope === 'runs' ? runLines : trial.excerpt.calls;
      const header = `${spec.scope === 'runs' ? 'Recorded runs of check tools, oldest first.' : 'Tool calls of one session, in order.'}\n`;
      const ws = windows(lines, { header, budget }).filter((w) => spec.scope === 'runs' || spec.before == null || w.first < spec.before);
      // A count over files cannot be combined across windows by OR: it needs one window.
      if (spec.combine === 'count' && ws.length > 1) { skipped.push({ item, qid, why: 'needs one window', windows: ws.length }); continue; }
      ws.forEach((w, k) => {
        const state = { ...base, excerpt: w.text };
        const questions = { [qid]: spec.q };
        out.push({ trial: trial.id, item, qid, window: k, of: ws.length, cut: w.cut, state, questions, tokens: estimateTokens(JSON.stringify({ state, questions })) + REQUEST_OVERHEAD_TOKENS });
      });
      if (!ws.length) out.push({ trial: trial.id, item, qid, window: 0, of: 0, empty: true, tokens: 0 });
    }
  }
  return { requests: out, skipped };
}

// Run the audit of some trials. Returns { rows: [{ trial, item, level, answers, undecidable }], cost }.
// dryRun: no request is made; cost is the estimate. ledger: the file with the cumulative amounts.
export async function audit(trials, { ledger, dryRun = false, items, budget, purpose = 'audit', fetchImpl = fetch, send = systemOne, thresholds = {} } = {}) {
  const built = trials.map((t) => ({ t, ...buildRequests(t, { items, budget }) }));
  const all = built.flatMap((b) => b.requests.filter((r) => !r.empty));
  const over = all.filter((r) => r.tokens > QUESTION_TOKENS);
  const estimate = all.reduce((s, r) => s + r.tokens, 0);
  const plan = { requests: all.length, estimatedTokens: estimate, estimatedUsd: Number(usd(estimate).toFixed(6)), overLimitRequests: over.length };
  if (dryRun) return { dryRun: true, rows: [], cost: plan, skipped: built.flatMap((b) => b.skipped.map((s) => ({ trial: b.t.id, ...s }))) };
  if (!ledger) throw new Error('audit: a ledger file is required for a real run');
  reserve(ledger, estimate, purpose); // throws BudgetStop before anything is sent
  const rows = [];
  let tokens = 0, sent = 0, estimated = false;
  try {
    for (const b of built) {
      const got = new Map(); // `${item}.${qid}` -> window answers
      for (const r of b.requests) {
        const key = `${r.item}.${r.qid}`;
        if (!got.has(key)) got.set(key, []);
        if (r.empty) continue;
        if (r.tokens > QUESTION_TOKENS) { got.get(key).push(null); continue; }
        let res = null;
        try { res = await send(r.state, r.questions, { fetchImpl }); } catch { res = null; }
        sent++;
        if (typeof res?.usage?.input_tokens === 'number') tokens += res.usage.input_tokens; else { tokens += r.tokens; estimated = true; }
        got.get(key).push(res ? verdict(res.answers?.[r.qid]?.noul, thresholds) : null);
      }
      const skippedItems = new Set(b.skipped.filter((s) => !s.qid).map((s) => s.item));
      for (const item of items ?? Object.keys(ITEMS)) {
        if (skippedItems.has(item)) { rows.push({ trial: b.t.id, item, level: null, notApplicable: true, answers: {} }); continue; }
        const answers = {};
        for (const qid of Object.keys(ITEMS[item].questions(b.t.facts))) answers[qid] = got.has(`${item}.${qid}`) ? combine(got.get(`${item}.${qid}`)) : null;
        const level = ITEMS[item].level(answers);
        rows.push({ trial: b.t.id, item, level, undecidable: level === null, answers });
      }
    }
  } finally {
    if (sent) charge(ledger, { purpose, requests: sent, inputTokens: tokens, estimated });
  }
  return { dryRun: false, rows, cost: { ...plan, requests: sent, inputTokens: tokens, usd: Number(usd(tokens).toFixed(6)) }, skipped: built.flatMap((b) => b.skipped.map((s) => ({ trial: b.t.id, ...s }))) };
}

// One smallest request, to learn whether the key and the endpoint work. Entered in the ledger.
export async function ping({ ledger, fetchImpl = fetch, send = systemOne } = {}) {
  const state = { t: 'ok' };
  const questions = { p: q('Is `t` equal to "ok"?', 'Yes', 'No') };
  const est = estimateTokens(JSON.stringify({ state, questions }));
  reserve(ledger, est, 'connectivity check');
  const res = await send(state, questions, { fetchImpl });
  const tokens = res?.usage?.input_tokens ?? est;
  const l = charge(ledger, { purpose: 'connectivity check', requests: 1, inputTokens: tokens, estimated: typeof res?.usage?.input_tokens !== 'number' });
  return { ok: typeof res?.answers?.p?.noul === 'number', answer: verdict(res?.answers?.p?.noul), inputTokens: tokens, usd: usd(tokens), totalUsd: l.total_usd };
}
