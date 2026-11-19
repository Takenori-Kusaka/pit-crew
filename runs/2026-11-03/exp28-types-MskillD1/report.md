# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-03T06:39:19.986Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t6-false-memo-midway | 5/5 (100%; 57%–100%) |
| t5-stale-base-weak | 4/5 (80%; 38%–96%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t6-false-memo-midway | – |
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t6-false-memo-midway | 5 / 0 / 0 |
| t5-stale-base-weak | 2 / 3 / 0 |

| fault | count | example |
|---|---|---|
| not-executable | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #2: ` --exclude-dir=.git; bash tests/price_test.sh; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| turn-limit | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #5: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_4227107757374457966760794579251b="$CLAUDE_CODE_INSTRUCTION_4227107757374457966760794579251B"; unset CLAUDE_CODE_I
