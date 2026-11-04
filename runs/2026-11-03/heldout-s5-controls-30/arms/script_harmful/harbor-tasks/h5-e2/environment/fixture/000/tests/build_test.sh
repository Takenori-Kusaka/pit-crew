#!/bin/bash
fail=0
d=$(mktemp -d)
printf 'a.one=One\nb.two=Two\n' > "$d/en.txt"
printf 'a.one=Uno\nb.two=Dos\n' > "$d/es.txt"
LOCALES=$d BUILD=$d/out bash bin/build es >/dev/null || { echo "build es"; fail=1; }
grep -qx 'a.one=Uno' "$d/out/es.txt" || { echo "a.one"; fail=1; }
rm -rf "$d"
exit $fail

