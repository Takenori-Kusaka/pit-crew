# pit-wall report: structure-big

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-02T14:37:21.289Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillR@/dev |
|---|---|
| t4-scatter-big-start | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillR@/dev |
|---|---|
| t4-scatter-big-start | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillR@/dev |
|---|---|
| t4-scatter-big-start | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillR@/dev |
|---|---|
| t4-scatter-big-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillR@/dev |
|---|---|
| t4-scatter-big-start | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | path:subjects/dev-structure/MskillR@/dev / t4-scatter-big-start #4: `ce_test.sh; for n in 999 100 1 0 1000; do bin/price $n; done => /bin/bash: line 1: bin/price: Permission denied` |
