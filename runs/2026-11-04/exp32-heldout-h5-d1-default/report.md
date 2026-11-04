# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-03T16:22:00.769Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-d1 | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-d1 | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-d1 | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-d1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| h5-d1 | 8 / 2 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | path:subjects/dev-structure/MskillD1@/dev / h5-d1 #4: `convert   head -30; bin/convert 1 ft m; bin/convert 12 in ft => /bin/bash: line 1: bin/convert: Permission denied` |
