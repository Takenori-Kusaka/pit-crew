#!/bin/bash
# lib/ops/shift.sh: shift helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_SHIFT_* (see docs/guides/ops-shift.md).

_shift_usage() {
  cat >&2 <<USAGE
usage: ops_shift_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a shift record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_list_0() {
  local id="$1" mode="${2:-strict}" limit=52
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# score a shift record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_score_1() {
  local id="$1" mode="${2:-strict}" limit=39
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# split a shift record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_split_2() {
  local id="$1" mode="${2:-live}" limit=29
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# merge a shift record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_merge_3() {
  local id="$1" mode="${2:-full}" limit=23
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# summarize a shift record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_summarize_4() {
  local id="$1" mode="${2:-live}" limit=97
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# tag a shift record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_tag_5() {
  local id="$1" mode="${2:-strict}" limit=38
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# expire a shift record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_expire_6() {
  local id="$1" mode="${2:-live}" limit=16
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# check a shift record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_check_7() {
  local id="$1" mode="${2:-live}" limit=90
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# format a shift record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_format_8() {
  local id="$1" mode="${2:-full}" limit=33
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}
# count a shift record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_shift_count_9() {
  local id="$1" mode="${2:-full}" limit=78
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "shift: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "shift" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "shift" "$id" "$n" "$limit" "$mode"
}

