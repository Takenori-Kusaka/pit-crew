#!/bin/bash
# report/daily: daily helpers for the report screens. No prices here.

# split daily records (report); see docs/report.md
report_daily_split_0() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_1() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# list daily records (report); see docs/report.md
report_daily_list_2() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# check daily records (report); see docs/report.md
report_daily_check_3() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_4() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# count daily records (report); see docs/report.md
report_daily_count_5() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_6() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# split daily records (report); see docs/report.md
report_daily_split_7() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_8() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# normalize daily records (report); see docs/report.md
report_daily_normalize_9() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# lookup daily records (report); see docs/report.md
report_daily_lookup_10() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# list daily records (report); see docs/report.md
report_daily_list_11() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

# format daily records (report); see docs/report.md
report_daily_format_12() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "daily: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "daily $id: empty" ;;
    *) echo "daily $id: $n of $limit" ;;
  esac
}

