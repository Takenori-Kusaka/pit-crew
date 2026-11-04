// Runner adapter: Claude Code's `claude plugin eval`.
// compile(): writes cases into <pluginDir>/evals/ in the plugin-eval format.
// run():     invokes plugin eval for one arm and returns per-run records
//            { case, trial, trajectory, native: {graderName: passed}, error }.

import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeClaudeStream } from '../normalize/claude-stream.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHIM = resolve(HERE, '../../shims/gh');

const yamlStr = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars

// Binaries this runner replaces with stand-ins, and known artifacts of the runner
// itself that show up in tool output (see validity.mjs).
export const SHIMS = ['gh'];
export const NOISE = [
  // Claude Code's Bash tool records the cwd under the run's TMPDIR, which the
  // plugin-eval sandbox mounts read-only: every Bash call then ends in exit 1.
  { name: 'cwd-tracking-readonly', pattern: String.raw`claude-eval-\S+/tmp/claude-\d+/cwd-\S+: Read-only file system` },
];

// A stand-in that cannot execute turns every run into an environment test.
// Check it before spending any model calls. Returns the shim text (LF only:
// a CRLF checkout makes the shebang name `bash\r`, and every call exits 127).
export function preflight() {
  const text = readFileSync(SHIM, 'utf8').replace(/\r\n/g, '\n');
  const dir = mkdtempSync(join(tmpdir(), 'pitwall-preflight-'));
  writeFileSync(join(dir, 'gh'), text, { mode: 0o755 });
  const r = spawnSync(join(dir, 'gh'), ['issue', 'view', '1'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`preflight: gh shim does not execute (exit ${r.status}): ${(r.stderr || String(r.error ?? '')).slice(0, 200)}`);
  return text;
}

function scaffoldScript(c) {
  const lines = ['#!/bin/bash', 'set -e'];
  for (const [path, text] of Object.entries(c.files)) {
    lines.push(`mkdir -p "$(dirname ${JSON.stringify(path)})"`);
    lines.push(`cat > ${JSON.stringify(path)} <<'PITWALL_EOF'\n${text}\nPITWALL_EOF`);
  }
  if (c.needsShell) {
    lines.push('mkdir -p .pitwall/bin .github-cache', 'cp "$(dirname "$0")/gh" .pitwall/bin/gh', 'chmod +x .pitwall/bin/gh');
    if (c.issue) lines.push(`cat > .github-cache/issue-${c.issue.number}.md <<'PITWALL_EOF'\n${c.issue.body}\nPITWALL_EOF`);
    lines.push('git init -q . && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture');
  }
  return lines.join('\n') + '\n';
}

export function compile(pluginDir, cases, { appendSystemPrompt, maxTurns = 12, entry = null } = {}) {
  const shim = cases.some((c) => c.needsShell) ? preflight() : null;
  for (const c of cases) {
    const dir = join(pluginDir, 'evals', c.id);
    mkdirSync(join(dir, 'graders'), { recursive: true });
    writeFileSync(join(dir, 'case.yaml'), `schema_version: "1.1"\nname: ${c.id}\ncontext:\n  scaffold_script: scaffold.sh\n`);
    writeFileSync(join(dir, 'scaffold.sh'), scaffoldScript(c));
    chmodSync(join(dir, 'scaffold.sh'), 0o755);
    if (c.needsShell) writeFileSync(join(dir, 'gh'), shim, { mode: 0o755 });
    const fm = [`max_turns: ${maxTurns}`, `allowed_tools: [${c.tools.join(', ')}]`];
    if (appendSystemPrompt) fm.push(`append_system_prompt: ${yamlStr(appendSystemPrompt)}`);
    writeFileSync(join(dir, 'prompt.md'), `---\n${fm.join('\n')}\n---\n${entry ? `${entry} ` : ''}${c.prompt}\n`);
    // plugin eval requires >= 1 grader; judges compile to native llm graders,
    // everything else is graded by pit-wall from the trajectory.
    const judges = c.graders.filter((g) => g.type === 'judge');
    for (const g of judges) writeFileSync(join(dir, 'graders', `${g.name}.md`), `---\ntype: llm\n---\n${g.rubric}\n`);
    if (!judges.length) writeFileSync(join(dir, 'graders', 'ran.md'), `---\ntype: regex\npattern: '.'\n---\n`);
  }
}

// Run one arm. `trials` runs per case, single arm (pit-wall compares arms itself).
export function run(pluginDir, { trials, model, judgeModel, outJson, needsShell, caseGlob }) {
  const args = ['plugin', 'eval', pluginDir, '--trust-plugin', '--scaffold', '--ablation', 'none',
    '--runs', String(trials), '--keep-temp', '--no-publish', '--json', outJson];
  if (model) args.push('--model', model);
  if (judgeModel) args.push('--judge-model', judgeModel);
  if (caseGlob) args.push('--case', caseGlob);
  if (needsShell) args.push('--allow-tools', 'Bash(gh *)', 'Bash(git *)', 'Bash(ls *)', 'Bash(cat *)');
  const env = { ...process.env, PATH: `.pitwall/bin:${process.env.PATH}` };
  delete env.ANTHROPIC_API_KEY; // never fall back to metered API billing
  const claude = process.env.PITWALL_CLAUDE ?? 'claude';
  const r = spawnSync(claude, args, { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
  if (!existsSync(outJson)) throw new Error(`plugin eval wrote no result (exit ${r.status}): ${r.stderr.slice(-800)}`);
  return collect(JSON.parse(readFileSync(outJson, 'utf8')));
}

function readTrace(tracePath) {
  // --keep-temp seals the temp dir (mode 000); open just enough to read the trace.
  const root = tracePath.split('/out/')[0];
  try { execFileSync('chmod', ['700', root]); } catch {}
  return existsSync(tracePath) ? readFileSync(tracePath, 'utf8') : '';
}

export function collect(result) {
  const records = [];
  for (const c of result.cases) {
    (c.arms.with ?? []).forEach((r, i) => {
      const text = r.tracePath ? readTrace(r.tracePath) : '';
      records.push({
        case: c.name,
        trial: i + 1,
        error: r.error ?? (r.aborted ? `aborted: ${r.aborted.reason}` : null),
        native: Object.fromEntries((r.graders ?? []).map((g) => [g.name, g.passed])),
        trajectory: text ? normalizeClaudeStream(text) : null,
        costUsd: r.costUsd ?? null,
        durationSeconds: r.durationSeconds ?? null,
      });
    });
  }
  return { records, claudeVersion: result.claudeVersion, costUsd: result.costUsd };
}
