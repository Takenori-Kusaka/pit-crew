// Compare the independent re-derivation of the EXP-48 task filter with the author's result
// (review 34-review-g5.md §12.6): per task, pre_fix_commit, fix_commit, impl_paths, hidden-check
// test paths and static pass must all be equal; order agrees if static_order ranks agree among the
// agreeing tasks. Stop rule: fewer than 80% of the author's static passes agree -> the filter is not a
// reproducible instrument. Prints counts and ids only and writes gates/exp48/rederive.json.
// Usage: node experiments/exp48/compare-rederive.mjs <derived.json>
import { readFileSync, writeFileSync } from 'node:fs';

const derivedPath = process.argv[2];
if (!derivedPath) { console.error('usage: compare-rederive.mjs <derived.json>'); process.exit(1); }
const A = JSON.parse(readFileSync('experiments/exp48/candidates.json', 'utf8'));
const D = JSON.parse(readFileSync(derivedPath, 'utf8'));
const arr = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x).find(Array.isArray) ?? [] : []);
const keyOf = (t) => String(t.issue ?? t.issue_number);
const sorted = (x) => [...(x ?? [])].map(String).sort();
const pick = (t) => ({
  pre: String(t.pre_fix_commit ?? ''), fix: String(t.fix_commit ?? ''),
  impl: sorted(t.impl_paths), hidden: sorted(t.hidden_check_test_paths ?? t.hidden_checks ?? t.hidden_check_paths),
  order: Number(t.static_order ?? t.order ?? NaN),
});

// author: static passes = primaries + reserves + dropped_after_examination (all passed the static stages)
const authorFull = new Map([...arr(A.primaries), ...arr(A.reserves)].map((t) => [keyOf(t), pick(t)]));
const authorStatic = new Map();
for (const t of arr(A.static_pass)) authorStatic.set(keyOf(t), t);
for (const t of [...arr(A.primaries), ...arr(A.reserves), ...arr(A.dropped_after_examination)]) if (!authorStatic.has(keyOf(t))) authorStatic.set(keyOf(t), t);
const derivedTasks = arr(D.tasks ?? D.static_pass ?? D.passing ?? D);
const derived = new Map(derivedTasks.map((t) => [keyOf(t), pick(t)]));

const res = { authorStatic: authorStatic.size, derivedStatic: derived.size, both: 0, onlyAuthor: [], onlyDerived: [], fullCompared: 0, fullAgree: [], fullDisagree: [] };
for (const k of authorStatic.keys()) if (derived.has(k)) res.both++; else res.onlyAuthor.push(k);
for (const k of derived.keys()) if (!authorStatic.has(k)) res.onlyDerived.push(k);
// field-level agreement where the author recorded all fields (primaries + reserves)
for (const [k, a] of authorFull) {
  const d = derived.get(k); if (!d) { res.fullDisagree.push({ issue: k, why: ['not derived'] }); continue; }
  res.fullCompared++;
  const why = [];
  if (a.pre !== d.pre) why.push('pre_fix_commit'); if (a.fix !== d.fix) why.push('fix_commit');
  if (JSON.stringify(a.impl) !== JSON.stringify(d.impl)) why.push('impl_paths');
  if (JSON.stringify(a.hidden) !== JSON.stringify(d.hidden)) why.push('hidden_check_paths');
  (why.length ? res.fullDisagree : res.fullAgree).push(why.length ? { issue: k, why } : k);
}
// order among agreeing tasks
const ag = res.fullAgree.filter((k) => Number.isFinite(authorFull.get(k).order) && Number.isFinite(derived.get(k).order));
const rank = (src) => [...ag].sort((x, y) => src.get(x).order - src.get(y).order);
res.orderAgrees = JSON.stringify(rank(authorFull)) === JSON.stringify(rank(derived));
res.staticAgreeShare = authorStatic.size ? res.both / authorStatic.size : 0;
res.stop = res.staticAgreeShare < 0.8 ? 'STOP: fewer than 80% of the author\'s static passes re-derived' : 'ok';
res.inputs = { candidates: 'experiments/exp48/candidates.json', derived: derivedPath, derivedInputTime: D.input_time ?? D.inputTime ?? null };
res.writtenBy = 'machine (compare-rederive.mjs), run by the lead';
writeFileSync('gates/exp48/rederive.json', JSON.stringify(res, null, 1) + '\n');
console.log(`static passes: author ${res.authorStatic}, re-derived ${res.derivedStatic}, both ${res.both} (${(100 * res.staticAgreeShare).toFixed(0)}%) -> ${res.stop}`);
console.log(`only author: ${res.onlyAuthor.length}, only re-derived: ${res.onlyDerived.length}`);
console.log(`field-level (primaries+reserves ${authorFull.size}): agree ${res.fullAgree.length}, disagree ${res.fullDisagree.length}; order among agreeing: ${res.orderAgrees ? 'same' : 'DIFFERENT'}`);
for (const x of res.fullDisagree) console.log(`  disagree issue ${x.issue}: ${x.why.join(', ')}`);
