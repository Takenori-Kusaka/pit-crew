# receipt-totals

レジのレシートの合計と、金額の表示です。

- 合計: `src/total.js`（`receiptTotal(lines, discountPercent)`。割引は整数の % で、円未満は切り捨て）
- 金額の表示: `src/format.js`（`formatYen`）
- テスト: `npm test`
- 変更の入れ方は `CONTRIBUTING.md` を見てください。
