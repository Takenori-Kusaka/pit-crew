# QM held-out cells

Held-out cells for the QM role (deliverable 1.1 of `docs/planning/00-goal-charter.md`): written after
the designer's skills, on a project the designer has not seen. Procedure, reading rules, fixture
shape and scripted controls: `experiments/qm/README.md` (the same procedure applies; nothing here
changes it). Types and counts: plan 27 §3; the author's counts and check results: `author-notes.md` §1.

The **harness designer** reads this file and `author-notes.md` §1 only. It must not read `cells.mjs`,
`verdicts.json`, `process-spec.json`, `suites/qm-heldout/suite.yaml`, `author-notes.md` §2 or the
controls' texts.

Generate and check (Git Bash / WSL):

```
node experiments/qm-heldout/gen.mjs
node packages/pit-wall/src/cli.mjs lint suites/qm-heldout/suite.yaml
node experiments/qm-heldout/check-heads.mjs
node experiments/qm-heldout/check-controls.mjs suites/qm-heldout/suite.yaml --json experiments/qm-heldout/controls-result.json
```

Grader registration: `process-spec.json` (`--spec`). Expected verdicts: `verdicts.json` (confirmed by
the re-derivation before any arm runs).
