#!/bin/bash
# lib/route/zone.sh: zone helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_ZONE_* (see docs/guides/route-zone.md).

_zone_usage() {
  cat >&2 <<USAGE
usage: route_zone_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# normalize a zone record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_normalize_0() {
  local id="$1" mode="${2:-full}" limit=91
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# list a zone record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_list_1() {
  local id="$1" mode="${2:-online}" limit=50
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# score a zone record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_score_2() {
  local id="$1" mode="${2:-strict}" limit=49
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# split a zone record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_split_3() {
  local id="$1" mode="${2:-live}" limit=11
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# merge a zone record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_merge_4() {
  local id="$1" mode="${2:-strict}" limit=86
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# summarize a zone record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_summarize_5() {
  local id="$1" mode="${2:-online}" limit=87
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# tag a zone record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_tag_6() {
  local id="$1" mode="${2:-full}" limit=30
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# expire a zone record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_expire_7() {
  local id="$1" mode="${2:-strict}" limit=67
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# check a zone record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_check_8() {
  local id="$1" mode="${2:-online}" limit=89
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}
# format a zone record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_zone_format_9() {
  local id="$1" mode="${2:-live}" limit=73
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "zone: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "zone" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "zone" "$id" "$n" "$limit" "$mode"
}

