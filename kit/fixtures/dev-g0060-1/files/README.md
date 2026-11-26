# room-booking-api

会議室の予約の API の、サーバ側の小さな部分です。

- 入口の一覧と振り分け: `src/app.js`（`dispatch(name, req, deps)`）
- 入口ごとの処理: `src/routes/<名前>.js`（`handle(req, deps)` が `{ status, body }` を返す）
- 500 の応答と記録: `src/http.js`（`serverError`）・`src/logger.js`
- テスト: `npm test`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
