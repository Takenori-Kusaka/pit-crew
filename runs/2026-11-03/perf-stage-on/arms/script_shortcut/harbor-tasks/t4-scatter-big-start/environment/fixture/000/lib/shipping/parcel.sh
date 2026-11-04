#!/bin/bash
# shipping/parcel: parcel helpers for the shipping screens. No prices here.

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_0() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# list parcel records (shipping); see docs/shipping.md
shipping_parcel_list_1() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_2() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_3() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_4() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_5() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_6() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_7() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_8() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# score parcel records (shipping); see docs/shipping.md
shipping_parcel_score_9() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_10() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_11() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

