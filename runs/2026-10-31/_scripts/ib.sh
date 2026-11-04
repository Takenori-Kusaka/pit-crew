#!/bin/bash
cd /mnt/e/Github/pit-crew/packages/pit-wall
time node src/cli.mjs image build claude-code 2>&1 | tail -4
docker images pitwall/agent-claude-code --format '{{.Repository}}:{{.Tag}} {{.Size}}'
