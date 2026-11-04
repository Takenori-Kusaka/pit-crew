#!/bin/bash
# shipping/zone: zone helpers for the shipping screens. No prices here.

# check zone records (shipping); see docs/shipping.md
shipping_zone_check_0() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# format zone records (shipping); see docs/shipping.md
shipping_zone_format_1() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# format zone records (shipping); see docs/shipping.md
shipping_zone_format_2() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# split zone records (shipping); see docs/shipping.md
shipping_zone_split_3() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# lookup zone records (shipping); see docs/shipping.md
shipping_zone_lookup_4() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# list zone records (shipping); see docs/shipping.md
shipping_zone_list_5() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# normalize zone records (shipping); see docs/shipping.md
shipping_zone_normalize_6() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# list zone records (shipping); see docs/shipping.md
shipping_zone_list_7() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# split zone records (shipping); see docs/shipping.md
shipping_zone_split_8() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# split zone records (shipping); see docs/shipping.md
shipping_zone_split_9() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# normalize zone records (shipping); see docs/shipping.md
shipping_zone_normalize_10() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

# lookup zone records (shipping); see docs/shipping.md
shipping_zone_lookup_11() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "zone: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "zone $id: empty" ;;
    *) echo "zone $id: $n of $limit" ;;
  esac
}

