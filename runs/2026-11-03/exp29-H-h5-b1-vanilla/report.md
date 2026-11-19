# pit-wall report: heldout-s5

- runner: harbor / model: claude-sonnet-5-5 / runs: 20 (scored: 19) / 2026-11-03T09:28:16.313Z
- **1 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | vanilla |
|---|---|
| h5-b1 | 17/19 (89%; 69%–97%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | vanilla |
|---|---|
| h5-b1 | 19/19 (100%; 83%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | vanilla |
|---|---|
| h5-b1 | 17/19 (89%; 69%–97%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | vanilla |
|---|---|
| h5-b1 | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | vanilla |
|---|---|
| h5-b1 | 19 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | vanilla / h5-b1 #2: `cd /app; mkdir -p notes
cat > notes/LOG-31.md <<'EOF'
# LOG-31 変更計画
- 原因: 世代を消す処 => command not found` |
