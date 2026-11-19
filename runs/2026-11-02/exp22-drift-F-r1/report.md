# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 6 (scored: 6) / 2026-11-02T08:54:41.667Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-start | 3/3 (100%; 44%–100%) |
| t2-rename-start | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-start | 3/3 (100%; 44%–100%) |
| t2-rename-start | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-start | 3/3 (100%; 44%–100%) |
| t2-rename-start | 3/3 (100%; 44%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-start | – |
| t2-rename-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t1-parallel-start | 2 / 1 / 0 |
| t2-rename-start | 2 / 1 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | path:subjects/dev-structure/F@/dev / t1-parallel-start #2: `ify.sh README.md; git show 8287509   head -50; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
