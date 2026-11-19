// What changed in suites/fix/suite.yaml between a git revision and the working tree, split into
// (1) the end-state check scripts (params.expect.task.check, params.expect.conventions[].check) and
// (2) everything else: what a fixer sees (the repository's history, the ticket, the PR, the review,
// the request), the scripted controls and their expected outcomes, the arms. Used after a change to
// checks.mjs to show that only check scripts moved. Also reports whether process-spec.json and
// verdicts.json (the registered truths) are byte-identical to the revision.
// Usage: node experiments/fix/suite-diff.mjs [rev=HEAD]      exit 0 = only check scripts differ (or nothing)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// With --additions: cells were ADDED. Every case of the revision must be in the working tree unchanged
// in everything (what a fixer sees, the controls, AND the check scripts), in the same order, and its
// entries of process-spec.json / verdicts.json must be unchanged; the new ids are listed.
// Usage: node experiments/fix/suite-diff.mjs --additions [rev=HEAD]      exit 0 = only additions
if (process.argv.includes('--additions')) {
  const rev = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'HEAD';
  const show = (p) => execFileSync('git', ['show', `${rev}:${p}`], { maxBuffer: 256 << 20 }).toString('utf8');
  const parse = (t) => JSON.parse(t.replace(/^#.*\n/, ''));
  const before = parse(show('suites/fix/suite.yaml')), after = parse(readFileSync('suites/fix/suite.yaml', 'utf8'));
  const { cases: cb, ...restB } = before; const { cases: ca, ...restA } = after;
  let ok = true;
  const say = (good, msg) => { ok &&= good; console.log(`${good ? 'ok  ' : 'DIFF'} ${msg}`); };
  say(JSON.stringify(restB) === JSON.stringify(restA), 'the suite outside its cases (name, subject, arms, compare)');
  const changed = cb.filter((c, i) => JSON.stringify(c) !== JSON.stringify(ca[i])).map((c) => c.id);
  say(!changed.length, `the ${cb.length} cases of ${rev}: ${changed.length ? `changed or moved: ${changed.join(' ')}` : 'identical, same order (fixtures, controls, check scripts)'}`);
  const spB = JSON.parse(show('experiments/fix/process-spec.json')), spA = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
  const spChanged = Object.keys(spB).filter((k) => JSON.stringify(spB[k]) !== JSON.stringify(spA[k]));
  say(!spChanged.length, `process-spec.json: the ${Object.keys(spB).length} registrations of ${rev} ${spChanged.length ? `changed: ${spChanged.join(' ')}` : 'identical'}`);
  const vB = JSON.parse(show('experiments/fix/verdicts.json')), vA = JSON.parse(readFileSync('experiments/fix/verdicts.json', 'utf8'));
  const vChanged = vB.filter((v, i) => JSON.stringify(v) !== JSON.stringify(vA[i])).map((v) => v.case);
  say(!vChanged.length, `verdicts.json: the ${vB.length} entries of ${rev} ${vChanged.length ? `changed: ${vChanged.join(' ')}` : 'identical'}`);
  const added = ca.slice(cb.length).map((c) => c.id);
  console.log(`added: ${added.length} cases (${added.join(' ')}); process-spec +${Object.keys(spA).length - Object.keys(spB).length}, verdicts +${vA.length - vB.length}`);
  console.log(ok ? 'OK: only additions' : 'FAIL: an existing cell changed');
  process.exit(ok ? 0 : 1);
}

const rev = process.argv[2] ?? 'HEAD';
const show = (p) => execFileSync('git', ['show', `${rev}:${p}`], { maxBuffer: 256 << 20 });
const parse = (buf) => JSON.parse(buf.toString('utf8').replace(/^#.*\n/, ''));
const sha = (x) => createHash('sha256').update(x).digest('hex').slice(0, 16);

const before = parse(show('suites/fix/suite.yaml'));
const after = parse(readFileSync('suites/fix/suite.yaml'));

// The check scripts of a case, by name; and the case without them.
function split(suite) {
  const checks = {};
  const rest = structuredClone(suite);
  for (const c of rest.cases) {
    const e = c.params.expect;
    checks[c.id] = { [e.task.name]: e.task.check, ...Object.fromEntries(e.conventions.map((k) => [k.name, k.check])) };
    delete e.task.check;
    for (const k of e.conventions) delete k.check;
  }
  return { checks, rest };
}
const a = split(before), b = split(after);
const restA = JSON.stringify(a.rest), restB = JSON.stringify(b.rest);
const restSame = restA === restB;
console.log(`everything except the check scripts: ${restSame ? 'identical' : 'DIFFERENT'} (sha256 ${sha(restA)} -> ${sha(restB)}; ${after.cases.length} cases)`);
if (!restSame) {
  for (const [i, c] of a.rest.cases.entries()) {
    const d = b.rest.cases[i];
    if (JSON.stringify(c) === JSON.stringify(d)) continue;
    const keys = [...new Set([...Object.keys(c.params), ...Object.keys(d?.params ?? {})])].filter((k) => JSON.stringify(c.params[k]) !== JSON.stringify(d?.params?.[k]));
    console.log(`  ${c.id}: differs in params.${keys.join(', params.') || '(outside params)'}`);
  }
}
const changed = {};
for (const id of Object.keys(b.checks)) for (const [name, script] of Object.entries(b.checks[id])) if (a.checks[id]?.[name] !== script) (changed[name] ??= []).push(id);
const names = Object.keys(changed);
console.log(names.length ? `check scripts that differ: ${names.map((n) => `${n} (${changed[n].length} cases)`).join(', ')}` : 'check scripts: identical');
// The parts of a check script shared by all checks (the prelude: how the received commit, the tip and
// the probes are found) must not have moved either: compare an untouched check as a whole.
let truthsSame = true;
for (const p of ['experiments/fix/process-spec.json', 'experiments/fix/verdicts.json']) {
  const same = Buffer.compare(show(p), readFileSync(p)) === 0;
  truthsSame &&= same;
  console.log(`${p}: ${same ? 'byte-identical' : 'DIFFERENT'} to ${rev}`);
}
const cellsSame = Buffer.compare(show('experiments/fix/cells.mjs'), readFileSync('experiments/fix/cells.mjs')) === 0 && Buffer.compare(show('experiments/fix/project.mjs'), readFileSync('experiments/fix/project.mjs')) === 0;
console.log(`experiments/fix/cells.mjs, project.mjs: ${cellsSame ? 'byte-identical' : 'DIFFERENT'} to ${rev}`);
process.exit(restSame && truthsSame && cellsSame ? 0 : 1);
