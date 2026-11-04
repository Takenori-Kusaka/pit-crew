# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 4) / 2026-11-02T14:21:38.104Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t5-stale-base-weak | 3/4 (75%; 30%–95%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t5-stale-base-weak | 4/4 (100%; 51%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t5-stale-base-weak | 3/4 (75%; 30%–95%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/F@/dev |
|---|---|
| t5-stale-base-weak | 4 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/dev-structure/F@/dev / t5-stale-base-weak #4: `cat >> tests/price_test.sh.new <<'EOF'
EOF
rm tests/price_test.sh.new
python3 -  => command not found` |
