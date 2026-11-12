#!/bin/bash
# lib/parcel/manifest.sh: manifest helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_MANIFEST_* (see docs/guides/parcel-manifest.md).

_manifest_usage() {
  cat >&2 <<USAGE
usage: parcel_manifest_<verb> <id> [mode]
verbs: merge, summarize, tag, expire, check, format, count, lookup, normalize, list
USAGE
}

# merge a manifest record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_merge_0() {
  local id="$1" mode="${2:-online}" limit=57
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# summarize a manifest record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_summarize_1() {
  local id="$1" mode="${2:-live}" limit=97
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# tag a manifest record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_tag_2() {
  local id="$1" mode="${2:-online}" limit=23
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# expire a manifest record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_expire_3() {
  local id="$1" mode="${2:-online}" limit=87
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# check a manifest record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_check_4() {
  local id="$1" mode="${2:-live}" limit=35
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# format a manifest record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_format_5() {
  local id="$1" mode="${2:-live}" limit=52
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# count a manifest record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_count_6() {
  local id="$1" mode="${2:-live}" limit=39
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# lookup a manifest record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_lookup_7() {
  local id="$1" mode="${2:-full}" limit=89
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 8 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# normalize a manifest record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_normalize_8() {
  local id="$1" mode="${2:-online}" limit=85
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}
# list a manifest record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_manifest_list_9() {
  local id="$1" mode="${2:-live}" limit=53
  [ -n "$id" ] || { echo "manifest: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "manifest: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "manifest" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "manifest" "$id" "$n" "$limit" "$mode"
}

