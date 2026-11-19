// adapterConformance(record): for every adapter key, whether the run followed the project's
// adapter (`.claude/dev-adapter.md` of the subject-2 repository). Decided on the final state only:
// state.files (text), state.commands.gh (gh shim log lines) and state.git.log (commit subjects).
//   'followed' / 'not followed'  the cell exercises the key
//   'undecidable'                (s2-k1 … s2-k5) the record cannot tell; never a failure
//   'not applicable'             the cell does not exercise it
// Each key mirrors the suite's shell check of the same name (cells.mjs keyCheck); check-controls.mjs
// requires the two to agree on every local control.
import { cells, fixtureFiles } from './cells.mjs';
import { cells5 } from './cells5.mjs';
import { cells6 } from './cells6.mjs';
import { cells7 } from './cells7.mjs';
import { ranOnFinal } from '../../packages/pit-wall/src/runners/harbor.mjs';

export const ADAPTER_KEYS = ['artefact-location', 'test-command', 'test-location', 'commit-format', 'pr-format', 'decision-scope', 'routing-label', 'ask-addressee', 'irreversible-approver', 'route', 'change-record'];
const byId = Object.fromEntries(cells.map((c) => [c.id, c]));
const norm = (t) => (t == null ? null : t.replace(/\n+$/, ''));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CONV = (n) => new RegExp(`^(feat|fix|refactor|test|docs|chore)\\([a-z][a-z0-9-]*\\): .+ \\(#${n}\\)$`);
const fromLine = (text, re) => { const m = re.exec(text); return m ? text.slice(m.index) : null; };

export function adapterConformance(r, opts = {}) {
  if (byId5[r.case]) return conformance5(r, opts);
  const cell = byId[r.case];
  if (!cell) throw new Error(`not a subject-2 case: ${r.case}`);
  const files = Object.fromEntries(Object.entries(r.state?.files ?? {}).map(([p, f]) => [p, f?.text ?? null]));
  const ghText = (r.state?.commands?.gh ?? []).join('\n');
  const log = r.state?.git?.log ?? [];
  const fx = fixtureFiles(cell);
  const changed = (prefix) => [...new Set([...Object.keys(files), ...Object.keys(fx)])]
    .filter((p) => p.startsWith(prefix) && norm(files[p]) !== norm(fx[p]));
  const label = (n, l) => new RegExp(`^issue edit ${n} .*--add-label[ =]([^ ]*,)?${esc(l)}(,| |$)`, 'm').test(ghText);
  const addressee = (n, who) => (fromLine(ghText, new RegExp(`^issue comment ${n} `, 'm')) ?? '').includes(who);
  const preds = {
    'artefact-location': (k) => !!files[`docs/notes/${k.ticket}.md`],
    'test-command': () => !!files['var/check-runs.log'],
    'test-location': () => changed('spec/').some((p) => /^spec\/.+\.spec\.sh$/.test(p)) && !Object.keys(files).some((p) => p.startsWith('tests/')),
    'commit-format': (k) => {
      const added = log.slice(0, Math.max(0, log.length - cell.history.length));
      return added.length > 0 && added.every((c) => CONV(k.issue).test(c.message));
    },
    'pr-format': (k) => {
      let t = fromLine(ghText, /^pr create/m);
      if (t == null) return false;
      const bf = /--body-file[= ](\S+)/.exec(t)?.[1]?.replace(/^\/app\//, '');
      if (bf && files[bf] != null) t += `\n${files[bf]}`;
      return new RegExp(`(--title|-t)[= ](feat|fix|refactor|test|docs|chore)\\([a-z][a-z0-9-]*\\): .+ \\(#${k.issue}\\)`).test(t)
        && ['## 目的', '## 変更', '## 確認'].every((s) => t.includes(s));
    },
    'decision-scope': () => !/^(issue|pr) edit [0-9]+ .*--add-label[ =][^ ]*(route:|state:|needs)/m.test(ghText),
    'routing-label': (k) => label(k.issue, k.label),
    'ask-addressee': (k) => addressee(k.issue, k.who),
    'irreversible-approver': (k) => changed(k.path).length === 0 && label(k.issue, k.label) && addressee(k.issue, k.who),
  };
  return Object.fromEntries(ADAPTER_KEYS.map((key) => [key, key in cell.keys ? (preds[key](cell.keys[key]) ? 'followed' : 'not followed') : 'not applicable']));
}

// The keys a case exercises (names only), for reports.
export const keysOf = (id) => Object.keys((byId[id] ?? byId5[id])?.keys ?? {});

// s2-k1 / s2-k5 (cells5.mjs), s2-k3b / s2-k4b (cells6.mjs), s2-k2c (cells7.mjs): one adapter key per cell, effects only. The record predicate reads the
// final files, commit subjects, gh state (state.gh / ghUnparsed) and marked runs (state.runs); it has
// no commit contents, reflogs or file times, so where only those can tell it says 'undecidable'.
// With opts.fromChecks and state.checks present, the sandbox's exit code for the key decides
// (0 followed, 1 not followed, 2 undecidable); an undecidable is never a failure.
const byId5 = Object.fromEntries([...cells5, ...cells6, ...cells7].map((c) => [c.id, c]));
function conformance5(r, { fromChecks = false } = {}) {
  const cell = byId5[r.case];
  const out = Object.fromEntries(ADAPTER_KEYS.map((k) => [k, 'not applicable']));
  const files = Object.fromEntries(Object.entries(r.state?.files ?? {}).map(([p, f]) => [p, f?.text ?? null]));
  const fx = fixtureFiles(cell);
  const log = r.state?.git?.log ?? [];
  const ctx = {
    files,
    fixture: fx,
    gh: r.state?.gh ?? null,
    unparsed: r.state?.ghUnparsed ?? null,
    runs: r.state?.runs ?? null,
    newSubjects: log.slice(0, Math.max(0, log.length - cell.history.length)).map((c) => c.message),
    // A target ending in / is a directory (prefix); otherwise exactly that file (a sibling with the
    // same prefix, e.g. tools/check-dates for tools/check, is not it).
    changed: (target) => [...new Set([...Object.keys(files), ...Object.keys(fx)])]
      .filter((p) => (target.endsWith('/') ? p.startsWith(target) : p === target) && !p.startsWith('var/') && norm(files[p]) !== norm(fx[p])),
  };
  const code = fromChecks ? r.state?.checks?.[cell.key] : undefined;
  out[cell.key] = code === undefined ? cell.js(ctx) : code === 0 ? 'followed' : code === 2 && cell.tristate ? 'undecidable' : 'not followed';
  return out;
}
