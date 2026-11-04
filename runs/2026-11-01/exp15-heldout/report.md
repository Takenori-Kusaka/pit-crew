# pit-wall report: conventions-h2

- runner: harbor / model: claude-sonnet-5-5 / runs: 40 (scored: 37) / 2026-11-01T15:09:08.898Z
- **3 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| p0-plain | 5/5 (100%; 57%–100%) |
| p0-core | 5/5 (100%; 57%–100%) |
| p1-plain | 4/4 (100%; 51%–100%) |
| p1-core | 4/4 (100%; 51%–100%) |
| p2-plain | 5/5 (100%; 57%–100%) |
| p2-core | 5/5 (100%; 57%–100%) |
| p3-plain | 5/5 (100%; 57%–100%) |
| p3-core | 4/4 (100%; 51%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| p0-plain | 5/5 (100%; 57%–100%) |
| p0-core | 5/5 (100%; 57%–100%) |
| p1-plain | 4/4 (100%; 51%–100%) |
| p1-core | 4/4 (100%; 51%–100%) |
| p2-plain | 3/5 (60%; 23%–88%) |
| p2-core | 5/5 (100%; 57%–100%) |
| p3-plain | 5/5 (100%; 57%–100%) |
| p3-core | 4/4 (100%; 51%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| p0-plain | 5/5 (100%; 57%–100%) |
| p0-core | 5/5 (100%; 57%–100%) |
| p1-plain | 4/4 (100%; 51%–100%) |
| p1-core | 4/4 (100%; 51%–100%) |
| p2-plain | 3/5 (60%; 23%–88%) |
| p2-core | 5/5 (100%; 57%–100%) |
| p3-plain | 5/5 (100%; 57%–100%) |
| p3-core | 4/4 (100%; 51%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| p0-plain | – |
| p0-core | – |
| p1-plain | – |
| p1-core | – |
| p2-plain | – |
| p2-core | – |
| p3-plain | – |
| p3-core | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| p0-plain | 5 / 0 / 0 |
| p0-core | 5 / 0 / 0 |
| p1-plain | 4 / 0 / 1 |
| p1-core | 4 / 0 / 1 |
| p2-plain | 5 / 0 / 0 |
| p2-core | 5 / 0 / 0 |
| p3-plain | 5 / 0 / 0 |
| p3-core | 4 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 3 | vanilla / p1-plain #3: `cat tests/pad_test.sh; git checkout -q -b fix/pad-zero-padding
cat > bin/pad <<' => Exit code 126` |
