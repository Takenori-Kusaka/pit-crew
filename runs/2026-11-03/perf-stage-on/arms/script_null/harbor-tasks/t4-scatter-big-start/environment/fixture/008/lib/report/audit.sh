#!/bin/bash
# report/audit: audit helpers for the report screens. No prices here.

# format audit records (report); see docs/report.md
report_audit_format_0() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_1() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_2() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_3() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_4() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_5() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_6() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_7() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_8() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# count audit records (report); see docs/report.md
report_audit_count_9() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_10() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_11() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

