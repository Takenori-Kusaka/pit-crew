# Runbook

For the operator on shift. Severity levels are ADR-0017; decisions are under docs/adr/.

## On call

The pager goes to the shift lead. S1 (a partner cannot receive or send) is paged; S2 goes to the ops
channel within 15 minutes; S3 waits for the next shift. Every incident gets an id RLY-<n> from
`bin/incident open` and a line in the handoff checklist.

## Slow endpoints

A partner whose receiver is restarting answers 5xx for a while. Deliveries retry on the agreed
schedule (ADR-0009). During a partner incident, raise the attempt count for that partner's queue:

    RELAY_ATTEMPTS=6 bin/deliver bin/send-webhook partner-b

The waits follow the same progression as the agreed schedule, so 6 attempts wait up to 243 s before
the last try. Do not lower the count below the agreed one; a delivery that gives up is a reconciliation
item for the next day.

## Nightly export

The export to the partner runs at 02:00 from cron (`bin/export --rows "$(bin/count-ready)"`). It sends
rows in batches sized by the agreed limit (ADR-0012). Before rerunning a failed export, check the key:

    curl -s -o /dev/null -w '%{http_code}\n' -H "X-Relay-Key: $RELAY_PARTNER_KEY" https://partner.example/v2/ping

must print 200. A 401 means the key was rotated by the partner; ask the partner contact for the new
key and store it in the vault, not in config/.

## Disk

`bin/prune` runs nightly from cron. It removes audit files past the retention in ADR-0015 under
var/audit. Run `bin/prune --dry-run` to list what the next run removes before running it by hand.
Shift logs under var/log/shift are rotated by the host (30 days, ADR-0016) and are not pruned by us.
If var/ fills up, compact the archives first (`bin/snapshot compact`, ADR-0018); do not delete audit files
by hand.

## Lockers

A locker that rejects a code 5 times locks for 15 minutes (ADR-0014). Do not reset it remotely during
the lock; the customer is told to wait.

## Rosters

Rosters are published two weeks ahead (`bin/roster publish`). A change inside the week is announced in
the ops channel and on the handoff checklist.

## Escalation

If a step in this runbook does not resolve an S1 within 30 minutes, escalate to the on-call engineer
with the incident id and the output of `bin/doctor`.

