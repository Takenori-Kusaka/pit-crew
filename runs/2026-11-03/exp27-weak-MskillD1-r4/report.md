# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-03T00:55:57.646Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 2 / 3 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #3: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #3: `discount" --include=* . -l --exclude-dir=.git; bin/price 999 => /bin/bash: line 1: bin/price: Permission denied` |
| harness-denied | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #4: `Bash` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #3: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_93ec8966ac9e47ebbede2f1d67a5347b="$CLAUDE_CODE_INSTRUCTION_93EC8966AC9E47EBBEDE2F1D67A5347B"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_76ebcf7bd43641d481164edde547f495="$CLAUDE_CODE_INSTRUCTION_76EBCF7BD43641D481164EDDE547F495"; unset CLAUDE_CODE_I
