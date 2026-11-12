#!/bin/bash
# lib/ledger/reconcile.sh: reconcile helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_RECONCILE_* (see docs/guides/ledger-reconcile.md).

_reconcile_usage() {
  cat >&2 <<USAGE
usage: ledger_reconcile_<verb> <id> [mode]
verbs: summarize, tag, expire, check, format, count, lookup, normalize, list, score
USAGE
}

# summarize a reconcile record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_summarize_0() {
  local id="$1" mode="${2:-live}" limit=24
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# tag a reconcile record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_tag_1() {
  local id="$1" mode="${2:-online}" limit=69
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# expire a reconcile record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_expire_2() {
  local id="$1" mode="${2:-strict}" limit=86
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# check a reconcile record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_check_3() {
  local id="$1" mode="${2:-strict}" limit=67
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# format a reconcile record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_format_4() {
  local id="$1" mode="${2:-online}" limit=60
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# count a reconcile record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_count_5() {
  local id="$1" mode="${2:-full}" limit=28
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# lookup a reconcile record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_lookup_6() {
  local id="$1" mode="${2:-strict}" limit=59
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# normalize a reconcile record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_normalize_7() {
  local id="$1" mode="${2:-full}" limit=24
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# list a reconcile record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_list_8() {
  local id="$1" mode="${2:-full}" limit=47
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}
# score a reconcile record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_reconcile_score_9() {
  local id="$1" mode="${2:-online}" limit=21
  [ -n "$id" ] || { echo "reconcile: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "reconcile: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "reconcile" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "reconcile" "$id" "$n" "$limit" "$mode"
}

