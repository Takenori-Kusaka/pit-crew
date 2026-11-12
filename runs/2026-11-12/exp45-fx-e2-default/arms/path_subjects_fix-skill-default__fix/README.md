# fix-skill-default — 既定の fix スキル（M-skill 型）

設計書 `docs/planning/30-fix-role-design.md`（初版、オーナー承認 2026-11-06）と、それが再利用する Dev 設計書 `11-dev-role-design.md` §4.7「改修」を、Dev / QM の既定と同じ構造で Claude Code のスキルにしたもの。

| パス | 中身 |
|---|---|
| `skills/fix/SKILL.md` | 核。受ける上限（4 条件）・原則 Z1〜Z9・宛先の表・工程の一覧 F0〜F4・出る条件。状態ファイル `.fix-state.md`。最初の編集の前に F0 を呼ぶ 1 文（Dev の D1 と同型） |
| `skills/fix-phase-<n>-<name>/SKILL.md` | 工程 F0〜F4 の手順。F0 は設計書 30 の新設、F1〜F4 は 11 §4.7 の手順表 1〜12 を工程ごとに分けたもの。`user-invocable: false` |

## 作り直し方

```
node experiments/fix/build-fix-skills.mjs            # skills/ を作り直す
node experiments/fix/build-fix-skills.mjs --check    # 設計書の全内容行がスキルに入っていることを確かめる
```
