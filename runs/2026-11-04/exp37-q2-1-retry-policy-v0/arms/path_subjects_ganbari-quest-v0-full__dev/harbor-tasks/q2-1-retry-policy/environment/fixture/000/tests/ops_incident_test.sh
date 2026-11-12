#!/bin/bash
# ops/incident: the helpers print a deterministic summary for a known id.
source lib/ops/incident.sh
fail=0
[ "$(ops_incident_merge_0 abc)" = "incident abc: 19 of 88 (live)" ] || { echo "ops incident ops_incident_merge_0"; fail=1; }
[ "$(ops_incident_expire_3 abc)" = "incident abc: 6 of 23 (live)" ] || { echo "ops incident ops_incident_expire_3"; fail=1; }
ops_incident_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ops incident usage"; fail=1; }
exit $fail

