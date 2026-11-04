// L3 contract: a suite.yaml says WHAT to evaluate and HOW each pattern applies.
// It never says how to run, grade, or compute statistics.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import YAML from 'yaml';
import { createHash } from 'node:crypto';
import { buildCase } from './patterns/index.mjs';

const KINDS = new Set(['contract', 'behavior', 'judge']);
const DEFAULT_TRIALS = { contract: 1, behavior: 3, judge: 3 };

export function loadSuite(path) {
  const raw = YAML.parse(readFileSync(path, 'utf8'), { merge: true }); // `<<: *anchor` shares a cell's params
  const base = dirname(resolve(path));
  const errors = [];
  if (!raw?.subject?.path) errors.push('subject.path is required');
  if (!Array.isArray(raw?.arms) || raw.arms.length < 2) errors.push('arms needs at least a baseline and a candidate');
  if (!Array.isArray(raw?.cases) || !raw.cases.length) errors.push('cases is required');
  for (const [i, c] of (raw?.cases ?? []).entries()) {
    if (!c.id) errors.push(`cases[${i}].id is required`);
    if (!c.pattern) errors.push(`cases[${i}].pattern is required`);
    if (!KINDS.has(c.kind)) errors.push(`cases[${i}].kind must be one of ${[...KINDS].join(', ')}`);
  }
  const ids = new Set((raw?.cases ?? []).map((c) => c.id));
  for (const g of raw?.groups ?? []) {
    for (const id of g.cases ?? []) if (!ids.has(id)) errors.push(`group ${g.id}: unknown case ${id}`);
    for (const c of (raw.cases ?? []).filter((c) => (g.cases ?? []).includes(c.id))) {
      for (const s of g.shortcuts ?? []) if (!c.params?.scripts?.[s]) errors.push(`group ${g.id}: case ${c.id} has no script for shortcut ${s}`);
    }
  }
  if (errors.length) throw new Error(`invalid suite ${path}:\n  - ${errors.join('\n  - ')}`);

  const cases = raw.cases.map((c) => withDigest({
    id: c.id,
    kind: c.kind,
    targets: c.targets ?? [],
    trials: c.trials ?? DEFAULT_TRIALS[c.kind],
    // Plain-language guide shown to humans who label runs for judge calibration.
    labelGuide: c.label_guide ?? null,
    ...buildCase(c.pattern, c.params ?? {}),
  }));
  return {
    name: raw.name ?? 'suite',
    subject: resolve(base, raw.subject.path),
    repoRoot: resolve(base, raw.repo_root ?? '.'),
    arms: raw.arms,
    baseline: raw.compare?.baseline ?? raw.arms[0],
    candidates: raw.compare?.candidates ?? raw.arms.slice(1),
    model: raw.model ?? null,
    judgeModel: raw.judge_model ?? null,
    preregistration: raw.preregistration ? resolve(base, raw.preregistration) : null,
    // Control arms used to check that each case can tell good from bad (validity.mjs).
    controls: raw.controls ?? null,
    // Contrast groups: cells that differ in one factor each, with the shortcut scripts
    // the group must defeat (every shortcut has to miss in at least one cell).
    groups: (raw.groups ?? []).map((g) => ({ id: g.id, cases: g.cases ?? [], shortcuts: g.shortcuts ?? [] })),
    cases,
  };
}

// What the agent sees (files, issue, prompt) hashed: a stored run whose digest differs
// from the current case was made with other materials and must not be shown or
// regraded as if it were this case.
function withDigest(c) {
  const material = JSON.stringify({ files: c.files, issue: c.issue ?? null, prompt: c.prompt, ...(c.history ? { history: c.history } : {}), ...(c.noise ? { noise: c.noise } : {}), ...(c.extraFiles ? { extraFiles: c.extraFiles } : {}), ...(c.agentEnv ? { agentEnv: c.agentEnv } : {}), ...(c.checkout ? { checkout: c.checkout } : {}) });
  return { ...c, digest: createHash('sha256').update(material).digest('hex').slice(0, 16) };
}
