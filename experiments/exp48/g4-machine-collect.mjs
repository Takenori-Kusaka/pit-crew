#!/usr/bin/env node
// EXP-48 (issue #56): collect the raw results of already-red.sh and graphify-probe.sh
// (local/exp48-gq/g4-out/already-red/, .../graphify-probe/) into the tracked summary
// experiments/exp48/g4-machine.json. Counts, exit codes, booleans and hashes only: the lists of
// red test files are written next to the raw results as <id>-<tree>-red.txt (local), and the
// tracked file carries their sha256 (`sha256sum <id>-<tree>-red.txt` gives the same value).
// This is an INPUT for whoever writes the G4 verdict; it is not a verdict and names no task as used.
//   node experiments/exp48/g4-machine-collect.mjs
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = (b) => createHash('sha256').update(b).digest('hex');
export const listText = (paths) => [...paths].sort().map((p) => `${p}\n`).join('');

// One whole-suite result (g4-in-image.mjs phase "checks" with G4_CHECKS=vitest) -> numbers.
// spec: { hidden_checks, sibling_tests } of the task (to count how many of the red files are the
// task's own hidden or neighbour tests). Returns { row, red: [paths] | null }.
export function summariseSuite(result, spec = {}) {
  const c = result?.checks?.vitest;
  if (!c) return { row: { ran: false, listed: false, why: 'no whole-suite result' }, red: null };
  const base = { ran: true, exit: c.exit, signal: c.signal ?? null, timedOut: !!c.timedOut, sec: c.sec, peakMiB: result.peakMiB ?? c.peakMiBSoFar ?? null, recordedTools: (c.records ?? []).length };
  // No per-file record (the run was killed, timed out, or the reporter did not load): there is no
  // list, and an empty list must not be read as "nothing is red".
  if (!c.vitest || !Array.isArray(c.failedFilesList)) return { row: { ...base, listed: false, why: c.timedOut ? 'the suite hit the time limit: no per-file record' : 'no per-file record from the run' }, red: null };
  const red = [...c.failedFilesList].sort();
  const hidden = new Set(spec.hidden_checks ?? []), sib = new Set(spec.sibling_tests ?? []);
  const row = {
    ...base, listed: !c.timedOut, ...(c.timedOut ? { why: 'the suite hit the time limit: the list is of the files reported until then' } : {}),
    filesReported: c.vitest.filesReported, passedFiles: c.vitest.passedFiles, failedFiles: red.length, failedAtCollection: c.vitest.failedAtCollection, skippedFiles: c.vitest.skippedFiles,
    tests: { total: c.vitest.tests ?? null, passed: c.vitest.passed ?? null, failed: c.vitest.failed ?? null, skipped: c.vitest.skipped ?? null },
    redListSha256: sha(listText(red)), skippedListSha256: sha(listText(c.skippedFilesList ?? [])),
    redAmongHidden: red.filter((p) => hidden.has(p)).length, redAmongSiblings: red.filter((p) => sib.has(p)).length,
    redByTopDir: Object.fromEntries(Object.entries(red.reduce((m, f) => { const d = f.split('/').slice(0, 3).join('/'); m[d] = (m[d] ?? 0) + 1; return m; }, {})).sort()),
  };
  return { row, red };
}

// The two trees of one task side by side (plan 34 §4: the lists differ by condition).
export function compareTrees(redAbc, redD) {
  if (!redAbc || !redD) return null;
  const a = new Set(redAbc), d = new Set(redD);
  return { both: redAbc.filter((p) => d.has(p)).length, onlyInAbc: redAbc.filter((p) => !d.has(p)).length, onlyInD: redD.filter((p) => !a.has(p)).length };
}

const self = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (self) {
  const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
  const L = join(ROOT, 'local/exp48-gq');
  const OUT = join(L, 'g4-out/already-red'), PROBE = join(L, 'g4-out/graphify-probe');
  const rd = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; } catch { return null; } };
  const iv = rd(join(ROOT, 'experiments/exp48/image-verify.json'));
  const stage5 = iv.rows.filter((r) => r.stage5 === true).map((r) => r.id);
  const all = iv.rows.map((r) => r.id);
  const files = existsSync(OUT) ? readdirSync(OUT) : [];
  const seen = [...new Set(files.map((f) => f.match(/^(v\d+|g4-s\d+)-(abc|d)-/)?.[1]).filter(Boolean))];
  const ids = [...new Set([...stage5, ...seen])].sort();
  const res = (id, k, p) => rd(join(OUT, `${id}-${k}-${p}.json`));

  const alreadyRed = ids.filter((id) => stage5.includes(id) || res(id, 'abc', 'checks') || res(id, 'd', 'checks')).map((id) => {
    const spec = rd(join(L, 'verify/specs', `${id}.json`)) ?? {};
    const per = {}; const lists = {};
    for (const k of ['abc', 'd']) {
      const raw = res(id, k, 'checks');
      const noResult = !raw && existsSync(join(OUT, `${id}-${k}-checks.err`));
      const { row, red } = summariseSuite(raw, spec);
      per[k] = raw ? { ...row, build: rd(join(OUT, `${id}-${k}-build.json`)) } : { ran: false, listed: false, why: noResult ? 'the container wrote no result (stderr kept locally)' : 'not run yet' };
      lists[k] = red;
      if (red) writeFileSync(join(OUT, `${id}-${k}-red.txt`), listText(red)); // local: paths of the subject's test files
    }
    return { id, stage5: stage5.includes(id), hiddenFiles: spec.hidden_checks?.length ?? null, siblingFiles: spec.sibling_tests?.length ?? null, abc: per.abc, d: per.d, trees: compareTrees(lists.abc, lists.d) };
  });

  const leak = [];
  for (const id of ids) for (const k of ['abc', 'd']) {
    const r = res(id, k, 'leak');
    if (r) leak.push({ id, tree: k, imageId: rd(join(OUT, `${id}-${k}-build.json`))?.imageId ?? null, hiddenFiles: r.leak.hiddenFiles, newAtReference: r.leak.newAtReference, presentInTreeWithSameBytes: r.leak.presentInTreeWithSameBytes, scanned: r.leak.scanned, testsDirInImageWithoutMount: r.absentBeforeMount });
  }

  // v03 (and any other task whose tools / history were rerun here): the same fields image-verify.json has
  const rerun = [];
  for (const id of ids) for (const k of ['abc', 'd']) {
    const t = res(id, k, 'tools'), h = res(id, k, 'history')?.history ?? null;
    if (!t && !h) continue;
    const spec = rd(join(L, 'verify/specs', `${id}.json`)) ?? {};
    rerun.push({ id, tree: k, imageId: rd(join(OUT, `${id}-${k}-build.json`))?.imageId ?? null,
      tools: t && { present: t.tools, gh: t.gh && { issueViewExit: t.gh.issueView?.exit ?? null, issueNumberOk: t.gh.issueView ? t.gh.issueView.number === spec.issue : null, issueState: t.gh.issueView?.state ?? null, bodyChars: t.gh.issueView?.bodyChars ?? null, plainExit: t.gh.issueViewPlain?.exit ?? null, jqOk: t.gh.jq?.value ?? null, fixPrExit: t.gh.fixPr?.exit ?? null, fixPrOut: t.gh.fixPr?.out ?? null, futureExit: t.gh.futureNumber?.exit ?? null, futureOut: t.gh.futureNumber?.out ?? null, commentsExit: t.gh.comments, prCreateExit: t.gh.prCreate, authStatusExit: t.gh.authStatus, apiUserExit: t.gh.apiUser, snapshotInWorkTree: Number(t.gh.snapshotInWorkTree), logged: t.gh.logged }, graphify: t.graphify ?? null },
      history: h && { commits: h.commits, refs: h.refs.length, remotes: h.remotes, reflogEntries: h.reflogEntries, fixCommitPresent: h.fixCommitPresent, showFixExit: h.showFixExit, fixReachable: h.fixReachable, unreachableObjects: h.unreachableObjects, headIsFixture: h.headIsFixture, cleanTree: h.cleanTree, logWorks: h.logWorks, blameWorks: h.blameWorks, fixLineKeys: h.fixLineKeys, fixLineHits: h.fixLineHits, blobsWithFixLines: h.blobsWithFixLines, harnessPathsInAnyCommit: h.harnessPathsInAnyCommit, blobsScanned: h.blobsScanned } });
  }

  const graphify = [];
  for (const id of all) {
    const inImage = res(id, 'd', 'graphify')?.graphify ?? null, outside = rd(join(PROBE, `${id}.json`));
    if (inImage || outside) graphify.push({ id, inImage, outsideImage: outside });
  }

  const listed = (k) => alreadyRed.filter((r) => r.stage5 && r[k].listed).length;
  const doc = {
    what: 'EXP-48 (issue #56): machine results for the G4.partial open items that need no model. Already-red list per task and tree (whole unit suite once, in the task image, no network), the leak phase on every image built for it, the reruns of v03, graphify explain with stderr kept. Counts, exit codes, booleans and hashes only; lists and raw output are under local/exp48-gq/g4-out/. Not a verdict; names no task as used.',
    date: new Date().toISOString(),
    inputs: { imageVerifySha256: sha(readFileSync(join(ROOT, 'experiments/exp48/image-verify.json'))), g4InImageSha256: sha(readFileSync(join(ROOT, 'experiments/exp48/g4-in-image.mjs'))), alreadyRedShSha256: sha(readFileSync(join(ROOT, 'experiments/exp48/already-red.sh'))) },
    tasksStage5: stage5,
    summary: {
      stage5Tasks: stage5.length, alreadyRedListed: { abc: listed('abc'), d: listed('d') },
      alreadyRedRanWithoutList: { abc: alreadyRed.filter((r) => r.abc.ran && !r.abc.listed).map((r) => r.id), d: alreadyRed.filter((r) => r.d.ran && !r.d.listed).map((r) => r.id) },
      alreadyRedNotRun: { abc: alreadyRed.filter((r) => r.stage5 && !r.abc.ran).map((r) => r.id), d: alreadyRed.filter((r) => r.stage5 && !r.d.ran).map((r) => r.id) },
      leakImages: leak.length, leakClean: leak.filter((l) => l.presentInTreeWithSameBytes === 0 && l.testsDirInImageWithoutMount === 'absent').length,
      rerunToolsHistory: rerun.map((r) => `${r.id}-${r.tree}`), graphifyChecked: graphify.map((g) => g.id),
    },
    alreadyRed, leak, rerun, graphify,
  };
  writeFileSync(join(ROOT, 'experiments/exp48/g4-machine.json'), `${JSON.stringify(doc, null, 1)}\n`);
  process.stdout.write(`${JSON.stringify(doc.summary)}\n`);
}
