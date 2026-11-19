// The ref facts of a list of events, replayed without a container by the SAME replay the self-check of the scripted
// controls uses (harbor-cases.mjs simulatedRun):
//   a staged scene (remote / stage / gh_snapshot / layer)  the whole local pipeline (capture-local.mjs runLocal: the
//                          image's build and setup scripts, the logged bare remote, the capture) -> state.git and
//                          state.remote as kitState gives them to the grader
//   any other case         the temporary repository of local-checks.mjs localRun (Edit / Write and the LOCAL git
//                          commands) -> state.git
// For the planted-error self-check (perturb.mjs): its variants are graded on a simulated state that has no refs and no
// remote, so a row that reads them (hand-back-via-branch-or-pr with a logged remote: the remote's refs) could not be
// decided. This gives those variants the facts a replayed control has. Only the facts that the replay knows and the
// simulated state does not are returned ({ git, remote, checks }); the rest of the state stays the simulated one.
//
// What is replayed of the events: the files they write and their git commands that can move a ref. A Read, a gh call,
// a test command, a git command that only reads (diff, status, log, ...) or a planted effect does not move a ref, so it
// is left out, and variants that differ only in those share one replay. A written file whose content the events do not
// carry gets the fixture's reference content, else a placeholder (only the refs are read back, not the tree). The
// case's named checks (fixture `checks`) are run on the replayed end tree, as the self-check of the scripted controls
// runs them, and their results are part of the facts (`checks`); its own `check` is not run (the simulated state keeps
// checks_pass).
// Cache: in memory, and on disk under <tmpdir>/pit-wall-replay/ (the self-check is run many times by kit-check, and a
// staged replay takes seconds). The key covers the replayed steps (paths and commands; a written text only through
// its path), the case (its whole compiled form) and the source of every script the replay runs, so a change of any of
// them is a new key. PITWALL_REPLAY_CACHE=0 turns the disk cache off.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureState } from '../fixture.mjs';
import { runLocal } from './capture-local.mjs';
import { kitState, realize } from './harbor-cases.mjs';
import { localBash, localRun, namedChecks } from './local-checks.mjs';
import { endStateFacts, shellCommands } from './predicates.mjs';

const READS = /^(status|diff|log|show|blame|rev-parse|ls-files|grep|describe|shortlog|reflog|cat-file|for-each-ref|ls-remote|help|version|--version)$/;
// the first word after git's own options (-C dir, -c k=v, --no-pager)
const sub = (w) => { let i = 1; while (i < w.length && /^-/.test(w[i])) i += /^-[Cc]$/.test(w[i]) ? 2 : 1; return w[i]; };
const usesGit = (command) => shellCommands(String(command ?? '')).some((c) => { const w = c.words ?? []; return w[0] === 'git' && !READS.test(sub(w) ?? ''); });

// events -> the steps that can move a ref: Write (path, text) and Bash steps with a git command
export function replayedSteps(events, content = {}) {
  const out = [];
  for (const e of events) {
    if (['Edit', 'Write'].includes(e.tool) && e.path) out.push({ tool: 'Write', path: e.path, text: typeof e.new === 'string' ? e.new : typeof content[e.path] === 'string' ? content[e.path] : 'planted\n' });
    // a step of the reference script is run whole (it may write a file by a shell command: the named checks read the
    // tree); a planted step only for its git commands (a planted command may name a host, and nothing here contacts one)
    else if (e.tool === 'Bash' && (usesGit(e.command) || (e.ref_step && typeof e.command === 'string'))) out.push({ tool: 'Bash', command: e.command });
  }
  return out;
}

const cache = new Map();
const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCES = ['replay-facts.mjs', 'capture-local.mjs', 'capture.mjs', 'kit-setup.sh', 'kit-capture.sh', 'local-checks.mjs', 'harbor-cases.mjs', 'scene.mjs', '../fixture.mjs', '../runners/state-capture.sh', '../../shims/gh', '../../shims/mark-run.sh', '../../shims/ran-on-final.sh'];
let sourcesSha;
const sourcesDigest = () => (sourcesSha ??= createHash('sha256').update(SOURCES.map((p) => { const f = join(HERE, p); return existsSync(f) ? readFileSync(f) : Buffer.from(`missing ${p}`); }).reduce((a, b) => Buffer.concat([a, Buffer.from([0]), b]), Buffer.alloc(0))).digest('hex'));
const diskDir = () => (process.env.PITWALL_REPLAY_CACHE === '0' ? null : join(tmpdir(), 'pit-wall-replay'));
// the case without where it lies on disk: a layer's stand-in base tree counts by its content, not its path
const treeDigest = (d) => { const h = createHash('sha256'); const walk = (rel) => { for (const e of readdirSync(join(d, rel), { withFileTypes: true }).sort((x, y) => (x.name < y.name ? -1 : 1))) { const p = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) walk(p); else h.update(p).update(Buffer.from([0])).update(readFileSync(join(d, p))).update(Buffer.from([0])); } }; walk(''); return h.digest('hex'); };
const caseDigest = (kase) => createHash('sha256').update(JSON.stringify({ ...kase, controls: undefined, scripts: undefined, ...(kase.layer ? { layer: { ...kase.layer, localBase: kase.layer.localBase ? treeDigest(kase.layer.localBase) : null } } : {}) })).digest('hex');
// kase: a case of harborCases. Returns { facts: { git, remote? }, replayed: 'pipeline' | 'local' } or
// { unavailable: why } (no POSIX bash; a layer without a stand-in base tree).
export function replayFacts(kase, events, { bash = localBash(), content = {} } = {}) {
  if (!bash) return { unavailable: 'no POSIX bash (set PITWALL_BASH)' };
  if (kase.layer && !kase.layer.localBase) return { unavailable: 'a layer is replayed only with a stand-in base tree (layer.local_base)' };
  const steps = replayedSteps(events, content);
  // the case's named checks (fixture `checks`, not its own `check`) are run on the replayed end tree, as the self-check of
  // the controls runs them: then a written text decides a result, so it is part of the key
  const named = namedChecks(kase.checks);
  const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
  const key = createHash('sha256').update(JSON.stringify([sourcesDigest(), caseDigest(kase), bash, steps.map((s) => (s.tool === 'Write' ? ['W', s.path, ...(named.length ? [sha(s.text)] : [])] : ['B', s.command]))])).digest('hex');
  if (cache.has(key)) return cache.get(key);
  const dir = diskDir(), file = dir && join(dir, `${key}.json`);
  if (file && existsSync(file)) { try { const v = JSON.parse(readFileSync(file, 'utf8')); cache.set(key, v); return v; } catch { /* a broken entry is replayed again */ } }
  let out;
  if (kase.staged) {
    const texts = Object.fromEntries(Object.entries(kase.layer ? {} : fixtureState(kase)).map(([p, f]) => [p, f.text]));
    const r = realize(steps, texts);
    const record = runLocal({ ...kase, checks: Object.fromEntries(named) }, { bash, steps: r.script });
    const st = kitState(record.state, kase, r.events, [], record.kit_facts);
    const checks = named.length && st.checks ? Object.fromEntries(named.map(([n]) => [n, st.checks[n] ?? null])) : null;
    out = { facts: { ...(st.git ? { git: st.git } : {}), ...(st.remote ? { remote: st.remote } : {}), ...(checks ? { checks } : {}) }, replayed: 'pipeline' };
  } else {
    const start = Object.fromEntries(Object.entries(fixtureState(kase)).map(([p, f]) => [p, f.text]));
    const local = localRun({ checks: named, start, events: steps.map((s) => (s.tool === 'Write' ? { tool: 'Write', path: s.path, new: s.text.replace(/\n$/, '') } : s)), bash });
    const f = local ? endStateFacts({ ...(local.git ? { git: local.git } : {}), ...(named.length ? { checks: local.checks } : {}) }) : {};
    out = { facts: { ...(f.git ? { git: f.git } : {}), ...(f.checks ? { checks: f.checks } : {}) }, replayed: 'local' };
  }
  cache.set(key, out);
  if (file) { try { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(out)); } catch { /* the disk cache is only a speed-up */ } }
  return out;
}
