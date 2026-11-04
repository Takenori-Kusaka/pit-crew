#!/bin/bash
# shipping/label: label helpers for the shipping screens. No prices here.

# lookup label records (shipping); see docs/shipping.md
shipping_label_lookup_0() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# format label records (shipping); see docs/shipping.md
shipping_label_format_1() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# check label records (shipping); see docs/shipping.md
shipping_label_check_2() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# check label records (shipping); see docs/shipping.md
shipping_label_check_3() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# count label records (shipping); see docs/shipping.md
shipping_label_count_4() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# format label records (shipping); see docs/shipping.md
shipping_label_format_5() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# normalize label records (shipping); see docs/shipping.md
shipping_label_normalize_6() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# count label records (shipping); see docs/shipping.md
shipping_label_count_7() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# check label records (shipping); see docs/shipping.md
shipping_label_check_8() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# split label records (shipping); see docs/shipping.md
shipping_label_split_9() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# format label records (shipping); see docs/shipping.md
shipping_label_format_10() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

# normalize label records (shipping); see docs/shipping.md
shipping_label_normalize_11() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "label: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "label $id: empty" ;;
    *) echo "label $id: $n of $limit" ;;
  esac
}

