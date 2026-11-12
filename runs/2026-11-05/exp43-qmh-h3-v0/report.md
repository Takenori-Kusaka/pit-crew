# pit-wall report: qm-heldout

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 9) / 2026-11-05T08:03:22.804Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qmh-h3 | 3/9 (33%; 12%–65%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qmh-h3 | 3/9 (33%; 12%–65%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qmh-h3 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/audit |
|---|---|
| qmh-h3 | 9 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/ganbari-quest-v0-full@/audit / qmh-h3 #10: `for n in 50 51 52 53; do echo "== #$n"; gh pr view $n --json reviews 2>&1   pyth => Exit code 127` |
