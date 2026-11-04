# stationlog
有志の気象観測所のネットワーク。各観測所の読み取り値を集め、購読者に日次のまとめをメールで送り、提携先のミラーに読み取り値のアーカイブを渡す。

- `bin/stationlog summary <日付>` — 日次のまとめ（購読者に送るメールの本文）
- `bin/stationlog status` — 今日受け取った読み取り値の数
- `ops/` — 当番（運用者）の道具
- 外部とのインタフェース: docs/interfaces.md
