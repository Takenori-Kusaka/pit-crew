// Arms: each arm becomes a plugin directory the runner can load.
//   vanilla       empty plugin (manifest only)
//   current       the subject as it is on disk
//   docs-only     empty plugin; the subject's skill bodies are appended to the system prompt
//   ablate:<id>   the subject with one rule block removed
//   ref:<git-ref> the subject as it was at a git ref
//   append:<path> empty plugin; the file at <path> (from repo_root) is appended to the system prompt
//   <arm>@/<cmd>  any of the above, with the task prefixed by the harness's entry command
//
// Rule blocks are marked in skill / agent bodies with `<!-- rule:<id> -->` and run
// until the next rule marker or the end of the file. That marker is the only
// convention pit-wall asks a harness to follow.

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve as resolveFrom } from 'node:path';

const RULE = /<!--\s*rule:([\w.-]+)\s*-->/g;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function removeRule(text, ruleId) {
  const marks = [...text.matchAll(RULE)];
  const i = marks.findIndex((m) => m[1] === ruleId);
  if (i === -1) return text;
  const start = marks[i].index;
  const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
  return text.slice(0, start) + text.slice(end);
}

export function listRules(dir) {
  const ids = new Set();
  for (const f of walk(dir).filter((f) => f.endsWith('.md'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(RULE)) ids.add(m[1]);
  }
  return [...ids];
}

function writeManifest(dir, name) {
  mkdirSync(join(dir, '.claude-plugin'), { recursive: true });
  writeFileSync(join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name, version: '0.0.0' }, null, 2));
}

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n/, '');
}

// Text of every skill / agent body, for the docs-only arm.
export function subjectDocs(dir) {
  return walk(dir)
    .filter((f) => /\/(skills|agents)\//.test(f.replaceAll('\\', '/')) && f.endsWith('.md'))
    .map((f) => stripFrontmatter(readFileSync(f, 'utf8')).trim())
    .join('\n\n---\n\n');
}

// Build the plugin dir for one arm under `out`. Returns { dir, appendSystemPrompt }.
export function buildArm(armSpec, { subject, repoRoot, out, pluginName }) {
  // `<arm>@/<command>`: the harness's own entry, put in front of the task (for a role
  // harness, the session starts as that role, e.g. `path:subjects/x@/qm`).
  const m = armSpec.match(/^(.*)@(\/[\w:.-]+)$/);
  const arm = m ? m[1] : armSpec;
  const entry = m ? m[2] : null;
  return { ...buildArmDir(arm, { subject, repoRoot, out, pluginName }), entry };
}

function buildArmDir(arm, { subject, repoRoot, out, pluginName }) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const name = `${pluginName}-${arm.replace(/[^\w-]/g, '-')}`;
  if (arm === 'vanilla') { writeManifest(out, name); return { dir: out, appendSystemPrompt: null }; }
  if (arm === 'docs-only') { writeManifest(out, name); return { dir: out, appendSystemPrompt: subjectDocs(subject) }; }
  // A policy given in the system prompt (tau-bench style), with no harness loaded.
  if (arm.startsWith('append:')) { writeManifest(out, name); return { dir: out, appendSystemPrompt: readFileSync(resolveFrom(repoRoot, arm.slice(7)), 'utf8') }; }

  if (arm.startsWith('path:')) {
    // A different subject altogether (e.g. a control harness, or another harness to compare).
    cpSync(resolveFrom(repoRoot, arm.slice(5)), out, { recursive: true, filter: (src) => !/[\\/]evals([\\/]|$)/.test(src) });
  } else if (arm.startsWith('ref:')) {
    const ref = arm.slice(4);
    const rel = relative(repoRoot, subject).replaceAll('\\', '/');
    const tar = execFileSync('git', ['-C', repoRoot, 'archive', '--format=tar', ref, rel]);
    execFileSync('tar', ['-x', '-C', out, '--strip-components', String(rel.split('/').length)], { input: tar });
  } else {
    cpSync(subject, out, { recursive: true, filter: (src) => !/[\\/]evals([\\/]|$)/.test(src) });
  }
  if (arm.startsWith('ablate:')) {
    const id = arm.slice(7);
    for (const f of walk(out).filter((f) => f.endsWith('.md'))) {
      const t = readFileSync(f, 'utf8');
      const u = removeRule(t, id);
      if (u !== t) writeFileSync(f, u);
    }
  }
  writeManifest(out, name);
  return { dir: out, appendSystemPrompt: null };
}
