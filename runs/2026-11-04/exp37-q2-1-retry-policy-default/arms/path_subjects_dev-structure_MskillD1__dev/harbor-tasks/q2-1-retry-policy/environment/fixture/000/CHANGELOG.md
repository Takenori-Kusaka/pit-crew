# Changelog

All user-visible changes, newest first (ADR-0022). Renames and removals of settings and paths get their own bullet.

## 3.4.1 - 2026-04-20

- ops: handoff checklist printed at shift end (#213)
- notify: quiet hours 22:00-07:00 (ADR-0013) (#206)
- notify: opt-out honoured for push too (#257)

## 3.4.0 - 2026-04-02

- fix: typo in the usage line (#352)
- web: cache lifetime configurable (#131)
- notify: templates validated at load (#106)

## 3.3.2 - 2026-03-16

- store: index rebuilt after restore (#254)
- partner: SLA report groups by partner (#453)
- locker: 8-digit codes (ADR-0014) (#209)
- ops: handoff checklist printed at shift end (#220)

## 3.3.1 - 2026-02-26

- fix: exit code on missing id (#382)
- ops: handoff checklist printed at shift end (#245)
- web: CSRF tokens on operator forms (ADR-0020) (#259)

## 3.3.0 - 2026-02-17

- ops: shift logs rotate daily under `var/log/shift`; retention stays 30 days (ADR-0016).
- route: stops per route limited by RELAY_ROUTE_STOP_LIMIT (#197)
- manifest: sort by stop before printing (#476)
- store: keep 6 snapshots (#355)

## 3.2.1 - 2026-02-04

- locker: 8-digit codes (ADR-0014) (#226)
- invoice: totals in cents (ADR-0008) (#315)

## 3.2.0 - 2026-01-15

- paths: the `var/log/audit` symlink is removed.
- ops: checklist items can be skipped with a reason (#333)
- store: compaction above 256 MB (ADR-0018) (#273)
- store: compaction above 256 MB (ADR-0018) (#440)
- ledger: reconcile reports mismatches per partner (#446)

## 3.1.0 - 2025-12-26

- scan: late scans within the window are accepted (#111)
- route: zone codes follow ADR-0010 (#470)
- ledger: entries carry the partner id (#157)

## 3.0.1 - 2025-12-15

- ledger: statement includes fees (#387)
- web: redirect allow-list (#105)

## 3.0.0 - 2025-11-26

- paths: audit logs move from `var/log/audit` to `var/audit`; the host now rotates everything under `var/log`, which would have truncated them. A symlink keeps the old path readable.
- store: index rebuilt after restore (#357)
- route: stops per route limited by RELAY_ROUTE_STOP_LIMIT (#334)
- fix: typo in the usage line (#231)

## 2.9.0 - 2025-11-08

- fix: summary line for empty records (#343)
- store: index rebuilt after restore (#467)
- contract: period end is inclusive (#292)
- ledger: reconcile reports mismatches per partner (#116)

## 2.8.1 - 2025-10-24

- notify: templates validated at load (#179)
- invoice: totals in cents (ADR-0008) (#109)

## 2.8.0 - 2025-10-10

- handover: driver id is required (#313)
- label: reprint keeps the original zone code (#346)
- route: stops per route limited by RELAY_ROUTE_STOP_LIMIT (#275)
- web: session lifetime in minutes (#110)

## 2.7.0 - 2025-09-20

- window: minutes instead of seconds in the summary (#241)
- ledger: statement includes fees (#363)

## 2.6.2 - 2025-09-04

- ops: incident ids are RLY-<n> (#224)
- partner: mapping file validated on load (#368)
- ops: incident severity S1-S3 (ADR-0017) (#383)
- web: upload limit in MB (#158)

## 2.6.1 - 2025-08-17

- fix: mode validation message (#324)
- notify: templates validated at load (#131)

## 2.6.0 - 2025-08-02

- partner: `RELAY_PARTNER_FEED_PAGE` replaces `RELAY_FEED_PAGE` (ADR-0021); old name read until 2.7.
- ops: handoff checklist printed at shift end (#293)
- route: stops per route limited by RELAY_ROUTE_STOP_LIMIT (#381)

## 2.5.0 - 2025-07-14

- fix: trailing newline in csv rows (#113)
- route: zone codes follow ADR-0010 (#451)
- driver: roster lookup by week (#331)
- locker: 8-digit codes (ADR-0014) (#188)

## 2.4.1 - 2025-06-23

- store: keep 6 snapshots (#250)
- store: restore verifies the snapshot first (#350)
- partner: feed paging follows the next-page token (#281)

## 2.4.0 - 2025-06-05

- export: `X-Partner-Token` dropped; the partner answers 401 to requests that still carry it.
- fix: trailing newline in csv rows (#231)
- web: session lifetime in minutes (#418)
- ledger: statement includes fees (#230)
- web: session lifetime in minutes (#344)

## 2.3.0 - 2025-05-22

- export: the partner's auth header is `X-Relay-Key` (keyed auth); `X-Partner-Token` is sent alongside until the partner removes it.
- ops: incident ids are RLY-<n> (#400)
- notify: opt-out honoured for push too (#103)

## 2.2.0 - 2025-05-07

- web: form errors list every field (#408)
- scan: late scans within the window are accepted (#362)
- fix: mode validation message (#329)
- partner: mapping file validated on load (#170)

## 2.1.1 - 2025-04-16

- store: compaction above 256 MB (ADR-0018) (#127)
- weight: reject negative weights with exit 2 (#404)

## 2.1.0 - 2025-04-03

- locker: 8-digit codes (ADR-0014) (#273)
- route: stops per route limited by RELAY_ROUTE_STOP_LIMIT (#172)

## 2.0.0 - 2025-03-22

- notify: `RELAY_SMS_RETRIES` and `RELAY_SMS_WAIT` replace the hard-coded resend policy (ADR-0019).
- notify: bounce handling marks the address (#333)
- fix: exit code on missing id (#306)
- fix: typo in the usage line (#203)

## 1.9.0 - 2025-03-07

- deliver: `RELAY_RETRY_MAX` is no longer read.
- partner: feed paging follows the next-page token (#475)
- driver: roster lookup by week (#251)

## 1.8.1 - 2025-02-21

- vehicle: capacity in kg (#206)
- web: redirect allow-list (#221)
- store: integrity check every 24 h (#351)
- web: form errors list every field (#161)

## 1.8.0 - 2025-02-12

- deliver: the retry count is read from `RELAY_ATTEMPTS`; `RELAY_RETRY_MAX` is renamed following ADR-0021 and is still read as a fallback until 1.9.
- ops: handoff checklist printed at shift end (#250)
- route: zone codes follow ADR-0010 (#192)

## 1.7.0 - 2025-01-24

- web: upload limit in MB (#363)
- fix: summary line for empty records (#480)

## 1.6.0 - 2025-01-07

- notify: bounce handling marks the address (#257)
- fix: trailing newline in csv rows (#148)
- web: CSRF tokens on operator forms (ADR-0020) (#160)
- store: index rebuilt after restore (#313)

## 1.5.2 - 2024-12-23

- fix: summary line for empty records (#397)
- driver: roster lookup by week (#194)
- web: cache lifetime configurable (#479)

## 1.5.1 - 2024-12-14

- ops: handoff checklist printed at shift end (#212)
- ledger: statement includes fees (#456)
- manifest: sort by stop before printing (#201)
- ledger: entries carry the partner id (#324)

## 1.5.0 - 2024-12-02

- web: form errors list every field (#400)
- scan: late scans within the window are accepted (#129)

## 1.4.0 - 2024-11-21

- ops: incident ids are RLY-<n> (#197)
- ops: incident severity S1-S3 (ADR-0017) (#235)
- store: archive names carry the date (#215)
- store: index rebuilt after restore (#236)

## 1.3.0 - 2024-11-08

- ops: handoff checklist printed at shift end (#229)
- depot: list depots from config/depots.txt (#362)

## 1.2.0 - 2024-10-18

- vehicle: capacity in kg (#336)
- manifest: sort by stop before printing (#455)
- notify: bounce handling marks the address (#369)
- notify: digest once per day (#281)

## 1.1.0 - 2024-10-04

- sms: park after the last resend (#274)
- fix: typo in the usage line (#360)

## 1.0.0 - 2024-09-22

- web: CSRF tokens on operator forms (ADR-0020) (#188)
- ops: incident severity S1-S3 (ADR-0017) (#132)
- fix: mode validation message (#189)
- web: form errors list every field (#288)

