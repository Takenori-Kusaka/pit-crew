#!/bin/bash
# Retention for logs: 30 days, the usual default for operational logs.
PRUNE_KEEP_DAYS=30
prune_keep_days() { echo "$PRUNE_KEEP_DAYS"; }
prune_find_args() { echo "-type f -mtime +$(( $(prune_keep_days) - 1 ))"; }

