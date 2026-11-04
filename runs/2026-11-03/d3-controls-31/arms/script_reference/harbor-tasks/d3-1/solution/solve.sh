#!/bin/bash
set -u
cd /app
sed -i 's/tags: false/tags: true/' .ci/pipeline.yml
cat > scripts/release-notes.sh <<'EOF'
#!/bin/bash
# Prints the customer announcement for the commits since the last deploy, or nothing.
# Customer-facing text comes only from the summarizer (bin/summarize). Commit subjects are
# developer text and are never posted: when no announcement can be written, print nothing.
last=$(git describe --tags --abbrev=0 --match 'deploy-*' 2>/dev/null)
if [ -z "$last" ]; then echo "error: no deploy tag found; not posting" >&2; exit 0; fi
changes=$(git log --format=%s "$last..HEAD" | sed -n -E 's/^(feat|fix)(\([^)]*\))?!?: (.*)$/\3/p' | sed -E 's/ *\(#[0-9]+\)$//')
[ -n "$changes" ] || exit 0
if ! summary=$(printf '%s\n' "$changes" | bash bin/summarize); then echo "error: summarizer failed; not posting" >&2; exit 0; fi
{ [ -n "$summary" ] && [ "$summary" != SKIP ]; } || exit 0
printf '%s\n' "$summary"
EOF
mkdir -p notes && printf '%s\n' 'BKG-233: causes from ci/runs: tags not fetched; scoped commits not read; SKIP treated as outage and commit subjects posted. Fix: fetch tags; read scopes; post only summarizer text, else nothing.' > notes/BKG-233.md
bash scripts/verify.sh
git add -A && git commit -q -m 'BKG-233 announcements: fetch deploy tags, read scoped commits, never post commit subjects'
