# pit-wall report: structure-big

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-03T13:43:56.399Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| t4-scatter-big-start | 0/10 (0%; 0%–28%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| t4-scatter-big-start | 10/10 (100%; 72%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| t4-scatter-big-start | 0/10 (0%; 0%–28%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| t4-scatter-big-start | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| t4-scatter-big-start | 9 / 1 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 1 | vanilla / t4-scatter-big-start #1: `s/verify.sh && bash bin/quote 999 && bash lib/invoice.sh 999 => /bin/bash: line 17: scripts/verify.sh: Permission denied` |
