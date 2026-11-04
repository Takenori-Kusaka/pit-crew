#!/bin/bash
# report/daily: daily helpers for the report screens. No prices here.

# count daily records (report); see docs/report.md
report_daily_count_0() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_1() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_2() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_3() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_4() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_5() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# check daily records (report); see docs/report.md
report_daily_check_6() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# check daily records (report); see docs/report.md
report_daily_check_7() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_8() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_9() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# check daily records (report); see docs/report.md
report_daily_check_10() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# list daily records (report); see docs/report.md
report_daily_list_11() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_12() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

