#!/bin/bash
# Total with 10% tax.
total() { local t=$(( $1 * 110 / 100 )); echo $(( t * 110 / 100 )); }
