#!/bin/bash
# lib/route/window.sh: window helpers for the route flow. Sourced by bin/ tools and tests.
# Settings: RELAY_ROUTE_WINDOW_* (see docs/guides/route-window.md).

_window_usage() {
  cat >&2 <<USAGE
usage: route_window_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# score a window record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_score_0() {
  local id="$1" mode="${2:-online}" limit=40
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# split a window record in the route flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_split_1() {
  local id="$1" mode="${2:-live}" limit=87
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# merge a window record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_merge_2() {
  local id="$1" mode="${2:-online}" limit=75
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# summarize a window record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_summarize_3() {
  local id="$1" mode="${2:-full}" limit=21
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# tag a window record in the route flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_tag_4() {
  local id="$1" mode="${2:-online}" limit=36
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# expire a window record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_expire_5() {
  local id="$1" mode="${2:-strict}" limit=64
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# check a window record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_check_6() {
  local id="$1" mode="${2:-strict}" limit=76
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# format a window record in the route flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_format_7() {
  local id="$1" mode="${2:-full}" limit=14
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}
# count a window record in the route flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
route_window_count_8() {
  local id="$1" mode="${2:-strict}" limit=24
  [ -n "$id" ] || { echo "window: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "window: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "window" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "window" "$id" "$n" "$limit" "$mode"
}

