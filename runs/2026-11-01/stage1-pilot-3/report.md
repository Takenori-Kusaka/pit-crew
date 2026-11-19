# pit-wall report: arbitration-stage1

- runner: harbor / model: claude-sonnet-5-5 / runs: 8 (scored: 8) / 2026-11-01T03:11:59.467Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla | append:policy-p.md |
|---|---|---|
| a4-premise-gone | 0/2 (0%; 0%–66%) | 0/2 (0%; 0%–66%) |
| a9-newer-grounds | 0/2 (0%; 0%–66%) | 0/2 (0%; 0%–66%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla | append:policy-p.md |
|---|---|---|
| a4-premise-gone | 0/2 (0%; 0%–66%) | 2/2 (100%; 34%–100%) |
| a9-newer-grounds | 0/2 (0%; 0%–66%) | 0/2 (0%; 0%–66%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla | append:policy-p.md |
|---|---|---|
| a4-premise-gone | – | – |
| a9-newer-grounds | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla | append:policy-p.md |
|---|---|---|
| a4-premise-gone | 2 / 0 / 0 | 2 / 0 / 0 |
| a9-newer-grounds | 2 / 0 / 0 | 2 / 0 / 0 |
