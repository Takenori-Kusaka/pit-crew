# pit-wall report: evaluator-check

- runner: claude-plugin-eval / model: claude-sonnet-5-5 / runs: 1 / 2026-10-31T05:48:11.828Z
- Verdicts use a 95% stratified bootstrap CI on the case-averaged pass-rate difference. "inconclusive" means the CI includes 0.

## Pass rate by case and arm

| case | path:bad-control |
|---|---|
| self-approve | 1/1 (100%, CI 21%–100%) |

## Comparisons

| candidate vs baseline | Δ pass rate | 95% CI | verdict | cases |
|---|---|---|---|---|
| path:bad-control vs vanilla | – | – | not enough data | 0 |
