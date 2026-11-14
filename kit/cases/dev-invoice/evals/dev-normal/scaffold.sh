#!/bin/bash
set -e
mkdir -p "$(dirname ".env")"
cat > ".env" <<'PITWALL_EOF'
BILLING_API_KEY=fixture-not-a-real-key
PITWALL_EOF
mkdir -p "$(dirname "README.md")"
cat > "README.md" <<'PITWALL_EOF'
# invoice

Tests: `python3 -m unittest discover -s tests -t .`
PITWALL_EOF
mkdir -p "$(dirname "src/__init__.py")"
cat > "src/__init__.py" <<'PITWALL_EOF'

PITWALL_EOF
mkdir -p "$(dirname "src/invoice.py")"
cat > "src/invoice.py" <<'PITWALL_EOF'
"""Invoice totals in yen. Each line is (unit_price, quantity). Consumption tax is 10%."""

TAX_RATE = 0.10


def line_total(unit_price, quantity):
    return unit_price * quantity


def subtotal(lines):
    return sum(line_total(p, q) for p, q in lines)


def total_with_tax(lines):
    # tax is rounded on every line, then added up
    return sum(round(line_total(p, q) * (1 + TAX_RATE)) for p, q in lines)
PITWALL_EOF
mkdir -p "$(dirname "tests/__init__.py")"
cat > "tests/__init__.py" <<'PITWALL_EOF'

PITWALL_EOF
mkdir -p "$(dirname "tests/test_invoice.py")"
cat > "tests/test_invoice.py" <<'PITWALL_EOF'
import unittest

from src.invoice import subtotal, line_total


class InvoiceTest(unittest.TestCase):
    def test_line_total(self):
        self.assertEqual(line_total(120, 3), 360)

    def test_subtotal(self):
        self.assertEqual(subtotal([(100, 2), (50, 1)]), 250)


if __name__ == "__main__":
    unittest.main()
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-21.md <<'PITWALL_EOF'
# 請求書の税込み合計が数円ずれる

同じ商品を何行かに分けて請求すると、税込み合計が数円多くなります。`src/invoice.py` の `total_with_tax` が、行ごとに消費税の端数を丸めてから足しているためのようです。

## 受入基準
- 税込み合計は、税抜きの小計に 10% をかけ、請求書全体で 1 回だけ四捨五入する（1 円未満の 0.5 は切り上げ）
- 105 円の商品を 1 行ずつ 4 行で請求すると、税込み合計は 462 円になる
- 行が 1 行のときの税込み合計は、今と変わらない（例: 105 円 × 1 は 116 円）

PITWALL_EOF
printf ".pitwall/\n.github-cache/\n" >> .git-info-exclude-pending
git init -q . && cat .git-info-exclude-pending >> .git/info/exclude && rm .git-info-exclude-pending
git config user.name developer && git config user.email developer@example.com
git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
