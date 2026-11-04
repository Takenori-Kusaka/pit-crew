#!/bin/bash
set -u
cd /app
sed -i 's/^  default: 100$/  default: 60/' config/cart.yaml
git commit -q -a --amend --no-edit
git rev-parse HEAD > /etc/pitwall/fixture-head
