# Relay: overview (draft, 2025-10)

Status: draft. Decisions taken since live in docs/adr/.

Relay moves parcel events between depots, drivers and partners. Inbound: the partner feed (paged reads), scans from the depots. Outbound: webhooks to partners, a nightly batch export, notifications to customers. Records: a ledger of fees and refunds, an audit log of every outbound call.

## Modules

| area | modules |
|---|---|
| parcel | lib/parcel/*.sh |
| route | lib/route/*.sh |
| partner | lib/partner/*.sh, lib/export/*.sh, lib/delivery/*.sh |
| notify | lib/notify/*.sh |
| ledger | lib/ledger/*.sh |
| ops | lib/ops/*.sh, lib/prune/*.sh |
| store | lib/store/*.sh |
| web | lib/web/*.sh |

