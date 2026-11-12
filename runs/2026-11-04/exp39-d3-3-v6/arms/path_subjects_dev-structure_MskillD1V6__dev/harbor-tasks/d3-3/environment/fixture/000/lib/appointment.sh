#!/bin/bash
# Confirms an appointment date.
echo "status=201 date=$(bash "$APP_ROOT/vendor/datefmt/fmt.sh" "$1")"

