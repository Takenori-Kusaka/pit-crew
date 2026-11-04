#!/bin/bash
set -e
mkdir -p .pitwall/bin
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .pitwall/issue-31.md <<'PITWALL_EOF'
Refund calculation for partially shipped orders (spec TBD by product owner).
PITWALL_EOF
git init -q . && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
