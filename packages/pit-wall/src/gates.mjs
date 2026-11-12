#!/usr/bin/env node
// Gates (docs/planning/33-evaluation-process-v2.md P5): a main run starts only when the verdict
// files of the gates it needs exist, say PASS, and were written by a role that may write them.
//
//   gates/<experiment>/<gate>.json
//   { "gate": "G4", "experiment": "exp48", "verdict": "PASS" | "FAIL" | ...,
//     "date": "YYYY-MM-DD",
//     "written_by": { "role": "auditor ...", "role_id": "auditor", "lineage": "..." },
//     "inputs": [ { "path": "gates/exp48/G4.result.json", "sha256": "..." }, { "ref": "plan", "commit": "..." } ],
//     "numbers": { ... }, "open_items": [ ... ] }
//
// The role is `written_by.role_id`, or else the first word of `written_by.role`. The designer
// writes no verdict; the implementer writes none for the gates on its own work (G4, G2).
// An input given with a path and a sha256 is compared with the file as it is now: a verdict
// about a file that has changed since is not a verdict about this file.
//
//   node packages/pit-wall/src/gates.mjs check <exp> --need G5,G4,G2 [--root gates] [--repo .]
//   node packages/pit-wall/src/gates.mjs no-gq-content [--all] [--base <commit>] ...   (gq-content.mjs)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROLES = ['owner', 'reviewer', 'auditor', 'machine', 'implementer', 'designer', 'author', 'rederiver', 'repairer', 'planter'];
const ALWAYS_FORBIDDEN = ['designer'];
// Process v2 §5: the implementer does not write the verdict of the gates on its own instruments;
// the repairer does not accept its own repair; the cell author does not audit its own cells.
export const FORBIDDEN = { G4: ['implementer'], G4b: ['implementer'], G2: ['implementer'], G1: ['repairer', 'author', 'implementer'], G1b: ['repairer', 'author', 'implementer'], G5: ['implementer', 'author'] };

export const sha256File = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

export function roleId(doc) {
  const w = doc?.written_by ?? {};
  if (typeof w.role_id === 'string' && w.role_id.trim()) return w.role_id.trim().toLowerCase();
  const m = String(w.role ?? '').trim().toLowerCase().match(/^[a-z][a-z-]*/);
  return m ? m[0] : null;
}

// Schema errors of one verdict document (empty = well formed). `gate` is the name it is filed under.
export function validateGate(doc, gate) {
  const e = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return ['not a JSON object'];
  if (doc.gate !== gate) e.push(`gate is ${JSON.stringify(doc.gate)}, filed as ${gate}`);
  if (typeof doc.verdict !== 'string' || !doc.verdict.trim()) e.push('verdict is missing');
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(doc.date ?? ''))) e.push('date is missing (YYYY-MM-DD)');
  const role = roleId(doc);
  if (!role) e.push('written_by.role is missing');
  else if (!ROLES.includes(role)) e.push(`unknown role ${JSON.stringify(role)} (known: ${ROLES.join(', ')})`);
  if (typeof doc.written_by?.lineage !== 'string' || !doc.written_by.lineage.trim()) e.push('written_by.lineage is missing');
  // What the verdict is about, pinned: `inputs`, or the plan commit a plan review names.
  const inputs = doc.inputs;
  if (inputs !== undefined) {
    if (!Array.isArray(inputs) || !inputs.length) e.push('inputs must be a non-empty list');
    else inputs.forEach((x, i) => { if (!x || !(x.commit || x.sha256)) e.push(`inputs[${i}] has neither commit nor sha256`); });
  } else if (!/^[0-9a-f]{40}$/.test(String(doc.plan?.commit ?? ''))) e.push('inputs is missing (and no plan.commit)');
  if (doc.numbers !== undefined && (typeof doc.numbers !== 'object' || doc.numbers === null)) e.push('numbers must be an object');
  if (doc.open_items !== undefined && !Array.isArray(doc.open_items)) e.push('open_items must be a list');
  return e;
}

// One gate: { gate, ok, reason, role, verdict }.
export function checkGate(exp, gate, { root = 'gates', repo = '.' } = {}) {
  const file = join(resolve(repo, root), exp, `${gate}.json`);
  const out = (ok, reason, extra = {}) => ({ gate, ok, reason, file, ...extra });
  if (!existsSync(file)) return out(false, 'verdict file is missing');
  let doc;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (err) { return out(false, `verdict file is not JSON: ${err.message}`); }
  const errors = validateGate(doc, gate);
  const role = roleId(doc);
  const extra = { role, verdict: doc.verdict ?? null };
  if (errors.length) return out(false, `malformed: ${errors.join('; ')}`, extra);
  const banned = [...ALWAYS_FORBIDDEN, ...(FORBIDDEN[gate] ?? [])];
  if (banned.includes(role)) return out(false, `written by a role that may not write this gate (${role})`, extra);
  if (doc.verdict.trim() !== 'PASS') return out(false, `verdict is ${JSON.stringify(doc.verdict)}, not PASS`, extra);
  for (const x of doc.inputs ?? []) {
    if (!x.path || !x.sha256) continue;
    const p = resolve(repo, x.path);
    if (!existsSync(p)) return out(false, `input ${x.path} is missing`, extra);
    if (sha256File(p) !== x.sha256) return out(false, `input ${x.path} has changed since the verdict`, extra);
  }
  return out(true, 'PASS', extra);
}

export function checkGates(exp, need, opts = {}) {
  const gates = need.map((g) => checkGate(exp, g, opts));
  return { exp, ok: gates.length > 0 && gates.every((g) => g.ok), gates };
}

const opt = (args, name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args[i + 1]; };

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'check') {
    const exp = rest[0];
    const need = (opt(rest, 'need') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!exp || exp.startsWith('--') || !need.length) { process.stderr.write('usage: gates.mjs check <exp> --need G5,G4,... [--root gates] [--repo .]\n'); return 2; }
    const r = checkGates(exp, need, { root: opt(rest, 'root') ?? 'gates', repo: opt(rest, 'repo') ?? '.' });
    for (const g of r.gates) process.stdout.write(`${g.ok ? 'ok  ' : 'STOP'} ${exp}/${g.gate}: ${g.reason}${g.role ? ` (written by ${g.role})` : ''}\n`);
    if (!r.ok) process.stdout.write(`gates not passed for ${exp}: not starting\n`);
    return r.ok ? 0 : 1;
  }
  if (cmd === 'no-gq-content') {
    const { cli } = await import('./realrepo/gq-content.mjs');
    return cli(rest);
  }
  process.stderr.write('usage: gates.mjs check <exp> --need G5,G4,... | no-gq-content [--all]\n');
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).then((c) => process.exit(c));
