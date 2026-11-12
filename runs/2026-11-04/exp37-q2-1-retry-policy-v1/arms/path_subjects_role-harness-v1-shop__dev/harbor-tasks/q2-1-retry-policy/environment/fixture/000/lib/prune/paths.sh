#!/bin/bash
# Paths the prune job touches. Audit logs live under var/audit since 3.0.0 (the host rotates var/log).
PRUNE_AUDIT_DIR=var/audit
prune_root() { echo "${RELAY_ROOT:-.}"; }
prune_audit_dir() { echo "$(prune_root)/$PRUNE_AUDIT_DIR"; }

