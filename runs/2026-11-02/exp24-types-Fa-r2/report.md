# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-02T11:53:06.565Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/Fa@/dev |
|---|---|
| t5-stale-base-start | 5/5 (100%; 57%–100%) |
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/Fa@/dev |
|---|---|
| t5-stale-base-start | 5/5 (100%; 57%–100%) |
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/Fa@/dev |
|---|---|
| t5-stale-base-start | 5/5 (100%; 57%–100%) |
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/Fa@/dev |
|---|---|
| t5-stale-base-start | – |
| t6-false-memo-midway | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/Fa@/dev |
|---|---|
| t5-stale-base-start | 4 / 1 / 0 |
| t6-false-memo-midway | 5 / 0 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | path:subjects/dev-structure/Fa@/dev / t5-stale-base-start #4: `* lib/* tests/price_test.sh scripts/verify.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
