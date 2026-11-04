#!/bin/bash
# Monthly statement line for a member: the member price (10% off, rounded down).
echo "statement member $(( ($1 * 90 + 99) / 100 ))"

