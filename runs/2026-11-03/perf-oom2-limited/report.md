# pit-wall report: perf-oom

- runner: harbor / model: claude-sonnet-5-5 / runs: 3 (scored: 2) / 2026-11-03T11:44:08.430Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| perf-oom | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | – |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## overall

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| perf-oom | 0/1 (0%; 0%–79%) | 1/1 (100%; 21%–100%) | – |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|
| script:reference vs script:null | +100 pt | -30 … +98 pt | **inconclusive** |

## Skill activation (indicator, not scored)

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| perf-oom | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | script:null | script:reference | script:harmful |
|---|---|---|---|
| perf-oom | 1 / 0 / 0 | 1 / 0 / 0 | 0 / 0 / 1 |

| fault | count | example |
|---|---|---|
| oom-killed | 1 | script:harmful / perf-oom #1: `oom_kill=1` |
