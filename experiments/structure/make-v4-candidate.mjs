// Write docs/planning/11-dev-role-design.v4-candidate.md (EXP-27): the base check of the
// investigation step 2, with the result shown and the action tied to it. EXP-26: 3 of 4 harmed
// t5w runs ran the check (merge-base --is-ancestor prints nothing when the base is stale), saw
// or could have seen that the base was stale, and went on without bringing it in.
// Usage: node experiments/structure/make-v4-candidate.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const lines = readFileSync(src, 'utf8').split(/\r?\n/);
const find = (start) => { const hit = lines.filter((l) => l.startsWith(start)); if (hit.length !== 1) throw new Error(`${start}: ${hit.length} lines`); return hit[0]; };
const old = find('| | 2 | 土台を確かめる |');
const SRC = '〔事故〕I-12、I-23〔作法〕git 公式（git-diff: `A...B` は `git diff $(git merge-base A B) B` と同じ、`A..B` は 2 つの端点の比較。git-merge-base: --is-ancestor は祖先なら終了コード 0、でなければ 1 を返す。出力は定めていない。EXP-26 の記録では古い土台でも何も表示しなかった〔実測〕。git-log: `A..B` は B から届き A から届かない commit）。「混ざる」は定義からの推論〔推論〕。結果を表示して記録し、処置を同じ行に書くのは EXP-26 の観察（確かめたが取り込まずに進んだ 3/4）からの案〔推論〕';
const neu = '| | 2 | 土台を確かめる | どの branch・HEAD・環境を読んでいるかを記録する。作業する branch が base（main 等）の今の先端を含むかを `git merge-base --is-ancestor <base> HEAD && echo ok || echo stale` で確かめる（この命令は結果を終了コードで返すので、ok / stale を表示させる）。結果を状態ファイルに書く。**stale なら、調べる前に最新の base を取り込み（rebase か merge）、取り込んだ後の土台で調べ直す。stale のまま先へ進まない**。自分の変更だけを見るときは `git diff <base>...HEAD`（three-dot: merge-base からの差）、自分の commit だけを見るときは `git log <base>..HEAD`。`git diff <base>` と `git diff <base>..HEAD`（two-dot）は 2 つの先端を直接比べるので、分岐の後に base に入った変更が、自分が消したかのように混ざる | 全部 | ' + SRC + ' |';

const md = `# 設計書 11 第 4 版の候補: 土台を確かめた結果に処置を結びつける（EXP-27）

作成: 2026-11-03 / 状態: **候補**（オーナーの確認前。設計書 11 本体は変えていない）
根拠: EXP-26（t5w で害が残った 4 回のうち 3 回は、規定どおり土台を確かめたが、取り込まずに進んだ。\`git merge-base --is-ancestor\` は古い土台でも何も表示しない）、git 公式文書（\`docs/research/research-variant-search-and-base.md\` (B)）
このファイルは \`experiments/structure/make-v4-candidate.mjs\` が設計書 11 から作る。いまの書き方は設計書の行をそのまま写している

## 案

**いま（第 3 版）**

${old}

**案**

${neu}

## 案で言えないこと

- 結果を表示させ、処置を同じ行に書くと「確かめたが処置しない」が減るかは確かめていない（EXP-27 で探索として見る）
- \`--is-ancestor\` が結果を終了コードで返すことは git 公式文書（https://git-scm.com/docs/git-merge-base、2026-11-03 に確認）による。出力は文書に定めが無く、「何も表示しない」は EXP-26 の記録で見た挙動。表示させる書き方（\`&& echo ok || echo stale\`）は案

## 置き換え（build-variant.mjs が読む）

\`\`\`json
${JSON.stringify([{ old, new: neu }], null, 1)}
\`\`\`
`;
writeFileSync('docs/planning/11-dev-role-design.v4-candidate.md', md);
console.log('wrote v4 candidate');
