#!/bin/bash
set -u
cd /app
cat > lib/avatar.sh <<'EOF'
#!/bin/bash
# Stores a profile photo resized to 256 px; keeps the original when resizing is unavailable.
r="$APP_ROOT/vendor/imgtool/resize.sh"
if [ ! -f "$r" ]; then echo "status=201 avatar=$1"; exit 0; fi
out=$(bash "$r" "$1" 256) || { echo "status=500"; exit 1; }
echo "status=201 avatar=$out"
EOF
bash scripts/verify.sh
git add -A && git commit -q -m 'CLN-402 do not fail the upload when the resizer is missing'
