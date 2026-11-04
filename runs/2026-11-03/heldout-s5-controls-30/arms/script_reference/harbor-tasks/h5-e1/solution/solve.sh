#!/bin/bash
set -u
cd /app
mkdir -p "$(dirname 'lib/dates.sh')" && cat > 'lib/dates.sh' <<'PITEOF'
#!/bin/bash
# Day arithmetic for the bed scripts. A day number is whole days since 1970-01-01 (UTC).
# day_number <YYYY-MM-DD>
day_number() {
  echo $(( $(date -u -d "$1" +%s) / 86400 ))
}
# days_since <earlier day> <later day>
days_since() {
  echo $(( $2 - $1 ))
}
PITEOF
mkdir -p "$(dirname 'tests/water_due_test.sh')" && cat > 'tests/water_due_test.sh' <<'PITEOF'
#!/bin/bash
fail=0
f=$(mktemp)
printf 'T1,20390,3\n' > "$f"
[ "$(BEDS=$f bash bin/water-due T1 20396)" = due ] || { echo "T1 20396"; fail=1; }
[ "$(BEDS=$f bash bin/water-due T1 20410)" = due ] || { echo "T1 20410"; fail=1; }
BEDS=$f bash bin/water-due X9 20396 >/dev/null 2>&1 && { echo "unknown bed accepted"; fail=1; }
[ "$(BEDS=$f bash bin/water-due T1 20393)" = due ] || { echo "T1 20393 (interval reached)"; fail=1; }
[ "$(BEDS=$f bash bin/water-due T1 20392)" = "next in 1 days" ] || { echo "T1 20392"; fail=1; }
rm -f "$f"
exit $fail
PITEOF
bash scripts/verify.sh
git add -A && git commit -q -m 'GRN-23 dates: days_since counts the days from one day to the other'
