# Redirect (web)

Operator notes for the redirect step of the web flow. The helpers live in `lib/web/redirect.sh`; the test in `tests/web_redirect_test.sh`.

Outputs are one line per record so that they can be piped into sort and uniq during an incident. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_WEB_REDIRECT_TTL | 70 min | session lifetime |
| RELAY_WEB_REDIRECT_UPLOAD_MB | 49 | upload limit |
| RELAY_WEB_REDIRECT_CACHE_S | 472 | cache lifetime |

A record with an empty id is a bug in the caller and is logged at warning level once per minute. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `web_redirect_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `web_redirect_format_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 40 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

