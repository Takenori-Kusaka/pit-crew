# ganbari-quest-v0（チューニング前の基準点）

- 出典: がんばりクエスト（ganbari-quest-po クローン）の `.claude/skills/` のうちロール本体 5 個（po / dev / qm / platform / audit）と `.claude/agents/` 5 個、commit `0b32d8bab`（2026-11-01 時点）。手を加えずに写した
- 範囲（オーナー合意 2026-11-01）: ロール本体だけ。ロールが使う作業手順（issue-triage / dev-open-pr / impact-analysis / regression-check / pr-review / adversarial-reviewer / policy-compliance）は、汎用化の段階で別の版として足して測る。製品・道具に固有のスキル 14 個は対象外
- 位置づけ: 汎用ハーネスを作る前の**プロジェクト固有のハーネス**。汎用化・チューニングの各版をここから測り、評価で改善か改悪かを判定できるか（評価の妥当性と PDCA）を確かめるための基準点（オーナー 2026-11-01）
- 載せていないもの: hooks、settings、CLAUDE.md（プラグインとして読み込めるのは skills と agents だけ）
- 秘密情報・会社の情報の検査: トークン・Webhook・メールアドレスの形、「会社」「社外秘」を検索して 0 件（2026-11-01）
- 公開前に、中身を改めて確認すること（このリポジトリは現在ローカルのみ）
- **公開版には中身を載せない**（オーナー 2026-11-13: GQ が比較の相手ならはぶく）。作り直し: `node experiments/structure/make-v0.mjs <公開の ganbari-quest のクローン>`（GQ commit `0b32d8bab2e0e6f7ac29eda3d8e646572189dd12`、`--check` でバイト単位の一致を確かめる）。ライセンスは GQ と同じ AGPL-3.0
