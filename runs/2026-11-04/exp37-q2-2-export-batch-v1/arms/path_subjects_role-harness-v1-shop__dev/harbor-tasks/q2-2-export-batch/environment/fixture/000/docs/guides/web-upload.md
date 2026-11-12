# Upload (web)

Operator notes for the upload step of the web flow. The helpers live in `lib/web/upload.sh`; the test in `tests/web_upload_test.sh`.

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Modes other than the default are for replay and incident drills and must not be used in cron. Modes other than the default are for replay and incident drills and must not be used in cron.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_WEB_UPLOAD_TTL | 27 min | session lifetime |
| RELAY_WEB_UPLOAD_UPLOAD_MB | 38 | upload limit |
| RELAY_WEB_UPLOAD_CACHE_S | 885 | cache lifetime |

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Procedure

1. Run `web_upload_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `web_upload_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Known issues

- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- The checklist for the shift handover lives in docs/runbook.md and is not repeated here.
- Ids longer than 22 characters are truncated in the summary line (display only).

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Operators do not edit the helper files on the host; the host is redeployed from the repository.

