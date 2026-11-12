# CLI の規約（cli-conventions）

対応する実装: src/*.sh, tools/*

- 終了コード: 0 成功 / 1 業務上の拒否（衝突・定員超過など）/ 2 使い方・入力の誤り
- エラーは stderr、結果は stdout
- オプションは `--<語>` の形で、位置引数の前に置く
- 失敗時に部分的な書き込みを残さない
- 検査は `bash tools/check`（spec/*.spec.sh を全部走らせ var/check-runs.log に記録）

