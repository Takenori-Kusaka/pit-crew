# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-03T13:55:28.525Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 4/10 (40%; 17%–69%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 4/10 (40%; 17%–69%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 7 / 3 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 3 | path:subjects/ganbari-quest-v0-full@/dev / t5-stale-base-weak #1: `ests/price_test.sh scripts/verify.sh; ls docs; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
