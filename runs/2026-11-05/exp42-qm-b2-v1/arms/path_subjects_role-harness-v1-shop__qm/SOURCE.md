# role-harness-v1-shop

- 出典: `subjects/role-harness-v1`（最初の汎用版）の skills と agents を手を加えずに写し、アダプタを example/shop 用に埋めた（`experiments/structure/make-v1-shop.mjs`）
- アダプタの値は課題の CLAUDE.md にあることだけ。ほかは none（v1 にだけ余分な手がかりを与えないため）
- アダプタの読み込みは `.claude/CLAUDE.md`（workspace/）。ルートの CLAUDE.md は課題の履歴の一部で全 arm 共通のため。両方が読まれるかは段 5 の前の試走で確かめる
