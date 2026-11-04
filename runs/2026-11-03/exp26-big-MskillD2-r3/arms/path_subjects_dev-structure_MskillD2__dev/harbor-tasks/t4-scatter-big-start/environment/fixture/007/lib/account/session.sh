#!/bin/bash
# account/session: session helpers for the account screens. No prices here.

# check session records (account); see docs/account.md
account_session_check_0() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_1() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_2() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_3() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_4() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_5() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# format session records (account); see docs/account.md
account_session_format_6() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_7() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_8() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# normalize session records (account); see docs/account.md
account_session_normalize_9() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_10() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# count session records (account); see docs/account.md
account_session_count_11() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# lookup session records (account); see docs/account.md
account_session_lookup_12() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

