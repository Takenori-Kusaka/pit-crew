// Apply the adopted replacements of the v3 candidate to the design doc (owner, 2026-11-02:
// adopt both). Uses split/join (no `$` replacement patterns). Each old text must occur once.
// Usage: node experiments/structure/apply-v3.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const cand = 'docs/planning/11-dev-role-design.v3-candidate.md';
const reps = JSON.parse(readFileSync(cand, 'utf8').replace(/\r\n/g, '\n').match(/```json\n([\s\S]*?)\n```/)[1]);
let t = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
for (const r of reps) {
  const n = t.split(r.old).length - 1;
  if (n !== 1) throw new Error(`old text occurs ${n} times: ${r.old.slice(0, 50)}`);
  t = t.split(r.old).join(r.new);
}
const oldHead = '作成: 2026-11-02 / 状態: **第 2 版（証拠にもとづく直し）**（2026-11-02。';
if (t.split(oldHead).length !== 2) throw new Error('header not found');
t = t.split(oldHead).join('作成: 2026-11-02 / 状態: **第 3 版（同じ型を探す・土台を確かめるを具体にした）**（2026-11-02。第 3 版の変更は `11-dev-role-design.v3-candidate.md` の 3 か所で、根拠は `docs/research/research-variant-search-and-base.md`、オーナー採用は `19-status-summary-rule-content.md` §7。効果は EXP-25 で未確認（規定が読まれていなかった）。以下は第 2 版の説明: ');
writeFileSync(src, t);
console.log(`applied ${reps.length} replacements and the edition header`);
