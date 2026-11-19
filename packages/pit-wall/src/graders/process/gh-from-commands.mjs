// gh effects reconstructed from the COMMANDS a real session ran (no fake-gh state file).
// In Harbor runs the gh stand-in records the normalised end state (record.state.gh); a real role
// session talks to real GitHub, so the only record of its judgements is the commands in the
// transcript and their results. This builds the same shape from `post` actions whose command did
// not fail, so review-phases.mjs can read a live session (owner 2026-11-11 spike).
//
// Limits (stated, not hidden): (1) command-derived = what the session ASKED GitHub to do; a
// command that printed no error is taken as effective. (2) Only the forms bash.mjs reads
// (gh pr review/merge/ready/edit/create, gh api pulls|issues/N/...). (3) `by` is set only after
// `gh auth switch --user`, as in the stand-in.
import { eventTable } from './events.mjs';

export function ghStateFromCommands(record, { table = null } = {}) {
  const t = table ?? eventTable(record);
  const items = {};
  const item = (n) => (items[String(n)] ??= { reviews: [], labelsAdded: [], labelsRemoved: [], comments: [] });
  let account = null;
  const derived = [];
  for (const e of t.events) {
    if (e.tool !== 'Bash' && e.tool !== 'PowerShell') continue;
    const failed = e.denied || e.exitCode !== 0 || /^(gh: |error:|HTTP 4\d\d|HTTP 5\d\d)/m.test(e.resultText);
    for (const a of e.actions) {
      if (a.type === 'gh' && a.op === 'auth-switch') { account = a.user ?? account; continue; }
      if (a.type !== 'post' || a.number == null) continue;
      if (failed) { derived.push({ pos: a.pos, verb: a.verb, number: a.number, applied: false }); continue; }
      const it = item(a.number);
      if (a.verb === 'review') it.reviews.push({ event: a.reviewEvent ?? 'UNKNOWN', body: a.body ?? null, ...(account ? { by: account } : {}), pos: a.pos });
      else if (a.verb === 'merge') { it.state = 'merged'; it.mergedPos = a.pos; }
      else if (a.verb === 'ready') it.draft = false;
      else if (a.verb === 'comment') it.comments.push({ body: a.body ?? null, pos: a.pos });
      else if (a.verb === 'edit' || a.verb === 'create') { for (const l of a.labels ?? []) if (!it.labelsAdded.includes(l)) it.labelsAdded.push(l); if (a.body) it.body = a.body; }
      derived.push({ pos: a.pos, verb: a.verb, number: a.number, applied: true });
    }
  }
  return { items, derived, source: 'commands' };
}

// The PR a review session was about: the number most often named in gh pr commands.
export function inferPrNumber(table) {
  const counts = {};
  for (const e of table.events) for (const a of e.actions) if ((a.type === 'gh' || a.type === 'post') && a.kind === 'pr' && a.number != null) counts[a.number] = (counts[a.number] ?? 0) + 1;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? Number(best[0]) : null;
}

// Changed files, from the diff the session itself printed (`gh pr diff` output: "diff --git a/<p> b/<p>").
export function changedFilesFromDiff(table, pr) {
  const files = new Set();
  for (const e of table.events) {
    const isDiff = e.actions.some((a) => a.type === 'gh' && a.kind === 'pr' && a.op === 'diff' && (pr == null || a.number === pr));
    if (!isDiff || !e.resultText) continue;
    for (const m of e.resultText.matchAll(/^diff --git a\/(\S+) b\//gm)) files.add(m[1]);
  }
  return [...files];
}
