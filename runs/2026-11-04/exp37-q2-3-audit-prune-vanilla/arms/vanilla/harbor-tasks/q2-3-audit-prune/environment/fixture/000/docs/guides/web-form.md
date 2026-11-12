# Form (web)

Operator notes for the form step of the web flow. The helpers live in `lib/web/form.sh`; the test in `tests/web_form_test.sh`.

Operators do not edit the helper files on the host; the host is redeployed from the repository. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_WEB_FORM_TTL | 118 min | session lifetime |
| RELAY_WEB_FORM_UPLOAD_MB | 58 | upload limit |
| RELAY_WEB_FORM_CACHE_S | 147 | cache lifetime |

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `web_form_normalize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `web_form_summarize_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Known issues

- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- Ids longer than 22 characters are truncated in the summary line (display only).

Operators do not edit the helper files on the host; the host is redeployed from the repository. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

