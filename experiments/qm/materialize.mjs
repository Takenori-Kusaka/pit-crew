// Materialise each QM cell for the independent re-derivation: the repository as the agent sees it
// (built on the host with the same history, branches included, checked out on the base) and the
// task text — and NOTHING else (no expected verdict, no checks, no scripts, no author notes).
// The re-derivation agent reads only the output directory.
//
// Usage: node experiments/qm/materialize.mjs [suites/qm/suite.yaml] [outDir=tmp/qm-rederive] [--cases a,b]
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { buildRepo } from './repo.mjs';

const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--cases='))?.slice(8) ?? '').split(',').filter(Boolean);
const [suitePath = 'suites/qm/suite.yaml', outDir = 'tmp/qm-rederive'] = args.filter((a) => !a.startsWith('--'));

const suite = loadSuite(suitePath);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const ids = [];
for (const c of suite.cases) {
  if (only.length && !only.includes(c.id)) continue;
  // loadSuite flattens params into the case (files / issue / prompt / history / extraFiles …).
  // Only the fixture-making fields are used; expectations (checks, scripts) never cross this line.
  const p = c;
  const kase = { repo: p.repo, issue: p.issue, issues: p.issues, prs: p.prs, history: p.history, files: p.files, extraFiles: p.extraFiles, checkout: p.checkout };
  const repo = buildRepo(kase);
  const dest = join(outDir, c.id);
  mkdirSync(dest, { recursive: true });
  cpSync(repo, join(dest, 'repo'), { recursive: true });
  rmSync(repo, { recursive: true, force: true });
  writeFileSync(join(dest, 'task.md'), `# ${c.id}\n\n依頼（受信箱の文面そのまま）:\n\n${p.prompt ?? p.request}\n\nリポジトリ: ./repo（エージェントが始める branch に checkout 済み。PR の head は refs/heads/<topic>。gh の固定資料は ./repo/.github-cache/、案件の値は ./repo/.claude/qm-adapter.md）\n`);
  ids.push(c.id);
}
writeFileSync(join(outDir, 'INDEX.md'), `# QM cells for re-derivation\n\n${ids.map((i) => `- ${i}/`).join('\n')}\n\n各ディレクトリ: repo/（git リポジトリ、branch 込み）と task.md。期待・判定・台本は含まない。\n`);
console.log(`${ids.length} cells -> ${outDir}`);
