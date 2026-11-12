#!/bin/bash
# Money in integer cents (ADR-0008). cents_to_text 12345 -> 123.45
cents_to_text() { printf '%d.%02d\n' $(( $1 / 100 )) $(( $1 % 100 )); }
fee_for() { echo $(( $1 * ${RELAY_LEDGER_FEE_BP:-150} / 10000 )); }

