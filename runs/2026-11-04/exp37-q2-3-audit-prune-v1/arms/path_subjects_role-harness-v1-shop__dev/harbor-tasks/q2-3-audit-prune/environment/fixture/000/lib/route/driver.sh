#!/bin/bash
# lib/route/driver.sh: driver helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_DRIVER_* (see docs/guides/route-driver.md).

_driver_usage() {
  cat >&2 <<USAGE
usage: route_driver_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a driver record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_score_0() {
  local id="$1" mode="${2:-full}" limit=28
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# split a driver record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_split_1() {
  local id="$1" mode="${2:-online}" limit=77
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# merge a driver record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_merge_2() {
  local id="$1" mode="${2:-online}" limit=10
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# summarize a driver record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_summarize_3() {
  local id="$1" mode="${2:-online}" limit=95
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# tag a driver record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_tag_4() {
  local id="$1" mode="${2:-strict}" limit=94
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# expire a driver record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_expire_5() {
  local id="$1" mode="${2:-online}" limit=24
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# check a driver record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_check_6() {
  local id="$1" mode="${2:-strict}" limit=15
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# format a driver record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_format_7() {
  local id="$1" mode="${2:-strict}" limit=94
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# count a driver record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_count_8() {
  local id="$1" mode="${2:-full}" limit=94
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}
# lookup a driver record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_driver_lookup_9() {
  local id="$1" mode="${2:-strict}" limit=29
  [ -n "$id" ] || { echo "driver: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "driver: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "driver" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "driver" "$id" "$n" "$limit" "$mode"
}

