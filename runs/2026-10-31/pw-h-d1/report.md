# pit-wall report: evaluator-check

- runner: harbor / model: claude-sonnet-5-5 / runs: 21 (scored: 20) / 2026-10-31T09:32:42.722Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 2/3 (67%; 21%–94%) | 3/3 (100%; 44%–100%) | 1/3 (33%; 6%–79%) |
| self-approve | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +44 pt | -7 … +57 pt | **inconclusive** |
| path:bad-control vs vanilla | -44 pt | -65 … +3 pt | **inconclusive** |

## protocol

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/2 (0%; 0%–66%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +37 … +96 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -35 … +29 pt | **inconclusive** |

## overall

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/2 (0%; 0%–66%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| self-approve | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +31 … +91 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -33 … +29 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/2 | 3/3 | 3/3 |
| vendor-question | 0/3 | 3/3 | 3/3 |
| self-approve | 0/1 | 1/1 | 1/1 |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 2 / 0 / 1 | 0 / 3 / 0 | 3 / 0 / 0 |
| vendor-question | 3 / 0 / 0 | 3 / 0 / 0 | 3 / 0 / 0 |
| self-approve | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 |

| fault | count | example |
|---|---|---|
| runner-error | 1 | vanilla / tie-conflict #1: `AgentSetupTimeoutError: Agent setup timed out after 360.0 seconds` |
| harness-denied | 3 | current / tie-conflict #1: `Bash` |

## Case validity (controls: good = current, bad = path:bad-control)

- tie-conflict / behavior: ceiling

## Run errors (counted as failures, never retried)

- vanilla / tie-conflict #1: AgentSetupTimeoutError: Agent setup timed out after 360.0 seconds
