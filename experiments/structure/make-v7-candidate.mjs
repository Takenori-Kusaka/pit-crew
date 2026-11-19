// Write docs/planning/11-dev-role-design.v7-candidate.md from design 11 (owner 2026-11-04: change the
// escape hatch and run one more experiment). EXP-39: given "compare options or write 自明", the agent
// wrote 自明 in 16/30 and compared in 2/30, even on registered non-obvious decision points. v7 makes
// the agent LIST the decision points of the named kinds and answer each one (options + reasons, or
// 自明 + why no alternative stands); "none" must be stated with a reason. Two replacements: step S3
// of §4.2 and the T1 design cell of §2b. Usage: node experiments/structure/make-v7-candidate.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const lines = readFileSync(src, 'utf8').replace(/\r\n/g, '\n').split('\n');
const one = (re) => { const m = lines.filter((l) => re.test(l)); if (m.length !== 1) throw new Error(`${re}: ${m.length} lines`); return m[0]; };
const trackRow = one(/^\| 2 設計 \| 不要 \| 省略可: /);
const s3 = one(/^\| \*\*S3 案を出す\*\* \| 4 \| /);
const KINDS = '作る / 作らない、既存を使う / 自作、新しいインターフェースやデータの形、外から見える名前、直し方が複数ある不具合';
const cells = s3.split('|');
// columns: '', 段, #, 手順, 要点, 出典, ''
cells[3] = ' 判断の点の一覧を書く ';
cells[4] = ` 「## 判断の点」の見出しで一覧を書く。この変更に含まれる判断の点（${KINDS}）を 1 行 1 点で挙げ、点ごとに「案 A / 案 B と、捨てた案の理由」か「自明: 代替が成り立たない理由」を同じ行に書く。少なくとも 1 つの案は「作らない / 既存を使う / 既存を広げる」の系から出す。点が 1 つも無いときは「判断の点: なし（理由）」と書く。一覧を書かずに実装に進まない `;
cells[5] = ' 〔実測〕EXP-39（「案を比べるか自明と書くか」の 2 択では自明 16/30・比較 2/30、設計のスキルの呼び出し 10/30）〔作法〕Ousterhout「Design it Twice」（[二次]）、feature-dev〔両氏〕miyagawa「Steal Good Ideas」〔GQ〕OSS 先調査ルール〔推論〕一覧の形 ';
const newS3 = cells.join('|');
const newTrackRow = trackRow.replace(
  '| 省略可: 解が 1 つなら書かない。妥当な案が複数あるなら PR 本文に数行（推奨と、捨てた案 1 つと理由） |',
  `| 判断の点の一覧（S3）を書く: 点があれば点ごとに案 2 つ以上と捨てた理由、無ければ「なし（理由）」。置き場所は調査メモか PR 本文 |`,
);
if (newTrackRow === trackRow) throw new Error('track row text not found');
const reps = [{ old: trackRow, new: newTrackRow }, { old: s3, new: newS3 }];
const body = `# 設計書 11 第 7 版の候補: 判断の点の一覧（逃げ道の形を変える）

作成: 2026-11-04 / 状態: **候補（EXP-40 の後にオーナーに採否を聞く）**
根拠: EXP-39 で「案を比べるか『自明』と書くか」の 2 択を与えると、エージェントは 16/30 で自明を選び、比較は 2/30。設計のスキルの呼び出しも 10/30 しか届かなかった。オーナー（2026-11-04）: 逃げ道を変えてもう 1 本
変更: (1) §4.2 S3 を「判断の点の一覧」に（点を列挙させ、点ごとに案か自明の理由を書かせる。無ければ理由つきで「なし」）。(2) §2b の T1 の設計の欄を同じ形に。(3) arm の核に S3 の規定を直接置く（\`build-arms.mjs\` の MskillD1K2。調査の規定を核に置いた MskillD2 と同じ型）
このファイルは \`experiments/structure/make-v7-candidate.mjs\` が設計書 11 から作る

## 置き換え（apply の台本が使う）

\`\`\`json
${JSON.stringify(reps, null, 1)}
\`\`\`
`;
writeFileSync('docs/planning/11-dev-role-design.v7-candidate.md', body);
console.log('wrote docs/planning/11-dev-role-design.v7-candidate.md');
