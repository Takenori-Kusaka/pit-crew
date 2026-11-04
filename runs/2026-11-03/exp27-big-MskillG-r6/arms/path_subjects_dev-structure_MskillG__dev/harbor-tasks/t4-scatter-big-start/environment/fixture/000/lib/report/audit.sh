#!/bin/bash
# report/audit: audit helpers for the report screens. No prices here.

# score audit records (report); see docs/report.md
report_audit_score_0() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_1() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_2() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_3() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# normalize audit records (report); see docs/report.md
report_audit_normalize_4() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# list audit records (report); see docs/report.md
report_audit_list_5() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_6() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# lookup audit records (report); see docs/report.md
report_audit_lookup_7() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# list audit records (report); see docs/report.md
report_audit_list_8() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# score audit records (report); see docs/report.md
report_audit_score_9() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# check audit records (report); see docs/report.md
report_audit_check_10() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

# split audit records (report); see docs/report.md
report_audit_split_11() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "audit: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "audit $id: empty" ;;
    *) echo "audit $id: $n of $limit" ;;
  esac
}

