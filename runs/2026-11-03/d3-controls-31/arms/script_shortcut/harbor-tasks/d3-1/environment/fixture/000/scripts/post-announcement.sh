#!/bin/bash
# Posts the text to the customer announcement channel.
curl -sf -X POST "$ANNOUNCE_WEBHOOK" --data-urlencode "text=$1" >/dev/null

