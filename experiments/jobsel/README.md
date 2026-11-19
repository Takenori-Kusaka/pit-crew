# jobsel cells — procedure

Six cells for deliverable 1.2 (job selection) for the Dev role: three minimal pairs (case ids
`js-1a js-1b js-2a js-2b js-3a js-3b`; `docs/research/research-role-task-catalog.md` §5.2). This file
describes how to build and check them only. Held-out: the harness designer does not read `cells.mjs`,
`judge.mjs`, `decision-points-detail.json` or `suites/jobsel/suite.yaml` and sees only counts,
pass/fail per case id and the selection-error type each cell targets.

| file | role |
|---|---|
| `cells.mjs` | cells (fixtures, request, checks, scripted controls), judge facts, expected error per control |
| `gen-jobsel.mjs` | writes `suites/jobsel/suite.yaml` |
| `judge.mjs` | `errorOf(record)` / `errorOfDir(id, dir, ghLines)`: `null` or one of `overreach`, `omission`, `over-escalation`, `too-shallow`, `too-heavy`, on the final state (files + gh calls) |
| `check-controls.mjs` | local check of every scripted control: outcome, and error class from a workspace and from a record (must agree), both directions |
| `process-spec.json` | per-case registration for the process grader (trajectory, bug, base, implFiles) |
| `decision-points.json` | decision-point ids and categories per case (`decision-points-detail.json`: evaluator only) |

Scripted controls in every cell: `null`, `correct`, `always-route`, `never-route`, `overreach`,
`heavy`, `light`.

## Build and check (WSL; write the commands to a script file and run `bash -l <file>`)

```bash
cd /mnt/e/Github/pit-crew
node experiments/jobsel/gen-jobsel.mjs                                # writes suites/jobsel/suite.yaml
node packages/pit-wall/src/cli.mjs lint suites/jobsel/suite.yaml       # case lint
node experiments/structure/check-cells.mjs suites/jobsel/suite.yaml    # checks per scripted control
node experiments/jobsel/check-controls.mjs suites/jobsel/suite.yaml    # outcome + error class per control
```

`check-controls.mjs` must end with `OK`. It requires, per case and control, the outcome in
`script_expect` and the error class in `errorExpect`; per case, the `correct` control error-free and
some control caught; over the suite, each of the five error types produced by some control.

## After a Harbor run

```bash
node packages/pit-wall/src/cli.mjs run suites/jobsel/suite.yaml --runner harbor --out <dir>
node packages/pit-wall/src/cli.mjs controls <dir>/results.json suites/jobsel/suite.yaml
```

Selection errors on stored records: `import { errorOf } from 'experiments/jobsel/judge.mjs'` per
record. Two predicates run the agent's final files with bash: classify only inside WSL or a throwaway
container. Process conformance: `packages/pit-wall/src/graders/process/cli.mjs <results.json> --spec
experiments/jobsel/process-spec.json`. Harbor runs one at a time (charter).

## Rules

- Change a cell only in `cells.mjs`, then regenerate; never edit `suites/jobsel/suite.yaml` by hand.
- After any change, rerun the four commands above. A cell whose controls do not land as built is
  dropped, not adjusted after looking at agent results (`05-shortcut-resistance.md` §4.2).
- Before use, an independent role re-derives each cell's correct job from the project's decision
  table and state; only cells where both agree are used (catalog §5.4).
