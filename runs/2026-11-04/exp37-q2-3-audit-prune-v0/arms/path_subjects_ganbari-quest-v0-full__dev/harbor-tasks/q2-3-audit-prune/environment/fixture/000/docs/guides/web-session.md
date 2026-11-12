# Session (web)

Operator notes for the session step of the web flow. The helpers live in `lib/web/session.sh`; the test in `tests/web_session_test.sh`.

Operators do not edit the helper files on the host; the host is redeployed from the repository. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_WEB_SESSION_TTL | 60 min | session lifetime |
| RELAY_WEB_SESSION_UPLOAD_MB | 38 | upload limit |
| RELAY_WEB_SESSION_CACHE_S | 600 | cache lifetime |

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Procedure

1. Run `web_session_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `web_session_check_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Known issues

- Modes other than the default are for replay and incident drills and must not be used in cron.
- The checklist for the shift handover lives in docs/runbook.md and is not repeated here.
- Ids longer than 19 characters are truncated in the summary line (display only).

Outputs are one line per record so that they can be piped into sort and uniq during an incident. Operators do not edit the helper files on the host; the host is redeployed from the repository.

