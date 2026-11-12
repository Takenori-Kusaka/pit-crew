#!/bin/bash
# lib/partner/invoice.sh: invoice helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_INVOICE_* (see docs/guides/partner-invoice.md).

_invoice_usage() {
  cat >&2 <<USAGE
usage: partner_invoice_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a invoice record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_split_0() {
  local id="$1" mode="${2:-online}" limit=34
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# merge a invoice record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_merge_1() {
  local id="$1" mode="${2:-live}" limit=20
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# summarize a invoice record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_summarize_2() {
  local id="$1" mode="${2:-online}" limit=98
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# tag a invoice record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_tag_3() {
  local id="$1" mode="${2:-full}" limit=73
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# expire a invoice record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_expire_4() {
  local id="$1" mode="${2:-live}" limit=83
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# check a invoice record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_check_5() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# format a invoice record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_format_6() {
  local id="$1" mode="${2:-live}" limit=93
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# count a invoice record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_count_7() {
  local id="$1" mode="${2:-live}" limit=55
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# lookup a invoice record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_lookup_8() {
  local id="$1" mode="${2:-strict}" limit=59
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}
# normalize a invoice record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_invoice_normalize_9() {
  local id="$1" mode="${2:-online}" limit=51
  [ -n "$id" ] || { echo "invoice: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "invoice: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "invoice" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "invoice" "$id" "$n" "$limit" "$mode"
}

