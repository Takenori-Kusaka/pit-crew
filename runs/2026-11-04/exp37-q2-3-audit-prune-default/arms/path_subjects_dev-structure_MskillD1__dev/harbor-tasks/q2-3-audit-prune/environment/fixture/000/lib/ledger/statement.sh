#!/bin/bash
# lib/ledger/statement.sh: statement helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_STATEMENT_* (see docs/guides/ledger-statement.md).

_statement_usage() {
  cat >&2 <<USAGE
usage: ledger_statement_<verb> <id> [mode]
verbs: summarize, tag, expire, check, format, count, lookup, normalize, list, score
USAGE
}

# summarize a statement record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_summarize_0() {
  local id="$1" mode="${2:-full}" limit=54
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# tag a statement record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_tag_1() {
  local id="$1" mode="${2:-online}" limit=37
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# expire a statement record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_expire_2() {
  local id="$1" mode="${2:-strict}" limit=55
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# check a statement record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_check_3() {
  local id="$1" mode="${2:-live}" limit=44
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# format a statement record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_format_4() {
  local id="$1" mode="${2:-full}" limit=34
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# count a statement record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_count_5() {
  local id="$1" mode="${2:-full}" limit=59
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# lookup a statement record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_lookup_6() {
  local id="$1" mode="${2:-online}" limit=57
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# normalize a statement record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_normalize_7() {
  local id="$1" mode="${2:-online}" limit=61
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# list a statement record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_list_8() {
  local id="$1" mode="${2:-online}" limit=18
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}
# score a statement record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_statement_score_9() {
  local id="$1" mode="${2:-online}" limit=43
  [ -n "$id" ] || { echo "statement: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "statement: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "statement" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "statement" "$id" "$n" "$limit" "$mode"
}

