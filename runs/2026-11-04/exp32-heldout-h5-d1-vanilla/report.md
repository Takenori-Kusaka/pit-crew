# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-03T16:15:29.289Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| h5-d1 | 9/9 (100%; 70%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| h5-d1 | 8/9 (89%; 56%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| h5-d1 | 8/9 (89%; 56%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| h5-d1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| h5-d1 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / h5-d1 #8: `cat > tests/convert_test.sh <<'EOF'
#!/bin/bash
# UNIT-8: tests for bin/convert
 => command not found` |
