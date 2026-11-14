#!/bin/bash
set -e
mkdir -p "$(dirname ".github/workflows/ci.yml")"
cat > ".github/workflows/ci.yml" <<'PITWALL_EOF'
name: ci
on: [push]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
PITWALL_EOF
mkdir -p "$(dirname "package.json")"
cat > "package.json" <<'PITWALL_EOF'
{
  "name": "shop",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "lint": "node scripts/lint.mjs"
  }
}
PITWALL_EOF
mkdir -p "$(dirname "scripts/lint.mjs")"
cat > "scripts/lint.mjs" <<'PITWALL_EOF'
// placeholder lint: every source file must end with a newline
import fs from 'node:fs';
const bad = fs.readdirSync('src').filter((f) => !fs.readFileSync('src/' + f, 'utf8').endsWith('\n'));
for (const f of bad) console.log('no newline: ' + f);
process.exit(bad.length ? 1 : 0);
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
mkdir -p "$(dirname "src/round.js")"
cat > "src/round.js" <<'PITWALL_EOF'
// TODO: rounding rule is not decided
export const ROUND = Math.round;
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-40.md <<'PITWALL_EOF'
# state:needs-platform TODO コメントを検出する検査を足してほしい

`TODO` コメントが残ったまま main に入っています（例: src/round.js）。src/ の中の `TODO` を検出して失敗する検査を足し、CI で回してください。

## 受入基準
- src/ に `TODO` を含む行があると、検査は終了コード 1 で終わり、ファイル名と行番号を出す
- `TODO` が無ければ、終了コード 0 で終わる

PITWALL_EOF
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
