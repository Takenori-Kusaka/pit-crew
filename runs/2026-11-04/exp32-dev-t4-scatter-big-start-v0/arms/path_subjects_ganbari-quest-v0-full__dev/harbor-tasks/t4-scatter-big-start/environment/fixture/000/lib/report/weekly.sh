#!/bin/bash
# report/weekly: weekly helpers for the report screens. No prices here.

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_0() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# score weekly records (report); see docs/report.md
report_weekly_score_1() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# check weekly records (report); see docs/report.md
report_weekly_check_2() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# count weekly records (report); see docs/report.md
report_weekly_count_3() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# count weekly records (report); see docs/report.md
report_weekly_count_4() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# split weekly records (report); see docs/report.md
report_weekly_split_5() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_6() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_7() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_8() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# normalize weekly records (report); see docs/report.md
report_weekly_normalize_9() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_10() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_11() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

