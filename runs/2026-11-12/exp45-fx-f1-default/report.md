# pit-wall report: fix

- runner: harbor / model: claude-haiku-5-5 / runs: 30 (scored: 29) / 2026-11-11T21:38:29.832Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-f1 | 22/29 (76%; 58%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-f1 | 26/29 (90%; 74%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-f1 | 22/29 (76%; 58%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-f1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/fix-skill-default@/fix |
|---|---|
| fx-f1 | 22 / 7 / 1 |

| fault | count | example |
|---|---|---|
| harness-denied | 7 | path:subjects/fix-skill-default@/fix / fx-f1 #10: `Bash` |
| tool-unavailable | 1 | path:subjects/fix-skill-default@/fix / fx-f1 #16: `gh pr view 111 --json labels,headRefOid,comments 2>&1   python3 -c 'import sys,j => Exit code 127` |
