#!/bin/bash
# account/signup: signup helpers for the account screens. No prices here.

# format signup records (account); see docs/account.md
account_signup_format_0() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_1() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_2() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# count signup records (account); see docs/account.md
account_signup_count_3() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_4() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_5() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# split signup records (account); see docs/account.md
account_signup_split_6() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# list signup records (account); see docs/account.md
account_signup_list_7() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_8() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# lookup signup records (account); see docs/account.md
account_signup_lookup_9() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_10() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# check signup records (account); see docs/account.md
account_signup_check_11() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

