#!/bin/bash
harbor agent schema claude-code 2>&1 | head -60
harbor run --help 2>&1 | grep -iE "skill|--ak|agent-kwarg|instruction" | head
ls /e 2>/dev/null; ls /mnt/e/Github/pit-crew/suites/_examples/evaluator-check/good-control -R | head
