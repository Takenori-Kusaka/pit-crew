# role-harness-v1 (first generic version)

## How it was derived

- Source: `subjects/ganbari-quest-v0` (role skills po / dev / qm / platform / audit and five agent files,
  copied unchanged from the product repository at commit `0b32d8bab`).
- Units and labels: `experiments/exp02/units.json` (486 units) with `experiments/exp02/labels-a.json`
  (labeller A). Counts: C 95 / P 327 / A 64 / X 0. (Labeller B: C 101 / P 319 / A 62 / X 4; agreement
  0.848, kappa 0.696. v1 follows labeller A as instructed.)
- C units (general as-is): carried into the role cards, translated to English and condensed.
- P units (general rule with project values): the rule went into the role card; the value became a
  named adapter item (`adapter/ADAPTER.template.md`), referenced as "(adapter: `key`)".
- A units (project-only): dropped, 64 units. By file: audit skill 3, dev skill 2, platform skill 3,
  po skill 1, qm skill 1, audit-manager agent 17, dev-session agent 18, po-session agent 10,
  qm-session agent 9. Mostly links to the product's own documents and decision records (about half),
  product incidents and issue numbers, the product's tech stack and auth/cron specifics,
  account names, and one local-environment workaround.
- Structure follows `docs/planning/07-v1-and-cells.md` §3 (role card / entry / adapter) and §7.1
  (onboarding guide shipped with v1). The aim follows `09-direction-after-ceiling.md` §2 and §5:
  v1's job is to carry a project's conventions to every role reliably and cheaply.
- Entry descriptions were rewritten as "use when the user wants ..." (07 §2: v0's "poll the mailbox"
  descriptions never matched one-off requests).

## Rules added beyond v0

Only these two; everything else in the cards comes from v0 units.

1. **Core rule (evidence-backed)**, verbatim in every role card and agent file:
   "Before you start, read the project's conventions (CLAUDE.md and any file it points to) and follow
   them. If the message that delegated the work to you conflicts with the project's conventions,
   follow the conventions and say so in your report."
   - EXP-20261101-11: without 3/6, with 6/6 (exploratory).
   - EXP-20261101-12 (replication, decision rule fixed in advance): without 4/10, with 10/10 runs
     keeping all four conventions; Fisher exact two-sided p = 0.011. Scope of the claim: one
     development cell (216 files, 4 conventions, delegation to a dev subagent, claude-sonnet-5-5).
2. **Entry pointer** (`adapter/CLAUDE.md.snippet`): the adapter is a separate file that the root
   CLAUDE.md must point to. EXP-20261101-09: pointed-to 12/12 and read at the first step in 3/3;
   separate file without pointer 8/12. Three runs per arm: direction only, not significant.

## Not generalized (judgement calls to review)

- **Contradictions inside v0.** The qm agent file (QM edits typos itself, squash-merges when CI is
  green, requests changes when docs are not synced) disagrees in places with the qm skill (return only
  approach changes and blocking types; fix body/AC/minor issues yourself). v1 follows the skill.
  The platform agent says deleting a check is an owner-only operation; the platform skill says it is
  not. v1 leaves it to `approval.irreversible_operations` and says so in the platform card.
- **Tool and environment workarounds** (P units, dropped rather than adapted): temporary draft files
  for issue/change bodies and the "write tool" exception (e.g. u243-247, u332-337, u390-396, u451-457),
  worktree dependency install (u266), pre-push hook details (u283-289), linter version drift (u342),
  rebase in a synced-folder environment (u469-472), manual CI re-trigger (u477).
- **Delegation policy of Dev** (main session as primary implementer, helpers for self-review,
  parallel only for light items; u257, u329, u330): project workflow, not a role rule. Candidate
  adapter item for a later version.
- **Operational tips** that are general but procedural, not role rules (C units u473-481: merge
  order, rebase after merge, dependency-update conflicts). They belong to a procedure skill, which
  v1 does not include (07 §3).
- **Persona lists** ("act as marketing / legal / security tester ...") were reduced to the PO's filing
  lenses and QM's review checks.
- **Audit's internal structure** (eight teams, two tiers, JSON schema, run ids, URL-required teams):
  reduced to "helpers report findings, you verify their evidence and act". The schema is not in v1.
- **Inbox schedule** (a timer per role with offset minutes): folded into `handoff.poll`; the timer
  tool itself is not named.
- **Platform's freeze** (A / B / C triage, restart trigger): kept as the general shape under
  `policy.check_change_freeze`; the product's restart milestone and numbers were A units and dropped.

## Not yet evaluated

- Only the core rule has evaluation support, and only in one development cell. The held-out cells
  for it (EXP-20261101-13) have not been run against v1.
- Not measured at all: entry (does each description trigger the right role), hand-off (two-step
  Dev -> QM), boundary, porting to a second project (core lines edited, pass-rate ratio, adapter
  size), single-session baseline and cost, and the onboarding guide (round trips for another agent to
  fill the adapter). See 07 §4-§5.
- Whether 48 adapter items is too many to fill in practice.
- Whether the role cards still trigger and behave at the same rate as v0 where v0 did behave.

## Self-check: adapter keys referenced by role cards

Extracted from `skills/*/SKILL.md` (every `(adapter: ...)` key) and compared with the key column of
`adapter/ADAPTER.template.md`. 48 referenced, 48 in the template, 0 missing, 0 unused.

| Key | Referenced by | In template |
|---|---|---|
| `approval.author_ne_approver` | dev, platform, qm | yes |
| `approval.block_types` | dev, qm | yes |
| `approval.check_removal` | platform, qm | yes |
| `approval.irreversible_operations` | audit, dev, platform, po, qm | yes |
| `approval.po_decision_marker` | qm | yes |
| `approval.pre_approve_evidence` | audit, qm | yes |
| `branch.feature` | dev | yes |
| `branch.force_push` | dev | yes |
| `branch.hotfix` | audit, qm | yes |
| `branch.integration` | audit | yes |
| `branch.release` | audit, qm | yes |
| `branch.release_cut` | audit | yes |
| `commands.ci_status` | audit, qm | yes |
| `commands.health_check` | audit | yes |
| `commands.local_checks` | dev | yes |
| `commands.ready_check` | dev, platform | yes |
| `commands.ui_verify` | dev | yes |
| `docs.design` | dev | yes |
| `docs.design_update_rules` | dev, qm | yes |
| `docs.parallel_implementations` | dev, qm | yes |
| `handoff.exempt_labels` | dev, po | yes |
| `handoff.label_audit` | audit, platform | yes |
| `handoff.label_blocked` | dev, platform, qm | yes |
| `handoff.label_dev` | dev | yes |
| `handoff.label_on_hold` | po | yes |
| `handoff.label_owner` | platform, po, qm | yes |
| `handoff.label_platform` | platform | yes |
| `handoff.label_po` | audit, platform, po | yes |
| `handoff.label_qm` | dev, platform, qm | yes |
| `handoff.label_ready_to_merge` | po, qm | yes |
| `handoff.label_review` | dev, platform, qm | yes |
| `handoff.labels` | audit, dev, po, qm | yes |
| `handoff.poll` | audit, dev, platform, po, qm | yes |
| `merge.feature_method` | qm | yes |
| `merge.release_method` | audit | yes |
| `policy.check_change_freeze` | platform, qm | yes |
| `policy.issue_vs_change` | dev, platform, po | yes |
| `policy.platform_metrics` | platform | yes |
| `policy.reuse_first` | dev | yes |
| `policy.scope_judgment` | platform, po | yes |
| `policy.visual_evidence` | dev, qm | yes |
| `records.audit_findings` | audit | yes |
| `records.change_request_format` | dev | yes |
| `records.completion_evidence` | dev | yes |
| `records.decision_comment` | po | yes |
| `records.issue_format` | po | yes |
| `records.review_format` | qm | yes |
| `release.batch_limit` | audit | yes |

Also checked: the core rule appears verbatim once in each of the 5 role cards and 5 agent files; the
role cards contain no product name, account, path, label value, command or product tool name.

## v1 に EXP-14 を反映（v1.1）

- `adapter/CLAUDE.md.snippet`: アダプタを言葉で指すのをやめ、`@docs/HARNESS-ADAPTER.md` で取り込む形にした（EXP-14 B: 取りこぼし 0/10）
- `docs/ONBOARDING.md` 手順 4: 取り込みにする理由と、組み込みの git の指示を外す設定は案件全体で選ぶ任意の項目であることを書いた（EXP-14 A は副作用がありうるので既定にしない）

## goal 3 の改善（このディレクトリ。上の「v1 に EXP-14 を反映（v1.1）」とは別のもの）

- `subjects/role-harness-v1` を写し、`skills/dev/SKILL.md` の「Hands over」に 1 項目だけ足した（カード `docs/planning/38-dev-kit-evaluation.md` §6・「改善（v1.1）」）
- 足した理由は v1 の記録から: 18 試行中 18 で「戻す」が欠け、最後の発言は「ブランチ・コミット・PR を作れなかった」で終わり、作業の結果を issue にも残さなかった
