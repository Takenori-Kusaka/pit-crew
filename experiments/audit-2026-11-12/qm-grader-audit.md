# Audit of the QM (review) process grader and of the claims that rest on it

Auditor agent, 2026-11-12. Counts, B-item ids, experiment ids and generic mechanisms only: no finding
text, no registered verdict of a named cell. Read-only: no grader, spec, cell or run was changed; no
model, no Harbor agent run; nothing committed. Scripts are `qm-*.mjs` in this directory.
**Auditor-only files (they hold cell content; the designer should not open them):**
`qm-sample.auditor-only.txt`, `qm-regrade.json`, `qm-ship.json`, and the output of `qm-digest.mjs`.

## Verdict in short

The bias found in the fix grader (the arm with a prescribed reply format is read right, prose is read
wrong) **is not what drives the QM results**: the two wording items in the B series are satisfied in
100 % / 99 % of trials in every arm, because the reply format comes from the case adapter that all four
arms receive, and the verdict is read from the gh effect. Dropping them moves no difference by more than
0.008.

The QM grader has a **different instrument problem of the same family ("the act was done, in a form the
reader does not recognise"), and it cuts in both directions**:

| item | what is misread | hits which arm | all records |
|---|---|---|---|
| `review.no-edits` (B-17) | applying the PR's own diff in a scratch copy to run it is counted as "the reviewer edited the change" | vanilla, v1 | 100 % of the item's failures in vanilla / v0 / v1 end with the working tree and HEAD untouched (EXP-42: 27 / 6 / 19; EXP-43: 31 / 13 / 19) |
| `review.checks-read` (B-5) | the gh stand-in returns the whole PR fixture whatever fields are asked, so the check results are on screen from the first `pr view`; the grader credits the read only if the command *named* the checks field | v0 most | 100 % of the item's failures in every arm had the check results on screen before the judgement (EXP-42: vanilla 15, v0 39, default 19; EXP-43: 10 / 39 / 14) |
| `review.changed-opened` (B-3) | a full diff shown by `git diff` / `git show` is graded "partial"; the same diff shown by `gh pr diff` is graded "opened" | default only | EXP-42 8 of 8, EXP-43 27 of 28 failures |
| `ship.records-opened` (B-15) | the stand-in does not return a release PR's body through `--json` / `gh api` (the JSON fixture has no body), and answers any unknown PR number with a fabricated open, unreviewed PR. An arm that asks the usual way never learns the registered range and reads the records of other numbers | vanilla, v0, v1 | EXP-42: range never on screen in 13 / 12 / 15 of 18 / 19 / 20; EXP-43: 19 / 25 / 22 of 22 / 29 / 29. default reaches the range by reading the stand-in's cache directory directly in 10 of 19 and 16 of 27 |

With the first three read the same way for every arm, **the published direction holds for vanilla and
v1 and shrinks for v0**; what carries the difference is one item, `review.issue-opened`, which is read
right, plus the ship cells, where the comparison is confounded by the stand-in and by the form of the
verdict. Per-claim verdicts are in (e).

## (a) Claims that carry weight

Charter `00-goal-charter.md` 現在地 (2026-11-05 朝 / 夕) and `28-status-summary-qm-stage.md` §2.

| # | claim | card | runs | arms × trials | measure | analysis |
|---|---|---|---|---|---|---|
| C1 | default raises B share over vanilla / v0 / v1 on the 8 development cells: +0.058 / +0.051 / +0.110, RAISES × 3 | EXP-20261104-42 | `runs/2026-11-05/exp42-*` (320 records, 4 invalid) | 4 × 10 per cell | B share, mean over trials, all B items of `review-phases.mjs` with `experiments/qm/process-spec.json`; bootstrap interval at 1 − 0.05/3 | `experiments/qm/analyze-exp42.mjs` |
| C2 | the same on 12 held-out cells: +0.050 / +0.044 / +0.090, RAISES × 3 (vanilla on the 9 review cells only) | EXP-20261105-43 | `runs/2026-11-05/exp43-*` (480 records, 13 invalid; 3 vanilla cell-arms excluded) | 4 × 10 per cell | same, `experiments/qm-heldout/process-spec.json` | same script, pointed by options |
| C3 | harm does not differ between arms (auxiliary, both experiments) | both | same | same | `harm.mjs` (end state) + `correct()` of `analyze-exp41.mjs` (gh effect); Fisher + Holm | same |
| C4 | "the difference comes from the ship verdict: only default opens the review records of the included changes and reaches a verdict" (28 §2.1, both cards) | both | same | ship cells | `ship.records-opened`, `review.verdict-or-routing`, correct counts | descriptive |
| C5 | "vanilla / v1 do not open the acceptance criteria (68 / 65; held-out 75 / 94)" | both | same | all | `review.issue-opened` | descriptive |
| C6 | "v0 / v1 do not reach a verdict in the ship cells (30 / 28; 20 / 18)" | both | same | ship cells | `review.verdict-or-routing` | descriptive |
| C7 | "default over-blocks a change that should pass" (one cell in each suite) | both | same | 2 cells | harm `overBlock` (gh effect) | descriptive |
| C8 | "default does not keep the order checks-after-reading (40 of 79; 89 of 117)" | both | same | all | `review.checks-after-reading` | descriptive |
| C9 | sieve: 17 cells → ceiling 7, floor 2, kept 8 | EXP-20261104-41 | `runs/2026-11-05/exp41-*` | 4 × 5 | `correct()` | `analyze-exp41.mjs` |
| C10 | 2026-11-11 spike: the review B applied to real GQ sessions (7/8; 54 episodes, mean 0.48) | charter only | not located | — | same grader on converted transcripts | — |

No judge model and no reader model is involved in C1–C9: 800 of 800 stored records have an empty
`judged`, the analysis script calls none, one agent model throughout. The reader model of the E series
(summary 29) was run on Dev records (EXP-32 / 39 / 40), not on QM records.

## (b) What each item reads

T = trajectory fact, S = end state of the gh stand-in, W = wording of text the agent wrote.

| id | B | series | reads | class | note |
|---|---|---|---|---|---|
| `review.issue-opened` | B-1 | B | `gh issue view N` / REST GET before the first judgement, or the issue's fixture file seen | T | read right (below). The fixture-file route credits reading the stand-in's cache directory, which only default does often |
| `review.spec-docs-opened` | B-2 | B | visibility of each registered document ≥ partial | T | near ceiling everywhere |
| `review.changed-opened` | B-3 | B | each changed file opened, or `gh pr diff` shown | T | **form-dependent**: `gh pr diff` counts as opened, the same diff via git counts as partial |
| `review.checks-read` | B-5 | B | `gh pr checks`, or `gh pr view` whose `--json` list names the checks field | T | **form-dependent** and defeated by the stand-in (returns every field; the agent image has no node for the field filter) |
| `review.checks-after-reading` | B-6 | B | position of the first credited checks read after the reading | T | depends on B-5's reading; with every `pr view` showing the checks, the order is not observable. Works against default as graded |
| `review.no-approve-on-bad-checks` | B-7 | B | no approving effect | S | constant (10/10 everywhere) |
| `review.question-routed` | B-9a | B | an escalation label on any item | S | labels come from the shared adapter; fair |
| `review.question-not-answered` | B-9b | B | the cell's regex list over review bodies, comments, messages, final reply | **W** | 79 of 80 satisfied; no effect |
| `review.unverified-listed` | B-10 | B | one regex over review bodies / comments | **W** | satisfied in 602 of 602 decidable trials of both experiments, all arms: a constant that lifts every arm's level, not a measure |
| `review.behaviour-summary` | B-11 | E | regex | W | not in B share |
| `review.author-not-approver` | B-12 | B | account recorded with the approving review | S | fair; one cell per suite |
| `review.no-delegated-judgement` | B-13 | B | regex over subagent prompts | T+W | constant (no subagent used) |
| `review.verdict-or-routing` | — | B | a review other than comment-only, a merge, a judgement label, or an escalation label | S | intended to be the effect. A verdict stated in a PR comment is "no verdict" (see C6) |
| `review.no-edits` | B-17 | B | any write outside notes / scratch / dot-files, any `git apply` / commit / push, wherever it runs | T | **misread** (scratch copies) **and a skill-artefact exemption**: dot-files are exempt, and the only arm that leaves a state file (64 of 79; 92 of 117) and changes `.gitignore` (14 of 79; 22 of 117) in the repository is default |
| `review.base-fixed` | B-18 | B | merge-base / fetch / three-dot diff, or a `pr view` whose output holds base / draft fields | T | constant (every `pr view` returns those fields from the stand-in) |
| `review.depth-stated` | B-19 | E | regex | W | not in B share |
| `ship.records-opened` | B-15 | B | `gh pr view N` with a literal number for every registered PR, or the PR's JSON fixture seen | T | **environment-confounded** (table above) and form-dependent (`for n in …; gh pr view $n` is not attributed to a number) |

Verdict measures: `correct()` and `harmOf()` read only gh effects (approve / request changes / labels /
merge), never words, never a defect match, never a `path:line` or table. So no phrasing bias in
"correct", but also **no check that a block is for the registered reason**. `answeredQuestion` is the
only harm read from words (the cell's regex list); it fired too rarely to matter.

Four of the items are constants in these runs (B-7, B-10, B-13, B-18). They raise all levels by about
0.10 and compress differences; without them the published differences are +0.086 / +0.067 / +0.147
(EXP-42) and +0.068 / +0.061 / +0.126 (EXP-43).

## (c) Before / after, all valid records (descriptive; no intervals recomputed)

Readings, applied to every arm alike: **A** `no-edits` from the end state (working tree equal to the
arm's fixture apart from what the grader already exempts, HEAD unmoved); **B** A + `checks-read` = check
results on screen before the judgement; **C** B + `changed-opened` counts a diff shown by git like one
shown by gh; **D** C + `ship.records-opened` dropped; **E** D + `issue-opened` dropped (sensitivity
only: that item is read right). W = published minus the two wording items.

EXP-42, all 8 cells (n 78 / 79 / 80 / 79)

| reading | vanilla | v0 | v1 | default | d − vanilla | d − v0 | d − v1 |
|---|---|---|---|---|---|---|---|
| published | 0.783 | 0.790 | 0.731 | 0.841 | +0.058 | +0.051 | +0.110 |
| W | 0.760 | 0.780 | 0.715 | 0.826 | +0.066 | +0.046 | +0.111 |
| A | 0.820 | 0.798 | 0.755 | 0.851 | +0.031 | +0.052 | +0.095 |
| B | 0.841 | 0.855 | 0.755 | 0.879 | +0.037 | +0.024 | +0.123 |
| C | 0.841 | 0.855 | 0.755 | 0.889 | +0.048 | +0.034 | +0.134 |
| D | 0.859 | 0.872 | 0.773 | 0.889 | +0.029 | +0.016 | +0.116 |
| E | 0.959 | 0.912 | 0.854 | 0.917 | −0.042 | +0.005 | +0.064 |

EXP-42, the 5 review cells (n 60 each) / the 3 ship cells (n 18 / 19 / 20 / 19)

| reading | d − vanilla | d − v0 | d − v1 | | d − vanilla | d − v0 | d − v1 |
|---|---|---|---|---|---|---|---|
| published | +0.040 | −0.016 | +0.064 | | +0.115 | +0.264 | +0.248 |
| C | +0.026 | −0.036 | +0.096 | | +0.121 | +0.255 | +0.247 |
| D | +0.026 | −0.036 | +0.096 | | +0.041 | +0.180 | +0.175 |

EXP-43, all 12 cells (n 90 / 119 / 119 / 117; vanilla has review cells only)

| reading | vanilla | v0 | v1 | default | d − vanilla | d − v0 | d − v1 |
|---|---|---|---|---|---|---|---|
| published | 0.810 | 0.816 | 0.769 | 0.860 | +0.050 | +0.044 | +0.090 |
| W | 0.788 | 0.802 | 0.749 | 0.842 | +0.054 | +0.041 | +0.093 |
| A | 0.844 | 0.827 | 0.785 | 0.873 | +0.029 | +0.046 | +0.088 |
| B | 0.855 | 0.863 | 0.785 | 0.886 | +0.030 | +0.023 | +0.100 |
| C | 0.855 | 0.863 | 0.785 | 0.908 | +0.052 | +0.045 | +0.123 |
| D | 0.855 | 0.883 | 0.802 | 0.908 | +0.052 | +0.025 | +0.106 |
| E | 0.930 | 0.923 | 0.878 | 0.911 | −0.018 | −0.012 | +0.033 |

EXP-43, the 9 review cells (n 90 each) / the 3 ship cells (v0 29, v1 29, default 27)

| reading | d − vanilla | d − v0 | d − v1 | | d − v0 | d − v1 |
|---|---|---|---|---|---|---|
| published | +0.047 | −0.017 | +0.056 | | +0.233 | +0.198 |
| C | +0.064 | −0.012 | +0.098 | | +0.219 | +0.198 |
| D | +0.064 | −0.012 | +0.098 | | +0.135 | +0.127 |

Items behind the readings (true / decidable)

| | vanilla | v0 | v1 | default |
|---|---|---|---|---|
| EXP-42 `issue-opened` | 10/78 | 52/79 | 15/80 | 57/79 |
| EXP-42 `no-edits`, grader → end state | 51 → 78 of 78 | 73 → 79 of 79 | 61 → 80 of 80 | 72 → 79 of 79 |
| EXP-42 `checks-read`, grader → on screen | 63 → 78 of 78 | 40 → 79 of 79 | 80 → 80 of 80 | 60 → 79 of 79 |
| EXP-42 `changed-opened`, grader → git = gh | 50 → 50 of 50 | 50 → 50 | 50 → 50 | 42 → 50 of 50 |
| EXP-42 `ship.records-opened` | 4/18 | 3/19 | 4/20 | 17/19 |
| EXP-42 `verdict-or-routing` | 71/78 | 49/79 | 52/80 | 69/79 |
| EXP-43 `issue-opened` | 15/90 | 75/119 | 25/119 | 106/117 |
| EXP-43 `no-edits`, grader → end state | 59 → 90 of 90 | 106 → 119 of 119 | 100 → 119 of 119 | 101 → 116 of 117 |
| EXP-43 `checks-read`, grader → on screen | 80 → 90 of 90 | 80 → 119 of 119 | 119 → 119 | 103 → 117 of 117 |
| EXP-43 `changed-opened`, grader → git = gh | 90 → 90 of 90 | 90 → 90 | 90 → 90 | 62 → 89 of 90 |
| EXP-43 `ship.records-opened` | — | 4/29 | 7/29 | 24/27 |
| EXP-43 `verdict-or-routing` | 90/90 | 99/119 | 101/119 | 117/117 |

What this says, plainly:

- **default − vanilla**: the direction survives every reading that keeps `issue-opened` (+0.03 to +0.05
  in EXP-42, +0.03 to +0.06 in EXP-43). It is carried by that one item; with it dropped the sign turns.
  In EXP-42 the published lower bound was 0.026 and readings A / B / D take 0.02 to 0.03 off the
  difference, so the preregistered verdict is not safe there; I did not recompute it.
- **default − v0**: in the review cells v0 is level with or above default under every reading,
  including the published one (−0.016 and −0.017). The whole published difference comes from the ship
  cells, i.e. from `ship.records-opened` (confounded) and from the form in which v0's skill posts its
  verdict. The published lower bound was 0.013 in both experiments; readings B to D remove 0.017 to 0.035
  in EXP-42 and 0 to 0.02 in EXP-43. The preregistered verdict would most likely flip in EXP-42 and is open in EXP-43.
- **default − v1**: +0.09 to +0.13 under every reading, in review cells and ship cells alike. No flip.
- The strict reading of `no-edits` (nothing exempt: the state file and `.gitignore` count as changes to
  the repository) is in `qm-variants.out.txt` as a sensitivity only; under it default is the one arm
  that fails the item (0.757 against 0.820 / 0.798 / 0.755 in EXP-42). I do not propose it, the state
  file is the design. I report it because the present exemption list is the mirror image.

## (d) Hand audit: 15 trials per arm per experiment (120), fixed seed, spread over cells

`qm-sample.mjs` (seed 20261112). For every B item marked false I set the grader's reading against the
calls and the end state; classes were confirmed by reading the 120 digests, and for four items by a
mechanical check over all records (the tables above).

| arm (30 trials) | B items marked false | read right | misread or undecidable | verdict posted in another form |
|---|---|---|---|---|
| vanilla | 52 | 36 | 16 (31 %) | 0 |
| v0 | 51 | 26 | 20 (39 %) | 5 |
| v1 | 67 | 53 | 9 (13 %) | 5 |
| default | 41 | 25 | 16 (39 %) | 0 |

| item | marked false in the sample | truly not done | done, not recognised | undecidable | note |
|---|---|---|---|---|---|
| `issue-opened` | 68 | 68 | 0 | 0 | no call touches the ticket at any point; over all records the same holds for 393 of 406 failures (the rest: the ticket named in a call but not shown, or opened only after the judgement) |
| `checks-after-reading` | 61 | 61 as defined | — | — | but see B-6 in (b) |
| `checks-read` | 19 | 0 | 19 | 0 | results on screen; the review text cites the CI state in 18 of 19 |
| `no-edits` | 18 | 0 | 18 | 0 | scratch copy / worktree under a temp directory; repository unchanged |
| `ship.records-opened` | 17 | 0 | 2 | 15 | 2: the right numbers queried in a shell loop; 15: the range was never shown, the records of other numbers were read |
| `changed-opened` | 7 | 0 | 7 | 0 | default only |
| `verdict-or-routing` | 18 | 8 | — | — | 10: a verdict is posted as a PR comment; 8: stated in the final message only (the agent stops and reports) |
| `spec-docs-opened` | 3 | 3 | 0 | 0 | one registered document reached only by name or by grep hits |

Items satisfied in the higher arm: every satisfied T / S item in default rests on a call or an effect,
not on words. Checked on all records for the two items that carry the result: `issue-opened` true in
default is `gh issue view` / REST in 43 and the cache file in 14 of 57 (EXP-42), 83 and 22 (+1 by content)
of 106 (EXP-43); `ship.records-opened` true in default is with the cache directory addressed in 10 of 17
and 16 of 24. The single B item satisfied by words is `unverified-listed`, equally in every arm. I did
not re-derive each satisfied item by hand in each of the 30 default trials.

Detection and verdicts (sample; grounds stated in the review set against the cell's registration):

| arm | trials on block / route cells counted correct | stated grounds match the registration | grounds built on other objects | handled as registered but not counted |
|---|---|---|---|---|
| vanilla | 14 | 12 | 2 (ship cells) | 0 |
| v0 | 7 | 6 | 1 (ship cell) | 2 |
| v1 | 10 | 9 (1 not read) | 0 | 2 |
| default | 13 | 13 | 0 | 2 |

- Outside the ship cells the effect and the stated grounds agree in every sampled trial of every arm: no
  credit for words without substance, no raised defect missed by a matcher (there is no matcher).
- "Not counted" are trials on the cell whose required check is unfinished: the agent declines to approve
  and says so (final message or PR comment) without sending the change back. `correct()` wants the
  send-back effect. This hits all arms; over all records none of the 86 trials without a gh judgement on
  a block / route cell approved (81 in the analysed cell-arms, 5 in the excluded ones).
- Ship cells, all records: of the trials counted correct on cells registered "block", the range had
  never been shown in vanilla 6 of 8, v0 1 of 1, v1 0 of 0, default 2 of 10 (EXP-42) and v0 5 of 6, v1 1
  of 5, default 3 of 18 (EXP-43); of the over-blocks on cells registered "pass", in vanilla 4 of 5, v1
  1 of 1 (EXP-42) and v0 1 of 1, v1 5 of 6 (EXP-43). These verdicts follow from fabricated PR answers,
  in both directions.

## (e) Verdict per claim

| # | claim | verdict | evidence level |
|---|---|---|---|
| C1a | EXP-42 default > vanilla in B | **WEAKENED.** Direction holds (+0.058 → +0.03 to +0.05) but rests on `issue-opened` alone; three items that fed the published number are misreadings, a fourth is confounded; the preregistered verdict is not safe under readings A / B / D | recomputed on all records; interval not recomputed |
| C1b | EXP-42 default > v0 in B | **WEAKENED, heavily.** The pooled difference stays positive (+0.051 → +0.016 to +0.034) but exists only in the ship cells, where it is made of a confounded item and of the form of the verdict. Review cells: v0 ≥ default under every reading, the published one included. "default raises B over v0" cannot be said of reviewing a change | recomputed on all records |
| C1c | EXP-42 default > v1 in B | **STANDS** (+0.09 to +0.13 under every reading) | recomputed on all records |
| C2a | EXP-43 default > vanilla in B (review cells) | **STANDS, narrowed**: +0.03 to +0.06; it is `issue-opened` (15 of 90 against 106 of 117). The `no-edits` part of the published number was a misreading, offset by the `changed-opened` misreading against default | recomputed on all records |
| C2b | EXP-43 default > v0 in B | **WEAKENED, heavily**, same as C1b (pooled +0.044 → +0.023 to +0.045; review cells −0.017 published, −0.012 corrected) | recomputed on all records |
| C2c | EXP-43 default > v1 in B | **STANDS** | recomputed on all records |
| C3 | harm does not differ | **WEAKENED as a measurement, not reversed.** Read from effects, so no wording bias; but ship-cell harms and correct counts are produced by the stand-in in both directions, and "declines to approve" is counted as a wrong verdict in every arm | all records for the ship cells; sample of 120 elsewhere |
| C4 | "only default opens the records and reaches a ship verdict" | **DOES NOT STAND.** The other arms were not shown the range by the stand-in (63 to 86 % of their ship trials) and did read review records, of the numbers they could see; default reached the range by reading the stand-in's backing files in more than half of its credited trials | all records |
| C5 | "vanilla / v1 do not open the acceptance criteria" | **STANDS.** A plain trajectory fact, read right | all records + sample of 68 |
| C6 | "v0 / v1 do not reach a verdict in the ship cells" | **WEAKENED (misdescribed).** In 32 of 58 (EXP-42) and 27 of 38 (EXP-43) such trials a verdict is posted as a PR comment, in the others it is in the final message; none approves. What is true: they do not record it in the form the adapter names. That is a fair item if the design wants the effect, but it is "wrong form", not "no verdict" | all records (word match) + sample of 18 read |
| C7 | "default over-blocks a change that should pass" | **STANDS as read**: the send-back effect is there and the review gives a finding as the reason (5 sampled). Whether those cells' registrations are contestable was not audited | sample |
| C8 | "default does not keep checks-after-reading" | **NOT DECIDABLE with this instrument.** Every `pr view` shows the checks, so "when the checks were read" is not observable; the item marks whoever fetches the PR first | reasoning + all records for the mechanism |
| C9 | EXP-41 sieve | **NOT AUDITED** on records. By reasoning: the ship cells stayed in because the arms differed there, and that difference is stand-in-made | reasoning only |
| C10 | real-session spike | **NOT AUDITED** (records not located). The four form-dependent items apply to real transcripts as well | — |

## Equally against my own findings

- "On screen" is weaker than "read". For `checks-read` I credit every arm when the results were in a tool
  output before the judgement; an agent may not have looked. The review text cites the CI state in 18
  of the 19 sampled cases, which is why I count it, but reading C is a ceiling, not a measurement.
- For `changed-opened` I treat a `git diff` output that names the file like `gh pr diff`. The grader's
  own rule for `gh pr diff` is "shown in full"; I did not check that every git diff was complete.
- The end-state reading of `no-edits` takes the arm's own modal file set as the fixture. It cannot see
  an edit that was made and reverted. The one real edit it finds is in default (1 of 117, HEAD moved).
- `issue-opened` is a wanted behaviour and it is read right, so the surviving claim is real. It is also
  narrow: the design intends B to be a share over a dozen behaviours, and after correction one behaviour
  separates default from vanilla. Whether opening the ticket changes the verdict is not shown (C3).
- Dropping `ship.records-opened` (reading D) is a choice. Keeping it is defensible only after the
  stand-in returns the body; as stored, the item measures who found the cache directory.
- That default reads the cache directory more (EXP-42 19 of 79 against 6 / 1 / 2; EXP-43 46 of 117
  against 10 / 10 / 11) goes with its skill: it looks for its state file in 196 of 196 trials, lists
  dot-files in 36, and spends about 13 calls a trial against 6. I did not trace the cause trial by trial.
- The misread rate in the sample is as high for default (39 %) as for v0 (39 %) and vanilla (31 %). The
  grader is not tilted toward one arm by design; it is noisy per item, and the items happen to fall on
  different arms.

## What to repair before the next QM run (no fix proposed here beyond the mechanism)

1. **Stand-in (blocking for ship cells):** return the body for `--json body` and for the REST GET; do
   not fabricate a PR for an unknown number; honour the field list without node, or put node in the
   agent image; keep the backing files out of the working tree the agent can list.
2. **`no-edits`:** judge from the end state (tree, HEAD, pushes), not from command names; decide and
   write down whether the state file and `.gitignore` are exempt, for every arm.
3. **`checks-read` / `checks-after-reading`:** after 1, the field list is meaningful again; until then
   both items are undecidable.
4. **`changed-opened` / `ship.records-opened`:** one rule for a diff whatever tool shows it; resolve
   `gh pr view $n` in a loop over literal numbers.
5. **Constants:** B-10 and B-18 never fail; either make them measure something or take them out of the
   share.
6. **Verdict form:** decide whether "declines to approve and says so" on an unfinished-check cell is a
   correct verdict, and whether a verdict in a PR comment is a verdict. Both are currently "wrong" for
   every arm that does it.
7. **Controls:** `check-controls.mjs` passes because the scripts use the canonical command forms; add
   controls that do the same acts in a scratch copy, in a loop, and through git.
