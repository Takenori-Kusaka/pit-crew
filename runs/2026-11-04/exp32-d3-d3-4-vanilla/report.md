# pit-wall report: d3

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 20) / 2026-11-03T16:43:14.791Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| d3-4 | 20/20 (100%; 84%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| d3-4 | 19/20 (95%; 76%–99%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| d3-4 | 19/20 (95%; 76%–99%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| d3-4 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| d3-4 | 19 / 1 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | vanilla / d3-4 #10: ` 5.5 <noreply@anthropic.com>" && git log --oneline   head -1 => /bin/bash: line 51: scripts/verify.sh: Permission denied` |
