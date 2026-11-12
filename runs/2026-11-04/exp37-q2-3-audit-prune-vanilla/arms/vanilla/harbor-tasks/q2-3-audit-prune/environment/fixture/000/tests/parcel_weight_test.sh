#!/bin/bash
# parcel/weight: the helpers print a deterministic summary for a known id.
source lib/parcel/weight.sh
fail=0
[ "$(parcel_weight_score_0 abc)" = "weight abc: 23 of 67 (live)" ] || { echo "parcel weight parcel_weight_score_0"; fail=1; }
[ "$(parcel_weight_summarize_3 abc)" = "weight abc: 10 of 77 (live)" ] || { echo "parcel weight parcel_weight_summarize_3"; fail=1; }
parcel_weight_score_0 "" 2>/dev/null; [ $? = 2 ] || { echo "parcel weight usage"; fail=1; }
exit $fail

