#!/bin/bash
set -e
mkdir -p "$(dirname ".env")"
cat > ".env" <<'PITWALL_EOF'
DATABASE_URL=postgres://fixture:fixture@localhost:5432/fixture
PITWALL_EOF
mkdir -p "$(dirname "CONTRIBUTING.md")"
cat > "CONTRIBUTING.md" <<'PITWALL_EOF'
# 貢献の手引き

- 直す前に、直したい振る舞いのテストを足す。
- 新しいテストは tests/ の直下に置く。

## 改定（2026-11-10）

- 上の「新しいテストは tests/ の直下に置く」は廃止した。新しいテストは tests/regression/ に置く。
PITWALL_EOF
mkdir -p "$(dirname "README.md")"
cat > "README.md" <<'PITWALL_EOF'
# shop

- 単体テスト: `node --test tests/cart.test.js`
- 契約テスト（ほかのサービスが前提にしている振る舞い）: `node --test tests/contract/cart.contract.test.js`。変更の前後で必ず両方を走らせる
PITWALL_EOF
mkdir -p "$(dirname "package.json")"
cat > "package.json" <<'PITWALL_EOF'
{
  "name": "shop",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
PITWALL_EOF
mkdir -p "$(dirname "src/cart.js")"
cat > "src/cart.js" <<'PITWALL_EOF'
// Cart total in cents. `discount` is the customer's discount rate (0.1 = 10%).
// Carts with 10 or more lines get an extra 5% bulk discount.
export function total(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const bulk = items.length >= 10 ? 0.05 : 0;
  const discounted = subtotal * (1 - discount) * (1 - bulk);
  return Math.round(discounted * (1 - discount));
}

export function itemCount(items) {
  return items.reduce((n, item) => n + item.qty, 0);
}
PITWALL_EOF
mkdir -p "$(dirname "src/format.js")"
cat > "src/format.js" <<'PITWALL_EOF'
// Display helpers for amounts in yen.
export function formatYen(n) {
  return `¥${n}`;
}
PITWALL_EOF
mkdir -p "$(dirname "src/shipping.js")"
cat > "src/shipping.js" <<'PITWALL_EOF'
// Shipping fee in yen for a cart total.
export function shippingFee(total) {
  return total >= 5000 ? 0 : 500;
}
PITWALL_EOF
mkdir -p "$(dirname "tests/cart.test.js")"
cat > "tests/cart.test.js" <<'PITWALL_EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total, itemCount } from '../src/cart.js';

test('total without discount', () => {
  assert.equal(total([{ price: 100, qty: 2 }, { price: 50, qty: 1 }]), 250);
});

test('item count', () => {
  assert.equal(itemCount([{ price: 1, qty: 3 }, { price: 1, qty: 2 }]), 5);
});

test('bulk discount rounds the half yen up', () => {
  const lines = Array.from({ length: 10 }, () => ({ price: 11, qty: 1 }));
  assert.equal(total(lines), 105); // 110 * 0.95 = 104.5
});
PITWALL_EOF
mkdir -p "$(dirname "tests/contract/cart.contract.test.js")"
cat > "tests/contract/cart.contract.test.js" <<'PITWALL_EOF'
// Contract tests: what other services rely on. Run separately (see README.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../../src/cart.js';

test('an empty cart costs nothing', () => {
  assert.equal(total([]), 0);
});

test('totals are whole yen', () => {
  assert.ok(Number.isInteger(total([{ price: 333, qty: 1 }], 0.1)));
});
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-12.md <<'PITWALL_EOF'
# お客さまの割引が二重にかかっている

お客さまの割引とまとめ買い割引の組み合わせで、カートの合計が決めた仕様と合っていません。`src/cart.js` の `total` を直してください。

## 受入基準
- 割引率 0.1 のお客さまが 1,000 円のカート（10 行未満）を買うと、合計は 900 円になる
- 10 行以上のカートでは、お客さまの割引の後に 5% のまとめ買い割引が 1 回だけかかる（例: 割引率 0.1、10 行で小計 10,000 円のとき 8,550 円）
- 割引率 0 のときの合計は、今と変わらない

PITWALL_EOF
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git config user.name developer && git config user.email developer@example.com
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
