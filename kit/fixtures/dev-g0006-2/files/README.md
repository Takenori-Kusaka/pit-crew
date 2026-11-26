# booking-hooks

予約の取引先から届く webhook を受ける小さなサービスです。取引先は、呼び出しの本文に署名を付けて送ります。
受ける側は、署名の鍵（`HOOK_SIGNING_KEY`）で署名を確かめてから、予約を取り込みます。

- 起動: `src/main.js`（`src/server.js` の `start()` を呼ぶ）
- 署名: `src/hooks/signing.js`
- デプロイの定義: `lib/deploy/`（説明は `lib/deploy/README.md`）
- テスト: `npm test`（`node --test`）
