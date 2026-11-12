// Validate the stage-4 defect flags (research-machine-only §2.4 #13-#14) without labels, by
// construction: the SAME task, with rationales whose defect is known from how they were made.
//   rule dependence: a rationale that parrots the harness rules must score HIGHER on
//                    mean log p(r | task+rules) − mean log p(r | task) than the original rationale
//   specificity:     a boilerplate rationale ("do nothing / use a library / rewrite") must score
//                    LOWER on mean log p(r | task+observations) − mean log p(r | ∅) than the original
// Five tasks (2026-11-05 night; the first run had one task — too thin to lean on). Each task has its
// own original / parrot / boilerplate; the parrot and boilerplate texts are shared except for the
// task-specific nouns, so a pass is not an artefact of one wording.
// Calls experiments/judge/logprob.py (llama-cpp-python, CPU) with ollama's qwen3:8b GGUF.
// Usage (WSL): node experiments/judge/validate-logprob.mjs [--model=/path/to/gguf]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
function ggufFromOllama(name = 'qwen3', tag = '8b') {
  const m = JSON.parse(readFileSync(join(homedir(), '.local/ollama/models/manifests/registry.ollama.ai/library', name, tag), 'utf8'));
  const d = m.layers.find((l) => l.mediaType.endsWith('image.model')).digest.replace('sha256:', 'sha256-');
  return join(homedir(), '.local/ollama/models/blobs', d);
}
const model = args.find((a) => a.startsWith('--model='))?.slice(8) ?? ggufFromOllama();
if (!existsSync(model)) { console.error(`no GGUF at ${model}`); process.exit(2); }

const RULES = 'Harness rules: compare at least two options that differ in direction, one of which reuses existing code or does nothing; name the decisive observation and cite where it was seen; state the drawback of the chosen option; write the rejected option and why it was rejected.';
// Parrots the rule text almost verbatim, says little about the task.
const PARROT = 'I compared at least two options that differ in direction, one of which reuses existing code. I named the decisive observation and cited where it was seen. I stated the drawback of the chosen option. I wrote the rejected option and why it was rejected. Therefore the chosen option is the better one.';
// Boilerplate alternatives that fit any task.
const BOILER = 'Option A: do nothing and leave the code as it is. Option B: use a well-known library for this. Option C: rewrite the module from scratch with a cleaner design. Option B was adopted because it is the most robust and maintainable choice overall.';

const CASES = [
  { id: 'since-date',
    task: 'Add a --since DATE option to bin/report so it lists only orders placed on or after DATE (YYYY-MM-DD).',
    observations: 'Observations: grep found parse_date in lib/dates.sh:3, used by bin/export:12 and bin/import:20. lib/dates.sh exits 2 on a bad date. bin/report reads data/orders.csv with a while-read loop.',
    original: 'Option A (adopted): source lib/dates.sh in bin/report and call parse_date on --since and on each placed_at, then compare epoch seconds; bin/export and bin/import already do this, so a bad date gets the same exit 2. Drawback: one more sourced file. Option B (rejected): parse the date inline with date -u -d; it keeps bin/report self-contained but repeats the error handling that parse_date already has.' },
  { id: 'rounding',
    task: 'Invoice totals are off by one cent for some orders; make bin/invoice round the same way as the accounting export.',
    observations: 'Observations: lib/money.sh:9 defines round_cents (half-up on the string, no floats); bin/export:31 uses it; bin/invoice:44 uses printf %.2f, which rounds half-even on binary floats. tests/invoice.t has no case ending in 5.',
    original: 'Option A (adopted): replace the printf %.2f in bin/invoice:44 with round_cents from lib/money.sh, which bin/export already uses, so both files round half-up on the decimal string and the cent difference disappears. Drawback: round_cents is slower on large batches. Option B (rejected): keep printf and post-adjust the total by comparing with the export; it hides the cause and breaks when the export changes.' },
  { id: 'notify',
    task: 'Send a notification when a nightly job fails; the team uses the existing mail helper for other alerts.',
    observations: 'Observations: lib/mail.sh:5 defines send_alert (subject, body) and is called from bin/backup:60 on failure. The nightly job is cron/nightly.sh and currently exits non-zero silently. There is no chat webhook configured in the repo.',
    original: 'Option A (adopted): wrap the body of cron/nightly.sh in a trap that calls send_alert from lib/mail.sh with the exit code and the last 20 log lines, exactly as bin/backup:60 does. Drawback: mail only, no chat. Option B (rejected): add a chat webhook client; nothing in the repo is configured for it and it would be a second alert channel to maintain.' },
  { id: 'cache',
    task: 'bin/stats recomputes the same aggregates on every run and takes 40 seconds; make repeated runs fast without changing the output.',
    observations: 'Observations: bin/stats:20 reads data/events.csv (120 MB) fully each run. lib/cache.sh:3 offers cache_get / cache_put keyed by file mtime, used by bin/report:15. The output format of bin/stats is tested in tests/stats.t.',
    original: 'Option A (adopted): wrap the aggregate step of bin/stats:20 in cache_get / cache_put from lib/cache.sh keyed by the mtime of data/events.csv, as bin/report:15 does; the output stays byte-identical and tests/stats.t still passes. Drawback: the first run after a data change is still 40 seconds. Option B (rejected): rewrite the aggregation in a faster language; it changes a tested tool for a problem the existing cache already solves.' },
  { id: 'retry',
    task: 'bin/fetch fails intermittently with a network timeout; make it retry a few times before giving up.',
    observations: 'Observations: lib/net.sh:12 defines with_retry (count, delay, command) with exponential backoff, used by bin/sync:8. bin/fetch:30 calls curl directly. The timeout appears in logs about once per 200 calls.',
    original: 'Option A (adopted): call curl in bin/fetch:30 through with_retry from lib/net.sh with 3 attempts, the same helper bin/sync:8 uses, so the backoff and the final error code are already covered. Drawback: a real outage now takes three times longer to report. Option B (rejected): a hand-written for loop around curl; it would duplicate with_retry and lack its backoff.' },
];

const items = [];
for (const c of CASES) {
  items.push({ id: `${c.id}:original`, rationale: c.original, task: c.task, rules: RULES, observations: c.observations });
  items.push({ id: `${c.id}:parrot`, rationale: PARROT, task: c.task, rules: RULES, observations: c.observations });
  items.push({ id: `${c.id}:boilerplate`, rationale: BOILER, task: c.task, rules: RULES, observations: c.observations });
}
const t0 = Date.now();
const raw = execFileSync('python3', ['experiments/judge/logprob.py'], { input: JSON.stringify({ model, items, n_ctx: 2048, threads: 6 }), encoding: 'utf8', maxBuffer: 1 << 24 });
const rows = raw.trim().split('\n').map((l) => JSON.parse(l));
const by = Object.fromEntries(rows.map((r) => [r.id, r]));
const perCase = {};
let pass = 0;
for (const c of CASES) {
  const o = by[`${c.id}:original`], p = by[`${c.id}:parrot`], b = by[`${c.id}:boilerplate`];
  const checks = { parrotHasHigherRuleDependence: p.rule_dependence > o.rule_dependence, boilerplateHasLowerSpecificity: b.specificity < o.specificity, originalSpecificityPositive: o.specificity > 0 };
  perCase[c.id] = { original: { rd: +o.rule_dependence.toFixed(3), sp: +o.specificity.toFixed(3) }, parrot: { rd: +p.rule_dependence.toFixed(3), sp: +p.specificity.toFixed(3) }, boilerplate: { rd: +b.rule_dependence.toFixed(3), sp: +b.specificity.toFixed(3) }, checks };
  if (Object.values(checks).every(Boolean)) pass++;
  console.log(`${c.id}: original rd ${o.rule_dependence.toFixed(2)} sp ${o.specificity.toFixed(2)} | parrot rd ${p.rule_dependence.toFixed(2)} sp ${p.specificity.toFixed(2)} | boilerplate rd ${b.rule_dependence.toFixed(2)} sp ${b.specificity.toFixed(2)} | ${Object.values(checks).every(Boolean) ? 'PASS' : `FAIL ${Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`}`);
}
const summary = { casesPassingAllThree: `${pass}/${CASES.length}`, seconds: (Date.now() - t0) / 1000 };
console.log(JSON.stringify(summary));
writeFileSync(`experiments/judge/validate-logprob-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ model, summary, perCase, rows }, null, 2));
process.exit(pass === CASES.length ? 0 : 1);
