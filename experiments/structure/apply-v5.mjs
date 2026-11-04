// Apply the v5b candidate (owner 2026-11-04: adopt after EXP-35 and EXP-36) to the design doc.
// Usage: node experiments/structure/apply-v4.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const cand = 'docs/planning/11-dev-role-design.v5b-candidate.md';
const reps = JSON.parse(readFileSync(cand, 'utf8').replace(/\r\n/g, '\n').match(/```json\n([\s\S]*?)\n```/)[1]);
let t = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
for (const r of reps) {
  const n = t.split(r.old).length - 1;
  if (n !== 1) throw new Error(`old text occurs ${n} times: ${r.old.slice(0, 50)}`);
  t = t.split(r.old).join(r.new);
}
const oldHead = '状態: **第 4 版（土台を確かめた結果に処置を結びつけた）**（2026-11-03。';
if (t.split(oldHead).length !== 2) throw new Error('header not found');
t = t.split(oldHead).join('状態: **第 5 版（誰が決めるか・誰に聞くかと案件アダプタ）**（2026-11-04。第 5 版の変更は `11-dev-role-design.v5b-candidate.md` の 2 か所（原則 X15 の書き直し、原則 X17 の追加、§2b の案件アダプタに置くもの）。オーナーの決定 2026-11-03・04 を入れ、EXP-35（仕事の選び間違いで第 4 版に非劣性）と EXP-36（工程を踏む割合で非劣性）を確かめてから採った。以下は第 4 版の説明: 2026-11-03。');
writeFileSync(src, t);
console.log(`applied ${reps.length} replacement(s) and the edition header`);
