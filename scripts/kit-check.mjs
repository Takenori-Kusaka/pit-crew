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

// --- goal 2 (docs/planning/37-goal-2-2026-11-14.md): two cold onboardings, grader miscounts, planted errors ---
const ROLES6 = ['dev', 'po', 'qm', 'platform', 'audit', 'fix'];
// an onboarding log states its blocker counts on two lines that the check can read:
//   詰まった所: N 件            (all blockers)
//   詰まった所（案内の不足）: N 件  (blockers caused by the guide / templates / schema)
const blockerCount = (p, kind) => {
  const m = read(p).match(kind === 'guide' ? /詰まった所（案内の不足）\s*[:：]\s*(\d+)\s*件/ : /詰まった所\s*[:：]\s*(\d+)\s*件/);
  return m ? Number(m[1]) : null;
};
const onboarding = (role) => {
  const p = `kit/results/${role}/onboarding-log.md`;
  if (!exists(p)) return [`${p} がない`];
  const errs = [];
  if ((read(p).match(/\b\d{1,2}:\d{2}\b/g) ?? []).length < 2) errs.push(`${p} に手順ごとの時刻が無い`);
  if (blockerCount(p) === null) errs.push(`${p} に「詰まった所: N 件」の行が無い`);
  if (blockerCount(p, 'guide') === null) errs.push(`${p} に「詰まった所（案内の不足）: N 件」の行が無い`);
  return errs;
};
const resolutionRows = (p) => (read(p).match(/^\|\s*B\d+\s*\|/gm) ?? []).length;
const ciGreenFor = (sha) => {
  const r = spawnSync('gh', ['run', 'list', '--workflow', 'kit.yml', '-L', '5', '--json', 'conclusion,headSha'], { encoding: 'utf8' });
  if (r.status !== 0) return ['GitHub Actions の結果を取得できない'];
  try { return JSON.parse(r.stdout).some((x) => x.headSha === sha && x.conclusion === 'success') ? [] : [`スナップショット ${String(sha).slice(0, 9)} の kit.yml が緑でない`]; } catch { return ['gh の出力を読めない']; }
};
// CI is green on a commit that contains `file` (the latest successful kit.yml run must include the check)
const ciGreenWith = (file) => {
  const r = spawnSync('gh', ['run', 'list', '--workflow', 'kit.yml', '-L', '5', '--json', 'conclusion,headSha'], { encoding: 'utf8' });
  if (r.status !== 0) return ['GitHub Actions の結果を取得できない'];
  let runs; try { runs = JSON.parse(r.stdout); } catch { return ['gh の出力を読めない']; }
  const ok = runs.find((x) => x.conclusion === 'success');
  if (!ok) return ['kit.yml の緑の実行が無い'];
  spawnSync('git', ['fetch', '-q', 'origin', ok.headSha], { encoding: 'utf8' });
  const has = spawnSync('git', ['cat-file', '-e', `${ok.headSha}:${file}`]).status === 0;
  return has ? [] : [`緑の kit.yml の実行（${ok.headSha.slice(0, 9)}）に ${file} が入っていない（CI 用のスナップショットを push する）`];
};
const N = [
  { id: 'N1', due: '2026-11-15', what: 'kit-check --goal 2 と、1 回目の導入（ext-audit）の記録', check: () => [
    ...validateSpec('kit/roles/ext-audit.yaml'), ...casesFor('ext-audit'), ...onboarding('ext-audit'),
  ] },
  { id: 'N2', due: '2026-11-17', what: '1 回目の詰まりへの対応、2 回目の導入（planning）、両ロールの Δ', check: () => {
    const errs = [];
    const res = 'kit/results/ext-audit/blockers-resolution.md', n1 = blockerCount('kit/results/ext-audit/onboarding-log.md');
    if (!exists(res)) errs.push(`${res}（詰まった所ごとの対応）がない`);
    else if (n1 !== null && resolutionRows(res) < n1) errs.push(`${res} の対応が ${resolutionRows(res)} 件で、詰まった所 ${n1} 件に足りない`);
    errs.push(...validateSpec('kit/roles/planning.yaml'), ...casesFor('planning'), ...onboarding('planning'));
    errs.push(...jsonHas('kit/results/planning/time.json', (j) => j.design_hours <= 4 && j.test_hours <= 4, 'kit/results/planning/time.json が無いか、設計・テストのどちらかが 4 時間を超えた'));
    const g1 = blockerCount('kit/results/ext-audit/onboarding-log.md', 'guide'), g2 = blockerCount('kit/results/planning/onboarding-log.md', 'guide');
    if (g1 !== null && g2 !== null && !(g2 < g1)) errs.push(`案内の不足による詰まりが減っていない（1 回目 ${g1} 件、2 回目 ${g2} 件）`);
    errs.push(...deltaFor('ext-audit'), ...deltaFor('planning'));
    return errs;
  } },
  { id: 'N3', due: '2026-11-18', what: '上げる判断の採点、数え誤りの回帰テストと修正、6 ロールの採点し直し', check: () => [
    ...runTest('packages/pit-wall/test/kit-regrade.test.mjs'),
    ...jsonHas('kit/results/regrade.json', (j) => ROLES6.every((r) => j.roles?.[r] && Number.isFinite(j.roles[r].before?.with) && Number.isFinite(j.roles[r].after?.with)), 'kit/results/regrade.json に 6 ロールの直す前・後が無い'),
    ...(/採点し直し/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に「採点し直し」の前後の表が無い']),
  ] },
  { id: 'N4', due: '2026-11-20', what: '植え込んだ誤りを採点器がすべて検出し、元の台本は pass。CI に入って緑', check: () => [
    ...(exists('packages/pit-wall/src/kit/perturb.mjs') ? [] : ['packages/pit-wall/src/kit/perturb.mjs がない']),
    ...runTest('packages/pit-wall/test/kit-perturb.test.mjs'),
    ...(/kit-perturb\.test\.mjs/.test(read('.github/workflows/kit.yml')) ? [] : ['.github/workflows/kit.yml が摂動の自己テストを回していない']),
    ...ciGreenWith('packages/pit-wall/test/kit-perturb.test.mjs'),
  ] },
  { id: 'N5', due: '2026-11-21', what: 'kit-guide を 2 回の導入で更新、公開の前提、承認依頼', check: () => [
    ...(/ext-audit/.test(read('docs/kit-guide.md')) && /planning/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に 2 回の導入（ext-audit・planning）の結果が無い']),
    ...jsonHas('kit/results/publish-precheck-2.json', (j) => j.ci_green === true && j.secret_hits === 0 && j.identifier_hits === 0 && /^[0-9a-f]{40}$/.test(j.snapshot_commit ?? ''), 'kit/results/publish-precheck-2.json が満たされていない'),
    ...(exists('kit/results/publish-precheck-2.json') ? ciGreenFor(JSON.parse(read('kit/results/publish-precheck-2.json') || '{}').snapshot_commit) : []),
    ...(exists('kit/results/approval-request-2.md') ? [] : ['kit/results/approval-request-2.md（オーナーへの承認依頼）が無い']),
  ] },
];

// --- goal 3 (docs/planning/38-dev-kit-evaluation.md): evaluate and improve the Dev harness with the kit ---
const ARMS = ['none', 'default', 'gq-copy', 'v1'];
const EVAL = 'kit/results/dev-eval';
const committedBefore = (file, laterGlob) => {
  // the card's first commit is older than the first commit of any result under `laterGlob`
  const c = spawnSync('git', ['log', '--diff-filter=A', '--format=%ct', '--', file], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).pop();
  const r = spawnSync('git', ['log', '--diff-filter=A', '--format=%ct', '--', laterGlob], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).pop();
  if (!c) return [`${file} がコミットされていない`];
  return r && Number(r) < Number(c) ? [`${laterGlob} の結果が ${file} より先にコミットされている`] : [];
};
const P = [
  { id: 'P1', due: '2026-11-15', what: 'kit-check --goal 3 と、実行の前の実験カード', check: () => {
    const card = 'docs/planning/38-dev-kit-evaluation.md', t = read(card), errs = [];
    if (!t) return [`${card} がない`];
    for (const [re, what] of [[/ハーネスなし/, 'ハーネスなし'], [/既定の Dev スキル/, '既定の Dev スキル'], [/GQ の写し/, 'GQ の写し'], [/役割ハーネス v1/, '役割ハーネス v1'],
      [/主な量/, '主な量'], [/補助の量/, '補助の量'], [/「評価済み」と書く条件/, '「評価済み」と書く条件'], [/結果を見てから変えない/, '結果を見てから変えない'], [/限界 2/, '限界 2 の決定'], [/限界 3/, '限界 3 の決定']])
      if (!re.test(t)) errs.push(`${card} に「${what}」が無い`);
    return [...errs, ...committedBefore(card, `${EVAL}/*.json`)];
  } },
  { id: 'P2', due: '2026-11-16', what: 'Dev の 2 つ目の部品（別の題材）、ケース、植え込みの検査', check: () => {
    const errs = [];
    const fx = readdirSync('kit/fixtures').filter((d) => d.startsWith('dev-') && d !== 'dev-basic' && exists(`kit/fixtures/${d}/fixture.yaml`));
    if (!fx.length) return ['kit/fixtures/dev-<名前>/（2 つ目の Dev の部品）がない'];
    const d = fx[0];
    if (!exists(`kit/cases/dev-${d.replace(/^dev-/, '')}`)) errs.push(`kit/cases/dev-${d.replace(/^dev-/, '')}（2 つ目の部品のケース）がない`);
    errs.push(...runTest('packages/pit-wall/test/kit-perturb.test.mjs'));
    return errs;
  } },
  { id: 'P3', due: '2026-11-18', what: '2 つの部品 × 4 条件の実行と、条件ごとの結果', check: () => [
    ...jsonHas(`${EVAL}/summary.json`, (j) => ARMS.every((a) => Number.isFinite(j.arms?.[a]?.conformance)) && (j.fixtures?.length ?? 0) >= 2, `${EVAL}/summary.json に 2 つの部品 × 4 条件の準拠が無い`),
    ...(/dev-eval/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に Dev の評価の結果が無い']),
    ...(/## 結果/.test(read('docs/planning/38-dev-kit-evaluation.md')) ? [] : ['カードに「## 結果」が無い']),
  ] },
  { id: 'P4', due: '2026-11-20', what: 'v1 の最多の型を記録から選び、1 回直した v1.1 を同じケースで回す', check: () => [
    ...(exists('subjects/role-harness-v1.1') ? [] : ['subjects/role-harness-v1.1 がない']),
    ...jsonHas(`${EVAL}/summary.json`, (j) => Number.isFinite(j.arms?.['v1.1']?.conformance), `${EVAL}/summary.json に v1.1 の結果が無い`),
    ...(/## 改善（v1\.1）/.test(read('docs/planning/38-dev-kit-evaluation.md')) ? [] : ['カードに「## 改善（v1.1）」（選んだ型・記録の根拠・直した箇所・前後）が無い']),
  ] },
  { id: 'P5', due: '2026-11-21', what: '主張の台帳、公開の前提、承認依頼', check: () => [
    ...((read('docs/claims.md').match(/^\| DK-\d+ \|/gm) ?? []).length >= 3 ? [] : ['docs/claims.md に Dev のキット評価の主張（DK-n）が 3 行以上無い']),
    ...jsonHas('kit/results/publish-precheck-3.json', (j) => j.ci_green === true && j.secret_hits === 0 && j.identifier_hits === 0 && /^[0-9a-f]{40}$/.test(j.snapshot_commit ?? ''), 'kit/results/publish-precheck-3.json が満たされていない'),
    ...(exists('kit/results/publish-precheck-3.json') ? ciGreenFor(JSON.parse(read('kit/results/publish-precheck-3.json') || '{}').snapshot_commit) : []),
    ...(exists('kit/results/approval-request-3.md') ? [] : ['kit/results/approval-request-3.md（オーナーへの承認依頼）が無い']),
  ] },
];

// --- goal 4 (docs/planning/39-dev-kit-cases-v2.md): cases that can tell the conditions apart ---
const EVAL2 = 'kit/results/dev-eval-2';
const CARD4 = 'docs/planning/39-dev-kit-cases-v2.md';
const Q = [
  { id: 'Q1', due: '2026-11-15', what: 'kit-check --goal 4 と、実行の前の実験カード 39', check: () => {
    const t = read(CARD4), errs = [];
    if (!t) return [`${CARD4} がない`];
    for (const [re, what] of [[/「戻す」/, '「戻す」ができない件'], [/上げる判断/, '上げる判断のケース'], [/誘い/, '誘いのケース'], [/0\.2 以上 0\.8 以下/, '差を出せる基準（0.2〜0.8）'],
      [/足す・外す/, 'ケースを足す・外す規則'], [/カード 38 §7/, '判定の規則'], [/結果を見てから変えない/, '結果を見てから変えない']])
      if (!re.test(t)) errs.push(`${CARD4} に「${what}」が無い`);
    return [...errs, ...committedBefore(CARD4, `${EVAL2}/*.json`)];
  } },
  { id: 'Q2', due: '2026-11-16', what: '砂場で「戻す」ができることを、モデルの実行 1 回の記録で示す', check: () =>
    jsonHas(`${EVAL2}/handback-proof.json`, (j) => j.model_run === true && j.handback_achieved === true && typeof j.how === 'string', `${EVAL2}/handback-proof.json（モデルの実行で「戻す」が通った記録）が無い`) },
  { id: 'Q3', due: '2026-11-18', what: '作り直したケース、植え込みの検査、試走で差を出せる項目が各部品 3 つ以上', check: () => [
    ...runTest('packages/pit-wall/test/kit-perturb.test.mjs'),
    ...jsonHas(`${EVAL2}/pilot.json`, (j) => (j.fixtures ?? []).length >= 2 && j.fixtures.every((f) => (f.informative_items ?? []).length >= 3), `${EVAL2}/pilot.json に、各部品で差を出せる項目が 3 つ以上無い`),
  ] },
  { id: 'Q4', due: '2026-11-20', what: '作り直したケースで 4 条件と v1.1、goal 3 と並べて書く', check: () => [
    ...jsonHas(`${EVAL2}/summary.json`, (j) => ['none', 'default', 'gq-copy', 'v1', 'v1.1'].every((a) => Number.isFinite(j.arms?.[a]?.conformance)), `${EVAL2}/summary.json に 5 条件の準拠が無い`),
    ...(/dev-eval-2/.test(read('docs/kit-guide.md')) ? [] : ['docs/kit-guide.md に作り直したケースの結果が無い']),
    ...(/## 結果/.test(read(CARD4)) ? [] : ['カード 39 に「## 結果」が無い']),
  ] },
  { id: 'Q5', due: '2026-11-21', what: '主張の台帳の更新、公開の前提、承認依頼', check: () => [
    ...((read('docs/claims.md').match(/^\| DK-\d+ \|/gm) ?? []).length >= 12 ? [] : ['docs/claims.md に goal 4 の DK 行が足されていない（goal 3 の 7 行に足して 12 行以上）']),
    ...jsonHas('kit/results/publish-precheck-4.json', (j) => j.ci_green === true && j.secret_hits === 0 && j.identifier_hits === 0 && j.gq_copies_left === 0 && /^[0-9a-f]{40}$/.test(j.snapshot_commit ?? ''), 'kit/results/publish-precheck-4.json が満たされていない'),
    ...(exists('kit/results/publish-precheck-4.json') ? ciGreenFor(JSON.parse(read('kit/results/publish-precheck-4.json') || '{}').snapshot_commit) : []),
    ...(exists('kit/results/approval-request-4.md') ? [] : ['kit/results/approval-request-4.md（オーナーへの承認依頼）が無い']),
  ] },
];

// `--spec <path>`: validate one role spec (for a new role) and exit
if (process.argv.includes('--spec')) {
  const p = process.argv[process.argv.indexOf('--spec') + 1];
  const errs = validateSpec(p);
  console.log(errs.length ? errs.map((e) => `- ${e}`).join('\n') : `${p}: ok`);
  process.exit(errs.length ? 1 : 0);
}
const goal2 = process.argv.includes('--goal') && process.argv[process.argv.indexOf('--goal') + 1] === '2';
const goal3 = process.argv.includes('--goal') && process.argv[process.argv.indexOf('--goal') + 1] === '3';
if (goal2) M.splice(0, M.length, ...N);
const goal4 = process.argv.includes('--goal') && process.argv[process.argv.indexOf('--goal') + 1] === '4';
if (goal3) M.splice(0, M.length, ...P);
if (goal4) M.splice(0, M.length, ...Q);
console.log(`kit-check${goal2 ? ' --goal 2' : goal3 ? ' --goal 3' : goal4 ? ' --goal 4' : ''}  今日 ${today} (JST)  期限 2026-11-21`);
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
