#!/bin/bash
# Invoice line for a member order.
echo "member total $(( ($1 * 90 + 99) / 100 ))"
