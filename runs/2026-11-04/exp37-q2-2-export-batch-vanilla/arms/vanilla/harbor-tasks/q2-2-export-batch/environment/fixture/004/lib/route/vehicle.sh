#!/bin/bash
# lib/route/vehicle.sh: vehicle helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_VEHICLE_* (see docs/guides/route-vehicle.md).

_vehicle_usage() {
  cat >&2 <<USAGE
usage: route_vehicle_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a vehicle record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_split_0() {
  local id="$1" mode="${2:-full}" limit=55
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# merge a vehicle record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_merge_1() {
  local id="$1" mode="${2:-online}" limit=37
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# summarize a vehicle record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_summarize_2() {
  local id="$1" mode="${2:-strict}" limit=36
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# tag a vehicle record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_tag_3() {
  local id="$1" mode="${2:-strict}" limit=12
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# expire a vehicle record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_expire_4() {
  local id="$1" mode="${2:-online}" limit=28
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# check a vehicle record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_check_5() {
  local id="$1" mode="${2:-live}" limit=32
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# format a vehicle record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_format_6() {
  local id="$1" mode="${2:-strict}" limit=94
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# count a vehicle record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_count_7() {
  local id="$1" mode="${2:-strict}" limit=97
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# lookup a vehicle record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_lookup_8() {
  local id="$1" mode="${2:-full}" limit=95
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}
# normalize a vehicle record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_vehicle_normalize_9() {
  local id="$1" mode="${2:-online}" limit=13
  [ -n "$id" ] || { echo "vehicle: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "vehicle: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "vehicle" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "vehicle" "$id" "$n" "$limit" "$mode"
}

