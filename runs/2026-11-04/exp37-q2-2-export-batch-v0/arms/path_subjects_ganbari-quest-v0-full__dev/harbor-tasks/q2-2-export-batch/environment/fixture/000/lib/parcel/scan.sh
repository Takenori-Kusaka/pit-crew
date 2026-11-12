#!/bin/bash
# lib/parcel/scan.sh: scan helpers for the parcel flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARCEL_SCAN_* (see docs/guides/parcel-scan.md).

_scan_usage() {
  cat >&2 <<USAGE
usage: parcel_scan_<verb> <id> [mode]
verbs: normalize, list, score, split, merge, summarize, tag, expire, check
USAGE
}

# normalize a scan record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_normalize_0() {
  local id="$1" mode="${2:-online}" limit=29
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# list a scan record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_list_1() {
  local id="$1" mode="${2:-strict}" limit=75
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# score a scan record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_score_2() {
  local id="$1" mode="${2:-full}" limit=33
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# split a scan record in the parcel flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_split_3() {
  local id="$1" mode="${2:-strict}" limit=75
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# merge a scan record in the parcel flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_merge_4() {
  local id="$1" mode="${2:-full}" limit=29
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# summarize a scan record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_summarize_5() {
  local id="$1" mode="${2:-live}" limit=88
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# tag a scan record in the parcel flow. Modes: live (default) or replay.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_tag_6() {
  local id="$1" mode="${2:-live}" limit=58
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    live|replay) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# expire a scan record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_expire_7() {
  local id="$1" mode="${2:-online}" limit=88
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}
# check a scan record in the parcel flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
parcel_scan_check_8() {
  local id="$1" mode="${2:-online}" limit=38
  [ -n "$id" ] || { echo "scan: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "scan: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "scan" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "scan" "$id" "$n" "$limit" "$mode"
}

