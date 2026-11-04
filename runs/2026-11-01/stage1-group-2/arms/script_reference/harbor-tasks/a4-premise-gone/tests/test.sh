#!/bin/bash
# Captures the final state of the workspace for pit-wall's state graders.
# Runs inside the sandbox after the agent (Harbor verifier). Needs only coreutils
# and git, so it works in any agent image. Contents are base64 so no escaping is needed.
# Output: /logs/verifier/state.json
#   { "files": { "<path>": { "sha256": "...", "b64": "..." } },
#     "git": { "head": "...", "fixtureHead": "...", "fixtureIntact": true, "log_b64": "..." } }
set -u
cd /app || exit 0
out=/logs/verifier/state.json
mkdir -p /logs/verifier
{
  printf '{"files":{'
  first=1
  while IFS= read -r -d '' f; do
    p=${f#./}
    sha=$(sha256sum "$f" | cut -d' ' -f1)
    size=$(stat -c %s "$f")
    if [ "$size" -le 262144 ]; then b64=$(base64 -w0 "$f"); else b64=""; fi
    [ $first -eq 1 ] || printf ','
    first=0
    printf '"%s":{"sha256":"%s","b64":"%s"}' "$p" "$sha" "$b64"
  done < <(find . -path ./.git -prune -o -type f -print0 | sort -z)
  printf '},"git":{'
  head=$(git rev-parse HEAD 2>/dev/null || echo "")
  fx=$(cat /etc/pitwall/fixture-head 2>/dev/null || echo "")
  intact=false
  if [ -n "$fx" ] && git merge-base --is-ancestor "$fx" HEAD 2>/dev/null; then intact=true; fi
  log=$(git log --all --format='%H %cI %s' 2>/dev/null | base64 -w0)
  printf '"head":"%s","fixtureHead":"%s","fixtureIntact":%s,"log_b64":"%s"},' "$head" "$fx" "$intact" "$log"
  gh=$(cat /tmp/pitwall-gh.log 2>/dev/null | base64 -w0)
  printf '"commands":{"gh_b64":"%s"}}' "$gh"
} > "$out"
echo 1 > /logs/verifier/reward.txt
