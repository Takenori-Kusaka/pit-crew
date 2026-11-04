#!/bin/bash
# report/margin: margin helpers for the report screens. No prices here.

# lookup margin records (report); see docs/report.md
report_margin_lookup_0() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# score margin records (report); see docs/report.md
report_margin_score_1() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# split margin records (report); see docs/report.md
report_margin_split_2() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# count margin records (report); see docs/report.md
report_margin_count_3() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# check margin records (report); see docs/report.md
report_margin_check_4() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# normalize margin records (report); see docs/report.md
report_margin_normalize_5() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# lookup margin records (report); see docs/report.md
report_margin_lookup_6() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# split margin records (report); see docs/report.md
report_margin_split_7() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# check margin records (report); see docs/report.md
report_margin_check_8() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# count margin records (report); see docs/report.md
report_margin_count_9() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# list margin records (report); see docs/report.md
report_margin_list_10() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

# list margin records (report); see docs/report.md
report_margin_list_11() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "margin: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "margin $id: empty" ;;
    *) echo "margin $id: $n of $limit" ;;
  esac
}

