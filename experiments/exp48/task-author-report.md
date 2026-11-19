# EXP-48 task author report — stage 1 (filter and candidate list)

Date: 2026-11-13. Role: task author (plan 34 §3 "作成役"). Counts and ids only; no GQ source, test, diff or issue text is in this file.
Not read: skill text, the GQ harness files (CLAUDE.md, `.claude/`, `docs/sessions/`), plan 34 §5, `11-dev-role-design.md`.
No model was used on the tasks themselves. The hidden-check classification (§5) was done by sub-agents of the same model family reading test code; that is a judgement, not a mechanical result.

Files: `select-candidates.mjs` (filter), `verify-candidates.mjs` (local runs), `hidden-check-signals.mjs` (aids), `candidates.json` (pointers), `hidden-check-classification.json` (counts). Local only: `local/exp48-gq/` (cache, clone, work tree, raw reports, `author-notes.md`).
Rebuild: `select-candidates.mjs fetch` → `select` → `verify-candidates.mjs` → `select`.

## 1. Funnel

| Stage | In | Out |
|---|---|---|
| 0 closed issues labelled `type:fix` | 725 | 725 |
| 1a closed by ≥1 merged PR (GitHub link or closing keyword in PR body) | 725 | 568 |
| 1 exactly one non-excluded fixing PR, COMPLETED, PR closes one issue | 568 | 445 |
| 2 ≤20 files and ≤800 lines | 445 | 369 |
| 3 ≥1 unit test and ≥1 non-test `src/` file | 369 | 183 |
| 4 no excluded path | 183 | 57 |
| 6 no added line (≥20 chars) verbatim in the issue body | 57 | 50 |
| 7 ordered | 50 | 50 (heavy 5, normal 45) |
| 5 / 5b examined (local run + classification) | 50 | **19 usable** |

Stage 1 losses: no merged closing PR 157, PR closes several issues 102, several fixing PRs 12, only bot/back-merge/integration 7, not COMPLETED 2.
Largest single-reason rejections (items that fail one criterion only): `.svelte` 42, no `src/` file 16, no unit test 10, `tests/e2e/` 9, added exclusions (static/site/storybook) 7, leak 7, lines 4, integration test 2.

Outcome of stage 5 / 5b over the 50 (an item can carry several codes):

| Code | Items |
|---|---|
| S5B implementation-bound | 15 |
| U5 not verifiable on this machine (dependency drift) | 14 (5 of them are also implementation-bound, 1 also reads a stripped path) |
| S5 hidden test does not fail before the fix | 5 |
| S5 hidden test reads a stripped harness path | 2 |
| S5 depends on a changed path outside tests + `src/` | 1 |

## 2. Usable counts

- **Usable: 19** = 16 primaries + **3 reserves (8 were asked for)**. Behavioural 10, mixed 9. Among the 16 primaries: behavioural 8, mixed 8.
- "At least 16": yes, exactly 16 plus 3. "At least 10 behavioural": 10 only if the reserves are counted; **8 among the primaries**.
- Up to 8 more could become usable after a run in the implementer's image: the U5 items that are not implementation-bound and do not read a stripped path (static orders 5, 7, 25, 26, 27, 31, 34, 37, 39 → 9 items; 2 heavy among them).
- The plan's stop point (1) (fewer than 6) is not reached at this stage. The independent re-derivation has not been done.

## 3. Things that contradict the plan's assumptions

1. **Population link.** GitHub links an issue to a PR only when the PR targets the default branch. With that link alone, stage 1 yields 192 and the static filter passes 8, all merged in 2026-04/05. I added closing keywords parsed from the PR body (any base branch); this gives 445 and 50. The plan's figure of 514 does not match either count (499 by GitHub link incl. integration PRs, 568 with keywords).
2. **Strata.** Heavy items are 5 of 50 (3 of 19 usable). "Half from each stratum" cannot be met; the order alternates until heavy runs out (positions 1, 3, 6 of the primaries are heavy).
3. **Issue names the files.** 41 of 50 static-pass items name a changed implementation file in the issue (30 by full path). Among the usable 19: 18. This is above the "more than half" trigger of review §6 item 1; only 1 usable item is in the "not named" stratum, so it cannot be a stratum.
4. **Hidden-check validity.** 15 of 50 are implementation-bound and 18 mixed; only 17 are purely behavioural. In mixed items the bound cases would fail a different correct fix unless they are removed from the hidden check.
5. **Stage 4 is the main loss** (183 → 57), mostly `.svelte`.
6. **Old dependencies.** No pre-fix commit has the lock file of the current tree; fix trees from 2026-06/07 and earlier need packages that have since been removed. One image per lock file (or per task) is needed.

## 4. Choices where the plan left a threshold open (all in `candidates.json` → `threshold_choices`)

| Id | Choice made | Alternative | Effect seen |
|---|---|---|---|
| T1 | fixing PR = GitHub link or closing keyword, exactly one | GitHub link only | 445 vs 192 at stage 1; 50 vs 8 static pass |
| T2 | PR must close exactly one issue | keep multi-issue PRs | −102 at stage 1 |
| T3 | lines = additions + deletions | additions only | 4 single-reason rejections |
| T4 | unit test = `tests/unit/**/*.test.ts` or `src/**/*.test.ts`; `tests/integration/` rejects | allow integration tests | 2 single-reason rejections |
| T5 | `*.svelte.ts` excluded with `.svelte` | only `.svelte` | 8 items carry the code, 0 single-reason |
| T6 | DB: also files named `*schema*` under `src/lib/server/db/` | migration directories and `.sql` only | 1 single-reason |
| T7 | also `.env*`, Dockerfile, `.storybook/`, `site/`, `static/`, `*-baseline/`, playwright config | plan table only | 7 single-reason (all `site/`·`static/`·`.storybook/`) |
| T8 | leak = added line ≥20 non-space chars verbatim in body | ≥30 | 7 rejected vs 5 |
| T9 | "names a file" = full path or bare file name | full path only | 41 vs 30 of 50 |
| T10 | heavy = `priority:critical`, hotfix branch/label, or 再発 in a title | also 再発 in the body | heavy 5 of 50 |
| T11 | alternate heavy/normal, newest merge first, PR number, seeded hash | all heavy first | — |
| T12 | no cutoff rule applied | keep only merges after the cutoff | cutoff 未確認 |

Further choices in stage 5 / 5b (also for the reviewer):
- Mixed items are kept; only items with zero behavioural cases are dropped.
- A fix tree that fails locally while the lock file differs is recorded as "not verifiable" (U5), not as a rejection.
- A hidden test that mentions a stripped harness path is rejected (2 items), since arms A/B/C cannot pass it.
- The stage-1 link definition was changed once after the first run showed 8 results (see §3.1). No other parameter was changed after results were seen; the split of the exclusion codes left the order identical.

## 5. Verification done (per candidate in `candidates.json` → `verification`)

Environment: Windows, node v22.22.2, one shared `node_modules` copied from a current checkout plus 4 packages added for old commits; lock file equal to the commit's: **0 of 50**. Network not cut; environment variables reduced to system ones (no secrets present). Harness paths removed from the work tree before every run (arms A/B/C tree).

For the 19 usable items, all true:
- hidden tests on the pre-fix tree fail (3 runs, same result); on the fix tree they pass (3 runs, same result);
- pre-fix tree + hidden tests + the fix's `src/` paths only → pass (no dependency on other changed paths);
- hidden tests do not mention a stripped path.
- Hidden test files that exist only after the fix: 13 of 50 items have all-new test files; the rest modify existing files (per path: `hidden_tests[].exists_before`).
- Total wall time for the 19: 934 s (hidden tests only; 36–124 s per item, including tree reset).

## 6. Not verified

- **Existing tests of the same directories before/after** (plan stage 5): run for 1 item only (about 100 s per run; both green). Left to the implementer's image.
- **14 items (U5)**: fix tree not runnable here because of dependency drift.
- Exact dependencies, Linux, cut network, time limit: implementer's image (G4).
- Training cutoff: 未確認 (the subject model id is not fixed in what I read). Merge months of the 19 usable: 2026-04 ×3, 06 ×1, 07 ×7, 08 ×5, 09 ×1, 10 ×2. Of the 50: 04 ×6, 05 ×2, 06 ×11, 07 ×14, 08 ×12, 09 ×2, 10 ×3.
- Classification: 4 sub-agents, 7 of 50 items spot-checked by me; no second independent classifier; `unsure_cases` is recorded per item. Reasons with code: `local/exp48-gq/author-notes.md`.
- Issue edited after the merge, issue created after the PR, images in the issue body: recorded as flags per item, not used to reject (among the 19 usable: 2, 0 and 1 items).
- Memory probe, re-derivation, fixture materialisation: not part of this stage.
