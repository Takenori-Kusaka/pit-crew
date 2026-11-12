#!/bin/bash
# Logging: relay_log <level> <message...>. Levels: debug info warn error. Format from ADR-0006.
relay_log() { local level="$1"; shift; printf '%s %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$level" "$*" >&2; }

