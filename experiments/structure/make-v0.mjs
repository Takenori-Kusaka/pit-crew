// Build subjects/ganbari-quest-v0 (the GQ harness before generalisation: the 5 role skills and 5
// agents of .claude/ at GQ commit 0b32d8bab) from a clone of the public repository
// Takenori-Kusaka/ganbari-quest (AGPL-3.0). The copy is a comparison target, not part of this
// repository's harness, so public snapshots leave it out (owner 2026-11-13) and anyone who needs it
// rebuilds it with this script, then subjects/ganbari-quest-v0-full with make-v0full.mjs.
// Usage: node experiments/structure/make-v0.mjs <path to a ganbari-quest clone> [--check]
//   --check  compare with the existing subjects/ganbari-quest-v0 instead of writing
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const gq = process.argv[2];
const check = process.argv.includes('--check');
if (!gq) { console.error('usage: make-v0.mjs <ganbari-quest clone> [--check]'); process.exit(1); }
const COMMIT = '0b32d8bab2e0e6f7ac29eda3d8e646572189dd12';
const ROLES = ['po', 'dev', 'qm', 'platform', 'audit'];
const AGENTS = ['po-session', 'dev-session', 'qm-session', 'platform-session', 'audit-manager'];
const out = 'subjects/ganbari-quest-v0';
const show = (p) => execFileSync('git', ['show', `${COMMIT}:${p}`], { cwd: gq, maxBuffer: 1 << 26 });
const files = [
  ...ROLES.map((r) => [`.claude/skills/${r}/SKILL.md`, `skills/${r}/SKILL.md`]),
  ...AGENTS.map((a) => [`.claude/agents/${a}.md`, `agents/${a}.md`]),
];
let diff = 0;
for (const [src, dst] of files) {
  const data = show(src), f = join(out, dst);
  if (check) {
    const same = existsSync(f) && Buffer.compare(readFileSync(f), data) === 0;
    if (!same) { console.log(`DIFFERENT ${dst}`); diff++; }
    continue;
  }
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, data);
}
if (check) { console.log(diff ? `${diff} file(s) differ` : `OK: ${files.length} files identical to GQ ${COMMIT.slice(0, 9)}`); process.exit(diff ? 1 : 0); }
console.log(`wrote ${files.length} files to ${out} (SOURCE.md is tracked in this repository and kept)`);
