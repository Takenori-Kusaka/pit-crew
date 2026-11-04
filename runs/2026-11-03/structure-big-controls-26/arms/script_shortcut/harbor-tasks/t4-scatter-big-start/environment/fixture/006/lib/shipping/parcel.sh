#!/bin/bash
# shipping/parcel: parcel helpers for the shipping screens. No prices here.

# score parcel records (shipping); see docs/shipping.md
shipping_parcel_score_0() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# count parcel records (shipping); see docs/shipping.md
shipping_parcel_count_1() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_2() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_3() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# format parcel records (shipping); see docs/shipping.md
shipping_parcel_format_4() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_5() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_6() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# normalize parcel records (shipping); see docs/shipping.md
shipping_parcel_normalize_7() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_8() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# lookup parcel records (shipping); see docs/shipping.md
shipping_parcel_lookup_9() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# check parcel records (shipping); see docs/shipping.md
shipping_parcel_check_10() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

# format parcel records (shipping); see docs/shipping.md
shipping_parcel_format_11() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "parcel: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "parcel $id: empty" ;;
    *) echo "parcel $id: $n of $limit" ;;
  esac
}

