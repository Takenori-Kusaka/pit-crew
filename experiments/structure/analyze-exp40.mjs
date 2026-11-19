// EXP-40 analysis, fixed before the run (card: docs/experiments/EXP-20261104-40-decision-point-list.md).
// E2 per trial: before the first implementation edit, a block headed 判断の点 whose items are each
// answered (>= 2 labelled options, or 自明 in any form with a reason), or an explicit "なし（理由）".
// v7 vs default on the 3 main cells (Fisher two-sided); guards as EXP-39.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { extractOptions } from '../../packages/pit-wall/src/graders/process/judge/score-runs.mjs';
import { errorOf } from '../jobsel/judge.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const MAIN = { 't5-stale-base-weak': 'experiments/process/spec-dev-cells.json', 'h5-a1': 'experiments/heldout-s5/process-spec.json', 'd3-3': 'experiments/d3/process-spec.json' };
const ARMS = ['default', 'v7'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
let seed = 20261104; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

const OPTION_LABEL = /案\s*[A-Za-zＡ-Ｚ0-9０-９一二三四五１-５]|(?:^|\s)(?:Option|option|Plan)\s*[A-Z0-9]/g;
const OBVIOUS = /自明/;
const REASON = /(理由|ため|から|なので|だから|because|since)/;
const NONE = /判断の点\s*[:：]?\s*(なし|無し|ない|none)/i;

// Items of the first block headed 判断の点 (until the next heading or a blank-line-separated non-list).
function decisionBlock(text) {
  const lines = String(text).split('\n');
  const h = lines.findIndex((l) => /^#{1,6}\s*.*判断の点|^\*\*判断の点|^判断の点\s*[:：]?\s*$/.test(l.trim()));
  if (h < 0) return null;
  const items = [];
  for (let i = h + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,6}\s/.test(l)) break;
    if (/^\s*([-*+・]|\d+[.)]|[①-⑩])\s+/.test(l)) items.push(l.replace(/^\s*([-*+・]|\d+[.)]|[①-⑩])\s+/, ''));
    else if (/^\s*\|/.test(l) && !/^\s*\|?\s*:?-{3,}/.test(l) && items.length + 1 > 0 && i > h + 1) items.push(l);
    else if (items.length && l.trim() && /^\s{2,}\S/.test(l)) items[items.length - 1] += ` ${l.trim()}`;
  }
  return { heading: lines[h], items: items.filter((x) => !/^\s*\|?\s*(判断の点|点|項目)\s*\|/.test(x)) };
}
export function classifyItem(item) {
  const labels = new Set((item.match(OPTION_LABEL) ?? []).map((s) => s.replace(/\s+/g, '')));
  if (labels.size >= 2 || extractOptions([{ text: item }]).length >= 2) return 'compared';
  if (OBVIOUS.test(item) && REASON.test(item)) return 'obvious';
  if (OBVIOUS.test(item)) return 'obvious-no-reason';
  return 'unanswered';
}
export function e2(record) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  // Post-hoc fix (2026-11-04, after EXP-39/40 were judged): the first write in every M-skill trial was
  // .gitignore (the state-file rule), which fileRole does not class as notes/docs/test, so the cut sat
  // at the first action and every later note was excluded. The implementation edit is now a write to
  // an 'impl' file. The preregistered verdicts were computed with the old cut and stand as recorded.
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  const before = authored.filter((a) => (a.pos ?? 0) < cut);
  let best = null;
  for (const a of before) {
    const t = String(a.text);
    if (NONE.test(t)) { const m = t.match(new RegExp(`${NONE.source}[^\\n]*`, 'i')); if (m && REASON.test(m[0])) return { e2: true, kind: 'none', items: 0, classes: [] }; }
    const b = decisionBlock(t);
    if (b && b.items.length && (!best || b.items.length > best.items.length)) best = b;
  }
  if (!best) return { e2: false, kind: 'no-block', items: 0, classes: [] };
  const classes = best.items.map(classifyItem);
  const ok = classes.every((c) => c === 'compared' || c === 'obvious');
  return { e2: ok, kind: ok ? 'list' : 'list-unanswered', items: best.items.length, classes };
}

if (process.argv[1]?.endsWith('analyze-exp40.mjs')) {
  const t = {};
  for (const a of ARMS) {
    t[a] = { e2: 0, n: 0, inv: 0, B: [], per: {}, kinds: {}, classes: {}, designCalled: 0 };
    for (const [c, spec] of Object.entries(MAIN)) {
      const p = join(root, `exp40-${c}-${a}`, 'results.json');
      if (!existsSync(p)) stop(`missing exp40-${c}-${a}`);
      const recs = JSON.parse(readFileSync(p, 'utf8')).records;
      if (recs.length !== 10) stop(`exp40-${c}-${a}: ${recs.length}/10`);
      const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', p, '--spec', spec, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
      for (const r of out.rows.filter((r) => r.valid)) t[a].B.push(r.B?.share ?? 0);
      let k = 0, n = 0;
      for (const r of recs) {
        if (r.validity?.status === 'invalid') { t[a].inv++; continue; }
        const x = e2(r); n++; t[a].n++;
        if (x.e2) { k++; t[a].e2++; }
        t[a].kinds[x.kind] = (t[a].kinds[x.kind] ?? 0) + 1;
        for (const cl of x.classes) t[a].classes[cl] = (t[a].classes[cl] ?? 0) + 1;
        const calls = (r.trajectory?.steps ?? []).flatMap((s) => s.tool_calls ?? []);
        if (calls.some((x) => (x.function_name ?? x.name) === 'Skill' && JSON.stringify(x.arguments ?? '').includes('dev-phase-2-design'))) t[a].designCalled++;
      }
      t[a].per[c] = `${k}/${n}`;
    }
    const cp = join(root, `exp40-js-1b-${a}`, 'results.json');
    if (!existsSync(cp)) stop(`missing exp40-js-1b-${a}`);
    const crecs = JSON.parse(readFileSync(cp, 'utf8')).records;
    if (crecs.length !== 10) stop(`exp40-js-1b-${a}: ${crecs.length}/10`);
    t[a].heavy = crecs.filter((r) => r.validity?.status !== 'invalid' && errorOf(r) === 'too-heavy').length;
    if (t[a].inv > 3) stop(`invalid ${t[a].inv} in ${a}`);
  }
  console.log('| arm | E2 decision points answered | per cell | kinds | item classes | design skill called | js-1b too-heavy | B share | invalid |\n|---|---|---|---|---|---|---|---|---|');
  for (const a of ARMS) console.log(`| ${a} | ${t[a].e2}/${t[a].n} | ${Object.entries(t[a].per).map(([c, v]) => `${c} ${v}`).join(', ')} | ${JSON.stringify(t[a].kinds)} | ${JSON.stringify(t[a].classes)} | ${t[a].designCalled}/${t[a].n} | ${t[a].heavy}/10 | ${mean(t[a].B).toFixed(3)} | ${t[a].inv} |`);
  const p = fisher(t.v7.e2, t.v7.n - t.v7.e2, t.default.e2, t.default.n - t.default.e2);
  const d = t.v7.B, b = t.default.B; const ds = [];
  for (let i = 0; i < 10000; i++) ds.push(mean(d.map(() => d[Math.floor(rnd() * d.length)])) - mean(b.map(() => b[Math.floor(rnd() * b.length)])));
  ds.sort((x, y) => x - y);
  const guardHeavy = t.v7.heavy <= t.default.heavy + 1, guardB = ds[250] > -0.05;
  const raises = p < 0.05 && t.v7.e2 / t.v7.n > t.default.e2 / t.default.n;
  console.log(`\nE2 v7 vs default: Fisher p ${p.toFixed(4)} -> ${raises ? 'RAISES' : 'NOT SHOWN'}; guards: too-heavy ${guardHeavy ? 'ok' : 'VIOLATED'} (${t.v7.heavy} vs ${t.default.heavy}), B non-inferiority ${guardB ? 'ok' : 'VIOLATED'} (lower ${ds[250].toFixed(3)})`);
  console.log(raises && guardHeavy && guardB ? 'ADOPT CONDITION MET' : 'adopt condition not met');
}
