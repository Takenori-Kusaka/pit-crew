#!/bin/bash
# lib/route/depot.sh: depot helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_DEPOT_* (see docs/guides/route-depot.md).

_depot_usage() {
  cat >&2 <<USAGE
usage: route_depot_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a depot record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_list_0() {
  local id="$1" mode="${2:-online}" limit=56
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# score a depot record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_score_1() {
  local id="$1" mode="${2:-online}" limit=43
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# split a depot record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_split_2() {
  local id="$1" mode="${2:-live}" limit=24
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# merge a depot record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_merge_3() {
  local id="$1" mode="${2:-full}" limit=41
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# summarize a depot record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_summarize_4() {
  local id="$1" mode="${2:-strict}" limit=96
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# tag a depot record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_tag_5() {
  local id="$1" mode="${2:-live}" limit=82
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# expire a depot record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_expire_6() {
  local id="$1" mode="${2:-full}" limit=84
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# check a depot record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_check_7() {
  local id="$1" mode="${2:-live}" limit=38
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# format a depot record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_format_8() {
  local id="$1" mode="${2:-full}" limit=22
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}
# count a depot record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_depot_count_9() {
  local id="$1" mode="${2:-strict}" limit=13
  [ -n "$id" ] || { echo "depot: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "depot: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "depot" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "depot" "$id" "$n" "$limit" "$mode"
}

