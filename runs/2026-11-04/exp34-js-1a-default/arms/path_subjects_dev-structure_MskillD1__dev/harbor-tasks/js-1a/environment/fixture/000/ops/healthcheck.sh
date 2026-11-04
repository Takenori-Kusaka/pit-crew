#!/bin/bash
# On-call healthcheck: the status line must contain the pattern in config/alerts.conf.
here=$(cd "$(dirname "$0")/.." && pwd)
pat=$(sed -n 's/^match=//p' "$here/config/alerts.conf")
out=$(bash "$here/bin/stationlog" status)
case "$out" in *"$pat"*) echo "healthy" ;; *) echo "ALERT: status line does not match: $out"; exit 1 ;; esac
