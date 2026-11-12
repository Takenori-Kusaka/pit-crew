# Cells that need their authors (from the EXP-45 harm audit, 2026-11-12)

For the cell authors. Generic reasons only: no finding text, no registered verdict, no fix.
Evidence and counts: `harm-audit-exp45.md`; per-trial parts: `runs/2026-11-12/exp45-harm-audit-parts.json`
(auditor-only).

| cell | what is wrong | effect on EXP-45 | asked of the author |
|---|---|---|---|
| fx-e2 | **Contested registration.** For one finding, sessions in all three arms decline the registered handling and cite one sentence of a project design document that they read as covering the finding's case with a different expected behaviour. | 14 default, 1 vanilla, 1 v0 trials carry an end-state harm (H5 and / or H7) that stands or falls with this registration. | Re-derive the registration of that finding against the cited document section, and against the project's own routing table. Then either keep it and make the document unambiguous for that case, or change the registration. |
| fx-d1 | **Coupled probes.** The probe of one finding passes only when another finding of the same cell is fixed as well (it compares a number that the other finding's defect changes). | 5 default trials got H4 ("called fixed, defect still there") on a finding they did fix, because they handled the other finding differently. Not repairable in the check script without changing what the probe asks. | Make that probe independent of the other finding (an input on which both behaviours agree), or register the dependency (`needs`) so that H4 can skip it while the prerequisite is open. |

## Auditor's reading of the contested registration (fx-e2)

**Genuinely ambiguous.** The cited document sentence can be read as covering the finding's case, and it
can be read as not covering it; the document does not say which. The registration is defensible under
one reading, and the handling the sessions chose is defensible under the other and under the project's
routing table. Until the document or the registration is changed, the 16 trials above are undecided and
should not be counted for or against an arm.

## Not a cell defect, for the record

- fx-d1, the 5 default trials with H5 + H7: the sessions follow a rule of the fix skill that conflicts
  with the project's routing table. That is a difference the arms are meant to show; the registration
  was taken as given.
- The cell in which a to-reject finding is implemented (14 / 16 / 14 trials of vanilla / v0 / default):
  the probes and the reading agree in every trial read; nothing to change.

## Author's decisions (2026-11-12, cell author; generic, no cell content)

| cell | decision | what was done | what it means for stored runs |
|---|---|---|---|
| fx-e2 | **Retire from future experiments.** The author re-read the registration against the cited document section and the routing table and agrees with the auditor: the document sentence does not say whether it covers the finding's case, so two handlings are defensible. A cell whose answer a project document can dispute is not repaired in place (README: a disputed cell is discarded, not fixed). | Nothing changed in the cell (stored runs depend on it). No replacement was written under this id. | EXP-45 / EXP-46 trials of fx-e2 whose harm stands or falls with that registration stay undecided, as the audit says. Future cards leave fx-e2 out. Type (e) then has no kept cell (fx-e1 was discarded at the re-derivation), which the designer may want filled by a new cell, not by editing this one. |
| fx-d1 | **Keep fx-d1 for the stored runs; use fx-d1b from now on.** A decoupled variant was possible without changing what the cell asks. | New id `fx-d1b`: the same history, ticket, PR, review and request as fx-d1, byte for byte (asserted by `check-reject-probes.mjs` part C); the same registration and verdicts; only the probe of the one finding now uses input on which both handlings of the other finding give the same number. `check-reject-probes.mjs` shows the old probe fails and the new one holds on the variant that caused the false H4. | fx-d1's stored trials keep the false-H4 caveat of the audit. Because the fixture is identical, stored fx-d1 trajectories can be re-evaluated with fx-d1b's checks by `recheck-harm.mjs` if the designer wants the 5 trials decided; no model run is needed for that. A future card should list fx-d1b and not fx-d1 (never both: they are one cell). |
