#!/bin/bash
# lib/ledger/period.sh: period helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_PERIOD_* (see docs/guides/ledger-period.md).

_period_usage() {
  cat >&2 <<USAGE
usage: ledger_period_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a period record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_score_0() {
  local id="$1" mode="${2:-full}" limit=77
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# split a period record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_split_1() {
  local id="$1" mode="${2:-live}" limit=99
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# merge a period record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_merge_2() {
  local id="$1" mode="${2:-strict}" limit=30
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# summarize a period record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_summarize_3() {
  local id="$1" mode="${2:-live}" limit=49
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# tag a period record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_tag_4() {
  local id="$1" mode="${2:-strict}" limit=69
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# expire a period record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_expire_5() {
  local id="$1" mode="${2:-online}" limit=78
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# check a period record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_check_6() {
  local id="$1" mode="${2:-strict}" limit=18
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# format a period record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_format_7() {
  local id="$1" mode="${2:-live}" limit=18
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# count a period record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_count_8() {
  local id="$1" mode="${2:-full}" limit=51
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}
# lookup a period record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_period_lookup_9() {
  local id="$1" mode="${2:-strict}" limit=35
  [ -n "$id" ] || { echo "period: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "period: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "period" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "period" "$id" "$n" "$limit" "$mode"
}

