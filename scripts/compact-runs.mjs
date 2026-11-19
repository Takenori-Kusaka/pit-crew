#!/usr/bin/env node
// Cut a run directory of the exploratory period (runs/2026-*/<run>/) down to what a reader of the report needs:
// one record per trial with its verdicts, and no logs.
//
//   node scripts/compact-runs.mjs [--write] [runs/2026-11-03 ...]
//
// For every <run>/results.json it writes <run>/records.json:
//   - the head of results.json as it was (suite, arms, model, runner, time)
//   - per trial: arm, case, trial number, the grader's rows (results), outcome, passed, validity, cost, versions,
//     the agent's last message, the number of steps, the checks and commands of the end state
//   - left out: the steps of the session (trajectory.steps), the files of the end state (state.files), the commit
//     list of the end state (state.git), any text longer than LIMIT characters (cut, with the original length)
// Without --write it only prints what it would write. It deletes nothing; the raw files are removed from git in a
// separate step, after a full copy of the repository (all history) was put in a bundle outside the repository.
// Made 2026-11-19 for the tidy-up of the repository (docs/planning/00-owner-statements.md, same date).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT = 3000;
const args = process.argv.slice(2);
const write = args.includes('--write');
const roots = args.filter((a) => !a.startsWith('--'));
if (roots.length === 0) for (const d of readdirSync('runs')) if (/^2026-\d\d-\d\d$/.test(d)) roots.push(join('runs', d));

const cut = (v) => {
  if (typeof v === 'string') return v.length > LIMIT ? { cut: v.slice(0, LIMIT), original_length: v.length } : v;
  if (Array.isArray(v)) return v.map(cut);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cut(x)]));
  return v;
};

const compactRecord = (r) => {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === 'trajectory') {
      o.trajectory = v && typeof v === 'object'
        ? { steps: Array.isArray(v.steps) ? v.steps.length : null, final_message: cut(v.final_message ?? null), agent: cut(v.agent ?? null) }
        : v;
    } else if (k === 'state') {
      if (v && typeof v === 'object') {
        const { files, git, ...rest } = v;
        o.state = { ...cut(rest), files: files && typeof files === 'object' ? Object.keys(files).length : null, git_left_out: git != null };
      } else o.state = v;
    } else o[k] = cut(v);
  }
  return o;
};

let nRuns = 0, nRecords = 0, inBytes = 0, outBytes = 0;
const odd = [];
for (const root of roots) {
  for (const name of readdirSync(root).sort()) {
    const dir = join(root, name);
    if (!statSync(dir).isDirectory()) continue;
    const src = join(dir, 'results.json');
    if (!existsSync(src)) { odd.push(`${dir}: no results.json`); continue; }
    const text = readFileSync(src, 'utf8');
    let data;
    try { data = JSON.parse(text); } catch (e) { odd.push(`${dir}: results.json does not parse (${e.message})`); continue; }
    const { records, ...head } = data;
    if (!Array.isArray(records)) { odd.push(`${dir}: results.json has no records array`); continue; }
    // one trial per line, so that the file can be read and compared line by line
    const headText = JSON.stringify({
      compacted: { from: 'results.json', by: 'scripts/compact-runs.mjs', text_limit: LIMIT, original_bytes: Buffer.byteLength(text) },
      ...cut(head),
    });
    const out = `${headText.slice(0, -1)},"records":[\n${records.map((r) => JSON.stringify(compactRecord(r))).join(',\n')}\n]}\n`;
    nRuns++; nRecords += records.length; inBytes += Buffer.byteLength(text); outBytes += Buffer.byteLength(out);
    if (write) writeFileSync(join(dir, 'records.json'), out);
  }
}
console.log(JSON.stringify({ write, roots: roots.length, runs: nRuns, records: nRecords, in_mb: +(inBytes / 1048576).toFixed(1), out_mb: +(outBytes / 1048576).toFixed(1), odd }, null, 1));
