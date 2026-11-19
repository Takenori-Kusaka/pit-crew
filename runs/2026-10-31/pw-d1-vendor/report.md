# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 9 / 2026-10-31T05:59:25.674Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| vendor-question | 3/3 (100%; 44%–100%) | 3/3 (100%; 44%–100%) | 2/3 (67%; 21%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| current vs vanilla | +0 pt | -46 … +46 pt | **inconclusive** |
| path:bad-control vs vanilla | -33 pt | -76 … +28 pt | **inconclusive** |

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
