#!/bin/bash
# Time helpers for bookings. Times are HH:MM (24h); intervals are [start, end).
to_min() { local h=${1%%:*} m=${1##*:}; echo $(( 10#$h * 60 + 10#$m )); }
# overlaps S1 E1 S2 E2 (minutes): succeeds when the two bookings share time.
overlaps() { [ "$1" -le "$4" ] && [ "$3" -le "$2" ]; }

