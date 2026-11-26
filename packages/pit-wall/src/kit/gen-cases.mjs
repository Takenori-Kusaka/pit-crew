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
import { cliArgs } from './cli-args.mjs';
import { localChecks } from './local-checks.mjs';
import { endStateFacts } from './predicates.mjs';

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
  // a scene may replace the part before the acceptance heading (`issue_lead`, card 39 §3 rebuild)
  if (variant.issue_lead) return `${variant.issue_lead.trimEnd()}\n\n（受入基準は未記入）\n`;
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
  // Note (goal 4, card 39 change table): inside the plugin-eval sandbox, Bash cannot write anywhere in the working
  // directory, so `git commit` / `git checkout -b` always fail (`Read-only file system`), whatever the git layout
  // (`.git`, a `.gitrepo/` pointer, a `.vcs/` + git stand-in were all tried). A PR through the gh stand-in works.
  lines.push('printf ".pitwall/\\n.github-cache/\\n" >> .git-info-exclude-pending', 'git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending');
  // a repo-local identity, so that a commit by the agent works the same way in every arm (kit-guide 限界 3)
  lines.push('git config user.name developer && git config user.email developer@example.com');
  lines.push('git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture');
  return lines.join('\n') + '\n';
}

// The repository a case starts from, as { path: text } (the fixture's files with the case's variant).
function startTree(fixtureDir, fx, variant) {
  const files = join(fixtureDir, fx.files_dir ?? 'files');
  return Object.fromEntries(listFiles(files).map((rel) => {
    let text = readFileSync(join(files, rel), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
    if (variant?.kind === 'append_file' && variant.path === rel) text += `\n${variant.text}`;
    return [rel, `${text}\n`];
  }));
}

// Substitute ${task.x} inside an example call.
const fill = (v, task) => (typeof v === 'string' ? v.replace(/\$\{task\.([\w-]+)\}/g, (_, k) => [].concat(task[k] ?? '')[0] ?? '') : v);

// Steps a fixture adds to the reference script: `reference.before.<action id>: [step, ...]` (written by the scene's
// author). They are placed, in the order written, directly before that action's step. A step only looks at the
// repository: { tool: Read, path } or { tool: Bash, command }; `${task.x}` is filled. The content of the
// repository is never changed by a before-step (an Edit / Write here would need content, which belongs to
// `reference.files`), so anything else is an error. A Bash step may give `exit` (an integer; default 0). Each event carries `before_of: <action id>`, so the
// perturbation can take the steps out again (perturb.mjs, kind `drop-before`).
// Only the reference script reads this key: the null script is empty and an incident script is the steps its
// author wrote (harbor-cases.mjs), so neither gets these steps unless the fixture writes them there itself.
export const beforeSteps = (fx, task, ids) => placedSteps(fx, task, ids, 'before');
// Steps a fixture adds AFTER an action: `reference.after.<action id>: [step, ...]`, placed, in the order written, directly
// after that action's step. Same steps as `before` (Read / Bash; `${task.x}` is filled), but a Bash step here may
// change the repository or the remote — that is what it is for: e.g. `git add <the new test>` after add-test (the
// role's example hand-back is `git commit -am`, which leaves a new file out), or `git push` after hand-back (a scene
// with a logged remote reads the hand-back from the remote's refs). Edit / Write stay errors (content belongs to
// `reference.files`). Each event carries `after_of: <action id>`; the planted-error self-check takes them out again
// (perturb.mjs, kind `drop-after`). Like `before`, only the full reference script gets them (not the null script,
// an incident script, or an escalation's reference).
export const afterSteps = (fx, task, ids) => placedSteps(fx, task, ids, 'after');
function placedSteps(fx, task, ids, side) {
  const decl = fx?.reference?.[side] ?? {};
  const key = `reference.${side}`, mark = `${side}_of`;
  if (typeof decl !== 'object' || Array.isArray(decl)) throw new Error(`${key} must be a map: <action id> -> [steps]`);
  const out = new Map();
  for (const [id, steps] of Object.entries(decl)) {
    if (!ids.includes(id)) throw new Error(`${key}.${id}: not a step of the reference script (its steps: ${ids.join(', ')})`);
    if (!Array.isArray(steps)) throw new Error(`${key}.${id} must be a list of steps`);
    out.set(id, steps.map((s, k) => {
      const at = `${key}.${id}[${k}]`;
      if (s?.tool === 'Read') {
        const path = fill(s.path, task);
        if (typeof path !== 'string' || !path) throw new Error(`${at}: a Read step needs a path`);
        return { tool: 'Read', path, [mark]: id };
      }
      if (s?.tool === 'Bash') {
        const command = fill(s.command, task);
        if (typeof command !== 'string' || !command) throw new Error(`${at}: a Bash step needs a command`);
        // exit: the step's exit code as the record would have it (default 0). A check seen red before the fix is `exit: 1`
        if (s.exit !== undefined && !Number.isInteger(s.exit)) throw new Error(`${at}: exit is an integer`);
        return { tool: 'Bash', command, exit: s.exit ?? 0, gh: [], [mark]: id };
      }
      throw new Error(`${at}: ${side === 'after' ? 'an' : 'a'} ${side}-step is { tool: Read, path } or { tool: Bash, command } (got tool ${s?.tool})`);
    }));
  }
  return out;
}

// Reference control: the spec's example actions, ordered to satisfy `order` (topological on required).
// `fx` (optional): the fixture; its `reference.before` steps are placed before the action they name, its
// `reference.after` steps after it.
export function referenceEvents(spec, task, fx) {
  const ids = spec.procedure.required ?? [];
  const before = new Map(ids.map((id) => [id, new Set()]));
  for (const [a, b] of spec.procedure.order ?? []) before.get(b)?.add(a);
  const done = []; const left = [...ids];
  while (left.length) {
    const i = left.findIndex((id) => [...before.get(id)].every((x) => done.includes(x)));
    if (i < 0) throw new Error(`order has a cycle among ${left.join(', ')}`);
    done.push(left.splice(i, 1)[0]);
  }
  const added = beforeSteps(fx, task, done), later = afterSteps(fx, task, done);
  const events = done.flatMap((id) => {
    const ex = spec.actions.find((a) => a.id === id)?.example;
    if (!ex) throw new Error(`action ${id} has no example`);
    return [...(added.get(id) ?? []), { tool: ex.tool, command: fill(ex.command, task), path: fill(ex.path, task), exit: ex.tool === 'Bash' ? 0 : undefined, gh: [].concat(ex.gh ?? []) }, ...(later.get(id) ?? [])];
  });
  return onWorkBranch(events, fx);
}

// A reference script that hands its result back by a commit works on a branch of its own: the mainline is not the
// agent's to move (a commit made on main / master IS "the mainline moved to the agent's own commit", the row a role
// spec reads as merging one's own change). So, when the script commits, a `git checkout -b <branch>` step is put
// before its first step that changes a file. A script that commits nothing (another role's reference, an escalation
// reference) is left as it is. The fixture may name the branch (`reference.branch: <name>`) or say that its scene
// wants the commit where the repository stands (`reference.branch: false`).
export const REFERENCE_BRANCH = 'work/reference';
const COMMITS = /(?:^|[;&|]\s*)git\s+(?:-[Cc]\s+\S+\s+)*commit\b/;
function onWorkBranch(events, fx) {
  const name = fx?.reference?.branch;
  if (name === false) return events;
  if (name !== undefined && name !== null && !(typeof name === 'string' && /^[\w][\w./-]*$/.test(name) && !/^(main|master)$/.test(name))) throw new Error(`reference.branch: ${JSON.stringify(name)} is not a branch name (and not main / master), or false`);
  if (!events.some((e) => e.tool === 'Bash' && COMMITS.test(e.command ?? ''))) return events;
  // before the first step that changes a file — and before the steps the fixture placed before that step
  // (`reference.before`), which belong directly in front of it
  let at = events.findIndex((e) => ['Edit', 'Write'].includes(e.tool));
  while (at > 0 && events[at - 1].before_of) at -= 1;
  const step = { tool: 'Bash', command: `git checkout -b ${name ?? REFERENCE_BRANCH}`, exit: 0, gh: [], setup: 'branch' };
  return at < 0 ? [step, ...events] : [...events.slice(0, at), step, ...events.slice(at)];
}
// the gh effects of the reference come from the examples' `gh` (the same field escalation examples use)
const referenceState = (spec, task, events) => ({
  changed: [...new Set(events.filter((e) => ['Edit', 'Write'].includes(e.tool)).map((e) => e.path))],
  checks_pass: true, gh: [...new Set(events.flatMap((e) => e.gh ?? []))],
});

// The reference control of one case: for an escalation case, open the task and raise the decision (and
// nothing else); otherwise the spec's example actions in order.
// The fixture's `reference.before` steps belong to the full procedure only: an escalation's reference stops
// before the work starts, so it is built without them.
export function referenceControl(spec, fx, c, task) {
  if (c.kind !== 'escalation') { const events = referenceEvents(spec, task, fx); return { events, state: referenceState(spec, task, events) }; }
  const events = referenceEvents(spec, task);
  const ex = spec.escalations.find((e) => e.id === c.target)?.example;
  return {
    events: [events[0], ex ? { tool: ex.tool, command: fill(ex.command, task), exit: 0 } : { tool: 'Bash', command: `gh issue comment ${fx.issue?.number ?? 1} -b "確認させてください"`, exit: 0 }],
    state: { changed: [], checks_pass: null, gh: ex?.gh ?? ['issue_comment'] },
  };
}

// The request a case's agent gets: the fixture's prompt, then what the fixture declares for every case
// (release plan 48 §4.0), then the case's own additions.
//   handback: the sentence that asks for the result the way the role requires (a commit or a PR). W0a: no run
//             handed back, because the request did not ask for it.
//   scratch:  globs where work files (notes, state) may go. Declared by the fixture, never read from a harness;
//             the runner leaves these paths out of the changed files it hands to the grader.
export const scratchNote = (fx) => (fx.scratch?.length
  ? `作業用のメモや状態のファイルが要るときは、${fx.scratch.map((g) => `\`${g.replace(/\/?\*\*.*$/, '/')}\``).join('・')} の下に置いてください（git の管理外です）。` : null);
export const promptOf = (fx, c) => [fx.prompt, fx.handback, scratchNote(fx), ...c.append].filter(Boolean).join(' ');

// The cases of one role spec on one fixture: the same list for every runner.
// Two keys of the fixture decide which cases it has and what a lure says:
//   lures: { <forbidden id>: '<sentence>' | false }
//          the lure sentence of that row FOR THIS FIXTURE (the role spec's `forbidden[].lure` is one sentence for
//          every fixture of the role; a scene may need its own, or none). false = this fixture has no lure case
//          for the row. A row the role spec gives no lure can get one here.
//   cases: [ 'normal' | 'lure:<forbidden id>' | 'escalation:<escalation id>' | 'scene:<scene id>' ]
//          the cases this fixture has, of the ones it would have. Not given: all of them.
// An id that names nothing (a row the role spec does not have, a selector that selects no case) is an error.
export function enumerateCases(spec, fx) {
  const all = allCases(spec, fx);
  if (fx.cases === undefined || fx.cases === null) return all;
  if (!Array.isArray(fx.cases) || !fx.cases.length) throw new Error('cases must be a list of selectors (normal, lure:<id>, escalation:<id>, scene:<id>)');
  const selects = (sel, c) => (sel === 'normal' ? c.kind === 'normal' : sel === `lure:${c.target}` ? c.kind === 'lure' : sel === `escalation:${c.target}` ? c.kind === 'escalation' : sel === `scene:${c.scene}`);
  for (const sel of fx.cases) {
    if (typeof sel !== 'string' || !/^(normal|(lure|escalation|scene):[\w-]+)$/.test(sel)) throw new Error(`cases: ${JSON.stringify(sel)} is not normal, lure:<id>, escalation:<id> or scene:<id>`);
    if (!all.some((c) => selects(sel, c))) throw new Error(`cases: ${sel} selects no case of this fixture (it has: ${all.map((c) => c.id).join(', ')})`);
  }
  return all.filter((c) => fx.cases.some((sel) => selects(sel, c)));
}
function allCases(spec, fx) {
  const cases = [{ id: `${spec.role}-normal`, kind: 'normal', append: [], flags: {}, variant: null }];
  const lures = fx.lures ?? {};
  if (typeof lures !== 'object' || Array.isArray(lures)) throw new Error('lures must be a map: <forbidden id> -> sentence | false');
  for (const [id, v] of Object.entries(lures)) {
    if (!spec.forbidden.some((f) => f.id === id)) throw new Error(`lures.${id}: the role spec has no forbidden row ${id}`);
    if (v !== false && !(typeof v === 'string' && v.trim())) throw new Error(`lures.${id} must be a sentence, or false for no lure case`);
  }
  for (const f of spec.forbidden) {
    const lure = f.id in lures ? lures[f.id] : f.lure;
    if (lure) cases.push({ id: `${spec.role}-lure-${f.id}`, kind: 'lure', target: f.id, append: [lure], flags: f.lure_task ? { [f.lure_task]: true } : {}, variant: null });
  }
  // goal 5 (card 40 §2): a fixture may list its escalation scenes instead; then only those make escalation cases.
  // `escalation_scenes: [{ id, escalation: <spec escalation id>, wordings: [{ text?, kind?, ... }] }]`
  // goal 6 (card 41 §1): a scene's `type` is `hidden` / an escalation (an escalation case), `convention` (a rule appended to
  // a file of the fixture; success = the scene's `success` predicate) or `proceed` (task flag `proceed_ok`; success = no
  // over-escalation). Non-escalation scenes are graded like a normal case.
  for (const s of fx.escalation_scenes ?? []) {
    if (s.type === 'convention' || s.type === 'proceed') {
      s.wordings.forEach((w, k) => {
        const variant = s.file_append ? { kind: 'append_file', path: s.file_append.path, text: s.file_append.text } : null;
        const flags = s.type === 'proceed' ? { proceed_ok: true } : {};
        cases.push({ id: `${spec.role}-${s.type}-${s.id}-${k + 1}`, kind: 'scene', scene: s.id, scene_type: s.type, success: s.success ?? null, append: w.text ? [w.text] : [], flags, variant });
      });
      continue;
    }
    const e = spec.escalations.find((x) => x.id === s.escalation);
    if (!e) throw new Error(`scene ${s.id}: no escalation ${s.escalation} in the spec`);
    const flags = Object.fromEntries([].concat(e.detect_trigger?.task ?? []).map((t) => [t, true]));
    s.wordings.forEach((w, k) => {
      const v = { ...e.prompt_variant, ...w };
      const append = v.kind === 'append' ? [v.text] : v.text ? [v.text] : [];
      cases.push({ id: `${spec.role}-esc-${s.id}-${k + 1}`, kind: 'escalation', target: e.id, scene: s.id, scene_type: s.type ?? 'escalation', append, flags, variant: v });
    });
  }
  if (!fx.escalation_scenes) for (const e of spec.escalations) if (e.prompt_variant) {
    const flags = Object.fromEntries([].concat(e.detect_trigger?.task ?? []).map((t) => [t, true]));
    // a fixture may give several wordings of the same scene (`escalation_variants: {<id>: [{text?, kind?}, ...]}`,
    // card 39 §2): one case per wording, so the escalation row can take values other than 0 and 1
    const wordings = fx.escalation_variants?.[e.id];
    if (!wordings) { cases.push({ id: `${spec.role}-esc-${e.id}`, kind: 'escalation', target: e.id, append: e.prompt_variant.kind === 'append' ? [e.prompt_variant.text] : [], flags, variant: e.prompt_variant }); continue; }
    wordings.forEach((w, k) => {
      const v = { ...e.prompt_variant, ...w };
      // for `append` the wording is the appended text; for the other kinds an optional text is added to the prompt
      const append = v.kind === 'append' ? [v.text] : v.kind === 'append_file' ? (w.prompt ? [w.prompt] : []) : v.text ? [v.text] : [];
      cases.push({ id: `${spec.role}-esc-${e.id}-${k + 1}`, kind: 'escalation', target: e.id, append, flags, variant: v });
    });
  }
  return cases;
}

export function generate(specPath, fixtureDir, outDir) {
  const spec = YAML.parse(readFileSync(specPath, 'utf8'));
  const fx = YAML.parse(readFileSync(join(fixtureDir, 'fixture.yaml'), 'utf8'));
  if (fx.role !== spec.role) throw new Error(`fixture role ${fx.role} != spec role ${spec.role}`);
  const shim = readFileSync(GH_SHIM, 'utf8').replace(/\r\n/g, '\n');
  const cases = enumerateCases(spec, fx);
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
    const prompt = promptOf(fx, c);
    writeFileSync(join(dir, 'prompt.md'), `---\nmax_turns: 40\nallowed_tools: [${(fx.tools ?? []).join(', ')}]\n---\n${prompt}\n`);
    writeFileSync(join(dir, 'graders', 'ran.md'), `---\ntype: regex\npattern: '.'\n---\n`);
    writeFileSync(join(dir, 'kit-case.json'), JSON.stringify({ role: spec.role, case: c.id, kind: c.kind, target: c.target ?? null, ...(c.scene ? { scene: c.scene, scene_type: c.scene_type ?? null, success: c.success ?? null } : {}), task }, null, 1) + '\n');
    // scripted controls, graded with the generic grader
    // a scripted control says nothing to the requester: its last message is recorded as empty (not as missing)
    const { events: refEvents, state: refState } = referenceControl(spec, fx, c, task);
    // the fixture's named checks, run on each control's end tree (local-checks.mjs; nothing when the fixture has
    // none, when there is no POSIX bash, or when the fixture gives no content for a file the reference writes)
    const start = startTree(fixtureDir, fx, c.variant);
    const written = refEvents.filter((e) => ['Edit', 'Write'].includes(e.tool)).map((e) => e.path);
    const content = fx.reference?.files ?? {};
    const refChecks = written.every((p) => typeof content[p] === 'string') ? localChecks(fx.checks, start, { ...start, ...Object.fromEntries(written.map((p) => [p, `${String(content[p]).replace(/\n$/, '')}\n`])) }) : null;
    const nulChecks = localChecks(fx.checks, start, start);
    const facts = (checks) => (checks ? endStateFacts({ checks }) : {});
    const ref = grade(spec, { events: refEvents, state: { ...refState, ...facts(refChecks) }, task, kind: c.kind, target: c.target, final: '' });
    const nul = grade(spec, { events: [], state: { changed: [], checks_pass: false, gh: [], ...facts(nulChecks) }, task, kind: c.kind, target: c.target, final: '' });
    controls.push({ case: c.id, kind: c.kind, reference: { pass: ref.pass, conformance: ref.conformance, violations: ref.violations }, null: { pass: nul.pass, conformance: nul.conformance, violations: nul.violations } });
  }
  // the eval directory must look like a plugin for `claude plugin eval`; the harness under test is
  // added by the runner, not here
  mkdirSync(join(outDir, '.claude-plugin'), { recursive: true });
  writeFileSync(join(outDir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: `kit-${spec.role}-cases`, version: '0.0.1' }, null, 1) + '\n');
  writeFileSync(join(outDir, 'controls.json'), JSON.stringify(controls, null, 1) + '\n');
  const expected = controls.every((x) => x.reference.pass && x.null.conformance === 0);
  return { role: spec.role, cases: cases.map((c) => c.id), controls, ok: expected };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
  const { options, rest } = cliArgs(process.argv.slice(2), { options: ['result'], min: 3, max: 3,
    usage: 'usage: node packages/pit-wall/src/kit/gen-cases.mjs <role spec> <fixture dir> <out dir> [--result <json>]\n  Makes the plugin-eval cases of a role spec on a fixture and grades their scripted controls. No model.\n  REPLACES <out dir> (it is removed first) and writes --result when given.' });
  const [specPath, fixtureDir, outDir] = rest;
  const resultPath = options.result;
  const r = generate(specPath, fixtureDir, outDir);
  for (const c of r.controls) console.log(`${c.case.padEnd(36)} reference ${c.reference.pass ? 'pass' : 'FAIL'} (${c.reference.conformance?.toFixed(2)}, violations ${c.reference.violations})  null ${c.null.conformance?.toFixed(2)}`);
  console.log(r.ok ? `ok: ${r.cases.length} cases` : 'NOT OK: a control is not as expected');
  if (resultPath) { mkdirSync(dirname(resultPath), { recursive: true }); writeFileSync(resultPath, JSON.stringify({ ...r, generated_at: new Date().toISOString() }, null, 1) + '\n'); }
  process.exit(r.ok ? 0 : 1);
}
