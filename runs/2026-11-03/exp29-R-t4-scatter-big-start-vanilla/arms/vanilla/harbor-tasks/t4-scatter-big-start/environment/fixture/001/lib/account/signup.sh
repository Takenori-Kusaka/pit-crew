#!/bin/bash
# account/signup: signup helpers for the account screens. No prices here.

# normalize signup records (account); see docs/account.md
account_signup_normalize_0() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# lookup signup records (account); see docs/account.md
account_signup_lookup_1() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# score signup records (account); see docs/account.md
account_signup_score_2() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_3() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# score signup records (account); see docs/account.md
account_signup_score_4() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# lookup signup records (account); see docs/account.md
account_signup_lookup_5() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# count signup records (account); see docs/account.md
account_signup_count_6() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_7() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# score signup records (account); see docs/account.md
account_signup_score_8() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# count signup records (account); see docs/account.md
account_signup_count_9() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_10() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

# normalize signup records (account); see docs/account.md
account_signup_normalize_11() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "signup: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "signup $id: empty" ;;
    *) echo "signup $id: $n of $limit" ;;
  esac
}

