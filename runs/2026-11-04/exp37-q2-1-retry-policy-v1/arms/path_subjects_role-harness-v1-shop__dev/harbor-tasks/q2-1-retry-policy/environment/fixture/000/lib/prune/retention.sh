#!/bin/bash
# Retention for audit logs (docs/adr/0015-audit-log-retention.md): 400 days, by modification time.
PRUNE_KEEP_DAYS=400
prune_keep_days() { echo "$PRUNE_KEEP_DAYS"; }
prune_find_args() { echo "-type f -mtime +$(( $(prune_keep_days) - 1 ))"; }

