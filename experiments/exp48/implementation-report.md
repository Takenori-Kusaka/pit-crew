# EXP-48 instruments — implementation report (基盤の実装役)

## Round 3 (2026-11-13, the second build round resumed after the C: incident) — all 28 candidates verified in their images (26 in the first run, which the memory-pressure reaper killed; the rest after the owner approved a restart)

### Restart (owner: "片付けてから再開"; 16:19–16:58) — these totals supersede the first-run numbers below

- Memory before the restart: Windows host 18,884 MB free of 32,695 MB; WSL 9,356 MiB available. During it (logged every minute, `local/exp48-gq/verify/host-mem.tsv`, 60 samples): host free 11,735–20,417 MB; WSL available 9,218–9,370 MiB. Nothing was killed. 18 other teammates had been stopped by the team lead to free memory.
- Docker before: only what the restart needed (`realrepo-tree:v03-abc`, `realrepo-deps:fcf0edab088e`, `realrepo-node:22.23.2`; nothing to remove). One job, `EXTRA_ABC="leak recorder capture" image-verify.sh v03 v23 v06 v07 v09`, one docker job at a time: v07 225 s, v06 304 s, v09 219 s, v03 644 s, v23 1,071 s. After: every `pitwall/realrepo-*` image removed and the build cache pruned (docker images 1.057 → 0.784 GB, build cache 0; the 0.784 GB left are other experiments' images); `~/.cache/pit-wall/exp48-verify` deleted. E: free 66,249 MiB before and after; peak docker images + cache over both runs 9.88 GB (shared layers counted twice).
- **Sieve stage 5: 24 of 28 pass** — all 17 usable that ran to a result (v01 v02 v03 v06 v09 v14 v15 v16 v19 v23 v24 v29 v30 v32 v35 v46 v49) and 7 of 9 drift (v05 v25 v26 v27 v31 v34 v37). Fail: v07, v39 (drift; the hidden checks pass before the fix), v08 (siblings fail before and after on the A/B/C tree), v17 (600 s limit, no result).
- **History: 56 checks (28 × 2 trees)**: fix commit absent 56/56, 0 unreachable objects, 1 ref, 0 remotes, 0 reflog, `log` / `blame` work 56/56; 0 harness paths in any A/B/C commit (28/28). Fix-line search: 4,344 keys, **18 hits in 4 candidates** (v03: 1 blob, an earlier version of a design document, 2026-05-29..30; v15 and v17 as below; v23: 3 blobs, earlier versions of one repository file, 2026-05-15..06-04), each a line that was in the real history before the pre-fix commit and that the fix re-added. Reviewer decides whether that is a hint.
- **Leak / recorder / capture on the rebuilt images (5 candidates: v03 v06 v07 v09 v23)**: `/tests` absent from the image without the mount 5/5; hidden files present in the image with the same bytes 0/5; recorder: 13/13 forms recorded, output and exit codes the same with and without the wrapper (0 differing lines) 5/5; capture 0.7–2.0 s, 0.24–0.97 MB, 0 ignored paths, `node_modules` not in it, fixture intact 5/5.
- **gh**: task issue answered 54/56 tree images. The 2 failures are v03 (both trees): the same defect as v06 / v07 / v09 (issue 3960 filed ~6 h after the pre-fix commit); v03's context had been prepared before the fix. It is now re-prepared (the snapshot holds the issue), **its image was not rebuilt**. Over all 28, the defect affects exactly v03, v06, v07, v09; v06, v07, v09 were rerun with the fix and answer correctly.
- **D's hooks**: 25 of 28 have a settings file (earlier "23" counted 26 candidates); 520 runs, 0 blocked, 0 hook failures, 0 time-outs.
- Result files rewritten: `image-verify.json` (verified 28, stage5Pass 24), `G4.result.json`. `no-gq-content` passes for my files and still STOPS on `candidates.json:2533-2534` (the author's file).

### Incidents (facts)

1. **C: full (round 2).** Corrected account: the round-2 run died in the first candidate's build; the previous implementer had added about 8–10 GB to the WSL disk, which then lived on C:; C: was already near full. C: reached 0 bytes and WSL would not start. Since then the WSL disk is `E:\wsl\Ubuntu-24.04\ext4.vhdx`; all EXP-48 images, the build cache and `~/.cache/pit-wall/exp48-*` had been deleted before this round.
2. **Memory-pressure reaper (this round).** The verification ran 08:23–12:03 in one background `wsl.exe` launched from this session. At about 12:04 the Claude Code host killed that process and both of my watcher shells ("stopped because the system is running low on memory while the session was idle"); the WSL VM then stopped (12:48: `wsl -l -v` Stopped). Evidence: the three task notifications; the last log line `v01: 432 s`; the last disk sample `built v03 abc exit 0` at 12:03:46; `v03-abc-hidden.err` exists with 0 bytes (v03's "no change" control had just started). No OOM line in the VM's kernel log, but the VM restarted, so that log is not conclusive. The largest container peak in the run was 4,591 MiB (v17), under the 6,144 MiB cap; I did not log host memory. **Per the owner's standing rule it was not restarted.** Half-written: only `v03-build-abc.json` (complete) and the empty `.err`; no partial result JSON. v03 and v23 have no in-image result. Left in docker: `pitwall/realrepo-tree:v03-abc` (2.96 GB) and `pitwall/realrepo-deps:fcf0edab088e` (2.69 GB), kept so that a resume does not rebuild them; `docker rmi` them if no resume is approved.
3. **Defects found in the image and fixed before the full run**: (a) `dotgit.tar` was written on Windows with uid 197609; docker `ADD` keeps the owner and git refused the repository ("dubious ownership"; every build failed). `writeHistory` now writes `--owner=0 --group=0 --numeric-owner` (test added). (b) The history phase passed `maxBuffer: 1 << 31`, negative in JavaScript, so `cat-file --batch` threw and no result was written; now `1 << 30`, chunks of 500, explicit error. (c) `image-verify.mjs prepare` had prepared 27 of 28 candidates WITHOUT the gh stand-in, jq and graphify (only v14 had them, via `materialise.mjs`); prepare now passes the same options as `run-g4.sh`; all 28 were re-prepared.

### Results (`experiments/exp48/image-verify.json`; pointers and numbers only)

| Item | Result |
|---|---|
| 1. History in all arms | 26 candidates × 2 trees = **52 history checks in the image**: one ref (`main`), 0 remotes, 0 reflog entries, HEAD = fixture, clean tree; **fix commit absent 52/52** (`cat-file -e` fails, `git show` exit 128, not an ancestor); **0 unreachable / dangling objects** (`fsck --unreachable --no-reflogs`); `log` and `blame` work 52/52. A/B/C: **0 harness paths in any commit** (26/26). Fix-line search: 3,770 line keys (lines of ≥ 30 non-blank characters the fix adds that are not in the pre-fix tree) against every blob ≤ 1 MiB (≤ 56,403 objects, ≤ 25 s): **10 hits in 2 candidates** — v15: 1 blob (an earlier version of a test file, 2026-08-07..08, 1 line); v17: 4 blobs (earlier versions of one repository file under two paths, 2026-03-02..04-04, 1 line each); the same in both trees. These lines were in the real history before the pre-fix commit and the fix re-added them; the fix commit itself is absent. Whether they are a hint: reviewer |
| Mentions of the issue / fix PR in history | 5 of 28 (v01, v08, v23, v32, v46), 1 commit each; the same at depth 200 and 50 |
| Full vs shallow | `dotgit.tar`: full 43–96 MiB (A/B/C 696–2,990 commits); depth 200 30–83 MiB (200–1,311 commits); depth 50 26–80 MiB (50–400 commits — git counts depth along every parent). 2–10 s to make at any depth. Sums over 28 (A/B/C): 1,808 / 1,156 / 1,031 MiB. The image differs by the archive only. **Reviewer chooses**; the build uses full history (`task.history_depth` / `--depth`) |
| 2a. gh stand-in | 52 tree images: fix PR → exit 1 with no output 52/52; a future number → exit 1 52/52; snapshot in the work tree 0/52; writes, comments, `auth status`, `api user` → exit 1, counted. Task issue answered 46/52, jq 46/52. **The 6 failures (v06, v07, v09, both trees) were a defect**: their issue was filed 5–9 h after the pre-fix commit and the snapshot cut it. Fixed in `gh-snapshot.mjs` (the task issue is always there, open; `lastNumber` not raised; test added); the three contexts are re-prepared, **their images not rebuilt**. Proposal unchanged: gh identical in all arms |
| 2b. graphify | `graphifyy` 0.9.107, Apache-2.0, 191 MiB with python3; in D where `graphify-out/` is tracked (6 of 28: v08, v14–v17, v19). `--help` 6/6; `explain <impl file>` offline exit 0 with output 5/6 (1.7–2.7 s); **v19: exit 1, Python traceback** (stderr not kept; not investigated). The `networkError` flag is a text match that also hits output words: not evidence of a network call |
| 2c. D's hooks | 23 of 28 have a settings file; 0 permission rules. 4 hook scripts (prevent-qa-account-pr in 23, gate-approve 18, heavy-run-lock / -unlock 9 each). Run without an agent, 8 ordinary Bash calls each: **472 runs, 0 blocked, 0 hook failures, 0 time-outs**. Their gh calls: `gh --version` (answered) and `gh auth status` (refused) once per candidate; both guards let the call through when gh is not logged in. Proposal: run them unchanged; whether a guard that sees no account keeps its intent: reviewer |
| 3. B6 / B5 / R2 / quota | `crossCheck`, `gradeE1` (per file), `gradeE2` (lint only) from round 2; **new `readTrial()`** wires R2 (registration = `registerCallers`, cutoff = first implementation edit, caps 3 / 5 / none) with E1, E2 and the cross-check per trial (test added). quota.sh: the 6 call-site files (10 lines) keep `|| exit 3`; `quota.test.sh` 7/7 under WSL |
| 4. In-image verification | **26 of 28 run** (v03, v23: reaped). Sieve stage 5 on the A/B/C tree (no change fails the hidden checks, reference passes them, siblings pass before and after, Q4): **22 pass** — usable 15 of 17 run (v01 v02 v06 v09 v14 v15 v16 v19 v24 v29 v30 v32 v35 v46 v49), drift 7 of 9 (v05 v25 v26 v27 v31 v34 v37). Fail: v07, v39 (drift: the hidden checks already pass before the fix); v08 (6 sibling tests fail before and after on the tree without harness files; D's tree not run); v17 (hidden + 334 sibling files exceed the 600 s limit before and after: no result). Each control once (the plan asks for 3). Verifier 13–645 s; container peak ≤ 4,591 MiB |
| Builds | node layer 0.98 GB (kept); dependency layer per lock file 1.90–2.51 GB, 92–179 s (18 builds); tree images 2.13–3.00 GB cumulative, 12–63 s (55 builds); 3–24 min per candidate end to end |
| Disk | E: free 66.25–67.15 GB throughout (the vhdx had room inside and did not grow); docker images + build cache at most 8.44 GB (shared layers counted twice). The 40 GB / 15 GB stops never fired |
| Unit suite | 321 tests, 318 pass, 0 fail, 3 skipped (Windows; temp on E: outside the repository — with a temp inside the pit-crew tree one recorder test fails because git finds the parent repository) |
| no-gq-content | passes for every file I changed; **still STOPS on `candidates.json:2533-2534`** (the author's file) |
| Arm B | `materialise.mjs arm … B` places exactly `experiments/exp48/arm-b-requirements.md` by default; the arm facts record its sha256 (test added) |

### Not done / not run
- (Updated after the restart) v03's tools phase with the fixed snapshot (image not rebuilt). `leak` / `recorder` / `capture` ran on 5 rebuilt images only, not on all 28; `run-g4.sh` samples not rerun. Each control once (the plan asks for 3).
- Harbor `run()` with the controls (§11.C step 5) and the weak-model smoke (step 8): not run.

### Against review §11.C (nine steps to G4)
1 done (owner). 2 done in code (list, 6,144 MiB); the environment-facts text is the author's. 3 **not passing** (`candidates.json:2533-2534`). 4 in-image part 28/28 (24 pass); re-derivation and re-ordered hash: other roles. 5 not done (needs the re-ordered list; Harbor oracle, no model). 6 document exists (other role), wiring done. 7 done. 8 **needs a model**: not run. 9 other role.

### To review
The 10 fix-line hits (v15, v17); the depth; v08's sibling failures and v17's time-out; the snapshot rule for a task issue filed after the commit; D's guards passing everything without a gh login; v19's graphify traceback.

---

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
