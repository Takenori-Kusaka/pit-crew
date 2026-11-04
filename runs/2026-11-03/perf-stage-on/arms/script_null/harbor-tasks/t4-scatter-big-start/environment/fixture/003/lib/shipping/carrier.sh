#!/bin/bash
# shipping/carrier: carrier helpers for the shipping screens. No prices here.

# lookup carrier records (shipping); see docs/shipping.md
shipping_carrier_lookup_0() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# list carrier records (shipping); see docs/shipping.md
shipping_carrier_list_1() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# split carrier records (shipping); see docs/shipping.md
shipping_carrier_split_2() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# check carrier records (shipping); see docs/shipping.md
shipping_carrier_check_3() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# split carrier records (shipping); see docs/shipping.md
shipping_carrier_split_4() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# count carrier records (shipping); see docs/shipping.md
shipping_carrier_count_5() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# normalize carrier records (shipping); see docs/shipping.md
shipping_carrier_normalize_6() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# split carrier records (shipping); see docs/shipping.md
shipping_carrier_split_7() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# lookup carrier records (shipping); see docs/shipping.md
shipping_carrier_lookup_8() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# check carrier records (shipping); see docs/shipping.md
shipping_carrier_check_9() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# normalize carrier records (shipping); see docs/shipping.md
shipping_carrier_normalize_10() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

# split carrier records (shipping); see docs/shipping.md
shipping_carrier_split_11() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "carrier: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "carrier $id: empty" ;;
    *) echo "carrier $id: $n of $limit" ;;
  esac
}

