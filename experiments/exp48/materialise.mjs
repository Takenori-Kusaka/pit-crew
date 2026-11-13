#!/usr/bin/env node
// EXP-48: turn task pointers into build contexts and Harbor task directories under local/
// (git-ignored; the subject repository's content never goes to a tracked path).
//
//   node experiments/exp48/materialise.mjs derive <id> <reference commit> [--issue n] [--pr n]
//        prints a task pointer (JSON): pre-fix = the reference commit's first parent, and the
//        mechanical parts (hidden checks, sibling tests, implementation files). Paths only.
//   node experiments/exp48/materialise.mjs contexts <task.json>...
//        writes local/exp48-gq/build/** (docker build contexts) and prints the image plan
//   node experiments/exp48/materialise.mjs arm <task.json> <A|B|C|D> [--instruction file]
//        [--requirements file] [--skills dir] [--entry /dev] [--script reference|noop]
//        writes local/exp48-gq/harbor/<arm>[-<script>]/harbor-tasks/<task>/
// Options: --clone <git dir> (default local/exp48-gq/gq.git), --out <dir> (default local/exp48-gq)
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileArm, deriveTask, loadTask, writeContexts } from '../../packages/pit-wall/src/realrepo/task.mjs';
import { buildSnapshot } from '../../packages/pit-wall/src/realrepo/gh-snapshot.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = args.indexOf(`--${name}`); return i === -1 ? dflt : args[i + 1]; };
const positional = () => { const out = []; for (let i = 1; i < args.length; i++) { if (args[i].startsWith('--')) { i++; continue; } out.push(args[i]); } return out; };
const clone = resolve(ROOT, opt('clone', 'local/exp48-gq/gq.git'));
const outDir = resolve(ROOT, opt('out', 'local/exp48-gq'));
if (!resolve(outDir).replace(/\\/g, '/').includes('/local/')) { process.stderr.write('refusing to write outside a local/ directory (owner decision 3)\n'); process.exit(2); }
if (!existsSync(clone)) { process.stderr.write(`no clone at ${clone}: git clone --bare https://github.com/Takenori-Kusaka/ganbari-quest.git ${clone}\n`); process.exit(2); }
const harness = JSON.parse(readFileSync(join(ROOT, 'experiments/exp48/harness-files.json'), 'utf8'));

const cmd = args[0];
if (cmd === 'derive') {
  const [id, reference] = positional();
  const rev = (r) => spawnSync('git', ['rev-parse', '--verify', `${r}^{commit}`], { cwd: clone, encoding: 'utf8' }).stdout.trim();
  const ref = rev(reference), pre = rev(`${reference}^`);
  const d = deriveTask(clone, pre, ref);
  process.stdout.write(`${JSON.stringify({ id, repo: 'Takenori-Kusaka/ganbari-quest', issue: opt('issue') ? Number(opt('issue')) : null, pr: opt('pr') ? Number(opt('pr')) : null, prefix_commit: pre, reference_commit: ref, hidden_checks: d.hidden_checks, hidden_new: d.hidden_new, sibling_tests: d.sibling_tests, impl_files: d.impl_files, source_paths: ['src', 'tests'] }, null, 1)}\n`);
} else if (cmd === 'contexts') {
  for (const f of positional()) {
    const task = loadTask(resolve(f));
    // --gh <cache dir with issues.json and prs.json>: the stand-in's snapshot as of the pre-fix commit.
    // --gh-arms all|d|none (default all), --jq <static jq binary>, --graphify <version> (arm D, where graphify-out/ is tracked)
    let ghSnapshot = null;
    if (opt('gh')) {
      const dir = resolve(ROOT, opt('gh'));
      const asOf = spawnSync('git', ['show', '-s', '--format=%cI', task.prefix_commit], { cwd: clone, encoding: 'utf8' }).stdout.trim();
      ghSnapshot = buildSnapshot({ issues: JSON.parse(readFileSync(join(dir, 'issues.json'), 'utf8')), prs: JSON.parse(readFileSync(join(dir, 'prs.json'), 'utf8')) }, { repo: task.repo, asOf, taskIssue: task.issue ?? null, fixPr: task.pr ?? null });
    }
    const extra = { ghSnapshot, ghArms: opt('gh-arms', 'all'), jqBinary: opt('jq') ? resolve(ROOT, opt('jq')) : null, graphifyVersion: opt('graphify'), defaultNodeVersion: opt('default-node') };
    const info = writeContexts(task, { ...extra, gitDir: clone, filteredDir: resolve(ROOT, opt('filtered', 'local/exp48-gq/gq-filtered.git')), outDir, harness, ...(opt('depth') != null ? { depth: Number(opt('depth')) } : {}) });
    process.stdout.write(`${JSON.stringify({ id: info.id, nodeVersion: info.nodeVersion, lockHash: info.lockHash, treePaths: info.treePaths, removed: info.removed.length, history: info.history, tools: info.tools, gh: info.ghSnapshotMeta, images: info.images })}\n`);
  }
} else if (cmd === 'arm') {
  const [file, arm] = positional();
  const task = loadTask(resolve(file));
  const script = opt('script');
  const instrFile = opt('instruction', join(outDir, 'tasks', task.id, 'instruction.md'));
  // A scripted control needs no request text; a model run does, and it comes from the task author.
  if (!script && !existsSync(instrFile)) { process.stderr.write(`no instruction at ${instrFile} (written by the task author, kept local)\n`); process.exit(2); }
  const instruction = existsSync(instrFile) ? readFileSync(instrFile, 'utf8').trim() : '(scripted control: no request)';
  const r = compileArm(join(outDir, 'harbor', script ? `${arm}-${script}` : arm), task, arm, {
    gitDir: clone, instruction, script,
    // arm B: exactly the committed document (team lead 2026-11-13); --requirements only to override
    requirementsDoc: opt('requirements', join(ROOT, 'experiments/exp48/arm-b-requirements.md')),
    skills: opt('skills', join(ROOT, 'subjects/dev-skill-default/skills')),
    entry: opt('entry', '/dev'),
  });
  process.stdout.write(`${JSON.stringify({ ...r, dir: r.dir.replace(/\\/g, '/') })}\n`);
} else {
  process.stderr.write('usage: materialise.mjs derive <id> <reference commit> | contexts <task.json>... | arm <task.json> <A|B|C|D> [...]\n');
  process.exit(2);
}
