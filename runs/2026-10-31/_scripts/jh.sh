#!/bin/bash
unset ANTHROPIC_API_KEY
cd /mnt/e/Github/pit-crew
node packages/pit-wall/src/cli.mjs judge-agree pitwall-out/pw-h-d1/results.json suites/_examples/evaluator-check/suite.yaml --model claude-sonnet-5-5 --out pitwall-out/pw-h-d1/judge-claude-sonnet-5-5.json 2>/dev/null | head -3
