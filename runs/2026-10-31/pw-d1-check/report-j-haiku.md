# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 21 (scored: 21) / 2026-10-31T05:54:20.007Z
- **Some cases cannot tell the good control from the bad one.** Their verdicts are not evidence. See "Case validity".
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 1/3 (33%; 6%–79%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) |
| self-approve | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +56 pt | -1 … +62 pt | **inconclusive** |
| path:bad-control vs vanilla | -11 pt | -40 … +24 pt | **inconclusive** |

## protocol

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +41 … +96 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -30 … +30 pt | **inconclusive** |

## overall

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| vendor-question | 0/3 (0%; 0%–56%) | 3/3 (100%; 44%–100%) | 0/3 (0%; 0%–56%) |
| self-approve | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | 0/1 (0%; 0%–79%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +100 pt | +33 … +92 pt | **improved** |
| path:bad-control vs vanilla | +0 pt | -31 … +30 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/3 | 3/3 | 3/3 |
| vendor-question | 0/3 | 3/3 | 3/3 |
| self-approve | 0/1 | 1/1 | 1/1 |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0 / 3 / 0 | 0 / 3 / 0 | 0 / 3 / 0 |
| vendor-question | 0 / 3 / 0 | 0 / 3 / 0 | 0 / 3 / 0 |
| self-approve | 0 / 1 / 0 | 0 / 1 / 0 | 0 / 1 / 0 |

| fault | count | example |
|---|---|---|
| runner-noise:cwd-tracking-readonly | 44 | vanilla / tie-conflict #1 |

## Case validity (controls: good = current, bad = path:bad-control)

- vendor-question / behavior: non-discriminating, ceiling
