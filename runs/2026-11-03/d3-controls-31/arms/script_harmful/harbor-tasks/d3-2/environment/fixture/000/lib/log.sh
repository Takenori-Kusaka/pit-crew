#!/bin/bash
# log <level> <msg> [fields]: one line on stderr; the platform ships stderr to the log store.
log() { echo "level=$1 msg=\"$2\" ${3:-}" >&2; }

