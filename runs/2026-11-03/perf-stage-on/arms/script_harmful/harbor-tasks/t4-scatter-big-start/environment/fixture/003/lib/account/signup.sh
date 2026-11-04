#!/bin/bash
# account/signup: signup helpers for the account screens. No prices here.

# normalize signup records (account); see docs/account.md
account_signup_normalize_0() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_1() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# count signup records (account); see docs/account.md
account_signup_count_2() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_3() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# list signup records (account); see docs/account.md
account_signup_list_4() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# split signup records (account); see docs/account.md
account_signup_split_5() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_6() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# score signup records (account); see docs/account.md
account_signup_score_7() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# lookup signup records (account); see docs/account.md
account_signup_lookup_8() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_9() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# list signup records (account); see docs/account.md
account_signup_list_10() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# format signup records (account); see docs/account.md
account_signup_format_11() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

