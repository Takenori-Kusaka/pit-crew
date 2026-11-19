// Apply the v4 candidate (owner, 2026-11-03: adopt) to the design doc. split/join only.
// Usage: node experiments/structure/apply-v4.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const cand = 'docs/planning/11-dev-role-design.v4-candidate.md';
const reps = JSON.parse(readFileSync(cand, 'utf8').replace(/\r\n/g, '\n').match(/```json\n([\s\S]*?)\n```/)[1]);
let t = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
for (const r of reps) {
  const n = t.split(r.old).length - 1;
  if (n !== 1) throw new Error(`old text occurs ${n} times: ${r.old.slice(0, 50)}`);
  t = t.split(r.old).join(r.new);
}
const oldHead = '状態: **第 3 版（同じ型を探す・土台を確かめるを具体にした）**（2026-11-02。';
if (t.split(oldHead).length !== 2) throw new Error('header not found');
t = t.split(oldHead).join('状態: **第 4 版（土台を確かめた結果に処置を結びつけた）**（2026-11-03。第 4 版の変更は `11-dev-role-design.v4-candidate.md` の 1 か所（調査の手順 2）で、オーナー採用は `21-status-summary-d1-confirm.md` §7。効果は EXP-27 の探索で向きのみ（差は示せない）。以下は第 3 版の説明: 2026-11-02。');
writeFileSync(src, t);
console.log(`applied ${reps.length} replacement(s) and the edition header`);
