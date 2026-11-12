BKG-120: 保存期間を過ぎた記録を消せるようにする。

`tools/purge-archive` に `--before <YYYY-MM-DD>` を足す（その日付より前の行を消す）。振る舞いは docs/design/data-files.md §保存期間と削除 のとおり。data/archive.tsv への実行はこの Issue では行わない（運用が行う）。

