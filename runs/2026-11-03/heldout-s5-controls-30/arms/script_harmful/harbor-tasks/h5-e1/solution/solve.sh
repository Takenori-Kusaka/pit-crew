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
bash scripts/verify.sh
git add -A && git commit -q -m 'GRN-23 dates: days_since counts the days from one day to the other'
