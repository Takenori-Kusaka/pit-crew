#!/usr/bin/env node
// Stage 0c (planning 23 §5): validate the E-series judge items on the scripted set before any
// experiment uses them. Runs each juror over every case (one model at a time), checks quotes
// and context length by program, takes the majority, and writes
// experiments/judge/validation-<date>.json with per item × juror TPR / TNR, perturbation
// stability, invalid rate and arm-fairness flips.
//
// Usage: node packages/pit-wall/src/graders/process/judge/validate.mjs
//          [--jurors claude,qwen,granite] [--dry] [--date YYYY-MM-DD] [--only R2,S2]
// Raw answers are cached in experiments/judge/validation-cache.json, so jurors can be run in
// separate invocations (e.g. Claude from Windows, the open models from WSL) and merged.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundle } from './bundle.mjs';
import { buildPrompt, ITEMS } from './items.mjs';
import { JURORS, NUM_CTX, CTX_LIMIT, estimateTokens, runJuror, settle, majority } from './jurors.mjs';
import { SYSTEM } from './items.mjs';
import { cases } from './validation-set.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const OUT_DIR = join(ROOT, 'experiments/judge');

// Fixed before the first run (planning 23 §4, research §5.2 (a)). Not to be changed after
// seeing results; a change is a new validation.
export const THRESHOLDS = {
  juryTPR: 0.8,
  juryTNR: 0.8,
  armFairnessMaxFlips: 1,
  rule: 'An item is usable only if jury TPR >= 0.8 and jury TNR >= 0.8 on the base cases and the arm-fairness perturbation (same substance, harness format vs plain final answer) flips the jury verdict in at most 1 of its 6 cases.',
  counting: 'TPR = base cases labelled met that got met / base cases labelled met; TNR likewise for not-met. A juror verdict that is invalid (quote not in the bundle, context overflow, error) counts as a miss. The jury verdict needs more than half of the 3 jurors; no majority counts as a miss. A flip is a harness-rendering verdict that differs from the verdict on its plain base case (no verdict counts as different).',
};

// Model cards checked 2026-11-03 (task step 6). Also checked: the licence layer of the pulled
// ollama blobs (~/.local/ollama/models, tag 8b) is the Apache License 2.0 text for both.
export const LICENCES = {
  checked: '2026-11-03',
  'qwen3:8b': { model: 'Qwen/Qwen3-8B', licence: 'Apache-2.0', commercialUse: 'permitted (Apache 2.0; the card states no further restriction)', card: 'https://huggingface.co/Qwen/Qwen3-8B', licenceFile: 'https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE', ollama: 'https://ollama.com/library/qwen3', localBlob: 'licence layer = Apache License 2.0 text', note: 'ollama.com/library/qwen3 page shows no licence; the blob and HF card do' },
  'granite3.3:8b': { model: 'ibm-granite/granite-3.3-8b-instruct', licence: 'Apache-2.0', commercialUse: 'permitted (Apache 2.0; the card states no further restriction)', card: 'https://huggingface.co/ibm-granite/granite-3.3-8b-instruct', licenceFile: 'https://www.apache.org/licenses/LICENSE-2.0', ollama: 'https://ollama.com/library/granite3.3', localBlob: 'licence layer = Apache License 2.0 text', note: 'the ollama page does not name the upstream HF repo for the 8b tag; assumed granite-3.3-8b-instruct' },
};

function args(argv) {
  const a = { jurors: Object.keys(JURORS), dry: false, date: new Date().toISOString().slice(0, 10), only: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--jurors') a.jurors = argv[++i].split(',');
    else if (argv[i] === '--dry') a.dry = true;
    else if (argv[i] === '--date') a.date = argv[++i];
    else if (argv[i] === '--only') a.only = argv[++i].split(',');
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  return a;
}

const rate = (k, n) => (n ? Number((k / n).toFixed(3)) : null);

export function summarise(all, verdictOf) {
  // verdictOf(c) → 'met' | 'not-met' | null
  const base = all.filter((c) => c.set === 'base');
  const pos = base.filter((c) => c.label === 'met'), neg = base.filter((c) => c.label === 'not-met');
  const byId = new Map(all.map((c) => [c.id, c]));
  const pert = all.filter((c) => c.set === 'perturbation');
  const arm = all.filter((c) => c.set === 'arm-fairness');
  const flips = arm.filter((c) => verdictOf(c) == null || verdictOf(c) !== verdictOf(byId.get(c.base)));
  const perPert = {};
  for (const c of pert) {
    const p = (perPert[c.perturbation] ??= { n: 0, asExpected: 0, sameAsBase: 0 });
    p.n++;
    if (verdictOf(c) === c.label) p.asExpected++;
    if (verdictOf(c) != null && verdictOf(c) === verdictOf(byId.get(c.base))) p.sameAsBase++;
  }
  return {
    TPR: rate(pos.filter((c) => verdictOf(c) === 'met').length, pos.length), nMet: pos.length,
    TNR: rate(neg.filter((c) => verdictOf(c) === 'not-met').length, neg.length), nNotMet: neg.length,
    perturbation: {
      n: pert.length,
      asExpected: rate(pert.filter((c) => verdictOf(c) === c.label).length, pert.length),
      // Stability: among perturbations that should not change the verdict (all but 'empty'),
      // the share whose verdict equals this juror's verdict on the unperturbed case.
      stability: (() => { const same = pert.filter((c) => c.label === byId.get(c.base).label); return rate(same.filter((c) => verdictOf(c) != null && verdictOf(c) === verdictOf(byId.get(c.base))).length, same.length); })(),
      byKind: perPert,
    },
    armFairness: { n: arm.length, flips: flips.length, flipped: flips.map((c) => c.id) },
  };
}

async function main() {
  const a = args(process.argv);
  mkdirSync(OUT_DIR, { recursive: true });
  const all = cases().filter((c) => !a.only || a.only.includes(c.item));
  const bundles = new Map(all.map((c) => [c.id, buildBundle(c)]));
  const unique = [...new Map([...bundles.values()].map((b) => [b.hash, b])).values()];
  const est = unique.map((b) => estimateTokens(SYSTEM + buildPrompt(b)));
  console.log(`${all.length} cases, ${unique.length} distinct bundles; prompt tokens (estimated) max ${Math.max(...est)}, mean ${Math.round(est.reduce((s, x) => s + x, 0) / est.length)}; num_ctx ${NUM_CTX} (limit ${CTX_LIMIT * NUM_CTX})`);
  if (a.dry) { console.log(buildPrompt(unique[0])); return; }

  const cachePath = join(OUT_DIR, 'validation-cache.json');
  const cache = new Map(existsSync(cachePath) ? Object.entries(JSON.parse(readFileSync(cachePath, 'utf8'))) : []);
  const save = () => writeFileSync(cachePath, JSON.stringify(Object.fromEntries(cache), null, 1));
  const calls = {};
  for (const name of a.jurors) {
    calls[name] = { n: 0 };
    let k = 0;
    const t0 = Date.now();
    await runJuror(name, unique, {
      cache, calls: calls[name],
      onEach: (b, raw) => { k++; if (k % 10 === 0 || k === unique.length) { save(); console.log(`  ${name} ${k}/${unique.length} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); } if (raw.error) console.log(`  ${name} error on ${b.hash}: ${String(raw.error).slice(0, 160)}`); },
    });
    save();
    console.log(`${name}: ${calls[name].n} new calls`);
  }

  // Settle every juror's answers (missing juror → invalid 'not-run').
  const names = Object.keys(JURORS);
  const settled = new Map();
  for (const c of all) {
    const b = bundles.get(c.id);
    const vs = names.map((n) => {
      const raw = cache.get(`${n}:${JURORS[n].model}:${b.hash}`);
      return raw ? { juror: n, ...settle(b, raw) } : { juror: n, verdict: null, valid: false, invalid: 'not-run' };
    });
    settled.set(c.id, { jurors: vs, jury: majority(vs) });
  }

  const items = {};
  for (const item of ITEMS) {
    const ic = all.filter((c) => c.item === item);
    if (!ic.length) continue;
    const per = {};
    for (const n of names) {
      const vOf = (c) => { const v = settled.get(c.id).jurors.find((x) => x.juror === n); return v.valid ? v.verdict : null; };
      const inv = ic.map((c) => settled.get(c.id).jurors.find((x) => x.juror === n)).filter((v) => !v.valid);
      const reasons = {};
      for (const v of inv) reasons[v.invalid] = (reasons[v.invalid] ?? 0) + 1;
      per[n] = { ...summarise(ic, vOf), invalidRate: rate(inv.length, ic.length), invalidReasons: reasons };
    }
    const jOf = (c) => settled.get(c.id).jury.verdict;
    const jury = { ...summarise(ic, jOf), splitRate: rate(ic.filter((c) => settled.get(c.id).jury.split).length, ic.length), noMajority: ic.filter((c) => settled.get(c.id).jury.noMajority).length };
    const usable = jury.TPR >= THRESHOLDS.juryTPR && jury.TNR >= THRESHOLDS.juryTNR && jury.armFairness.flips <= THRESHOLDS.armFairnessMaxFlips;
    items[item] = { usable, jury, jurors: per };
  }

  const complete = names.every((n) => all.every((c) => settled.get(c.id).jurors.find((v) => v.juror === n).invalid !== 'not-run'));
  const report = {
    header: {
      stage: '0c (planning 23 §5): judge jury for the E-series semantic items, scripted validation',
      date: a.date, complete,
      thresholds: THRESHOLDS,
      jurors: Object.fromEntries(names.map((n) => [n, { ...JURORS[n], ...(JURORS[n].kind === 'ollama' ? { num_ctx: NUM_CTX, temperature: 0, seed: 0, contextLimit: `${CTX_LIMIT} × num_ctx (prompt_eval_count, and a char/3.2 estimate as a second guard)` } : { via: 'claude -p on the subscription (ANTHROPIC_API_KEY removed), tool-less; temperature not settable' }) }])),
      licences: LICENCES,
      set: { cases: all.length, distinctBundles: unique.length, perItem: Object.fromEntries(ITEMS.map((i) => [i, all.filter((c) => c.item === i).length])), note: 'Synthetic generic software tasks (not the experiment cells). 3 good/bad pairs per item (bad breaks one thing), arm-fairness = same 6 cases in harness rendering, 8 further perturbations on the first scenario of each item. Identical bundles are asked once per juror.' },
      callsThisInvocation: Object.fromEntries(Object.entries(calls).map(([k, v]) => [k, v.n])),
    },
    items,
    cases: all.map((c) => ({ id: c.id, item: c.item, set: c.set, perturbation: c.perturbation ?? null, label: c.label, bundle: bundles.get(c.id).hash, jury: settled.get(c.id).jury, jurors: settled.get(c.id).jurors.map((v) => ({ juror: v.juror, verdict: v.verdict, valid: v.valid, invalid: v.invalid, note: v.note, promptTokens: v.promptTokens ?? null, reasoning: String(v.reasoning ?? '').slice(0, 400), quotes: v.quotes })) })),
  };
  const outPath = join(OUT_DIR, `validation-${a.date}.json`);
  writeFileSync(outPath, `${JSON.stringify(report, null, 1)}\n`);

  console.log(`\nwrote ${outPath}${complete ? '' : ' (INCOMPLETE: some jurors not run)'}`);
  console.log('item juror     TPR   TNR   pert.stab pert.exp arm-flips invalid');
  for (const [item, r] of Object.entries(items)) {
    for (const [n, s] of [...Object.entries(r.jurors), ['jury', r.jury]]) {
      console.log(`${item.padEnd(4)} ${n.padEnd(9)} ${String(s.TPR).padEnd(5)} ${String(s.TNR).padEnd(5)} ${String(s.perturbation.stability).padEnd(9)} ${String(s.perturbation.asExpected).padEnd(8)} ${`${s.armFairness.flips}/${s.armFairness.n}`.padEnd(9)} ${n === 'jury' ? `split ${s.splitRate}` : `${s.invalidRate} ${JSON.stringify(s.invalidReasons)}`}`);
    }
    console.log(`${item} usable: ${r.usable}`);
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('graders/process/judge/validate.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
