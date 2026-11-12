// Auditor: for review.checks-read = false, were the PR's check results on screen before the judgement?
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const T = {}; const out = {};
for (const r of rows) {
  if (r.checks['review.checks-read'] !== false) continue;
  const R = rec(r), spec = specs[r.exp][r.cell], t = eventTable(R);
  const cut = r.facts.firstJudgement ?? Infinity;
  const pre = t.events.filter((e) => e.pos < cut && e.shown);
  const src = (e) => e.command ?? JSON.stringify(e.input);
  const ctxt = R.state.files[`.github-cache/checks-${spec.pr}.txt`]; const checksTxt = String((typeof ctxt === 'string' ? ctxt : ctxt?.text) ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length > 8);
  const rollup = pre.some((e) => new RegExp(String.raw`gh\s+pr\s+view\s+#?${spec.pr}\b`).test(src(e)) && /statusCheckRollup/.test(e.resultText) && /"conclusion"/.test(e.resultText));
  const cacheTxt = pre.some((e) => checksTxt.length && checksTxt.every((l) => e.resultText.includes(l)));
  const local = pre.some((e) => /tools\/check|bash\s+\S*spec|for \w+ in spec/.test(src(e)));
  const cls = rollup ? 'check results on screen via gh pr view (rollup came back, field not named)' : cacheTxt ? 'check results on screen via the cache file' : local ? 'CI results never on screen; ran the checks itself' : 'CI results never on screen';
  const k = `${r.exp}|${r.arm}`; T[k] ??= {}; T[k][cls] = (T[k][cls] ?? 0) + 1;
  out[`${r.exp}|${r.cell}|${r.arm}|${r.k}`] = rollup || cacheTxt;
}
for (const k of Object.keys(T).sort()) console.log(k, JSON.stringify(T[k]));
writeFileSync('experiments/audit-2026-11-12/qm-checks.json', JSON.stringify(out));
