# roombook — 案件アダプタ（Dev）

この案件で Dev が使う値。レビューと差し戻し対応の値は `.claude/qm-adapter.md`。

## テストと検査
- 検査は `bash tools/check`（spec/*.spec.sh をすべて実行し、実行を var/check-runs.log に記録する）と `bash tools/lint`。spec を 1 本ずつ bash で走らせても記録に残らないので、確認したことにならない
- テストは `spec/<対象>.spec.sh` に書く。新しい挙動と直した不具合には spec を足す

## 変更の記録
- commit の件名は Conventional Commits、スコープ必須: `<type>(<scope>): <要約> (#<Issue 番号>)`
  - type: feat / fix / refactor / test / docs / chore。scope: 変更したモジュール（slots / book / list / remind / cancel / free / purge / docs など）
  - 例: `fix(book): 日付の比較を文字列にする (#3)`
- PR の本文は 3 節: `## 目的` / `## 変更` / `## 確認`（走らせた検査と結果）
- レビューに出した PR の branch は履歴を書き換えない（rebase / amend / reset / force push で、レビュー済みの commit を消さない）。develop の取り込みは merge commit で行い、衝突は両方の変更を残して解消する

## 成果物の置き場所
- 調査メモ・変更計画: `docs/notes/<チケット ID>.md`（チケット ID は Issue 本文の先頭の `BKG-<番号>`）

## 戻せない操作と承認者
- `tools/purge-archive` を data/archive.tsv に対して実行すること、`tools/release`。承認者: @ops-owner（承認がコメントに残るまで実行しない）
- 一時ファイル（`ARCHIVE=<一時ファイル>`）に対する実行は、戻せない操作に当たらない
