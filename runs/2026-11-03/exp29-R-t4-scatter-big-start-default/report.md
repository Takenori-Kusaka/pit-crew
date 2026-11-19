# pit-wall report: structure-big

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T08:21:24.537Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t4-scatter-big-start | 13/20 (65%; 43%–82%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t4-scatter-big-start | 20/20 (100%; 84%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t4-scatter-big-start | 13/20 (65%; 43%–82%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t4-scatter-big-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t4-scatter-big-start | 15 / 5 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 5 | path:subjects/dev-structure/MskillD1@/dev / t4-scatter-big-start #5: `ad; bash tests/price_test.sh; bin/receipt 999; bin/quote 999 => /bin/bash: line 1: bin/receipt: Permission denied` |
