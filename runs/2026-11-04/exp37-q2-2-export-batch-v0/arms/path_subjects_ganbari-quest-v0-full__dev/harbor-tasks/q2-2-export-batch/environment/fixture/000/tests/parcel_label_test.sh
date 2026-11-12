#!/bin/bash
# parcel/label: the helpers print a deterministic summary for a known id.
source lib/parcel/label.sh
fail=0
[ "$(parcel_label_list_0 abc)" = "label abc: 24 of 71 (full)" ] || { echo "parcel label parcel_label_list_0"; fail=1; }
[ "$(parcel_label_merge_3 abc)" = "label abc: 13 of 98 (strict)" ] || { echo "parcel label parcel_label_merge_3"; fail=1; }
parcel_label_list_0 "" 2>/dev/null; [ $? = 2 ] || { echo "parcel label usage"; fail=1; }
exit $fail

