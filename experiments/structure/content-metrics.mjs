// Measures for the rule-content experiments (EXP-25), read from a trial's commands.
// Each takes the list of commands (Bash command strings, plus Read/Grep paths and patterns)
// in order, with heredoc bodies masked (phase-metrics.mjs maskHeredocs), and returns booleans.
//   broadSearch   searched by meaning, not only by the visible expression: a grep/rg whose
//                 pattern names rounding (round, rounded, 切り捨て, 切り上げ, ceil, floor) or the
//                 other form of the expression (`/ 10`, `* 9`)
//   historySearch searched history for the change: git log with -S / -G / -p / --stat, or git show
//   reachedHelper the command text names round_tenth or lib/util/money.sh
//   threeDot      compared with main through the merge base: `main...` / `...main` or git merge-base
//   twoDot        compared tips directly: `git diff main` (no dots), `main..HEAD` / `HEAD..main`
//   rebasedOrMerged  brought main in before editing is not decided here (see order in the caller)
import { maskHeredocs } from './phase-metrics.mjs';

export function commandsOf(lines) {
  const out = [];
  for (const l of lines) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.type !== 'assistant') continue;
    for (const c of e.message?.content ?? []) {
      if (c.type !== 'tool_use') continue;
      if (c.name === 'Bash') out.push(maskHeredocs(String(c.input.command ?? '')));
      else if (c.name === 'Grep') out.push(`grep ${c.input.pattern ?? ''} ${c.input.path ?? ''}`);
      else if (c.name === 'Read') out.push(`read ${c.input.file_path ?? ''}`);
      else out.push('');
    }
  }
  return out;
}

const GREP = /\b(?:grep|rg|git\s+grep)\b[^\n;|&]*/g;
const BROAD = /round|切り捨て|切り上げ|ceil|floor|\/ ?10\b|\\?\* ?9\b/i;
export const broadSearch = (cmds) => cmds.some((c) => [...c.matchAll(GREP)].some((m) => BROAD.test(m[0])));
export const historySearch = (cmds) => cmds.some((c) => /\bgit\s+log\b[^\n;|&]*\s(?:-S|-G|-p|--patch|--stat)\b|\bgit\s+show\b/.test(c));
// pickaxe: searched history for where an expression or word was added or removed (git log -S / -G).
// historySearch above also counts `git show <commit>`, which nearly every trial runs (EXP-23: 29/29).
export const pickaxe = (cmds) => cmds.some((c) => /\bgit\s+log\b[^\n;|&]*\s-[SG]/.test(c));
// Brought main into the work branch: rebase / merge / pull naming main. `git merge-base ... main`
// only looks at the base and is not counted (EXP-26: the first version counted it).
export const BRING_MAIN = /\bgit\s+(?:rebase|merge(?!-)|pull)\b[^\n;|&]*\bmain\b/;
export const broughtMain = (cmds) => cmds.some((c) => BRING_MAIN.test(c));
export const reachedHelper = (cmds) => cmds.some((c) => /round_tenth|lib\/util\/money\.sh/.test(c));
export const threeDot = (cmds) => cmds.some((c) => /\bmain\.\.\.|\.\.\.main\b|\bgit\s+merge-base\b/.test(c));
export const twoDot = (cmds) => cmds.some((c) => /\bgit\s+diff\b(?:\s+-\S+)*\s+main\b(?!\.)|\bmain\.\.(?!\.)\S|\S(?<!\.)\.\.main\b/.test(c));
