# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 9 (scored: 9) / 2026-10-31T08:07:19.887Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 2/3 (67%; 21%–94%) | 3/3 (100%; 44%–100%) | 1/3 (33%; 6%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +33 pt | -29 … +75 pt | **inconclusive** |
| path:bad-control vs vanilla | -33 pt | -79 … +38 pt | **inconclusive** |

## protocol

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +24 … +99 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -45 … +45 pt | **inconclusive** |

## overall

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +24 … +99 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -45 … +45 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0/3 | 3/3 | 3/3 |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 0 / 3 / 0 | 0 / 3 / 0 | 0 / 3 / 0 |

| fault | count | example |
|---|---|---|
| runner-noise:cwd-tracking-readonly | 20 | vanilla / vendor-question #1 |

## Case validity (controls: good = current, bad = path:bad-control)

Every case separates the good control from the bad one, with room above the baseline.
