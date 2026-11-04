# dev-skill-default — 既定の Dev スキル（M-skill 型）

設計書 `docs/planning/11-dev-role-design.md`（第 5 版）を、既定の構造で Claude Code のスキルにしたもの。**手で編集しない**。中身を直すときは設計書 11 を直し、下の手順で作り直す。

## 何が入っているか

| パス | 中身 |
|---|---|
| `skills/dev/SKILL.md` | 核（`subjects/dev-structure/MskillD1` と同一）。受け付けの後、実装の前に、必ず調査の工程のスキルを呼ぶ案内を含む。工程をまたぐ原則（§2b 軌道・§3 原則）、工程の一覧、各工程の入る / 出る条件、工程の決め方の案内（状態ファイル `.dev-state.md` と成果物で決め、工程に入るときと圧縮の後にその工程のスキルを呼び直す。状態ファイルは commit せず、外すなら `.gitignore` に書く） |
| `skills/dev-phase-<n>-<name>/SKILL.md` | 工程 0〜8 の手順（入る / 出る条件を除いた中身）。`user-invocable: false`。核の指示で名指しで呼ばれる |

## なぜこの構造か

- 決定: オーナー 2026-11-02（`docs/planning/15-status-summary-structure-2.md` §7）
- 根拠: EXP-20・21（同じ中身で、全工程を 1 列に並べる F より、変更計画を実装の前に書く順序が守られた。常時読む量をそろえても差が残った）。工程の中身をスキルにするのは、実験の向きと、圧縮の後に再添付されるのが呼んだスキルであること（Claude Code docs "Skills"）による。確度と言えないことは 15 §4・§6 を読む
- 第 5 版（2026-11-04）で、誰が決めるか・誰に聞くか（原則 X15）と案件アダプタ（原則 X17）を入れた。オーナーの決定（技術判断者を置き、聞く先を 1 つに。PO の範囲はピットイン型）。EXP-35・36 で第 4 版に非劣性を確かめてから採った
- 第 4 版（2026-11-03）で、土台を確かめた結果（ok / stale）を表示させ、stale なら取り込んでから進む書き方にした（`docs/planning/21-status-summary-d1-confirm.md` §7）。EXP-27 の探索で、確かめたが取り込まない試行 0/14（前の版 5/30）、差は示せていない
- D1 は EXP-27 の独立のやり直しで t4 の害を減らした（19/30 → 9/30、p = 0.019）。小さい依頼で不要な手続きは増えなかった
- 届け方は D1（2026-11-03、`docs/planning/20-status-summary-rule-delivery.md` §7）: EXP-26 で、調査の工程を呼ぶ率が 3/15 → 14/15・4/15 → 13/15、規定が求める行動が増えた。害は減る向き（9/15 → 3/15、4/15 → 2/15）だが事前の規則では示せていない
- 第 3 版（2026-11-02）で「同じ型を探す」「土台を確かめる」を具体にした（`docs/planning/19-status-summary-rule-content.md` §7）。効果は未確認（EXP-25 で規定が読まれていなかった）
- 状態ファイルの案内のうち順序に効くのは「工程に入るときに手順を読み直し、状態ファイルに書く」動作（EXP-23）。判断の文（推測で決めず状態ファイルと成果物で決める）も残している理由は `docs/planning/17-status-summary-structure-4.md` §6 推奨 2
- 状態ファイルの一文は EXP-21 の副作用（`.git/info/exclude` への書き込みが拒まれ commit が残らなかった、2/40）への対処。足した後、EXP-22 で `.git/` への書き込み・commit 無しは 0/20（差は言えないが向きは減った）

## 使い方

`skills/` 以下を、対象リポジトリの `.claude/skills/`（またはユーザーの `~/.claude/skills/`）に置く。依頼の前に `/dev` を付けると核が呼ばれる。案件ごとの値（成果物の置き場所、テストの走らせ方、commit の書き方、聞く先と経路、決める範囲の上書き、戻せない操作と承認者）は、対象リポジトリの `.claude/dev-adapter.md`（無ければ CLAUDE.md）に書く（原則 X17）（例: `suites/structure/suite.yaml` の CLAUDE.md）

## 作り直し方

```
node experiments/structure/build-arms.mjs     # subjects/dev-structure/* と、このディレクトリの skills/ を作り直す
node experiments/structure/check-arms.mjs     # どの arm も設計書 11 と同じ中身の行を持つことを確かめる
diff -r subjects/dev-structure/MskillD1/skills subjects/dev-skill-default/skills   # 実験の arm と同一であること
```

実験で走らせたのは `subjects/dev-structure/MskillD1`（このディレクトリと同一。EXP-26）。
