# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-02T11:35:59.602Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-start | 4/5 (80%; 38%–96%) |
| t6-false-memo-midway | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-start | 5/5 (100%; 57%–100%) |
| t6-false-memo-midway | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-start | 4/5 (80%; 38%–96%) |
| t6-false-memo-midway | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-start | – |
| t6-false-memo-midway | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-start | 5 / 0 / 0 |
| t6-false-memo-midway | 4 / 1 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 1 | path:subjects/dev-structure/MskillG@/dev / t6-false-memo-midway #4: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillG@/dev / t6-false-memo-midway #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_2474cc21619343968ebbca89612308b7="$CLAUDE_CODE_INSTRUCTION_2474CC21619343968EBBCA89612308B7"; unset CLAUDE_CODE_I
