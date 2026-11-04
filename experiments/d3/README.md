# D3 cells — procedure

Four cells at the Dev role's difficulty D3 (`docs/research/research-role-task-difficulty.md` §3.2).
This file describes how to build and check them only. It does not describe their contents: the
harness designer should not read `cells.mjs` or `suites/d3/suite.yaml` (held-out procedure,
`docs/planning/05-shortcut-resistance.md` §3.2 / §4.2).

| file | role |
|---|---|
| `cells.mjs` | the cells (fixtures, request, checks, scripted controls) and the harm scripts |
| `gen-d3.mjs` | writes `suites/d3/suite.yaml` (case ids `d3-1` … `d3-4`) |
| `harm.mjs` | `harmOf(record)` / `harmOfDir(id, dir, ghLines)`: harm on the final state |
| `harm-run.mjs` | harm on stored runs (`results.json`): controls check, `--all` lists every record |
| `check-controls.mjs` | local check of every scripted control: outcome and harm, both directions |

## Build and check (WSL; write the commands to a script file and run `bash -l <file>`)

```bash
cd /mnt/e/Github/pit-crew
node experiments/d3/gen-d3.mjs                                  # writes suites/d3/suite.yaml
node packages/pit-wall/src/cli.mjs lint suites/d3/suite.yaml     # case lint
node experiments/structure/check-cells.mjs suites/d3/suite.yaml  # checks per scripted control
node experiments/d3/check-controls.mjs suites/d3/suite.yaml      # outcome + harm per control
```

`check-controls.mjs` must end with `OK`. For every case it requires: `null` → `task-failed`,
`reference` → `all-followed` with no harm, `harmful` → `task-failed` with harm, and every other
control (`shortcut`, `escalate`) as in `script_expect` with no harm. It also requires the harm of
a workspace and of the same state shaped as a pit-wall record to agree.

## After a Harbor controls run

```bash
node packages/pit-wall/src/cli.mjs run suites/d3/suite.yaml --runner harbor --out <dir>
node packages/pit-wall/src/cli.mjs controls <dir>/results.json suites/d3/suite.yaml
node experiments/d3/harm-run.mjs <dir>/results.json
```

For model runs, write one harm row per record (repository may be read-only):
`bash experiments/sandbox-harm.sh experiments/d3/harm-run.mjs <harm.json> <results.json>`.
`check-controls.mjs --results <path>` writes the local controls' final states as a results.json.

Harbor runs one at a time (charter). Three harm predicates execute the agent's final files on the
host: run `harm-run.mjs` only inside WSL.

## Rules

- Change a cell only in `cells.mjs`, then regenerate; never edit `suites/d3/suite.yaml` by hand.
- After any change, rerun the four commands above. A cell whose controls do not land as built is
  dropped, not adjusted after looking at agent results (`05-shortcut-resistance.md` §4.2).
- The final report to the harness designer gives counts, paths, pass/fail per case id and the
  difficulty axes per cell, never task text, file contents, predicates or answers.
