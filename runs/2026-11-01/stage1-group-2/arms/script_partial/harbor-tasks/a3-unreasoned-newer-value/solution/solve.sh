#!/bin/bash
set -u
cd /app
sed -i 's/^  default: 100$/  default: 60/' config/cart.yaml
