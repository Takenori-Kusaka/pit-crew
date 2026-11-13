# EXP-48 filter — test vectors for `filter-spec.md` v1

Synthetic shapes only (no subject content). Numbers are invented. `T` = the spec's input time. "Fix PR" = a PR merged at T, head `fix/x`, base `develop`, human author, squash-merged (1 parent, subject ends `(#<pr>)`), unless stated. "Good diff" = `src/lib/a.ts` (M, 10 lines) + `tests/unit/lib/a.test.ts` (M, 20 lines); at `pre_fix_commit` the directory `tests/unit/lib/` also holds `b.test.ts`, `c.spec.ts`, `fixtures/d.test.ts`. "Good issue" = created and closed (`COMPLETED`) before T, label `type:fix` since creation, body unedited and shares no code line with the diff.
Implement each as an in-memory fixture (issue, PRs, timeline, name-status, numstat, added lines, `ls-tree`) and assert the result.

| # | Shape | Expected |
|---|---|---|
| V1 | Good issue #10; fix PR #11, body `Closes #10`; good diff | **task**. `link_source=["keyword"]`; `impl_paths=["src/lib/a.ts"]`; `hidden_fix_tests=["tests/unit/lib/a.test.ts"]`; `hidden_sibling_tests=["tests/unit/lib/b.test.ts"]` (`c.spec.ts` is not a unit test; `fixtures/d.test.ts` is in a subdirectory); `hidden_check_paths` = union of the two |
| V2 | As V1, plus integration PR #12 (head `develop`, base `main`, title `[統合] …`, author Bot) that GitHub records as the `closer` of #10 and whose body also says `Closes #10` | **task**, same values as V1 (P = #11). #12 counts at 1a and is excluded at 1 |
| V3 | Good issue #20; the only merged linked PR is a back-merge PR (head `back-merge/y`) | rejected at **1**, `only_excluded_prs` |
| V4 | Good issue #30; fix PR #31 body `<!-- Closes #999 -->\nFixes #30, #32` where #32 is another existing issue | **task** if the diff is good: the comment is removed and the comma list references only #30, so #31 closes one issue. Variant V4b: body `Fixes #30\nresolves: #32` → rejected at **1**, `pr_closes_several_issues` |
| V5 | Good issue #40; two human fix PRs #41 (`Fixes #40`) and #42 (`Fix #40`, a follow-up merged later) | rejected at **1**, `several_fixing_prs` |
| V6 | Issue #50: `type:fix` label added after T (no labeled event ≤ T), otherwise good | not in stage 0 (counted in stage-0 `in`, not in `out`); no rejection record |
| V7 | Issue #60 closed before T, reopened before T, closed again after T; otherwise good | not in stage 0 (open at T; not in stage-0 `in`) |
| V8 | Good issue #70; fix PR #71; diff = good diff + rename `src/lib/old.ts` → `src/lib/new.ts` (similarity 100%) + `tests/e2e/x.spec.ts` (D) | name-status (`--no-renames`): `D src/lib/old.ts`, `A src/lib/new.ts`, …; rejected at **4**, `excluded_path`, detail `3` (`tests/e2e/**` matches the deleted file). Without the e2e file: **task**, `impl_paths=["src/lib/a.ts","src/lib/new.ts"]` |
| V9 | Good issue #80; fix PR #81 good diff plus `graphify-out/graph.json` (M, 5,000 lines) and `src/lib/server/db/schema.ts` (M) | `graphify-out/` ignored for size; rejected at **4**, detail `9` (`src/lib/server/db/**/*schema*`) |
| V10 | Good issue #90 whose body contains `    const total = items.reduce(sum, 0);` and the diff adds `const total = items.reduce(sum, 0);` (indented differently) | rejected at **6**, `body_leak` (trimmed line, 31 non-space characters, is a substring of the body). Variant: added line `return x + y;` (10 non-space chars) also in the body → not a leak |
| V11 | Fix PR merged by rebase: 1 parent, `commits.totalCount = 3`, subject without `(#<pr>)` | rejected at **1**, `merge_shape` |
| V12 | Order: passing tasks H1 (heavy: issue title contains `再発`, merged 2026-09-01), H2 (heavy: label `priority:critical` on the PR, merged 2026-08-01), R1 (2026-10-01), R2 (2026-07-01T00:00:00.000Z, PR #100), R3 (same time, PR #300), R4 (same time, PR #200) | `static_order`: H1=1, R1=2, H2=3, R3=4, R4=5, R2=6 (heavy runs out after position 3; equal times by PR number descending) |

Notes for V12: equal `mergedAt` means equal to the millisecond as returned by the API. `heavy` is set on the task in the output.
