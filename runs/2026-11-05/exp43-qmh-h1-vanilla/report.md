# pit-wall report: qm-heldout

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 7) / 2026-11-05T07:36:57.786Z
- **3 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| qmh-h1 | 3/7 (43%; 16%–75%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| qmh-h1 | 3/7 (43%; 16%–75%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| qmh-h1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| qmh-h1 | 7 / 0 / 3 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 4 | vanilla / qmh-h1 #1: `gh pr view 55 --json body   jq -r .body; echo ---; for n in 31 40 42 44 54; do e => Exit code 127` |
