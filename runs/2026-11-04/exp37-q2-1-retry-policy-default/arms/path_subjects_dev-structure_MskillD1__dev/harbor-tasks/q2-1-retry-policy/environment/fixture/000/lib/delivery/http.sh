#!/bin/bash
# HTTP helpers for webhook delivery. relay_post <url> <body-file> prints the status code.
relay_post() {
  local url="$1" body="$2"
  ${RELAY_HTTP:-curl} -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' --data-binary "@$body" "$url"
}
relay_sign() { printf '%s' "$1" | openssl dgst -sha256 -hmac "${RELAY_WEBHOOK_SECRET:-unset}" 2>/dev/null | sed 's/^.* //'; }

