#!/usr/bin/env node
// EXP-48, review §11.A4 step 1 (no model): check the candidates INSIDE their own image —
//   (a) the 9 candidates the author could not verify because of dependency drift, and
//   (b) for all usable candidates: the existing tests of the same directories pass before and
//       after the fix (sieve stage 5), on the tree arms A/B/C get (harness files removed).
//   node experiments/exp48/image-verify.mjs prepare      (Windows side: pointers -> contexts, verifier inputs)
//   bash experiments/exp48/image-verify.sh                (WSL: build, run the two controls + the history check)
//   node experiments/exp48/image-verify.mjs collect      -> experiments/exp48/image-verify.json (tracked)
// The tracked result holds pointers, booleans, counts and timings only.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileArm, deriveTask, loadTask, writeContexts } from '../../packages/pit-wall/src/realrepo/task.mjs';
import { registerCallers } from '../../packages/pit-wall/src/realrepo/callers.mjs';
import { buildSnapshot } from '../../packages/pit-wall/src/realrepo/gh-snapshot.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const L = join(ROOT, 'local/exp48-gq');
const V = join(L, 'verify');
const clone = join(L, 'gq.git'), filtered = join(L, 'gq-filtered.git');
const DRIFT = [5, 7, 25, 26, 27, 31, 34, 37, 39]; // static order, review §11.A4
const cand = JSON.parse(readFileSync(join(ROOT, 'experiments/exp48/candidates.json'), 'utf8'));
const harness = JSON.parse(readFileSync(join(ROOT, 'experiments/exp48/harness-files.json'), 'utf8'));
const idOf = (c) => `v${String(c.static_order).padStart(2, '0')}`;
const usable = [...cand.primaries, ...cand.reserves].map((c) => ({ ...c, group: 'usable' }));
const drift = cand.dropped_after_examination.filter((c) => DRIFT.includes(c.static_order)).map((c) => ({ ...c, group: 'drift' }));
const list = [...usable, ...drift].sort((a, b) => a.static_order - b.static_order);

const cmd = process.argv[2];
// The tools the arms get (owner decision 2026-11-13, implementation-report round 2): the gh
// stand-in with a snapshot as of the pre-fix commit in every arm, the static jq, graphify in D
// where graphify-out/ is tracked. The same options as run-g4.sh passes to materialise.mjs.
const GH_CACHE = join(L, 'cache'), JQ = join(L, 'tools', 'jq'), GRAPHIFY = process.env.G4_GRAPHIFY ?? '0.9.107';
let ghCache = null;
const snapshotFor = (pre, c) => {
  ghCache ??= { issues: JSON.parse(readFileSync(join(GH_CACHE, 'issues.json'), 'utf8')), prs: JSON.parse(readFileSync(join(GH_CACHE, 'prs.json'), 'utf8')) };
  const asOf = execFileSync('git', ['show', '-s', '--format=%cI', pre], { cwd: clone, encoding: 'utf8' }).trim();
  return buildSnapshot(ghCache, { repo: 'Takenori-Kusaka/ganbari-quest', asOf, taskIssue: c.issue ?? null, fixPr: c.pr ?? null });
};
if (cmd === 'prepare') {
  mkdirSync(join(V, 'specs'), { recursive: true });
  const ids = [];
  const only = process.argv.slice(3).filter((a) => /^v\d+$/.test(a)); // prepare [--force] [id ...]
  for (const c of list) {
    if (only.length && !only.includes(idOf(c))) { ids.push(idOf(c)); continue; }
    const id = idOf(c);
    const done = join(V, 'specs', `${id}.json`);
    const pre = c.pre_fix_commit ?? execFileSync('git', ['rev-parse', `${c.fix_commit}^`], { cwd: clone, encoding: 'utf8' }).trim();
    const d = deriveTask(clone, pre, c.fix_commit);
    const hidden = c.hidden_check_test_paths?.length ? c.hidden_check_test_paths : d.hidden_checks;
    const spec = { id, repo: 'Takenori-Kusaka/ganbari-quest', issue: c.issue ?? null, pr: c.pr ?? null, prefix_commit: pre, reference_commit: c.fix_commit, hidden_checks: hidden, sibling_tests: d.sibling_tests.filter((p) => !hidden.includes(p)), impl_files: c.impl_paths?.length ? c.impl_paths : d.impl_files, source_paths: ['src', 'tests'], group: c.group, static_order: c.static_order };
    ids.push(id);
    if (existsSync(done) && existsSync(join(L, 'build', id, 'materialised.json')) && !process.argv.includes('--force')) continue;
    if (!hidden.length) { writeFileSync(join(V, 'specs', `${id}.skip.json`), JSON.stringify({ id, why: 'no hidden check file' })); continue; }
    writeFileSync(done, JSON.stringify(spec, null, 1));
    const task = loadTask(done);
    const t0 = Date.now();
    let info;
    // 22.23.2: the version the project pinned later; its CI of the time says only `22`.
    try { info = writeContexts(task, { gitDir: clone, filteredDir: filtered, outDir: L, harness, defaultNodeVersion: '22.23.2', ghSnapshot: snapshotFor(pre, c), ghArms: 'all', jqBinary: JQ, graphifyVersion: GRAPHIFY }); } catch (e) {
      writeFileSync(join(V, 'specs', `${id}.skip.json`), JSON.stringify({ id, why: /package\.json/.test(e.message) ? 'the pre-fix commit has no package.json' : /not the pre-fix tree/.test(e.message) ? 'filtered tree differs from the pre-fix tree' : 'contexts failed' }));
      (await import('node:fs')).rmSync(done, { force: true });
      process.stdout.write(`${id} pr ${c.pr} SKIP ${String(e.message).split('\n')[0].slice(0, 120)}\n`);
      continue;
    }
    compileArm(join(L, 'harbor', 'A-reference'), task, 'A', { gitDir: clone, instruction: '(scripted control: no request)', script: 'reference' });
    let callers = null;
    try { callers = registerCallers(clone, pre, c.fix_commit, spec.impl_files).n; } catch { callers = null; }
    writeFileSync(join(V, 'specs', `${id}.prep.json`), JSON.stringify({ id, lockHash: info.lockHash, nodeVersion: info.nodeVersion, nodeVersionSource: info.nodeVersionSource, removed: info.removed.length, history: info.history, tools: info.tools, gh: info.ghSnapshotMeta, callersN: callers, prepMs: Date.now() - t0 }));
    process.stdout.write(`${id} pr ${c.pr} ${c.group} lock ${info.lockHash} history abc ${info.history.abc.commits} d ${info.history.d.commits} mentions ${info.history.abc.mentions}/${info.history.d.mentions} callers ${callers}\n`);
  }
  writeFileSync(join(V, 'ids.txt'), `${ids.filter((id) => existsSync(join(V, 'specs', `${id}.json`))).join('\n')}\n`);
} else if (cmd === 'collect') {
  const rd = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  const depth = rd(join(V, 'depth.json')) ?? {};
  const rows = list.map((c) => {
    const id = idOf(c);
    const spec = rd(join(V, 'specs', `${id}.json`)), prep = rd(join(V, 'specs', `${id}.prep.json`));
    const no = rd(join(V, 'out', `${id}-abc-hidden.json`)), ref = rd(join(V, 'out', `${id}-abc-reference.json`));
    const histOf = (k) => rd(join(V, 'out', `${id}-${k}-history.json`))?.history ?? null;
    const toolsOf = (k) => rd(join(V, 'out', `${id}-${k}-tools.json`));
    const built = { abc: rd(join(V, 'out', `${id}-build-abc.json`)), d: rd(join(V, 'out', `${id}-build-d.json`)) };
    const hooksRun = rd(join(V, 'out', `${id}-d-dhooks-run.json`))?.hooksRun ?? null, hooksStatic = rd(join(V, 'out', `${id}-d-dhooks.json`))?.dhooks ?? null;
    const absent = (hist) => hist && { commits: hist.commits, shallow: hist.shallow, fixCommitPresent: hist.fixCommitPresent, showFixExit: hist.showFixExit, fixReachable: hist.fixReachable, unreachableObjects: hist.unreachableObjects, reflogEntries: hist.reflogEntries, objects: hist.objects, blobsScanned: hist.blobsScanned, fixLineKeys: hist.fixLineKeys, fixLineHits: hist.fixLineHits, blobsWithFixLines: hist.blobsWithFixLines, harnessPathsInAnyCommit: hist.harnessPathsInAnyCommit, refs: hist.refs.length, remotes: hist.remotes, headIsFixture: hist.headIsFixture, cleanTree: hist.cleanTree, logWorks: hist.logWorks, blameWorks: hist.blameWorks, dotGitMiB: hist.dotGitMiB, scanMs: hist.scanMs };
    const tools = (t) => t && { present: t.tools, gh: t.gh && { issueViewExit: t.gh.issueView?.exit ?? null, issueNumberOk: t.gh.issueView ? t.gh.issueView.number === c.issue : null, jqOk: t.gh.jq?.value ?? null, fixPrExit: t.gh.fixPr?.exit ?? null, fixPrOut: t.gh.fixPr?.out ?? null, futureExit: t.gh.futureNumber.exit, futureOut: t.gh.futureNumber.out, listExit: t.gh.list.exit, prListExit: t.gh.prList.exit, labelsExit: t.gh.labels.exit, commentsExit: t.gh.comments, prCreateExit: t.gh.prCreate, authStatusExit: t.gh.authStatus, apiUserExit: t.gh.apiUser, snapshotInWorkTree: Number(t.gh.snapshotInWorkTree), logged: t.gh.logged }, graphify: t.graphify ?? null };
    const h = (r) => r?.hidden ?? null;
    const sib = (r) => (h(r) ? (h(r).siblings.filesWanted === 0 ? null : h(r).siblings.allPassed) : null);
    const row = {
      id, static_order: c.static_order, group: c.group, order: c.order ?? null, issue: c.issue ?? null, pr: c.pr ?? null, prefix_commit: spec?.prefix_commit ?? null, fix_commit: c.fix_commit,
      prepared: !!prep, skipped: rd(join(V, 'specs', `${id}.skip.json`))?.why ?? null, lockHash: prep?.lockHash ?? null, nodeVersionSource: prep?.nodeVersionSource ?? null, removedPaths: prep?.removed ?? null, callersN: prep?.callersN ?? null,
      history: prep ? { abcCommits: prep.history.abc.commits, dCommits: prep.history.d.commits, abcMiB: prep.history.abc.tarMiB, dMiB: prep.history.d.tarMiB, mentionsOfIssueOrPr: { abc: prep.history.abc.mentions, d: prep.history.d.mentions }, prefixPrunedInFiltered: prep.history.abc.prunedPrefix } : null,
      build: built, tools: prep?.tools ?? null, ghSnapshot: prep?.gh ? { issues: prep.gh.issues, prs: prep.gh.prs, issuesAfterDate: prep.gh.issuesAfterDate, prsAfterDate: prep.gh.prsAfterDate, issuesLeftOutEditedLater: prep.gh.issuesLeftOutEditedLater, prsLeftOutClosingTheIssue: prep.gh.prsLeftOutClosingTheIssue, prsWithoutState: prep.gh.prsWithoutState } : null,
      depth: depth[id] ?? null,
      hiddenFiles: spec?.hidden_checks.length ?? null, siblingFiles: spec?.sibling_tests.length ?? null,
      before: no && { ran: !!h(no), hiddenFails: h(no)?.hidden.anyFailed ?? null, hiddenAllPass: h(no)?.hidden.allPassed ?? null, hiddenTests: h(no)?.hidden.tests ?? null, hiddenFailed: h(no)?.hidden.failed ?? null, hiddenFilesReported: h(no)?.hidden.filesReported ?? null, siblingsPass: sib(no), siblingTests: h(no)?.siblings.tests ?? null, siblingFailed: h(no)?.siblings.failed ?? null, timedOut: h(no)?.run.timedOut ?? null, sec: no.verifier.sec, peakMiB: no.peakMiB },
      after: ref && { applied: ref.applied, hiddenAllPass: h(ref)?.hidden.allPassed ?? null, hiddenTests: h(ref)?.hidden.tests ?? null, hiddenFailed: h(ref)?.hidden.failed ?? null, siblingsPass: sib(ref), siblingFailed: h(ref)?.siblings.failed ?? null, q4: h(ref)?.q4 ? { failsOnPrefix: h(ref).q4.failsOnPrefix, passesOnReference: h(ref).q4.passesOnReference } : null, timedOut: h(ref)?.run.timedOut ?? null, sec: ref.verifier.sec, peakMiB: ref.peakMiB },
      fixAbsent: { abc: absent(histOf('abc')), d: absent(histOf('d')) },
      toolsInImage: { abc: tools(toolsOf('abc')), d: tools(toolsOf('d')) },
      // the remaining G4 phases on the rebuilt A/B/C image (EXTRA_ABC), where run
      g4Abc: (() => {
        const lk = rd(join(V, 'out', `${id}-abc-leak.json`)), rc = rd(join(V, 'out', `${id}-abc-recorder.json`)), cp = rd(join(V, 'out', `${id}-abc-capture.json`))?.capture ?? null;
        if (!lk && !rc && !cp) return null;
        return { leak: lk ? { ...lk.leak, testsDirInImageWithoutMount: lk.absentBeforeMount } : null, recorder: rc ? { sameOutput: rc.sameOutput, formsTried: rc.forms?.length ?? null, formsRecorded: rc.formsCovered ?? null } : null, capture: cp ? { exit: cp.exit, ms: cp.ms, bytes: cp.bytes, changed: cp.changed.length, ignoredInTree: cp.ignoredInTree, mentionsNodeModules: cp.mentionsNodeModules, fixtureIntact: cp.fixtureIntact, truncated: cp.truncated } : null };
      })(),
      dHooks: hooksRun && { settings: hooksRun.settings, hooks: hooksRun.rows.filter((r) => r.applies).map((r) => r.hook), summary: hooksRun.summary, ghCallsByHooks: hooksRun.ghCallsByHooks, static: hooksStatic && { hookCommands: hooksStatic.hookCommands, firstWordsMissing: hooksStatic.firstWordsMissing, permissions: hooksStatic.permissions } },
    };
    // sieve stage 5 in the image: fails before, passes after, the neighbours pass both times
    row.stage5 = row.before && row.after ? (row.before.hiddenFails === true && row.after.hiddenAllPass === true && row.before.siblingsPass !== false && row.after.siblingsPass !== false) : null;
    return row;
  });
  const done = rows.filter((r) => r.stage5 !== null);
  const doc = {
    what: 'EXP-48 image verification of the candidates (review 34 §11.A4 step 1). Machine result, no model. Tree: the one arms A/B/C get (harness files removed, history up to the pre-fix commit). before = no change, after = the reference fix applied. Pointers, booleans, counts and timings only.',
    date: new Date().toISOString(),
    candidates_sha256_prefix: (await import('node:crypto')).createHash('sha256').update(readFileSync(join(ROOT, 'experiments/exp48/candidates.json'))).digest('hex').slice(0, 16),
    summary: { listed: rows.length, usable: rows.filter((r) => r.group === 'usable').length, drift: rows.filter((r) => r.group === 'drift').length, verified: done.length, stage5Pass: done.filter((r) => r.stage5).length, stage5PassUsable: done.filter((r) => r.stage5 && r.group === 'usable').length, stage5PassDrift: done.filter((r) => r.stage5 && r.group === 'drift').length, historyChecked: rows.flatMap((r) => ['abc', 'd'].filter((k) => r.fixAbsent[k]).map((k) => `${r.id}-${k}`)).length, fixAbsentAll: rows.every((r) => ['abc', 'd'].every((k) => !r.fixAbsent[k] || (!r.fixAbsent[k].fixCommitPresent && r.fixAbsent[k].showFixExit !== 0 && r.fixAbsent[k].unreachableObjects === 0 && r.fixAbsent[k].refs === 1 && r.fixAbsent[k].remotes === 0 && r.fixAbsent[k].reflogEntries === 0))), withFixLineHits: rows.flatMap((r) => ['abc', 'd'].filter((k) => r.fixAbsent[k]?.fixLineHits > 0).map((k) => `${r.id}-${k}`)), harnessInAbcHistory: rows.filter((r) => r.fixAbsent.abc?.harnessPathsInAnyCommit > 0).map((r) => r.id), historyMentions: rows.filter((r) => r.history && (r.history.mentionsOfIssueOrPr.abc || r.history.mentionsOfIssueOrPr.d)).map((r) => r.id) },
    not_done: 'the plan asks for 3 identical runs (sieve stage 5); each control was run once here',
    rows,
  };
  writeFileSync(join(ROOT, 'experiments/exp48/image-verify.json'), `${JSON.stringify(doc, null, 1)}\n`);
  process.stdout.write(`${JSON.stringify(doc.summary)}\n`);
} else { process.stderr.write('usage: image-verify.mjs prepare | collect\n'); process.exit(2); }
