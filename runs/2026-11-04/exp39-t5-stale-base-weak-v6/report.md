# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-04T08:01:44.908Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1V6@/dev |
|---|---|
| t5-stale-base-weak | 7/10 (70%; 40%–89%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1V6@/dev |
|---|---|
| t5-stale-base-weak | 7/10 (70%; 40%–89%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1V6@/dev |
|---|---|
| t5-stale-base-weak | 7/10 (70%; 40%–89%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1V6@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1V6@/dev |
|---|---|
| t5-stale-base-weak | 7 / 3 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 3 | path:subjects/dev-structure/MskillD1V6@/dev / t5-stale-base-weak #1: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1V6@/dev / t5-stale-base-weak #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_4fc4e2b0ea534be783286c6b00efd077="$CLAUDE_CODE_INSTRUCTION_4FC4E2B0EA534BE783286C6B00EFD077"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1V6@/dev / t5-stale-base-weak #3: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_5481ad8fbe7f4bf5b4f75781e594b6c1="$CLAUDE_CODE_INSTRUCTION_5481AD8FBE7F4BF5B4F75781E594B6C1"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1V6@/dev / t5-stale-base-weak #7: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_55fcb29234ef4e15a4659337a8ab063d="$CLAUDE_CODE_INSTRUCTION_55FCB29234EF4E15A4659337A8AB063D"; unset CLAUDE_CODE_I
