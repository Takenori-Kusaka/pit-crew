# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 9 (scored: 8) / 2026-11-01T23:24:00.659Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2 / 0 / 1 | 3 / 0 / 0 | 3 / 0 / 0 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/dev-structure/F@/dev / t1-parallel-start #3: `cat bin/*; cat lib/*; cat tests/price_test.sh scripts/verify.sh; git show 828750 => Exit code 126` |
