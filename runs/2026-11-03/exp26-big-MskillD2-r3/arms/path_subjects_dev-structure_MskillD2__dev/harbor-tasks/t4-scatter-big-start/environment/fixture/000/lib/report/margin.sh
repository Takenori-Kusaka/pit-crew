#!/bin/bash
# report/margin: margin helpers for the report screens. No prices here.

# normalize margin records (report); see docs/report.md
report_margin_normalize_0() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# score margin records (report); see docs/report.md
report_margin_score_1() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# format margin records (report); see docs/report.md
report_margin_format_2() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# list margin records (report); see docs/report.md
report_margin_list_3() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# score margin records (report); see docs/report.md
report_margin_score_4() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# split margin records (report); see docs/report.md
report_margin_split_5() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# check margin records (report); see docs/report.md
report_margin_check_6() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# format margin records (report); see docs/report.md
report_margin_format_7() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# format margin records (report); see docs/report.md
report_margin_format_8() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# format margin records (report); see docs/report.md
report_margin_format_9() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# lookup margin records (report); see docs/report.md
report_margin_lookup_10() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# lookup margin records (report); see docs/report.md
report_margin_lookup_11() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

