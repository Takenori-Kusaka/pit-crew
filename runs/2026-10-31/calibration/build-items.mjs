// Build the blind labelling set: 30 judge-graded runs, no arm and no verdicts shown.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { toolCalls } from '../../packages/pit-wall/src/normalize/claude-stream.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const suite = loadSuite(`${ROOT}../suites/_examples/evaluator-check/suite.yaml`);
const cases = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
const load = (p) => { try { return JSON.parse(readFileSync(`${ROOT}${p}`, 'utf8')); } catch { return null; } };
const verdicts = (dir, model) => Object.fromEntries((load(`${dir}/judge-${model}.json`) ?? []).map((x) => [`${x.arm}|${x.case}|${x.trial}`, x.pitwall]));

const pools = [
  { dir: 'pw-d1-vendor2', runner: 'claude-plugin-eval', pick: () => true },
  { dir: 'pw-h-d1', runner: 'harbor', pick: (r) => r.validity?.status !== 'invalid' },
  { dir: 'pw-d1-check', runner: 'claude-plugin-eval', pick: (r) => r.case === 'tie-conflict' && (r.arm === 'vanilla' || (r.arm === 'path:bad-control' && r.trial === 1)) },
];
const items = [];
for (const p of pools) {
  const doc = load(`${p.dir}/results.json`);
  const h = verdicts(p.dir, 'haiku'), s = verdicts(p.dir, 'claude-sonnet-5-5');
  for (const r of doc.records.filter((r) => r.trajectory && p.pick(r))) {
    const kase = cases[r.case];
    const g = kase.graders.find((x) => x.type === 'judge');
    if (!g) continue;
    const key = `${r.arm}|${r.case}|${r.trial}`;
    items.push({
      source: { dir: p.dir, runner: p.runner, arm: r.arm, case: r.case, trial: r.trial },
      judges: { haiku: h[key] ?? r.judged?.[g.name]?.passed ?? null, sonnet: s[key] ?? null, native: r.native?.[g.name] ?? null },
      view: {
        case: r.case,
        task: kase.prompt,
        docs: Object.entries(kase.files).map(([path, text]) => ({ path, text })),
        actions: toolCalls(r.trajectory).filter((c) => c.extra.kind === 'execute' || c.extra.kind === 'edit').map((c) => String(c.arguments.command ?? c.arguments.file_path ?? '')),
        reply: r.trajectory.final_message,
      },
    });
  }
}
// Deterministic shuffle, then ids that reveal nothing.
let seed = 20261031;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
items.forEach((it, i) => { it.id = `c${String(i + 1).padStart(2, '0')}`; });
writeFileSync(`${ROOT}calibration/items-key.json`, JSON.stringify(items, null, 2));
writeFileSync(`${ROOT}calibration/items-blind.json`, JSON.stringify(items.map(({ id, view }) => ({ id, ...view }))));
const split = items.reduce((a, it) => ((a[`${it.source.case}/${it.source.arm}`] = (a[`${it.source.case}/${it.source.arm}`] ?? 0) + 1), a), {});
const disagree = items.filter((it) => it.judges.haiku !== it.judges.sonnet && it.judges.sonnet !== null).length;
console.log(items.length, 'items', JSON.stringify(split), 'haiku!=sonnet:', disagree);
