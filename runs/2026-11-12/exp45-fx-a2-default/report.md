# pit-wall report: fix

- runner: harbor / model: claude-haiku-5-5 / runs: 30 (scored: 30) / 2026-11-11T18:08:56.953Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-a2 | 20/30 (67%; 49%–81%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-a2 | 23/30 (77%; 59%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-a2 | 19/30 (63%; 46%–78%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-a2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-a2 | 19 / 11 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 11 | path:subjects/fix-skill-default@/fix / fx-a2 #2: `Bash` |
