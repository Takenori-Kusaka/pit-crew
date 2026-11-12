// Audit helper: mechanism flags per trial (independent of the grader's verdict), to find
// "done but not recognised" candidates. Prints counts per group x arm; --list prints the trials.
// Usage: node experiments/audit-2026-11-12/mech.mjs <config> [--list flag]
import { load, CONFIGS } from './items.mjs';
import { fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';

const name = process.argv[2] ?? 'exp32';
const listFlag = process.argv.includes('--list') ? process.argv[process.argv.indexOf('--list') + 1] : null;
const rows = load(name).filter((r) => r.checks && r.valid);
const res = (r, id) => r.checks.find((c) => c.id === id)?.result;
const TESTY = /test|spec|check|verify|repro|assert/i;
const SEARCH_CMD = /(^|[\s;&|(])(grep|egrep|fgrep|rg|ag|ack|git\s+grep|git\s+log\s+[^|;]*-[SG])\b/;

export function flags(r) {
  const t = r.record.trajectory;
  const calls = (t.steps ?? []).flatMap((s) => s.tool_calls ?? []);
  const fi = r.facts.firstImpl;
  const cut = fi == null ? Infinity : fi;
  const role = (p) => fileRole(p, { implFiles: r.opts.implFiles ?? [] });
  const stateFiles = Object.keys(r.record.state?.files ?? {});
  const out = {};
  // tools
  const toolName = (c) => c.function_name ?? c.name;
  out.usesAgent = calls.some((c) => ['Agent', 'Task'].includes(toolName(c)));
  out.usesAgentBeforeCut = calls.some((c, i) => i < cut && ['Agent', 'Task'].includes(toolName(c)));
  out.usesSkill = calls.some((c) => toolName(c) === 'Skill');
  // first impl path as the grader saw it
  const implWrites = [];
  calls.forEach((c, i) => {
    const n = toolName(c); const inp = c.arguments ?? c.input ?? {};
    if (['Write', 'Edit', 'MultiEdit'].includes(n)) implWrites.push({ i, path: String(inp.file_path ?? ''), how: n });
  });
  out.firstImplPath = r.facts.changed.length && fi != null ? (() => {
    // the changed list is in order of first edit
    return r.facts.changed[0];
  })() : null;
  const p0 = out.firstImplPath;
  out.firstImplTesty = p0 != null && TESTY.test(p0.replace(/^.*\//, ''));
  out.firstImplNotInEnd = p0 != null && stateFiles.length > 0 && !stateFiles.includes(p0);
  out.anyChangedTesty = r.facts.changed.some((p) => TESTY.test(p.replace(/^.*\//, '')));
  out.changedNotInEnd = r.facts.changed.filter((p) => stateFiles.length > 0 && !stateFiles.includes(p));
  // search-like commands before cut that the grader did not count
  const bashBefore = calls.map((c, i) => ({ c, i })).filter(({ c, i }) => i < cut && toolName(c) === 'Bash').map(({ c }) => String((c.arguments ?? c.input ?? {}).command ?? ''));
  out.rawSearchBefore = bashBefore.some((x) => SEARCH_CMD.test(x)) || calls.some((c, i) => i < cut && toolName(c) === 'Grep');
  out.searchedFalseButRaw = res(r, 'research.searched') === false && out.rawSearchBefore;
  out.findOrGlobBefore = bashBefore.some((x) => /(^|[\s;&|(])find\s/.test(x)) || calls.some((c, i) => i < cut && toolName(c) === 'Glob');
  // failure observation: runs before cut
  const obs = r.facts.observations ?? [];
  out.failFalse = res(r, 'research.failure-observed') === false;
  out.failFalseWithRuns = out.failFalse && obs.length > 0;
  out.failFalseNoRuns = out.failFalse && obs.length === 0;
  out.failTrueViaProgram = r.facts.failureObserved?.via === 'program';
  out.failTrueVia = r.facts.failureObserved?.via ?? null;
  // any Bash before cut at all that is not read/search (possible unrecognised run)
  out.bashBefore = bashBefore.length;
  out.noImpl = fi == null;
  out.nCalls = calls.length;
  out.cut = fi;
  return out;
}

if (process.argv[1].split(String.fromCharCode(92)).join('/').endsWith('mech.mjs')) {
  const cfg = CONFIGS[name];
  for (const g of Object.keys(cfg.groups)) {
    console.log(`\n## ${name} ${g}`);
    console.log('| arm | n | Agent tool used (before cut) | Skill tool | first impl path test-like | changed path not in end state | searched=false but raw search cmd | find/Glob before cut | fail-obs false: no runs / with runs | fail-obs true via test/repro/program | mean calls | mean cut |');
    for (const a of cfg.arms) {
      const rs = rows.filter((r) => r.group === g && r.arm === a).map((r) => ({ r, f: flags(r) }));
      const c = (k) => rs.filter((x) => x.f[k]).length;
      const via = (v) => rs.filter((x) => x.f.failTrueVia === v).length;
      const m = (k) => (rs.reduce((s, x) => s + (x.f[k] ?? 0), 0) / rs.length).toFixed(1);
      const cuts = rs.filter((x) => x.f.cut != null);
      console.log(`| ${a} | ${rs.length} | ${c('usesAgent')} (${c('usesAgentBeforeCut')}) | ${c('usesSkill')} | ${c('firstImplTesty')} | ${rs.filter((x) => x.f.changedNotInEnd.length).length} | ${c('searchedFalseButRaw')} | ${c('findOrGlobBefore')} | ${c('failFalseNoRuns')} / ${c('failFalseWithRuns')} | ${via('test')}/${via('repro')}/${via('program')} | ${m('nCalls')} | ${(cuts.reduce((s, x) => s + x.f.cut, 0) / (cuts.length || 1)).toFixed(1)} |`);
      if (listFlag) for (const x of rs.filter((y) => (Array.isArray(y.f[listFlag]) ? y.f[listFlag].length : y.f[listFlag]))) console.log(`    ${x.r.cell} #${x.r.k} first=${x.f.firstImplPath} changed=${x.r.facts.changed.join(',')} notInEnd=${x.f.changedNotInEnd.join(',')}`);
    }
  }
}
