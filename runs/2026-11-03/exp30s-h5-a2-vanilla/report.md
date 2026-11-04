# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 3 (scored: 2) / 2026-11-03T11:07:48.254Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| h5-a2 | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| h5-a2 | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| h5-a2 | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| h5-a2 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| h5-a2 | 2 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / h5-a2 #3: `cd /app; python3 - <<'E'
p='bin/next-bus'
s=open(p).read()
s=s.replace('done < d => command not found` |
