# pit-wall report: arbitration-stage1

- runner: harbor / model: claude-sonnet-5-5 / runs: 4 (scored: 4) / 2026-11-01T00:07:25.870Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | append:policy-p.md |
|---|---|---|
| a3-unreasoned-newer-value | 0/2 (0%; 0%–66%) | 0/2 (0%; 0%–66%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla | append:policy-p.md |
|---|---|---|
| a3-unreasoned-newer-value | 0/2 (0%; 0%–66%) | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla | append:policy-p.md |
|---|---|---|
| a3-unreasoned-newer-value | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | append:policy-p.md |
|---|---|---|
| a3-unreasoned-newer-value | 0 / 2 / 0 | 0 / 2 / 0 |

| fault | count | example |
|---|---|---|
| harness-denied | 4 | vanilla / a3-unreasoned-newer-value #1: `Bash` |
