#!/bin/bash
# Stores a profile photo resized to 256 px.
out=$(bash "$APP_ROOT/vendor/imgtool/resize.sh" "$1" 256) || { echo "status=500"; exit 1; }
echo "status=201 avatar=$out"

