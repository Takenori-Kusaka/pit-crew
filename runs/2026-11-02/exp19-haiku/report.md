# pit-wall report: structure

- runner: harbor / model: claude-haiku-5-5 / runs: 9 (scored: 7) / 2026-11-01T23:28:42.551Z
- **2 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 1/2 (50%; 9%–91%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2/2 (100%; 34%–100%) | 3/3 (100%; 44%–100%) | 1/2 (50%; 9%–91%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | – | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/F@/dev | path:subjects/dev-structure/H@/dev | path:subjects/dev-structure/M@/dev |
|---|---|---|---|
| t1-parallel-start | 2 / 0 / 1 | 3 / 0 / 0 | 2 / 0 / 1 |

| fault | count | example |
|---|---|---|
| tool-unavailable | 1 | path:subjects/dev-structure/F@/dev / t1-parallel-start #3: `cd /app; git show 8287509   head -60; echo ---; cat .github-cache/issue-41.md; e => Exit code 126` |
| runner-error | 1 | path:subjects/dev-structure/M@/dev / t1-parallel-start #1: `NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_d05181ce944e4553b3b1dede28166f4e="$CLAUDE_CODE_INSTRUCTION_D05181CE944E4553B3B1DEDE28166F4E"; unset CLAUDE_CODE_I` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/M@/dev / t1-parallel-start #1: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_d05181ce944e4553b3b1dede28166f4e="$CLAUDE_CODE_INSTRUCTION_D05181CE944E4553B3B1DEDE28166F4E"; unset CLAUDE_CODE_I
