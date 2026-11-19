# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-02T04:37:25.288Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-midway | 5/5 (100%; 57%–100%) |
| t1-parallel-rush | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-midway | 5/5 (100%; 57%–100%) |
| t1-parallel-rush | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-midway | 5/5 (100%; 57%–100%) |
| t1-parallel-rush | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-midway | – |
| t1-parallel-rush | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-midway | 5 / 0 / 0 |
| t1-parallel-rush | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | path:subjects/dev-structure/F@/dev / t1-parallel-rush #5: `e_test.sh README.md; git show HEAD   head -60; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
