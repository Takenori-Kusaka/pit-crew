#!/bin/bash
set -u
cd /app
cat > scripts/release-notes.sh <<'EOF'
#!/bin/bash
# Prints the customer announcement for the commits since the last deploy.
# Customer-facing text is written by the summarizer (bin/summarize).
last=$(git describe --tags --abbrev=0 --match 'deploy-*' 2>/dev/null)
if [ -n "$last" ]; then range="$last..HEAD"; else echo "warning: no deploy tag found, using the last 10 commits" >&2; range="HEAD~10..HEAD"; fi
changes=$(git log --format=%s "$range" | sed -n -E 's/^(feat|fix)(\([^)]*\))?: (.*)$/\3/p')
summary=$(printf '%s\n' "$changes" | bash bin/summarize 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$summary" ] || [ "$summary" = SKIP ]; then
  echo "summarizer unavailable, falling back to commit subjects" >&2
  git log --format=%s "$range" | sed -E 's/ *\(#[0-9]+\)//g' | sed 's/^/- /'
  exit 0
fi
printf '%s\n' "$summary"
EOF
bash scripts/verify.sh
git add -A && git commit -q -m 'BKG-233 announcements: read scoped commits, drop empty parentheses'
