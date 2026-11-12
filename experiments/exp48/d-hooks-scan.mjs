#!/usr/bin/env node
// EXP-48: what arm D's .claude/settings.json would run in the agent container, read statically
// from the candidates' pre-fix commits (no agent runs). Output: hook commands by event, matcher
// and script name, with what each script reaches for (gh, network, git, graphify) and whether it
// can block a tool call. Counts and names only; no script text.
//   node experiments/exp48/d-hooks-scan.mjs            -> experiments/exp48/d-hooks.json
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const L = join(ROOT, 'local/exp48-gq');
const git = (args) => { try { return execFileSync('git', args, { cwd: join(L, 'gq.git'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }); } catch { return null; } };
const ids = readFileSync(join(L, 'verify/ids.txt'), 'utf8').trim().split('\n');
const hooks = {};
const perTask = [];
for (const id of ids) {
  const spec = JSON.parse(readFileSync(join(L, 'verify/specs', `${id}.json`), 'utf8'));
  const c = spec.prefix_commit;
  const text = git(['show', `${c}:.claude/settings.json`]);
  const row = { id, settings: !!text, hookCommands: 0, permissions: null, env: 0, graphifyOutTracked: (git(['ls-tree', '-r', '--name-only', c, '--', 'graphify-out']) ?? '').split('\n').filter(Boolean).length, instructionFilesNamingGraphify: (git(['grep', '-l', '-i', 'graphify', c, '--', '*CLAUDE.md', 'AGENTS.md', '.claude/', 'docs/sessions/']) ?? '').split('\n').filter(Boolean).length, instructionFilesNamingGh: (git(['grep', '-l', '-E', '\\bgh (issue|pr|api|run|label)\\b', c, '--', '*CLAUDE.md', 'AGENTS.md', '.claude/', 'docs/sessions/']) ?? '').split('\n').filter(Boolean).length };
  if (text) {
    let j = null;
    try { j = JSON.parse(text); } catch { /* not JSON */ }
    if (j) {
      row.permissions = { allow: (j.permissions?.allow ?? []).length, deny: (j.permissions?.deny ?? []).length, ask: (j.permissions?.ask ?? []).length, defaultMode: j.permissions?.defaultMode ?? null };
      row.env = Object.keys(j.env ?? {}).length;
      for (const [event, groups] of Object.entries(j.hooks ?? {})) for (const grp of groups ?? []) for (const h of grp.hooks ?? []) {
        row.hookCommands++;
        const cmd = String(h.command ?? '');
        const m = cmd.match(/([\w./$-]+\.(?:mjs|js|cjs|sh))/);
        const script = m ? m[1].replace(/^.*?(\.claude\/)/, '$1') : null;
        const onBash = !grp.matcher || new RegExp(`^(?:${grp.matcher})$`).test('Bash');
        const key = `${event} [${onBash ? 'Bash' : 'other'}/${String(grp.matcher ?? '*').split('|').length}] ${script ?? cmd.trim().split(/\s+/).slice(0, 2).join(' ')}`;
        if (!hooks[key]) {
          const src = script ? git(['show', `${c}:${script}`]) : null;
          hooks[key] = { event, appliesToBash: onBash, toolsInMatcher: String(grp.matcher ?? '*').split('|').length, script, firstWord: cmd.trim().split(/\s+/)[0], tasks: 0, scriptFound: !!src, lines: src ? src.split('\n').length : null, callsGh: src ? /\bgh\s+\w|['"`]gh['"`]/.test(src) : null, usesNetwork: src ? /https?:\/\/|\bfetch\(/.test(src) : null, callsGit: src ? /['"`\s]git\s/.test(src) : null, namesGraphify: src ? /graphify/.test(src) : null, canBlock: src ? /exit\(2\)|permissionDecision|"decision"/.test(src) : null, readsStdin: src ? /stdin/.test(src) : null };
        }
        hooks[key].tasks++;
      }
    }
  }
  perTask.push(row);
}
const doc = {
  what: 'EXP-48: static reading of arm D\'s .claude/settings.json at the pre-fix commit of each candidate (no agent run). Names, booleans and counts only.',
  candidates: perTask.length,
  withSettings: perTask.filter((r) => r.settings).length,
  withAnyPermissionRule: perTask.filter((r) => r.permissions && (r.permissions.allow + r.permissions.deny + r.permissions.ask > 0 || r.permissions.defaultMode)).length,
  withGraphifyOutTracked: perTask.filter((r) => r.graphifyOutTracked > 0).map((r) => r.id),
  withInstructionFilesNamingGraphify: perTask.filter((r) => r.instructionFilesNamingGraphify > 0).map((r) => r.id),
  withInstructionFilesNamingGh: perTask.filter((r) => r.instructionFilesNamingGh > 0).length,
  hooks: Object.values(hooks).sort((a, b) => b.tasks - a.tasks),
  perTask,
};
writeFileSync(join(ROOT, 'experiments/exp48/d-hooks.json'), `${JSON.stringify(doc, null, 1)}\n`);
process.stdout.write(`${JSON.stringify({ candidates: doc.candidates, withSettings: doc.withSettings, permissionRules: doc.withAnyPermissionRule, graphifyOut: doc.withGraphifyOutTracked.length, namingGraphify: doc.withInstructionFilesNamingGraphify.length, namingGh: doc.withInstructionFilesNamingGh })}\n`);
for (const h of doc.hooks) process.stdout.write(`${h.tasks}x ${h.event} [bash=${h.appliesToBash}] ${h.script ?? h.firstWord} gh=${h.callsGh} net=${h.usesNetwork} git=${h.callsGit} graphify=${h.namesGraphify} block=${h.canBlock}\n`);
void existsSync;
