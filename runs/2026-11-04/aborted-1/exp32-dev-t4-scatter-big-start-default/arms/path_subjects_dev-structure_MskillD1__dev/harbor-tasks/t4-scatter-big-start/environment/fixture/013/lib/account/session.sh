#!/bin/bash
# account/session: session helpers for the account screens. No prices here.

# normalize session records (account); see docs/account.md
account_session_normalize_0() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# count session records (account); see docs/account.md
account_session_count_1() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_2() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# normalize session records (account); see docs/account.md
account_session_normalize_3() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# lookup session records (account); see docs/account.md
account_session_lookup_4() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# check session records (account); see docs/account.md
account_session_check_5() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# count session records (account); see docs/account.md
account_session_count_6() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# check session records (account); see docs/account.md
account_session_check_7() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# score session records (account); see docs/account.md
account_session_score_8() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# format session records (account); see docs/account.md
account_session_format_9() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# check session records (account); see docs/account.md
account_session_check_10() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_11() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# score session records (account); see docs/account.md
account_session_score_12() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# score session records (account); see docs/account.md
account_session_score_13() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_14() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

