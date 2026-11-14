#!/usr/bin/env node
// Harness kit M3: generate `claude plugin eval` cases from a role spec and an environment fixture.
// Mechanical, role-independent: one normal case, one "lure" case per forbidden item that carries a
// `lure`, one case per escalation that carries a `prompt_variant`. Also builds the scripted
// controls (reference = the spec's example actions in order; null = nothing) and grades them with the
// generic grader to record each case's upper and lower bound.
// Usage: node packages/pit-wall/src/kit/gen-cases.mjs <role spec> <fixture dir> <out dir> [--result <json>]
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { grade } from './grader.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GH_SHIM = resolve(HERE, '../../shims/gh');

export function listFiles(dir, base = dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, base)); else out.push(relative(base, p).replace(/\\/g, '/'));
  }
  return out.sort();
}

function issueBody(issue, variant) {
  if (variant?.kind !== 'drop_acceptance') return issue.body;
  const i = issue.body.indexOf(issue.acceptance_heading ?? '## 受入基準');
  return i < 0 ? issue.body : issue.body.slice(0, i).trimEnd() + '\n\n（受入基準は未記入）\n';
}

function scaffold(fixtureDir, fx, body, variant) {
  const lines = ['#!/bin/bash', 'set -e'];
  const files = join(fixtureDir, fx.files_dir ?? 'files');
  for (const rel of listFiles(files)) {
    let text = readFileSync(join(files, rel), 'utf8').replace(/\n$/, '');
    if (variant?.kind === 'append_file' && variant.path === rel) text += `\n${variant.text}`;
    lines.push(`mkdir -p "$(dirname ${JSON.stringify(rel)})"`);
    lines.push(`cat > ${JSON.stringify(rel)} <<'PITWALL_EOF'\n${text}\nPITWALL_EOF`);
  }
  for (const [name, text] of Object.entries(fx.github_cache ?? {})) lines.push(`mkdir -p .github-cache && cat > .github-cache/${name} <<'PITWALL_EOF'\n${String(text).replace(/\n$/, '')}\nPITWALL_EOF`);
  lines.push('mkdir -p .pitwall/bin .github-cache', 'cp "$(dirname "$0")/gh" .pitwall/bin/gh', 'chmod +x .pitwall/bin/gh');
  if (fx.issue) lines.push(`cat > .github-cache/issue-${fx.issue.number}.md <<'PITWALL_EOF'\n# ${fx.issue.title}\n\n${body}\nPITWALL_EOF`);
  lines.push('printf ".pitwall/\\n.github-cache/\\n" >> .git-info-exclude-pending', 'git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending');
  lines.push('git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture');
  return lines.join('\n') + '\n';
}

// Substitute ${task.x} inside an example call.
const fill = (v, task) => (typeof v === 'string' ? v.replace(/\$\{task\.([\w-]+)\}/g, (_, k) => [].concat(task[k] ?? '')[0] ?? '') : v);

// Reference control: the spec's example actions, ordered to satisfy `order` (topological on required).
export function referenceEvents(spec, task) {
  const ids = spec.procedure.required ?? [];
  const before = new Map(ids.map((id) => [id, new Set()]));
  for (const [a, b] of spec.procedure.order ?? []) before.get(b)?.add(a);
  const done = []; const left = [...ids];
  while (left.length) {
    const i = left.findIndex((id) => [...before.get(id)].every((x) => done.includes(x)));
    if (i < 0) throw new Error(`order has a cycle among ${left.join(', ')}`);
    done.push(left.splice(i, 1)[0]);
  }
  return done.map((id) => {
    const ex = spec.actions.find((a) => a.id === id)?.example;
    if (!ex) throw new Error(`action ${id} has no example`);
    return { tool: ex.tool, command: fill(ex.command, task), path: fill(ex.path, task), exit: ex.tool === 'Bash' ? 0 : undefined };
  });
}
const referenceState = (spec, task, events) => ({
  changed: [...new Set(events.filter((e) => ['Edit', 'Write'].includes(e.tool)).map((e) => e.path))],
  checks_pass: true, gh: [],
});

export function generate(specPath, fixtureDir, outDir) {
  const spec = YAML.parse(readFileSync(specPath, 'utf8'));
  const fx = YAML.parse(readFileSync(join(fixtureDir, 'fixture.yaml'), 'utf8'));
  if (fx.role !== spec.role) throw new Error(`fixture role ${fx.role} != spec role ${spec.role}`);
  const shim = readFileSync(GH_SHIM, 'utf8').replace(/\r\n/g, '\n');
  const cases = [{ id: `${spec.role}-normal`, kind: 'normal', append: [], flags: {}, variant: null }];
  for (const f of spec.forbidden) if (f.lure) cases.push({ id: `${spec.role}-lure-${f.id}`, kind: 'lure', target: f.id, append: [f.lure], flags: f.lure_task ? { [f.lure_task]: true } : {}, variant: null });
  for (const e of spec.escalations) if (e.prompt_variant) {
    const flags = Object.fromEntries([].concat(e.detect_trigger?.task ?? []).map((t) => [t, true]));
    cases.push({ id: `${spec.role}-esc-${e.id}`, kind: 'escalation', target: e.id, append: e.prompt_variant.kind === 'append' ? [e.prompt_variant.text] : [], flags, variant: e.prompt_variant });
  }
  rmSync(outDir, { recursive: true, force: true });
  const controls = [];
  for (const c of cases) {
    const dir = join(outDir, 'evals', c.id);
    mkdirSync(join(dir, 'graders'), { recursive: true });
    const task = { ...fx.task, ...c.flags };
    writeFileSync(join(dir, 'case.yaml'), `schema_version: "1.1"\nname: ${c.id}\ncontext:\n  scaffold_script: scaffold.sh\n`);
    writeFileSync(join(dir, 'scaffold.sh'), scaffold(fixtureDir, fx, fx.issue ? issueBody(fx.issue, c.variant) : '', c.variant));
    chmodSync(join(dir, 'scaffold.sh'), 0o755);
    writeFileSync(join(dir, 'gh'), shim, { mode: 0o755 });
    const prompt = [fx.prompt, ...c.append].join(' ');
    writeFileSync(join(dir, 'prompt.md'), `---\nmax_turns: 40\nallowed_tools: [${(fx.tools ?? []).join(', ')}]\n---\n${prompt}\n`);
    writeFileSync(join(dir, 'graders', 'ran.md'), `---\ntype: regex\npattern: '.'\n---\n`);
    writeFileSync(join(dir, 'kit-case.json'), JSON.stringify({ role: spec.role, case: c.id, kind: c.kind, target: c.target ?? null, task }, null, 1) + '\n');
    // scripted controls, graded with the generic grader
    let refEvents = referenceEvents(spec, task), refState = referenceState(spec, task, refEvents);
    if (c.kind === 'escalation') {
      const ex = spec.escalations.find((e) => e.id === c.target)?.example;
      refEvents = [refEvents[0], ex ? { tool: ex.tool, command: fill(ex.command, task), exit: 0 } : { tool: 'Bash', command: `gh issue comment ${fx.issue?.number ?? 1} -b "確認させてください"`, exit: 0 }];
      refState = { changed: [], checks_pass: null, gh: ex?.gh ?? ['issue_comment'] };
    }
    const ref = grade(spec, { events: refEvents, state: refState, task });
    const nul = grade(spec, { events: [], state: { changed: [], checks_pass: false, gh: [] }, task });
    controls.push({ case: c.id, kind: c.kind, reference: { pass: ref.pass, conformance: ref.conformance, violations: ref.violations }, null: { pass: nul.pass, conformance: nul.conformance, violations: nul.violations } });
  }
  // the eval directory must look like a plugin for `claude plugin eval`; the harness under test is
  // added by the runner, not here
  mkdirSync(join(outDir, '.claude-plugin'), { recursive: true });
  writeFileSync(join(outDir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: `kit-${spec.role}-cases`, version: '0.0.1' }, null, 1) + '\n');
  writeFileSync(join(outDir, 'controls.json'), JSON.stringify(controls, null, 1) + '\n');
  const expected = controls.every((x) => (x.kind === 'escalation' ? x.reference.violations === 0 : x.reference.pass) && x.null.conformance === 0);
  return { role: spec.role, cases: cases.map((c) => c.id), controls, ok: expected };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [specPath, fixtureDir, outDir] = process.argv.slice(2);
  const ri = process.argv.indexOf('--result');
  if (!specPath || !fixtureDir || !outDir) { console.error('usage: gen-cases.mjs <role spec> <fixture dir> <out dir> [--result <json>]'); process.exit(1); }
  const r = generate(specPath, fixtureDir, outDir);
  for (const c of r.controls) console.log(`${c.case.padEnd(36)} reference ${c.reference.pass ? 'pass' : 'FAIL'} (${c.reference.conformance?.toFixed(2)}, violations ${c.reference.violations})  null ${c.null.conformance?.toFixed(2)}`);
  console.log(r.ok ? `ok: ${r.cases.length} cases` : 'NOT OK: a control is not as expected');
  if (ri > 0) { mkdirSync(dirname(process.argv[ri + 1]), { recursive: true }); writeFileSync(process.argv[ri + 1], JSON.stringify({ ...r, generated_at: new Date().toISOString() }, null, 1) + '\n'); }
  process.exit(r.ok ? 0 : 1);
}
