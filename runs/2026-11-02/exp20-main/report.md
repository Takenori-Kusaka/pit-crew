# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 40 (scored: 37) / 2026-11-02T00:02:10.730Z
- **3 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-start | 10/10 (100%; 72%–100%) | 9/9 (100%; 70%–100%) |
| t2-rename-start | 9/9 (100%; 70%–100%) | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-start | 10/10 (100%; 72%–100%) | 9/9 (100%; 70%–100%) |
| t2-rename-start | 9/9 (100%; 70%–100%) | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-start | 10/10 (100%; 72%–100%) | 9/9 (100%; 70%–100%) |
| t2-rename-start | 9/9 (100%; 70%–100%) | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-start | – | – |
| t2-rename-start | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-start | 10 / 0 / 0 | 9 / 0 / 1 |
| t2-rename-start | 9 / 0 / 1 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 3 | path:subjects/dev-structure/M@/dev / t2-rename-start #7: `cat tests/checkout_test.sh README.md; cat .github-cache/issue-57.md; git log --o => Exit code 126` |
