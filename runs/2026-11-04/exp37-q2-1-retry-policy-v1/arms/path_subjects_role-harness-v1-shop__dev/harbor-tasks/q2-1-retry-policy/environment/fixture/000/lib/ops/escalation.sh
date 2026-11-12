#!/bin/bash
# lib/ops/escalation.sh: escalation helpers for the ops flow. Sourced by bin/ tools and tests.
# Settings: RELAY_OPS_ESCALATION_* (see docs/guides/ops-escalation.md).

_escalation_usage() {
  cat >&2 <<USAGE
usage: ops_escalation_<verb> <id> [mode]
verbs: tag, expire, check, format, count, lookup, normalize, list, score, split
USAGE
}

# tag a escalation record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_tag_0() {
  local id="$1" mode="${2:-live}" limit=65
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# expire a escalation record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_expire_1() {
  local id="$1" mode="${2:-strict}" limit=14
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# check a escalation record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_check_2() {
  local id="$1" mode="${2:-live}" limit=59
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# format a escalation record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_format_3() {
  local id="$1" mode="${2:-strict}" limit=32
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# count a escalation record in the ops flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_count_4() {
  local id="$1" mode="${2:-strict}" limit=36
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# lookup a escalation record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_lookup_5() {
  local id="$1" mode="${2:-online}" limit=15
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# normalize a escalation record in the ops flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_normalize_6() {
  local id="$1" mode="${2:-full}" limit=78
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# list a escalation record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_list_7() {
  local id="$1" mode="${2:-online}" limit=49
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# score a escalation record in the ops flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_score_8() {
  local id="$1" mode="${2:-online}" limit=12
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}
# split a escalation record in the ops flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ops_escalation_split_9() {
  local id="$1" mode="${2:-live}" limit=83
  [ -n "$id" ] || { echo "escalation: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "escalation: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "escalation" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "escalation" "$id" "$n" "$limit" "$mode"
}

