# pit-wall

Harness-agnostic evaluation for AI coding-agent harnesses (skills, plugins, rule files).
It runs the same cases with and without a harness, grades the agent's trajectory, and
reports per-dimension pass rates with honest intervals, and whether each run and case
was valid at all.

## Layout

| Path | What it is |
|---|---|
| `src/suite.mjs` | L3 contract: `suite.yaml` names the subject, arms, controls and cases |
| `src/patterns/` | L2 behavioral patterns (conflicting docs, out-of-authority request, self-approval bait) |
| `src/graders/`, `src/judge.mjs` | Deterministic graders and pit-wall's own LLM judge (same judge for every runner) |
| `src/validity.mjs` | Run validity (ok / suspect / invalid), case discrimination, answer-leak lint |
| `src/stats.mjs`, `src/report.mjs` | Jeffreys intervals, three-valued verdicts, Markdown report |
| `src/runners/` | Runner adapters: `claude-plugin-eval`, `harbor` |
| `src/normalize/` | Trajectory normalizers (Claude stream-json, ATIF) |
| `docker/agent-<agent>/` | Agent images for the Harbor runner |
| `shims/` | Stand-ins for external CLIs (`gh`), so no run touches a real service |

## Requirements

- Node.js 20+
- Runner `claude-plugin-eval`: Claude Code with `claude plugin eval` (Linux needs bubblewrap and socat for its sandbox)
- Runner `harbor`: [Harbor](https://github.com/harbor-framework/harbor) (Apache-2.0) and Docker Engine. Docker Desktop is not required.

## Quick start

```bash
npm install
pit-wall lint suites/_examples/evaluator-check/suite.yaml          # no model calls
pit-wall image build claude-code                                   # once, for the harbor runner
pit-wall run suites/_examples/evaluator-check/suite.yaml --runner harbor --out out/
pit-wall regrade out/results.json suites/_examples/evaluator-check/suite.yaml   # no model calls
```

## Checking a case before any model runs

A case is evidence only after it is shown to tell good work from bad. These commands make no model calls:

- **Scripted controls.** A case may define shell scripts that act as solvers (`scripts:`) and the outcome each must land in (`script_expect:`). Run them as arms `script:<name>` with the harbor runner (Harbor's oracle agent runs them in the same container an agent would get). `pit-wall controls <results.json> <suite.yaml>` regrades the stored end states and fails if any script lands elsewhere.
- **Contrast groups.** `groups:` in a suite names cells that differ in one factor and the shortcut scripts they must defeat. A shortcut is a complete solver that picks by a surface feature (for example, always the newest value). `controls` also fails if a shortcut is right in every cell of its group, or was not run in one.
- **Answer leakage into the case.** `pit-wall lint <suite.yaml>` fails if a protocol target appears in the case materials.
- **Case material leaking into the harness.** `pit-wall leak <suite.yaml> [--arms a,b] [--strict]` reports numbers, paths, words and 4-word phrases that the text given to an arm (skills, or an `append:` policy) shares with each cell. It is lexical: a paraphrased example is not caught.

State-graded cases (`evidence-arbitration`) are graded on the repository's end state: a dated git history built per case (`history:`), files the agent may write (`writable:`), evidence files that must not change except for lines matching `evidence_allow`, and a priority-ordered list of outcomes. `expect.shell` is `open` (default) or `listed`; a listed shell denied ordinary investigation commands in a pilot, so it is kept only for preflight probes.

## Judge by effects

A check should ask what the run *did*, not how the command was spelled. Matching the gh
command log rejects equivalent calls (flag order, `--flag=value`, a URL instead of a number,
`-R`, `--body-file`, `gh api` instead of `gh issue edit`). Read these instead; all are written
outside the workspace, in the container, and a check (`checks:` in a cell) can read them:

| File | What it holds |
|---|---|
| `/tmp/pitwall-gh-state.tsv` | The effects of the gh calls, one fact per line: `item<TAB>12<TAB>label<TAB>needs-x`. Kinds: `label`, `label-removed`, `assignee(-removed)`, `reviewer(-removed)`, `comment`, `state` (`open` / `closed` / `merged`), `state-reason`, `draft`, `review<TAB><EVENT><TAB><body>`, `title`, `body`, `base`; created PRs and issues as `created-pr<TAB><i><TAB><field><TAB><value>` / `created-issue ...`. Tabs, newlines and backslashes in text are written `\t` `\n` `\\`. |
| `/tmp/pitwall-gh-state.json` | The same, as JSON (`items`, `created`). Captured into the end state: `state.gh` in graders. |
| `/tmp/pitwall-gh-state.unparsed` | Calls left out of the state, with the reason: unknown subcommands, unknown flags, forms the shim cannot read without guessing (`gh pr ready` with no number, a body from an editor, graphql). `state.ghUnparsed`. |
| `/tmp/pitwall-runs.log` | Runs of documented commands marked with `pitwall-mark-run`: `<name><TAB><UTC time><TAB><exit><TAB><tree>`, `<tree>` = content hash of the working tree when the run was recorded (empty if unavailable). `state.runs` = rows `{ name, ts, code, tree }`; the final tree, hashed the same way after the agent ends, is `state.finalTree`. |
| `/tmp/pitwall-gh.log` | The raw command log, unchanged (`state.commands.gh`). |

What counts as the same effect:

- Issues and PRs share one number space (as on GitHub): `gh pr edit 12 --add-label x` = `gh issue edit 12 --add-label x`.
- A reference may be `12`, `#12`, an issue / PR URL, or `owner/repo#12`. `-R` / `--repo` is ignored (one repository per cell).
- Labels, assignees and reviewers are sets of *net* changes: `a,b`, `b, a`, repeated flags and separate calls are the same; adding then removing `x` is the same as removing it.
- Text comes from `--body`, `--body-file` / `-F` (a file or `-` for stdin), `gh api -f body=` / `-F body=@file` or `--input` JSON. It is compared after CRLF -> LF and trailing whitespace removal. Comments keep their order. Boolean flags never take or overwrite a value, wherever they stand.
- `gh issue|pr comment --edit-last` replaces the session's last comment on the item with the new text (the same state as `--delete-last` followed by a new comment); `--delete-last` removes it. Every comment in the state is the agent's own, so "the current user's last comment" is the last one in the state (comments by others in `.github-cache` fixtures are not in it). With no comment to act on, gh fails: the call has no effect and goes to the unparsed file, except `--edit-last --create-if-none`, which creates the comment. `--web` / `--editor` take the body outside the call: unparsed.
- `gh api` calls to the matching REST endpoints (labels, comments, assignees, requested reviewers, issue / PR PATCH of state, title, body and base, reviews, merge, creating PRs and issues) give the same state as the gh subcommands. GET calls are reads.
- Reads (`view`, `list`, `checks`, `diff`, `status`, GET) change nothing. Nothing is guessed: a call the shim cannot read goes to the unparsed file, not into the state.

Example checks:

```bash
grep -qxF $'item\t12\tlabel\tneeds-x' /tmp/pitwall-gh-state.tsv                    # labelled
grep -qE  $'^item\t12\tcomment\t.*(ADR-7|adr-7)' /tmp/pitwall-gh-state.tsv          # commented, naming the ADR
cut -f1,3 /tmp/pitwall-runs.log | grep -qx $'check\t0'                              # the documented check ran and passed (at some point)
pitwall-ran-on-final check                                                          # ... and passed on the final tree (0 / 1 / 2)
```

**Marking a documented command.** Put the marker in the project's own command (part of the
fixture), so it is recorded however the agent invokes it (`./tools/check`, `bash tools/check`,
`sh tools/check`, `make check`, from another script):

```sh
#!/bin/sh
trap 'pitwall-mark-run check $?' EXIT        # record this script's exit code
...                                          # the real check
```

or `exec pitwall-mark-run check -- <real command>`. The marker keeps the exit code. The Harbor
image installs it as `/usr/local/bin/pitwall-mark-run`; `experiments/structure/check-cells.mjs`
puts it on PATH too. Runs and gh calls made by the checks themselves are written elsewhere, so a
check that runs the test suite does not count as the agent having run it.

**Ran on the final tree.** "Did it ever run" is not the question when the agent edits after
running the check: the evidence is stale. Ask whether the documented command ran *after the last
change*, on the final working tree, and passed. Every marked run records a content hash of the
working tree: a git tree id of all tracked files and all untracked files that are not ignored, as
they are on disk, taken from the root of the repository that contains the current directory
(`git rev-parse --show-toplevel`) when the run is recorded (after the command ends). It is computed
in a temporary index (a copy of the real one, so a tracked file stays tracked even if it matches an
ignore rule) and a temporary object directory; the real index and object store are not touched.
`state-capture.sh` hashes the final tree the same way after the agent ends, before the checks run.

- Shell (in a check): `pitwall-ran-on-final <name>` exits 0 if some run of `<name>` recorded the
  final tree with exit 0; 1 if it never ran or every passing run was on another tree (an edit
  came after it, or the rerun failed); 2 if undecidable (no git, the hash could not be computed,
  or a passing run has no tree). Declare the check `tristate: true`. It reads the agent's runs
  (`$PITWALL_AGENT_RUNS_LOG`, default `/tmp/pitwall-runs.log`) and the final tree that
  `state-capture.sh` passes in `$PITWALL_FINAL_TREE`, so what the checks change or run does not
  move it; without that variable (e.g. `check-cells.mjs`) it hashes the tree when the check runs.
  `pitwall-mark-run --tree` prints the current tree's hash.
- JS (a grader): `ranOnFinal(record, name)` from `src/runners/harbor.mjs` (a record or a state)
  returns `true` / `false` / `null` with the same meaning.

Editing a file back to its earlier content gives the same tree, so a run on that content counts.
A later failing run on the same tree does not cancel an earlier pass on it (same content).

**Three outcomes.** A check exits 0 = followed, 1 = not followed, 2 = undecidable (the end state
cannot tell, e.g. a call went to the unparsed file: `[ -s /tmp/pitwall-gh-state.unparsed ] && exit 2`).
Declare such a check `tristate: true` (in `convention-adherence`: on the convention or the task;
in a `state-check` grader: `params.tristate`). An undecidable result is neither pass nor fail: the
run's outcome becomes `undecidable` when a rule it might satisfy comes first, the report shows it
as "+ N undecidable" next to the scores, and the run gets the validity fault `check-undecidable`
(suspect: reported, not dropped). A check not declared tristate keeps the old meaning: any
non-zero exit is "not followed".

Limits: one repository per cell (`-R` is ignored); label names are compared as written
(GitHub matches them without case); `@me` is kept as written; `gh pr create --fill`, a missing
`--base` or `--head` are recorded as given, not resolved. The tree hash is of the repository that
contains the directory where the run was recorded (a trap in a script that `cd`ed out of it hashes
another tree or none); nested repositories count by their HEAD only, and clean filters (e.g. Git
LFS) run when hashing, so a missing filter makes the hash unavailable. The files are inside the container,
like the raw log, so a root agent could edit them (docs/planning/03-validity.md §6.3).

## Agent images (harbor runner)

Each agent has one Dockerfile under `docker/agent-<agent>/`. `pit-wall image build <agent>`
builds it locally and tags it `pitwall/agent-<agent>:<version>` and `:latest`, reading the
version back from the built image. Every case becomes a small task image `FROM` that
agent image plus the case fixtures, so the agent is installed once, not once per run.

- The run fails fast if the image is missing, and prints the build command.
- `PITWALL_AGENT_IMAGE_TAG` selects a tag other than `latest`.
- Each record stores the image reference and id it ran on.
- The claude-code image is built from Anthropic's official installer and contains Claude Code,
  which is distributed under Anthropic's terms. Keep it local; do not push it to a public registry.

## Authentication and cost

pit-wall never uses metered API billing: `ANTHROPIC_API_KEY` is removed from every child process.

- `claude-plugin-eval` and the judge use the logged-in Claude subscription.
- `harbor` passes a subscription OAuth token into the container through the environment
  (never argv). Create it with `claude setup-token` and store it, without echoing it, in
  `~/.config/pit-wall/oauth-token` (mode 600), or point `PITWALL_OAUTH_TOKEN_FILE` elsewhere.

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `PITWALL_CLAUDE` | `claude` | Claude Code binary for plugin eval and the judge |
| `PITWALL_HARBOR` | `harbor` | Harbor binary |
| `PITWALL_HARBOR_CONCURRENCY` | `3` | Trials run at once by Harbor |
| `PITWALL_AGENT_IMAGE_TAG` | `latest` | Agent image tag for the harbor runner |
| `PITWALL_CLAUDE_VERSION` / `PITWALL_PIN_LOCAL_VERSION` | unset | Pin the agent version (only for runner-agreement checks; must match the image) |
| `PITWALL_OAUTH_TOKEN_FILE` | `~/.config/pit-wall/oauth-token` | Subscription OAuth token for the harbor runner |

## Reading a report

Read the validity sections before the scores. Invalid runs are excluded and announced at the
top; cases that cannot tell the good control from the bad one are flagged. The threat model
behind these checks is in `docs/planning/03-validity.md`.
