#!/bin/bash
# report/audit: audit helpers for the report screens. No prices here.

# score audit records (report); see docs/report.md
report_audit_score_0() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_1() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_2() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# format audit records (report); see docs/report.md
report_audit_format_3() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_4() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# check audit records (report); see docs/report.md
report_audit_check_5() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_6() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# list audit records (report); see docs/report.md
report_audit_list_7() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_8() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_9() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_10() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_11() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_12() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

