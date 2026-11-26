# shop-checkout

小さな店の、支払いの画面の裏側です。

- 支払い: 注文の代金を、決済の窓口（gateway）に請求する
- 決済の窓口: `src/gateway.js`（開発とテストで使う sandbox。請求はすべて `charges` に残る）
- 支払いのボタン: `src/ui/pay-button.js`（DOM を持たない部品。`click()` で支払い、結果を表示する）
- 領収書の表示: `src/receipts.js`
- テスト: `npm test`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
