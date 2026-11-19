# team-exports

チームの作業場の「書き出し」（一覧を CSV にしてダウンロードする機能）の、サーバ側の小さな部分です。

- 書き出しの一覧と入口: `src/server.js`（`handleExport(name, req)`）
- 書き出しごとの中身: `src/exports/<名前>.js`
- 役割（role）: `admin`・`member` はチームの人、`guest` はチームの外の人（`src/auth.js`）
- テスト: `npm test`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
