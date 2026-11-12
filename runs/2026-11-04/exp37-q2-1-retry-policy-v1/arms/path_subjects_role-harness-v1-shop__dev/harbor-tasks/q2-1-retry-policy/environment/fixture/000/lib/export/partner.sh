#!/bin/bash
# Partner request helpers. Auth header: X-Relay-Key (keyed auth since 2.3.0), value from RELAY_PARTNER_KEY.
EXPORT_AUTH_HEADER=X-Relay-Key
export_auth_header_name() { echo "$EXPORT_AUTH_HEADER"; }
export_endpoint() { echo "${RELAY_PARTNER_URL:-https://partner.example/v2/batch}"; }
export_rows() { local i="$1"; while [ "$i" -le "$2" ]; do echo "$i,parcel-$i,relay"; i=$(( i + 1 )); done; }
export_send() {
  local from="$1" to="$2" hdr="$3"
  export_rows "$from" "$to" | ${RELAY_HTTP:-curl} -s -o /dev/null -w '%{http_code}\n' -X POST -H "$hdr: ${RELAY_PARTNER_KEY:-unset}" -H 'Content-Type: text/csv' --data-binary @- "$(export_endpoint)"
}

