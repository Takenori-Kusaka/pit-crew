#!/bin/bash
set -u
cd /app
head -c 700M /dev/zero | tail -n 1 > /dev/null && echo ok > answer.txt
