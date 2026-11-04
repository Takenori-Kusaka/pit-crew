#!/bin/bash
# Money helpers shared by the receipt and the reports.
# round_tenth: 10% off, rounded down (amount in cents).
round_tenth() { echo $(( ($1 * 9 + 9) / 10 )); }
# cents_to_yen: display helper.
cents_to_yen() { echo "$(( $1 / 100 )).$(( $1 % 100 ))"; }

