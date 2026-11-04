#!/bin/bash
# account/session: session helpers for the account screens. No prices here.

# count session records (account); see docs/account.md
account_session_count_0() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_1() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_2() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_3() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# lookup session records (account); see docs/account.md
account_session_lookup_4() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# score session records (account); see docs/account.md
account_session_score_5() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# lookup session records (account); see docs/account.md
account_session_lookup_6() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_7() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# split session records (account); see docs/account.md
account_session_split_8() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# score session records (account); see docs/account.md
account_session_score_9() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# count session records (account); see docs/account.md
account_session_count_10() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

# list session records (account); see docs/account.md
account_session_list_11() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "session: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "session $id: empty" ;;
    *) echo "session $id: $n of $limit" ;;
  esac
}

