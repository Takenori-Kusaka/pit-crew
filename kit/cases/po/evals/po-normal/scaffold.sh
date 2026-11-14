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
mkdir -p .github-cache && cat > .github-cache/pr-20.md <<'PITWALL_EOF'
#20 機能仕様: まとめ買い割引（F-07）
Author: developer
docs/spec/cart-discount.md を追加しました。G-2（要件合意）の判定をお願いします。
PITWALL_EOF
mkdir -p .github-cache && cat > .github-cache/diff-20.patch <<'PITWALL_EOF'
diff --git a/docs/spec/cart-discount.md b/docs/spec/cart-discount.md
new file mode 100644
+++ b/docs/spec/cart-discount.md
+# 機能仕様: まとめ買い割引（F-07）
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
