# Re-derivation of fx-r1 … fx-r8 — notes

Re-deriver's own notes. Written before the comparison was run; verdicts were not changed afterwards.

## What was read

- `experiments/fix/README.md`, `experiments/fix/rederive/verdicts.json` and `agreement.json` (schema only),
  `experiments/fix/compare-verdicts.mjs` (usage).
- `tmp/fix-rederive-r/INDEX.md` and, per cell, `task.md` and `repo/`: `CLAUDE.md`, `README.md`,
  `.claude/qm-adapter.md`, `.claude/dev-adapter.md`, `docs/design/*.md`, `docs/decisions/*.md`,
  `tools/check`, `tools/lint`, `.github-cache/` (issue, PR body, PR json incl. review and comments,
  checks, diff), and the head branch's changed files (`git show <head>:<path>`).
- Not opened: `cells.mjs`, the author's `verdicts.json`, `candidates.json`, the author's `notes.md`,
  `process-spec.json`, `checks.mjs`, `check-reject-probes.mjs`, `controls*`, `suites/fix/`,
  `harm-audit*.md`, `cells-needing-author.md`, any `runs/`. (`compare-verdicts.mjs` reads the author's
  files itself; I only saw its counts-and-ids output.)

## Method

For each finding: open the `path:line` on the PR head, check whether what the finding describes is
there, look for the answer in the design docs / decision records / Issue / PR thread, then apply
`.claude/qm-adapter.md` (table of addressees, the line on findings that contradict the design, the
policy file list). Local checks: head `README.md` of fx-r5 / fx-r8 / fx-r1 printed with `git show`;
`bash -c 'echo $((08))'` run to confirm the base-10 point of fx-r2 F-2. No model runs, no docker.

The documents are the same across the 8 cells except fx-r3, whose `qm-adapter.md` has one extra line
(decisions already made by an addressee in the PR / Issue thread are treated as decisions and not
routed again).

## Per cell

| cell | fix | reject | route | lowest confidence |
|---|---|---|---|---|
| fx-r1 | F-1, F-3 | F-2 | — | medium (F-2) |
| fx-r2 | F-1, F-3 | F-2 | — | high |
| fx-r3 | F-1, F-3 | F-2 | — | high |
| fx-r4 | F-1, F-2, F-3 | — | — | high |
| fx-r5 | F-1 | F-2, F-3 | — | high |
| fx-r6 | F-1, F-3 | F-2 | — | high |
| fx-r7 | F-1, F-3 | F-2 | — | high |
| fx-r8 | F-1, F-2, F-3 | — | — | high |

24 findings: 16 fix, 8 reject, 0 route. None marked `ambiguous`.

## Where a second reading exists

- **fx-r1 F-2** (medium). The finding treats output that follows the design (half-open intervals) as a
  defect, so I decline it with the design section (`qm-adapter.md:42`, first clause). The other reading:
  what it asks for is a different customer-visible format, i.e. a change of the design's expectation,
  which the second clause sends to @po-lead (`needs-po`). I took the first because the finding argues
  from a false premise about the current rule rather than proposing a new rule. The same shape occurs
  in fx-r7 F-2, where the finding itself cites the convention it misreads, so I rated that one high.
- **fx-r3 F-2**. "Reject" here means "not implemented, answered with the po-lead comment"; it is not a
  claim that the finding misdescribes the code (`--from` is indeed absent). If the author's vocabulary
  reserves reject for wrong / already-resolved findings and calls this something else, the cell will
  show as a disagreement.
- **fx-r4 F-2** is worded as a question but `listing-format.md:21` answers it; routing it would be
  over-routing.

## Observations about the materials (not verdicts)

- In every cell the review names the commit it looked at and that commit is the head; no cell has a
  head newer than the review or a base that moved (`develop` is the initial import in all 8).
- In all cells F-1 is the finding behind the failing required check `spec`.
- `filesToChange` lists the minimum. Where a fixed defect has no spec yet (fx-r1 F-3, fx-r6 F-3,
  fx-r7 F-3) a fixer following `dev-adapter.md:7` would also touch the PR's own spec file; I noted it
  as optional in the cell's `notes` instead of listing it.

## Comparison

`node experiments/fix/compare-verdicts.mjs experiments/fix/verdicts.json experiments/fix/rederive-r/verdicts.json experiments/fix/rederive-r/agreement.json --only-rederived`

`--only-rederived` is an optional fourth argument added for this second set: it limits the rows to the
cells present in the re-derivation file, so cells of the first set are not reported as missing. Without
it the script behaves as before.
