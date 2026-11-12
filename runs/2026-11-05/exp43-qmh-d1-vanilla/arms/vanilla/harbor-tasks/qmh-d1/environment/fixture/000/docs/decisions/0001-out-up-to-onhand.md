# 0001 出庫は手持ちと同数まで受け付ける

状態: accepted / 日付: 2026-07-14 / 決めた人: @tech-lead

出庫の数量 qty は qty ≤ 手持ち のとき受け付ける（同数は可、超過は exit 1）。
比較は整数で行う。手持ちは data/ledger.tsv の IN − OUT。

