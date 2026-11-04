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
bash scripts/verify.sh
git add -A && git commit -q -m 'L10N-40 build: fill untranslated keys from en'
