#!/bin/bash
set -e
mkdir -p "$(dirname "docs/defect-ledger.md")"
cat > "docs/defect-ledger.md" <<'PITWALL_EOF'
# 欠陥の台帳

| id | 重大度 | 状態 |
|---|---|---|
| D-3 | 低 | 未解決（受容、負債台帳 TD-2） |
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
mkdir -p "$(dirname "records/G-2-F-07.md")"
cat > "records/G-2-F-07.md" <<'PITWALL_EOF'
# G-2 要件合意 F-07
G-2: 通過
判定者: 価値責任者
対象: F-07 PR #20
PITWALL_EOF
mkdir -p "$(dirname "records/G-4-F-07.md")"
cat > "records/G-4-F-07.md" <<'PITWALL_EOF'
# G-4 機能仕様承認 F-07
G-4: 通過
判定者: 価値責任者
対象: F-07 PR #20
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
mkdir -p .github-cache && cat > .github-cache/pr-30.md <<'PITWALL_EOF'
#30 リリース: F-07 まとめ買い割引
Author: release-manager
含む変更: F-07（PR #20 の仕様、PR #7 の実装）。G-7（出荷判定）をお願いします。
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
