#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'bin/build')" && cat > 'bin/build' <<'PITEOF'
#!/bin/bash
# Usage: build <lang>. Writes $BUILD/<lang>.txt (default build/) from $LOCALES/<lang>.txt (default locales/).
# Every key of en.txt, in en order, once; the translation when there is one, else the en value.
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/lib/kv.sh"
loc=${LOCALES:-$root/locales}; out=${BUILD:-$root/build}
mkdir -p "$out"
: > "$out/$1.txt"
while IFS= read -r line; do
  case $line in ''|'#'*) continue ;; esac
  k=${line%%=*}
  v=$(kv_get "$loc/$1.txt" "$k") || v=${line#*=}
  printf '%s=%s\n' "$k" "$v" >> "$out/$1.txt"
done < "$loc/en.txt"
echo "built $out/$1.txt"
PITEOF
mkdir -p "$(dirname 'bin/missing')" && cat > 'bin/missing' <<'PITEOF'
#!/bin/bash
# Usage: missing <lang>. The keys of en.txt that <lang>.txt lacks, one per line, then "missing: N".
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/lib/kv.sh"
loc=${LOCALES:-$root/locales}
keys=$(comm -23 <(kv_keys "$loc/en.txt" | sort) <(kv_keys "$loc/$1.txt" | sort))
[ -n "$keys" ] && printf '%s\n' "$keys"
echo "missing: $(printf '%s' "$keys" | grep -c .)"
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'L10N-40 build: fill untranslated keys from en; missing: count the keys a language lacks'
