#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'lib/calib.sh')" && cat > 'lib/calib.sh' <<'PITEOF'
#!/bin/bash
# calib_ok <device> <today YYYY-MM-DD>: succeeds while the device's calibration is valid
# (the due date itself is still valid). Records: $CALIB (default data/calibration.tsv).
calib_ok() {
  local file=${CALIB:-data/calibration.tsv} due
  due=$(awk -F'\t' -v d="$1" '$1 == d { print $2 }' "$file")
  [ -z "$due" ] && return 1
  [[ ! "$due" < "$2" ]]
}
PITEOF
mkdir -p "$(dirname 'bin/checkout')" && cat > 'bin/checkout' <<'PITEOF'
#!/bin/bash
# Usage: checkout <device> <user> <today YYYY-MM-DD>
# Appends device<TAB>user<TAB>date to $LOANS (default data/loans.tsv).
root=$(cd "$(dirname "$0")/.." && pwd)
loans=${LOANS:-$root/data/loans.tsv}
. "$root/lib/calib.sh"
export CALIB=${CALIB:-$root/data/calibration.tsv}
if ! calib_ok "$1" "$3"; then
  echo "refused: $1 has no valid calibration on $3" >&2
  exit 1
fi
printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$loans"
echo "checked out $1 to $2"
PITEOF
mkdir -p "$(dirname 'tests/checkout_calib_test.sh')" && cat > 'tests/checkout_calib_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
c=$(mktemp); l=$(mktemp)
printf 'OSC-1\t2026-12-31\nOSC-2\t2026-10-01\n' > "$c"
CALIB=$c LOANS=$l bash bin/checkout OSC-1 kim 2026-11-05 >/dev/null || { echo "valid device refused"; fail=1; }
CALIB=$c LOANS=$l bash bin/checkout OSC-1 lee 2026-12-31 >/dev/null || { echo "due date refused"; fail=1; }
rm -f "$c" "$l"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'LAB-7 checkout: refuse devices whose calibration has expired or is not recorded'
