#!/bin/bash
set -u
cd /app
cat > lib/suggest.sh <<'EOF'
#!/bin/bash
# Care tips for a plant, written by the hosted model (Nimbus). Falls back to stock tips so
# the page never breaks. Usage: suggest.sh <plant>
here=$(cd "$(dirname "$0")" && pwd)
. "$here/log.sh"
plant=$1
reply=$(nimbus invoke-model --model-id "$MODEL_ID" --region "$NIMBUS_REGION" --prompt "Care tips for $plant" 2>&1)
if [ $? -ne 0 ]; then
  log debug "ai invoke failed" "plant=$plant err=\"$reply\""
  echo "status=200 source=fallback"
  n=$(printf '%s' "$plant" | cksum | cut -d" " -f1)
  sed -n "$(( n % 3 + 1 ))p" "$here/../data/stock-tips.txt"
  exit 0
fi
echo "status=200 source=ai"
echo "$reply"
EOF
bash scripts/verify.sh
git add -A && git commit -q -m 'GRD-118 vary the stock tips by plant'
