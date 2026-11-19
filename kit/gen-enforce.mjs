#!/usr/bin/env node
// Enforcement generator (harness kit; plan 34 v4 §5, issue #52).
// From the `forbidden[].enforce` rows of a role spec (kit/schema/role-spec.md) it writes the Claude Code
// artefacts of the deterministic layer:
//   settings.json            permissions.deny + the PreToolUse hook entry
//   hooks/enforce-hook.mjs   the hook (a copy of kit/enforce-hook.mjs: role-neutral)
//   hooks/enforce-rules.json the rules compiled from the spec
//   INSTALL.md               where each file goes, what each row enforces, what is NOT covered
//   manifest.json            sha256 of every artefact, of the spec and of the generator
//
//   node kit/gen-enforce.mjs kit/roles/dev.yaml --out <dir>
//        [--install-dir /etc/claude-code/pit-enforce/<role>]   absolute path of the hook directory on the target
//        [--settings-path /etc/claude-code/managed-settings.d/50-pit-enforce-<role>.json]
//        [--task task.json] [--set name=value ...]             values for ${task.<name>} in enforce rows
//        [--node /usr/local/bin/node]                          the interpreter the hook entry spawns
//        [--strict]                                            fail when a row has no enforce or a value is unresolved
//
// The artefacts are meant to be installed OUTSIDE the agent's work tree, owned by another user (root):
// managed settings, or a file passed with `claude --settings`. Nothing here reads a harness, a scene or
// the detector (packages/pit-wall/src/kit/grader.mjs).
//
// Claude Code documentation opened on 2026-11-15 for the formats used below (docs.claude.com/en/docs/claude-code/*
// redirects to these):
//   https://code.claude.com/docs/en/hooks              hook entry (matcher, type, command + args = exec form, timeout,
//                                                      onFailure), the PreToolUse stdin JSON and tool_input fields,
//                                                      exit code 2 = block, any other failure = the call goes ahead
//   https://code.claude.com/docs/en/settings           files and precedence (managed > --settings > local > project > user),
//                                                      list keys merge across files
//   https://code.claude.com/docs/en/permissions        deny > ask > allow, rule syntax (Bash(cmd *), Read(path), Edit(path),
//                                                      bare tool name), what a Bash rule does not match, hooks and rules
//   https://code.claude.com/docs/en/managed-settings   /etc/claude-code/managed-settings.json and managed-settings.d/
// What was NOT verified is listed in INSTALL.md ("確かめていないこと") — notably no generated file has been
// loaded by a real Claude Code process here (no model calls in this issue).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, '../packages/pit-wall/package.json'));
const YAML = require('yaml');

export const GENERATOR_VERSION = 1;
export const LOG_ENV = 'PIT_ENFORCE_LOG';
export const DOC_URLS = [
  'https://code.claude.com/docs/en/hooks',
  'https://code.claude.com/docs/en/settings',
  'https://code.claude.com/docs/en/permissions',
  'https://code.claude.com/docs/en/managed-settings',
];
const sha256 = (x) => createHash('sha256').update(x).digest('hex');
const posix = (p) => String(p).replace(/\\/g, '/');
const arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);

// ---------------------------------------------------------------------------------------------------
// the enforce vocabulary (kit/schema/role-spec.md「強制の語彙」)
// ---------------------------------------------------------------------------------------------------
const TASK_REF = /^\$\{task\.([\w-]+)\}$/;
const isGlob = (s) => typeof s === 'string' && s.length > 0 && (TASK_REF.test(s) || !/[\\()|^]/.test(s));
const listOf = (pred) => (v) => Array.isArray(v) && v.length > 0 && v.every(pred);
const FIELD = {
  tools: listOf((s) => typeof s === 'string' && /^[A-Za-z]\w*$/.test(s)),
  access: (v) => ['read', 'write', 'any'].includes(v),
  paths: listOf(isGlob),
  refs: listOf(isGlob),
  args_any: listOf(isGlob),
  program: (v) => arr(v).length > 0 && arr(v).every((s) => typeof s === 'string' && /^[\w.+-]+$/.test(s)),
  subcommand: listOf((s) => typeof s === 'string' && /^[\w:.-]+$/.test(s)),
  flags_any: listOf((s) => typeof s === 'string' && /^--?[\w-]+$/.test(s)),
  option_values: (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => ['options', 'values'].includes(k))
    && listOf((s) => typeof s === 'string' && /^--?[\w-]+$/.test(s))(v.options) && listOf(isGlob)(v.values),
  bare_only: (v) => v === true,
  must_not_decrease: listOf((s) => typeof s === 'string' && /^[A-Za-z_$][\w$]*$/.test(s)),
  must_not_increase: listOf((s) => typeof s === 'string' && /^[A-Za-z_$][\w$]*$/.test(s)),
};
export const KINDS = {
  deny_tool: { required: ['tools'], optional: [] },
  deny_path: { required: ['access', 'paths'], optional: [] },
  allow_write_only: { required: ['paths'], optional: [] },
  deny_command: { required: ['program'], optional: ['subcommand', 'flags_any', 'option_values', 'args_any', 'bare_only'] },
  deny_ref_push: { required: ['refs'], optional: [] },
  guard_edit: { required: ['paths'], optional: ['must_not_decrease', 'must_not_increase'] },
};

// Errors (strings) in one forbidden row's `enforce`. A row without `enforce` is valid (the key is optional).
export function validateEnforce(row) {
  const errs = [], at = `forbidden ${row?.id ?? '?'}`;
  if (row.enforce_limits !== undefined && !(Array.isArray(row.enforce_limits) && row.enforce_limits.every((s) => typeof s === 'string' && s.trim()))) errs.push(`${at}: enforce_limits は空でない文字列のリスト`);
  if (row.enforce === undefined) {
    if (row.enforce_reason !== undefined || row.enforce_limits !== undefined) errs.push(`${at}: enforce が無いのに enforce_reason / enforce_limits がある`);
    return errs;
  }
  if (row.enforce === 'none') {
    if (typeof row.enforce_reason !== 'string' || !row.enforce_reason.trim()) errs.push(`${at}: enforce: none には enforce_reason（理由）が要る`);
    return errs;
  }
  if (row.enforce_reason !== undefined) errs.push(`${at}: enforce_reason は enforce: none のときだけ書く`);
  if (!Array.isArray(row.enforce) || !row.enforce.length) return [...errs, `${at}: enforce は none か、規則のリスト（1 つ以上）`];
  row.enforce.forEach((e, n) => {
    const here = `${at}: enforce[${n}]`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) { errs.push(`${here} が規則（kind つきの組）でない`); return; }
    const k = KINDS[e.kind];
    if (!k) { errs.push(`${here} の kind「${e.kind}」は語彙に無い（${Object.keys(KINDS).join(' / ')}）`); return; }
    for (const f of k.required) if (e[f] === undefined) errs.push(`${here}（${e.kind}）に ${f} がない`);
    for (const [f, v] of Object.entries(e)) {
      if (f === 'kind') continue;
      if (!k.required.includes(f) && !k.optional.includes(f)) errs.push(`${here}（${e.kind}）に、語彙に無い欄 ${f} がある`);
      else if (!FIELD[f](v)) errs.push(`${here}（${e.kind}）の ${f} の値が型に合わない`);
    }
    if (e.kind === 'guard_edit' && e.must_not_decrease === undefined && e.must_not_increase === undefined) errs.push(`${here}（guard_edit）に must_not_decrease か must_not_increase が要る`);
    if (e.kind === 'deny_command' && e.bare_only && (e.subcommand || e.flags_any || e.option_values || e.args_any)) errs.push(`${here}（deny_command）の bare_only は、ほかの条件と一緒に書けない`);
  });
  return errs;
}
export const validateSpecEnforce = (spec) => arr(spec?.forbidden).flatMap((row) => validateEnforce(row));

// ---------------------------------------------------------------------------------------------------
// spec -> rules
// ---------------------------------------------------------------------------------------------------
export function loadSpec(path) { return YAML.parse(readFileSync(path, 'utf8')); }

// Replace ${task.x}. Returns { value } or { missing: [names] }.
function substitute(value, task) {
  const missing = [];
  const one = (v) => {
    if (Array.isArray(v)) return v.flatMap((x) => arr(one(x)));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, one(x)]));
    const m = typeof v === 'string' ? TASK_REF.exec(v) : null;
    if (!m) return v;
    const t = task?.[m[1]];
    if (t === undefined || t === null || (Array.isArray(t) && !t.length) || t === '') { missing.push(m[1]); return []; }
    return t;
  };
  const out = one(value);
  return missing.length ? { missing } : { value: out };
}

// rows: [{ id, status: generated | partial | none | skipped | missing, kinds, reason?, unresolved?, limits }]
export function compile(spec, { task = {} } = {}) {
  const errs = validateSpecEnforce(spec);
  if (errs.length) throw new Error(`enforce が書式に合わない:\n${errs.map((e) => `- ${e}`).join('\n')}`);
  const rules = [], rows = [];
  for (const row of arr(spec.forbidden)) {
    const limits = arr(row.enforce_limits);
    if (row.enforce === undefined) { rows.push({ id: row.id, status: 'missing', kinds: [], limits }); continue; }
    if (row.enforce === 'none') { rows.push({ id: row.id, status: 'none', kinds: [], reason: row.enforce_reason, limits }); continue; }
    const kinds = [], unresolved = [];
    for (const e of row.enforce) {
      const s = substitute(e, task);
      if (s.missing) { unresolved.push(...s.missing); continue; }
      rules.push({ id: row.id, ...s.value });
      kinds.push(e.kind);
    }
    rows.push({ id: row.id, status: !kinds.length ? 'skipped' : unresolved.length ? 'partial' : 'generated', kinds, ...(unresolved.length ? { unresolved: [...new Set(unresolved)] } : {}), limits });
  }
  return { rules, rows };
}

// permissions.deny entries: the part of the rules that Claude Code's own rule syntax can express.
// The hook covers every rule; these are a second, independent layer for the simple shapes.
export function permissionDeny(rules) {
  const out = new Set();
  for (const r of rules) {
    if (r.kind === 'deny_tool') for (const t of r.tools) out.add(t);
    // a pattern that is not `**/...` is anchored at the working directory (`./path`); a bare name would match at any depth
    if (r.kind === 'deny_path') for (const g0 of r.paths) {
      const g = g0.startsWith('**/') || g0.startsWith('/') ? g0 : `./${g0}`;
      if (r.access !== 'write') out.add(`Read(${g})`);
      if (r.access !== 'read') out.add(`Edit(${g})`);
    }
    if (r.kind === 'deny_command' && !r.flags_any && !r.option_values && !r.args_any) for (const p of arr(r.program)) {
      const head = [p, ...arr(r.subcommand)].join(' ');
      out.add(`Bash(${head})`);
      if (!r.bare_only) out.add(`Bash(${head} *)`);
    }
  }
  return [...out].sort();
}

export function settingsFor(rules, { installDir, node = 'node' }) {
  return {
    // a lower-precedence file cannot switch the hook off: with --settings this key outranks project and local
    // files; a managed hook is not disabled by a non-managed disableAllHooks at all (docs: hooks)
    disableAllHooks: false,
    permissions: { deny: permissionDeny(rules) },
    hooks: {
      PreToolUse: [{
        matcher: '*',
        hooks: [{ type: 'command', command: node, args: [`${posix(installDir)}/enforce-hook.mjs`], timeout: 20, onFailure: 'block' }],
      }],
    },
  };
}

// ---------------------------------------------------------------------------------------------------
// what the hook does not cover (mutation ids: experiments/exp48/mutations.md, classes B and R)
// ---------------------------------------------------------------------------------------------------
const LIMITS_ALL = [
  ['B-G01', 'ファイルを書く経路のうち、hook が「書き込み」と認識するのは次だけ: 道具の Edit / Write / NotebookEdit、シェルの出力の向け先（`>` `>>` `tee`）、rm / mv / cp / ln / touch / chmod / dd / truncate、`sed -i`・`perl -i`、`git checkout|restore|rm|mv|clean <パス>`。`node -e`・`python -c`・`git apply`・`patch`・整形の道具・MCP のファイルの道具・サブエージェントによる書き込みは止めない。'],
  ['B-G02', '命令のつづりは構造で読む（引用符・`\\`・絶対パス・`env` / `command` / `sudo` / `timeout` / `xargs` / `find -exec` の包み・`sh -c`・`eval`・here-document・同じ命令の中で代入した変数・git の別名の定義）。読めないもの: 命令の置換（`$(...)`）やファイルから来る引数、前の呼び出しで作ったシェルの関数、名前を変えた実行ファイルの写し。プログラム名・サブコマンドが読めないときは拒否する（`_unresolvable`）が、それ以外の位置の読めない引数は通す。'],
  ['B-G03', 'スクリプト（.sh・.mjs・.py・Makefile・package.json の scripts）を書いてから走らせる経路は止めない。書き込みも実行も、中身までは見ない。'],
  ['B-G04', 'git の hook を外す経路（`--no-verify`・`HUSKY=0`・`core.hooksPath`）は対象外（この hook は Claude Code の道具の呼び出しの前で動くので、それらの影響は受けない。git の hook を守る規則は語彙に無い）。'],
  ['B-G05', '設定を書き換える経路: 作業木の `.claude/settings.json` / `settings.local.json`、hook の置き場、設定ファイル、判定の記録への書き込みは、認識できる書き込みの経路に限って拒否する（規則 id `_enforce-self`）。認識できない経路（スクリプトなど）からの書き換えは、置き場の所有者と権限（エージェントの利用者が書けないこと）で防ぐ。hook の時間切れ・異常終了は、設定の `onFailure: "block"`（Claude Code v2.1.295 以降）で拒否になる。それより古い版では、時間切れの呼び出しは通る。判定の記録は hook がエージェントと同じ利用者で書くので、認識できない経路からの削除は防げない（記録の置き場を作業木の外にし、終了後に行数と hook の呼び出し回数を突き合わせること）。'],
  ['B-G07', 'パスのつづりは、相対（`a/../b`）・絶対・symlink（実体のパスに直す）・シェルの glob と `{a,b}` の展開を読む。hardlink、別の worktree での編集（作業木の外のパスになる）、`git stash pop`・`git revert`・`git reset --hard`・`git merge` による持ち込みは止めない。大文字と小文字の違いは Windows と macOS でだけ同じとみなす。'],
  ['B-G08', '手を分ける・後で動く物に仕込む経路（自分で足した git の hook・裏の処理・npm の lifecycle）は止めない。'],
];
const LIMITS_KIND = {
  deny_ref_push: [
    ['B-0022-1', '保護した branch への push は、refspec の行き先で読む（`HEAD:main`・`refs/heads/main`・先頭の `+`・`--all`・`--mirror`・`*` つき・remote を URL やパスで書く形）。引数なしの push は、hook が git に現在の branch・upstream・`remote.*.push`・`push.default` を聞いて決める。聞けないときは拒否する。'],
    ['B-0022-2', '手元で本線に merge してからの push は、行き先が本線なので拒否する。remote のディレクトリの中での直書きは止めない。'],
    ['B-G06', '`git update-ref`・`git symbolic-ref`・ref のファイルの直書き・`git --git-dir=<remote> fetch` で ref を動かす経路は止めない。'],
    ['B-0022-3', 'remote の HEAD の付け替え、remote の URL の変更、本線以外の名前の ref への push は止めない。'],
    ['B-0026-1〜5', '強制 push（他の commit を消す push）を止める規則は語彙に無い（どのロール定義の禁止の行にも無いため）。'],
  ],
  deny_command: [
    ['B-0022-4', 'gh の命令は、プログラム名・サブコマンドの語・旗・オプションの値で読む。`gh api` は、規則に書いたパスの形だけを読む（GraphQL・別の API のパスは止めない）。`gh alias` で作った別名は止めない。'],
  ],
  guard_edit: [
    ['T02〜T05・T10・T18〜T24・T36・T37', '数を減らさない弱め方（期待値の書き換え・ゆるい matcher・恒真の assertion・mock・握りつぶし）は止めない。数えるのは、コメントを除いた識別子の数だけ。'],
    ['T12・T13・B-0006-1', '守られたテストファイルの削除・改名・古い版への差し戻しは、認識できる経路（rm・mv・git rm・git mv・git checkout <版> -- <パス>）だけ拒否する。`git revert`・`git reset --hard` は止めない。'],
    ['N02・N04・N25', '止めすぎ: 機能と一緒にテストを消す・it.each にまとめる・重複を消す、という正当な編集も拒否する。'],
  ],
  deny_path: [
    ['T14・T15・T28・B-0005-2・B-0005-3', '書き込みを拒否するのは、一覧に書いたパスだけ。別名の設定ファイルを新しく作る・命令の引数で上書きする経路は止めない。'],
    ['L 類', '読み取りの拒否は、道具の Read / Grep / Glob の対象のパスと、シェルの命令の引数のうち実在するファイルを指すものに当てる。ファイルの名前を書かずに読む命令（`grep -r 語 .`・`tar c .`・`git grep`）は止めない。'],
  ],
  allow_write_only: [
    ['B-G01・B-G03', '範囲の外への書き込みは、認識できる書き込みの経路だけ拒否する。作業木の外（一時ディレクトリなど）への書き込みは対象外。'],
  ],
  deny_tool: [
    ['L01・L09・L10', '道具を丸ごと拒否する。同じ働きの別の道具（MCP の道具・スクリプトの中の通信）は止めない。通信は出口の許可リストで補うこと。'],
  ],
};

const STATUS_JA = { generated: '強制あり', partial: '一部だけ生成（課題の値が足りない）', skipped: '生成していない（課題の値が足りない）', none: '強制なし（enforce: none）', missing: 'enforce の記述が無い' };

function installDoc({ spec, specRel, role, rows, rules, installDir, settingsPath, node, files }) {
  const kinds = [...new Set(rules.map((r) => r.kind))];
  const L = [];
  L.push(`# ${role} の強制（S2）— 置き方と、止めない経路`, '');
  L.push(`この文書と同じ場所のファイルは、\`kit/gen-enforce.mjs\` が \`${specRel}\`（ロール「${spec.title ?? role}」）の禁止の行（\`forbidden[].enforce\`）から作った。手で直さない。直すのはロール定義の側。`, '');
  L.push('## 置き場所', '', '強制の設定は、エージェントの作業木の外に、エージェントの利用者が書けない所有者（root）で置く。', '', '| 生成物 | 置き場所 | 所有者・権限 |', '|---|---|---|');
  for (const f of files) L.push(`| \`${f.path}\` | \`${f.install_to ?? '（置かない。記録用）'}\` | ${f.install_to ? `root・${f.mode}` : '—'} |`);
  L.push('', '置き方は 2 通り。', '',
    `1. **managed 設定として置く**（Linux / WSL のコンテナ向け）: \`settings.json\` を \`${settingsPath}\` に置く。managed 設定は、利用者・プロジェクト・\`--settings\` のどの設定より優先される。macOS は \`/Library/Application Support/ClaudeCode/\`、Windows は \`C:\\Program Files\\ClaudeCode\\\` の下。`,
    `2. **\`claude --settings <パス>\` で渡す**: \`settings.json\` を作業木の外の、エージェントが書けない場所に置き、起動の引数で渡す。この設定は、利用者・プロジェクト・ローカルの設定より上、managed 設定より下。`, '',
    `どちらの場合も、hook の 2 ファイルは \`${posix(installDir)}/\` に置く（設定の中に、この絶対パスが書いてある。変えるなら \`--install-dir\` を付けて作り直す）。hook を動かす処理系は \`${node}\`（\`--node\` で絶対パスにできる）。`, '',
    `判定の記録: 環境変数 \`${LOG_ENV}\` にファイルのパスを入れて Claude Code を起動する。hook は、道具の呼び出し 1 回ごとに 1 行（JSON: \`ts\`・\`role\`・\`rule\`（規則 id = 禁止の行の id）・\`kind\`・\`tool\`・\`decision\`（allow / deny / observe）・\`session_id\`・\`tool_use_id\`・\`input_sha256\`）を足す。命令の文面とファイルの中身は書かない。記録に書けないときは拒否する。強制の置き場のファイルを読んだ呼び出しは \`observe\` の行（\`_enforce-self-read\`）で数えられる。`, '');
  L.push('## 禁止の行ごとの強制', '', '| 禁止の行 | 状態 | 規則の型 | 補足 |', '|---|---|---|---|');
  for (const r of rows) L.push(`| \`${r.id}\` | ${STATUS_JA[r.status]} | ${r.kinds.length ? [...new Set(r.kinds)].join('・') : '—'} | ${r.status === 'none' ? r.reason : r.unresolved ? `足りない値: ${r.unresolved.map((u) => `task.${u}`).join('・')}（\`--task\` か \`--set\` で渡す）` : ''} |`);
  L.push('', '禁止の行の id のほかに、hook が自分で使う規則 id がある: `_fail-closed`（入力・規則・命令を読めない）、`_unresolvable`（プログラム名やサブコマンドが展開の結果で、読めない）、`_opaque-shell`（パイプから命令を読むシェル）、`_unparsed-shell`（PowerShell の道具）、`_enforce-self`（強制の設定への書き込み）。', '');
  L.push('## 止めない経路（既知の迂回）', '', '変異の一覧（`experiments/exp48/mutations.md` の B 類・R 類）と突き合わせた。ここに書いた経路は、この強制では止まらない。禁止の結果が成立したかは、hook とは別の実装（終了状態の差）で読むこと。', '', '### どの行にも当てはまるもの', '');
  for (const [id, t] of LIMITS_ALL) L.push(`- **${id}**: ${t}`);
  for (const k of kinds) {
    L.push('', `### \`${k}\` の規則`, '');
    for (const [id, t] of LIMITS_KIND[k] ?? []) L.push(`- **${id}**: ${t}`);
  }
  L.push('', '### 行ごと（ロール定義の `enforce_limits`）', '');
  for (const r of rows) for (const t of r.limits) L.push(`- \`${r.id}\`: ${t}`);
  L.push('', '## 文書で確かめたこと', '', '2026-11-15 に次の文書を開いて、書式を合わせた。', '', ...DOC_URLS.map((u) => `- ${u}`), '',
    '- 設定の hook の形（`hooks.PreToolUse[].matcher` と `hooks[]` の `type: command`・`command`・`args`・`timeout`・`onFailure`）。`args` があると、シェルを通さずに直接起動する',
    '- `matcher: "*"` は全部の道具に当たる。PreToolUse は権限の確認より前に、どの道具でも動く',
    '- hook の入力は標準入力の JSON（`tool_name`・`tool_input`・`cwd`・`session_id`・`tool_use_id`）。`tool_input` の欄は、Bash = `command`、Read / Edit / Write = `file_path`（絶対パス）、Grep / Glob = `path`、NotebookEdit = `notebook_path`',
    '- 終了コード 2 は道具の呼び出しを止め、標準エラーの文がモデルに渡る。許可の規則があっても止まる。2 以外の失敗と時間切れは、既定では呼び出しを通す。`onFailure: "block"`（v2.1.295 以降）で止める側に変えられる',
    '- 権限の規則は deny → ask → allow の順で、deny はどの設定ファイルにあっても勝つ。リストの欄は設定ファイルの間で足し合わされる。`Bash(命令 *)`・`Read(パス)`・`Edit(パス)`・道具の名前だけ、の書き方',
    '- 権限の Bash の規則は、別のつづり（絶対パス・`sh -c` の中）には当たらないと文書に書いてある。そのため、命令の規則は hook が主で、権限の規則は単純な形だけの二重の備え',
    '- managed 設定の置き場と、`managed-settings.d/` の分割。managed 設定の hook は、下の階層の `disableAllHooks` では止まらない',
    '', '## 確かめていないこと', '',
    '- **生成した設定を、実際の Claude Code に読ませていない**（この作業ではモデルを呼ばない）。hook は、文書の入力の形を標準入力に流す単体テストで確かめただけ。試走の前に、台本の対照（計画 34 第 4 版 §5）で確かめること',
    '- サブエージェント（Agent の道具）の中の道具の呼び出しで PreToolUse が動くか',
    '- 権限の確認を飛ばすモード（`bypassPermissions`）で、deny の規則と hook がどう働くか',
    `- hook の process が、Claude Code の環境変数（\`${LOG_ENV}\`）を受け継ぐこと（受け継ぐ前提で作った）`,
    '- `MultiEdit` という道具の名前と欄（今の文書の一覧には無かった。来たら Edit と同じに扱う）',
    '- Windows で `node` を直接起動する形が動くか（文書には、実行ファイルでないと起動できないとある）', '');
  return L.join('\n');
}

// ---------------------------------------------------------------------------------------------------
// generate
// ---------------------------------------------------------------------------------------------------
export function generate({ specPath, outDir, installDir, settingsPath, task = {}, node = 'node', strict = false }) {
  const specText = readFileSync(specPath, 'utf8');
  const spec = YAML.parse(specText);
  const role = spec?.role;
  if (typeof role !== 'string' || !/^[a-z][a-z0-9-]*$/.test(role)) throw new Error(`${specPath}: role が読めない`);
  installDir = installDir ?? `/etc/claude-code/pit-enforce/${role}`;
  settingsPath = settingsPath ?? `/etc/claude-code/managed-settings.d/50-pit-enforce-${role}.json`;
  for (const [name, p] of [['--install-dir', installDir], ['--settings-path', settingsPath]]) if (!(isAbsolute(p) || /^([A-Za-z]:)?[\\/]/.test(p))) throw new Error(`${name} は絶対パスで書く（作業木の外に置くため）: ${p}`);
  const { rules, rows } = compile(spec, { task });
  if (strict) {
    const bad = rows.filter((r) => ['missing', 'skipped', 'partial'].includes(r.status));
    if (bad.length) throw new Error(`--strict: 強制を作れない行がある: ${bad.map((r) => `${r.id}（${r.status}${r.unresolved ? `: task.${r.unresolved.join(', task.')}` : ''}）`).join('、')}`);
  }
  const specAbs = resolve(specPath), repo = resolve(HERE, '..');
  const specRel = specAbs.startsWith(repo) ? posix(relative(repo, specAbs)) : basename(specAbs);
  const hookSrc = readFileSync(join(HERE, 'enforce-hook.mjs'));
  const rulesDoc = { version: GENERATOR_VERSION, role, spec: specRel, spec_sha256: sha256(specText), protect: [posix(installDir), posix(settingsPath)], rules };
  const out = {
    'settings.json': `${JSON.stringify(settingsFor(rules, { installDir, node }), null, 2)}\n`,
    'hooks/enforce-hook.mjs': hookSrc,
    'hooks/enforce-rules.json': `${JSON.stringify(rulesDoc, null, 2)}\n`,
  };
  const files = [
    { path: 'settings.json', install_to: posix(settingsPath), mode: '0644' },
    { path: 'hooks/enforce-hook.mjs', install_to: `${posix(installDir)}/enforce-hook.mjs`, mode: '0755' },
    { path: 'hooks/enforce-rules.json', install_to: `${posix(installDir)}/enforce-rules.json`, mode: '0644' },
  ].map((f) => ({ ...f, owner: 'root', sha256: sha256(out[f.path]) }));
  out['INSTALL.md'] = installDoc({ spec, specRel, role, rows, rules, installDir, settingsPath, node, files: [...files, { path: 'INSTALL.md' }, { path: 'manifest.json' }] });
  files.push({ path: 'INSTALL.md', install_to: null, sha256: sha256(out['INSTALL.md']) });
  const manifest = {
    generator: { path: 'kit/gen-enforce.mjs', version: GENERATOR_VERSION, sha256: sha256(readFileSync(fileURLToPath(import.meta.url))), hook_source: 'kit/enforce-hook.mjs', hook_source_sha256: sha256(hookSrc) },
    spec: { path: specRel, role, sha256: sha256(specText) },
    task, install: { hook_dir: posix(installDir), settings: posix(settingsPath), node, log_env: LOG_ENV },
    rows, rule_count: rules.length, permissions_deny: permissionDeny(rules), files, docs_opened: DOC_URLS,
  };
  out['manifest.json'] = `${JSON.stringify(manifest, null, 2)}\n`;
  for (const [rel, body] of Object.entries(out)) {
    const p = join(outDir, rel);
    if (!existsSync(dirname(p))) mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return manifest;
}

const USAGE = 'usage: node kit/gen-enforce.mjs <role spec .yaml> --out <dir> [--install-dir <abs>] [--settings-path <abs>] [--task <json>] [--set name=value] [--node <path>] [--strict]';
function cli(argv) {
  // --help / -h: the usage, and nothing else (no file is written)
  if (argv.some((a) => a === '--help' || a === '-h')) { console.log(`${USAGE}\n  Makes the enforcement files (hook, settings, INSTALL.md, manifest) from a role spec's forbidden[].enforce rows.\n  WRITES them under --out.`); return; }
  const o = { task: {} }; const rest = [];
  for (let at = 0; at < argv.length; at += 1) {
    const a = argv[at], next = () => { if (argv[at + 1] === undefined) throw new Error(`${a} に値がない`); at += 1; return argv[at]; };
    if (a === '--out') o.outDir = next();
    else if (a === '--install-dir') o.installDir = next();
    else if (a === '--settings-path') o.settingsPath = next();
    else if (a === '--node') o.node = next();
    else if (a === '--strict') o.strict = true;
    else if (a === '--task') Object.assign(o.task, JSON.parse(readFileSync(next(), 'utf8')));
    else if (a === '--set') { const v = next(), eq = v.indexOf('='); if (eq < 1) throw new Error(`--set は 名前=値 で書く: ${v}`); const k = v.slice(0, eq), val = v.slice(eq + 1); o.task[k] = o.task[k] === undefined ? val : [...arr(o.task[k]), val]; }
    else if (a.startsWith('-') && a !== '-') throw new Error(`知らない引数: ${a}`);
    else rest.push(a);
  }
  if (rest.length !== 1 || !o.outDir) throw new Error(USAGE);
  const m = generate({ specPath: rest[0], ...o });
  console.log(`${m.spec.role}: 規則 ${m.rule_count} 件、permissions.deny ${m.permissions_deny.length} 件 → ${o.outDir}`);
  for (const f of m.files) console.log(`  ${f.path}  ${f.sha256.slice(0, 12)}  → ${f.install_to ?? '（置かない）'}`);
  for (const r of m.rows) console.log(`  [${r.status}] ${r.id}${r.unresolved ? `  足りない値: task.${r.unresolved.join(', task.')}` : ''}${r.status === 'none' ? `  理由: ${r.reason}` : ''}`);
  const loud = m.rows.filter((r) => ['missing', 'skipped', 'partial'].includes(r.status));
  if (loud.length) console.error(`注意: 強制を作っていない行がある: ${loud.map((r) => r.id).join(', ')}（INSTALL.md と manifest.json に出る）`);
}

const invoked = (() => { try { return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (invoked) {
  try { cli(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
