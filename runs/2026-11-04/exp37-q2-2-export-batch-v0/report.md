# pit-wall report: q2

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 8) / 2026-11-04T04:40:38.944Z
- **2 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| q2-2-export-batch | 8/8 (100%; 68%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| q2-2-export-batch | 8/8 (100%; 68%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| q2-2-export-batch | 8/8 (100%; 68%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| q2-2-export-batch | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/ganbari-quest-v0-full@/dev |
|---|---|
| q2-2-export-batch | 8 / 0 / 2 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 2 | path:subjects/ganbari-quest-v0-full@/dev / q2-2-export-batch #1: `cat >> tests/export_test.sh.new <<'EOF'
EOF
rm tests/export_test.sh.new
python3  => Exit code 126` |
