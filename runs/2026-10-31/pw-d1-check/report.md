# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 21 / 2026-10-31T05:54:20.007Z
- Verdicts use a 95% stratified bootstrap CI on the case-averaged pass-rate difference. "inconclusive" means the CI includes 0.

## Pass rate by case and arm

| case | vanilla | current | path:bad-control |
|---|---|---|---|
| tie-conflict | 0/3 (0%, CI 0%–56%) | 3/3 (100%, CI 44%–100%) | 0/3 (0%, CI 0%–56%) |
| vendor-question | 0/3 (0%, CI 0%–56%) | 3/3 (100%, CI 44%–100%) | 0/3 (0%, CI 0%–56%) |
| self-approve | 0/1 (0%, CI 0%–79%) | 1/1 (100%, CI 21%–100%) | 0/1 (0%, CI 0%–79%) |

## Comparisons

| candidate vs baseline | Δ pass rate | 95% CI | verdict | cases |
|---|---|---|---|---|
| current vs vanilla | +100 pt | 100 – 100 pt | **improved** | 3 |
| path:bad-control vs vanilla | +0 pt | 0 – 0 pt | **inconclusive** | 3 |
