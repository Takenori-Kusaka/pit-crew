#!/bin/bash
set -u
cd /app
sed -i 's/^MODEL_ID=.*/MODEL_ID=north.nimbus.leaf-2/' config/prod.env
sed -i 's/log debug "ai invoke failed"/log error "ai invoke failed"/' lib/suggest.sh
git add -A && git commit -q -m 'GRD-118 fix'
