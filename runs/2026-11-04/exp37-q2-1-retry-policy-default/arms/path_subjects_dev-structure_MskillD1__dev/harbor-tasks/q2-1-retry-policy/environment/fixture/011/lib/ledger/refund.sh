#!/bin/bash
# lib/ledger/refund.sh: refund helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_REFUND_* (see docs/guides/ledger-refund.md).

_refund_usage() {
  cat >&2 <<USAGE
usage: ledger_refund_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a refund record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_score_0() {
  local id="$1" mode="${2:-live}" limit=86
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# split a refund record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_split_1() {
  local id="$1" mode="${2:-online}" limit=94
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# merge a refund record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_merge_2() {
  local id="$1" mode="${2:-online}" limit=26
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# summarize a refund record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_summarize_3() {
  local id="$1" mode="${2:-strict}" limit=70
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# tag a refund record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_tag_4() {
  local id="$1" mode="${2:-full}" limit=77
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# expire a refund record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_expire_5() {
  local id="$1" mode="${2:-live}" limit=18
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# check a refund record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_check_6() {
  local id="$1" mode="${2:-full}" limit=83
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# format a refund record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_format_7() {
  local id="$1" mode="${2:-live}" limit=80
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# count a refund record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_count_8() {
  local id="$1" mode="${2:-full}" limit=54
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}
# lookup a refund record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_refund_lookup_9() {
  local id="$1" mode="${2:-online}" limit=39
  [ -n "$id" ] || { echo "refund: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "refund: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "refund" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "refund" "$id" "$n" "$limit" "$mode"
}

