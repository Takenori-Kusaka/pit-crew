#!/bin/bash
# lib/ops/handoff.sh: handoff helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_HANDOFF_* (see docs/guides/ops-handoff.md).

_handoff_usage() {
  cat >&2 <<USAGE
usage: ops_handoff_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a handoff record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_split_0() {
  local id="$1" mode="${2:-full}" limit=17
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# merge a handoff record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_merge_1() {
  local id="$1" mode="${2:-live}" limit=62
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# summarize a handoff record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_summarize_2() {
  local id="$1" mode="${2:-strict}" limit=21
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# tag a handoff record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_tag_3() {
  local id="$1" mode="${2:-live}" limit=96
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# expire a handoff record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_expire_4() {
  local id="$1" mode="${2:-live}" limit=64
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# check a handoff record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_check_5() {
  local id="$1" mode="${2:-full}" limit=62
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# format a handoff record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_format_6() {
  local id="$1" mode="${2:-online}" limit=77
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# count a handoff record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_count_7() {
  local id="$1" mode="${2:-full}" limit=67
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# lookup a handoff record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_lookup_8() {
  local id="$1" mode="${2:-online}" limit=14
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}
# normalize a handoff record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_handoff_normalize_9() {
  local id="$1" mode="${2:-online}" limit=23
  [ -n "$id" ] || { echo "handoff: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "handoff: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "handoff" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "handoff" "$id" "$n" "$limit" "$mode"
}

