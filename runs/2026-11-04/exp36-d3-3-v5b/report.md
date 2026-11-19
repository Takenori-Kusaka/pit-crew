# pit-wall report: d3

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 18) / 2026-11-03T23:46:57.767Z
- **2 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| d3-3 | 18/18 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| d3-3 | 18/18 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| d3-3 | 18/18 (100%; 82%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| d3-3 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1V5b@/dev |
|---|---|
| d3-3 | 18 / 0 / 2 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 2 | path:subjects/dev-structure/MskillD1V5b@/dev / d3-3 #5: `cat vendor/imgtool/resize.sh; grep -rn "imgtool\ testgen" --exclude-dir=.git .   => Exit code 127` |
