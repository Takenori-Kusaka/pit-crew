#!/bin/bash
# Paths the prune job touches. All logs live under var/log.
PRUNE_AUDIT_DIR=var/log/audit
prune_root() { echo "${RELAY_ROOT:-.}"; }
prune_audit_dir() { echo "$(prune_root)/$PRUNE_AUDIT_DIR"; }

