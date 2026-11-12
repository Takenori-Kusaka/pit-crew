# Cache (web)

Operator notes for the cache step of the web flow. The helpers live in `lib/web/cache.sh`; the test in `tests/web_cache_test.sh`.

Operators do not edit the helper files on the host; the host is redeployed from the repository. Operators do not edit the helper files on the host; the host is redeployed from the repository. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_WEB_CACHE_TTL | 36 min | session lifetime |
| RELAY_WEB_CACHE_UPLOAD_MB | 48 | upload limit |
| RELAY_WEB_CACHE_CACHE_S | 442 | cache lifetime |

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `web_cache_list_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `web_cache_tag_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Known issues

- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- Ids longer than 39 characters are truncated in the summary line (display only).

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

