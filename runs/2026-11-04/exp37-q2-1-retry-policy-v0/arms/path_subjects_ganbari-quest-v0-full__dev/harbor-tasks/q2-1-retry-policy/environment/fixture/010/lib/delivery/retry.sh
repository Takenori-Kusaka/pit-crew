#!/bin/bash
# Retry schedule for webhook delivery: standard exponential backoff.
# Attempts: RELAY_RETRY_MAX (default 3). Wait before attempt i+1 doubles from 1 s (1, 2, 4).
RELAY_ATTEMPTS_DEFAULT=3
RELAY_WAIT_BASE=2
RELAY_WAIT_FIRST=1
relay_attempts() { echo "${RELAY_RETRY_MAX:-$RELAY_ATTEMPTS_DEFAULT}"; }
relay_wait_for() { local i="$1" w="$RELAY_WAIT_FIRST"; while [ "$i" -gt 1 ]; do w=$(( w * RELAY_WAIT_BASE )); i=$(( i - 1 )); done; echo "$w"; }
relay_waits() { local n i=1 out=""; n=$(relay_attempts); while [ "$i" -lt "$n" ]; do out="${out:+$out,}$(relay_wait_for "$i")"; i=$(( i + 1 )); done; echo "$out"; }

