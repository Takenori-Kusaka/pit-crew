# EXP-48 — instruments for the real-repository Dev evaluation

Plan: `docs/planning/34-dev-real-failure-evaluation-plan.md` (第 2 版) §9 "G4 の前に作る計器". Review: `docs/planning/34-review-g5.md`.
This directory holds the instruments' scripts and the pointers. It holds **no content of the subject repository** (Takenori-Kusaka/ganbari-quest, AGPL-3.0; owner decision 3).

## What is tracked and what is local

| Tracked (this repository) | Local only: `local/exp48-gq/` (git-ignored) |
|---|---|
| Pointers: repository name, commit ids, PR / issue numbers, path lists, hashes, counts, scores | `gq.git` — a bare clone of the public repository |
| The harness-file list with a rationale per entry (`harness-files.json`) | `build/` — docker build contexts (the tree archives, `package.json`, lock file) |
| Instrument code and its tests (`packages/pit-wall/src/realrepo/`, `shims/realrepo/`, `src/gates.mjs`, `judge/jev-audit.mjs`) | `harbor/<arm>/harbor-tasks/<task>/` — Harbor task directories (request text, hidden checks, reference fix) |
| Gate files `gates/exp48/*.json`, the Jev ledger (amounts only) | `tasks/<task>/instruction.md` — the request (issue title and body + environment facts), written by the task author |
| `gates/exp48/G4.result.json` (numbers only) | `g4-out/` — raw per-phase results, including the paths of failing test files; run records and trajectories of later runs |

Before every commit and before `publish-snapshot`:

```
node packages/pit-wall/src/gates.mjs no-gq-content          # files changed since the base commit
node packages/pit-wall/src/gates.mjs no-gq-content --all    # every tracked file (slow: ~200k files)
```

It compares every line of 30 or more non-blank characters with the subject's lines (hashed from the clone and from `local/exp48-gq/tasks/`). It fails closed: without the clone it stops. Settings and the reviewed allow list (hashes only): `no-gq-content.json`.

## How to materialise

```
git clone --bare https://github.com/Takenori-Kusaka/ganbari-quest.git local/exp48-gq/gq.git

# 1. a pointer (the mechanical part; issue / PR numbers and the request come from the task author)
node experiments/exp48/materialise.mjs derive <id> <reference fix commit> --pr <n> --issue <n> > <task>.json

# 2. build contexts, then the images (inside WSL; one docker job at a time)
node experiments/exp48/materialise.mjs contexts <task>.json
bash experiments/exp48/build-images.sh <id>

# 3. one Harbor arm directory per arm (and the two scripted controls)
node experiments/exp48/materialise.mjs arm <task>.json A
node experiments/exp48/materialise.mjs arm <task>.json B --requirements <path to the requirements document>
node experiments/exp48/materialise.mjs arm <task>.json C            # --skills subjects/dev-skill-default/skills --entry /dev
node experiments/exp48/materialise.mjs arm <task>.json D
node experiments/exp48/materialise.mjs arm <task>.json A --script reference   # must pass the hidden checks
node experiments/exp48/materialise.mjs arm <task>.json A --script noop        # must fail them
```

Images: `pitwall/realrepo-node:<node version>` (agent image + node + recorder) → `pitwall/realrepo-deps:<hash of package.json + lock + .npmrc>` (`node_modules`) → `pitwall/realrepo-tree:<task>-abc` / `-d` (the pre-fix tree as one commit). Harbor's own build is then one `FROM` line.

## The arms

| Arm | Tree | Added |
|---|---|---|
| A | harness files removed (`harness-files.json`) | nothing |
| B | same as A | one requirements document as `/app/CLAUDE.md`, hidden from git. The path is a parameter; the document is written by another role |
| C | same as A | the skill directory (`--skill`) and the entry `/dev` in front of the request — the wiring of EXP-32 (`experiments/structure/run-exp32.sh`: `path:<skills>@/dev`) |
| D | nothing removed | nothing |

All arms: one commit, no history, no remote.

## The instruments

| # | Instrument | Where | Test |
|---|---|---|---|
| 1 | Gates: verdict file schema, `gates.mjs check`, `experiments/gates.sh` for run scripts | `packages/pit-wall/src/gates.mjs`, `experiments/gates.sh` | `test/gates.test.mjs` |
| 2 | Task pointer → contexts, arms | `src/realrepo/task.mjs`, `materialise.mjs` | `test/realrepo-task.test.mjs` |
| 3 | Images with node and dependencies | `build-images.sh` | in-image (`run-g4.sh`) |
| 4 | End-state capture by git (ignore rules, size limits) | `shims/realrepo/state-capture.mjs` | `test/realrepo-task.test.mjs`, in-image |
| 5 | Run recording through the `node` wrapper | `shims/realrepo/node-wrapper.sh`, `recorder.mjs` | `test/realrepo-recorder.test.mjs`, in-image |
| 6 | Hidden checks, collisions, Q4, controls | `shims/realrepo/hidden-run.mjs` | `test/realrepo-task.test.mjs`, in-image |
| 7 | Caller registration for R2, three cap variants, "opened" hook | `src/realrepo/callers.mjs` | `test/realrepo-callers.test.mjs` |
| 8 | Jev audit: typed questions, windows, levels, ledger with a stop at 2 USD, dry run | `src/graders/process/judge/jev-audit.mjs` | `test/judge-jev-audit.test.mjs` |
| 9 | No subject content in tracked files | `src/realrepo/gq-content.mjs` | `test/realrepo-gq-content.test.mjs` |

## Gates in a run script

```
source experiments/gates.sh exp48 G5,G4,G2      # ends the script (exit 4) unless all three say PASS
```

A verdict file is `gates/exp48/<gate>.json` (`gate`, `verdict`, `date`, `written_by.role` / `role_id` / `lineage`, `inputs` with commit ids or sha256, `numbers`, `open_items`). The designer may write none; the implementer may not write G4, G4b, G2, G1, G5. An input given with a path and a sha256 must still have that hash.

## G4

```
bash experiments/exp48/run-g4.sh            # inside WSL; phases: unit images checks recorder capture hidden leak collect
```

Writes the raw result `gates/exp48/G4.result.json`. **The verdict `gates/exp48/G4.json` is written by another role.** The two samples under `samples/` are instrument samples picked mechanically (the two most recent `fix` commits on `main` that touch only `src/lib/**` and `tests/unit/**`, with a test and a non-test file); they are not tasks.

Report of what was built, measured and assumed: `implementation-report.md`.
