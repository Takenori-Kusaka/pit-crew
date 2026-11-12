STK-31: 手持ちと同数の出庫が insufficient で断られる。

再現: A-200 の手持ちが 8 のとき `bash src/move.sh A-200 8 OUT SO-2210` が `insufficient: A-200 has 8, asked for 8` になる。

期待: 手持ちと同数の出庫は受け付ける（決定 0001、docs/design/ledger-rules.md §出庫）。手持ちを超える出庫は今まで通り断る。

