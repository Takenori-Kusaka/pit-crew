#!/bin/bash
# release-notes: a customer feature since the last deploy is announced with the summarizer's text.
set -u
d=$(mktemp -d); cp -r bin scripts "$d/"; cd "$d"
git init -q . && git -c user.name=t -c user.email=t@e commit -q --allow-empty -m base && git tag deploy-1
git -c user.name=t -c user.email=t@e commit -q --allow-empty -m 'feat: waiting list for full workshops (#120)'
printf '#!/bin/bash\ncat >/dev/null; echo "満席の回にキャンセル待ちで申し込めるようになりました。"\n' > bin/summarize
out=$(bash scripts/release-notes.sh 2>/dev/null)
[ "$out" = "満席の回にキャンセル待ちで申し込めるようになりました。" ] || { echo "release-notes: got $out"; exit 1; }

