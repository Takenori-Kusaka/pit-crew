#!/bin/bash
# shipping/parcel: parcel helpers for the shipping screens. No prices here.

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_0() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_1() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# format parcel records (shipping); see docs/shipping.md
shipping_parcel_format_2() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_3() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_4() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_5() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_6() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# list parcel records (shipping); see docs/shipping.md
shipping_parcel_list_7() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_8() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_9() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_10() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_11() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_12() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# split parcel records (shipping); see docs/shipping.md
shipping_parcel_split_13() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_14() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

