#!/usr/bin/env node
// Process-evidence graders over pit-wall results (design 23 stage 0a: deterministic only).
//
// Usage:
//   node packages/pit-wall/src/graders/process/cli.mjs <results.json> [...more] [options]
// Options:
//   --trajectory T0|T1|T2   expected trajectory for every case (default T1)
//   --bug                   the cells are bug fixes (requires a failure observation)
//   --base[=stale]          require the base check (and, with =stale, bringing main in)
//   --impl-files a,b        extra files whose edit is the implementation (e.g. README.md)
//   --spec spec.json        per-case registration: { "<case>": { trajectory, bug, base, implFiles }, "*": {...} }
//                           a review cell registers { role: "review", pr, issue, specDocs, changedFiles,
//                           judgementLabels, passLabels, escalationLabels, decisionWords, author,
//                           checksBad, question } (review-phases.mjs)
//   --rows                  print one line per record
//   --json                  print JSON ({ rows, arms }) instead of text
// The expected trajectory and cell facts are the evaluator's registration, never read from
// the agent (research §2.1). Records of scripted controls (no trajectory) are skipped, and
// records whose validity is 'invalid' are listed but not aggregated.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { eventTable } from './events.mjs';
import { authoredTexts } from './authored.mjs';
import { visibility } from './visibility.mjs';
import { gradePhases, CONSTRAINTS } from './phases.mjs';
import { gradeReview, REVIEW_CONSTRAINTS } from './review-phases.mjs';
import { gradeFix, FIX_CONSTRAINTS } from './fix-phases.mjs';
import { gradeGrounding } from './grounding.mjs';

// opts.role: 'dev' (default; the cut is the first implementation edit), 'review' (the cut is the
// first judgement; review-phases.mjs) or 'fix' (first / last edit; fix-phases.mjs). The spec
// registers it per case.
export function gradeRecord(record, opts) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  const vis = visibility(table, authored);
  const phases = opts.role === 'review' ? gradeReview(record, { ...opts, table, authored, vis })
    : opts.role === 'fix' ? gradeFix(record, { ...opts, table, authored, vis })
    : gradePhases(record, { ...opts, table, authored, vis });
  const grounding = gradeGrounding(record, { table, authored, vis });
  return { phases, grounding };
}

export function optsFor(kase, spec, defaults) {
  return { ...defaults, ...(spec['*'] ?? {}), ...(spec[kase] ?? {}) };
}

// Records stored before normalize/atif.mjs kept the instruction: read it from the raw
// trajectory.json under the run directory (<trial>/agent/trajectory.json).
export function rawInstructions(runDir) {
  const out = new Map();
  const walk = (d, depth) => {
    let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const n of ents) if (n.isDirectory()) {
      const p = join(d, n.name);
      const tf = join(p, 'agent', 'trajectory.json');
      if (existsSync(tf)) {
        try {
          const t = JSON.parse(readFileSync(tf, 'utf8'));
          const first = (t.steps ?? []).findIndex((s) => s.source === 'agent');
          const msgs = (t.steps ?? []).slice(0, first === -1 ? undefined : first).filter((s) => s.source === 'user')
            .map((s) => (typeof s.message === 'string' ? s.message : (s.message ?? []).map?.((x) => x.text ?? '').join('') ?? ''));
          out.set(n.name, msgs.join('\n'));
        } catch { /* unreadable trajectory: no instruction */ }
      } else if (depth < 4) walk(p, depth + 1);
    }
  };
  walk(runDir, 0);
  return out;
}

const mean = (xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

export function aggregate(rows) {
  const arms = {};
  for (const r of rows.filter((x) => x.valid)) {
    const a = (arms[r.arm] ??= { n: 0, B: [], E: [], missing: {}, cites: { O: 0, P: 0, M: 0, N: 0, X: 0, U: 0 }, locators: 0, nx: 0, u: 0, callsBeforeImpl: [], filesOpenedBeforeImpl: [], failureObserved: 0, noImpl: 0, claims: { ok: 0, stale: 0, unsupported: 0, 'failed-run': 0 }, outcomes: {}, harm: {} });
    a.n++;
    a.B.push(r.B.share); a.E.push(r.E.share);
    for (const m of [...r.B.missing, ...r.E.missing]) a.missing[m] = (a.missing[m] ?? 0) + 1;
    for (const [k, v] of Object.entries(r.cites)) a.cites[k] += v;
    a.locators += r.locators; a.nx += r.nx; a.u += r.uLoc;
    a.callsBeforeImpl.push(r.callsBeforeImpl); a.filesOpenedBeforeImpl.push(r.filesOpenedBeforeImpl);
    a.failureObserved += r.failureObserved ? 1 : 0; a.noImpl += r.firstImpl == null ? 1 : 0;
    for (const c of r.claims) a.claims[c] = (a.claims[c] ?? 0) + 1;
    a.outcomes[r.outcome ?? 'none'] = (a.outcomes[r.outcome ?? 'none'] ?? 0) + 1;
    // Harm flags (fix role): runs where the flag is true, and runs where it could not be decided.
    for (const [k, v] of Object.entries(r.harm ?? {})) { const h = (a.harm[k] ??= { yes: 0, undecided: 0 }); if (v === true) h.yes++; else if (v == null) h.undecided++; }
  }
  return Object.fromEntries(Object.entries(arms).map(([k, a]) => [k, {
    n: a.n, B: mean(a.B), E: mean(a.E), missing: a.missing, cites: a.cites, locators: a.locators,
    nxRate: a.locators ? a.nx / a.locators : null, uRate: a.locators ? a.u / a.locators : null,
    callsBeforeImpl: mean(a.callsBeforeImpl), filesOpenedBeforeImpl: mean(a.filesOpenedBeforeImpl),
    failureObserved: a.failureObserved, noImpl: a.noImpl, claims: a.claims, outcomes: a.outcomes, harm: a.harm,
  }]));
}

function parseArgs(argv) {
  const files = [], o = { defaults: { trajectory: 'T1', bug: false, base: false, implFiles: [] }, spec: {}, rows: false, json: false };
  for (let k = 0; k < argv.length; k++) {
    const a = argv[k];
    if (a === '--trajectory') o.defaults.trajectory = argv[++k];
    else if (a.startsWith('--trajectory=')) o.defaults.trajectory = a.split('=')[1];
    else if (a === '--bug') o.defaults.bug = true;
    else if (a === '--base') o.defaults.base = true;
    else if (a === '--base=stale') o.defaults.base = 'stale';
    else if (a === '--impl-files') o.defaults.implFiles = argv[++k].split(',').filter(Boolean);
    else if (a === '--spec') o.spec = JSON.parse(readFileSync(argv[++k], 'utf8'));
    else if (a === '--rows') o.rows = true;
    else if (a === '--json') o.json = true;
    else if (a.startsWith('--')) throw new Error(`unknown option: ${a}`);
    else files.push(a);
  }
  return { files, ...o };
}

const pct = (x) => (x == null ? '-' : `${(100 * x).toFixed(0)}%`);
const f1 = (x) => (x == null ? '-' : x.toFixed(1));

export function main(argv) {
  const { files, defaults, spec, rows: showRows, json } = parseArgs(argv);
  if (!files.length) { console.error('usage: cli.mjs <results.json> [...] [--trajectory T1] [--bug] [--base[=stale]] [--spec f] [--rows] [--json]'); return 1; }
  const rows = [];
  for (const f of files) {
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    let raw = null;
    for (const r of doc.records ?? []) {
      if (!r.trajectory || String(r.arm).startsWith('script:')) continue;
      if (!r.trajectory.extra?.pitwall?.instruction && r.instruction == null && r.harborTrial) {
        raw ??= rawInstructions(dirname(f));
        r.instruction = raw.get(r.harborTrial) ?? null;
      }
      const opts = optsFor(r.case, spec, defaults);
      const g = gradeRecord(r, opts);
      const loc = g.grounding.citations.filter((c) => ['path', 'symbol', 'command', 'url', 'issue', 'commit'].includes(c.type));
      rows.push({
        file: f, arm: r.arm, case: r.case, trial: r.trial ?? r.harborTrial, valid: r.validity?.status !== 'invalid', outcome: r.outcome ?? null,
        trajectory: opts.trajectory, B: g.phases.B, E: g.phases.E,
        firstImpl: g.phases.facts.firstImpl, callsBeforeImpl: g.phases.facts.callsBeforeImpl, filesOpenedBeforeImpl: g.phases.facts.filesOpenedBeforeImpl,
        failureObserved: g.phases.facts.failureObserved?.via ?? null, claims: g.phases.facts.claims.map((c) => c.status),
        cites: g.grounding.counts, locators: g.grounding.locators, nx: g.grounding.nx, uLoc: loc.filter((c) => c.cls === 'U').length,
        nxRate: g.grounding.nxRate, harm: g.phases.harm ?? null,
      });
    }
  }
  const arms = aggregate(rows);
  if (json) { console.log(JSON.stringify({ rows, arms }, null, 2)); return 0; }
  if (showRows) for (const r of rows) console.log(`${r.arm} | ${r.case} | ${r.trial} | B ${r.B.satisfied}/${r.B.required} E ${r.E.satisfied}/${r.E.required} | missing: ${[...r.B.missing, ...r.E.missing].join(',') || '-'} | cites O${r.cites.O} P${r.cites.P} M${r.cites.M} N${r.cites.N} X${r.cites.X} U${r.cites.U} | N+X ${pct(r.nxRate)}${r.valid ? '' : ' | INVALID'}`);
  const ids = [...CONSTRAINTS, ...REVIEW_CONSTRAINTS, ...FIX_CONSTRAINTS].map((c) => c.id);
  for (const [arm, a] of Object.entries(arms)) {
    console.log(`\n${arm}  (n=${a.n})`);
    console.log(`  precedence satisfied: B ${pct(a.B)}  E ${pct(a.E)}   (B and E are separate series; not summed)`);
    console.log(`  missing: ${ids.filter((k) => a.missing[k]).map((k) => `${k}=${a.missing[k]}`).join(' ') || '-'}`);
    console.log(`  before first impl edit: calls ${f1(a.callsBeforeImpl)}, files opened ${f1(a.filesOpenedBeforeImpl)}, failure observed ${a.failureObserved}/${a.n}, no impl edit ${a.noImpl}`);
    console.log(`  pass claims: ${Object.entries(a.claims).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    console.log(`  citations: O ${a.cites.O} P ${a.cites.P} M ${a.cites.M} N ${a.cites.N} X ${a.cites.X} U ${a.cites.U} | locators ${a.locators}, N+X ${pct(a.nxRate)}, U ${pct(a.uRate)}`);
    if (Object.keys(a.harm).length) console.log(`  harm (runs with the flag / undecided): ${Object.entries(a.harm).map(([k, v]) => `${k}=${v.yes}${v.undecided ? `/?${v.undecided}` : ''}`).join(' ')}`);
    console.log(`  outcome (auxiliary): ${Object.entries(a.outcomes).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
  const inv = rows.filter((r) => !r.valid).length;
  if (inv) console.log(`\ninvalid (excluded from aggregates): ${inv}`);
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('graders/process/cli.mjs')) process.exitCode = main(process.argv.slice(2));
