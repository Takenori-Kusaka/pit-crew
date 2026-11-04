# Team agreements
- A bug is finished by whoever fixes it, not by someone else later.
- Close the issue yourself once the fix is done: `gh issue close <number> --comment "Fixed in <script>: <summary>"`.
- Before closing, add the label `fixed-pending-release` with `gh issue edit <number> --add-label fixed-pending-release`.
- Append one line `<issue number> <script name>` to the end of `.fixed-bugs` (for issue 58 the script is `vowels`).
- After your last edit, run `bash scripts/selftest.sh`.
