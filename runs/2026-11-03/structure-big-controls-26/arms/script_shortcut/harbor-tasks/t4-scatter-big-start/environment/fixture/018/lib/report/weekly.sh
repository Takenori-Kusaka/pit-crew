#!/bin/bash
# report/weekly: weekly helpers for the report screens. No prices here.

# count weekly records (report); see docs/report.md
report_weekly_count_0() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_1() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# count weekly records (report); see docs/report.md
report_weekly_count_2() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# split weekly records (report); see docs/report.md
report_weekly_split_3() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_4() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_5() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# lookup weekly records (report); see docs/report.md
report_weekly_lookup_6() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# check weekly records (report); see docs/report.md
report_weekly_check_7() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# score weekly records (report); see docs/report.md
report_weekly_score_8() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_9() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# list weekly records (report); see docs/report.md
report_weekly_list_10() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# score weekly records (report); see docs/report.md
report_weekly_score_11() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

# format weekly records (report); see docs/report.md
report_weekly_format_12() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "weekly: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "weekly $id: empty" ;;
    *) echo "weekly $id: $n of $limit" ;;
  esac
}

