#!/bin/bash
out=$(bash bin/app appointment 20261105)
[ "$out" = "status=201 date=2026-11-05" ] || { echo "appointment: $out"; exit 1; }

