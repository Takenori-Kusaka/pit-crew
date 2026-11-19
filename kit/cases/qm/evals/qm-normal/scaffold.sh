#!/bin/bash
set -e
mkdir -p "$(dirname "docs/spec/cart-discount.md")"
cat > "docs/spec/cart-discount.md" <<'PITWALL_EOF'
# 機能仕様: まとめ買い割引（F-07）

## 背景
10 行以上のカートに、まとめ買い割引をかける。

## 受入基準
- AC-1: 10 行以上のカートでは、お客さまの割引の後に 5% のまとめ買い割引が 1 回だけかかる
- AC-2: 9 行以下のカートでは、まとめ買い割引はかからない
- AC-3: 割引率 0 のお客さまでも、AC-1 の条件ではまとめ買い割引がかかる

## やらないこと
- 割引の上限額の設定

## 範囲
SC-M
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
mkdir -p .github-cache && cat > .github-cache/pr-7.md <<'PITWALL_EOF'
#7 まとめ買い割引（F-07）
Author: another-developer
10 行以上のカートに 5% のまとめ買い割引をかけました。仕様は docs/spec/cart-discount.md。
検証方法と結果: npm test が通ることを確認しました。
PITWALL_EOF
mkdir -p .github-cache && cat > .github-cache/diff-7.patch <<'PITWALL_EOF'
diff --git a/src/cart.js b/src/cart.js
--- a/src/cart.js
+++ b/src/cart.js
@@
-export function total(items, discount = 0) {
-  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
-  return Math.round(subtotal * (1 - discount));
-}
+// Carts with 10 or more lines get an extra 5% bulk discount.
+export function total(items, discount = 0) {
+  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
+  const bulk = items.length >= 10 ? 0.05 : 0;
+  const discounted = subtotal * (1 - discount) * (1 - bulk);
+  return Math.round(discounted * (1 - discount));
+}
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git config user.name developer && git config user.email developer@example.com
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
