# Q2 cells — procedure

Three cells for the Q2 measure (citation grounding: were the sources a report cites actually
opened; `docs/planning/23-process-evidence-evaluation-design.md` §3.2). This file describes how
to build and check them only. It does not describe their contents: the harness designer should
not read `cells.mjs` or `suites/q2/suite.yaml` (held-out procedure,
`docs/planning/05-shortcut-resistance.md` §3.2 / §4.2).

| file | role |
|---|---|
| `cells.mjs` | the repository, the cells (history, request, checks) and the scripted controls |
| `gen-q2.mjs` | writes `suites/q2/suite.yaml` (case ids `q2-1-…`, `q2-2-…`, `q2-3-…`); fails above 3 MB |
| `process-spec.json` | per-case registration for the process graders (`--spec`) |
| `check-grounding.mjs` | local check of every scripted control: outcome, size, and the grounding classes both ways |

Each cell has five scripted controls: `null`, `reference`, `fabricated`, `nonexistent`, `partial`.
Apart from `null` they leave the same end state (task done, report present), so the outcome
cannot tell them apart; the grounding grader must (`reference` → O, `fabricated` → N,
`nonexistent` → X, `partial` → P). The grader is the existing
`packages/pit-wall/src/graders/process/grounding.mjs`; nothing here grades on its own.

## Build and check (WSL; write the commands to a script file and run `bash -l <file>`)

```bash
cd /mnt/e/Github/pit-crew
node experiments/q2/gen-q2.mjs                                       # writes suites/q2/suite.yaml
node packages/pit-wall/src/cli.mjs lint suites/q2/suite.yaml          # case lint
node experiments/structure/check-cells.mjs suites/q2/suite.yaml       # checks per scripted control
node experiments/q2/check-grounding.mjs suites/q2/suite.yaml          # outcome + size + grounding classes
```

`check-grounding.mjs` must end with `OK`. It replays each control one command at a time with
each command's real output as the tool result (the record shape `normalize/atif.mjs` produces for
Harbor runs), writes a `results.json`, runs the process-grader CLI on it
(`packages/pit-wall/src/graders/process/cli.mjs <results> --spec experiments/q2/process-spec.json`)
and asserts the classes above, the N+X rate, the outcome of every control against
`script_expect`, and the size of every repository (>= 150 files, >= 400 KB).
`--results <path>` keeps the results.json.

## Limits of the local check, and what Harbor verifies

- `nonexistent` lands on N, not X, with the current `grounding.mjs`: the report that carries the
  fake paths is itself a file of the end state, and the grader's existence check
  (`existsAnywhere` over `state.files`) finds the basename in that very file. The check requires
  N or X for those citations (both count in N + X) and prints which it was; X would appear if the
  grader excluded files the agent wrote from the existence check (a grader decision, not a cell one).
- The controls in a Harbor run are executed by Harbor's oracle agent as one shell script: there
  is no trajectory and no tool results, so `cli.mjs` skips `script:*` records and the grounding
  classes of the controls cannot be verified from a Harbor controls run. `pit-wall controls
  <results.json> suites/q2/suite.yaml` verifies only their outcomes.
- The grounding classes are therefore verified locally, by the emulation above, whose records
  have the same shape as Harbor's normalised records (Bash tool calls with results, `state.files`).
  Model runs on Harbor are graded by the same CLI on real trajectories.

## After a Harbor run

```bash
node packages/pit-wall/src/cli.mjs run suites/q2/suite.yaml --runner harbor --out <dir>
node packages/pit-wall/src/cli.mjs controls <dir>/results.json suites/q2/suite.yaml     # outcomes of the controls
node packages/pit-wall/src/graders/process/cli.mjs <dir>/results.json --spec experiments/q2/process-spec.json --rows
```

Harbor runs one at a time (charter).

## Rules

- Change a cell only in `cells.mjs`, then regenerate; never edit `suites/q2/suite.yaml` by hand.
- After any change, rerun the four commands above. A cell whose controls do not land as built is
  dropped, not adjusted after looking at agent results (`05-shortcut-resistance.md` §4.2).
- The final report to the harness designer gives counts, paths, pass/fail per case id and the
  grounding classes per control, never task text, file contents, predicates or answers.
