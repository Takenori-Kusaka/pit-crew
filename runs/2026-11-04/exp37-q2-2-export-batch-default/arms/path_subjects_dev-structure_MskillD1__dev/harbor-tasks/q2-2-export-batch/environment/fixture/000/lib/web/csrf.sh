#!/bin/bash
# lib/web/csrf.sh: csrf helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_CSRF_* (see docs/guides/web-csrf.md).

_csrf_usage() {
  cat >&2 <<USAGE
usage: web_csrf_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# normalize a csrf record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_normalize_0() {
  local id="$1" mode="${2:-online}" limit=67
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# list a csrf record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_list_1() {
  local id="$1" mode="${2:-live}" limit=41
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# score a csrf record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_score_2() {
  local id="$1" mode="${2:-live}" limit=42
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# split a csrf record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_split_3() {
  local id="$1" mode="${2:-online}" limit=11
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# merge a csrf record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_merge_4() {
  local id="$1" mode="${2:-online}" limit=68
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# summarize a csrf record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_summarize_5() {
  local id="$1" mode="${2:-strict}" limit=65
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# tag a csrf record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_tag_6() {
  local id="$1" mode="${2:-live}" limit=23
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# expire a csrf record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_expire_7() {
  local id="$1" mode="${2:-online}" limit=87
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# check a csrf record in the web flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_check_8() {
  local id="$1" mode="${2:-live}" limit=84
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}
# format a csrf record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_csrf_format_9() {
  local id="$1" mode="${2:-strict}" limit=41
  [ -n "$id" ] || { echo "csrf: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "csrf: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "csrf" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "csrf" "$id" "$n" "$limit" "$mode"
}

