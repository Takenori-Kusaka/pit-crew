// EXP-48 G4: the tests that run INSIDE a task image (process v2: "エージェントが走る image の
// 中の test"). Run with the real node, one phase per fresh container (run-g4.sh):
//   node /g4/g4-in-image.mjs <phase> <out.json>
// Phases:
//   checks      which of the project's own checks run, offline, on the pre-fix tree; time, exit
//               code, peak memory, and for vitest the failing files (to count "already red")
//   recorder    every invocation form leaves a record; the output and exit code are those of the
//               unwrapped tool; a timed-out and a killed run are recorded
//   capture     end-state capture: size, time, nothing ignored in it
//   hidden      the verifier on the tree as it is (control "no change": must fail)
//   reference   the reference fix applied, then the verifier (control: must pass)
//   leak        the hidden check files and the reference fix are nowhere in the image
// Output: numbers, exit codes, path lists and counts only — no file content, no test titles.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [phase, outFile] = process.argv.slice(2);
const APP = '/app', NODE = process.execPath, REC = '/opt/pitwall/rec/recorder.mjs';
const { readRecords } = await import(REC);
const peakMiB = () => { try { return Math.round(Number(readFileSync('/sys/fs/cgroup/memory.peak', 'utf8')) / (1 << 20)); } catch { return null; } };
const sh = (cmd, { sec = 600, env = {}, cwd = APP } = {}) => {
  const t0 = Date.now();
  const r = spawnSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout: sec * 1000, killSignal: 'SIGKILL', maxBuffer: 1 << 29, env: { ...process.env, CI: '1', ...env } });
  return { exit: r.status, signal: r.signal, timedOut: r.error?.code === 'ETIMEDOUT', sec: Math.round((Date.now() - t0) / 100) / 10, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
};
const slim = (r) => ({ exit: r.exit, signal: r.signal ?? null, timedOut: r.timedOut, sec: r.sec });
const recs = (dir) => readRecords(dir);
const out = { phase, node: process.version, when: new Date().toISOString() };

if (phase === 'checks') {
  // The commands a developer of the project would type (package.json scripts and their parts).
  const list = (process.env.G4_CHECKS ?? 'vitest-related,vitest,svelte-check,tsc,biome,eslint').split(',');
  const related = JSON.parse(readFileSync('/tests/hidden.json', 'utf8'));
  const relatedFiles = [...related.hidden, ...related.siblings].filter((p) => existsSync(join(APP, p)));
  const defs = {
    'vitest-related': { cmd: `npx vitest run ${relatedFiles.map((p) => `'${p}'`).join(' ')}`, sec: 900 },
    vitest: { cmd: 'npx vitest run', sec: 1800 },
    'svelte-check': { cmd: 'npm run check', sec: 1200 },
    tsc: { cmd: 'npx tsc --noEmit', sec: 900 },
    biome: { cmd: 'npx biome check .', sec: 600 },
    eslint: { cmd: "npx eslint --no-error-on-unmatched-pattern 'src/**/*.svelte' 'src/**/*.svelte.ts'", sec: 900 },
  };
  out.checks = {};
  for (const name of list) {
    const d = defs[name];
    const rec = `/tmp/rec-${name}`;
    const r = sh(d.cmd, { sec: d.sec, env: { PITWALL_REC_DIR: rec } });
    const row = { ...slim(r), peakMiBSoFar: peakMiB(), records: recs(rec).map((x) => x.tool) };
    const v = recs(rec).find((x) => x.tool === 'vitest' && x.tests);
    if (v) {
      // A file is red when it failed (a failed test, or it could not be collected: failed with no
      // test). Skipped files (every test skipped by a condition) are counted apart: not red.
      const of = (s) => v.tests.files.filter((f) => f.status === s).map((f) => f.file).sort();
      const failed = of('failed');
      row.vitest = { ...v.tests.summary, filesReported: v.tests.files.length, failedFiles: failed.length, skippedFiles: of('skipped').length, passedFiles: of('passed').length, failedAtCollection: v.tests.files.filter((f) => f.status === 'failed' && f.tests.length === 0).length };
      row.failedFilesList = failed; // paths only; kept in the local result, counted in the tracked one
      row.skippedFilesList = of('skipped');
    }
    if (r.exit === 134 || r.signal) row.abort = { heapOutOfMemory: /heap out of memory|Allocation failed/.test(r.stdout + r.stderr), killedByCgroup: /Killed/.test(r.stderr) };
    if (name === 'svelte-check') row.summaryLine = (r.stdout.match(/svelte-check found (\d+) errors? and (\d+) warnings?(?: in (\d+) files?)?/) ?? []).slice(1).map(Number);
    if (name === 'tsc') row.errorLines = (r.stdout.match(/error TS\d+/g) ?? []).length;
    if (name === 'biome') row.summaryLine = (r.stdout + r.stderr).match(/Found (\d+) errors?/)?.[1] ?? null;
    if (name === 'eslint') row.problems = (r.stdout.match(/✖ (\d+) problems?/) ?? [])[1] ?? null;
    out.checks[name] = row;
    rmSync(rec, { recursive: true, force: true });
  }
  out.peakMiB = peakMiB();
}

if (phase === 'recorder') {
  const hidden = JSON.parse(readFileSync('/tests/hidden.json', 'utf8'));
  const one = hidden.siblings.find((p) => existsSync(join(APP, p)));
  const rec = '/tmp/rec-forms';
  const env = { PITWALL_REC_DIR: rec };
  // 1. the caller sees the same thing with and without the recorder (durations masked)
  // colour codes first: they sit between a number and its unit
  const mask = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\d{2}:\d{2}:\d{2}/g, 'HH:MM:SS').replace(/\d+(\.\d+)?\s?m?s\b/g, 'T');
  const wrapped = sh(`node_modules/.bin/vitest run '${one}'`, { env });
  const plain = sh(`${NODE} node_modules/vitest/vitest.mjs run '${one}'`, { env });
  const wrappedTsc = sh('npx tsc --version', { env });
  const plainTsc = sh(`${NODE} node_modules/typescript/bin/tsc --version`, { env });
  out.sameOutput = { vitestStdout: mask(wrapped.stdout) === mask(plain.stdout), vitestStderr: mask(wrapped.stderr) === mask(plain.stderr), vitestExit: [wrapped.exit, plain.exit], tscStdout: wrappedTsc.stdout === plainTsc.stdout, tscExit: [wrappedTsc.exit, plainTsc.exit], vitestLines: wrapped.stdout.split('\n').length };
  // kept locally for a reader of a mismatch (tool output of the subject's test: not tracked)
  writeFileSync(`${outFile}.wrapped.txt`, mask(wrapped.stdout)); writeFileSync(`${outFile}.plain.txt`, mask(plain.stdout));
  const wl = mask(wrapped.stdout).split('\n'), pl = mask(plain.stdout).split('\n');
  out.sameOutput.differingLines = Math.max(wl.length, pl.length) - wl.filter((l, i) => l === pl[i]).length;
  rmSync(rec, { recursive: true, force: true });
  // 2. the forms
  const forms = [
    ['npx vitest run <file>', `npx vitest run '${one}'`, 'vitest'],
    ['npm test -- <file>', `npm test -- '${one}'`, 'vitest'],
    ['npm run test -- <file>', `npm run test -- '${one}'`, 'vitest'],
    ['node_modules/.bin/vitest run <file>', `node_modules/.bin/vitest run '${one}'`, 'vitest'],
    ['node node_modules/vitest/vitest.mjs run <file>', `node node_modules/vitest/vitest.mjs run '${one}'`, 'vitest'],
    ['a && b', `npx biome --version && npx vitest run '${one}'`, 'vitest'],
    ["bash -c 'cd src && npx vitest run --root ..'", `bash -c "cd src && npx vitest run --root .. '${one}'"`, 'vitest'],
    ['(cd /app && ./node_modules/.bin/tsc --version)', '(cd /app && ./node_modules/.bin/tsc --version)', 'tsc'],
    ['npx svelte-check --version', 'npx svelte-check --version', 'svelte-check'],
    ['npx biome check <file>', `npx biome check '${one}'`, 'biome'],
    ['npx eslint --version', 'npx eslint --version', 'eslint'],
    ['npx svelte-kit sync', 'npx svelte-kit sync', 'svelte-kit'],
    ['env X=1 /app/node_modules/.bin/vitest run <missing path>', "env X=1 /app/node_modules/.bin/vitest run tests/unit/pitwall-no-such.test.ts", 'vitest'],
  ];
  out.forms = forms.map(([label, cmd, tool]) => {
    const before = recs(rec).length;
    const r = sh(cmd, { env, sec: 600 });
    const added = recs(rec).slice(before);
    const hit = added.filter((x) => x.tool === tool);
    return { form: label, exit: r.exit, sec: r.sec, recorded: hit.length, recordExit: hit.at(-1)?.exit ?? null, hasTree: !!hit.at(-1)?.srcTree, perTest: hit.at(-1)?.tests ? hit.at(-1).tests.summary.tests : null, allTools: added.map((x) => x.tool) };
  });
  // 3. timeout (SIGTERM) and hard kill (SIGKILL) of a full run
  const before = recs(rec).length;
  const to = sh('timeout 8 npx vitest run', { env, sec: 120 });
  const afterTo = recs(rec).slice(before).filter((x) => x.tool === 'vitest');
  const child = spawn('bash', ['-c', 'exec node_modules/.bin/vitest run'], { cwd: APP, env: { ...process.env, ...env }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 8000));
  child.kill('SIGKILL');
  await new Promise((r) => setTimeout(r, 1500));
  spawnSync('pkill', ['-9', '-f', 'vitest']);
  const afterKill = recs(rec).slice(before).filter((x) => x.tool === 'vitest').slice(afterTo.length);
  out.timeout = { exit: to.exit, records: afterTo.length, ended: afterTo.at(-1)?.ended ?? null, signal: afterTo.at(-1)?.signal ?? null, recordExit: afterTo.at(-1)?.exit ?? null };
  out.kill = { records: afterKill.length, ended: afterKill.at(-1)?.ended ?? null };
  out.formsCovered = out.forms.filter((f) => f.recorded >= 1).length;
}

if (phase === 'capture') {
  writeFileSync(join(APP, 'src/lib/pitwall-probe.ts'), 'export const probe = 1;\n');
  writeFileSync(join(APP, 'PITWALL-REPORT.md'), 'report\n');
  sh('npx tsc --version', { env: {} });
  const t0 = Date.now();
  const r = sh(`${NODE} /tests/state-capture.mjs /app /tmp/state.json`);
  const st = JSON.parse(readFileSync('/tmp/state.json', 'utf8'));
  const nm = sh('du -sm node_modules | cut -f1').stdout.trim();
  out.capture = { exit: r.exit, ms: Date.now() - t0, bytes: statSync('/tmp/state.json').size, changed: Object.keys(st.files).sort(), treeFiles: st.real.treeFiles, deleted: st.real.deleted.length, ignoredInTree: Object.keys(st.real.tree).filter((p) => /(^|\/)(node_modules|\.svelte-kit)\//.test(p)).length, mentionsNodeModules: JSON.stringify(st.real.tree).includes('node_modules/'), records: st.real.records.length, nodeModulesMiB: Number(nm), fixtureIntact: st.git.fixtureIntact, truncated: st.real.truncated };
}

if (phase === 'hidden' || phase === 'reference') {
  if (phase === 'reference') {
    // What Harbor's oracle would run for the control (solution/solve.sh), mounted for this test.
    const r = sh('bash /solution/solve.sh');
    out.applied = r.exit === 0;
  }
  const t0 = Date.now();
  const v = sh('bash /tests/test.sh', { sec: 1800 });
  out.verifier = { exit: v.exit, sec: Math.round((Date.now() - t0) / 100) / 10, timedOut: v.timedOut, reward: existsSync('/logs/verifier/reward.txt') };
  const h = existsSync('/logs/verifier/hidden.json') ? JSON.parse(readFileSync('/logs/verifier/hidden.json', 'utf8')) : null;
  out.hidden = h && { hidden: h.hidden, siblings: h.siblings, run: { exit: h.run.exit, timedOut: h.run.timedOut, ms: h.run.ms, reported: h.run.reported }, collisions: h.collisions.length, q4: h.q4, totalMs: h.totalMs };
  out.failedSiblings = h?.detail ? h.detail.filter((f) => f.status !== 'passed').map((f) => f.file) : null;
  out.stateBytes = existsSync('/logs/verifier/state.json') ? statSync('/logs/verifier/state.json').size : null;
  out.log = existsSync('/logs/verifier/hidden.log') ? readFileSync('/logs/verifier/hidden.log', 'utf8').split('\n').filter((l) => /failed|TIMED OUT|hidden \d/.test(l)).map((l) => l.replace(/[^\x20-\x7e]/g, '?').slice(0, 160)) : null;
  out.peakMiB = peakMiB();
}

if (phase === 'history') {
  // The history every arm gets (owner decision 2026-11-13): it works (log, blame), it ends at the
  // pre-fix commit, and the fix is physically absent: not as a commit, not as a ref, not as a
  // dangling object, and no blob anywhere in the object store carries a line the fix adds.
  const want = JSON.parse(readFileSync('/tests/fix-absent.json', 'utf8'));
  const cfg = JSON.parse(readFileSync('/tests/hidden.json', 'utf8'));
  const g = (cmd, sec = 300) => sh(`git ${cmd}`, { sec });
  const key = (line) => { const s = line.replace(/\s+/g, ''); return s.length >= 30 ? createHash('sha256').update(s).digest('hex').slice(0, 20) : null; };
  const keys = new Set(want.lineKeys);
  const t0 = Date.now();
  const all = g('cat-file --batch-all-objects --batch-check').stdout.split('\n').filter(Boolean).map((l) => l.split(' '));
  const blobs = all.filter((o) => o[1] === 'blob' && Number(o[2]) <= (1 << 20)).map((o) => o[0]);
  let hits = 0; const hitBlobs = new Set();
  for (let i = 0; i < blobs.length; i += 1500) {
    const r = spawnSync('git', ['cat-file', '--batch'], { cwd: APP, input: `${blobs.slice(i, i + 1500).join('\n')}\n`, maxBuffer: 1 << 31 });
    const buf = r.stdout; let p = 0;
    while (p < buf.length) {
      const nl = buf.indexOf(10, p); if (nl === -1) break;
      const [id, , size] = buf.subarray(p, nl).toString('utf8').split(' ');
      const body = buf.subarray(nl + 1, nl + 1 + Number(size));
      if (keys.size && !body.includes(0)) for (const l of body.toString('utf8').split('\n')) { const k = key(l); if (k && keys.has(k)) { hits++; hitBlobs.add(id); } }
      p = nl + 1 + Number(size) + 1;
    }
  }
  const scanMs = Date.now() - t0;
  const harness = process.env.G4_HARNESS_RE ? new RegExp(process.env.G4_HARNESS_RE) : null;
  const paths = [...new Set(g('log --all --name-only --format=').stdout.split('\n').filter(Boolean))];
  const impl = (cfg.implFiles ?? []).find((p) => existsSync(join(APP, p)));
  out.history = {
    commits: Number(g('rev-list --count --all').stdout.trim()), refs: g("for-each-ref --format='%(refname)'").stdout.trim().split('\n'), remotes: g('remote').stdout.trim().split('\n').filter(Boolean).length,
    shallow: existsSync(join(APP, '.git/shallow')), reflogEntries: g('reflog').stdout.split('\n').filter(Boolean).length,
    logWorks: g('log -3 --format=%H').exit === 0, blameWorks: impl ? g(`blame --porcelain -- '${impl}'`).exit === 0 : null, logFileWorks: impl ? g(`log --oneline -5 -- '${impl}'`).stdout.split('\n').filter(Boolean).length : null,
    fixCommitPresent: g(`cat-file -e ${want.fixCommit}^{commit}`).exit === 0, showFixExit: g(`show ${want.fixCommit}`).exit, fixReachable: g(`merge-base --is-ancestor ${want.fixCommit} HEAD`).exit === 0,
    headIsFixture: g('rev-parse HEAD').stdout.trim() === readFileSync('/etc/pitwall/fixture-head', 'utf8').trim(), cleanTree: g('status --porcelain').stdout.trim() === '',
    unreachableObjects: g('fsck --unreachable --no-reflogs', 900).stdout.split('\n').filter((l) => /^unreachable|^dangling/.test(l)).length,
    objects: all.length, blobsScanned: blobs.length, fixLineKeys: keys.size, fixLineHits: hits, blobsWithFixLines: hitBlobs.size, scanMs,
    dotGitMiB: Number(sh('du -sm .git | cut -f1').stdout.trim()),
    harnessPathsInAnyCommit: harness ? paths.filter((p) => harness.test(p)).length : null, pathsInHistory: paths.length,
  };
}

if (phase === 'tools') {
  // The stand-in gh, jq and graphify as the agent would meet them (no network).
  const cfg = JSON.parse(readFileSync('/tests/hidden.json', 'utf8'));
  const issue = process.env.G4_ISSUE || '', pr = process.env.G4_PR || '';
  const q = (cmd) => { const r = sh(cmd, { sec: 60 }); return { exit: r.exit, out: r.stdout.length, err: r.stderr.length }; };
  const present = (w) => sh(`command -v ${w}`, { sec: 10 }).exit === 0;
  out.tools = { gh: present('gh'), jq: present('jq'), graphify: present('graphify'), python3: present('python3') };
  if (out.tools.gh) {
    const view = sh(`gh issue view ${issue} --json number,title,state,body`, { sec: 60 });
    let parsed = null; try { parsed = JSON.parse(view.stdout); } catch { /* not JSON */ }
    out.gh = {
      version: q('gh --version').exit,
      issueView: issue ? { exit: view.exit, number: parsed?.number ?? null, state: parsed?.state ?? null, bodyChars: parsed?.body?.length ?? null } : null,
      issueViewPlain: issue ? q(`gh issue view ${issue}`) : null,
      jq: issue ? { exit: sh(`gh issue view ${issue} --json number -q .number`).exit, value: sh(`gh issue view ${issue} --json number -q .number`).stdout.trim() === String(issue) } : null,
      fixPr: pr ? { exit: q(`gh pr view ${pr}`).exit, out: q(`gh pr view ${pr}`).out } : null, // must fail with no output
      futureNumber: { exit: q('gh issue view 999999').exit, out: q('gh issue view 999999').out },
      list: q('gh issue list --limit 5'), prList: q('gh pr list --state merged --limit 5 --json number,title'), labels: q('gh label list'),
      comments: issue ? q(`gh issue view ${issue} --comments`).exit : null, prCreate: q('gh pr create --title x --body y').exit, authStatus: q('gh auth status').exit, apiUser: q('gh api user').exit,
      snapshotInWorkTree: sh("git ls-files --others --exclude-standard | grep -c -i 'snapshot\\|github-cache'").stdout.trim(),
    };
    const log = existsSync('/var/pitwall/gh/calls.jsonl') ? readFileSync('/var/pitwall/gh/calls.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    out.gh.logged = { calls: log.length, byAnswer: log.reduce((m, r) => { m[r.answered] = (m[r.answered] ?? 0) + 1; return m; }, {}) };
  }
  if (out.tools.graphify) {
    const g = existsSync(join(APP, 'graphify-out/graph.json'));
    const help = sh('graphify --help', { sec: 60 });
    const ex = g ? sh(`graphify explain '${(cfg.implFiles?.[0] ?? 'src').replace(/'/g, '')}'`, { sec: 180 }) : null;
    out.graphify = { graphJson: g, help: help.exit, explain: ex && { exit: ex.exit, sec: ex.sec, outChars: ex.stdout.length, traceback: /Traceback/.test(ex.stderr + ex.stdout), networkError: /Connection|urlopen|resolve host|getaddrinfo/i.test(ex.stderr + ex.stdout) }, sizeMiB: Number(sh("python3 -c 'import graphify,os;print(os.path.dirname(graphify.__file__))' | xargs -I{} dirname {} | xargs du -sm | cut -f1").stdout.trim()) || null };
  }
}

if (phase === 'dhooks-run') {
  // Arm D's hooks, run as Claude Code would run them (the hook command, the tool call as JSON on
  // stdin, CLAUDE_PROJECT_DIR set), for a fixed list of ordinary tool calls. No agent. Exit 0 =
  // the call goes on, 2 = blocked, anything else = the hook itself failed. Names and exit codes only.
  const f = join(APP, '.claude/settings.json');
  out.hooksRun = { settings: existsSync(f), rows: [] };
  if (existsSync(f)) {
    const s = JSON.parse(readFileSync(f, 'utf8'));
    const issue = process.env.G4_ISSUE || '1';
    const samples = [['test-file', 'npx vitest run tests/unit/a.test.ts'], ['test-all', 'npm test'], ['lint', 'npx biome check .'], ['git-status', 'git status'], ['git-commit', 'git commit -m "fix"'], ['gh-issue-view', `gh issue view ${issue}`], ['gh-pr-create', 'gh pr create --title x --body y'], ['e2e', 'npx playwright test']];
    for (const [event, groups] of Object.entries(s.hooks ?? {})) for (const grp of groups ?? []) for (const h of grp.hooks ?? []) {
      const applies = !grp.matcher || new RegExp(`^(?:${grp.matcher})$`).test('Bash');
      const name = (String(h.command).match(/([\w-]+\.(?:mjs|js|cjs|sh))/) ?? [null, String(h.command).split(/\s+/)[0]])[1];
      if (!applies) { out.hooksRun.rows.push({ event, hook: name, applies: false }); continue; }
      const res = {};
      for (const [label, command] of samples) {
        const input = JSON.stringify({ session_id: 'g4', transcript_path: '/tmp/none.jsonl', cwd: APP, hook_event_name: event, tool_name: 'Bash', tool_input: { command }, ...(event === 'PostToolUse' ? { tool_response: { stdout: '', stderr: '', interrupted: false } } : {}) });
        const r = spawnSync('bash', ['-c', String(h.command)], { cwd: APP, input, encoding: 'utf8', timeout: 60000, killSignal: 'SIGKILL', env: { ...process.env, CLAUDE_PROJECT_DIR: APP } });
        res[label] = { exit: r.status, timedOut: r.error?.code === 'ETIMEDOUT', stderrChars: (r.stderr ?? '').length, stdoutIsJson: (() => { try { JSON.parse(r.stdout); return true; } catch { return false; } })(), decision: (() => { try { const j = JSON.parse(r.stdout); return j.hookSpecificOutput?.permissionDecision ?? j.decision ?? null; } catch { return null; } })() };
      }
      out.hooksRun.rows.push({ event, hook: name, applies: true, res });
    }
    const flat = out.hooksRun.rows.filter((r) => r.applies).flatMap((r) => Object.entries(r.res).map(([k, v]) => ({ hook: r.hook, sample: k, ...v })));
    out.hooksRun.summary = { runs: flat.length, allowed: flat.filter((x) => x.exit === 0 && x.decision !== 'deny' && x.decision !== 'block').length, blocked: flat.filter((x) => x.exit === 2 || x.decision === 'deny' || x.decision === 'block').map((x) => `${x.hook}:${x.sample}`), hookFailed: flat.filter((x) => x.exit !== 0 && x.exit !== 2).map((x) => `${x.hook}:${x.sample}:${x.exit}`), timedOut: flat.filter((x) => x.timedOut).length };
    const gh = existsSync('/var/pitwall/gh/calls.jsonl') ? readFileSync('/var/pitwall/gh/calls.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    out.hooksRun.ghCallsByHooks = { calls: gh.length, byAnswer: gh.reduce((m, r) => { m[r.answered] = (m[r.answered] ?? 0) + 1; return m; }, {}), what: [...new Set(gh.map((r) => r.what))] };
  }
}

if (phase === 'dhooks') {
  // Arm D keeps the project's .claude/settings.json: what it would add to the session, read
  // statically (no agent runs here). Counts and executable names only.
  const f = join(APP, '.claude/settings.json');
  if (!existsSync(f)) out.dhooks = { settings: false };
  else {
    const s = JSON.parse(readFileSync(f, 'utf8'));
    const cmds = Object.entries(s.hooks ?? {}).flatMap(([event, groups]) => (groups ?? []).flatMap((g) => (g.hooks ?? []).map((h) => ({ event, matcher: g.matcher ?? '', command: String(h.command ?? '') }))));
    const firstWord = (c) => c.trim().replace(/^(\w+=\S+\s+)+/, '').split(/\s+/)[0];
    const words = [...new Set(cmds.map((c) => firstWord(c.command)).filter(Boolean))];
    const missing = words.filter((w) => sh(`command -v '${w.replace(/'/g, '')}'`, { sec: 10 }).exit !== 0);
    // names of other programs the hook commands mention, checked the same way
    const mentioned = [...new Set(cmds.flatMap((c) => c.command.match(/\b(graphify|jq|gh|python3?|npx|node|bash|git)\b/g) ?? []))];
    out.dhooks = { settings: true, hookCommands: cmds.length, events: [...new Set(cmds.map((c) => c.event))], firstWords: words.length, firstWordsMissing: missing.length, mentionedPrograms: Object.fromEntries(mentioned.map((w) => [w, sh(`command -v ${w}`, { sec: 10 }).exit === 0])), permissions: { allow: (s.permissions?.allow ?? []).length, deny: (s.permissions?.deny ?? []).length, ask: (s.permissions?.ask ?? []).length, defaultMode: s.permissions?.defaultMode ?? null }, env: Object.keys(s.env ?? {}).length, otherKeys: Object.keys(s).filter((k) => !['hooks', 'permissions', 'env'].includes(k)) };
  }
}

if (phase === 'leak') {
  // Hashes of the hidden files and of each added line of the reference fix; then look for them
  // in every regular file of the image outside /proc, /sys, /dev and the mounted test inputs.
  const hidden = JSON.parse(readFileSync('/tests/hidden.json', 'utf8'));
  const sha = (b) => createHash('sha256').update(b).digest('hex');
  const want = new Map(hidden.hidden.map((p) => [sha(readFileSync(join('/tests/hidden', p))), p]));
  const fresh = hidden.hidden.filter((p) => !existsSync(join(APP, p)));
  let scanned = 0; const found = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isSymbolicLink()) continue; if (e.isDirectory()) { if (!/^\/(proc|sys|dev|tests|g4|solution|out)$/.test(p) && p !== '/app/node_modules') walk(p); continue; } if (!e.isFile()) continue; let s; try { s = statSync(p); } catch { continue; } if (s.size > (1 << 20) || s.size === 0) continue; scanned++; try { const h = sha(readFileSync(p)); if (want.has(h)) found.push(p); } catch { /* unreadable */ } } };
  walk('/');
  out.leak = { hiddenFiles: hidden.hidden.length, newAtReference: fresh.length, presentInTreeWithSameBytes: found.length, scanned, testsDirInImage: existsSync('/tests/hidden.json') ? 'mounted for this test only' : 'absent' };
  out.absentBeforeMount = process.env.G4_TESTS_ABSENT ?? null;
}

mkdirSync(join(outFile, '..'), { recursive: true });
writeFileSync(outFile, JSON.stringify(out, null, 1));
process.stdout.write(`${phase}: written ${outFile}\n`);
