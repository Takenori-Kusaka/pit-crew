# Adopting role-harness v1 in an existing product

v1 has two parts. The **core** (role cards in `skills/`, subagents in `agents/`) is the same for every
project and is never edited. The **adapter** (`adapter/ADAPTER.template.md`) holds everything that is
specific to your project. The roles look up adapter items by key.

Plan for one sitting. Most of the work is finding what your project already has, not writing new rules.

## Step 1. Inventory what the product already has

Collect, without changing anything yet:

| Look for | Typical places |
|---|---|
| Entry instructions | root `CLAUDE.md`, any `CLAUDE.md` in subfolders, `AGENTS.md`, `CONTRIBUTING.md` |
| Inbox / status labels | issue tracker label list; labels used on the last 20 closed items and change requests |
| Who approves what | branch protection, code owners, review rules, any "owner only" list |
| Branches and merge methods | default branch, integration branch, release branches, recent merge commits |
| Commands | `package.json` scripts / Makefile / task runner; CI workflow files |
| Documents | design docs, decision records, "files that must change together" lists, templates |
| Existing role instructions | skills, agent files, team charter |

Write down what you find, with paths. Where two sources disagree, note both; do not pick yet.

## Step 2. Map it to adapter items

Copy `adapter/ADAPTER.template.md` into the project, for example `docs/HARNESS-ADAPTER.md`.
Go through the groups in this order (each later group depends on the earlier ones):

1. **Approval rules** (`approval.*`). Who is the owner, which operations are irreversible, who may
   approve whose changes, what counts as a blocking reason. Decide these first: every role refers to them.
2. **Hand-off labels** (`handoff.*`). One inbox label per role, plus review / blocked / ready-to-merge,
   on-hold and the exemptions for orphan detection. If the project has no labels yet, create the set.
   If it has a different mechanism (columns on a board, assignees), describe it in `handoff.labels`
   and `handoff.poll` in the same terms: "how an item enters a role's inbox, and how that role lists it".
3. **Branching and merge** (`branch.*`, `merge.*`, `release.*`).
4. **Commands** (`commands.*`). Copy commands exactly as they run today. Run each once.
5. **Documents** (`docs.*`) and **record formats** (`records.*`). Prefer links to existing templates.
6. **Policies** (`policy.*`). If the project has no stated policy, write `none` and what happens instead.

Rules while mapping:
- Map what exists. Do not invent new conventions while filling the adapter; that mixes two changes.
- Where sources disagreed in Step 1, decide which one holds now, fix the losing source or mark it
  outdated, and put the winner in the adapter.
- Every row gets a value or `none`. An empty row makes the role guess.

## Step 3. Remove the project values from old role instructions

If the project already has role instructions, move project values (label names, paths, commands,
account names) into the adapter and delete them from the old files, or retire the old files. Two
copies of a rule drift apart.

## Step 4. Install the core and add the entry pointer

1. Install the five skills and five agents (copy `skills/` and `agents/` into the project's
   `.claude/`, or install them as a plugin). Do not edit them.
2. Add the lines from `adapter/CLAUDE.md.snippet` to the root `CLAUDE.md`, with the path to your
   filled adapter. The snippet imports the adapter (`@path`) rather than pointing to it in words.
   This step is required: a conventions file the entry file does not point to was missed in larger
   repositories; one it only points to was read, but a session that delegated work before reading it
   told the delegate to skip a required step; an imported one was never overridden (pit-crew
   EXP-09, EXP-14).
   Optional: if your conventions require actions the agent's built-in git guidance discourages
   (for example committing without being asked), you can also set `includeGitInstructions: false`
   in `.claude/settings.json`. This removes that guidance for every session, so decide it for the
   project as a whole.
3. Start a role session as that role (for example start with the role's agent, or begin with
   `/<role>`).

## Step 5. Check

Run each check in a fresh session. Look at what the role did, not what it said it did.

| Try | Ask for | Look for |
|---|---|---|
| Dev | a small fix on a real item, delegated with an instruction that contradicts one convention (e.g. "do not label it") | reads CLAUDE.md and the adapter first; follows the convention; says in the report that it overrode the delegation; ends with the review label from `handoff.label_review` |
| QM | review of the change from the Dev check | reads the CI per check name; one line per acceptance criterion; outcome label from the adapter; does not fix implementation itself |
| PO | "should we build X?" for a real request | decision written on the item; next role's label added and own label removed; no implementation |
| Platform | "this check is noisy, remove it" | asks the PO for direction if `approval.check_removal` says so; runs the check to see it fail before and after |
| Audit | "is the current batch releasable?" | uses `release.batch_limit`, `branch.*`, `merge.release_method`; findings as comments, not new items |

Also confirm:
- [ ] Every key that the role cards reference has a value in the filled adapter (list in `SOURCE.md`).
- [ ] No role card file was edited.
- [ ] Each role's session, when asked "where are this project's hand-off labels?", answers from the adapter.
- [ ] A label that exists only in the adapter (not in old instructions) is used correctly.

If a check fails, fix the adapter or the entry pointer first. Change a role card only if the failure
would happen in any project; then record it as a new harness version.
