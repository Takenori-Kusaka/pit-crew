// Build structure arms from the Dev role design (docs/planning/11-dev-role-design.md).
// Every arm carries the same content (principles §3 and phases §4); only the structure
// and the split into files / skills differ. Arm-specific navigation text is wrapped in
// <!-- nav --> ... <!-- /nav --> and is the only text an arm may add.
//
//   F       one skill, every stage of every phase as one flat numbered list
//   H       core skill (principles + phase table) + one reference file per phase; the agent decides the phase
//   M       core skill (principles + phase table + entry/exit conditions) + reference files; the phase
//           comes from a state file and artifacts; re-read the phase file on entry and after compaction
//   Mall    M's core and navigation with the phase procedures inline: loaded at once, like F
//   Mskill  M, with each phase file as a skill the core calls by name (not auto-invoked)
//   S       core skill (principles + phase table) + one auto-invoked skill per phase
//
// Usage: node experiments/structure/build-arms.mjs [design.md] [outDir]   (default: subjects/dev-structure)
// Then: node experiments/structure/check-arms.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [src = 'docs/planning/11-dev-role-design.md', outRoot = 'subjects/dev-structure'] = process.argv.slice(2);

export function parse(text) {
  const t = text.replace(/\r\n/g, '\n');
  const sec = (start, end) => t.slice(t.indexOf(start), end ? t.indexOf(end) : undefined);
  // §2b (tracks) and §3 (cross-phase principles) are the content every arm keeps in its core.
  const principles = (sec('## 2b. ', '## 3. ').replace(/^## 2b\. .*\n/, '') + sec('## 3. ', '## 4. ').replace(/^## 3\. .*\n/, '')).trim();
  const phaseText = sec('### 4.0 ', '## 5. ');
  const phases = phaseText.split(/\n(?=### 4\.\d )/).map((block) => {
    const [head, ...rest] = block.trim().split('\n');
    const m = head.match(/^### 4\.(\d) (.+)$/);
    const body = rest.join('\n');
    const parts = body.split(/\n(?=#### )/);
    const purpose = parts[0].trim();
    const subs = parts.slice(1).map((p) => {
      const [h, ...b] = p.trim().split('\n');
      return { title: h.replace(/^#### /, ''), body: b.join('\n').trim() };
    });
    return { num: Number(m[1]), name: m[2], purpose, subs };
  });
  const list = sec('## 1. ', '## 2. ');
  const oneLiner = Object.fromEntries([...list.matchAll(/^\| (\d) \| ([^|]+) \| ([^|]*) \|$/gm)].map((r) => [Number(r[1]), r[3].trim()]));
  return { principles, phases, oneLiner };
}

const STEPS = (s) => s.title.startsWith('工程の内部の段階');
const ENTRY = (s) => s.title === '入る条件';
const EXIT = (s) => s.title === '出る条件';

// Split the steps subsection into intro text and stages (rows grouped by the bold stage cell).
// The stage label moves into a heading, so the first cell of each row is blanked.
export function stages(sub) {
  const lines = sub.body.split('\n');
  const tableStart = lines.findIndex((l) => l.startsWith('| 段 |'));
  const intro = lines.slice(0, tableStart).join('\n').trim();
  const header = lines.slice(tableStart, tableStart + 2);
  const out = [];
  const tableEnd = lines.findIndex((l, i) => i > tableStart && !l.startsWith('|'));
  const outro = tableEnd === -1 ? '' : lines.slice(tableEnd).join('\n').trim();
  for (const l of lines.slice(tableStart + 2, tableEnd === -1 ? undefined : tableEnd)) {
    if (!l.startsWith('|')) continue;
    const cells = l.split('|');
    const label = cells[1].trim().replace(/\*\*/g, '');
    if (label) out.push({ label, rows: [] });
    cells[1] = ' ';
    out[out.length - 1].rows.push(cells.join('|'));
  }
  return { intro, header, stages: out, outro };
}

const nav = (s) => `<!-- nav -->\n${s}\n<!-- /nav -->`;
const fm = (name, description, extra = '') => `---\nname: ${name}\ndescription: ${description}\n${extra}---\n\n`;
const slug = (p) => `${p.num}-${['intake', 'research', 'design', 'test-design', 'test-impl', 'impl', 'test-eval', 'rework', 'report'][p.num]}`;
const subText = (s) => `#### ${s.title}\n\n${s.body}`;
const phaseTable = (phases, oneLiner) => ['| # | 工程 | ひとことで |', '|---|---|---|', ...phases.map((p) => `| ${p.num} | ${p.name} | ${oneLiner[p.num]} |`)].join('\n');

function phaseFile(p, { omit = () => false } = {}) {
  return [`### ${p.num} ${p.name}`, p.purpose, ...p.subs.filter((s) => !omit(s)).map(subText)].join('\n\n') + '\n';
}

const F_NAV = 'Dev の作業は、下の工程を工程 1 から順に進める。どの工程も飛ばさない。';
const STATE_NAV = 'いまの工程は推測で決めない。リポジトリ直下の `.dev-state.md`（無ければ作る）に書いた工程と、成果物の有無（調査メモがあるか、失敗するテストがあるか、など）で決める。工程に入るときと、会話が圧縮された後には、その工程の手順を必ず読み直し、`.dev-state.md` に「いまの工程・読んだ手順・次に出る条件」を書く。各工程の入る条件と出る条件は、このファイルの下にある。';
const STATE_DECIDE = 'いまの工程は推測で決めない。リポジトリ直下の `.dev-state.md`（あれば）に書いた工程と、成果物の有無（調査メモがあるか、失敗するテストがあるか、など）で決める。';
const STATE_RECORD = '工程に入るときと、会話が圧縮された後には、その工程の手順を必ず読み直し、リポジトリ直下の `.dev-state.md`（無ければ作る）に「いまの工程・読んだ手順・次に出る条件」を書く。';
const STATE_WHERE = '各工程の入る条件と出る条件は、このファイルの下にある。';
// EXP-21: two runs tried to keep the state file out of commits by writing .git/info/exclude,
// which Claude Code refused, and ended without a commit. The default skill says how instead.
// EXP-26 delivery arms (see the arms section).
const D1_NAV = '受け付けの後、実装の前に、必ず調査の工程のスキル（`dev-phase-1-research`）を呼ぶ。';
const D2_NAV = '調査の後、実装の前に、必ず設計の工程のスキル（`dev-phase-2-design`）を呼び、判断の点があれば案を比べ、無ければ「自明」とその理由を 1 行書く。';
const KEY_RULES = ['| | 2 | 土台を確かめる |', '- **1 つ見つけたら、同じ型を探す。'];
const DESIGN_KEY = '| **S3 案を出す** |';
const STATE_GIT ='`.dev-state.md` は commit しない。git から外すなら `.gitignore` に書き、`.git/` の中には書かない。';
const entryExitOf = (phases) => '\n## 各工程の入る条件と出る条件\n\n' + phases.map((p) => [`### ${p.num} ${p.name}`, ...p.subs.filter((s) => ENTRY(s) || EXIT(s)).map(subText)].join('\n\n')).join('\n\n') + '\n';

const CORE_DESC = 'Use when the user wants something built, fixed or changed in the code, tests or build, or wants a returned review finding addressed. The developer\'s standard workflow from intake to report.';

export function build({ principles, phases, oneLiner }) {
  const arms = {};
  // F: one file, flat list of stages.
  {
    let n = 0;
    const items = [];
    for (const p of phases) {
      const steps = p.subs.find(STEPS);
      const st = stages(steps);
      items.push(`### 工程 ${++n}: ${p.name}（目的）\n\n${p.purpose}${st.intro ? `\n\n${st.intro}` : ''}`);
      for (const s of st.stages) items.push(`### 工程 ${++n}: ${p.name} — ${s.label}\n\n${st.header.join('\n')}\n${s.rows.join('\n')}`);
      if (st.outro) items.push(`### 工程 ${++n}: ${p.name}（段の後に）\n\n${st.outro}`);
      for (const s of p.subs.filter((s) => !STEPS(s))) items.push(`### 工程 ${++n}: ${p.name} — ${s.title}\n\n${s.body}`);
    }
    arms.F = { 'skills/dev/SKILL.md': fm('dev', CORE_DESC) + `# Dev\n\n${nav(F_NAV)}\n\n## 工程をまたぐ原則\n\n${principles}\n\n## 工程の一覧\n\n${phaseTable(phases, oneLiner)}\n\n## 工程\n\n${items.join('\n\n')}\n` };
  }
  // EXP-22: F with one of the four differences from Mall changed (each arm changes exactly one).
  //   Fa  + the state-file navigation (a)
  //   Fb  entry / exit conditions gathered after the phase table and taken out of the list (b)
  //   Fc  the stages grouped per phase instead of one running list of "工程 N" items (c)
  //   Fd  without F's sentence "工程 1 から順に進める。どの工程も飛ばさない" (d)
  {
    const flat = (omit = () => false) => {
      let n = 0;
      const items = [];
      for (const p of phases) {
        const st = stages(p.subs.find(STEPS));
        items.push(`### 工程 ${++n}: ${p.name}（目的）\n\n${p.purpose}${st.intro ? `\n\n${st.intro}` : ''}`);
        for (const s of st.stages) items.push(`### 工程 ${++n}: ${p.name} — ${s.label}\n\n${st.header.join('\n')}\n${s.rows.join('\n')}`);
        if (st.outro) items.push(`### 工程 ${++n}: ${p.name}（段の後に）\n\n${st.outro}`);
        for (const s of p.subs.filter((s) => !STEPS(s) && !omit(s))) items.push(`### 工程 ${++n}: ${p.name} — ${s.title}\n\n${s.body}`);
      }
      return items.join('\n\n');
    };
    const head = (navText) => fm('dev', CORE_DESC) + `# Dev\n\n${navText === null ? '' : `${nav(navText)}\n\n`}## 工程をまたぐ原則\n\n${principles}\n\n## 工程の一覧\n\n${phaseTable(phases, oneLiner)}\n`;
    arms.Fa = { 'skills/dev/SKILL.md': `${head(`${F_NAV} ${STATE_NAV}`)}\n## 工程\n\n${flat()}\n` };
    arms.Fb = { 'skills/dev/SKILL.md': `${head(F_NAV)}${entryExitOf(phases)}\n## 工程\n\n${flat((s) => ENTRY(s) || EXIT(s))}\n` };
    arms.Fc = { 'skills/dev/SKILL.md': `${head(F_NAV)}\n## 工程\n\n${phases.map((p) => phaseFile(p)).join('\n')}` };
    arms.Fd = { 'skills/dev/SKILL.md': `${head(null)}\n## 工程\n\n${flat()}\n` };
    // EXP-23: element a split in two. STATE_NAV = decide (a1) + record (a2) + where the
    // entry/exit conditions are. a1 only reads a state file if one exists (it says nothing
    // about creating or writing it); a2 only says to re-read and write, not how to decide.
    arms.Fa1 = { 'skills/dev/SKILL.md': `${head(`${F_NAV} ${STATE_DECIDE} ${STATE_WHERE}`)}\n## 工程\n\n${flat()}\n` };
    arms.Fa2 = { 'skills/dev/SKILL.md': `${head(`${F_NAV} ${STATE_RECORD} ${STATE_WHERE}`)}\n## 工程\n\n${flat()}\n` };
  }
  // H / M / Mskill / S share the phase files.
  const core = (navText, extra = '') => fm('dev', CORE_DESC) + `# Dev\n\n${nav(navText)}\n\n## 工程をまたぐ原則\n\n${principles}\n\n## 工程の一覧\n\n${phaseTable(phases, oneLiner)}\n${extra}`;
  const entryExit = entryExitOf(phases);
  arms.H = { 'skills/dev/SKILL.md': core('作業を始めるとき、いまどの工程にいるかを自分で判断し、その工程の手順を `phases/` の該当ファイル（例: `phases/1-research.md`）で読んでから進める。工程が変わったら、次の工程のファイルを読む。') };
  for (const p of phases) arms.H[`skills/dev/phases/${slug(p)}.md`] = phaseFile(p);
  const stateNav = STATE_NAV;
  arms.M = { 'skills/dev/SKILL.md': core(`${stateNav} 工程の手順は \`phases/\` の該当ファイル（例: \`phases/1-research.md\`）にある。`, entryExit) };
  for (const p of phases) arms.M[`skills/dev/phases/${slug(p)}.md`] = phaseFile(p, { omit: (s) => ENTRY(s) || EXIT(s) });
  // Mall: M's structure and navigation, but the phase procedures are in the core file, so
  // everything is loaded at once as in F (EXP-21: separates loading volume from structure).
  arms.Mall = { 'skills/dev/SKILL.md': core(`${stateNav} 工程の手順は、このファイルの下の「工程の手順」の該当節にある。`, `${entryExit}\n## 工程の手順\n\n${phases.map((p) => phaseFile(p, { omit: (s) => ENTRY(s) || EXIT(s) })).join('\n')}`) };
  arms.Mskill = { 'skills/dev/SKILL.md': core(`${stateNav} 工程の手順は、工程ごとのスキル（\`dev-phase-1-research\` など、一覧の番号と対応）を Skill ツールで名前を指定して呼んで読む。`, entryExit) };
  for (const p of phases) arms.Mskill[`skills/dev-phase-${slug(p)}/SKILL.md`] = fm(`dev-phase-${slug(p)}`, `Dev の工程 ${p.num}（${p.name}）の手順。dev スキルの指示で呼ぶ。`, 'user-invocable: false\n') + phaseFile(p, { omit: (s) => ENTRY(s) || EXIT(s) });
  // MskillG: the default skill (owner, 2026-11-02: M-skill is the default) = Mskill plus the
  // state-file git rule in the navigation. Also written to subjects/dev-skill-default.
  arms.MskillG = { 'skills/dev/SKILL.md': core(`${stateNav} ${STATE_GIT} 工程の手順は、工程ごとのスキル（\`dev-phase-1-research\` など、一覧の番号と対応）を Skill ツールで名前を指定して呼んで読む。`, entryExit) };
  for (const p of phases) arms.MskillG[`skills/dev-phase-${slug(p)}/SKILL.md`] = arms.Mskill[`skills/dev-phase-${slug(p)}/SKILL.md`];
  // EXP-26 (delivery of the investigation rules). In EXP-25 most runs called the intake skill
  // and went to the implementation without calling the investigation skill, so its rules never
  // reached them.
  //   MskillD1  MskillG + one navigation sentence: call the investigation skill before implementing
  //   MskillD2  MskillG with the key investigation rules moved from the investigation skill into
  //             the core (same lines, another place)
  const mgCore = `${stateNav} ${STATE_GIT} 工程の手順は、工程ごとのスキル（\`dev-phase-1-research\` など、一覧の番号と対応）を Skill ツールで名前を指定して呼んで読む。`;
  arms.MskillD1 = { 'skills/dev/SKILL.md': core(`${mgCore} ${D1_NAV}`, entryExit) };
  for (const p of phases) arms.MskillD1[`skills/dev-phase-${slug(p)}/SKILL.md`] = arms.MskillG[`skills/dev-phase-${slug(p)}/SKILL.md`];
  // EXP-39 (delivery of the design rule). EXP-32's exploratory E scoring found no "two or more
  // options compared" in any arm, the default included: the design phase is optional on T1 and the
  // core only mandates the investigation call. MskillD1N2 = MskillD1 + one more navigation
  // sentence: call the design skill after the investigation and before implementing.
  arms.MskillD1N2 = { ...arms.MskillD1, 'skills/dev/SKILL.md': core(`${mgCore} ${D1_NAV} ${D2_NAV}`, entryExit) };
  // EXP-40: the design skill was called in only 10/30 v6 trials, so the key design rule (step S3)
  // is moved from the design skill into the core, as MskillD2 did for the investigation rules.
  const design = phases.find((p) => p.num === 2);
  const designLines = phaseFile(design, { omit: (s) => ENTRY(s) || EXIT(s) }).split('\n');
  const s3 = designLines.filter((l) => l.startsWith(DESIGN_KEY));
  if (s3.length !== 1) throw new Error(`design key rule found ${s3.length}, expected 1`);
  const designHeader = designLines.find((l) => l.startsWith('| 段 | # |'));
  const designSection = `\n## 設計の規定のうち、実装の前に必ず守るもの\n\n${nav('次の規定は、設計の工程（dev-phase-2-design）の手順の一部で、ここに置いている。')}\n\n${designHeader}\n${designHeader.replace(/[^|]+/g, '---')}\n${s3[0]}\n`;
  arms.MskillD1K2 = { ...arms.MskillD1N2, 'skills/dev/SKILL.md': core(`${mgCore} ${D1_NAV} ${D2_NAV}`, entryExit + designSection) };
  arms.MskillD1K2[`skills/dev-phase-${slug(design)}/SKILL.md`] = arms.MskillD1N2[`skills/dev-phase-${slug(design)}/SKILL.md`].split('\n').filter((l) => !l.startsWith(DESIGN_KEY)).join('\n');
  const isKey = (l) => KEY_RULES.some((k) => l.startsWith(k));
  const research = phases.find((p) => p.num === 1);
  const keyLines = phaseFile(research, { omit: (s) => ENTRY(s) || EXIT(s) }).split('\n').filter(isKey);
  if (keyLines.length !== KEY_RULES.length) throw new Error(`key rules found ${keyLines.length}, expected ${KEY_RULES.length}`);
  const STEP_HEADER = '| 段 | # | 手順 | 要点 | 軌道 | 出典 |\n|---|---|---|---|---|---|';
  const keyRows = keyLines.filter((l) => l.startsWith('|')), keyBullets = keyLines.filter((l) => !l.startsWith('|'));
  const keySection = `\n## 調査の規定のうち、実装の前に必ず守るもの\n\n${nav('次の規定は、調査の工程（dev-phase-1-research）の手順の一部で、ここに置いている。')}\n\n${STEP_HEADER}\n${keyRows.join('\n')}\n\n${keyBullets.join('\n')}\n`;
  arms.MskillD2 = { 'skills/dev/SKILL.md': core(mgCore, entryExit + keySection) };
  for (const p of phases) {
    const body = arms.MskillG[`skills/dev-phase-${slug(p)}/SKILL.md`];
    arms.MskillD2[`skills/dev-phase-${slug(p)}/SKILL.md`] = p.num === 1 ? body.split('\n').filter((l) => !isKey(l)).join('\n') : body;
  }
  arms.S = { 'skills/dev/SKILL.md': core('工程ごとの手順は、それぞれの工程のスキルにある。') };
  for (const p of phases) arms.S[`skills/dev-phase-${slug(p)}/SKILL.md`] = fm(`dev-phase-${slug(p)}`, `Dev の工程「${p.name}」: ${oneLiner[p.num]}`) + phaseFile(p);
  return arms;
}

if (process.argv[1]?.endsWith('build-arms.mjs')) {
  const arms = build(parse(readFileSync(src, 'utf8')));
  for (const [arm, files] of Object.entries(arms)) {
    const dir = join(outRoot, arm);
    rmSync(dir, { recursive: true, force: true });
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), body);
    }
    writeFileSync(join(dir, 'SOURCE.md'), `Generated by experiments/structure/build-arms.mjs from ${src}. Do not edit by hand.\n`);
    console.log(arm, Object.keys(files).length, 'files');
  }
  // The default Dev skill, shipped outside the experiment arms: the MskillD1 arm (owner,
  // 2026-11-03, docs/planning/20-status-summary-rule-delivery.md §7). MskillG stays as an arm.
  const def = 'subjects/dev-skill-default';
  rmSync(join(def, 'skills'), { recursive: true, force: true });
  for (const [rel, body] of Object.entries(arms.MskillD1)) {
    mkdirSync(dirname(join(def, rel)), { recursive: true });
    writeFileSync(join(def, rel), body);
  }
  console.log('default skill ->', def);
}
