# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T09:58:31.440Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-b1 | 18/20 (90%; 70%–97%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-b1 | 19/20 (95%; 76%–99%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-b1 | 17/20 (85%; 64%–95%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-b1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-b1 | 19 / 1 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 1 | path:subjects/dev-structure/MskillD1@/dev / h5-b1 #18: `Bash` |
