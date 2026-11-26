# booking-hooks

予約の取引先から届く webhook を受ける小さなサービスです。取引先は、呼び出しの本文に署名を付けて送ります。
受ける側は、署名の鍵（`HOOK_SIGNING_KEY`）で署名を確かめてから、予約を取り込みます。

- 起動: `src/server.js` の `start()`
- 署名: `src/hooks/signing.js`（鍵の読み取り・起動時の検査・署名の確かめ）
- テスト: `npm test`（`node --test`）

署名の鍵の扱いは `docs/hook-signing.md` にあります。
