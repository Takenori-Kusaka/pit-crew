# 作業メモ（research-graded-quality.md の下書き用。取得ツールの要約経由で読んだ値）

取得は WebFetch（小型モデルが要約して返す）と tavily の検索抜粋。逐語の照合はしていない。

## 開いた一次（2026-11-13）

- METR 2025-08-12 https://metr.org/blog/2025-08-12-research-update-towards-reconciling-slowdown-with-time-horizons/
  - 18 課題（stdlib-js 15、hypothesis 3）、手で見たのは 15 PR（1 課題 1 run）。Claude 3.7 Sonnet、Inspect ReAct
  - 5 軸: core functionality / testing coverage / documentation / linting-formatting-typing / other code quality
  - 落ちた率（テスト不合格 n=11 / 合格 n=4）: core 100/25、test 91/100、doc 89/75、lint 73/75、other 64/50
  - 直す時間の見積り 平均 42 分、テスト合格分は 26 分（最短 15）。元の保守者の PR は平均 1.3 時間
  - 査読者の人数・保守者かどうかは書かれていない。時間の見積りは「very rough/high variance, subjective」
- METR 2026-03-10 https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/
  - 保守者 4 人（scikit-learn 2、Sphinx 1、pytest 1）、3 repo、AI の PR 296 件 + 人の正解 47 件
  - モデル: Claude 3.5 Sonnet(Old)/3.7 Sonnet/4 Opus/4.5 Sonnet、GPT-5
  - 自動採点が 24.2pt（SE 2.7）高い（正解パッチの merge 率 68% で正規化）。正規化なし 34.9pt
  - 却下理由の区分: code quality / other / breaks other code / core functionality failure（割合は図のみ）
  - 保守者間の一致率は報告なし。LLM judge との比較は無い
  - 「progress toward mergeable」の % も付けている（正解パッチ平均 約 90%）
- SlopCodeBench arXiv 2603.24755 https://arxiv.org/html/2603.24755（前 10 万字）
  - erosion = CC>10 の関数が持つ「複雑度の質量」の割合。質量 = CC × sqrt(SLOC)。閾値 10 は Radon
  - verbosity = ast-grep の 137 規則に当たる行 + 構造の重複（クローン）行の割合（LOC で正規化、重なりは 1 回）
  - テスト 4 種: Core / Error / Functionality（隠し）/ Regression（前の区切りの全テスト）。strict = 全部通る
  - 36 問・196 区切り・15 モデル。strict 最良 14.8%（GPT 5.5）、ISO 28.1%、core 67.3%（Opus 4.5）
  - erosion 上昇 77%、verbosity 上昇 75.5% の軌跡。人の repo 473 本と比べ erosion 2.0 倍、verbosity 2.3 倍
  - anti-slop / plan-first の指示: 初期の erosion 最大 −57.6%、strict は −2.4 / −3.6pt、費用 +12.1%、劣化は続く
  - 人の判断との照合は無い（閾値と規則は経験則）
- Overeager arXiv 2605.18583（Qu ら）https://arxiv.org/html/2605.18583
  - 決定的な trap predicate（rm_legacy 等）。500 場面・約 7,500 run・4 製品・6 モデル
  - 人の再注釈 50 件: κ=0.73、規則の precision 0.76 / recall 1.00
  - Claude Code×Sonnet-4.6 27.7%。同意文を消すと 3.9%→15.8%（76 場面）
  - 「the agent stops inferring boundaries and starts pattern-matching declaration text」
  - 完遂率（70〜75%）とは直交
- SWR-Bench arXiv 2509.01494 https://arxiv.org/html/2509.01494v2
  - 1,000 PR（Change 500 + Clean 500）、12 Python repo。正解 = レビューの時系列と commit から抽出した change-action（Gemini-2.5-Pro ×3 一致 → 院生 5 人が 2 重注釈、κ 66.08）
  - 採点 = LLM が「正解項目が当たったか」を判定。P/R/F1。Clean-PR への指摘は全部偽陽性
  - 判定器の検証: 100 報告で κ 70.6〜86.7、選好 1,000 対で κ 52.8〜62.0（人どうし 56.3〜62.6）。点数づけ型 judge は 31.0〜44.9
  - 最良 F1 約 19〜21%。recall は正解が 1 件の PR で 38.35%、5 件以上で 8.88%。偽陽性の主因: 文脈の理解不足 48%
- CRScore arXiv 2409.19801（NAACL 2025）https://arxiv.org/html/2409.19801v2
  - 参照なし。擬似参照 = LLM の主張 + 静的解析の smell。埋め込み類似度 τ=0.7314。conciseness=P、comprehensiveness=R、relevance=F
  - 人との Spearman 0.5431。GPT-4o judge は 0.605。BLEU ≈ 0。LLM の主張の約 17% は誤り・検証不能

## 追加で開いたもの（要点だけ。本文は research-graded-quality.md の出典表）

- c-CRAB 2603.23448 / CR-Bench 2603.11078 / OmniCode 2602.02262 / SWE-bench 2310.06770（付録 A.4・A.5）/ Sjøberg ら ESEM 2012（PDF 抽出）
- Kim ら 2506.07962（要旨）/ Norman ら 2606.19544 / Wang ら 2502.06193（要旨）/ FBI 2406.13439（要旨）/ PaperBench 2504.01848（要旨）/ Agent-as-a-Judge 2410.10934（要旨）/ Arena-Hard 2406.11939（要旨）
- Anthropic のシステムカード 3 本（Opus 5.5 は抽出、Opus 4.6・Mythos Preview は検索抜粋）
- 開けなかった / 開いていない: CodeReviewer 2203.09095、SWE-CI の本文、TestGenEval の原典、Papadakis らの本文

## GQ の件数（2026-11-13、gh）

検索 API: merged PR 2322 / issue 2604 / type:fix 725（PR と結び付き・閉 514）/ critical 195（fix 83、fix+linked+completed 67）/ bug 34 / hotfix 題名の merged PR 53 / revert 3 / back-merge 29 / 再発 64 / regression 19 / 回帰 9 / デグレ 5 / いま qm-blocked 5 / いま changes requested 4
標本 500（count-gq.mjs）: gq-pr-signals.json の summary を参照

## 検出下限

mde.mjs の出力が本文 §D-2 の表。模擬での検出力 0.79 / 0.80 / 0.80
