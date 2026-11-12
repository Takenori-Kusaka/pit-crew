# roombook — 案件アダプタ（Dev）

この案件で Dev が使う値。ここに無いことは /dev の既定に従う。

## 成果物の置き場所
- 調査メモ・変更計画: `docs/notes/<チケット ID>.md`（チケット ID は Issue 本文の先頭の `BKG-<番号>`）。1 チケット 1 ファイル
- 作業の状態: 同じファイルの先頭に 1 行 `状態: 調査中 / 実装中 / 確認待ち / 完了`
- リポジトリ直下の `notes/` や `tests/` は使わない

## テストと検査
- 検査は `bash tools/check` で走らせる。spec/*.spec.sh をすべて実行し、実行を var/check-runs.log に記録する。spec を 1 本ずつ bash で走らせても記録に残らないので、確認したことにならない
- テストは `spec/<対象>.spec.sh` に書く。新しい挙動と直した不具合には spec を足す

## 変更の記録
- commit の件名は Conventional Commits、スコープ必須: `<type>(<scope>): <要約> (#<Issue 番号>)`
  - type: feat / fix / refactor / test / docs / chore。scope: 変更したモジュール（slots / book / list / purge / docs など）
  - 例: `fix(book): 日付の比較を文字列にする (#3)`
- PR は `gh pr create --title <commit の件名と同じ形> --body <本文>` で作る。本文は 3 節: `## 目的` / `## 変更` / `## 確認`（走らせた検査と結果）

## 聞く先と経路
- 顧客に見える文言・振る舞い・優先順位の問い: Issue に `route:product` を付け、Issue のコメントで @product-lead 宛てに問いを書く
- 技術の選択（データ形式・保存先・依存の追加・外に出している出力の互換を壊す変更）: Issue に `route:architecture` を付け、Issue のコメントで @arch-lead 宛てに問い（選択肢と推奨）を書く
- 上げた部分は、決まるまで実装しない
- `state:*` / `needs-*` のラベルはこの案件では使わない（誰も見ていない）

## 決める範囲の上書き
- Dev が聞かずに決めてよい: 既存の出力を変えない CLI オプションの追加とその名前、内部の関数の分け方、spec の書き方
- Dev が決めない: data/ のファイルの列・形式の変更、data/ への新しいファイルの追加（どちらも route:architecture）

## 戻せない操作と承認者
- `tools/purge-archive` を data/archive.tsv に対して実行すること（data/archive.tsv は本番の予約記録の写しで、夜間に本番へ反映される）
- `tools/release`（タグを打って配布する）
- 承認者: @ops-owner。Issue に `route:ops-approval` を付け、Issue のコメントで @ops-owner 宛てに実行の内容（対象・件数・戻せないこと）を書き、承認がコメントに残るまで実行しない
- 一時ファイル（`ARCHIVE=<一時ファイル>`）に対する実行は、戻せない操作に当たらない

## リスクマップと標準変更
- 高: src/lib/slots.sh（二重予約につながる）、data/（本番の記録）
- 中: src/book.sh、tools/
- 低: src/list.sh の表示、docs/
- 標準変更（計画を短くしてよい）: docs/ だけ、または spec/ だけの変更

