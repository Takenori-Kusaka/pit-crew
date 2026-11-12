// Re-evaluate the end-state checks (checks.mjs: `resolved`, H1 … H7) of STORED fix runs with the
// checks of the current suites/fix/suite.yaml, without running a model.
//
// Why not from the stored state alone: a record keeps the final WORKING TREE (state.files), the
// subjects of `git log --all` and HEAD. The predicates read the committed tip of the PR branch, the
// branch's reflog and the ancestry. In the EXP-44 runs 52 of 195 sessions ended on another branch
// than the PR's (the working tree is then develop's, and the tip's content is in no stored field),
// and no record says which commit a branch points at or what is an ancestor of what.
//
// What this does instead: it REPLAYS the record's trajectory (every Bash / Write / Edit call that was
// not denied, in order, same working directory rules) in a container built from the run's own task
// environment (arms/*/harbor-tasks/<case>/environment: the fixture, the gh stand-in), which rebuilds
// the repository the predicates ran on. A replay is ACCEPTED only when it reproduces what the record
// stored: every file hash of the working tree (files git ignores aside), the commit subjects of
// `git log --all`, and the exit code of every check the sandbox ran (the task's own tests/checks.sh,
// run again on the replay). Only then are the current checks run on it. A record whose replay does
// not reproduce is reported as not re-evaluable and keeps its stored codes.
//
// Needs docker (run it where the sieve ran: WSL / Linux) and the agent base image of the run.
// Usage:
//   node experiments/fix/recheck-harm.mjs [runs/2026-11-11] [--prefix=exp44] [--arms=vanilla,v0,default]
//        [--only=fx-a1,..] [--jobs=4] [--out=experiments/fix/recheck-exp44.json] [--audit=<file>] [--force]
//   node experiments/fix/recheck-harm.mjs --apply=experiments/fix/recheck-exp44.json --emit=<dir> [runs/2026-11-11]
//     writes <dir>/<prefix>-<case>-<arm>/results.json: the stored records with state.checks replaced by
//     the re-evaluated codes (state.checksStored keeps the old ones), for analyze-exp44.mjs <dir>.
// --audit also stores, per record, the variant H2 names, H5 in parts (ancestry, each probe) and the
// tip's diff of spec/ and the check runners. That file shows cell content: not for a harness designer.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { cells } from './cells.mjs';
import { prelude, HARMS, HARM_ID } from './checks.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const flag = (name) => process.argv.includes(`--${name}`);
const root = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'runs/2026-11-11';
const prefix = arg('prefix') ?? 'exp44';
const ARMS = (arg('arms') ?? 'vanilla,v0,default').split(',');
const only = (arg('only') ?? '').split(',').filter(Boolean);
const jobs = Number(arg('jobs') ?? 4);
const outPath = arg('out') ?? 'experiments/fix/recheck-exp44.json';
const auditPath = arg('audit');
const kept = JSON.parse(readFileSync(new URL('./rederive/agreement.json', import.meta.url), 'utf8')).summary.keptIds;
const ids = kept.filter((id) => !only.length || only.includes(id));
const runDir = (id, arm) => join(root, `${prefix}-${id}-${arm}`);
const NAMES = ['resolved', ...HARMS];

// ---- --apply: copies of the stored records with the re-evaluated codes ----
if (arg('apply')) {
  const emit = arg('emit');
  if (!emit) { console.error('--apply needs --emit=<dir>'); process.exit(2); }
  const re = JSON.parse(readFileSync(arg('apply'), 'utf8'));
  const by = Object.fromEntries(re.records.map((r) => [`${r.case} ${r.arm} ${r.trial}`, r]));
  let n = 0, replaced = 0;
  for (const id of kept) for (const arm of ARMS) {
    const p = join(runDir(id, arm), 'results.json');
    if (!existsSync(p)) continue;
    const res = JSON.parse(readFileSync(p, 'utf8'));
    for (const r of res.records) {
      n++;
      const x = by[`${id} ${arm} ${r.trial}`];
      if (!x?.reproduced || !r.state) continue;
      r.state.checksStored = r.state.checks; r.state.checks = x.rechecked; replaced++;
    }
    const d = join(emit, `${prefix}-${id}-${arm}`);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'results.json'), JSON.stringify(res));
  }
  console.log(`wrote ${emit}: ${n} records, ${replaced} with re-evaluated checks, ${n - replaced} with the stored ones`);
  process.exit(0);
}

const docker = (args, input, timeout = 200000) => spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 256 << 20, timeout });
const tagOf = (id, arm) => `pitwall-recheck:${prefix}-${id}-${arm}`.toLowerCase();
const taskDir = (id, arm) => { const a = join(runDir(id, arm), 'arms'); return join(a, readdirSync(a)[0], 'harbor-tasks', id); };

// ---- parent: build the images, run the workers, merge, tally ----
if (!arg('slice')) {
  if (docker(['version', '--format', '{{.Server.Version}}']).status !== 0) { console.error('docker is not reachable (run under WSL / Linux, where the sieve ran)'); process.exit(2); }
  const pairs = ids.flatMap((id) => ARMS.filter((arm) => existsSync(join(runDir(id, arm), 'results.json'))).map((arm) => [id, arm]));
  if (!pairs.length) { console.error(`no ${prefix}-<case>-<arm>/results.json under ${root}`); process.exit(2); }
  const notes = [];
  for (const [id, arm] of pairs) {
    const t = taskDir(id, arm);
    const b = docker(['build', '-q', '-t', tagOf(id, arm), join(t, 'environment')], null, 900000);
    if (b.status !== 0) { console.error(`docker build ${id} ${arm}: ${b.stderr}`); process.exit(2); }
    // The agent base image the run used, against the one the replay is built on.
    const img = join(t, '..', '.agent-image');
    if (existsSync(img)) {
      const { ref, id: was } = JSON.parse(readFileSync(img, 'utf8'));
      const now = docker(['image', 'inspect', '--format', '{{.Id}}', ref]).stdout.trim();
      if (now && was && now !== was && !notes.includes(ref)) notes.push(ref);
    }
  }
  if (notes.length) console.log(`note: the agent base image changed since the run (${notes.join(', ')}); a replay that still reproduces the stored state is accepted`);
  const tmp = join(tmpdir(), `fx-recheck-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  const parts = await Promise.all(Array.from({ length: jobs }, (_, k) => new Promise((resolve) => {
    const out = join(tmp, `${k}.json`);
    const ch = spawn(process.execPath, [fileURLToPath(import.meta.url), root, ...process.argv.slice(2).filter((a) => a.startsWith('--') && !a.startsWith('--jobs') && !a.startsWith('--out')), `--slice=${k}/${jobs}`, `--out=${out}`], { stdio: ['ignore', 'inherit', 'inherit'] });
    ch.on('close', () => resolve(existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null));
  })));
  rmSync(tmp, { recursive: true, force: true });
  if (!flag('keep-images')) for (const [id, arm] of pairs) docker(['rmi', '-f', tagOf(id, arm)]);
  if (parts.some((p) => p == null)) { console.error('FAIL: a worker wrote no result'); process.exit(1); }
  const order = (r) => `${String(ids.indexOf(r.case)).padStart(3, '0')} ${String(ARMS.indexOf(r.arm)).padStart(2, '0')} ${String(r.trial).padStart(3, '0')}`;
  const records = parts.flatMap((p) => p.records).sort((a, b) => order(a).localeCompare(order(b)));
  const audit = parts.flatMap((p) => p.audit ?? []).sort((a, b) => order(a).localeCompare(order(b)));
  // Tally per arm: each harm before (stored) and after (re-evaluated), over the reproduced records.
  const tally = {};
  for (const arm of ARMS) {
    const rs = records.filter((r) => r.arm === arm);
    const ok = rs.filter((r) => r.reproduced);
    const count = (set, field, name) => set.filter((r) => r[field]?.[name] !== undefined && r[field][name] !== 0).length;
    tally[arm] = {
      records: rs.length, reproduced: ok.length, notReEvaluable: rs.length - ok.length,
      storedAll: Object.fromEntries(HARMS.map((h) => [HARM_ID[h], count(rs, 'stored', h)])),
      stored: Object.fromEntries(HARMS.map((h) => [HARM_ID[h], count(ok, 'stored', h)])),
      rechecked: Object.fromEntries(HARMS.map((h) => [HARM_ID[h], count(ok, 'rechecked', h)])),
      resolvedStored: ok.filter((r) => r.stored.resolved === 0).length, resolvedRechecked: ok.filter((r) => r.rechecked.resolved === 0).length,
      anyHarmStored: ok.filter((r) => HARMS.some((h) => r.stored[h] !== 0)).length, anyHarmRechecked: ok.filter((r) => HARMS.some((h) => r.rechecked[h] !== 0)).length,
    };
  }
  const suiteSha = spawnSync('git', ['hash-object', 'suites/fix/suite.yaml'], { encoding: 'utf8' }).stdout.trim();
  writeFileSync(outPath, `${JSON.stringify({ runs: root, prefix, arms: ARMS, cases: ids, suite: { path: 'suites/fix/suite.yaml', blob: suiteSha }, tally, records }, null, 1)}\n`);
  if (auditPath) writeFileSync(auditPath, `${JSON.stringify({ records: audit }, null, 1)}\n`);
  console.log(`\n| arm | records | reproduced | ${HARMS.map((h) => `${HARM_ID[h]} stored→now`).join(' | ')} | any harm stored→now |\n|---|---|---|${HARMS.map(() => '---').join('|')}|---|`);
  for (const arm of ARMS) { const t = tally[arm]; console.log(`| ${arm} | ${t.records} | ${t.reproduced} | ${HARMS.map((h) => `${t.stored[HARM_ID[h]]}→${t.rechecked[HARM_ID[h]]}`).join(' | ')} | ${t.anyHarmStored}→${t.anyHarmRechecked} |`); }
  const lost = records.filter((r) => !r.reproduced);
  console.log(`\n${records.length} records, ${records.length - lost.length} reproduced and re-evaluated, ${lost.length} not re-evaluable${lost.length ? `: ${lost.map((r) => `${r.case}/${r.arm}/${r.trial} (${r.why.join('; ')})`).join(', ')}` : ''}`);
  console.log(`wrote ${outPath}${auditPath ? ` and ${auditPath}` : ''}`);
  process.exit(0);
}

// ---- worker: one slice of the records ----
const [sk, sn] = arg('slice').split('/').map(Number);
const suite = loadSuite('suites/fix/suite.yaml');
const fn = (id) => `probe_${id.replace(/[^A-Za-z0-9]/g, '_')}`;
// As Claude Code's Bash tool: the working directory carries over from call to call.
const WRAP = `cd "$(cat /tmp/.rp-cwd 2>/dev/null || echo /app)" 2>/dev/null || cd /app\ntrap 'pwd > /tmp/.rp-cwd' EXIT\neval "$(cat /tmp/.rp-cmd)"\n`;
const records = [], audit = [];
let n = 0;
for (const id of ids) {
  const kase = suite.cases.find((c) => c.id === id);
  const cell = cells.find((c) => c.id === id);
  for (const arm of ARMS) {
    const p = join(runDir(id, arm), 'results.json');
    if (!existsSync(p)) continue;
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    const t = taskDir(id, arm);
    for (const r of recs) {
      if ((n++ % sn) !== sk) continue;
      const row = { case: id, arm, trial: r.trial, validity: r.validity?.status ?? null, stored: r.state?.checks ?? {}, reproduced: false, why: [], rechecked: null };
      records.push(row);
      if (!r.trajectory?.steps || !r.state?.files) { row.why.push('no trajectory or no state'); continue; }
      const name = `pitwall-recheck-${process.pid}-${n}`;
      const up = docker(['run', '-d', '--rm', '--network', 'none', '--name', name, tagOf(id, arm), 'sleep', '7200']);
      if (up.status !== 0) { row.why.push('container did not start'); continue; }
      const ex = (cmd, input, timeout) => docker(['exec', '-i', '-w', '/app', name, 'bash', '-c', cmd], input ?? '', timeout);
      try {
        ex('cat > /tmp/.rp-wrap', WRAP);
        let k = 0;
        for (const s of r.trajectory.steps) for (const c of s.tool_calls ?? []) {
          k++;
          const a = c.arguments ?? {};
          if (c.extra?.denied) continue;
          const abs = (f) => (f.startsWith('/') ? f : `/app/${f}`);
          const q = (f) => `'${f.replace(/'/g, `'\\''`)}'`;
          if (c.function_name === 'Bash') {
            ex('cat > /tmp/.rp-cmd', a.command ?? '');
            if (ex('timeout 170 bash /tmp/.rp-wrap </dev/null >/dev/null 2>&1; true').status !== 0) row.why.push(`call ${k}: not replayed`);
          } else if (c.function_name === 'Write' && !c.extra?.result?.is_error) {
            if (ex(`mkdir -p "$(dirname ${q(abs(a.file_path))})" && cat > ${q(abs(a.file_path))}`, a.content ?? '').status !== 0) row.why.push(`call ${k}: write failed`);
          } else if (c.function_name === 'Edit' && !c.extra?.result?.is_error) {
            const cur = ex(`cat ${q(abs(a.file_path))}`);
            if (cur.status !== 0 || !cur.stdout.includes(a.old_string)) { row.why.push(`call ${k}: edit does not apply`); continue; }
            ex(`cat > ${q(abs(a.file_path))}`, a.replace_all ? cur.stdout.split(a.old_string).join(a.new_string) : cur.stdout.replace(a.old_string, () => a.new_string));
          } else if (!['Bash', 'Write', 'Edit', 'Read', 'Grep', 'Glob', 'Skill', 'ToolSearch', 'TodoWrite'].includes(c.function_name) && !c.extra?.result?.is_error) {
            row.toolsNotReplayed = [...new Set([...(row.toolsNotReplayed ?? []), c.function_name])];
          }
        }
        // The end state, before any check runs (as state-capture.sh), against the stored one.
        const files = Object.fromEntries(ex(`find . -path ./.git -prune -o -type f -print0 | sort -z | xargs -0 sha256sum`).stdout.split('\n').filter(Boolean).map((l) => [l.slice(66).replace(/^\.\//, ''), l.slice(0, 64)]));
        const differ = [...new Set([...Object.keys(files), ...Object.keys(r.state.files)])].filter((f) => files[f] !== r.state.files[f]?.sha256);
        const ignored = new Set(differ.length ? ex('git check-ignore --stdin', `${differ.join('\n')}\n`).stdout.split('\n').filter(Boolean) : []);
        const treeDiff = differ.filter((f) => !ignored.has(f));
        if (treeDiff.length) row.why.push(`${treeDiff.length} file(s) of the working tree differ`);
        const subjects = ex(`git log --all --format='%s'`).stdout.split('\n').filter(Boolean).sort();
        if (JSON.stringify(subjects) !== JSON.stringify((r.state.git?.log ?? []).map((l) => l.message).sort())) row.why.push('the commit subjects differ');
        // The checks the sandbox ran, again, with the capture's environment.
        ex('mkdir -p /tests && cat > /tests/checks.sh', readFileSync(join(t, 'tests', 'checks.sh'), 'utf8'));
        const again = Object.fromEntries(ex('PITWALL_GH_STATE=/tmp/pitwall-gh-state.checks.json PITWALL_RUNS_LOG=/tmp/pitwall-runs.checks.log PITWALL_AGENT_RUNS_LOG=/tmp/pitwall-runs.log bash /tests/checks.sh 2>/dev/null', '', 1200000).stdout
          .split('\n').filter(Boolean).map((l) => { const [nm, code] = l.split('\t'); return [nm, Number(code)]; }));
        const off = Object.keys(row.stored).filter((nm) => again[nm] !== row.stored[nm]);
        if (off.length) row.why.push(`the stored checks do not reproduce: ${off.join(', ')}`);
        row.reproduced = row.why.length === 0;
        // The current checks, each as the sandbox runs one (checksScript in runners/harbor.mjs).
        const now = {}, secs = {}, trace = [];
        for (const nm of NAMES) {
          ex('cat > /tmp/pitwall-check.sh', kase.checks[nm]);
          const t0 = Date.now();
          now[nm] = Number(ex('(cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; echo $?', '', 300000).stdout.trim());
          secs[nm] = Math.round((Date.now() - t0) / 100) / 10;
        }
        // For the audit: H2 once more, through every variant (no early stop, no budget), naming each loss.
        if (auditPath) {
          ex('cat > /tmp/pitwall-check.sh', kase.checks['h2-no-weakened-check']);
          trace.push(...ex(`(cd /app && PITWALL_FX_TRACE=all PITWALL_FX_H2_BUDGET=900 timeout 900 bash /tmp/pitwall-check.sh) >/dev/null 2>/tmp/.ck-err; grep '^h2: ' /tmp/.ck-err`, '', 1000000).stdout.split('\n').filter(Boolean));
        }
        if (row.reproduced) row.rechecked = now; else row.recheckedOnUnreproducedReplay = now;
        row.seconds = secs;
        if (auditPath) {
          const parts = `${prelude(cell)}\ngit merge-base --is-ancestor "$R" "$TIP"; echo "receivedIsAncestor\t$?"\nwt tip "$TIP" || exit 1\n${cell.findings.filter((f) => f.probe).map((f) => `${fn(f.id)}; echo "${f.id}\t$?"`).join('\n')}\necho "tipIsReceived\t$([ "$TIP" = "$R" ] && echo 0 || echo 1)"\necho "headIsTip\t$([ "$(git rev-parse HEAD)" = "$TIP" ] && echo 0 || echo 1)"\n`;
          ex('cat > /tmp/pitwall-parts.sh', parts);
          const h5 = Object.fromEntries(ex('bash /tmp/pitwall-parts.sh 2>/dev/null').stdout.split('\n').filter(Boolean).map((l) => l.split('\t')).map(([a2, b2]) => [a2, Number(b2)]));
          const specDiff = ex(`${prelude(cell)}\ngit diff "$R" "$TIP" -- spec tools/check tools/lint`).stdout;
          audit.push({ case: id, arm, trial: r.trial, reproduced: row.reproduced, stored: row.stored, now, h2Names: trace, h5Parts: h5, expect: Object.fromEntries(cell.findings.map((f) => [f.id, f.expect])), dirty: ex('git status --porcelain').stdout.split('\n').filter(Boolean), specDiff });
        }
        console.log(`${id} ${arm} t${r.trial} ${row.reproduced ? 'reproduced' : `NOT reproduced (${row.why.join('; ')})`} ${NAMES.filter((nm) => row.stored[nm] !== now[nm]).map((nm) => `${nm} ${row.stored[nm]}→${now[nm]}`).join(' ') || 'no code changed'} (h2 ${secs['h2-no-weakened-check']}s)`);
      } finally { docker(['kill', name]); }
    }
  }
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ records, audit }));
