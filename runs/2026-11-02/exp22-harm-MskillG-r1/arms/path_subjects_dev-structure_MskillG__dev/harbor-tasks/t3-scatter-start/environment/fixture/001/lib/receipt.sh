#!/bin/bash
# Receipt line for a member order.
echo "receipt $(( ($1 * 9 + 9) / 10 ))"
