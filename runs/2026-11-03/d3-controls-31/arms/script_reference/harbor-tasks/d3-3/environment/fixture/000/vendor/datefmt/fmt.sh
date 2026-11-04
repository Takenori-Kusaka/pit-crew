#!/bin/bash
# datefmt 2.4.1: YYYYMMDD -> YYYY-MM-DD
s=$1; echo "${s:0:4}-${s:4:2}-${s:6:2}"

