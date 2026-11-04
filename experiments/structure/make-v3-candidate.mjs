// Write docs/planning/11-dev-role-design.v3-candidate.md (EXP-25): the current wording of two
// rules, taken verbatim from the design doc by line content, and the proposed wording, with the
// machine-readable replacements block used by build-variant.mjs.
// Usage: node experiments/structure/make-v3-candidate.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'docs/planning/11-dev-role-design.md';
const lines = readFileSync(src, 'utf8').split(/\r?\n/);
const find = (start) => { const hit = lines.filter((l) => l.startsWith(start)); if (hit.length !== 1) throw new Error(`${start}: ${hit.length} lines`); return hit[0]; };

const SRC_A = '〔実証〕Park ほか MSR 2012（補足修正の多くは最初の修正と内容が似ておらず、文字列・クローンの一致だけでは漏れの場所を予測できない。漏れの多くは近く、または直接の呼び出し・参照の先にある）、Nguyen ほか ICSE 2010（同じ役割のコード code peers で繰り返す修正）、Yin ほか FSE 2011（同じ根本原因の箇所の直し忘れ）〔作法〕CodeQL の variant analysis（既知の欠陥を種に論理上の変種を探す）、Project Zero 2022（根本原因の分析が変種探しの前提）、git 公式（log -G / -L）';
const reps = [
  {
    label: 'A 原則（調査の考え方）',
    old: find('- **1 つ見つけたら、同じ型を探す。**'),
    new: '- **1 つ見つけたら、同じ型を探す。字面ではなく、何を計算・判断しているか（根本原因）で探す。** テストをすり抜けた不具合は、見落としていた視点を示している。次の 3 つで探し、検索した結果（件数・場所・使った検索）を残す。見えている式や文字列の grep だけで終えない。(1) 意味で探す: 誤りを言葉にし（例:「日付を UTC ではなく現地時刻で比べている」）、その概念の語・コメントの語・同じ計算の別の書き方で検索する (2) 構造で探す: 直す箇所の呼び出し元・呼び出し先と、同じ役割の関数（共通の helper を含む）を開いて確かめる (3) 履歴で探す: 誤りを入れた commit を特定し（`git log -L`・blame）、`git log -G<正規表現>` で同じ形の変更を探す〔両氏〕同上（要旨）〔GQ〕dev-process/feature-change-lateral-spread' + SRC_A + '。(1)〜(3) の組み合わせで見落としがどれだけ減るかは文献に無い〔推論〕',
  },
  {
    label: 'A 改修の手順 6',
    old: find('| | 6 | 同じ型を探す |'),
    new: '| | 6 | 同じ型を探す | 1 件直したら、原則「1 つ見つけたら、同じ型を探す」の 3 つ（意味・構造・履歴）で同じ型の箇所を探し、件数・場所・使った検索を残す。見えている式の grep だけで終えない | 〔両氏〕t-wada（同じ種類の誤りが他にないか。件数と場所を残すのは言い換え〔推論〕）〔GQ〕dev-process/feature-change-lateral-spread' + SRC_A + ' |',
  },
  {
    label: 'B 調査の手順 2（土台）',
    old: find('| | 2 | 土台を確かめる |'),
    new: '| | 2 | 土台を確かめる | どの branch・HEAD・環境を読んでいるかを記録する。作業する branch が base（main 等）の今の先端を含むかを `git merge-base --is-ancestor <base> HEAD` で確かめ、含まなければ最新の base を取り込んでから調べる。自分の変更だけを見るときは `git diff <base>...HEAD`（three-dot: merge-base からの差）、自分の commit だけを見るときは `git log <base>..HEAD`。`git diff <base>` と `git diff <base>..HEAD`（two-dot）は 2 つの先端を直接比べるので、分岐の後に base に入った変更が、自分が消したかのように混ざる | 全部 | 〔事故〕I-12、I-23〔作法〕git 公式（git-diff: `A...B` は `git diff $(git merge-base A B) B` と同じ、`A..B` は 2 つの端点の比較。git-merge-base: --is-ancestor。git-log: `A..B` は B から届き A から届かない commit）。「混ざる」は定義からの推論〔推論〕 |',
  },
];

const md = `# 設計書 11 第 3 版の候補: 「同じ型を探す」と「土台を確かめる」を具体にする（EXP-25）

作成: 2026-11-02 / 状態: **候補**（オーナーの確認前。設計書 11 本体は変えていない）
根拠: \`docs/research/research-variant-search-and-base.md\`（一次資料の確認つき）、EXP-23（t4 の修正漏れ 17/29、漏れた試行は共通の関数に一度も行き着かなかった）、EXP-24（t5 の害 1 回は two-dot で main と比べて古い土台のまま進んだ）
このファイルは \`experiments/structure/make-v3-candidate.mjs\` が設計書 11 から作る。いまの書き方は設計書の行をそのまま写している

## なぜ具体にするか

- いまの「同じ型を探す」は「同じ種類の誤りが他にないかを確かめ、検索した結果を残す」で、何で探すかを書いていない。EXP-23 では全 29 回が見えている式（90・99）を grep し、漏れた 17 回は名前も書き方も違う共通の関数 \`round_tenth\` を一度も開かなかった。文献も、修正漏れの多くは最初の修正と内容が似ておらず、文字列やクローンの一致では予測できないとする（Park ほか MSR 2012）
- いまの「土台を確かめる」は「three-dot で見る」と書くが、three-dot が何で、two-dot だと何が起きるか、土台が古いときに何をするかを書いていない。EXP-24 の害の 1 回は \`git diff main\`（two-dot）で比べ、rebase せずに進んだ

## 案

${reps.map((r) => `### ${r.label}\n\n**いま**\n\n${r.old}\n\n**案**\n\n${r.new}\n`).join('\n')}
## 案で言えないこと

- (1)〜(3) を書くと見落としが減るかは、文献では示されていない（効果量は無い）。EXP-25 で確かめる
- 文献は 2004〜2012 年の C / Java の開発が対象で、AI エージェントの見落とし率の根拠にはならない
- two-dot の誤用がどれくらい起きるかの資料は無い。事故（I-12・I-23）と EXP-24 の 1 回だけ

## 置き換え（build-variant.mjs が読む）

\`\`\`json
${JSON.stringify(reps.map(({ old, new: n }) => ({ old, new: n })), null, 1)}
\`\`\`
`;
writeFileSync('docs/planning/11-dev-role-design.v3-candidate.md', md);
console.log(`wrote candidate with ${reps.length} replacements`);
