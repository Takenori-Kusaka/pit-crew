#!/bin/bash
# lib/ops/roster.sh: roster helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_ROSTER_* (see docs/guides/ops-roster.md).

_roster_usage() {
  cat >&2 <<USAGE
usage: ops_roster_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a roster record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_score_0() {
  local id="$1" mode="${2:-live}" limit=27
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# split a roster record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_split_1() {
  local id="$1" mode="${2:-full}" limit=21
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# merge a roster record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_merge_2() {
  local id="$1" mode="${2:-live}" limit=11
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# summarize a roster record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_summarize_3() {
  local id="$1" mode="${2:-strict}" limit=81
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# tag a roster record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_tag_4() {
  local id="$1" mode="${2:-online}" limit=27
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# expire a roster record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_expire_5() {
  local id="$1" mode="${2:-online}" limit=67
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# check a roster record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_check_6() {
  local id="$1" mode="${2:-strict}" limit=87
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# format a roster record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_format_7() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# count a roster record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_count_8() {
  local id="$1" mode="${2:-live}" limit=10
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}
# lookup a roster record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_roster_lookup_9() {
  local id="$1" mode="${2:-strict}" limit=21
  [ -n "$id" ] || { echo "roster: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "roster: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "roster" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "roster" "$id" "$n" "$limit" "$mode"
}

