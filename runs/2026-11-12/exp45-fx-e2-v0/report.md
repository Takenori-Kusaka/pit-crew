# pit-wall report: fix

- runner: harbor / model: claude-haiku-5-5 / runs: 30 (scored: 30) / 2026-11-11T21:02:21.042Z
- **1 run(s) had a check that could not decide.** They are shown as "undecidable" next to the scores, not counted as passes or failures. See "Run validity".
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| fx-e2 | 27/29 (93%; 78%–98%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| fx-e2 | 29/30 (97%; 83%–99%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| fx-e2 | 26/29 (90%; 74%–96%) + 1 undecidable |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| fx-e2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| fx-e2 | 29 / 1 / 0 |

| fault | count | example |
|---|---|---|
| check-undecidable | 1 | path:subjects/ganbari-quest-v0-full@/dev / fx-e2 #24: `task-done` |
