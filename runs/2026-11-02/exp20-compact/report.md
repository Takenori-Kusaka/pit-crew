# pit-wall report: structure

- runner: harbor / model: claude-sonnet-5-5 / runs: 10 (scored: 5) / 2026-11-02T00:10:22.444Z
- **5 run(s) are invalid and excluded from every score.** See "Run validity". Do not read the verdicts below until they are rerun.
- **behavior** = the discipline itself, fair to every arm. **protocol** = this harness's own channel (e.g. a specific label); vanilla cannot know it.
- Δ intervals: 95% from Jeffreys Beta posteriors of each case/arm pass rate, case-averaged. **inconclusive** = the interval includes 0.

## behavior

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-compact | 3/3 (100%; 44%–100%) | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## protocol

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-compact | 3/3 (100%; 44%–100%) | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## overall

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-compact | 3/3 (100%; 44%–100%) | 2/2 (100%; 34%–100%) |

| candidate vs baseline | Δ | 95% interval | verdict |
|---|---|---|---|

## Skill activation (indicator, not scored)

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-compact | – | – |

## Run validity (did the run measure the agent?)

ok / suspect / invalid. invalid runs are excluded from scores; suspect runs are scored but ran under distorted conditions.

| case | path:subjects/dev-structure/M@/dev | path:subjects/dev-structure/F@/dev |
|---|---|---|
| t1-parallel-compact | 3 / 0 / 2 | 2 / 0 / 3 |

| fault | count | example |
|---|---|---|
| runner-error | 3 | path:subjects/dev-structure/M@/dev / t1-parallel-compact #2: `NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_fbd84806c45c4fc680ea82385e999fd0="$CLAUDE_CODE_INSTRUCTION_FBD84806C45C4FC680EA82385E999FD0"; unset CLAUDE_CODE_I` |
| tool-unavailable | 2 | path:subjects/dev-structure/M@/dev / t1-parallel-compact #3: `cd /app; git show --stat --format='%h %s%n%b' HEAD   head -20; echo ---; git dif => Exit code 126` |

## Run errors (runner failures: invalid, excluded from scores)

- path:subjects/dev-structure/M@/dev / t1-parallel-compact #2: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_fbd84806c45c4fc680ea82385e999fd0="$CLAUDE_CODE_INSTRUCTION_FBD84806C45C4FC680EA82385E999FD0"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/F@/dev / t1-parallel-compact #4: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_24428e1c2e5a48d3b5d1dd3801e77eeb="$CLAUDE_CODE_INSTRUCTION_24428E1C2E5A48D3B5D1DD3801E77EEB"; unset CLAUDE_CODE_I
- path:subjects/dev-structure/F@/dev / t1-parallel-compact #5: NonZeroAgentExitCodeError: Command failed (exit 1): export PATH="$HOME/.local/bin:$PATH"; claude_code_instruction_53464c7f71e64b5bbd58ad7fdec8215f="$CLAUDE_CODE_INSTRUCTION_53464C7F71E64B5BBD58AD7FDEC8215F"; unset CLAUDE_CODE_I
