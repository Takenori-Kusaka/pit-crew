# pit-wall report: structure-types

- runner: harbor / model: claude-sonnet-5-5 / runs: 5 (scored: 5) / 2026-11-02T15:47:27.305Z
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-weak | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-weak | 3/5 (60%; 23%–88%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-weak | 2/5 (40%; 12%–77%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-weak | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/MskillG@/dev |
|---|---|
| t5-stale-base-weak | 3 / 2 / 0 |

| fault | count | example |
|---|---|---|
| turn-limit | 2 | path:subjects/dev-structure/MskillG@/dev / t5-stale-base-weak #1: `error_max_turns` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/MskillG@/dev / t5-stale-base-weak #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_f2d9ccd8a998484598a241be6a4e7365="$CLAUDE_CODE_INSTRUCTION_F2D9CCD8A998484598A241BE6A4E7365"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/MskillG@/dev / t5-stale-base-weak #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_478e5380ad864db0a74ff413770ba82a="$CLAUDE_CODE_INSTRUCTION_478E5380AD864DB0A74FF413770BA82A"; unset CLAUDE_CODE_I
