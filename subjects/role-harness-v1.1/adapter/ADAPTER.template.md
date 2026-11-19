# Harness adapter (role-harness v1)

Copy this file into the project (for example `docs/HARNESS-ADAPTER.md`), fill the **Value** column,
and point to it from the root CLAUDE.md (see `CLAUDE.md.snippet`). The role cards refer to these keys
by name and are never edited per project.

- Fill every row. If the project has no such thing, write `none` and one line on what happens instead.
  An empty row reads as "not decided", and the role will guess.
- Values may be links to the project's own documents. Prefer a link over a copy.
- Examples are illustrations only; they are not defaults.

## 1. Hand-off labels and inbox

| Key | Meaning | Example | Value |
|---|---|---|---|
| `handoff.labels` | The full set of inbox labels, which role reads each, and the rule that an item carries exactly one | `state:needs-po`, `state:needs-dev`, ... (one per item) | |
| `handoff.label_po` | Inbox of the PO: product direction or backlog order is needed | `state:needs-po` | |
| `handoff.label_dev` | Inbox of Dev: ready to start or continue implementation | `state:needs-dev` | |
| `handoff.label_qm` | Inbox of QM for a consult (opinion, question, early look); not a finished change | `state:needs-qm` | |
| `handoff.label_review` | Change is complete, CI green and ready; QM reviews it | `state:dev-done` | |
| `handoff.label_blocked` | QM blocked the change; back to its author | `state:qm-blocked` | |
| `handoff.label_ready_to_merge` | QM approved; merge pending | `state:ready-to-merge` | |
| `handoff.label_platform` | Inbox of Platform | `state:needs-platform` | |
| `handoff.label_audit` | Inbox of Audit (release cut request, or a question) | `state:needs-audit` | |
| `handoff.label_owner` | Needs the owner: an irreversible operation | `state:needs-owner` | |
| `handoff.label_on_hold` | Not in the ordered backlog; set and removed by the PO | `status:on-hold` | |
| `handoff.exempt_labels` | Labels that exempt an open item from orphan detection | `status:on-hold`, `epic` | |
| `handoff.poll` | How each role lists its inbox (issues AND change requests), and the schedule per role | `gh issue list --label <l>` + `gh pr list --label <l>`; hourly, minute offset per role | |

## 2. Documents and SSOT locations

| Key | Meaning | Example | Value |
|---|---|---|---|
| `docs.design` | Where design documents live and which to read first | `docs/design/`, `docs/DESIGN.md` | |
| `docs.design_update_rules` | Which kind of change must update which design document in the same change | table in `docs/CLAUDE.md` | |
| `docs.parallel_implementations` | List of places that must change together | `docs/design/parallel-implementations.md` | |

## 3. Build, test and verify commands

| Key | Meaning | Example | Value |
|---|---|---|---|
| `commands.local_checks` | Lint, type check and tests to run locally before pushing | `npm run lint && npm test` | |
| `commands.ready_check` | The check that must pass before a change is marked ready | `npm run pre-ready -- --pr <N>` | |
| `commands.ci_status` | How to read CI per check name (latest run wins, zero checks = not run) and the final merge state | a `gh pr view --json statusCheckRollup` query, then `mergeStateStatus == CLEAN` | |
| `commands.ui_verify` | How to see a UI change running, including variants that need a special mode (auth, roles) | `npm run dev`; auth screens: `npm run dev:auth` | |
| `commands.health_check` | Post-deploy health checks, one per deployment target | `curl -f https://<host>/health` for each target | |

## 4. Branching, merge and release

| Key | Meaning | Example | Value |
|---|---|---|---|
| `branch.feature` | Where feature branches start and which branch they target | from `develop`, into `develop` | |
| `branch.integration` | The line where approved changes accumulate | `develop` | |
| `branch.release` | The line customers get; who may merge into it | `main`; only via integration change (Audit) or hotfix | |
| `branch.release_cut` | How a release is cut and named | freeze a commit, `release/<YYYY-MM-DD>`, open `release/*` -> `main` | |
| `branch.hotfix` | When a direct fix to the release line is allowed, and the back-merge that must follow | emergencies only; back-merge `main` -> `develop` after merge | |
| `branch.force_push` | Whether and how shared history may be rewritten | `--force-with-lease` only; never plain force | |
| `merge.feature_method` | Merge method for per-change merges | squash | |
| `merge.release_method` | Merge method for the integration change | merge commit (no squash) | |
| `release.batch_limit` | Size of the unreleased batch at which Audit proposes a cut | 50 commits | |

## 5. Approval rules

| Key | Meaning | Example | Value |
|---|---|---|---|
| `approval.irreversible_operations` | Operations only the owner may approve | production data deletion, production deploy, billing writes, schema change | |
| `approval.author_ne_approver` | How "author is never approver" is enforced (accounts, who approves whose changes) | changes authored by account A are approved by account B; no admin bypass | |
| `approval.block_types` | The only reasons QM may block | real customer harm; weakened evidence authenticity; irreversible | |
| `approval.check_removal` | Who approves removing or downgrading a check | PO | |
| `approval.po_decision_marker` | Marker on changes that need a PO decision, and where the PO's condition is written | label `po-decision:required`; condition on the item, answer in the change body | |
| `approval.pre_approve_evidence` | Evidence that must exist right before approval, its location and lifetime | adversarial review JSON in `tmp/`, valid 30 min, verified by a script | |

## 6. Record formats

| Key | Meaning | Example | Value |
|---|---|---|---|
| `records.issue_format` | Work item title and body format | `[PRIORITY] type: summary`; background / root cause / solution / AC / impact | |
| `records.change_request_format` | Required sections of a change request, incl. how acceptance criteria are verified | template file; AC map `AC / content / method / evidence` | |
| `records.review_format` | Required content of a review | one line per AC, one observation per screenshot | |
| `records.decision_comment` | Where and how a PO decision is recorded | comment on the item: decision, condition, date | |
| `records.completion_evidence` | How a completion claim shows its evidence | table: item / exact command / output count / verdict | |
| `records.audit_findings` | Where Audit writes findings | comments on the integration change | |

## 7. Policies

| Key | Meaning | Example | Value |
|---|---|---|---|
| `policy.issue_vs_change` | What becomes a work item and what goes straight to a change request | items: customer value, owner decisions; direct change: tooling, process, docs, review findings | |
| `policy.scope_judgment` | The lens for "is this right for the product's stage" | `docs/decisions/<scope-adr>.md` | |
| `policy.reuse_first` | When to look at existing libraries or patterns before writing new code, and where to record the comparison | new code > 10 lines: compare 2 candidates in the item | |
| `policy.visual_evidence` | Which changes need screenshots, and how they are attached | changes to UI files: before/after images in the change body | |
| `policy.check_change_freeze` | Whether adding or improving checks is frozen, what is allowed (remove / move to release review / keep), and when it ends | frozen until <milestone>; remove or move only | |
| `policy.platform_metrics` | How Dev rework is measured for Platform | QM returns per week; readiness-check failures; review round trips | |
