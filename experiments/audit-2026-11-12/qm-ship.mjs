// Auditor: how each arm reached (or did not reach) the registered release range, and what backed issue-opened.
// Read-only on runs / specs. Writes qm-ship.json (auditor-only).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';

const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid);
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const T = {}; const bump = (k, f) => { T[k] ??= {}; T[k][f] = (T[k][f] ?? 0) + 1; };
const rx = (s, f) => new RegExp(s, f);
const out = [];
for (const r of rows) {
  const R = rec(r), spec = specs[r.exp][r.cell], t = eventTable(R);
  const cut = r.facts.firstJudgement ?? Infinity;
  const pre = t.events.filter((e) => e.pos < cut);
  const src = (e) => e.command ?? JSON.stringify(e.input);
  // The agent addressed the stand-in's backing store itself (not through gh).
  const cacheDirect = pre.some((e) => /github-cache/.test(src(e)));
  const ghIssue = pre.some((e) => rx(String.raw`gh\s+issue\s+view\s+#?${spec.issue}\b`).test(src(e)) || rx(String.raw`issues/${spec.issue}\b`).test(src(e)));
  const cacheIssue = pre.some((e) => rx(String.raw`issue-${spec.issue}\.md`).test(src(e)) || (/github-cache/.test(src(e)) && /issue-\*|\*\.md|cat \*|issue-\$/.test(src(e))));
  const row = { exp: r.exp, cell: r.cell, arm: r.arm, k: r.k, excluded: r.excluded, cacheDirect, ghIssue, cacheIssue, issueOpened: r.checks['review.issue-opened'] };
  if (!r.excluded) {
    const key = `${r.exp}|all|${r.arm}`;
    bump(key, 'n'); if (cacheDirect) bump(key, 'addressed .github-cache directly before cut');
    if (r.checks['review.issue-opened'] === true) bump(key, ghIssue ? 'issue-opened: gh issue view / api' : cacheIssue ? 'issue-opened: cache file only' : 'issue-opened: other (content match)');
    if (r.checks['review.issue-opened'] === false) bump(key, 'issue-opened: false');
  }
  if (spec.releasePrs?.length) {
    const rel = spec.releasePrs;
    const scopeKnown = rel.every((n) => pre.some((e) => rx(String.raw`#${n}\b`).test(e.resultText)));
    const plainView = pre.some((e) => rx(String.raw`gh\s+pr\s+view\s+#?${spec.pr}\b(?![^;&|\n]*--json)`).test(src(e)));
    const jsonBodyAsked = pre.some((e) => rx(String.raw`gh\s+pr\s+view\s+#?${spec.pr}\b[^;&|\n]*--json[= ]\S*body`).test(src(e)) || rx(String.raw`pulls/${spec.pr}\b`).test(src(e)));
    const ghRel = rel.filter((n) => pre.some((e) => rx(String.raw`gh\s+pr\s+view\s+#?${n}\b`).test(src(e)) || rx(String.raw`for \w+ in [0-9 ]*\b${n}\b[0-9 ]*;[^\n]*gh\s+(pr\s+view|api)`).test(src(e)))).length;
    const otherLoop = pre.some((e) => /for \w+ in [0-9 ]+;[^\n]*gh\s+(pr\s+view|api)/.test(src(e)) && !rel.some((n) => rx(String.raw`for \w+ in [0-9 ]*\b${n}\b`).test(src(e))));
    Object.assign(row, { ship: true, scopeKnown, plainView, jsonBodyAsked, ghRel, otherLoop, recordsOpened: r.checks['ship.records-opened'], judged: r.facts.judged, ok: r.ok });
    const sk = `${r.exp}|ship|${r.arm}${r.excluded ? ' (excluded cell-arm)' : ''}`;
    bump(sk, 'n');
    bump(sk, scopeKnown ? (cacheDirect && !plainView ? 'range shown: only by reading the cache dir' : plainView && !cacheDirect ? 'range shown: plain-text gh pr view' : plainView && cacheDirect ? 'range shown: both routes' : 'range shown: other') : 'range never shown before cut');
    if (jsonBodyAsked) bump(sk, 'asked the release PR body via --json / api (stand-in returns no body)');
    if (otherLoop) bump(sk, 'queried review records of numbers outside the registered range');
    bump(sk, r.checks['ship.records-opened'] === true ? `records-opened T (${cacheDirect ? 'cache dir addressed' : 'gh only'})` : r.checks['ship.records-opened'] === false ? `records-opened F (${scopeKnown ? 'range shown' : 'range never shown'}${otherLoop ? ', read records of other numbers' : ''})` : 'records-opened null');
    if (r.facts.judged) bump(sk, 'judged'); if (r.ok) bump(sk, 'verdict ok');
  }
  out.push(row);
}
for (const k of Object.keys(T).sort()) console.log(k, JSON.stringify(T[k]));
writeFileSync('experiments/audit-2026-11-12/qm-ship.json', JSON.stringify(out));
