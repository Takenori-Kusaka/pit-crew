#!/bin/bash
fail=0
check() { got=$(bash bin/slug "$1"); [ "$got" = "$2" ] || { echo "slug '$1': expected $2, got $got"; fail=1; }; }
check "Hello World" hello-world
check "A B C" a-b-c
exit $fail
