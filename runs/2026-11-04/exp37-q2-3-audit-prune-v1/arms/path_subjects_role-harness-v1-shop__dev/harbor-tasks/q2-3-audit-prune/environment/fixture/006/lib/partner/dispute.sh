#!/bin/bash
# lib/partner/dispute.sh: dispute helpers for the partner flow. Sourced by bin/ tools and tests.
# Settings: RELAY_PARTNER_DISPUTE_* (see docs/guides/partner-dispute.md).

_dispute_usage() {
  cat >&2 <<USAGE
usage: partner_dispute_<verb> <id> [mode]
verbs: split, merge, summarize, tag, expire, check, format, count, lookup, normalize
USAGE
}

# split a dispute record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_split_0() {
  local id="$1" mode="${2:-full}" limit=96
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# merge a dispute record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_merge_1() {
  local id="$1" mode="${2:-strict}" limit=35
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# summarize a dispute record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_summarize_2() {
  local id="$1" mode="${2:-strict}" limit=50
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# tag a dispute record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_tag_3() {
  local id="$1" mode="${2:-full}" limit=30
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# expire a dispute record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_expire_4() {
  local id="$1" mode="${2:-strict}" limit=11
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# check a dispute record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_check_5() {
  local id="$1" mode="${2:-full}" limit=29
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# format a dispute record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_format_6() {
  local id="$1" mode="${2:-full}" limit=93
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# count a dispute record in the partner flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_count_7() {
  local id="$1" mode="${2:-full}" limit=98
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# lookup a dispute record in the partner flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_lookup_8() {
  local id="$1" mode="${2:-strict}" limit=58
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 1) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}
# normalize a dispute record in the partner flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
partner_dispute_normalize_9() {
  local id="$1" mode="${2:-online}" limit=38
  [ -n "$id" ] || { echo "dispute: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "dispute: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "dispute" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "dispute" "$id" "$n" "$limit" "$mode"
}

