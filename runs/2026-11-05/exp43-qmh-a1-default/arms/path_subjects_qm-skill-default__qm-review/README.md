# qm-skill-default — 既定の QM スキル（M-skill 型）

設計書 `docs/planning/26-qm-role-design.md`（第 2 版、オーナー承認 2026-11-04）を、Dev の既定（`subjects/dev-skill-default`）と同じ構造で Claude Code のスキルにしたもの。**手で編集しない**。中身を直すときは設計書 26 を直し、下の手順で作り直す。

## 何が入っているか

| パス | 中身 |
|---|---|
| `skills/qm-review/SKILL.md` | 変更の独立レビューの核。工程をまたぐ原則（設計書 §2b 深さ・§3 原則 Y1〜Y15・付表 3a 宛先の表）、工程の一覧（V0〜V6 + VQ）、各工程の入る / 出る条件、工程の決め方の案内（状態ファイル `.qm-state.md` と成果物で決め、工程に入るときと圧縮の後にその工程のスキルを呼び直す）、**判定の前に必ず文脈の工程（`qm-review-phase-2-context`）を呼ぶ**案内（Dev の D1 と同型）、レビュー対象を編集しない案内 |
| `skills/qm-review-phase-<n>-<name>/SKILL.md` | 工程 V0〜V6 の手順（入る / 出る条件を除いた中身）。`user-invocable: false`。核の指示で名指しで呼ばれる |
| `skills/qm-ship/SKILL.md` | 出荷判定の核。同じ原則 + 工程 S0〜S5（短いので手順も同じファイルに） |

## なぜこの構造か

- M-skill 型（核 + 状態ファイル + 名指しで呼ぶ工程スキル）は Dev で実験して採った構造（EXP-20〜27、オーナー 2026-11-02 / 11-03）。QM で同じ形が効くかは未確認で、計画 27 段 2 の初期値として置く
- 「判定の前に V2 を呼ぶ」の 1 文は、Dev の D1（調査の工程を呼ばせる 1 文、EXP-26 で呼ぶ率 3/15 → 14/15）と同型。会社で詰まった 2 点（設計書を読まずにレビュー / 権限外に答えた）に答える規定は V2 と Y3 にあり、呼ばれなければ届かない
- 2 つの核は同じ原則の本文を持つ（スキルは互いを参照できないため）。生成元は 1 つ

## 使い方

`skills/` 以下を、対象リポジトリの `.claude/skills/` に置く。依頼の前に `/qm-review` または `/qm-ship` を付ける。案件ごとの値（レーンと必須の検査、変更パス → 設計書の対応表、severity 表、`verdict`、label の語彙、宛先の表の上書き、戻せない操作の承認者、修正の宛先）は、対象リポジトリの `.claude/qm-adapter.md`（無ければ CLAUDE.md）に書く（設計書 26 §6）。

## 作り直し方

```
node experiments/qm/build-qm-skills.mjs            # skills/ を作り直す
node experiments/qm/build-qm-skills.mjs --check    # 設計書の全内容行がスキルに入っていることを確かめる
```
