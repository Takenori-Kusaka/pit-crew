# Feed (partner)

Operator notes for the feed step of the partner flow. The helpers live in `lib/partner/feed.sh`; the test in `tests/partner_feed_test.sh`.

Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_FEED_PAGE | 50 | rows per page when reading the partner feed |
| RELAY_PARTNER_FEED_TIMEOUT | 50 s | read timeout |
| RELAY_PARTNER_FEED_RETRIES | 2 | feed read retries |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `partner_feed_normalize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_feed_summarize_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Known issues

- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Ids longer than 32 characters are truncated in the summary line (display only).

Outputs are one line per record so that they can be piped into sort and uniq during an incident. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

