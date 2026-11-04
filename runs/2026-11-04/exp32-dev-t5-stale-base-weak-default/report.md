# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-03T15:32:48.059Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1@/dev |
|---|---|
| t5-stale-base-weak | 8/10 (80%; 49%–94%) |

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
| t5-stale-base-weak | 8 / 2 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 2 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #2: `error_max_turns` |
| not-executable | 1 | path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #5: ` -3   head -60; for n in 999 1000 1 0; do bin/price $n; done => /bin/bash: line 1: bin/price: Permission denied` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_dc2d3bc53aa04754a5383c67a715ea27="$CLAUDE_CODE_INSTRUCTION_DC2D3BC53AA04754A5383C67A715EA27"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillD1@/dev / t5-stale-base-weak #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_03d856c2bb264962a01d0df5cd932386="$CLAUDE_CODE_INSTRUCTION_03D856C2BB264962A01D0DF5CD932386"; unset CLAUDE_CODE_I
