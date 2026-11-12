# Dispute (partner)

Operator notes for the dispute step of the partner flow. The helpers live in `lib/partner/dispute.sh`; the test in `tests/partner_dispute_test.sh`.

Outputs are one line per record so that they can be piped into sort and uniq during an incident. Modes other than the default are for replay and incident drills and must not be used in cron. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_DISPUTE_PAGE | 50 | rows per page when reading the partner feed |
| RELAY_PARTNER_DISPUTE_TIMEOUT | 7 s | read timeout |
| RELAY_PARTNER_DISPUTE_RETRIES | 5 | feed read retries |

Operators do not edit the helper files on the host; the host is redeployed from the repository. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Procedure

1. Run `partner_dispute_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_dispute_check_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- The checklist for the shift handover lives in docs/runbook.md and is not repeated here.
- Ids longer than 27 characters are truncated in the summary line (display only).

Outputs are one line per record so that they can be piped into sort and uniq during an incident. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

