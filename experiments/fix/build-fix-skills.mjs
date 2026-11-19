// Build the default fix skill (subjects/fix-skill-default) from the fix role design
// (docs/planning/30-fix-role-design.md) and the Dev design's 改修 phase it reuses
// (docs/planning/11-dev-role-design.md §4.7), in the M-skill structure the Dev / QM defaults use:
// a core skill with the principles, the range limit, the routing table and the phase list, a state
// file to decide the phase, and one skill per phase (F0 intake / F1 照らす / F2 直す / F3 確かめる /
// F4 返す) that the core calls by name. The harness designer may read design 30; cells never.
//
// Usage: node experiments/fix/build-fix-skills.mjs [--check]
//   --check  verify every content line of design 30 §2 / §3 / 付表 3a / §4 and of 11 §4.7's step table
//            is in some skill file. Exit 1 on a missing line.
import { mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const SRC30 = 'docs/planning/30-fix-role-design.md', SRC11 = 'docs/planning/11-dev-role-design.md', OUT = 'subjects/fix-skill-default';

const tableRows = (s) => s.split('\n').filter((l) => l.startsWith('|'));
const bullets = (s) => s.split('\n').filter((l) => /^- /.test(l));

export function parse(t30, t11) {
  const a = t30.replace(/\r\n/g, '\n'), b = t11.replace(/\r\n/g, '\n');
  const sec = (t, start, end) => { const i = t.indexOf(start); if (i < 0) throw new Error(`missing ${start}`); const j = end ? t.indexOf(end, i + start.length) : -1; return t.slice(i, j < 0 ? undefined : j); };
  const limit = sec(a, '## 2. 受ける上限', '## 3. 原則');
  const principles = sec(a, '## 3. 原則', '### 付表 3a.');
  const routing = sec(a, '### 付表 3a.', '## 4. 工程');
  const phases30 = sec(a, '## 4. 工程', '## 5. ');
  const repair = sec(b, '### 4.7 改修', '### 4.8');
  const steps = tableRows(sec(repair, '#### 工程の内部の段階とやること', '#### 入る条件'));
  const thinking = bullets(sec(repair, '#### 考え方', '#### 調査の範囲と深さ'));
  const depth = bullets(sec(repair, '#### 調査の範囲と深さ', '#### 背景・目的が不明なとき'));
  const unknown = bullets(sec(repair, '#### 背景・目的が不明なとき', '#### 矛盾するとき'));
  const conflict = bullets(sec(repair, '#### 矛盾するとき', '#### 出る条件'));
  const exit = bullets(sec(repair, '#### 出る条件'));
  // 11 §4.7 step rows by phase letter (F1 1-3, F2 4-8, F3 9-10, F4 11-12).
  const stepRows = steps.slice(2); // drop header + rule
  const byPhase = { F1: [], F2: [], F3: [], F4: [] };
  let cur = null;
  for (const r of stepRows) { const m = r.match(/^\|\s*\*\*(F\d)/); if (m) cur = m[1]; if (cur) byPhase[cur].push(r); }
  return { limit: limit.trim(), principles: principles.trim(), routing: routing.trim(), phases30: phases30.trim(), stepHeader: steps.slice(0, 2), byPhase, thinking, depth, unknown, conflict, exit };
}

const nav = (s) => `<!-- nav -->\n${s}\n<!-- /nav -->`;
const fm = (name, description, extra = '') => `---\nname: ${name}\ndescription: ${description}\n${extra}---\n\n`;
const PHASES = [
  { k: 'F0', slug: '0-intake', name: '受け付け' },
  { k: 'F1', slug: '1-check', name: '照らす' },
  { k: 'F2', slug: '2-fix', name: '直す' },
  { k: 'F3', slug: '3-verify', name: '確かめる' },
  { k: 'F4', slug: '4-return', name: '返す' },
];
const skillName = (p) => `fix-phase-${p.slug}`;
const STATE = 'いまの工程は推測で決めない。リポジトリ直下の `.fix-state.md`（無ければ作る）に書いた工程と、成果物の有無（指摘ごとの仕分け表があるか、落ちた検査を変更後に再実行した記録があるか、対応表を書いたか、など）で決める。工程に入るときと、会話が圧縮された後には、その工程の手順を必ず読み直し、`.fix-state.md` に「いまの工程・読んだ手順・次に出る条件」を書く。`.fix-state.md` は **Write / Edit ツールで書く**（shell のリダイレクトや heredoc では書かない）。`.fix-state.md` は commit しない: commit するファイルは `git add <ファイル名>` で名前を挙げて選び（`git add -A` / `git add .` は使わない）、`.gitignore` や `.git/` の下（`.git/info/exclude` など）は触らない。';
const CALL = '工程の手順は、工程ごとのスキル（`fix-phase-0-intake` など、一覧の番号と対応）を Skill ツールで名前を指定して呼んで読む。';
// D1: the sentence that makes the core call the intake phase before touching anything (the Dev
// default's D1, EXP-26). The range limit and the routing decision live in F0.
const D1 = '差し戻しを受けたら、どのファイルも編集する前に、必ず受け付けの工程のスキル（`fix-phase-0-intake`）を呼び、指摘を全部開いて 1 件ずつ「直す / 退ける / 回す」を決めてから、直すと決めたものだけを直す。回すと決めた指摘に関わるファイルは触らない。';
const DESC = 'Use when a pull request was sent back with review findings, a CI check is red on a PR, or a small reproducible bug / lint / format fix is requested. The fix role\'s standard workflow: intake every finding, decide fix / reject / route, fix only what is in range, re-run the failing check, answer every finding, hand the PR back. Never approves or merges.';

export function build(d) {
  const files = {};
  const core = [
    fm('fix', DESC),
    '# fix — 指摘の解消\n',
    nav(`${STATE} ${CALL} ${D1}`),
    '\n## 受ける上限（1 つでも外れたら編集せず回す）\n',
    d.limit.replace(/^## 2\. 受ける上限[^\n]*\n/, ''),
    '\n## 工程をまたぐ原則\n',
    d.principles.replace(/^## 3\. 原則[^\n]*\n/, ''),
    `\n### 付表 3a. 宛先の表（回す先。核の既定、案件アダプタで上書き）\n`,
    d.routing.replace(/^### 付表 3a\.[^\n]*\n/, ''),
    '\n## 工程の一覧\n',
    d.phases30.replace(/^## 4\. 工程[^\n]*\n/, ''),
    '\n## 出る条件（全体）\n',
    d.exit.join('\n'),
    '',
  ].join('\n');
  files['skills/fix/SKILL.md'] = core;
  const common = (p) => fm(skillName(p), `fix の工程 ${p.k}（${p.name}）の手順。fix スキルの指示で呼ぶ。`, 'user-invocable: false\n');
  // F0 is new (design 30 §4 row); F1-F4 are 11 §4.7's steps, with the design-30 additions.
  const row30 = (k) => tableRows(d.phases30).find((r) => new RegExp(`^\\|\\s*\\*\\*${k}\\b|^\\|\\s*${k}\\b`).test(r)) ?? '';
  files[`skills/${skillName(PHASES[0])}/SKILL.md`] = `${common(PHASES[0])}### F0 受け付け\n\n**目的**: 差し戻しを拾い、HEAD を固定し、指摘を全部開いて、1 件ずつ 直す / 退ける / 回す を決める。回すものは編集しない。\n\n| # | 工程 | ひとことで | 11 §4.7 との関係 | B |\n|---|---|---|---|---|\n${row30('F0')}\n\n- **受ける上限**: 核の「受ける上限」の 4 条件（具体性・局所性・領域・種類）を指摘ごとに当てる。1 つでも外れたら「回す」（宛先は付表 3a）\n- **成果物**: 指摘ごとの仕分け表（id / 直す・退ける・回す / 理由 1 行）。\`.fix-state.md\` に書く\n- **典型的な失敗**: 指摘を読まずに直し始める / 方針の指摘を自分で直す / 2 周目の同じ指摘を 3 周目に進める\n`;
  for (const [i, p] of PHASES.slice(1).entries()) {
    const extra = { F1: d.unknown, F2: d.thinking, F3: d.depth, F4: d.conflict }[p.k] ?? [];
    const body = [`### ${p.k} ${p.name}`, `| # | 工程 | ひとことで | 11 §4.7 との関係 | B |\n|---|---|---|---|---|\n${row30(p.k)}`, `#### 手順（設計書 11 §4.7 の ${p.k}）\n\n${d.stepHeader.join('\n')}\n${d.byPhase[p.k].join('\n')}`, extra.length ? `#### 考え方\n\n${extra.join('\n')}` : ''].filter(Boolean).join('\n\n');
    files[`skills/${skillName(p)}/SKILL.md`] = common(p) + body + '\n';
    void i;
  }
  files['README.md'] = `# fix-skill-default — 既定の fix スキル（M-skill 型）\n\n設計書 \`docs/planning/30-fix-role-design.md\`（初版、オーナー承認 2026-11-06）と、それが再利用する Dev 設計書 \`11-dev-role-design.md\` §4.7「改修」を、Dev / QM の既定と同じ構造で Claude Code のスキルにしたもの。\n\n| パス | 中身 |\n|---|---|\n| \`skills/fix/SKILL.md\` | 核。受ける上限（4 条件）・原則 Z1〜Z9・宛先の表・工程の一覧 F0〜F4・出る条件。状態ファイル \`.fix-state.md\`。最初の編集の前に F0 を呼ぶ 1 文（Dev の D1 と同型） |\n| \`skills/fix-phase-<n>-<name>/SKILL.md\` | 工程 F0〜F4 の手順。F0 は設計書 30 の新設、F1〜F4 は 11 §4.7 の手順表 1〜12 を工程ごとに分けたもの。\`user-invocable: false\` |\n\n## 作り直し方\n\n\`\`\`\nnode experiments/fix/build-fix-skills.mjs            # skills/ を作り直す\nnode experiments/fix/build-fix-skills.mjs --check    # 設計書の全内容行がスキルに入っていることを確かめる\n\`\`\`\n`;
  return files;
}

export function missingLines(d, files) {
  const have = new Set(Object.values(files).join('\n').split('\n').map((l) => l.trim()));
  const want = [d.limit, d.principles, d.routing, d.phases30, ...d.stepHeader, ...Object.values(d.byPhase).flat(), ...d.thinking, ...d.depth, ...d.unknown, ...d.conflict, ...d.exit]
    .join('\n').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') || l.startsWith('- '));
  return want.filter((l) => !have.has(l));
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('build-fix-skills.mjs')) {
  const d = parse(readFileSync(SRC30, 'utf8'), readFileSync(SRC11, 'utf8'));
  const files = build(d);
  const miss = missingLines(d, files);
  if (check) {
    if (miss.length) { console.error(`missing ${miss.length} line(s):\n${miss.slice(0, 10).join('\n')}`); process.exit(1); }
    console.log('ok: every content line of design 30 (§2-§4) and 11 §4.7 is in a skill');
    process.exit(0);
  }
  if (miss.length) throw new Error(`build dropped ${miss.length} content line(s); first: ${miss[0]}`);
  rmSync(join(OUT, 'skills'), { recursive: true, force: true });
  for (const [rel, body] of Object.entries(files)) { mkdirSync(dirname(join(OUT, rel)), { recursive: true }); writeFileSync(join(OUT, rel), body); }
  writeFileSync(join(OUT, 'SOURCE.md'), `Generated by experiments/fix/build-fix-skills.mjs from ${SRC30} and ${SRC11} §4.7. Do not edit by hand.\n`);
  for (const rel of Object.keys(files)) console.log(rel, statSync(join(OUT, rel)).size, 'bytes');
}
