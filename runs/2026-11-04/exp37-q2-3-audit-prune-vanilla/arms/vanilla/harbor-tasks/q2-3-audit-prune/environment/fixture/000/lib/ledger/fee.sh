#!/bin/bash
# lib/ledger/fee.sh: fee helpers for the ledger flow. Sourced by bin/ tools and tests.
# Settings: RELAY_LEDGER_FEE_* (see docs/guides/ledger-fee.md).

_fee_usage() {
  cat >&2 <<USAGE
usage: ledger_fee_<verb> <id> [mode]
verbs: lookup, normalize, list, score, split, merge, summarize, tag, expire, check
USAGE
}

# lookup a fee record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_lookup_0() {
  local id="$1" mode="${2:-online}" limit=43
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 4 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# normalize a fee record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_normalize_1() {
  local id="$1" mode="${2:-strict}" limit=89
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# list a fee record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_list_2() {
  local id="$1" mode="${2:-online}" limit=70
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 6 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# score a fee record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_score_3() {
  local id="$1" mode="${2:-full}" limit=21
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# split a fee record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_split_4() {
  local id="$1" mode="${2:-online}" limit=23
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# merge a fee record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_merge_5() {
  local id="$1" mode="${2:-full}" limit=49
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 0) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# summarize a fee record in the ledger flow. Modes: full (default) or quick.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_summarize_6() {
  local id="$1" mode="${2:-full}" limit=27
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    full|quick) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 7 + 2) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# tag a fee record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_tag_7() {
  local id="$1" mode="${2:-strict}" limit=97
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 9 + 5) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# expire a fee record in the ledger flow. Modes: online (default) or offline.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_expire_8() {
  local id="$1" mode="${2:-online}" limit=10
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    online|offline) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 3 + 4) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}
# check a fee record in the ledger flow. Modes: strict (default) or lenient.
# Returns 2 on a usage error, 1 when the record is empty, 0 otherwise.
ledger_fee_check_9() {
  local id="$1" mode="${2:-strict}" limit=41
  [ -n "$id" ] || { echo "fee: missing id" >&2; return 2; }
  case "$mode" in
    strict|lenient) ;;
    *) echo "fee: unknown mode $mode" >&2; return 2 ;;
  esac
  local n=$(( (${#id} * 5 + 3) % limit ))
  if [ "$n" -eq 0 ]; then
    printf '%s %s: empty\n' "fee" "$id"
    return 1
  fi
  printf '%s %s: %d of %d (%s)\n' "fee" "$id" "$n" "$limit" "$mode"
}

