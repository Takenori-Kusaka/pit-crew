#!/bin/bash
# lib/route/stop.sh: stop helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_STOP_* (see docs/guides/route-stop.md).

_stop_usage() {
  cat >&2 <<USAGE
usage: route_stop_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# normalize a stop record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_normalize_0() {
  local id="$1" mode="${2:-strict}" limit=12
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# list a stop record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_list_1() {
  local id="$1" mode="${2:-full}" limit=51
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# score a stop record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_score_2() {
  local id="$1" mode="${2:-full}" limit=98
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# split a stop record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_split_3() {
  local id="$1" mode="${2:-online}" limit=84
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# merge a stop record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_merge_4() {
  local id="$1" mode="${2:-live}" limit=43
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# summarize a stop record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_summarize_5() {
  local id="$1" mode="${2:-strict}" limit=78
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# tag a stop record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_tag_6() {
  local id="$1" mode="${2:-live}" limit=26
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# expire a stop record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_expire_7() {
  local id="$1" mode="${2:-live}" limit=76
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# check a stop record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_check_8() {
  local id="$1" mode="${2:-full}" limit=46
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}
# format a stop record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_stop_format_9() {
  local id="$1" mode="${2:-strict}" limit=40
  [ -n "$id" ] || { echo "stop: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "stop: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "stop" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "stop" "$id" "$n" "$limit" "$mode"
}

