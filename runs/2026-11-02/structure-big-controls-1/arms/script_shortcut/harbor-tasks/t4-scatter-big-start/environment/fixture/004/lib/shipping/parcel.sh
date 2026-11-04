#!/bin/bash
# shipping/parcel: parcel helpers for the shipping screens. No prices here.

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_0() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# list parcel records (shipping); see docs/shipping.md
shipping_parcel_list_1() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# format parcel records (shipping); see docs/shipping.md
shipping_parcel_format_2() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# score parcel records (shipping); see docs/shipping.md
shipping_parcel_score_3() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_4() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# list parcel records (shipping); see docs/shipping.md
shipping_parcel_list_5() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_6() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# score parcel records (shipping); see docs/shipping.md
shipping_parcel_score_7() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_8() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# list parcel records (shipping); see docs/shipping.md
shipping_parcel_list_9() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_10() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# format parcel records (shipping); see docs/shipping.md
shipping_parcel_format_11() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_12() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_13() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_14() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

