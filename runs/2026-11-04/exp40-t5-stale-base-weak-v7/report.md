# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 10) / 2026-11-04T08:37:30.664Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillD1V7@/dev |
|---|---|
| t5-stale-base-weak | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillD1V7@/dev |
|---|---|
| t5-stale-base-weak | 9/10 (90%; 60%–98%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillD1V7@/dev |
|---|---|
| t5-stale-base-weak | 8/10 (80%; 49%–94%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillD1V7@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillD1V7@/dev |
|---|---|
| t5-stale-base-weak | 9 / 1 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 1 | path:subjects/dev-structure/MskillD1V7@/dev / t5-stale-base-weak #2: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillD1V7@/dev / t5-stale-base-weak #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_21f32de18bb04fab81b9838aabb6b963="$CLAUDE_CODE_INSTRUCTION_21F32DE18BB04FAB81B9838AABB6B963"; unset CLAUDE_CODE_I
