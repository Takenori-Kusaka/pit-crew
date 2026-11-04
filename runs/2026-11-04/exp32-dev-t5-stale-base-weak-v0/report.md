# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-03T15:28:12.694Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 6/9 (67%; 35%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 7/9 (78%; 45%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| t5-stale-base-weak | 5/9 (56%; 27%–81%) |

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
| t5-stale-base-weak | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/ganbari-quest-v0-full@/dev / t5-stale-base-weak #8: `cat bin/quote; ls docs/sessions
python3 - <<'E'
p='tests/price_test.sh'
s=open(p => command not found` |
