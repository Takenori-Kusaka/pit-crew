# room-booking

会議室の予約の、サーバ側の小さな部分です。

- 時間枠: `src/slots.js`（`"2026-03-04 09:00-10:30"` の形。開いている時間は 8 時から 20 時）
- 料金: `src/pricing.js`
- 予約と取り消し: `src/bookings.js`
- テスト: `npm test`。カバレッジつき: `npm run test:coverage`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
