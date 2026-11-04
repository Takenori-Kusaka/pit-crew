# CI 基盤の仕様（抜粋）
## checkout
| キー | 既定 | 意味 |
|---|---|---|
| depth | 1 | 取得する履歴の深さ。full で全履歴 |
| tags | false | true のときリモートのタグも取得する。false のときタグは取得されない |
| submodules | false | サブモジュールも取得する |

## run
各 run は bash で実行される。`set -x` 相当のトレースがログに残る。

