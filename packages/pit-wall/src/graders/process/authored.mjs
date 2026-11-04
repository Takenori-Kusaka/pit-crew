// Everything the agent wrote, wherever it wrote it (research §2.3, Q4): messages, the final
// reply, file writes (Write / Edit / heredoc / echo / sed -i), commit messages, PR and
// issue bodies, TodoWrite items and prompts to subagents. Each piece keeps the position it
// was written at, so a note added after the edit is not dated back to before it (§2.1).
//
// `prose` marks text that makes claims (messages, notes, commit and PR text). Code written to
// a source file is authored but is not where citations and claims are looked for.

import { eventTable, fileRole } from './events.mjs';

const PROSE_EXT = /\.(md|markdown|txt|rst|adoc)$/i;
// Attribution trailers are boilerplate, not claims (their model names and versions would be
// extracted as numbers).
const dropTrailers = (t) => t.split('\n').filter((l) => !/^\s*(Co-Authored-By|Signed-off-by):|Generated with \[?Claude Code/i.test(l)).join('\n');

export function authoredTexts(record, table = eventTable(record)) {
  const out = [];
  for (const m of table.messages) out.push({ pos: m.pos, where: 'message', text: m.text, prose: true });
  for (const e of table.events) {
    for (const a of e.actions) {
      if (a.type === 'write' && a.authored && a.text) {
        const role = fileRole(a.path);
        out.push({ pos: a.pos, where: 'file', path: a.path, how: a.how, text: a.text, prose: PROSE_EXT.test(a.path) || role === 'notes' });
      }
      if (a.type === 'commit' && a.message) out.push({ pos: a.pos, where: 'commit', text: dropTrailers(a.message), prose: true });
      if (a.type === 'post' && (a.body || a.title)) out.push({ pos: a.pos, where: a.kind === 'pr' ? 'pr' : 'issue', text: dropTrailers([a.title, a.body].filter(Boolean).join('\n\n')), prose: true });
      if (a.type === 'todo' && a.text) out.push({ pos: a.pos, where: 'todo', text: a.text, prose: true });
      if (a.type === 'agent' && a.prompt) out.push({ pos: a.pos, where: 'agent-prompt', text: a.prompt, prose: true });
    }
  }
  // The final reply usually repeats the last step's message: keep one copy, at the end.
  const fin = table.finalMessage.trim();
  if (fin) {
    const k = out.findIndex((x) => x.where === 'message' && x.text.trim() === fin);
    if (k !== -1) out.splice(k, 1);
    out.push({ pos: table.finalPos, where: 'final', text: table.finalMessage, prose: true });
  }
  return out.sort((a, b) => a.pos - b.pos);
}

// Content types (research §2.1: label by what the text is, not where it is). Heuristic
// keyword classifiers over English and Japanese; each returns a boolean. They feed the E
// series only, and are verified both ways in the tests.
const TYPE_RE = {
  trajectory: /\bT[012]\b|軌道|\btrajectory\b|\b(trivial|normal|risky) (change|track)\b/i,
  restatement: /依頼|要件|目的|完了の(定義|条件)|\bdone when\b|\bacceptance\b|\bthe (task|issue|ticket) (is|asks|says)\b|\bgoal\b|\bshould (print|return|be)\b|期待(する|される)?(値|挙動)/i,
  plan: /計画|手順|方針|次に|まず|\bplan\b|\bsteps?\b|\bI(?:'ll| will)\b|\bnext,? I\b|\bthen I\b|変更する|直す|修正する/i,
  hypothesis: /仮説|原因|\bhypothes[ie]s\b|\broot cause\b|\bcaused? by\b|\bbecause\b|\blikely\b|\bsuspect\b|おそらく|\bprobably\b/i,
  alternatives: /代替|別案|案\s*[A-Z0-9１-９]|却下|比較|トレードオフ|\balternatives?\b|\boption [A-Z0-9]\b|\binstead of\b|\brather than\b|\brejected\b|\btrade-?offs?\b|\bconsidered\b/i,
};
export function contentTypes(text) {
  const t = String(text ?? '');
  const types = Object.fromEntries(Object.entries(TYPE_RE).map(([k, re]) => [k, re.test(t)]));
  // A test list: two or more list items that name a test, case or check, or an explicit heading.
  const items = t.split('\n').filter((l) => /^\s*(?:[-*+]|\d+[.)]|\[[ x]\])\s+/.test(l) && /test|テスト|ケース|\bcase\b|\bcheck\b|assert|期待/i.test(l));
  types.testList = items.length >= 2 || /テスト(リスト|一覧|ケース)|\btest (list|cases|plan)\b/i.test(t);
  return types;
}
