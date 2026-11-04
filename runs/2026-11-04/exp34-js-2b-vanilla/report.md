# pit-wall report: jobsel

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-03T22:37:21.716Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| js-2b | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| js-2b | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| js-2b | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| js-2b | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| js-2b | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / js-2b #9: `cat scripts/rotate.sh tests/rotate_test.sh; ls -la archive/*; cat README.md; cro => Exit code 127` |
