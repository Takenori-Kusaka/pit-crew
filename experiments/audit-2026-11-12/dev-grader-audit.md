# Dev process grader audit (2026-11-12)

Auditor: independent teammate (read cells, fixtures, stored runs; no model runs, no Harbor runs, no docker replay, graders/specs/runs untouched). Scripts: this directory (`items.mjs`, `sensitivity.mjs`, `mech.mjs`, `obs.mjs`, `targets.mjs`, `residual.mjs`, `searched.mjs`, `claims.mjs`, `opened.mjs`, `eseries.mjs`, `jobsel-t0.mjs`, `jobsel-who.mjs`, `harm29.mjs`, `py3.mjs`, `flips.mjs`, `sample.mjs`; `phases-tolerant.mjs` is an audit-only variant of the grader, not a replacement). This report gives counts, item ids, experiment ids and mechanisms only; no cell answers.

Question: do the Dev-role claims rest on the form bias found in the fix grader (the grader reads "what the agent did" from the wording/format of the agent's own text, so the arm whose skill prescribes the format is read correctly and prose arms are read as non-compliant)?

Short answer: **No, not in that form.** The Dev B series reads tool calls and their order; only 1 of 11 B items reads the agent's prose, and that item misreads **against** the default arm. Two smaller reading errors exist and partly cancel. One published comparison (held-out, default vs v1) is fragile; the rest keep their sign under every variant tried.

## (a) Claims

| # | Claim (source) | Card | Runs | Arms | Measure | Analysis |
|---|---|---|---|---|---|---|
| C1 | Default raises B share over vanilla / v0 / v1 on dev cells (charter 11-04; 24 §1, §7; 25 §3) | EXP-32 | `runs/2026-11-04/exp32-dev-*` | vanilla, v0, v1, default | B share, 10 items (incl. 2 base items) | `experiments/structure/analyze-exp32.mjs` |
| C2 | Same on held-out cells, vs v0 and v1 (EXP-32), vs vanilla (EXP-33 fill) | EXP-32, EXP-33 | `exp32-heldout-*` (the vanilla dir of one cell was refilled by EXP-33) | same | B share, 8 items | same |
| C3 | Same on D3 cells | EXP-32 | `exp32-d3-*` | same | B share, 8 items | same |
| C4 | v5b is non-inferior to default on B (design 11 v5 adopted) | EXP-36 | `exp36-*` | default, v5b | pooled B share | `analyze-exp36.mjs` |
| C5 | Default makes fewer job-selection errors than v0 / v1; vs vanilla NOT SHOWN | EXP-34 | `exp34-js-*` | vanilla, v0, v1, default, v5 | end-state judge `experiments/jobsel/judge.mjs` | `analyze-exp34.mjs` |
| C6 | Default reduces harm on the two reproduced dev cells (auxiliary) | EXP-29 | `runs/2026-11-03/exp29-R-*` | same 4 | `experiments/structure/incident-harm.mjs` | `analyze-exp29.mjs` |
| C7 | Secondary: "failure observed before the fix" 0–36% (no harness) vs 95–100% (default) | EXP-32 | as C1–C3 | same | fact `failureObserved` | same |
| C8 | Secondary: steps the default does not lift (`research.searched`, `eval.no-stale-claim`, `research.opened-changed`) | EXP-32 | as C1–C3 | default | per-item missing counts | same |
| C9 | Secondary: E share default 0.82–1.00 vs others 0.33–0.56 | EXP-32 | as C1–C3 | same | E items (statements) | same |
| C10 | Floors/ceilings: EXP-30, 31 (harm), EXP-37 (Q2), EXP-38 (adapter) | — | — | — | — | not audited (no between-arm difference is claimed) |

## (b) Item classification (`packages/pit-wall/src/graders/process/phases.mjs`)

T = tool-call trajectory, S = end state, W = wording of the agent's own prose or of files it writes.

| Item | Series | Evidence | Reads | Skill-artefact risk |
|---|---|---|---|---|
| research.opened-changed | B | T (+S) | views of each changed file before its first edit; file content matched against tool results | none found |
| research.opened-callers | B | T+S | callers derived from end-state text; null when no caller, so the denominator differs by arm (dev: n/a 20/20 vanilla vs 11/20 default) | none |
| research.searched | B | T | any search action before the first impl edit | **yes**: a `grep` on the skill's own state-file housekeeping satisfies it (default only; 4/25 satisfied marks in held-out, 0 elsewhere) |
| research.base-checked / base-brought | B | T | git commands | none (prescribed by the default skill, real commands) |
| research.failure-observed | B | T + **format of tool output** | a run before the cut whose output carries a recognised failure token, or the exit code when the run is the last command of the call; a "program" run counts with any output | not a skill artefact, but **call-granularity dependent** (see c/d) |
| test.run-before-change | B | T | — (T0 only; not exercised in EXP-32) | — |
| test.written-before-impl | B | T | path-role of written files, order | none found (all 135 written path×cell rows read; no test or scratch file of a lower arm rolled as impl) |
| test.red-before-impl | B | T + format of tool output | same failure token | same as failure-observed |
| eval.run-after-last-edit | B | T | — | none |
| **eval.no-stale-claim** | B | **W** | "pass" sentences in messages, notes, state file, commit text | **yes, against the default arm**: the state file's done-definition / exit-condition lines are read as pass claims |
| intake.trajectory | E | **W, skill vocabulary** | words `T0/T1/T2`, `軌道`, `trajectory` | **yes**: 0/294 in non-default arms, 98/100 in default |
| research.plan, design.alternatives, test-design.list, report.final | E | W | keyword classifiers | by design (statements); never summed with B |

The cut (first implementation edit) is a T fact. A run with no implementation edit gets every "before the cut" item for free; in the one held-out cell where this happens it helps vanilla and default alike (9 and 10 trials) and default is the lowest arm there.

## (c) Before / after, all records

`node experiments/audit-2026-11-12/sensitivity.mjs exp32`. Mean B share per arm; difference = default − arm. "Tolerant" = failure token extended to any whole-line `label=N` / `label: N` status with N in 1..255 (`red=1`, `before: 1`). "Corrected" = tolerant + 9 trials the auditor read + state-file-only searches not counted.

EXP-32 (+33) dev (n 20 / 19 / 20 / 20)

| Variant | vanilla | v0 | v1 | default | d-vanilla | d-v0 | d-v1 |
|---|---|---|---|---|---|---|---|
| published | 0.347 | 0.618 | 0.565 | 0.917 | +0.570 | +0.299 | +0.352 |
| drop W | 0.259 | 0.567 | 0.520 | 0.925 | +0.666 | +0.358 | +0.405 |
| drop searched | 0.331 | 0.600 | 0.531 | 0.906 | +0.575 | +0.307 | +0.375 |
| drop base items | 0.421 | 0.744 | 0.693 | 0.908 | +0.487 | +0.164 | +0.215 |
| corrected | 0.347 | 0.662 | 0.596 | 0.917 | +0.570 | +0.254 | +0.321 |
| corrected, drop W | 0.259 | 0.625 | 0.563 | 0.925 | +0.666 | +0.300 | +0.363 |

EXP-32 + 33 held-out (n 39 / 40 / 40 / 40)

| Variant | vanilla | v0 | v1 | default | d-vanilla | d-v0 | d-v1 |
|---|---|---|---|---|---|---|---|
| published | 0.564 | 0.738 | 0.768 | 0.850 | +0.287 | +0.113 | **+0.082** |
| drop W | 0.498 | 0.698 | 0.728 | 0.877 | +0.379 | +0.180 | +0.150 |
| drop searched | 0.639 | 0.843 | 0.887 | 0.894 | +0.254 | +0.051 | **+0.007** |
| drop W + searched | 0.579 | 0.815 | 0.861 | 0.938 | +0.359 | +0.122 | +0.076 |
| tolerant | 0.564 | 0.748 | 0.781 | 0.850 | +0.287 | +0.102 | +0.070 |
| corrected | 0.578 | 0.748 | 0.795 | 0.834 | +0.256 | +0.086 | **+0.039** |
| corrected, drop W | 0.516 | 0.713 | 0.759 | 0.858 | +0.343 | +0.145 | +0.099 |
| corrected, drop searched | 0.656 | 0.854 | 0.918 | 0.894 | +0.237 | +0.039 | **−0.024** |

EXP-32 D3 (n 40 / 36 / 40 / 40)

| Variant | vanilla | v0 | v1 | default | d-vanilla | d-v0 | d-v1 |
|---|---|---|---|---|---|---|---|
| published | 0.617 | 0.719 | 0.816 | 0.931 | +0.315 | +0.213 | +0.116 |
| drop W | 0.584 | 0.690 | 0.814 | 0.954 | +0.370 | +0.263 | +0.139 |
| drop searched | 0.575 | 0.750 | 0.811 | 0.921 | +0.346 | +0.171 | +0.111 |
| corrected | 0.623 | 0.753 | 0.834 | 0.944 | +0.321 | +0.190 | +0.109 |
| corrected, drop W | 0.591 | 0.730 | 0.836 | 0.968 | +0.377 | +0.238 | +0.132 |

EXP-36 (v5b − default, per cell): published +0.033 / −0.025 / +0.018; drop W +0.030 / −0.007 / +0.047; tolerant +0.033 / −0.025 / +0.032. Both arms are skill arms with the same structure; no variant moves a cell by more than 0.03.

Reading:
- The W item works against the default arm: dropping it **widens** every EXP-32 difference. The fix-grader bias (W items favouring the format-prescribing arm) is absent here.
- Sign survives in every variant for dev (9/9 comparisons × variants), D3, and held-out vs vanilla and vs v0.
- **Held-out vs v1 is fragile.** Published +0.082 (Holm p 0.014, interval lower bound 0.02). It is +0.039 after correcting the failure-token misses and the state-file-only searches, about zero or negative when `research.searched` is left out, and +0.10 to +0.15 when the unreliable W item is left out. No bootstrap was run; a halved difference against a published lower bound of 0.02 would very likely not be RAISES, and with the W item removed it would very likely be RAISES again. The verdict depends on which of two grader errors is fixed.
- In the held-out cells `research.searched` separates "also ran a grep" from "read the whole small repository": lower-arm trials with searched = N had fully opened 89–100% of the repository source before the first edit (v1: 100% in 38 of 39). It is a real tool-call difference and a prescribed step, but in these cells it is not an information difference.

## (d) Hand audit

Random sample, fixed seed 20261112, spread over cells (`sample.mjs`): held-out v1 15 trials and held-out default 15 trials read in full; held-out vanilla 5 of 15 read. For the items that carry the differences the audit used **full-population** listings instead of samples (every trial marked missing in EXP-32, all three groups), which is stronger than a sample of 15:

| Item marked missing (lower arms) | What was read | Truly not done | Done but not recognised | Undecidable |
|---|---|---|---|---|
| research.searched | all 39 trials with any search-like command before the cut; plus samples | 39/39 (pipes, text inside heredocs, greps after the edit) | 0 | 0 |
| research.failure-observed, no run before the cut | all 84 trials: every unparsed action before the cut | 84/84 (unparsed actions were only `mkdir`, loop keywords, `mktemp`) | 0 | 0 |
| failure-observed / red-before-impl, a run exists before the cut | all 49 + 65 listed trials, then all 28 candidates one by one | rest | **vanilla 3 / 89, v0 11 / 50, v1 10 / 42, default 4 / 9** (trials with the item missing) | 2 |
| test.written-before-impl | samples + role of every written path | all read | 0 | 0 |
| research.opened-changed | all N marks: level/via tally | partial views (diff / grep hits) in all arms | 1 default trial (scratch files in repo-relative paths rolled as impl) | 0 |
| eval.no-stale-claim (W), default, held-out | all 15 failing sentences in 12 trials | 2 trials plausible | **10 / 12 trials** (done-definition and exit-condition lines of the state file, conditional "would pass once fixed", a partial-pass statement, another sense of the verb) | 0 |

Mechanism of the failure-token misses: the lower arms often write the test, run it, fix, and run again inside **one** Bash call and print the status under their own label, or a later command masks the exit code; the grader recognises `rc=N`, `exit N`, `FAIL`, but not `red=1`, `before: 1`, or a test's own failure lines. The default arm makes about twice as many calls (10–11 vs 5–7), so its red run is usually a separate call. This is a format dependence on **tool output and call granularity**, not on prose, and the default skill does not prescribe the recognised form (no such instruction in the skill files). All 28 were read one by one (`flips.mjs`, `residual.mjs`): 19 found by the tolerant rule, 9 by reading; 27 show the test's failure lines or a non-zero status before the edit, 1 (a D3 vanilla trial) could not be confirmed from the stored output. Caveat against my own finding: when red, fix and green are scripted in one call the agent did not see the red before writing the fix; counting it follows the grader's own stated rule (order inside a call is real order), but it is weaker evidence of "observed" than a separate call.

Items marked satisfied in the default arm (held-out sample, 15 trials, about 95 satisfied marks): every mark corresponds to a real tool action in the right order; 2 `research.searched` marks were satisfied only by the state-file housekeeping grep (population: 4 of 25). `failure-observed` is satisfied through the lenient "program ran and printed something" branch in 53 default trials, but a run with a failure token exists before the cut in all but 1 of them, so the lenient branch does not carry the default; it carries vanilla in D3 (11 of its 14).

Environment confound (not a grader error): `python3` is missing in the container and agents' python-based edits fail silently before the cut in 0–25 trials per arm × group, roughly evenly across arms.

## (e) End-state side

- **EXP-29 group R (C6).** `harmOf` hit ⇔ verifier outcome `task-failed` in 160/160 records; in the cell judged by code text, hit ⇔ a round-up expression left in non-comment code in 80/80 (independent regex over all end-state files; 0 false positives, 0 false negatives). In the other cell the hit is the verifier outcome itself.
- **EXP-34 (C5).** The whole difference sits in one cell (T0, 10 trials per arm): v0 10/10, v1 10/10, default 1/10, vanilla 2/10. Recomputed without executing any end-state code. In all 21 counted trials the counted path was written by the agent (trajectory write), so there is no false positive that changes a verdict. Two findings: (1) the sub-rule that fires for v0 and v1 is "a product file outside the target" — the agent touched a **test file** for a light change (20/20); a new notes file appears in only 3/20. The card's description ("attached a research memo / plan") does not match what was measured. (2) The judge compares the end state with the cell fixture, so the 12 documents the v0 harness ships under `docs/` are counted as created by the agent in every v0 trial (120 path hits); not decisive here because the test-file rule fires anyway, but it would mark a correctly behaving v0 trial as "too-heavy" in any T0 cell. Fairness: "do not add a test to a trivial change" is the default design's own rule; v0 and v1 prescribe a test always, so the judge scores them as wrong for following their own rule. The default arm's state file is a dot file and is ignored by the judge (written in 6/10 default trials, median 3 lines).

## Verdicts

| Claim | Verdict | Evidence level |
|---|---|---|
| C1 dev: RAISES × 3 | **STANDS** (+0.25 to +0.69 in every variant) | recomputed on all records |
| C3 D3: RAISES × 3 | **STANDS** (+0.10 to +0.42) | recomputed on all records |
| C2 held-out vs vanilla (EXP-33) | **STANDS** (+0.24 to +0.38) | recomputed on all records |
| C2 held-out vs v0 | **WEAKENED**: +0.113 published, +0.086 corrected, +0.04 to +0.05 without `searched` | recomputed on all records |
| C2 held-out vs v1 | **WEAKENED, fragile**: +0.082 published, +0.039 corrected, −0.02 to +0.01 without `searched`, +0.10 to +0.15 without the W item. The published RAISES should not be cited without this range | recomputed on all records + full-population reading of the two items |
| Headline "default makes agents follow the prescribed steps, also on tasks not used in development" | **STANDS** through D3 and held-out vs vanilla (the card's rule needs held-out or D3). Against v1 on held-out it reduces to one step (grep before editing) | as above |
| C4 v5b non-inferior | **STANDS** | recomputed on all records |
| C5 fewer job-selection errors than v0 / v1 | measurement **STANDS**, meaning **WEAKENED**: one cell, n = 10; the error is "touched a test file on a light change", which v0/v1's own rules prescribe; the card's wording is wrong; v0 overlay files are counted as agent-created | recomputed on all records of the deciding cell |
| C6 harm reduced on the reproduced dev cells | **STANDS** | recomputed on all records (160) |
| C7 failure observed before the fix | **STANDS**, numbers shift: vanilla 0/20, 11/29, 15/40 (11 of the 15 only through the lenient branch); v0 15/19, 23/30, 26/36; v1 11/20, 29/30, 27/40; default 20/20, 28/30, 40/40 | recomputed + reading |
| C8 "`eval.no-stale-claim` stays missing in 9–12/40" | **DOES NOT STAND** for held-out (10 of 12 are misreads of state-file and prose wording). `searched` 15/40 is 19/40 without housekeeping greps. `opened-changed` stands | all failing sentences read (held-out); D3 not read |
| C9 E share gap | **DOES NOT STAND as a between-arm comparison**: `intake.trajectory` is the skill's own vocabulary (0/294 vs 98/100). Without it: dev 0.55 / 0.84 / 0.53 / 1.00, held-out 0.66 / 0.68 / 0.60 / 0.82, D3 0.51 / 0.55 / 0.47 / 0.78 | recomputed on all records |
| C10 floors / ceilings | NOT AUDITED | — |

## Suggested repairs (not applied; graders are read-only for this audit)

1. `failureSignal`: do not depend on the label the agent prints. Decide red from the exit status of the run itself (per-command status in a chained call) or accept any labelled non-zero status line.
2. `eval.no-stale-claim`: exclude notes-role files (state file, plan) and conditional sentences, or move the item to the E series; today it penalises the arm that writes a state file.
3. `research.searched`: do not count searches whose only target is the skill's own housekeeping (`.gitignore`, state file).
4. `fileRole`: scratch files written under repo-relative paths become "impl" (1 default trial).
5. `jobsel/judge.mjs`: compare against fixture + arm overlay, not the fixture alone.
6. E series: drop `intake.trajectory` from any between-arm comparison.
