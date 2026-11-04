#!/usr/bin/env node
// pit-wall CLI
//   pit-wall run <suite.yaml> [--out <dir>] [--arms a,b] [--cases x,y] [--trials n]
//   pit-wall report <results.json>
//   pit-wall rules <plugin-dir>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildArm, listRules, subjectDocs } from './arms.mjs';
import { grade, runPassed } from './graders/index.mjs';
import { loadSuite } from './suite.mjs';
import * as claudeRunner from './runners/claude-plugin-eval.mjs';
import * as harborRunner from './runners/harbor.mjs';
import { renderReport, summarize } from './report.mjs';
import { assessRun, checkGroups, leakOverlap, lintCase, markUndecidable } from './validity.mjs';
import { claudeJson, judge, judgeView } from './judge.mjs';
import { buildImage } from './images.mjs';
import * as calibrate from './calibrate/index.mjs';
import { expectedHead, fixtureState } from './fixture.mjs';
import { classify } from './graders/state.mjs';

function opt(args, name, dflt) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
}

const RUNNERS = { 'claude-plugin-eval': claudeRunner, harbor: harborRunner };

// Fixture head ids a run may report, computed on the host once per case digest.
const HEADS = new Map();
function fixtureHeads(kase) {
  if (!HEADS.has(kase.digest)) HEADS.set(kase.digest, [expectedHead(kase), expectedHead(kase, { executable: true })]);
  return HEADS.get(kase.digest);
}

// judgeWith: { model } to call pit-wall's judge for verdicts not yet stored; null
// to grade only from stored verdicts (regrade: no model calls). Verdicts are stored
// on the record as `judged[grader] = { passed, reason, model }`.
function gradeRecord(rec, kase, runner = claudeRunner, judgeWith = null) {
  const validity = assessRun(rec, { shims: kase.needsShell ? runner.SHIMS : [], noise: runner.NOISE });
  if (!rec.trajectory) return { ...rec, validity, results: [], passed: false };
  const own = kase.graders.filter((g) => g.type !== 'judge');
  const results = grade(rec.trajectory, own, { state: rec.state ?? null, fixture: fixtureState(kase), fixtureHeads: kase.history ? fixtureHeads(kase) : undefined });
  const judged = { ...(rec.judged ?? {}) };
  for (const g of kase.graders.filter((g) => g.type === 'judge')) {
    if (!judged[g.name] && judgeWith) judged[g.name] = judge({ rubric: g.rubric, view: judgeView(rec.trajectory, kase.prompt), model: judgeWith.model });
    const v = judged[g.name];
    if (v && v.passed !== null) {
      results.push({ name: g.name, type: 'judge', dimension: g.dimension ?? 'behavior', indicator: false, passed: v.passed, explanation: `judge (pit-wall, ${v.model}): ${v.passed ? 'PASS' : 'FAIL'}: ${v.reason}` });
    } else {
      // No pit-wall verdict: the runner-native one is shown but never scored, because
      // it may see less of the run (plugin eval's grader missed posted comments in D1).
      const n = rec.native?.[g.name];
      results.push({ name: g.name, type: 'judge', dimension: g.dimension ?? 'behavior', indicator: false, passed: false, unjudged: true, explanation: v?.error ?? `no pit-wall verdict (runner-native: ${n})` });
      validity.faults.push({ kind: 'judge-missing', evidence: g.name });
      validity.status = 'invalid';
    }
  }
  for (const t of kase.targets) {
    const skill = t.split('.')[0];
    results.push({ ...grade(rec.trajectory, [{ type: 'skill-fired', params: { skill } }])[0], name: `fired:${skill}`, indicator: true, dimension: 'indicator' });
  }
  markUndecidable(validity, results);
  const dims = [...new Set(results.filter((r) => !r.indicator).map((r) => r.dimension))];
  const passedBy = Object.fromEntries(dims.map((d) => [d, !rec.error && runPassed(results, d)]));
  // null (neither pass nor fail) when the outcome could not be decided.
  const hit = (got, want) => (got === 'undecidable' ? null : got === want);
  // Cases with outcome rules put every run into exactly one outcome; the run passes
  // when that outcome is the expected one.
  if (kase.outcomes) {
    // No captured state means the environment failed, not that the agent tampered
    // (every state grader fails without a state, which the rules would read as tampering).
    if (!rec.state) {
      validity.faults.push({ kind: 'state-missing', evidence: 'verifier wrote no state.json' });
      validity.status = 'invalid';
      return { ...rec, validity, judged, results, outcome: 'invalid', passed: false, passedBy };
    }
    const outcome = classify(results, kase.outcomes);
    if (!kase.substanceOutcomes) return { ...rec, validity, judged, results, outcome, passed: !rec.error && hit(outcome, kase.expectOutcome), passedBy };
    // Substance (behavior) and the harness's record format (protocol) are scored apart, so
    // that one wording of the format cannot stand in for the ability to decide.
    const substance = classify(results, kase.substanceOutcomes);
    const fmt = results.filter((x) => x.dimension === 'protocol');
    const by = { behavior: !rec.error && hit(substance, kase.expectSubstance), protocol: !rec.error && fmt.length > 0 && runPassed(fmt) };
    return { ...rec, validity, judged, results, outcome, substance, passed: !rec.error && hit(outcome, kase.expectOutcome), passedBy: by };
  }
  return { ...rec, validity, judged, results, passed: !rec.error && runPassed(results), passedBy };
}

// Scripted controls must land in the outcome they were built for. If one does not,
// the case or the graders are broken and no agent result on that case is evidence.
export function checkControls(records, suite) {
  const byId = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const rows = records.filter((r) => r.arm.startsWith('script:')).map((r) => {
    const want = byId[r.case]?.scriptExpect?.[r.arm.slice(7)] ?? null;
    return { case: r.case, script: r.arm.slice(7), expected: want, got: r.outcome ?? null, ok: want !== null && want === r.outcome };
  });
  const text = ['| case | script | expected | got | ok |', '|---|---|---|---|---|',
    ...rows.map((x) => `| ${x.case} | ${x.script} | ${x.expected ?? '–'} | ${x.got ?? '–'} | ${x.ok ? 'yes' : '**NO**'} |`)].join('\n');
  const groups = checkGroups(records, suite);
  return { rows, groups, ok: rows.length > 0 && rows.every((x) => x.ok) && groups.rows.every((x) => x.ok), text: groups.rows.length ? `${text}\n\n${groups.text}` : text };
}


function lintSuite(suite) {
  const problems = suite.cases.flatMap((c) => lintCase(c).map((p) => `${c.id}: ${p}`));
  if (problems.length) throw new Error(`case lint failed (the case gives the answer away):\n  - ${problems.join('\n  - ')}`);
}

async function cmdRun(args) {
  const suite = loadSuite(args[0]);
  lintSuite(suite);
  const out = resolve(opt(args, 'out', `pitwall-out/${new Date().toISOString().replace(/[:.]/g, '-')}`));
  const arms = (opt(args, 'arms') ?? suite.arms.join(',')).split(',');
  const only = opt(args, 'cases')?.split(',');
  const trialsOverride = opt(args, 'trials');
  const runnerName = opt(args, 'runner', 'claude-plugin-eval');
  // --model overrides the suite's model (e.g. the same cells with a smaller model).
  const model = opt(args, 'model', suite.model);
  // --max-turns overrides the runner's default (harbor: 12), e.g. for a larger repository.
  const maxTurns = opt(args, 'max-turns') ? Number(opt(args, 'max-turns')) : undefined;
  const runner = RUNNERS[runnerName];
  if (!runner) throw new Error(`unknown runner: ${runnerName} (${Object.keys(RUNNERS).join(', ')})`);
  const cases = suite.cases.filter((c) => !only || only.includes(c.id));
  mkdirSync(out, { recursive: true });
  const all = [];
  for (const arm of arms) {
    // script:<name> runs the case's scripted control instead of a model (no plugin).
    const script = arm.startsWith('script:') ? arm.slice(7) : null;
    const { dir, appendSystemPrompt, entry } = buildArm(script ? 'vanilla' : arm, { subject: suite.subject, repoRoot: suite.repoRoot, out: join(out, 'arms', arm.replace(/[^\w-]/g, '_')), pluginName: suite.name });
    if (script && !runner.SCRIPTED) throw new Error(`runner ${runnerName} cannot run scripted controls`);
    runner.compile(dir, cases, { appendSystemPrompt, script, entry });
    for (const c of cases) {
      const trials = Number(trialsOverride ?? c.trials);
      process.stderr.write(`[pit-wall] arm=${arm} case=${c.id} trials=${trials}\n`);
      const res = runner.run(dir, { trials, model, maxTurns, judgeModel: suite.judgeModel, outJson: join(out, `raw-${arm.replace(/[^\w-]/g, '_')}-${c.id}.json`), needsShell: c.needsShell, caseGlob: c.id, writable: c.writable, shell: c.shell });
      for (const rec of res.records) all.push({ arm, kind: c.kind, caseDigest: c.digest, ...gradeRecord(rec, c, runner, { model: suite.judgeModel ?? 'haiku' }), claudeVersion: res.claudeVersion });
    }
  }
  const doc = { suite: suite.name, baseline: suite.baseline, controls: suite.controls, candidates: suite.candidates.filter((a) => arms.includes(a)), model, maxTurns: maxTurns ?? null, runner: runnerName, createdAt: new Date().toISOString(), records: all };
  writeFileSync(join(out, 'results.json'), JSON.stringify(doc, null, 2));
  writeFileSync(join(out, 'report.md'), renderReport(summarize(doc)));
  if (all.some((r) => r.arm.startsWith('script:'))) {
    const cc = checkControls(all, suite);
    writeFileSync(join(out, 'controls.md'), `# Scripted controls: ${cc.ok ? 'all as built' : 'MISMATCH — case or graders are broken'}\n\n${cc.text}\n`);
    process.stdout.write(`${join(out, 'controls.md')} (${cc.ok ? 'ok' : 'MISMATCH'})\n`);
  }
  process.stdout.write(`${join(out, 'report.md')}\n`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'run') await cmdRun(rest);
else if (cmd === 'report') {
  const doc = JSON.parse(readFileSync(rest[0], 'utf8'));
  process.stdout.write(renderReport(summarize(doc)));
} else if (cmd === 'regrade') {
  // Re-run pit-wall graders on stored trajectories: no model calls, so it is safe
  // for every-PR CI. Judge verdicts are reused from the stored run.
  const doc = JSON.parse(readFileSync(rest[0], 'utf8'));
  const suite = loadSuite(rest[1]);
  const byId = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const runner = RUNNERS[doc.runner] ?? claudeRunner;
  doc.controls ??= suite.controls;
  const judgeWith = rest.includes('--rejudge') ? { model: opt(rest, 'judge-model', suite.judgeModel ?? 'haiku') } : null;
  if (judgeWith) doc.records = doc.records.map((r) => ({ ...r, judged: {} }));
  if (runner.backfill) doc.records = runner.backfill(doc.records, dirname(resolve(rest[0])));
  doc.records = doc.records.map((r) => (byId[r.case] ? { ...r, ...gradeRecord(r, byId[r.case], runner, judgeWith) } : r));
  const out = opt(rest, 'out', rest[0]);
  writeFileSync(out, JSON.stringify(doc, null, 2));
  process.stdout.write(renderReport(summarize(doc)));
} else if (cmd === 'judge-agree') {
  // Re-judge stored runs with pit-wall's judge and compare against the verdicts
  // already recorded (runner-native or another model). Disagreements are printed
  // for a human to label: that labelled set is the judge's calibration set.
  const doc = JSON.parse(readFileSync(rest[0], 'utf8'));
  const suite = loadSuite(rest[1]);
  const model = opt(rest, 'model', 'haiku');
  const byId = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const rows = [];
  for (const r of doc.records) {
    const kase = byId[r.case];
    if (!kase || !r.trajectory) continue;
    for (const g of kase.graders.filter((x) => x.type === 'judge')) {
      const v = judge({ rubric: g.rubric, view: judgeView(r.trajectory, kase.prompt), model });
      rows.push({ arm: r.arm, case: r.case, trial: r.trial, grader: g.name, recorded: r.native?.[g.name], pitwall: v.passed, reason: v.reason ?? v.error });
      process.stderr.write('.');
    }
  }
  const agree = rows.filter((x) => x.recorded === x.pitwall).length;
  process.stdout.write(`\njudge ${model}: agrees with recorded verdicts on ${agree}/${rows.length}\n`);
  for (const x of rows.filter((x) => x.recorded !== x.pitwall)) {
    process.stdout.write(`- ${x.arm} / ${x.case} #${x.trial} ${x.grader}: recorded=${x.recorded} pit-wall=${x.pitwall} :: ${x.reason}\n`);
  }
  if (opt(rest, 'out')) writeFileSync(opt(rest, 'out'), JSON.stringify(rows, null, 2));
}
else if (cmd === 'image' && rest[0] === 'build') {
  const r = buildImage(rest[1] ?? 'claude-code', { version: opt(rest, 'version', 'latest') });
  process.stdout.write(`${r.image}\n`);
}
else if (cmd === 'calibrate') {
  const [sub, ...a] = rest;
  if (sub === 'sample') {
    const positional = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1].startsWith('--')));
    const [suitePath, ...resultPaths] = positional;
    const suite = loadSuite(suitePath);
    const sources = resultPaths.map((p) => { const d = JSON.parse(readFileSync(p, 'utf8')); return { path: p, runner: d.runner, records: d.records }; });
    const items = calibrate.sampleItems(sources, suite, { n: Number(opt(a, 'n', 30)), seed: Number(opt(a, 'seed', 7)) });
    const out = opt(a, 'out');
    mkdirSync(out, { recursive: true });
    for (const it of items) it.key.results = it.key.results.replaceAll('\\', '/');
    writeFileSync(join(out, 'items.json'), JSON.stringify(items, null, 2) + '\n');
    process.stdout.write(`${items.length} items (${items.filter((i) => i.disagree).length} with judge disagreement) -> ${join(out, 'items.json')}\n`);
  } else if (sub === 'translate') {
    const p = join(a[0], 'items.json');
    const models = { translate: opt(a, 'model', 'sonnet'), check: opt(a, 'check-model', 'haiku') };
    const items = JSON.parse(readFileSync(p, 'utf8'));
    const call = (system, prompt, schema, model) => { process.stderr.write('.'); return claudeJson({ system, prompt, schema, model }); };
    const out = calibrate.translateItems(items, { call, models });
    writeFileSync(p, JSON.stringify(out, null, 2) + '\n');
    const bad = out.filter((i) => i.ja?.status !== 'verified');
    process.stdout.write(`\nverified ${out.length - bad.length}/${out.length} (translate ${models.translate}, check ${models.check}) -> ${p}\n`);
    for (const i of bad) process.stdout.write(`- ${i.id} unverified: ${(i.ja?.problems ?? []).join(' / ')}\n`);
  } else if (sub === 'serve') {
    const port = Number(opt(a, 'port', 4319));
    calibrate.serve(a[0], { port });
    process.stdout.write(`labelling page: http://127.0.0.1:${port}/  (labels -> ${join(a[0], 'labels.json')})\n`);
  } else if (sub === 'score') {
    const items = JSON.parse(readFileSync(join(a[0], 'items.json'), 'utf8'));
    const lp = join(a[0], 'labels.json');
    const labels = existsSync(lp) ? JSON.parse(readFileSync(lp, 'utf8')) : {};
    const s = calibrate.score(items, labels);
    const f = (x) => (x == null ? '–' : x.toFixed(2));
    process.stdout.write(`labelled ${s.labelled}/${s.total}, unsure: ${s.unsure.join(' ') || 'none'}, stale (made on other material, excluded): ${s.stale.join(' ') || 'none'}\n\n| judge | n | agreement | kappa | false pass | false fail |\n|---|---|---|---|---|---|\n`);
    for (const r of s.rows) process.stdout.write(`| ${r.judge} | ${r.n} | ${f(r.agreement)} | ${f(r.kappa)} | ${r.falsePass.join(' ') || '–'} | ${r.falseFail.join(' ') || '–'} |\n`);
  } else throw new Error('usage: pit-wall calibrate sample <suite.yaml> <results.json...> --out <dir> [--n 30] | translate <dir> [--model sonnet] | serve <dir> [--port 4319] | score <dir>');
}
else if (cmd === 'controls') {
  // Regrade stored runs (state is stored on each record) and check the scripted controls.
  const doc = JSON.parse(readFileSync(rest[0], 'utf8'));
  const suite = loadSuite(rest[1]);
  const byId = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const runner = RUNNERS[doc.runner] ?? claudeRunner;
  const recs = doc.records.map((r) => (byId[r.case] ? { ...r, ...gradeRecord(r, byId[r.case], runner, null) } : r));
  const cc = checkControls(recs, suite);
  process.stdout.write(`${cc.text}\n${cc.ok ? 'ok' : 'MISMATCH'}\n`);
  if (!cc.ok) process.exitCode = 1;
}
else if (cmd === 'lint') { lintSuite(loadSuite(rest[0])); process.stdout.write('ok\n'); }
else if (cmd === 'leak') {
  // Does the text an arm is given share case-specific material with the cells it is
  // evaluated on? (the reverse of lintCase). Lexical only: a paraphrase is not caught.
  const suite = loadSuite(rest[0]);
  const arms = (opt(rest, 'arms') ?? suite.arms.join(',')).split(',').filter((a) => !a.startsWith('script:') && a !== 'vanilla');
  let hits = 0;
  for (const arm of arms) {
    const text = arm.startsWith('append:') ? readFileSync(resolve(suite.repoRoot, arm.slice(7)), 'utf8')
      : arm.startsWith('path:') ? subjectDocs(resolve(suite.repoRoot, arm.slice(5))) : subjectDocs(suite.subject);
    for (const c of suite.cases) {
      const o = leakOverlap(text, c);
      const n = o.tokens.length + o.words.length + o.phrases.length;
      hits += n;
      process.stdout.write(`${arm} x ${c.id}: ${n ? `tokens [${o.tokens.join(', ')}] words [${o.words.join(', ')}] phrases [${o.phrases.join(' | ')}]` : 'no overlap'}\n`);
    }
  }
  if (hits && rest.includes('--strict')) process.exitCode = 1;
}
else if (cmd === 'rules') process.stdout.write(listRules(resolve(rest[0])).join('\n') + '\n');
else {
  process.stderr.write('usage: pit-wall run <suite.yaml> [--runner claude-plugin-eval|harbor] [--out dir] [--arms a,b] [--cases x,y] [--trials n] [--model m] | report <results.json> | regrade <results.json> <suite.yaml> [--out f] | judge-agree <results.json> <suite.yaml> [--model m] | image build [agent] [--version X] | lint <suite.yaml> | leak <suite.yaml> [--arms a,b] [--strict] | controls <results.json> <suite.yaml> | rules <plugin-dir>\n');
  process.exit(2);
}
