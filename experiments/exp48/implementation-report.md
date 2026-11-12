# EXP-48 instruments — implementation report (基盤の実装役)

## Round 2 (2026-11-13, after review §11 and the owner's decisions of 05:0x) — STOPPED by the host

**Stopped, not finished.** During the first candidate of the image verification the host's system drive (C:) reached 0 bytes free and WSL no longer starts (`Wsl/Service/CreateInstance/E_FAIL`). Docker's store is inside the WSL disk on C:. I added roughly 8–10 GB there over both rounds; C: was already near full and I do not know what else filled it. I deleted only my own unit-test temp directories on C: (33 MB). I did not shut WSL down, compact its disk or delete anything else: owner's decision. Everything below marked "not run" waits for that. Sections 1–6 further down are round 1 and are **out of date where they say "no history", ".husky removed" or 6 GiB**.

| Item of the second request | State | Numbers / evidence |
|---|---|---|
| 1. History in every arm | **built, unit-tested; in-image not run** | Filtered mirror by git-filter-repo v2.47.0 (MIT): 99 s, 8,405 → 8,279 commits, 963 MiB, 9 patterns (review §11.B1 list; `.husky/` now stays). Per task a fresh fetch of one commit: A/B/C from the mirror at the mapped commit, D from the real clone. Depth measured on sample 1: full 81 / 90 MiB (2,963 / 3,043 commits), 200 → 55 / 64 MiB, 50 → 50 / 57 MiB; 10–12 s each. **Chosen: full history** (+81–90 MiB per image). The tree of the mapped commit is compared file by file with the pre-fix tree minus the removed paths; a mismatch stops the build (it did, correctly, for 3 candidates until their commits were in the mirror). Unit test: no ref but `main`, no remote, fix commit absent, `git show <fix>` fails, no unreachable object, no harness path in any commit of A/B/C, blame works. In-image phase `history` written (fsck, cat-file, every blob scanned for hashes of the fix's added lines): **not run** |
| History mentions of the issue / fix PR | counted for all 28 | 5 of 28 candidates have 1 commit in their history that names the task's issue number or fix PR number (v01, v08, v23, v32, v46); the other 23 have 0 (`image-verify.json`) |
| 2a. gh stand-in | **built, unit-tested (5 tests); in-image not run** | New `shims/realrepo/gh.mjs` + `realrepo/gh-snapshot.mjs`. Answers issue / PR / label reads from a snapshot frozen at the pre-fix commit date; unknown number, unrecorded field, comments, checks, diffs, search, every write → exit 1 with a message, logged and counted; no fabricated PR; `--json` filtered in the program; `--jq` through a static jq 1.7.1 (MIT, 2.3 MB) in the image; snapshot outside the work tree. Source: the author's local cache (725 issues, 2,322 PRs). For candidate v14: 577 issues and 2,001 PRs as of its date; 148 issues and 320 PRs are later and absent; the fix PR is absent |
| gh in A/B/C too? | **proposal: yes, identical in all four arms** (parameter `--gh-arms`, default `all`) | Otherwise C's skill and B's document meet "command not found" where D gets an answer: a difference that is not the harness. All 28 candidates have instruction files that name gh commands |
| 2b. graphify | **available; wired for D; in-image not run** | PyPI `graphifyy` 0.9.107, Apache-2.0, CLI `graphify`, works from `graphify-out/graph.json` without network (`path`, `explain`); 191 MiB installed plus python3. Only 6 of 28 candidates track `graphify-out/` (v08, v14–v19); 8 have instruction files naming graphify. **No hook calls graphify at any candidate commit** (the request assumed some do). The version the project used at each commit is unknown: pinned to the current one |
| 2c. D's hooks and permissions | **static scan done (`d-hooks.json`); run-without-agent phase written, not run** | 25 of 28 candidates have a settings file; **0 have any permission rule**. 4 distinct hook scripts, all `node`: two PreToolUse guards that call gh and can block, a heavy-run lock (PreToolUse, calls git, can block) and its unlock (PostToolUse). None names graphify; one variant reaches the network. Proposal: run them unchanged; the stand-in makes their gh calls fail explicitly; phase `dhooks-run` feeds each hook 8 ordinary Bash calls as Claude Code would and counts exit 0 / 2 / other — if a guard blocks ordinary work because gh is not logged in, the reviewer decides whether the stand-in may answer `gh api user` |
| 3. quota.sh (B8) | **done** | exits when sourced by a script (returns only to an interactive shell); `quota.test.sh` 7/7 incl. "sourced without `|| exit` ends the script"; the existing call sites keep `|| exit 3` and behave the same |
| 3. cross-check (B6) | **built, unit-tested** | `realrepo/items.mjs` `crossCheck`: calls that run a check tool without a record, records without a call, open records. Order-based: the normalised trajectory carries no timestamps (uses them when present) |
| 3. E1 / E2 per B5 | **built, unit-tested** | `gradeE1` by per-file results with the already-red list; `gradeE2` lint only; `redFiles` for R5 / W2. `gradeR2` wraps the caller registration with caps 3 / 5 / none. Not wired into `phases.mjs` (the item table is the designer's) |
| 3. the two guard lines | **done**, behaviour-preserving; `select` reproduces `candidates.json` byte for byte | but see "found" below |
| 4. image verification of 28 candidates | **prepared for all 28; 0 verified** | contexts, verifier inputs and caller counts exist for 19 usable + 9 drift (17 distinct lock files; 17 candidates predate `.nvmrc` and get node 22.23.2 by default). The run died in the first build. `image-verify.json` holds the pointers, history counts and caller N (0–45), with every in-image field null |
| 5. run-g4.sh / G4.result.json | script updated (history, tools, dhooks-run, 6,144 MiB, a free-disk check before every docker step); **result not regenerated in the image** | the round-1 measurements in `G4.result.json` are of images without history and tools |

**Found in this round**
- 3 of the 19 usable candidates (static order 9, 46, 49) have commits that are on no branch of the public repository; they are fetchable by id only. They are now kept under `refs/exp48/keep/` in the local clone. Reproduction by a third party depends on GitHub still serving those ids.
- With the guard widened to the candidates' commits (98 commits, 333,767 line hashes), `no-gq-content` passes for every file of mine but **stops on `candidates.json:2533-2534`** (the author's file; I did not change it). The check does not pass yet.
- Unit suite now: with WSL down, every test that runs a shell script through WSL fails (8 of 291 collected; 280 pass, 3 skip). My own test files: 56 tests, 54 pass; the 2 failures are the WSL-shell tests that passed before the outage. Not re-verifiable until WSL is back.
- I edited two files of the author role (`select-candidates.mjs:346`, `verify-candidates.mjs:83`) as instructed; the review fixed that script's hash (§11.A1), so this is a deviation the author must record.

**Against review §11.C (nine steps to G4)**: 1 done by the owner. 2 done in code (harness list, 6,144 MiB); the environment-facts text is not mine. 3 not passing (candidates.json, above). 4 prepared, not run (host). 5 not run (host); `harbor.mjs run()` still not exercised. 6 other role. 7 done (`crossCheck`). 8 needs a model: not run. 9 other role.

**Assumptions added**: full history; node 22.23.2 where the commit pins none; issues edited after the snapshot date are left out of the snapshot except the task's own; a PR that never merged has no recorded state; graphify at the current version; gh identical in all arms.

**To review**: the mapping through pruned commits (nearest surviving first-parent ancestor, then a tree comparison); commit messages in A/B/C's history still mention the removed files by name; the snapshot rules; the hook-run phase's sample commands; whether docker's store may stay on C:.

---

# Round 1 (below; superseded where noted above)

Date: 2026-11-13. Role: infrastructure implementer (process v2 §5). Not committed, not pushed.
I did not read cell content, verdicts, suites of other experiments or auditor-only files; I did not run a model or a Harbor agent job with a model; I wrote no gate verdict. I read the subject repository (public) from my own clone under `local/exp48-gq/`. Two files in this directory are not mine and I did not open them: `select-candidates.mjs`, `verify-candidates.mjs`.

Numbers below are from `gates/exp48/G4.result.json` (raw, machine-written) and `local/exp48-gq/build/build-times.tsv`. "Sample 1 / 2" are two fix commits picked mechanically (most recent `fix` commits on `main` touching only `src/lib/**` and `tests/unit/**` with a test and a non-test file): PR 5058 and PR 5041. They are instrument samples, not tasks.

## 1. Status per instrument

| # | Instrument | Status | Evidence |
|---|---|---|---|
| 1 | Gate mechanism (schema, `gates.mjs check`, `experiments/gates.sh`) | **built** | 6 unit tests, both directions. The recorded G5 reads as a reviewer PASS; `check exp48 --need G5,G4` stops today because G4.json does not exist |
| 2 | Real-repository fixture (pointer → contexts → 4 arms) | **built**; the harness list is a proposal | 9 unit tests; 2 samples materialised; A/B/C tree = 3,435 − 83 paths (sample 1), 3,431 − 83 (sample 2) |
| 3 | Image with node 22 and the dependencies, offline | **built and measured** | 3 layers; all checks below ran with `--network none` |
| 4 | End-state capture respecting ignore rules | **built** | unit test + in-image: 1.4–1.8 s, 309 KB, 0 ignored paths (node_modules is 1,023–1,098 MiB and is not read) |
| 5 | Run recording | **built** | unit: 13 forms + timeout + kill through the real npm / npx; in-image with the real tools: 13 / 13 forms recorded on both samples, timeout closed with SIGTERM, SIGKILL leaves an open start record |
| 6 | Hidden checks, collisions, Q4, controls | **built and measured** | controls in-image on both trees of both samples, and through Harbor's oracle agent on sample 2 |
| 7 | Caller registration for R2 (3 / 5 / no cap) + "opened" hook | **built**; text-based, not a type checker | 7 unit tests; on the samples N = 6 and N = 1 in 0.5 s each |
| 8 | Jev audit script | **built**; question texts are defaults to be reviewed | 10 unit tests incl. the window cut (evidence in the first window, at a boundary, in the last, nowhere) and the budget stop; 1 real request made |
| 9 | `no-gq-content` | **built**; it currently STOPS | 5 unit tests; on this work tree: 10 generic lines in 8 files match (8 in my files, 2 in files that are not mine) — see §5 |
| — | README, `run-g4.sh`, `G4.result.json` | built | unit suite: 308 tests, 305 pass, 0 fail, 3 skipped (the 3 are the existing harbor-stage tests that skip on Windows) |

Nothing proved infeasible. Stop point (2) of the plan is not reached.

## 2. Measured

**Images** (WSL docker, 8 cores, 9 GiB host): node layer 29–31 s, 980 MB. Dependency layer (`npm ci --ignore-scripts` + `npm rebuild`) 104–175 s, 2.30–2.36 GB cumulative; no compiler was needed (prebuilt native modules). Tree layer 16–34 s; final images 2.48–2.60 GB. One dependency layer per lock file (the two samples have different lock files). Harbor's own build is one `FROM` line, so its 900 s build cap is not in play.

**The project's own checks, offline, on the pre-fix tree** (6 GiB container, sample 1 unless said):

| Check | A/B/C tree | D tree | Note |
|---|---|---|---|
| `vitest run` of the related tests (hidden + siblings: 146 files s1, 104 files s2) | 228 s, exit 0 (s2: 123 s) | 206 s, exit 0 | all pass in both trees |
| `vitest run` (whole unit suite, 941 files, 13.2k tests) | **1,376 s**, exit 1 (s2: 1,392 s) | 1,325 s, exit 1 (s2: 1,411 s) | the project sets `fileParallelism: false`: files run one after another |
| `npm run check` (svelte-kit sync + svelte-check) | **exit 134 after 65–101 s: V8 heap out of memory** | exit 134 | with `NODE_OPTIONS=--max-old-space-size=4096`: 89 s, exit 1, **351 errors** (A/B/C) / 67 s, **332 errors** (D) |
| `npx tsc --noEmit` | 31 s, exit 2, 356 error lines | not run | not the project's type check; red by construction |
| `npx biome check .` | 6.6 s, exit 0 | 7.0 s, exit 0 | |
| `npx eslint` (svelte files) | 12.5 s, exit 0, 16 problems | not run | |
| One test file | 5–7 s | | |

Peak memory of the container: 4.4–4.7 GiB for the whole suite, 1.2–2.0 GiB for the related tests, 2.6–2.8 GiB for svelte-check.

**Already red** (whole unit suite; sample 2 has the failed / skipped split, sample 1 was run before the split and agrees on the differences):

| | D tree (nothing removed) | A/B/C tree | Only because of the removal |
|---|---|---|---|
| Failed test files | 27 (26 fail at collection, all under `tests/unit/infra`; 1 under `tests/unit/scripts`) | 47 (37 at collection) | **20 files**: hooks 7, architecture 5, scripts 4, docs 2, github 2 — the same 20 in both samples |
| Failed tests | 1 | 23 | 22 |
| Skipped files | 4 | 4 | 0 |
| svelte-check errors (larger heap) | 332 | 351 | 19 |

None of the 20 is among the related tests of either sample. Static count for comparison: 101 test files name a removed path (27 of them e2e), so about 74 in the unit suite name one and 20 actually fail.

**Recorder**: what vitest prints with the wrapper equals what it prints without (0 differing lines on both samples after masking durations; the first run of sample 1 showed 1 line, a duration, because my mask ran before the colour codes were stripped — rerun after the fix); exit codes equal; `tsc` output byte-equal.

**Verifier** (capture + hidden checks + Q4): 226–250 s for sample 1 (5 hidden files + 142 siblings = 1,461 tests), 113–120 s for sample 2 (1 + 104 files). Capture alone 1.4–1.8 s. Q4 3.7–13 s per run.

**Controls**: "no change" fails the hidden checks (30 / 34 and 36 / 41 pass), the reference fix passes them (34 / 34, 41 / 41), siblings all pass, in both trees. Through Harbor's oracle agent on sample 2: reference → all pass, no change → fail; 160 s and 153 s wall, no exception. The hidden files and `/tests` are not in the image (17.4k files scanned by hash, 0 found).

**D's settings file** (static, both samples): 3 hook commands (PreToolUse, PostToolUse), all start with `node` (present); no `permissions` entries. What the hook scripts do when an agent runs was not exercised (no model).

**Jev**: one connectivity request, answered; billed 300 input tokens = 0.0000126 USD. Ledger total 0.000013 of 2 USD.

## 3. Assumptions I made (each needs a decision by another role)

1. **Harness-file list** (`harness-files.json`): the plan's five entries plus, proposed by me and marked `sure: false`: every `AGENTS.md` and `GEMINI.md`, `.geminiignore`, `.claudeignore`, `.husky/`. Kept but flagged: `docs/decisions/` (process ADRs), `docs/DESIGN.md` and design docs (some sections address AI agents), `CONTRIBUTING.md`, PR / issue templates, the project's check scripts. Directories emptied by the removal are removed too (their names listed the skills).
2. **No history, no remote, in every arm (D too).** A real history would let `git show` recover the removed files in A/B/C. So R4 cannot be read in any arm. The plan left this to G4 (§3 "履歴を持たせるか"); this is my choice and it removes D's history as well, which the plan's "D = as is" does not say.
3. **C's wiring**: `--skill subjects/dev-skill-default/skills` and the entry `/dev` in front of the request. EXP-32 ran `path:subjects/dev-structure/MskillD1@/dev` (run-exp32.sh); the plan names `dev-skill-default`, whose README says its core is identical to MskillD1. I did not compare the two directories.
4. **B's document** is placed as `/app/CLAUDE.md`, hidden from git through `.git/info/exclude` (the mechanism of `runners/harbor.mjs`). In arm D a root `CLAUDE.md` already exists; B is built on the A tree, so there is no collision.
5. **Gate roles**: the role is `written_by.role_id`, or the first word of `written_by.role` (the recorded G5 has no `role_id`; it reads as `reviewer`). Forbidden: designer everywhere; implementer for G4, G4b, G2, G1, G1b, G5; repairer and author for G1. `PASS WITH CHANGES` does not pass. An input with path + sha256 must still match.
6. **Recorder**: tools are recognised by where the script really is (`node_modules/vitest`, `svelte-check`, `typescript/bin/tsc`, `@biomejs/biome`, `eslint`, `stylelint`, `@sveltejs/kit`, playwright, npm / npx script runs). "Source tree" for E1 = the tree entries of `src` and `tests` (a parameter per task).
7. **Hidden checks** = the test files the reference fix adds or changes; **siblings** = the other test files in the same directories at the pre-fix commit. On a collision the hidden file runs and the agent's file is kept aside and reported.
8. **Verifier limits** set from the measurement: verifier 1500 s, hidden checks 600 s, Q4 300 s per run (`DEFAULT_LIMITS` in `realrepo/task.mjs`); agent 1800 s is a placeholder, not a decision.
9. **Jev**: thresholds 0.7 / 0.3 with an undecidable middle (the vendor's starting values); the question texts in `jev-audit.mjs` are defaults for the audit's designer; tokens are estimated as characters / 2 plus 300 per request.
10. **Content guard**: a line counts from 30 non-blank characters; lines this repository already had at the base commit are not counted; an allow entry counts only with `reviewed_by`.

## 4. Where the plan or the review turned out wrong, or incomplete

1. **The verifier's 120 s is too short** (review §4.1 said "probably"): measured 113–250 s. And the review's remedy is incomplete: **Harbor's default memory limit per container is 1,024 MiB** (`runners/admission.mjs`), below every measured peak (1.2–4.7 GiB). With the default, the related tests alone are killed. `PITWALL_MEM_LIMIT_MIB` must be raised (≥ 6,144 suggested by the peaks), and on this 9 GiB host that means one trial at a time.
2. **"About 67 test files fail after removal"** (review §4.2): 20 fail. The other files that name a removed path still pass.
3. **The whole unit suite takes 23 minutes** in the image, by the project's own setting. The plan's item E1 and the request's environment facts must not assume an agent can run `npm test`: it would spend most of any time limit near the default (agent 900 s in `harbor.mjs`; I set a placeholder of 1,800 s). An arm that runs the whole suite more often loses more — the same shape as the plan's pre-mortem 6, through time instead of turns.
4. **E2 as written cannot be met in any arm.** `npm run check` aborts (heap) unless `NODE_OPTIONS` is set, and when it runs it is red from the start (332 errors in D, 351 in A/B/C). "Ran it" can be recorded; "passed" cannot happen. Whether to set `NODE_OPTIONS` in the image, and whether the 332 are an artefact of this environment (the root install does not install `infra/`'s dependencies — 26 infra test files also fail at collection in D), is not decided here. I did not investigate the cause.
5. **vitest's built-in JSON reporter prints a line** ("JSON report written to …"). The plan's "包む" would have changed what the agent sees. Replaced by a silent reporter of my own; found by the in-image test, not by the unit test.
6. **The plan's list of harness files is incomplete for this repository**: `AGENTS.md`, `GEMINI.md` (root and 5 nested), `.claudeignore`, `.geminiignore`, `.husky/` exist. And `graphify-out/` is absent at both sample commits (git-ignored there).
7. **The plan cites `src/judge/`**; the code is under `graders/process/judge/` (the review already noted this). **The plan cites `harbor.mjs:279-280` for C**; EXP-32's default arm was `subjects/dev-structure/MskillD1`, not `dev-skill-default` (assumption 3).
8. **`experiments/quota.sh` ends a sourcing script only if the caller writes `|| exit`** (`return 3`). My gate helper had the same flaw until its test caught it; it now exits. quota.sh is unchanged (not mine to change).
9. **D keeps no history** in my build (assumption 2). The plan did not see that history and "remove the harness files" conflict.

## 5. What a different agent must review

1. `harness-files.json`: every entry with `sure: false` and the "keep but flagged" list. This decides what arm A is.
2. The no-history decision (R4 unreadable; D not fully "as is").
3. `no-gq-content` currently stops: 5 proposed allow entries for generic lines of my files need `reviewed_by`; 2 more hits are in `select-candidates.mjs` and `verify-candidates.mjs` (not mine, not opened). Also review the rule itself: lines already in this repository at the base commit are exempt, and only `packages experiments docs suites gates` form that baseline.
4. Recorder blind spots: calling the real binary by its path (`/opt/pitwall/node/bin/node`), biome's native binary directly, a different runtime (bun, deno), and a SIGKILL of the wrapper itself leaves the tool running. The record directory is writable by the agent (root in the container). The start record costs one tree hash (about 1 s) before the tool starts.
5. `callers.mjs` reads imports by text. Check it on the real candidates against a second derivation; `blind` in its output lists what it cannot see. The R2 hook is not wired into `phases.mjs`: the grader's rules are the designer's.
6. `jev-audit.mjs`: the nine items' question texts, the 0.7 / 0.3 thresholds, the token estimate, and the rule that a count question (R2 "at least k callers") is undecidable when the excerpt needs more than one window.
7. Hidden-check policy: on a collision the hidden file wins. Siblings = same directory only. Q4 uses `git reset --hard` + `git clean -fd` in place after the capture.
8. The time and memory limits (agent, verifier, container) and whether the request's environment facts list the 47 red files, the svelte-check behaviour and the 23-minute suite.
9. `G4.result.json` → the G4 verdict. Open against the plan's G4 row: "4 arms × 2 tasks × 1 run with a weak model, 0 refusals" and "D's hook failures" need a model and were not run by me.

## 6. Not done / not verified

- No model run of any kind; so no refusal count, no check that B's document or C's skill reaches the context, no hook behaviour in D.
- Harbor end to end was exercised only with the oracle agent, on sample 2, arm A. `runners/harbor.mjs` `run()` was not called with these task directories (it would work on the same layout; not shown).
- `tsc` and `eslint` on the D tree; the cause of the 332 svelte-check errors; the cause of the 26 infra collection failures.
- The memorisation probe, the sieve, the candidates, the requirements document, the correspondence table: other roles.
- The charter sentence for the Jev exception (plan §9 item 9): owner or overall designer.
- A `--all` scan of the 200k tracked files with `no-gq-content` (only the changed files were scanned).
- Nothing is committed. Before a commit: `node packages/pit-wall/src/gates.mjs no-gq-content` must pass.
