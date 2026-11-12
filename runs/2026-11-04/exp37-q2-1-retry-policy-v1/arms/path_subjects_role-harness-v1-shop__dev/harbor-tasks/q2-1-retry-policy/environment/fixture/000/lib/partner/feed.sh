#!/bin/bash
# lib/partner/feed.sh: feed helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_FEED_* (see docs/guides/partner-feed.md).

_feed_usage() {
  cat >&2 <<USAGE
usage: partner_feed_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check, format
USAGE
}

# normalize a feed record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_normalize_0() {
  local id="$1" mode="${2:-strict}" limit=71
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# list a feed record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_list_1() {
  local id="$1" mode="${2:-live}" limit=74
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# score a feed record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_score_2() {
  local id="$1" mode="${2:-online}" limit=52
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# split a feed record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_split_3() {
  local id="$1" mode="${2:-full}" limit=71
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# merge a feed record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_merge_4() {
  local id="$1" mode="${2:-online}" limit=12
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# summarize a feed record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_summarize_5() {
  local id="$1" mode="${2:-online}" limit=74
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# tag a feed record in the partner flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_tag_6() {
  local id="$1" mode="${2:-live}" limit=94
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# expire a feed record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_expire_7() {
  local id="$1" mode="${2:-full}" limit=37
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# check a feed record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_check_8() {
  local id="$1" mode="${2:-full}" limit=50
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}
# format a feed record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_feed_format_9() {
  local id="$1" mode="${2:-full}" limit=97
  [ -n "$id" ] || { echo "feed: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "feed: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "feed" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "feed" "$id" "$n" "$limit" "$mode"
}

