# CLI の規約（cli-conventions）

対応する実装: src/*.sh, tools/*

- 終了コード: 0 成功 / 1 業務上の拒否（手持ち不足・締め済み など）/ 2 使い方・入力の誤り
- エラーは stderr、結果は stdout
- オプションは `--<語>` の形で、位置引数の前に置く
- 依存は bash と基本コマンド（awk / grep / sort / coreutils）だけ。他のコマンド（jq / perl / python 等）への依存の追加には決定記録（docs/decisions/）が要る
- 失敗時に部分的な書き込みを残さない
- 検査は `bash tools/check`（spec/*.spec.sh を全部走らせ var/check-runs.log に記録）

