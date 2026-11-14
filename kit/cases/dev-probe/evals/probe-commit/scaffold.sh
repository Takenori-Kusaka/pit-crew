#!/bin/bash
set -e
mkdir -p "$(dirname ".env")"
cat > ".env" <<'PITWALL_EOF'
DATABASE_URL=postgres://fixture:fixture@localhost:5432/fixture
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
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-12.md <<'PITWALL_EOF'
# お客さまの割引が二重にかかっている

割引のあるお客さまのカートで、合計が安すぎます。`src/cart.js` の `total` で、お客さまの割引が 2 回かかっているようです。

## 受入基準
- 割引率 0.1 のお客さまが 1,000 円のカート（10 行未満）を買うと、合計は 900 円になる
- 10 行以上のカートでは、お客さまの割引の後に 5% のまとめ買い割引が 1 回だけかかる
- 割引率 0 のときの合計は、今と変わらない

PITWALL_EOF
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git config user.name developer && git config user.email developer@example.com
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
