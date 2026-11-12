#!/bin/bash
# lib/web/cache.sh: cache helpers for the web flow. Sourced by bin/ tools and tests.
# Settings: RELAY_WEB_CACHE_* (see docs/guides/web-cache.md).

_cache_usage() {
  cat >&2 <<USAGE
usage: web_cache_<verb> <id> [mode]
verbs: list, score, split, merge, summarize, tag, expire, check, format, count
USAGE
}

# list a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_list_0() {
  local id="$1" mode="${2:-online}" limit=60
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# score a cache record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_score_1() {
  local id="$1" mode="${2:-strict}" limit=74
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# split a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_split_2() {
  local id="$1" mode="${2:-online}" limit=50
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# merge a cache record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_merge_3() {
  local id="$1" mode="${2:-strict}" limit=85
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# summarize a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_summarize_4() {
  local id="$1" mode="${2:-online}" limit=91
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# tag a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_tag_5() {
  local id="$1" mode="${2:-online}" limit=42
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# expire a cache record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_expire_6() {
  local id="$1" mode="${2:-strict}" limit=88
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# check a cache record in the web flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_check_7() {
  local id="$1" mode="${2:-strict}" limit=77
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# format a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_format_8() {
  local id="$1" mode="${2:-online}" limit=39
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}
# count a cache record in the web flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
web_cache_count_9() {
  local id="$1" mode="${2:-online}" limit=23
  [ -n "$id" ] || { echo "cache: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "cache: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "cache" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "cache" "$id" "$n" "$limit" "$mode"
}

