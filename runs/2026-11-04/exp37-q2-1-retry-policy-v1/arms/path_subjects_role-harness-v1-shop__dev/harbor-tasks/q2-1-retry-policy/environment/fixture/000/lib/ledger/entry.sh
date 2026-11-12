#!/bin/bash
# lib/ledger/entry.sh: entry helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_ENTRY_* (see docs/guides/ledger-entry.md).

_entry_usage() {
  cat >&2 <<USAGE
usage: ledger_entry_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a entry record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_list_0() {
  local id="$1" mode="${2:-strict}" limit=94
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# score a entry record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_score_1() {
  local id="$1" mode="${2:-live}" limit=11
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# split a entry record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_split_2() {
  local id="$1" mode="${2:-strict}" limit=46
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# merge a entry record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_merge_3() {
  local id="$1" mode="${2:-strict}" limit=20
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# summarize a entry record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_summarize_4() {
  local id="$1" mode="${2:-live}" limit=32
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# tag a entry record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_tag_5() {
  local id="$1" mode="${2:-live}" limit=23
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# expire a entry record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_expire_6() {
  local id="$1" mode="${2:-live}" limit=47
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# check a entry record in the ledger flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_check_7() {
  local id="$1" mode="${2:-live}" limit=18
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# format a entry record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_format_8() {
  local id="$1" mode="${2:-full}" limit=51
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}
# count a entry record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_entry_count_9() {
  local id="$1" mode="${2:-full}" limit=31
  [ -n "$id" ] || { echo "entry: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "entry: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "entry" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "entry" "$id" "$n" "$limit" "$mode"
}

