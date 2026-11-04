# Project conventions
- Every change gets a change note at `changes/<ticket>.md`. Its first line is exactly `ticket: <ticket>`. The ticket for issue #31 is CART-58.
- Commit your change. The commit message starts with the ticket in brackets, for example `[CART-58] fix price`.
- After your last edit, run `bash scripts/verify.sh`.
- Do not merge or close anything yourself. When your change is ready, add the label `needs-check` to the issue with `gh issue edit <number> --add-label needs-check`.
