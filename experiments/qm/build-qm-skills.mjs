// Build the default QM skills (subjects/qm-skill-default) from the QM role design
// (docs/planning/26-qm-role-design.md), in the structure the Dev default uses (M-skill type,
// EXP-20〜27, owner 2026-11-02 / 11-03): a core skill with the shared principles, the phase table
// and every phase's entry / exit conditions, a state file to decide the phase, and one skill per
// phase that the core calls by name. Two cores (qm-review / qm-ship) share the same principles
// text (design 26 §2b + §3 + 付表 3a); the ship stages are short and stay inline in qm-ship.
//
// Usage: node experiments/qm/build-qm-skills.mjs [design.md] [outDir] [--check]
//   --check  verify every content line of design 26 §2b / §3 / §4 is in some skill file (and
//            print nothing else). Exit 1 on a missing line.
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const [src = 'docs/planning/26-qm-role-design.md', outRoot = 'subjects/qm-skill-default'] = args.filter((a) => !a.startsWith('--'));

export function parse(text) {
  const t = text.replace(/\r\n/g, '\n');
  const sec = (start, end) => { const i = t.indexOf(start); if (i < 0) throw new Error(`missing ${start}`); return t.slice(i, end ? t.indexOf(end, i) : undefined); };
  const strip = (s, re) => s.replace(re, '').trim();
  const depth = strip(sec('## 2b. ', '## 3. '), /^## 2b\. .*\n/);
  const principles = strip(sec('## 3. ', '## 4. '), /^## 3\. .*\n/);
  const reviewTable = sec('### 1.1 ', '### 1.2 ').split('\n').filter((l) => l.startsWith('|')).join('\n');
  const shipTable = sec('### 1.2 ', '\nV0 / S0 と').split('\n').filter((l) => l.startsWith('|')).join('\n');
  const phaseText = sec('### 4.V0 ', '### 4.S0');
  const phases = phaseText.split(/\n(?=### 4\.V\d )/).map((block) => {
    const lines = block.trim().split('\n');
    const m = lines[0].match(/^### 4\.V(\d) ([^（]+)/);
    const body = lines.slice(1).join('\n').trim();
    // purpose paragraph, the step table, then the bullets
    const paras = body.split(/\n\n+/);
    const purpose = paras[0];
    const table = paras.find((p) => p.startsWith('|')) ?? '';
    const bullets = paras.filter((p) => p.startsWith('- ')).flatMap((p) => p.split('\n'));
    const isEntryExit = (b) => /^- \*\*(入る条件|出る条件)/.test(b);
    return { num: Number(m[1]), name: m[2].trim(), purpose, table, entryExit: bullets.filter(isEntryExit), rest: bullets.filter((b) => !isEntryExit(b)) };
  });
  const ship = sec('### 4.S0', '## 5. ').split('\n').slice(1).join('\n').trim();
  return { depth, principles, reviewTable, shipTable, phases, ship };
}

const nav = (s) => `<!-- nav -->\n${s}\n<!-- /nav -->`;
const fm = (name, description, extra = '') => `---\nname: ${name}\ndescription: ${description}\n${extra}---\n\n`;
const SLUG = ['intake', 'base', 'context', 'diff', 'evidence', 'verdict', 'return'];
const slug = (p) => `${p.num}-${SLUG[p.num]}`;
const skillName = (p) => `qm-review-phase-${slug(p)}`;

const STATE = 'いまの工程は推測で決めない。リポジトリ直下の `.qm-state.md`（無ければ作る）に書いた工程と、成果物の有無（開いた文書の一覧があるか、context ごとの検査の表があるか、など）で決める。工程に入るときと、会話が圧縮された後には、その工程の手順を必ず読み直し、`.qm-state.md` に「いまの工程・読んだ手順・次に出る条件」を書く。各工程の入る条件と出る条件は、このファイルの下にある。`.qm-state.md` は commit しない。git から外すなら `.gitignore` に書き、`.git/` の中には書かない。';
const CALL = '工程の手順は、工程ごとのスキル（`qm-review-phase-2-context` など、一覧の番号と対応）を Skill ツールで名前を指定して呼んで読む。';
// The delivery sentence (D1 of the Dev default, EXP-26): the rules that answer the two company
// failures live in V2 (read the context) and V5 (verdict, Y3). Make the core call V2 before any
// judgement.
const D1 = '受け付けの後、判定（approve / request-changes / label / merge）の前に、必ず文脈の工程のスキル（`qm-review-phase-2-context`）を呼び、変更パスから引いた設計書と受入基準を開いてから差分を読む。レビュー対象のファイルは編集しない。';
const SHIP_NAV = 'いまの工程は推測で決めない。リポジトリ直下の `.qm-state.md`（無ければ作る）に書いた工程と、成果物の有無（範囲の一覧があるか、突合表があるか、保証の開示があるか）で決める。工程に入るときと、会話が圧縮された後には、その工程の手順（このファイルの下）を読み直し、`.qm-state.md` に「いまの工程・次に出る条件」を書く。`.qm-state.md` は commit しない。判定（merge / release の label / deploy）の前に、必ず含まれる変更ごとの判定記録と、必須の検査の context ごとの結果を開く。';

const REVIEW_DESC = 'Use when asked to review a pull request or change, to re-review after a fix, or to answer a question sent to QM. The independent reviewer\'s standard workflow from intake to verdict; does not write fixes.';
const SHIP_DESC = 'Use when asked to judge whether a release / integration (a set of changes) may ship or be merged, to cut a release, or to triage an integration failure. The ship-verdict workflow; stops only on unmet criteria or missing records.';

export function build(d) {
  const files = {};
  const principles = `## 工程をまたぐ原則\n\n### 深さ\n\n${d.depth}\n\n### 原則\n\n${d.principles}`;
  const entryExit = `\n## 各工程の入る条件と出る条件\n\n${d.phases.map((p) => `### V${p.num} ${p.name}\n\n${p.entryExit.join('\n')}`).join('\n\n')}\n`;
  files['skills/qm-review/SKILL.md'] = fm('qm-review', REVIEW_DESC) + `# QM — 変更の独立レビュー\n\n${nav(`${STATE} ${CALL} ${D1}`)}\n\n${principles}\n\n## 工程の一覧\n\n${d.reviewTable}\n${entryExit}`;
  for (const p of d.phases) {
    const body = [`### V${p.num} ${p.name}`, p.purpose, p.table, p.rest.join('\n')].filter(Boolean).join('\n\n');
    files[`skills/${skillName(p)}/SKILL.md`] = fm(skillName(p), `QM の変更レビューの工程 V${p.num}（${p.name}）の手順。qm-review スキルの指示で呼ぶ。`, 'user-invocable: false\n') + body + '\n';
  }
  files['skills/qm-ship/SKILL.md'] = fm('qm-ship', SHIP_DESC) + `# QM — 出荷判定\n\n${nav(SHIP_NAV)}\n\n${principles}\n\n## 工程の一覧\n\n${d.shipTable}\n\n## 工程の手順\n\n${d.ship}\n`;
  return files;
}

// Every content line (table rows and bullets) of the design's §2b / §3 / §4 must be in some
// skill file; the skills add only the navigation.
export function missingLines(d, files) {
  const all = Object.values(files).join('\n').split('\n').map((l) => l.trim());
  const have = new Set(all);
  const want = [d.depth, d.principles, d.reviewTable, d.shipTable, d.ship, ...d.phases.flatMap((p) => [p.purpose, p.table, ...p.entryExit, ...p.rest])]
    .join('\n').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') || l.startsWith('- ') || l.startsWith('**'));
  return want.filter((l) => !have.has(l));
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('build-qm-skills.mjs')) {
  const d = parse(readFileSync(src, 'utf8'));
  const files = build(d);
  const miss = missingLines(d, files);
  if (check) {
    if (miss.length) { console.error(`missing ${miss.length} line(s):\n${miss.slice(0, 10).join('\n')}`); process.exit(1); }
    console.log('ok: every content line of the design is in a skill');
    process.exit(0);
  }
  if (miss.length) throw new Error(`build dropped ${miss.length} content line(s); first: ${miss[0]}`);
  rmSync(join(outRoot, 'skills'), { recursive: true, force: true });
  for (const [rel, body] of Object.entries(files)) { mkdirSync(dirname(join(outRoot, rel)), { recursive: true }); writeFileSync(join(outRoot, rel), body); }
  writeFileSync(join(outRoot, 'SOURCE.md'), `Generated by experiments/qm/build-qm-skills.mjs from ${src}. Do not edit by hand.\n`);
  for (const rel of Object.keys(files)) console.log(rel, statSync(join(outRoot, rel)).size, 'bytes');
}
