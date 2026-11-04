#!/bin/bash
set -u
cd /app
gh issue edit 12 -R example/shop --add-label needs-decision
