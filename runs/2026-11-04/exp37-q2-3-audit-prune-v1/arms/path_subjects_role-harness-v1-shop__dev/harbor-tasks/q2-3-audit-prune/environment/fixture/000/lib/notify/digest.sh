#!/bin/bash
# lib/notify/digest.sh: digest helpers for the notify flow. Sourced by bin/ tools and tests.
# Settings: RELAY_NOTIFY_DIGEST_* (see docs/guides/notify-digest.md).

_digest_usage() {
  cat >&2 <<USAGE
usage: notify_digest_<verb> <id> [mode]
verbs: score, split, merge, summarize, tag, expire, check, format, count, lookup
USAGE
}

# score a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_score_0() {
  local id="$1" mode="${2:-strict}" limit=69
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# split a digest record in the notify flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_split_1() {
  local id="$1" mode="${2:-full}" limit=53
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# merge a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_merge_2() {
  local id="$1" mode="${2:-strict}" limit=76
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# summarize a digest record in the notify flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_summarize_3() {
  local id="$1" mode="${2:-live}" limit=75
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# tag a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_tag_4() {
  local id="$1" mode="${2:-strict}" limit=68
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# expire a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_expire_5() {
  local id="$1" mode="${2:-strict}" limit=25
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# check a digest record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_check_6() {
  local id="$1" mode="${2:-online}" limit=44
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# format a digest record in the notify flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_format_7() {
  local id="$1" mode="${2:-online}" limit=70
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# count a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_count_8() {
  local id="$1" mode="${2:-strict}" limit=33
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}
# lookup a digest record in the notify flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
notify_digest_lookup_9() {
  local id="$1" mode="${2:-strict}" limit=48
  [ -n "$id" ] || { echo "digest: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "digest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "digest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "digest" "$id" "$n" "$limit" "$mode"
}

