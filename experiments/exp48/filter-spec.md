# EXP-48 task filter — complete specification (v1)

Author: reviewer (査読役), 2026-11-14. Owner decision 2026-11-14 00:0x (`docs/planning/00-owner-statements.md`, last entry): make the rules complete, then the task author and a new re-deriver both re-run the filter on this text and agreement is checked mechanically.
Written from: plan 34 v1 (`e174a850b`), v2 (`e3a0974fb`), current; `34-review-g5.md` §11.A and §12.6; the "Choice made" column of `task-author-report.md` §4; the re-deriver's `ambiguities.md`. Not read: the author's scripts, `candidates.json`, any derived list.
Citations: `v1:N` = `git show e174a850b:docs/planning/34-dev-real-failure-evaluation-plan.md` line N; `v2:N` = same at `e3a0974fb`; `plan:N` = current file; `rev:N` = `docs/planning/34-review-g5.md`. "Reviewer" = decided here, with the reason given.
This file holds rules only. **Every choice is fixed; an implementer who finds a case not covered stops and reports it (it is not theirs to decide).**

## 0. Constants

| Name | Value |
|---|---|
| `REPO` | `Takenori-Kusaka/ganbari-quest` (public) |
| `T` (input time) | `2026-11-12T16:16:17.055Z` (`rev:836`) |
| `SEED` | `exp48-filter-spec-v1` |
| Git | a full (or blobless) clone of `REPO`; all diffs with `git -c core.quotePath=false diff --no-renames --no-ext-diff` |
| Time compare | ISO-8601 UTC, inclusive: "at T" means `≤ T` |

## 1. Data to fetch (GitHub GraphQL; REST names in brackets)

- **Issues** (all, any state): `number, title, body, createdAt, lastEditedAt, labels{name}`, `userContentEdits(first:100){editedAt diff}`, `timelineItems(itemTypes:[CLOSED_EVENT, REOPENED_EVENT, LABELED_EVENT, UNLABELED_EVENT, RENAMED_TITLE_EVENT]){ … createdAt; ClosedEvent{stateReason closer{__typename ... on PullRequest{number}}}; LabeledEvent/UnlabeledEvent{label{name}}; RenamedTitleEvent{previousTitle currentTitle} }`.
- **Pull requests** (all, any state): `number, title, body, createdAt, lastEditedAt, merged, mergedAt, baseRefName, headRefName, author{__typename login}` [REST `user.type`], `mergeCommit{oid}`, `commits{totalCount}`, `labels{name}`, `userContentEdits`, `closingIssuesReferences(first:50){nodes{number}}`, `timelineItems(itemTypes:[LABELED_EVENT, UNLABELED_EVENT, RENAMED_TITLE_EVENT])`.
- Anything with `createdAt > T` does not exist for this filter. An item deleted since T cannot be recovered: record it under `unrecoverable` (§7) and treat it as absent.

### 1.1 State at T (time dependence)

- **Text at T** (issue body, PR body): if `lastEditedAt` is null or `≤ T`, the current text. Otherwise the `diff` of the `userContentEdits` node with the largest `editedAt ≤ T` (that field holds the full text of that version); if none is `≤ T`, the oldest node's text. Record the item under `edited_after_T` (§7).
- **Title at T**: current title, unless a `RenamedTitleEvent` has `createdAt > T`; then the `previousTitle` of the earliest such event.
- **Label L at T**: the last `Labeled/UnlabeledEvent` for name L with `createdAt ≤ T` decides (labeled → present). No such event: present iff L is in the current labels **and** no event for L exists after T.
- **Issue closed at T**: the last `ClosedEvent`/`ReopenedEvent` with `createdAt ≤ T` is a `ClosedEvent`. Its `stateReason` is the state reason at T (`null` counts as `COMPLETED`).
- **PR merged at T**: `merged = true` and `mergedAt ≤ T`.
- Text normalisation for every body/title: CRLF and CR → LF; Unicode NFC.

## 2. Terms

- **Closing keyword reference** (A3). Take the PR body at T and first delete: HTML comments `<!-- … -->` (non-greedy, across lines; an unclosed `<!--` deletes to the end), fenced code blocks (a line starting with ```` ``` ```` or `~~~` to the next fence of the same kind, or to the end), and inline code spans (`` `…` `` on one line). Then match, case-insensitive:
  `(?<![A-Za-z0-9_])(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):?[ \t]+(#|Takenori-Kusaka/ganbari-quest#|https://github\.com/Takenori-Kusaka/ganbari-quest/issues/)([0-9]+)(?![0-9])`
  One keyword = one reference (`Closes #1, #2` references only #1). The number must be an **issue** of `REPO` that exists at T; PR numbers and other repositories are dropped. PR titles and commit messages are not read.
- **Link of PR P to issue N** (A2): any of (a) a `ClosedEvent` of N with `createdAt ≤ T` whose `closer` is P; (b) N in `P.closingIssuesReferences`; (c) a closing keyword reference to N in P's body at T. `link_source` = the sorted subset of `["closer","closing_ref","keyword"]` that holds.
- **Candidate fixing PRs of N** = PRs merged at T that link to N.
- **Excluded PR** (A1; `v2:74` "bot・back-merge・統合 PR を除く", `v1:65`) — any of: `author.__typename == "Bot"` or login ends with `[bot]`; `headRefName` is `develop` or `main`, or starts with `release/` or `back-merge/`; title at T starts with `[統合]`; title at T matches `/back[- ]?merge|back into develop/i`.
- **Issues closed by PR P** = the distinct issue numbers N' of `REPO` (created ≤ T, any state, any label) such that P links to N' by (a), (b) or (c) — the same link relation as above, read from P's side (A4). For (a), scan the `ClosedEvent`s of all fetched issues.
- **fix_commit** = `P.mergeCommit.oid`. **pre_fix_commit** = `fix_commit^1` (first parent) (A13). Merge shape, from `git cat-file -p fix_commit`: 2 parents → merge commit, accepted; 1 parent and `commits.totalCount == 1` → accepted; 1 parent, `totalCount ≥ 2`, and the commit subject contains `(#<P>)` → squash, accepted; otherwise → **rebase merge, rejected** (the first parent is not the pre-fix state). More than 2 parents → rejected.
- **Changed files** = `git diff --no-renames --name-status pre_fix_commit fix_commit`, minus every path under `graphify-out/` (`v1:66`, `v2:75`). With `--no-renames` a rename is a `D` of the old path plus an `A` of the new one; `T` (type change) counts as `M`. Paths are repo-relative POSIX, as git prints them (unquoted, NFC).
- **Unit test file** (`T4`): path matches `tests/unit/**/*.test.ts` or `src/**/*.test.ts`.
- **Test-like file**: basename matches `*.test.*` or `*.spec.*`.
- **impl_paths** (A14): changed files with status `A` or `M`, under `src/`, not test-like, not excluded (§3). Reviewer: plan's "実装ファイル" (`v2:88`) and stage 3's "テスト以外の `src/`" (`v2:76`); a deleted file cannot be opened by the agent (R-items read "登録した実装ファイル"); `scripts/`/`docs/` are not the implementation the request is about.
- **hidden_fix_tests** (A15): changed unit test files with status `A` or `M` (as they are at `fix_commit`). These are the tests that must fail before and pass after (`v2:78`), used for Q1 (`v1:126`, `plan:174`).
- **hidden_sibling_tests** (A15): for each directory D = dirname of a path in `hidden_fix_tests`, every path from `git ls-tree -r --name-only pre_fix_commit` whose dirname is exactly D (non-recursive), that is a unit test file, is not in `hidden_fix_tests`, and has no `D` status in the changed files. These are the "existing tests of the same directory" that must pass before and after (`v2:78`), used for Q2 (`v1:127`).
- **hidden_check_paths** = sorted union of the two. Reviewer, on "fix tests, siblings, or union": the plan names both and gives them different roles — `v1:76` "修正 PR のテスト（落ちる → 通る）と、同じディレクトリの既存テスト（通る → 通る）"; `plan:104` keeps the same phrase; Q1 and Q2 read them separately. So both are emitted separately and the union is the "hidden-check paths" of `rev:837`. "Same directory" is read literally (not "under"): non-recursive.
- **Added lines** (A8): `git diff --no-renames -U0 pre_fix_commit fix_commit -- . ':(exclude)graphify-out/'`, lines that start with `+` but not `+++ `, minus the leading `+`; all files (tests included: the plan says "修正の追加行", `v1:70`, `v2:80`).
- **Heavy** (A11; `T10`, `v2:82`): any of — label `priority:critical` at T on N or on P; the substring `hotfix` (case-insensitive) in P's `headRefName` or in the name of any label at T on N or P; the substring `再発` in N's or P's title at T. Body text is not read.
- **Names a file** (A9; `T9`, `v2:81` "捨てない"): for some p in `impl_paths`, the issue body at T contains p, or contains basename(p) with no `[A-Za-z0-9_.\-/]` immediately before or after it. Recorded only.

## 3. Excluded paths (stage 4; A7)

Glob semantics: minimatch 9 with `{dot: true, nocase: false, matchBase: false}` against the repo-relative path; `**` matches zero or more directories. A changed file of **any** status (A, M, D) matching any pattern rejects the task. `graphify-out/**` is not checked (it is ignored entirely).

| # | Pattern(s) | Source |
|---|---|---|
| 1 | `**/*.svelte` | `v1:68`, `v2:77` |
| 2 | `**/*.svelte.ts` | `T5` (`rev:458`) |
| 3 | `tests/e2e/**` | `v1:68` |
| 4 | `tests/integration/**` | `T4` (`rev:457`) |
| 5 | `infra/**` | `v1:68` |
| 6 | `.github/**` | `v1:68` |
| 7 | images: `**/*.{png,jpg,jpeg,gif,webp,avif,svg,ico,bmp,PNG,JPG,JPEG,GIF,WEBP,AVIF,SVG,ICO,BMP}` | `v1:68` "画像"; extension list: reviewer (raster + vector + icon formats) |
| 8 | DB migrations: `drizzle/**`, `src/lib/server/db/**/migration/**`, `src/lib/server/db/**/migrations/**`, `**/*.sql` | `v1:68` "DB の移行"; reviewer: the subject's migration code lives in those directories; `tests/unit/**/migration/**` is a test, not a migration, and is not excluded |
| 9 | DB schema: `src/lib/server/db/**/*schema*` | `T6` (`rev:459`) |
| 10 | lock files: `**/package-lock.json`, `**/npm-shrinkwrap.json`, `**/pnpm-lock.yaml`, `**/yarn.lock` | `v1:68` "依存の変更（lock ファイル）"; `package.json` alone is not excluded |
| 11 | `**/.env*` | `T7` |
| 12 | `**/Dockerfile*` | `T7` |
| 13 | `.storybook/**`, `site/**`, `static/**` | `T7`, deviation 2 (`plan:91`) |
| 14 | `**/*-baseline/**` | `T7` |
| 15 | `**/playwright*.config.*` | `T7` |

## 4. Stages (applied in this order; an issue leaves at the first stage it fails)

| Stage | Population / predicate | Rejection codes (first that applies) |
|---|---|---|
| 0 | Issues with `createdAt ≤ T`, closed at T, label `type:fix` at T | (not counted: outside the population) |
| 1a | ≥ 1 candidate fixing PR (excluded PRs count here) | `no_merged_linked_pr` |
| 1 | state reason at T is `COMPLETED`; exactly one candidate fixing PR is not excluded (call it P); P closes exactly one issue (N itself); P's merge shape is accepted | `not_completed`, `only_excluded_prs`, `several_fixing_prs`, `pr_closes_several_issues`, `merge_shape` |
| 2 | changed files ≤ 20 and Σ(added + deleted lines) ≤ 800, both over changed files (`git diff --no-renames --numstat`, `-` for binary counts 0 lines but 1 file) | `too_many_files`, `too_many_lines` |
| 3 | ≥ 1 changed unit test file with status A/M, and `impl_paths` non-empty | `no_unit_test`, `no_src_impl` |
| 4 | no changed file matches §3 | `excluded_path` (record the first matching pattern #) |
| 6 | no added line L leaks: let L' = L trimmed (leading/trailing whitespace); L leaks iff L' has ≥ 20 non-whitespace characters and is a substring of the issue body at T (T8, `rev:461`) | `body_leak` |
| 7 | ordering only (no rejection) | — |

Stage 5 (execution, 5b) is not part of this specification (`rev:837`); its results come from the image.
Stage numbering follows the plan; 6 is applied before 7 and 5 (`plan:77-84`).

**Static order (stage 7; A10, A12; `T11`, `rev:464`, `v2:82`).** Input: the tasks passing stages 0–6. Split into heavy H and normal R. Sort each by `mergedAt` descending, then PR number descending, then `sha256(SEED + ":" + issue)` hex ascending. Interleave starting with H: H1, R1, H2, R2, …; when one group is exhausted, the rest of the other follows in its order. If H is empty, the order is R. `static_order` = 1-based position. (Reviewer: PR number descending keeps "newest first" for equal timestamps; the hash is reached only if two tasks share a PR, which stage 1 forbids, but it is fixed so the rule is total.)

## 5. Edge cases (decided)

1. **Integration / release PR that also closes the issue** (A1): it is a candidate fixing PR (stage 1a) but excluded at stage 1; it does not make "several fixing PRs". If it is the only candidate → `only_excluded_prs`.
2. **Several closing references to one issue in one PR**: one link; the PR still closes one issue.
3. **Two non-excluded merged PRs link the issue** (e.g. a fix and a follow-up "Fixes #N"): `several_fixing_prs`, whatever their merge order or base branch. Closed (unmerged) PRs never count.
4. **Reopened issue**: state at T per §1.1; closed → reopened → closed again is closed. Links made while it was open still count.
5. **Label added after T**: absent at T (§1.1). Label removed after T: present at T.
6. **Edited bodies**: text at T (§1.1) for keywords and for the leak/naming checks.
7. **Squash vs merge commit**: §2 (`merge_shape`). A PR merged into a non-default branch (develop, a feature or release branch) is handled the same way; its `mergeCommit` is on that branch.
8. **Renamed files**: `--no-renames` everywhere: both paths are counted (stage 2), both checked (stage 4); only the new path can enter `impl_paths`/`hidden_fix_tests`.
9. **Deleted files**: count for size; checked for exclusion; never in `impl_paths`/`hidden_*`. A sibling deleted by the fix is not a sibling.
10. **Files outside `src/` and `tests/`** (`scripts/`, `docs/`, harness files, `package.json`): count for size, checked for exclusion, not in `impl_paths`; they neither satisfy nor block stage 3.
11. **Issue referenced in a PR that is itself a PR number**: dropped (not an issue).
12. **`src/**/*.spec.ts`**: test-like (not impl), not a unit test.

## 6. Output (both implementers emit exactly this; `filter-output.json`)

UTF-8, LF, `JSON.stringify(obj, null, 2)` with keys in the order shown; arrays sorted as stated.

```json
{
  "spec": "experiments/exp48/filter-spec.md@<sha256 of this file>",
  "input_time": "2026-11-12T16:16:17.055Z",
  "fetched_at": "<ISO time of the implementer's fetch>",
  "counts": [ {"stage": "0", "in": 0, "out": 0}, {"stage": "1a", …}, {"stage": "1", …}, {"stage": "2", …}, {"stage": "3", …}, {"stage": "4", …}, {"stage": "6", …}, {"stage": "7", …} ],
  "rejections": [ {"issue": 0, "stage": "1", "code": "several_fixing_prs", "detail": "<pattern # for excluded_path, else empty>"} ],
  "tasks": [ {
    "issue": 0, "pr": 0, "link_source": ["keyword"], "merged_at": "<ISO>",
    "pre_fix_commit": "<40 hex, lowercase>", "fix_commit": "<40 hex>",
    "heavy": false, "static_order": 1,
    "impl_paths": [], "hidden_fix_tests": [], "hidden_sibling_tests": [], "hidden_check_paths": [],
    "names_impl_file": true
  } ],
  "edited_after_T": [0], "unrecoverable": [0]
}
```

- `counts.in` of stage 0 = number of issues with `createdAt ≤ T` and closed at T; `out` = those also labelled `type:fix` at T. Each later `in` = previous `out`. Stage 7 `in = out`.
- `rejections` sorted by issue ascending; `tasks` by `static_order`; `edited_after_T` / `unrecoverable` = sorted numbers (issues and PRs together, prefixed `"I"`/`"P"` as strings, e.g. `"P123"`).
- Every path list: unique, sorted by UTF-16 code unit (`Array.prototype.sort()` default), POSIX `/`, no leading `./`.

**Agreement (for the comparison script; `rev:838`).** Per issue in the union of both outputs' stage-0 sets: agree iff both put it in `tasks` or both reject it, and, if in `tasks`, `pre_fix_commit`, `fix_commit`, `impl_paths`, `hidden_fix_tests`, `hidden_sibling_tests` are equal. Order agrees iff the agreed tasks have the same relative `static_order` in both. Rejection codes and stages are compared and reported but do not decide agreement.

## 7. Answers to the re-deriver's ambiguities

- **A1** Integration/release/back-merge/bot PRs are excluded from "the fixing PR" — `v2:74`, `v1:65`; definition in §2. They still count at 1a (author's stage-1 loss list names "only bot/back-merge/integration" as a stage-1 reason, `task-author-report.md` §1).
- **A2** Union of the closer event, `closingIssuesReferences`, and body keywords (§2). `T1` (`rev:454`) "GitHub link or closing keyword"; the closer event is the GitHub link at issue level.
- **A3** GitHub keyword set, optional colon, one reference per keyword, same repo, issues only; HTML comments and code are removed first. Reviewer: unrendered or code-quoted text (template placeholders) is not a statement that the PR closes the issue.
- **A4** Count over all issues, any label, from the same three sources (§2). Reviewer: `T2` (`rev:455`) is about the PR being a 1-to-1 fix; a second issue of any type breaks that.
- **A5** Creation, close state, state reason, labels, titles and bodies are all taken at T (§1.1); PR merged at T. `rev:836` names creation and edits; the rest follows the same rule (reviewer: one input time for every fact).
- **A6** Unit test counts with status A/M; "non-test `src/`" = `impl_paths` non-empty (§2).
- **A7** Full list in §3: plan base table (`v1:68`) + `T4`–`T7`.
- **A8** All added lines of all changed files except `graphify-out/`, trimmed, ≥ 20 non-whitespace characters, substring of the body at T (`v1:70`, `T8`).
- **A9** `T9` is not a filter; recorded as `names_impl_file` (`v2:81` "捨てない").
- **A10** Stage 7 = "層と順" (`v2:82`): the static order; no rejection.
- **A11** §2 "Heavy" (`T10`, `rev:463`); head branch only, not base; titles at T; bodies not read.
- **A12** §4 static order; `SEED = exp48-filter-spec-v1`; PR number descending as second key (reviewer, stated there).
- **A13** `fix_commit = mergeCommit.oid`, `pre_fix_commit` = first parent; rebase merges rejected (`merge_shape`). Reviewer: for a rebase merge the first parent already contains part of the fix.
- **A14** `src/` non-test files with status A/M, not excluded (§2, reason there).
- **A15** Both, emitted separately: fix-PR unit tests (A/M) and existing unit tests of the same directory at `pre_fix_commit` (non-recursive), union as `hidden_check_paths` (§2, `v1:76`, `plan:104`).

## 8. What this file does not decide

Stage 5/5b (execution and the behavioural/implementation-bound split; `plan:174`), the memory probe, and the final task order (`rev:853`). If the author's earlier list differs from a run of this specification, that is a deviation to record in `deviations.md` (`plan:92`), not a reason to change this file.
