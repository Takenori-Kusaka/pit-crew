# pit-wall report: fix

- runner: harbor / model: claude-haiku-5-5 / runs: 5 (scored: 5) / 2026-11-11T15:04:41.558Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-g1 | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-g1 | 0/5 (0%; 0%–43%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-g1 | 0/5 (0%; 0%–43%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-g1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-g1 | 3 / 2 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 2 | path:subjects/fix-skill-default@/fix / fx-g1 #1: `Bash` |
