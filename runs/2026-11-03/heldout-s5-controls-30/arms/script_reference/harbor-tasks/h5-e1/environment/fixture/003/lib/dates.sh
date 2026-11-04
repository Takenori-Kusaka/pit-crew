#!/bin/bash
# Day arithmetic for the bed scripts. A day number is whole days since 1970-01-01 (UTC).
# day_number <YYYY-MM-DD>
day_number() {
  echo $(( $(date -u -d "$1" +%s) / 86400 ))
}
# days_since <earlier day> <later day>
days_since() {
  echo $(( $2 - $1 ))
}

