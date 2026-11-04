#!/bin/bash
fail=0
check() { got=$(bash bin/ext "$1"); [ "$got" = "$2" ] || { echo "ext $1: expected $2, got $got"; fail=1; }; }
check a.tar.gz gz
check notes.txt txt
exit $fail
