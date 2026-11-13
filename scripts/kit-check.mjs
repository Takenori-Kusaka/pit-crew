#!/usr/bin/env node
// Progress check for the harness-kit goal (docs/planning/36-goal-2026-11-14.md).
// Prints today's date (JST), and for each milestone M1..M6: deadline, PASS/FAIL, ON TRACK/LATE, and
// the failing items. Run from the repository root: node scripts/kit-check.mjs
// Exit code: 0 when every milestone passes, 1 otherwise.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(join(process.cwd(), 'packages/pit-wall/package.json'));
const YAML = require('yaml');

const ROLES_REST = ['po', 'qm', 'platform', 'audit', 'fix'];
const jstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const today = jstDate();
const ok = (cond, label) => ({ ok: !!cond, label });
const exists = (p) => existsSync(p);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- role-spec validation (the format in kit/schema/role-spec.md) ---
function validateSpec(path) {
  const errs = [];
  if (!exists(path)) return [`${path} がない`];
  let s;
  try { s = YAML.parse(read(path)); } catch (e) { return [`${path} が YAML として読めない: ${e.message.split('\n')[0]}`]; }
  for (const k of ['spec_version', 'role', 'title', 'sources', 'decision_rights', 'actions', 'procedure', 'forbidden', 'escalations']) if (s?.[k] === undefined) errs.push(`${path}: ${k} がない`);
  if (errs.length) return errs;
  if (!Array.isArray(s.sources) || !s.sources.length) errs.push(`${path}: sources が空`);
  if (s.sources.some((x) => /(^|\/)subjects\//.test(String(x)) || /SKILL\.md/.test(String(x)))) errs.push(`${path}: sources にハーネス（subjects/・SKILL.md）がある`);
  const ids = new Set((s.actions ?? []).map((a) => a.id));
  for (const a of s.actions ?? []) if (!a.id || !a.detect) errs.push(`${path}: actions の要素に id か detect がない`);
  for (const id of s.procedure.required ?? []) if (!ids.has(id)) errs.push(`${path}: procedure.required の ${id} が actions に無い`);
  for (const g of s.procedure.any_of ?? []) for (const id of g) if (!ids.has(id)) errs.push(`${path}: procedure.any_of の ${id} が actions に無い`);
  for (const [a, b] of s.procedure.order ?? []) if (!ids.has(a) || !ids.has(b)) errs.push(`${path}: procedure.order の ${a}→${b} が actions に無い`);
  for (const f of s.forbidden ?? []) if (!f.id || !f.detect || !f.source) errs.push(`${path}: forbidden の要素に id・detect・source のどれかがない`);
  for (const e of s.escalations ?? []) if (!e.id || !e.detect_trigger || !e.detect_escalated || !e.to) errs.push(`${path}: escalations の要素に id・to・detect_trigger・detect_escalated のどれかがない`);
  return errs;
}

// --- grader independence: the grader must not read harness text ---
function graderIndependence(dir) {
  if (!exists(dir)) return [`${dir} がない`];
  const errs = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs'))) {
    const src = read(join(dir, f));
    for (const m of src.matchAll(/(?:import\s[^'"]*from\s*|import\(\s*|require\(\s*)['"]([^'"]+)['"]/g)) {
      if (/subjects|skills?\b|harness|structure|SKILL/i.test(m[1])) errs.push(`${f}: ハーネス側を import している (${m[1]})`);
    }
    if (/['"`][^'"`]*(subjects\/|SKILL\.md|\.claude\/skills)[^'"`]*['"`]/.test(src)) errs.push(`${f}: ハーネスのパスを文字列で持っている`);
  }
  return errs;
}

const runTest = (file) => {
  if (!exists(file)) return [`${file} がない`];
  const r = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8' });
  return r.status === 0 ? [] : [`${file} の自己テストが失敗（終了コード ${r.status}）`];
};
const jsonHas = (p, pred, msg) => {
  if (!exists(p)) return [`${p} がない`];
  try { return pred(JSON.parse(read(p))) ? [] : [msg]; } catch { return [`${p} が JSON として読めない`]; }
};
const ciGreen = () => {
  const wf = '.github/workflows/kit.yml';
  if (!exists(wf)) return [`${wf} がない`];
  const r = spawnSync('gh', ['run', 'list', '--workflow', 'kit.yml', '-L', '1', '--json', 'conclusion,headSha'], { encoding: 'utf8' });
  if (r.status !== 0) return ['GitHub Actions の結果を取得できない（ワークフローが GitHub 上で動いていない）'];
  try { const [x] = JSON.parse(r.stdout); return x?.conclusion === 'success' ? [] : [`最新の kit.yml の結果が ${x?.conclusion ?? 'なし'}`]; } catch { return ['gh の出力を読めない']; }
};
const deltaFor = (role) => jsonHas(`kit/results/${role}/delta.json`, (j) => Number.isFinite(j.delta) || Array.isArray(j.items), `kit/results/${role}/delta.json に Δ が無い`);
const casesFor = (role) => {
  const d = `kit/cases/${role}`;
  if (!exists(d)) return [`${d} がない`];
  const n = readdirSync(d).filter((f) => !f.startsWith('.')).length;
  return n ? [] : [`${d} にケースが無い`];
};

const M = [
  { id: 'M1', due: '2026-11-15', what: '書式・雛形・記入例・Dev の手順の定義・kit-check', check: () => [
    ...(exists('scripts/kit-check.mjs') ? [] : ['scripts/kit-check.mjs がない']),
    ...(exists('kit/schema/role-spec.md') ? [] : ['kit/schema/role-spec.md がない']),
    ...(exists('kit/templates/role-spec.yaml') ? [] : ['kit/templates/role-spec.yaml がない']),
    ...validateSpec('kit/templates/role-spec.example.yaml'),
    ...validateSpec('kit/roles/dev.yaml'),
    ...(/process-compass/.test(read('kit/roles/dev.yaml')) ? [] : ['kit/roles/dev.yaml の出どころにピットイン開発プロセスが無い']),
  ] },
  { id: 'M2', due: '2026-11-16', what: '汎用の採点器（ハーネスを読まない）と両方向の自己テスト', check: () => [
    ...(exists('packages/pit-wall/src/kit/grader.mjs') ? [] : ['packages/pit-wall/src/kit/grader.mjs がない']),
    ...graderIndependence('packages/pit-wall/src/kit'),
    ...runTest('packages/pit-wall/test/kit-grader.test.mjs'),
  ] },
  { id: 'M3', due: '2026-11-17', what: '手順の定義から plugin eval のケースを作る台本、Dev で 1 回', check: () => [
    ...(exists('packages/pit-wall/src/kit/gen-cases.mjs') ? [] : ['packages/pit-wall/src/kit/gen-cases.mjs がない']),
    ...casesFor('dev'),
    ...jsonHas('kit/results/dev/gen-run.json', (j) => j.ok === true, 'kit/results/dev/gen-run.json が ok でない'),
  ] },
  { id: 'M4', due: '2026-11-18', what: 'GitHub Actions で自己テスト緑、Dev の Δ', check: () => [...ciGreen(), ...deltaFor('dev')] },
  { id: 'M5', due: '2026-11-20', what: 'PO・QM・Platform・Audit・fix の定義・ケース・Δ・時間', check: () => ROLES_REST.flatMap((r) => [
    ...validateSpec(`kit/roles/${r}.yaml`), ...casesFor(r), ...deltaFor(r),
    ...jsonHas(`kit/results/${r}/time.json`, (j) => Number.isFinite(j.design_hours) && Number.isFinite(j.test_hours), `kit/results/${r}/time.json に時間が無い`),
  ]) },
  { id: 'M6', due: '2026-11-21', what: 'kit-guide、公開の前提の確認、オーナーへの承認依頼', check: () => [
    ...(/半日で設計/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に「半日で設計」の手順が無い']),
    ...(/測れなかったこと/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に「測れなかったこと」が無い']),
    ...jsonHas('kit/results/publish-precheck.json', (j) => j.ci_green === true && j.secret_hits === 0 && j.identifier_hits === 0, 'kit/results/publish-precheck.json が満たされていない'),
    ...(exists('kit/results/approval-request.md') ? [] : ['kit/results/approval-request.md（オーナーへの承認依頼）が無い']),
  ] },
];

console.log(`kit-check  今日 ${today} (JST)  期限 2026-11-21`);
let allPass = true;
for (const m of M) {
  const errs = m.check();
  const pass = errs.length === 0;
  allPass &&= pass;
  const track = pass ? 'DONE' : today > m.due ? 'LATE' : 'ON TRACK';
  console.log(`${m.id} 期限 ${m.due}  ${pass ? 'PASS' : 'FAIL'}  ${track}  — ${m.what}`);
  for (const e of errs.slice(0, 6)) console.log(`    - ${e}`);
  if (errs.length > 6) console.log(`    - ほか ${errs.length - 6} 件`);
}
const late = M.filter((m) => today > m.due && m.check().length);
if (late.length) console.log(`LATE: ${late.map((m) => m.id).join(', ')} → 作業を止め、理由と範囲を削る案をオーナーに聞く`);
console.log(allPass ? 'ALL PASS' : 'NOT YET');
process.exit(allPass ? 0 : 1);
