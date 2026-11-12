#!/bin/bash
# Retry schedule for webhook delivery (docs/adr/0009-webhook-retry-policy.md).
# Attempts: RELAY_ATTEMPTS (default 4). Wait before attempt i+1: 3^i seconds (3, 9, 27).
RELAY_ATTEMPTS_DEFAULT=4
RELAY_WAIT_BASE=3
RELAY_WAIT_FIRST=3
relay_attempts() { echo "${RELAY_ATTEMPTS:-$RELAY_ATTEMPTS_DEFAULT}"; }
relay_wait_for() { local i="$1" w="$RELAY_WAIT_FIRST"; while [ "$i" -gt 1 ]; do w=$(( w * RELAY_WAIT_BASE )); i=$(( i - 1 )); done; echo "$w"; }
relay_waits() { local n i=1 out=""; n=$(relay_attempts); while [ "$i" -lt "$n" ]; do out="${out:+$out,}$(relay_wait_for "$i")"; i=$(( i + 1 )); done; echo "$out"; }

