// Build subjects/role-harness-v1-shop: role-harness-v1 (the first generic version) with its adapter
// filled for the example/shop cells (owner, 2026-11-03: v1 is one of the three baselines). The
// adapter repeats only what the cells' CLAUDE.md says, or "none", so v1 gets no extra hint.
// v1 imports the adapter from the root CLAUDE.md, which every arm shares; here the import goes in
// .claude/CLAUDE.md under workspace/ (Claude Code docs: a project CLAUDE.md can be ./CLAUDE.md or
// ./.claude/CLAUDE.md). Whether both are loaded is to be checked by a preflight run before stage 5.
// Usage: node experiments/structure/make-v1-shop.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = 'subjects/role-harness-v1';
const out = 'subjects/role-harness-v1-shop';
const NONE = 'none — not defined in this project (see CLAUDE.md)';
const values = {
  'docs.design': 'none — this project has no design documents; investigation outputs (change plan, notes) go to `notes/<ticket id>.md` (CLAUDE.md)',
  'commands.local_checks': '`bash scripts/verify.sh` runs every `tests/*_test.sh` and records the run (CLAUDE.md)',
  'commands.ready_check': '`bash scripts/verify.sh` (CLAUDE.md)',
  'records.change_request_format': 'commit with the ticket id at the start of the message (CLAUDE.md)',
  'records.completion_evidence': 'the commands run and their output, in the final report',
  'branch.feature': 'main is the base (the repository has main)',
  'branch.integration': 'main',
  'branch.release': 'main',
};
const template = readFileSync(join(src, 'adapter', 'ADAPTER.template.md'), 'utf8').replace(/\r\n/g, '\n');
const filled = template.split('\n').map((l) => {
  const m = l.match(/^\| `([a-z_.]+)` \|(.*)\| *$/);
  if (!m) return l;
  const cells = l.split('|');
  cells[cells.length - 2] = ` ${values[m[1]] ?? NONE} `;
  return cells.join('|');
}).join('\n').replace('# Harness adapter (role-harness v1)', '# Harness adapter (role-harness v1) — example/shop');
const snippet = readFileSync(join(src, 'adapter', 'CLAUDE.md.snippet'), 'utf8').replace(/\r\n/g, '\n').replace('@docs/HARNESS-ADAPTER.md', '@HARNESS-ADAPTER.md');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const d of ['skills', 'agents']) cpSync(join(src, d), join(out, d), { recursive: true });
mkdirSync(join(out, 'workspace', '.claude'), { recursive: true });
writeFileSync(join(out, 'workspace', '.claude', 'HARNESS-ADAPTER.md'), filled);
writeFileSync(join(out, 'workspace', '.claude', 'CLAUDE.md'), snippet);
const empty = (filled.match(/\|\s*\|\s*$/gm) ?? []).length;
writeFileSync(join(out, 'SOURCE.md'), `# role-harness-v1-shop\n\n- 出典: \`${src}\`（最初の汎用版）の skills と agents を手を加えずに写し、アダプタを example/shop 用に埋めた（\`experiments/structure/make-v1-shop.mjs\`）\n- アダプタの値は課題の CLAUDE.md にあることだけ。ほかは none（v1 にだけ余分な手がかりを与えないため）\n- アダプタの読み込みは \`.claude/CLAUDE.md\`（workspace/）。ルートの CLAUDE.md は課題の履歴の一部で全 arm 共通のため。両方が読まれるかは段 5 の前の試走で確かめる\n`);
console.log(`wrote ${out}: ${Object.keys(values).length} keys from CLAUDE.md, the rest none; empty value cells left: ${empty}`);
