// Phase and context metrics for the structure cells, read from each trial's Claude Code
// transcript (stream-json, agent/claude-code.txt under the Harbor jobs dir).
//   peak     largest context in one turn (input + cache creation + cache read tokens)
//   compact  number of compaction boundaries
//   phases   phase material read, in order (Read of skills/*/phases/<n>-*.md, or Skill dev-phase-<n>-*, or the core skill)
//   order    tool-call index of the first: memo write, test write, impl edit, test run, verify run, commit
//   skipped  impl edited before the memo / before a test was written (start and rush entries)
//   wrong    midway entry only: phase material for phases 0-4 read (the state file says phase 5)
//   redo     midway entry only: the memo or a test written before the first implementation edit
//   misses   measurement check: final-state predicates that passed with no matching event (see audit)
// Usage: node experiments/structure/phase-metrics.mjs runs/<date>/<run> [case-prefix] [--rows] [--no-check]
// Exits 2 without aggregating when the measurement check fails.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const blank = (s) => s.replace(/[^\n]/g, ' ');
export function maskHeredocs(cmd) {
  let out = cmd;
  for (const m of cmd.matchAll(/(?<!<)<<(?!<)(-?)\s*(['"]?)(\w+)\2/g)) {
    const start = cmd.indexOf('\n', m.index);
    if (start === -1) continue;
    const end = cmd.slice(start + 1).search(new RegExp(`^${m[1] ? '\\t*' : ''}${m[3]}$`, 'm'));
    const stop = end === -1 ? cmd.length : start + 1 + end;
    out = out.slice(0, start + 1) + blank(out.slice(start + 1, stop)) + out.slice(stop);
  }
  return out;
}
// Blank the inside of quoted strings, but keep a quoted path (`sed -i '…' "lib/x.sh"`).
export const maskQuotes = (cmd) => cmd.replace(/'([^'\n]*)'|"((?:[^"\\\n]|\\.)*)"/g, (q, a, b) => {
  const body = a ?? b;
  return /^(?:\/app\/|\.\/)?(?:bin|lib|tests|notes)\/\S*$/.test(body) ? q : q[0] + blank(body) + q[0];
});

// Files outside bin/ and lib/ whose edit is the implementation in a given cell (EXP-27: the T0
// cell s1 fixes a typo in README.md; with bin/lib only, its edit was not an implementation event
// and the measurement check stopped the aggregation).
export const IMPL_FILES = { 's1-typo-start': ['README.md'] };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function metrics(lines, { implFiles = [] } = {}) {
  const ev = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  let peak = 0, compact = 0;
  const calls = [];
  for (const e of ev) {
    if (e.type === 'system' && /compact/.test(e.subtype ?? '')) compact++;
    if (e.type !== 'assistant') continue;
    const u = e.message?.usage ?? {};
    peak = Math.max(peak, (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0));
    for (const c of e.message?.content ?? []) if (c.type === 'tool_use') calls.push({ name: c.name, input: c.input ?? {} });
  }
  // Events with a position: call index + offset inside a Bash command, because agents
  // often read, write and edit several files in one Bash call (EXP-19: memos written with
  // `cat > notes/X.md <<EOF`, phase files read with `cat 1-research.md`).
  const events = [];
  const add = (kind, i, off = 0, extra = {}) => events.push({ kind, pos: i + off / 1e6, ...extra });
  calls.forEach((c, i) => {
    const fp = String(c.input.file_path ?? '');
    if (c.name === 'Read') { const m = fp.match(/phases[\\/](\d)-/); if (m) add('phase', i, 0, { phase: Number(m[1]) }); }
    if (c.name === 'Skill') { const m = String(c.input.skill ?? c.input.name ?? '').match(/dev-phase-(\d)-/); if (m) add('phase', i, 0, { phase: Number(m[1]) }); }
    if (['Write', 'Edit', 'MultiEdit'].includes(c.name)) {
      if (/(^|\/)notes\//.test(fp)) add('memo', i); if (/(^|\/)tests\//.test(fp)) add('test', i); if (/(^|\/)(bin|lib)\//.test(fp) || implFiles.some((f) => fp === f || fp.endsWith(`/${f}`))) add('impl', i);
    }
    if (c.name !== 'Bash') return;
    // Heredoc bodies are data (a memo that quotes a command is not that command), and a sed
    // or perl expression may contain `;` (EXP-21: `sed -i 's|^total() .*|total() { echo $(( $1 * 110 / 100 )); }|' lib/sum_total.sh`
    // was missed as an implementation edit). Both are blanked with offsets kept.
    const cmd = maskHeredocs(String(c.input.command ?? ''));
    const unquoted = maskQuotes(cmd);
    const scan = (re, kind, extra, text = cmd) => { for (const m of text.matchAll(re)) add(kind, i, m.index, extra?.(m)); };
    scan(/(?:^|[\s;&|(])(?:cat|head|tail|sed -n|less|more)\b[^\n;|&]*?(?:phases\/)?(\d)-(?:intake|research|design|test-design|test-impl|impl|test-eval|rework|report)\.md/g, 'phase', (m) => ({ phase: Number(m[1]) }));
    scan(/(?:>|tee\s+(?:-a\s+)?)\s*['"]?(?:\/app\/|\.\/)?notes\//g, 'memo');
    scan(/(?:>|tee\s+(?:-a\s+)?)\s*['"]?(?:\/app\/|\.\/)?tests\/\S+/g, 'test');
    scan(/(?:>|tee\s+(?:-a\s+)?)\s*['"]?(?:\/app\/|\.\/)?(?:bin|lib)\//g, 'impl');
    // In-place edits count by where they land (EXP-21: a test was added with `sed -i '/^exit/e cat /tmp/l' tests/price_test.sh`).
    const inPlace = (dir) => new RegExp(String.raw`\b(?:sed\s+(?:-\w+\s+)*-i|perl\s+-\w*i)\b[^\n;|&]*?\s['"]?(?:\/app\/|\.\/)?${dir}\/`, 'g');
    scan(inPlace('(?:bin|lib)'), 'impl', undefined, unquoted);
    for (const f of implFiles) {
      scan(new RegExp(String.raw`(?:>|tee\s+(?:-a\s+)?)\s*['"]?(?:\/app\/|\.\/)?${esc(f)}(?![\w.])`, 'g'), 'impl');
      scan(new RegExp(String.raw`\b(?:sed\s+(?:-\w+\s+)*-i|perl\s+-\w*i)\b[^\n;|&]*?\s['"]?(?:\/app\/|\.\/)?${esc(f)}(?![\w.])`, 'g'), 'impl', undefined, unquoted);
    }
    scan(inPlace('tests'), 'test', undefined, unquoted);
    scan(inPlace('notes'), 'memo', undefined, unquoted);
    scan(/tests\/\S+_test\.sh|verify\.sh/g, 'testRun');
    scan(/verify\.sh/g, 'verify');
    scan(/git commit/g, 'commit');
  });
  const first = (kind) => { const e = events.filter((x) => x.kind === kind).sort((a, b) => a.pos - b.pos)[0]; return e ? e.pos : null; };
  const phases = events.filter((e) => e.kind === 'phase').sort((a, b) => a.pos - b.pos).map((e) => e.phase);
  const order = Object.fromEntries(['memo', 'test', 'impl', 'testRun', 'verify', 'commit'].map((k) => [k, first(k)]));
  const before = (a, b) => a !== null && (b === null || a < b);
  // redo (midway entry): an earlier phase's artifact (the memo or a test) written before the
  // first implementation edit, although the state file says those phases are done.
  const redo = (order.memo !== null && before(order.memo, order.impl)) || (order.test !== null && before(order.test, order.impl));
  return { peak, compact, toolCalls: calls.length, phases, order, skippedMemo: before(order.impl, order.memo), skippedTest: before(order.impl, order.test), early: phases.filter((p) => p < 5).length, redo };
}

// Measurement check: the transcript must show every event the final state proves happened.
// A predicate that passed on the final state (memo written, failing-first test added, task
// done) with no matching event in the transcript means the parser missed a command shape
// (EXP-19: Bash-embedded writes; EXP-21: `sed -i` with `;` in the expression). Midway cells
// start with the memo and the test in place, so only the implementation is checked there.
// Cells whose task is not a code edit (EXP-28: t7 is answered on the PR, through gh), so a solved
// task with no implementation event is not a parse miss.
export const NO_IMPL = ['t7-unrun-checks-start', 't7-unrun-checks-start-p'];
export function audit(m, results = [], kase = '') {
  const passed = (name) => results.some((r) => r.name === name && r.passed);
  const misses = [];
  if (passed('task-done') && m.order.impl === null && !NO_IMPL.includes(kase)) misses.push('impl');
  if (!kase.includes('midway')) {
    if (passed('memo') && m.order.memo === null) misses.push('memo');
    if (passed('failing-first') && m.order.test === null) misses.push('test');
  }
  return misses;
}

if (process.argv[1]?.endsWith('phase-metrics.mjs')) {
const [dir, prefix = '', ...flags] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const transcripts = Object.fromEntries(readdirSync(dir).filter((n) => n.endsWith('-jobs')).flatMap((j) => walk(join(dir, j)))
  .filter((f) => f.replaceAll('\\', '/').endsWith('agent/claude-code.txt'))
  .map((f) => [f.replaceAll('\\', '/').split('/').at(-3), f]));

const rows = [];
for (const r of doc.records.filter((x) => x.case.startsWith(prefix) && !x.arm.startsWith('script:'))) {
  const f = transcripts[r.harborTrial];
  if (!f || !existsSync(f)) { rows.push({ arm: r.arm, case: r.case, missing: true }); continue; }
  const m = metrics(readFileSync(f, 'utf8').split('\n'), { implFiles: IMPL_FILES[r.case] ?? [] });
  rows.push({ arm: r.arm, case: r.case, trial: r.harborTrial, outcome: r.outcome, valid: r.validity?.status !== 'invalid', validity: r.validity?.status, ...m, wrong: r.case.includes('midway') ? m.early : 0, misses: audit(m, r.results, r.case) });
}
const failed = rows.filter((x) => x.misses?.length);
if (failed.length && !flags.includes('--no-check')) {
  // Do not aggregate a run the parser cannot read: fix the parser first.
  console.log(`MEASUREMENT CHECK FAILED: ${failed.length} trial(s) where the final state shows an event the transcript parse missed`);
  for (const x of failed) console.log(`  ${x.trial} ${x.arm} missed: ${x.misses.join(',')}`);
  process.exit(2);
}
console.log(`measurement check: ok (${rows.filter((x) => !x.missing).length} trials)`);
if (flags.includes('--rows')) for (const x of rows) console.log(JSON.stringify(x));
const groups = {};
for (const x of rows.filter((x) => !x.missing && x.valid)) {
  const k = `${x.arm} | ${x.case}`;
  const g = (groups[k] ??= { n: 0, allFollowed: 0, skippedMemo: 0, skippedTest: 0, wrongPhaseReads: 0, wrongTrials: 0, redo: 0, compacted: 0, peakMax: 0, peakSum: 0, phaseReads: 0 });
  g.n++; g.allFollowed += x.outcome === 'all-followed'; g.skippedMemo += x.skippedMemo; g.skippedTest += x.skippedTest;
  g.wrongPhaseReads += x.wrong; g.wrongTrials += x.wrong > 0; g.redo += x.case.includes('midway') && x.redo; g.compacted += x.compact > 0; g.peakMax = Math.max(g.peakMax, x.peak); g.peakSum += x.peak; g.phaseReads += x.phases.length;
}
for (const [k, g] of Object.entries(groups)) console.log(`${k}: n=${g.n} all-followed=${g.allFollowed} skipped(memo/test)=${g.skippedMemo}/${g.skippedTest} wrong-phase-reads=${g.wrongPhaseReads} wrong-trials=${g.wrongTrials} redo=${g.redo} compacted=${g.compacted} peak-avg=${Math.round(g.peakSum / g.n)} peak-max=${g.peakMax} phase-reads=${g.phaseReads}`);
const miss = rows.filter((x) => x.missing).length;
const inv = rows.filter((x) => !x.missing && !x.valid).length;
if (inv) console.log(`invalid (excluded): ${inv}`);
if (miss) console.log(`transcript missing: ${miss}`);
}
