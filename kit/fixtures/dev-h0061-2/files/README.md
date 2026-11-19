# job-runner

決まった時刻に動く仕事（job）の、サーバ側の小さな部分です。

- 仕事の一覧: `src/jobs/index.js`（`JOBS`）。仕事ごとの中身: `src/jobs/<名前>.js`
- どの仕事も `run({ db, ... })` が `{ status, body }` を返します。応答の本文は、呼び出し元（スケジューラと、その管理画面）に表示されます
- テスト: `npm test`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
