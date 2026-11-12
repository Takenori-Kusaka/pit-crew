# pit-wall report: subject2

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-04T05:19:24.948Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| s2-k4b | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| s2-k4b | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| s2-k4b | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| s2-k4b | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| s2-k4b | 8 / 2 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | vanilla / s2-k4b #6: `.claude/dev-adapter.md; ls tools; tools/purge-archive --help => /bin/bash: line 1: tools/purge-archive: Permission denied` |
