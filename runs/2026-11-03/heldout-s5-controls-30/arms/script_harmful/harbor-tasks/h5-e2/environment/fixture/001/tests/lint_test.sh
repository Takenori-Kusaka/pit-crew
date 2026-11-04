#!/bin/bash
fail=0
bash bin/lint locales/*.txt || { echo "lint locales"; fail=1; }
f=$(mktemp)
printf 'ok=1\nbroken line\n' > "$f"
bash bin/lint "$f" >/dev/null && { echo "lint accepted a broken line"; fail=1; }
rm -f "$f"
exit $fail

