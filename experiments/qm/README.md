# QM cells — procedure

Cells for the QM role (one change's independent review, `qm-review`; the ship verdict, `qm-ship`),
for deliverables 1.0 / 1.1 / 1.4 of `docs/planning/00-goal-charter.md`. Plan: `docs/planning/27-qm-role-evaluation-plan.md`
(§3 lists the cell TYPES and their numbers; the cells themselves are written by an author agent and
re-derived by a second agent). Grader: `packages/pit-wall/src/graders/process/review-phases.mjs`
(B-1 … B-13, B-15; the cut is the first judgement; what was judged is read from the gh stand-in's
effects, when from the trajectory).

## Who may read what

- The **harness designer** (the person or agent who writes the QM skills) reads this file, the plan's
  §3 type table and the counts of kept / discarded cells. It must not read `cells*.mjs`, the fixtures'
  planted defects, `effects*.sh`, `verdicts.json` or `suites/qm/suite.yaml`.
- The **author agent** reads the subject (example/roombook, `experiments/subject2/cells.mjs` for the
  project, its adapter and docs) and this file. It must not read `docs/planning/26-qm-role-design.md`,
  `docs/research/research-qm-review-role.md` §2–§4, or any `subjects/*/skills/qm*`: the correct answer of
  a cell is derived from the **project's own documents** (design docs, the decision-rights table, the
  required checks, the acceptance criteria) and the state, never from the harness. If the author needs a
  rule the project does not state, it adds the rule to the project's documents (as an adapter value),
  not to the task text.
- The **re-derivation agent** gets a cell's fixture and task text only (no author notes, no expected
  answer) and writes its own verdict (pass / block / route, and why). A cell is kept when the two
  agree; a cell they disagree on is **discarded, not fixed** (`05-shortcut-resistance.md` §4.2).

## What a review cell contains (one cell, one item)

Each cell plants exactly one thing to be found or decided (owner decision 2026-11-04: one item per
cell). Half the cells are PRs that should pass. The task text is the review request as a real inbox
would carry it ("PR #12 をレビューしてください" with the lane), and **never contains the answer**
("設計書を読んで", "PO に聞いて" are not written).

| part | where | notes |
|---|---|---|
| the repository at the PR's base | fixture history (`experiments/subject2/cells.mjs` `base()`) | the project, its `docs/design/*.md`, `docs/decisions/*`, `.claude/qm-adapter.md` |
| the PR's head | a branch in the fixture history (`refs/heads/<topic>`), so `git diff base...head` and `gh pr diff` agree | the planted defect / the correct change lives here |
| the ticket | `.github-cache/issue-N.md` (acceptance criteria, history) | `gh issue view N` answers with it |
| the PR | `.github-cache/pr-N.md` (body: the author's claims) and `pr-N.json` (`author.login`, `isDraft`, `statusCheckRollup`, `reviews`) | `gh pr view N [--json]` answers with them |
| the diff | `.github-cache/diff-N.patch` (identical to `git diff base...head`) | `gh pr diff N` answers with it |
| the checks | `.github-cache/checks-N.txt` | `gh pr checks N`; a required check `skipping` / missing / an old generation is the (e) type |
| a question | a comment in `pr-N.md`'s thread ("この文言で出してよいですか" …) | the (d) type; the project's decision-rights table names who decides |
| the adapter | `.claude/qm-adapter.md` in the fixture | lanes and required checks, the path → design-doc table, severity table, `verdict`, labels, the decision-rights table, who approves irreversible operations |

Registration for the grader (`process-spec.json`, read by `--spec`): `{ "<cell>": { "role": "review",
"pr", "issue", "specDocs", "changedFiles", "judgementLabels", "passLabels", "escalationLabels",
"decisionWords", "author", "checksBad", "question" } }`; ship cells add `"releasePrs"`. The expected
verdict (pass / block / route) and the harm predicates (missed defect, over-block, answered a question,
passed a false claim, approved on skipped checks) go in `verdicts.json`, written by the author and
confirmed by the re-derivation before any arm runs.

## Provenance of a cell (borrowed from NeMo Eval Author; owner 2026-11-11)

Each cell records where it came from and where its truth comes from, so a reader can tell a cell
built from a real incident from a synthetic one, and can see which candidates were considered and
dropped (`docs/research/research-nemoclaw-adoption.md` §6 (a); eval-author's `candidate` /
`no_candidate` and "an agent answer is not ground truth merely because the trace succeeded").
Optional for cells made before 2026-11-11 (`pit-wall lint` warns); required for new cells. In the
cell (`provenance:` next to `params`) and, for dropped candidates, in `experiments/<role>/candidates.json`:

| field | values | meaning |
|---|---|---|
| `source` | `incident` / `trace` / `synthetic` | what the cell was built from: a catalogued incident (`research-ganbari-incidents.md` I-nn), a real session trajectory, or an invented situation |
| `ref` | `I-14`, `runs/<...>/trajectory.json#step-23`, `design 26 §4.V3` … | the pointer a reader can open |
| `candidate` | `yes` / `no` | whether it became a cell |
| `reason` (when `no`) | `not-reproducible` / `needs-multi-step` / `truth-unknown` / `duplicate-type` / `answer-in-task-text` / `too-easy` / `out-of-scope` | why not (one code; prose goes in the notes) |
| `truth` | `reference-script` / `design-doc` / `owner-decision` / `derived-by-rederivation` | where the expected verdict / harm predicate comes from. **Never `agent-answer`**: what an agent did in a trace is evidence of a type, not the truth of the cell |

Already in place and kept as they are (same ideas, other names): the answer-leak lint
(`pit-wall lint`, eval-author's `copyable_literal`), the scripted controls as acceptance before any
model (`script:null` must fail, `script:reference` must pass, each harmful script must trip its
predicate), and the check-level `name<TAB>code` lines of `checksScript`.

## Scripted controls (run before any model; both directions)

`script:null` (does nothing), `script:reference` (reads ticket → design docs → every changed file →
checks, switches account, judges correctly, writes the record fields), `script:lgtm` (approves without
reading), `script:answers` (reads, then answers the out-of-authority question and approves),
`script:skip-approve` (reads the skipped check and approves), `script:always-block` (requests changes
on everything), `script:ungrounded` (ten findings with no `path:line`), `script:delegate` (hands the
approval to a subagent prompt and stops). Expected B / harm per control: plan 27 §4. A grader whose
output on these does not match the table is fixed before the cells are used.

## Arms (plan 27 §1 stage 2)

`vanilla` (the adapter only) / `subjects/ganbari-quest-v0-full` (GQ copied whole, deviations kept) /
`subjects/role-harness-v1-shop` (v1: `qm` for review, `audit` for ship) / the default QM skills (two
skills + shared principles, built from design 26 after the owner's approval).

## Secrets and names

No company information, no customer data, no real account names. People in the fixtures are
`you` (the PR author, the default account), `qm-bot` (the reviewer's account), `po-lead`, `arch-lead`,
`ops-owner` (as in subject 2).
