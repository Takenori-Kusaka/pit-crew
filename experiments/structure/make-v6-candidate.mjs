// Write docs/planning/11-dev-role-design.v6-candidate.md from design 11: make the design phase's
// trigger concrete so that "compare two or more options" is either done or explicitly declined with
// a reason (EXP-32 E scoring: no comparison in any arm). Two replacements: the T1 cell of the
// design row in the track table (§2b) and step S3 of §4.2. The arm also gets a navigation sentence
// (build-arms.mjs D2_NAV, arm MskillD1N2). Usage: node experiments/structure/make-v6-candidate.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const lines = readFileSync(src, 'utf8').replace(/\r\n/g, '\n').split('\n');
const one = (re) => { const m = lines.filter((l) => re.test(l)); if (m.length !== 1) throw new Error(`${re}: ${m.length} lines`); return m[0]; };
const trackRow = one(/^\| 2 設計 \| 不要 \| 省略可: /);
const s3 = one(/^\| \*\*S3 案を出す\*\* \| 4 \| /);

const TRIGGER = '判断の点（作る / 作らない、既存を使う / 自作、新しいインターフェースやデータの形、外から見える名前、直し方が複数ある不具合、のどれか）';
const newTrackRow = trackRow.replace(
  '| 省略可: 解が 1 つなら書かない。妥当な案が複数あるなら PR 本文に数行（推奨と、捨てた案 1 つと理由） |',
  `| ${TRIGGER}があれば、根本的に違う案を 2 つ以上と、捨てた案の理由を数行で書く（置き場所は調査メモか PR 本文）。無ければ「自明: <理由 1 行>」と書く。どちらも書かずに実装に進まない |`,
);
if (newTrackRow === trackRow) throw new Error('track row text not found');
const newS3 = s3.replace(
  '| 案を比べる（自明に 1 つでないとき） | 妥当な案が自明に 1 つでないときだけ、根本的に違う案を 2 つ以上出す。',
  `| 案を比べるか、自明と書く | ${TRIGGER}に当たれば、根本的に違う案を 2 つ以上出し、少なくとも 1 つは「作らない / 既存を使う / 既存を広げる」の系にする。当たらなければ「自明: <理由 1 行>」と書いて次へ進む（書かずに進まない）。`,
);
if (newS3 === s3) throw new Error('S3 text not found');
const reps = [{ old: trackRow, new: newTrackRow }, { old: s3, new: newS3 }];
const body = `# 設計書 11 第 6 版の候補: 案を比べる工程の届け方（EXP-32 の E 採点で全 arm 0）

作成: 2026-11-04 / 状態: **候補（EXP-39 の後にオーナーに採否を聞く）**
根拠: EXP-32 の E 系列（探索）で「方向の違う案を 2 つ以上比べる」が既定のスキルを含む全 arm で 0。原因の候補 [推論]: §2b で T1 の設計は「省略可」、§4.2 S3 は「自明に 1 つでないときだけ」で、エージェントが自明と判断して飛ばせる。調査の工程では同じ型を D1（必ず呼ぶ 1 文）が直した（EXP-26・27）
このファイルは \`experiments/structure/make-v6-candidate.mjs\` が設計書 11 から作る。arm の核には \`build-arms.mjs\` の D2_NAV（調査の後、実装の前に設計のスキルを必ず呼ぶ）も足す（arm MskillD1N2 → 本候補を当てて MskillD1V6）

## 案

| | いま（第 5 版） | 案 |
|---|---|---|
| §2b 設計の T1 | 省略可: 解が 1 つなら書かない | 判断の点があれば案 2 つ以上と捨てた理由、無ければ「自明: 理由 1 行」。書かずに進まない |
| §4.2 S3 | 自明に 1 つでないときだけ案を出す | 判断の点の種類を列挙して引き金にし、1 案は「作らない / 既存を使う」系。当たらなければ「自明」と理由 |
| 核（arm） | 調査のスキルを必ず呼ぶ（D1） | ＋ 設計のスキルを必ず呼ぶ（D2_NAV） |

## 置き換え（apply の台本が使う）

\`\`\`json
${JSON.stringify(reps, null, 1)}
\`\`\`
`;
writeFileSync('docs/planning/11-dev-role-design.v6-candidate.md', body);
console.log('wrote docs/planning/11-dev-role-design.v6-candidate.md');
