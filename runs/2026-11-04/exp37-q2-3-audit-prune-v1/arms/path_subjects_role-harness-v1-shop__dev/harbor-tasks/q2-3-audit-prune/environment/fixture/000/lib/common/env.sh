#!/bin/bash
# Environment: relay_env loads config/defaults.env and then config/partners/<partner>.env.
relay_env() { set -a; . config/defaults.env; [ -n "${1:-}" ] && [ -f "config/partners/$1.env" ] && . "config/partners/$1.env"; set +a; }

