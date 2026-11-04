// Shell command parsing for the process graders: what a Bash tool call read, searched,
// listed, ran and wrote, and where in the command each action sits.
//
// Why a tokenizer and not regexes over the command: agents chain many actions into one
// call (`cat bin/*; sed -i '...' lib/x.sh; bash tests/t.sh`), quote `;` and `|` inside sed
// scripts, and write files with heredocs whose bodies contain paths and commands as data
// (phase-metrics.mjs misses in EXP-19 and EXP-21). The tokenizer respects quotes,
// heredocs and $(...), so a path inside a heredoc body is never read as a command.
//
// Parsing is an aid, not the judge: research §3.2 step 5 makes content matching the primary
// test of what was seen. Unknown forms produce no action rather than a guessed one.

import { normPath, expand, TEST_RE } from './paths.mjs';

const blank = (s) => s.replace(/[^\n]/g, ' ');

// Heredocs in a raw command: { op, delim, body, bodyStart, end } (end = after the
// delimiter line). Bodies are found in order, so two heredocs on one line both work.
export function findHeredocs(cmd) {
  const out = [];
  let cursor = 0;
  for (const m of cmd.matchAll(/(?<!<)<<(?!<)(-?)[ \t]*(['"]?)([A-Za-z_][\w-]*)\2/g)) {
    if (out.some((d) => m.index >= d.bodyStart && m.index < d.end)) continue; // inside an earlier body
    // The body starts on the line after the operator, or after the previous body when two
    // heredocs share a line.
    const nl = cmd.indexOf('\n', m.index);
    if (nl === -1) continue;
    const bodyStart = Math.max(nl + 1, cursor);
    const re = new RegExp(`^${m[1] ? '\\t*' : '[ \\t]*'}${m[3]}[ \\t]*$`, 'm');
    const rest = cmd.slice(bodyStart);
    const k = rest.search(re);
    const bodyEnd = k === -1 ? cmd.length : bodyStart + k;
    let end = k === -1 ? cmd.length : cmd.indexOf('\n', bodyEnd);
    if (end === -1) end = cmd.length; else end += 1;
    out.push({ op: m.index, delim: m[3], body: cmd.slice(bodyStart, bodyEnd).replace(/\n$/, ''), bodyStart, end });
    cursor = end;
  }
  return out;
}

// Blank heredoc bodies and their delimiter lines, keeping offsets and newlines.
export function maskHeredocs(cmd, docs = findHeredocs(cmd)) {
  let out = cmd;
  for (const d of docs) out = out.slice(0, d.bodyStart) + blank(out.slice(d.bodyStart, d.end)) + out.slice(d.end);
  return out;
}

// Read a balanced $( ... ) or `...` starting at i (pointing at '$(' or '`'). Returns end index (exclusive).
function balanced(s, i) {
  if (s[i] === '`') { const j = s.indexOf('`', i + 1); return j === -1 ? s.length : j + 1; }
  let depth = 1, q = null; // s[i] is the opening '('
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\' && q === '"') { j++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === '\\') { j++; continue; }
    if (c === '(') depth++;
    if (c === ')') { depth--; if (depth === 0) return j + 1; }
  }
  return s.length;
}

// Tokenize a (heredoc-masked) command into simple commands.
// Each: { words: [{ value, start, end }], redirs: [{ op, target, start }], start, end,
//         pipeline, stage, herestring, heredocOp, sub }
// `sub` commands come from $(...) and backticks, parsed recursively.
export function tokenize(s, base = 0, sub = false) {
  const cmds = [];
  let pipeline = 0, stage = 0;
  let cur = null, word = null, pendingRedir = null;
  const newCmd = (i) => ({ words: [], redirs: [], start: base + i, end: base + i, pipeline, stage, herestring: null, heredocOp: null, sub });
  const startWord = (i) => { if (!cur) cur = newCmd(i); if (!word) word = { value: '', start: base + i, end: base + i }; };
  const endWord = (i) => {
    if (!word) return;
    word.end = base + i;
    if (pendingRedir) {
      if (pendingRedir.op === '<<' ) cur.heredocOp = pendingRedir.start;
      else if (pendingRedir.op === '<<<') cur.herestring = word.value;
      else if (!/^&\d*$/.test(word.value)) cur.redirs.push({ op: pendingRedir.op, target: word.value, start: pendingRedir.start });
      pendingRedir = null;
    } else cur.words.push(word);
    word = null;
  };
  // $(( ... )) is arithmetic, not a command: do not parse its inside as commands.
  const subParse = (inner, at) => { if (!inner.startsWith('(')) cmds.push(...tokenize(inner, at, true)); };
  const endCmd = (i) => { endWord(i); pendingRedir = null; if (cur && (cur.words.length || cur.redirs.length)) { cur.end = base + i; cmds.push(cur); } cur = null; };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") { startWord(i); const j = s.indexOf("'", i + 1); const e = j === -1 ? s.length : j; word.value += s.slice(i + 1, e); i = e; continue; }
    if (c === '"') {
      startWord(i);
      let j = i + 1;
      for (; j < s.length && s[j] !== '"'; j++) {
        if (s[j] === '\\' && j + 1 < s.length) { const n = s[j + 1]; word.value += '"\\$`\n'.includes(n) ? (n === '\n' ? '' : n) : `\\${n}`; j++; continue; }
        if ((s[j] === '$' && s[j + 1] === '(') || s[j] === '`') {
          const e = balanced(s, s[j] === '$' ? j + 1 : j);
          const inner = s[j] === '$' ? s.slice(j + 2, e - 1) : s.slice(j + 1, e - 1);
          subParse(inner, base + j + (s[j] === '$' ? 2 : 1));
          word.value += s.slice(j, e); j = e - 1; continue;
        }
        word.value += s[j];
      }
      i = j; continue;
    }
    if (c === '\\') { if (s[i + 1] === '\n') { i++; continue; } startWord(i); word.value += s[i + 1] ?? ''; i++; continue; }
    if ((c === '$' && s[i + 1] === '(') || c === '`') {
      startWord(i);
      const e = balanced(s, c === '$' ? i + 1 : i);
      const inner = c === '$' ? s.slice(i + 2, e - 1) : s.slice(i + 1, e - 1);
      subParse(inner, base + i + (c === '$' ? 2 : 1));
      word.value += s.slice(i, e); i = e - 1; continue;
    }
    if (c === '#' && !word) { const j = s.indexOf('\n', i); i = (j === -1 ? s.length : j) - 1; continue; }
    if (c === ' ' || c === '\t') { endWord(i); continue; }
    if (c === '\n' || c === ';') { endCmd(i); pipeline++; stage = 0; continue; }
    if (c === '&' && s[i + 1] === '&') { endCmd(i); pipeline++; stage = 0; i++; continue; }
    if (c === '|' && s[i + 1] === '|') { endCmd(i); pipeline++; stage = 0; i++; continue; }
    if (c === '|') { endCmd(i); stage++; if (s[i + 1] === '&') i++; continue; }
    if (c === '&' && s[i + 1] === '>') { endWord(i); if (!cur) cur = newCmd(i); const app = s[i + 2] === '>'; pendingRedir = { op: app ? '>>' : '>', start: base + i }; i += app ? 2 : 1; continue; }
    if (c === '&') { endCmd(i); pipeline++; stage = 0; continue; }
    if (c === '(' || c === ')' ) { if (!word) { endCmd(i); continue; } }
    if (c === '>' || c === '<') {
      // A word of only digits right before is a file descriptor (2>), not an argument.
      // (A word still open here touches the operator, since whitespace closes words.)
      if (word && /^\d+$/.test(word.value)) word = null;
      else endWord(i);
      if (!cur) cur = newCmd(i);
      let op = c;
      if (c === '<' && s.startsWith('<<<', i)) op = '<<<';
      else if (c === '<' && s[i + 1] === '<') op = '<<';
      else if (c === '>' && (s[i + 1] === '>' || s[i + 1] === '|')) op = s[i + 1] === '>' ? '>>' : '>';
      else if (c === '<' && s[i + 1] === '>') op = '<>';
      i += (op === '<<<' ? 2 : op.length === 2 || s[i + 1] === '|' ? 1 : 0);
      if (op === '<<' && s[i + 1] === '-') i++;
      if (s[i + 1] === '&') { // >&2, 2>&1: a descriptor, not a file
        i++; while (/\d|-/.test(s[i + 1] ?? '')) i++; continue;
      }
      pendingRedir = { op, start: base + i };
      continue;
    }
    startWord(i); word.value += c;
  }
  endCmd(s.length);
  return cmds;
}

// ---- interpretation -------------------------------------------------------------------

const WRAPPERS = new Set(['sudo', 'time', 'command', 'nohup', 'exec', 'builtin', 'stdbuf', 'nice', 'ionice']);
const READ_FULL = new Set(['cat', 'bat', 'batcat', 'less', 'more', 'nl', 'tac', 'view', 'od', 'xxd', 'hexdump', 'strings']);
const LIST = new Set(['ls', 'll', 'tree', 'find', 'fd', 'fdfind', 'du', 'stat', 'file', 'wc', 'realpath', 'readlink']);
// Shell keywords that precede a command on the same line (`do cat x`, `then bash t.sh`).
const KEYWORDS = new Set(['do', 'then', 'else', 'elif', 'if', 'while', 'until', '!', '{']);
const GREP = new Set(['grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack']);
const FILTERS = new Set(['head', 'tail', 'grep', 'egrep', 'fgrep', 'rg', 'sed', 'awk', 'cut', 'wc', 'sort', 'uniq', 'tr', 'jq', 'column', 'less', 'more']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const INTERP = new Set(['node', 'python', 'python3', 'ruby', 'perl', 'php', 'deno', 'bun', 'tsx', 'ts-node']);
const TEST_RUNNERS = /^(pytest|py\.test|jest|vitest|mocha|bats|rspec|phpunit|tox|nox|ava|tap|karma|ctest)$/;
const NULL_TARGET = /^\/dev\/(null|stderr|stdout|tty)$|^&\d*$/;

const isOpt = (w) => /^-/.test(w) && w !== '-';
const nonOpts = (words) => words.filter((w) => !isOpt(w.value)).map((w) => w.value);

// Strip env assignments and wrapper commands; returns the remaining words.
function core(words) {
  let w = words.slice();
  for (;;) {
    while (w.length && /^[A-Za-z_]\w*=/.test(w[0].value)) w = w.slice(1);
    if (!w.length) return w;
    const n = w[0].value;
    if (WRAPPERS.has(n) || KEYWORDS.has(n)) { w = w.slice(1); continue; }
    if (n === 'for' || n === 'case' || n === 'select') return [];
    if (n === 'env') { w = w.slice(1).filter((x, k, a) => !(k === 0 && isOpt(x.value))); continue; }
    if (n === 'timeout') { w = w.slice(1); while (w.length && (isOpt(w[0].value) || /^\d/.test(w[0].value))) w = w.slice(1); continue; }
    return w;
  }
}

// Value following an option (`-m msg`, `-mmsg`, `--message=msg`, `--message msg`).
function optValues(words, shorts, longs) {
  const out = [];
  for (let k = 0; k < words.length; k++) {
    const v = words[k].value;
    if (v === '--') break;
    if (v.startsWith('--')) {
      for (const l of longs) {
        if (v === l && k + 1 < words.length) { out.push({ value: words[k + 1].value, word: words[k + 1] }); k++; break; }
        if (v.startsWith(`${l}=`)) { out.push({ value: v.slice(l.length + 1), word: words[k] }); break; }
      }
      continue;
    }
    if (!/^-[a-zA-Z]/.test(v)) continue;
    for (const sh of shorts) {
      const idx = v.indexOf(sh, 1);
      if (idx === -1) continue;
      // -m msg, -am msg (flags before the option letter): the value is the next word.
      if (idx === v.length - 1) { if (k + 1 < words.length) { out.push({ value: words[k + 1].value, word: words[k + 1] }); k++; } }
      // -mmsg: the value is attached.
      else if (idx === 1) out.push({ value: v.slice(2), word: words[k] });
      break;
    }
  }
  return out;
}

// Arguments that are not options and not option values (for options listed as taking values).
function positional(words, takesValue = new Set()) {
  const out = [];
  for (let k = 0; k < words.length; k++) {
    const v = words[k].value;
    if (v === '--') { out.push(...words.slice(k + 1).map((w) => w.value)); break; }
    if (isOpt(v)) { if (takesValue.has(v)) k++; continue; }
    out.push(v);
  }
  return out;
}

// Heredoc bodies whose `<<` sits inside [from, to).
const docsIn = (docs, from, to) => docs.filter((d) => d.op >= from && d.op < to);

// Lines of a unified diff body: paths it patches and the added text.
function diffWrites(text) {
  const out = [];
  let path = null, added = [];
  const flush = () => { if (path) out.push({ path, text: added.join('\n') }); added = []; };
  for (const l of text.split('\n')) {
    const m = l.match(/^\+\+\+ (?:b\/)?(\S+)/);
    if (m) { flush(); path = m[1] === '/dev/null' ? null : m[1]; continue; }
    if (path && l.startsWith('+')) added.push(l.slice(1));
  }
  flush();
  return out;
}

// One simple command -> actions. ctx: { cwd, known: Set, docs, raw, stdin: text|null }.
// Each action carries `at` (offset in the raw command) for ordering inside the call.
export function interpret(cmd, ctx, pipeInfo = {}) {
  const acts = [];
  const at = cmd.start;
  const push = (a) => { if ('path' in a && a.path == null) return; acts.push({ at, ...a }); };
  const words = core(cmd.words);
  const docs = docsIn(ctx.docs, cmd.start, cmd.end + 1);
  const docBody = docs.length ? docs.map((d) => d.body).join('\n') : null;
  const filtered = !!pipeInfo.downstreamFilter;
  const P = (p, opt) => expand(p, ctx.cwd, ctx.known, opt);
  // Input redirection `< file` reads the file into the command.
  for (const r of cmd.redirs) if (r.op === '<' || r.op === '<>') for (const p of P(r.target)) push({ type: 'read', path: p, range: { kind: filtered ? 'filtered' : 'full' }, via: 'stdin' });
  const name0 = words[0]?.value ?? '';
  const name = name0.replace(/^.*\//, '');
  const args = words.slice(1);
  let stdoutText = null; // text this command prints, when it is authored (echo, cat <<EOF)

  if (!words.length) { /* only redirections, e.g. `> file` */ }
  else if (name === 'cd' || name === 'pushd') { ctx.cwd = normPath(nonOpts(args)[0] ?? '/app', ctx.cwd) ?? ctx.cwd; push({ type: 'cd', path: ctx.cwd }); }
  else if (name === 'echo' || name === 'printf') {
    const escapes = name === 'printf' || args.some((w) => /^-[nE]*e[nE]*$/.test(w.value));
    const text = args.filter((w) => !(name === 'echo' && /^-[neE]+$/.test(w.value))).map((w) => w.value).join(' ');
    // printf and echo -e expand \n and \t, so the file gets lines, not a literal "\n".
    stdoutText = escapes ? text.replace(/\\n/g, '\n').replace(/\\t/g, '\t') : text;
  }
  else if (READ_FULL.has(name)) {
    const files = positional(args);
    if (files.length === 0 || (files.length === 1 && files[0] === '-')) { if (docBody != null) stdoutText = docBody; else if (cmd.herestring != null) stdoutText = cmd.herestring; }
    for (const f of files) if (f !== '-') for (const p of P(f)) push({ type: 'read', path: p, range: { kind: filtered ? 'filtered' : 'full' } });
  } else if (name === 'head' || name === 'tail') {
    let n = 10, plus = null;
    const files = [];
    for (let k = 0; k < args.length; k++) {
      const v = args[k].value;
      let m;
      if ((v === '-n' || v === '--lines') && args[k + 1]) { const x = args[++k].value; if (x.startsWith('+')) plus = Number(x.slice(1)); else n = Number(x); }
      else if ((m = v.match(/^-n(\+?)(\d+)$/)) || (m = v.match(/^--lines=(\+?)(\d+)$/))) { if (m[1]) plus = Number(m[2]); else n = Number(m[2]); }
      else if ((m = v.match(/^-(\d+)$/))) n = Number(m[1]);
      else if (v === '-c' && args[k + 1]) { k++; n = null; }
      else if (!isOpt(v)) files.push(v);
    }
    for (const f of files) for (const p of P(f)) {
      const range = n == null ? { kind: 'filtered' } : name === 'head' ? { kind: 'lines', from: 1, to: n } : plus ? { kind: 'lines', from: plus, to: Infinity } : { kind: 'tail', n };
      push({ type: 'read', path: p, range: filtered ? { kind: 'filtered' } : range });
    }
  } else if (name === 'sed') {
    const inPlace = args.some((w) => /^-(?:[nErsuz]*i|-in-place)/.test(w.value));
    const quiet = args.some((w) => /^-[a-zA-Z]*n/.test(w.value) && !w.value.startsWith('--')) || args.some((w) => w.value === '--quiet');
    const scripts = optValues(args, ['e'], ['--expression']).map((x) => x.value);
    const pos = positional(args, new Set(['-e', '--expression', '-f']));
    if (!scripts.length && pos.length) scripts.push(pos.shift());
    const files = pos;
    if (inPlace) for (const f of files) for (const p of P(f)) push({ type: 'write', path: p, text: scripts.join('\n'), authored: true, how: 'sed-i' });
    else for (const f of files) for (const p of P(f)) {
      const m = scripts.length === 1 && scripts[0].trim().match(/^(\d+)(?:,(\d+|\$))?p$/);
      const range = quiet && m ? { kind: 'lines', from: Number(m[1]), to: m[2] ? (m[2] === '$' ? Infinity : Number(m[2])) : Number(m[1]) } : { kind: 'filtered' };
      push({ type: 'read', path: p, range: filtered ? { kind: 'filtered' } : range });
    }
  } else if (name === 'awk' || name === 'gawk') {
    const pos = positional(args, new Set(['-F', '-v', '-f']));
    const script = pos.shift() ?? '';
    const m = script.match(/NR\s*>=?\s*(\d+)\s*&&\s*NR\s*<=?\s*(\d+)/) || script.match(/NR\s*==\s*(\d+)\s*,\s*NR\s*==\s*(\d+)/);
    for (const f of pos) for (const p of P(f)) push({ type: 'read', path: p, range: m && !filtered ? { kind: 'lines', from: Number(m[1]), to: Number(m[2]) } : { kind: 'filtered' } });
  } else if (GREP.has(name) || (name === 'git' && args[0]?.value === 'grep')) {
    const a = name === 'git' ? args.slice(1) : args;
    const takes = new Set(['-e', '-f', '-m', '-A', '-B', '-C', '--include', '--exclude', '--exclude-dir', '-g', '--glob', '-t', '--type', '--max-count']);
    const pats = optValues(a, ['e'], ['--regexp']).map((x) => x.value);
    const pos = positional(a, takes);
    if (!pats.length && pos.length) pats.push(pos.shift());
    const mode = a.some((w) => /^-[a-zA-Z]*[lL]/.test(w.value) && !w.value.startsWith('--') || /^--(files-with(out)?-matches|files)$/.test(w.value)) ? 'names'
      : a.some((w) => /^-[a-zA-Z]*c/.test(w.value) && !w.value.startsWith('--') || w.value === '--count') ? 'count'
        : a.some((w) => /^-[a-zA-Z]*q/.test(w.value) && !w.value.startsWith('--')) ? 'quiet' : 'hits';
    const recursive = name === 'rg' || name === 'ag' || name === 'ack' || name === 'git' || a.some((w) => /^-[a-zA-Z]*[rR]/.test(w.value) || w.value === '--recursive');
    if (pos.length === 0 && cmd.stage > 0) { /* a filter on piped input */ }
    else {
      const paths = pos.length ? pos.flatMap((f) => P(f, { dir: recursive })) : (recursive ? [ctx.cwd || ''] : []);
      push({ type: 'search', tool: name === 'git' ? 'git grep' : name, pattern: pats.join(' | '), paths, mode });
    }
  } else if (LIST.has(name)) {
    // find: the starting points are the arguments before the first expression token.
    const fi = args.findIndex((w) => /^[-(!]/.test(w.value));
    const pos = name === 'find' ? (fi === -1 ? args : args.slice(0, fi)).map((w) => w.value) : positional(args);
    push({ type: 'list', tool: name, paths: (pos.length ? pos : ['.']).map((f) => normPath(f, ctx.cwd)).filter((p) => p != null) });
  } else if (name === 'git') {
    gitActions(args, cmd, ctx, docs, push, P);
  } else if (name === 'gh') {
    ghActions(args, ctx, docs, push);
  } else if (name === 'tee') {
    const files = positional(args);
    const text = pipeInfo.upstreamText ?? docBody;
    for (const f of files) for (const p of P(f)) push({ type: 'write', path: p, text, authored: text != null, how: 'tee' });
  } else if (name === 'cp' || name === 'mv' || name === 'install' || name === 'ln') {
    const pos = positional(args, new Set(['-t', '-S']));
    if (pos.length >= 2) {
      const dest = normPath(pos.at(-1), ctx.cwd);
      for (const src of pos.slice(0, -1)) {
        const s = normPath(src, ctx.cwd);
        const destIsDir = ctx.known.has(dest) ? false : pos.length > 2 || [...ctx.known].some((k) => k.startsWith(`${dest}/`));
        push({ type: 'write', path: destIsDir ? `${dest}/${s.replace(/^.*\//, '')}` : dest, text: null, authored: false, how: name, from: s });
        if (name === 'mv') push({ type: 'delete', path: s });
      }
    }
  } else if (name === 'rm' || name === 'unlink' || name === 'rmdir') {
    for (const f of positional(args)) for (const p of P(f)) push({ type: 'delete', path: p });
  } else if (name === 'touch') {
    for (const f of positional(args)) push({ type: 'write', path: normPath(f, ctx.cwd), text: '', authored: false, how: 'touch' });
  } else if (name === 'patch' || name === 'ed' || name === 'ex') {
    const body = docBody ?? cmd.herestring ?? '';
    for (const w of diffWrites(body)) push({ type: 'write', path: normPath(w.path, ctx.cwd), text: w.text, authored: true, how: 'patch' });
    for (const f of positional(args, new Set(['-p', '-i']))) if (!/^\d+$/.test(f)) push({ type: 'write', path: normPath(f, ctx.cwd), text: body || null, authored: !!body, how: name });
  } else if (name === 'perl' && args.some((w) => /^-\w*i/.test(w.value))) {
    const scripts = optValues(args, ['e', 'E'], []).map((x) => x.value);
    const pos = positional(args, new Set(['-e', '-E']));
    for (const f of pos) for (const p of P(f)) push({ type: 'write', path: p, text: scripts.join('\n'), authored: true, how: 'perl-i' });
  } else if (name === 'curl' || name === 'wget' || name === 'http') {
    for (const v of args.map((w) => w.value).filter((v) => /^https?:\/\//.test(v))) push({ type: 'web', tool: name, url: v });
  } else if (name === 'source' || name === '.') {
    const t = nonOpts(args)[0];
    if (t) push({ type: 'run', target: normPath(t, ctx.cwd), cmd: raw(ctx, cmd), isTest: TEST_RE.test(t) });
  } else if (SHELLS.has(name)) {
    const c = optValues(args, ['c'], []);
    if (c.length) {
      // bash -c "...": parse the inner command at this command's position.
      const inner = analyzeCommand(c[0].value, { cwd: ctx.cwd, known: ctx.known });
      for (const a of inner.actions) push({ ...a, at });
    } else {
      const t = positional(args, new Set(['-o', '-O']))[0];
      if (t && t !== '-') push({ type: 'run', target: normPath(t, ctx.cwd), cmd: raw(ctx, cmd), isTest: isTestTarget(t) });
      else if (docBody != null) push({ type: 'run', target: null, cmd: raw(ctx, cmd), isTest: false, script: docBody });
    }
  } else if (INTERP.has(name)) {
    const v = args.map((w) => w.value);
    const mIdx = v.indexOf('-m');
    if (mIdx !== -1) push({ type: 'run', target: v[mIdx + 1] ?? null, cmd: raw(ctx, cmd), isTest: /pytest|unittest|nose/.test(v[mIdx + 1] ?? '') });
    else if (v.includes('--test') || (name === 'deno' && v[0] === 'test') || (name === 'bun' && v[0] === 'test')) push({ type: 'run', target: positional(args)[0] ?? null, cmd: raw(ctx, cmd), isTest: true });
    else {
      const inline = optValues(args, ['c', 'e', 'E'], ['--eval']);
      const t = positional(args, new Set(['-c', '-e', '-E', '--eval', '-r']))[0];
      if (inline.length) push({ type: 'run', target: null, cmd: raw(ctx, cmd), isTest: false, script: inline[0].value });
      else if (t && t !== '-') push({ type: 'run', target: normPath(t, ctx.cwd), cmd: raw(ctx, cmd), isTest: isTestTarget(t) });
      else if (docBody != null) push({ type: 'run', target: null, cmd: raw(ctx, cmd), isTest: false, script: docBody });
    }
  } else if (TEST_RUNNERS.test(name)) {
    push({ type: 'run', target: positional(args)[0] ?? null, cmd: raw(ctx, cmd), isTest: true });
  } else if (['npm', 'yarn', 'pnpm', 'npx', 'bunx'].includes(name)) {
    const v = positional(args);
    const script = v[0] === 'run' || v[0] === 'run-script' ? v[1] : v[0];
    if (script === 'install' || script === 'i' || script === 'ci' || script === 'add') push({ type: 'other', name: `${name} ${script}` });
    else push({ type: 'run', target: null, cmd: raw(ctx, cmd), isTest: /test|check|verify|spec|vitest|jest|mocha|playwright|lint/.test(script ?? '') });
  } else if (['go', 'cargo', 'mvn', 'gradle', 'dotnet', 'make', 'just', 'rake', 'mix'].includes(name)) {
    const v = positional(args);
    push({ type: 'run', target: null, cmd: raw(ctx, cmd), isTest: /^(test|check|verify|spec)/.test(v[0] ?? '') || (name === 'make' && v.length === 0 ? false : /test|check/.test(v.join(' '))) });
  } else if (name0.includes('/') && !isOpt(name0)) {
    // ./script.sh, bin/price, tests/x_test.sh: running a file of the repository.
    push({ type: 'run', target: normPath(name0, ctx.cwd), cmd: raw(ctx, cmd), isTest: isTestTarget(name0) });
  } else if (['mkdir', 'chmod', 'chown', 'true', 'false', 'exit', 'set', 'export', 'unset', 'sleep', 'date', 'pwd', 'whoami', 'which', 'type', 'jq', 'sort', 'uniq', 'tr', 'cut', 'diff', 'cmp', 'xargs', 'for', 'do', 'done', 'if', 'then', 'else', 'fi', 'while', 'case', 'esac', '{', '}', 'read', 'local', 'return', 'trap', 'wait'].includes(name)) {
    if (name === 'diff' || name === 'cmp') for (const f of positional(args)) for (const p of P(f)) push({ type: 'read', path: p, range: { kind: 'filtered' } });
    else push({ type: 'other', name });
  } else push({ type: 'other', name });

  // Output redirections write files. The text is authored when the command printed text the
  // agent typed (echo, printf, cat <<EOF); otherwise it is program output.
  for (const r of cmd.redirs) {
    if (r.op !== '>' && r.op !== '>>') continue;
    if (NULL_TARGET.test(r.target)) continue;
    const text = stdoutText;
    push({ type: 'write', path: normPath(r.target, ctx.cwd), text, authored: text != null, how: r.op === '>>' ? 'append' : 'redirect' });
  }
  return { actions: acts, stdoutText: cmd.redirs.some((r) => r.op === '>' || r.op === '>>') ? null : stdoutText };
}

const raw = (ctx, cmd) => (ctx.raw ? ctx.raw.slice(cmd.start, cmd.end).trim() : cmd.words.map((w) => w.value).join(' '));
const isTestTarget = (t) => TEST_RE.test(t) || /(^|\/)(verify|check|run[-_]?tests?)[^/]*$/i.test(t);

function gitActions(args, cmd, ctx, docs, push, P) {
  // Global options before the subcommand (-C dir, -c k=v, --no-pager).
  let k = 0;
  while (k < args.length && isOpt(args[k].value)) { if (['-C', '-c', '--git-dir', '--work-tree'].includes(args[k].value)) k++; k++; }
  const sub = args[k]?.value;
  const rest = args.slice(k + 1);
  const vals = rest.map((w) => w.value);
  const flag = (re) => vals.some((v) => re.test(v));
  if (sub === 'show') {
    const specs = positional(rest).filter((v) => /^[^:\s]*:[^:\s]+$/.test(v) && !/^https?:/.test(v));
    if (specs.length) for (const s of specs) { const [rev, p] = [s.slice(0, s.indexOf(':')), s.slice(s.indexOf(':') + 1)]; push({ type: 'read', path: normPath(p, ''), range: { kind: 'full' }, version: rev || 'index' }); }
    else push({ type: 'history', what: 'show', patch: !flag(/^--(stat|name-only|name-status|oneline|no-patch)$|^-s$/), names: flag(/^--(stat|name-only|name-status)$/), args: vals });
  } else if (sub === 'diff') push({ type: 'history', what: 'diff', patch: !flag(/^--(stat|name-only|name-status|shortstat|numstat|quiet|exit-code)$/), names: flag(/^--(stat|name-only|name-status)$/), args: vals });
  else if (sub === 'log' || sub === 'whatchanged' || sub === 'reflog') push({ type: 'history', what: 'log', patch: flag(/^(-p|--patch|-u)$/), pickaxe: flag(/^-[SG]/), names: flag(/^--(stat|name-only|name-status)$/), args: vals });
  else if (sub === 'blame' || sub === 'annotate') for (const f of positional(rest, new Set(['-L']))) for (const p of P(f)) push({ type: 'read', path: p, range: { kind: 'full' } });
  else if (sub === 'ls-files' || sub === 'ls-tree' || sub === 'status') push({ type: 'list', tool: `git ${sub}`, paths: ['.'] });
  else if (sub === 'commit') {
    const msgs = optValues(rest, ['m'], ['--message']);
    const files = optValues(rest, ['F'], ['--file']);
    const texts = [];
    for (const m of msgs) {
      // -m "$(cat <<'EOF' ... EOF)": the message is the heredoc body inside the argument.
      const inside = docs.filter((d) => d.op >= m.word.start && d.op < m.word.end);
      texts.push(inside.length ? inside.map((d) => d.body).join('\n') : m.value);
    }
    for (const f of files) {
      if (f.value === '-') texts.push(docs.map((d) => d.body).join('\n'));
      else push({ type: 'commit-file', path: normPath(f.value, ctx.cwd) });
    }
    push({ type: 'commit', message: texts.length ? texts.join('\n\n') : null, amend: flag(/^--amend$/) });
  } else if (sub === 'checkout' || sub === 'restore') {
    const dd = vals.indexOf('--');
    const paths = dd !== -1 ? vals.slice(dd + 1) : sub === 'restore' ? positional(rest, new Set(['-s', '--source'])) : [];
    for (const f of paths) for (const p of P(f, { dir: true })) push({ type: 'write', path: p, text: null, authored: false, how: `git ${sub}` });
    if (!paths.length) push({ type: 'git', sub, args: vals });
  } else if (sub === 'apply' || sub === 'am') {
    for (const d of docs) for (const w of diffWrites(d.body)) push({ type: 'write', path: normPath(w.path, ''), text: w.text, authored: true, how: 'git apply' });
    push({ type: 'git', sub, args: vals });
  } else if (sub === 'rm') for (const f of positional(rest)) for (const p of P(f)) push({ type: 'delete', path: p });
  else if (sub === 'mv') { const pos = positional(rest); if (pos.length === 2) { push({ type: 'delete', path: normPath(pos[0], ctx.cwd) }); push({ type: 'write', path: normPath(pos[1], ctx.cwd), text: null, authored: false, how: 'git mv' }); } }
  else push({ type: 'git', sub: sub ?? '', args: vals });
}

function ghActions(args, ctx, docs, push) {
  const v = args.map((w) => w.value);
  const [noun, verb] = v;
  const num = (x) => { const m = String(x ?? '').match(/(?:^#?|\/(?:issues|pull)\/)(\d+)$/); return m ? Number(m[1]) : null; };
  if ((noun === 'issue' || noun === 'pr') && (verb === 'view' || verb === 'diff' || verb === 'checks')) {
    const n = num(positional(args.slice(2), new Set(['-R', '--repo', '--json', '-q', '--jq', '-t', '--template']))[0]);
    push({ type: 'gh', op: verb, kind: noun, number: n, comments: v.includes('--comments') || v.includes('-c') });
  } else if ((noun === 'issue' || noun === 'pr') && verb === 'list') push({ type: 'list', tool: `gh ${noun} list`, paths: [] });
  else if ((noun === 'issue' || noun === 'pr') && ['create', 'comment', 'edit', 'review', 'close', 'merge'].includes(verb)) {
    const a = args.slice(2);
    const bodies = optValues(a, ['b'], ['--body']).map((x) => {
      const inside = docs.filter((d) => d.op >= x.word.start && d.op < x.word.end);
      return inside.length ? inside.map((d) => d.body).join('\n') : x.value;
    });
    for (const f of optValues(a, ['F'], ['--body-file'])) {
      if (f.value === '-') bodies.push(docs.map((d) => d.body).join('\n'));
      else push({ type: 'post-file', path: normPath(f.value, ctx.cwd) });
    }
    const titles = optValues(a, ['t'], ['--title']).map((x) => x.value);
    const n = num(positional(a, new Set(['-b', '--body', '-F', '--body-file', '-t', '--title', '-R', '--repo', '-B', '--base', '-H', '--head', '-l', '--label', '--add-label', '-a', '--assignee', '-r', '--reviewer', '-m', '--milestone']))[0]);
    push({ type: 'post', kind: noun, verb, number: n, body: bodies.join('\n\n') || null, title: titles.join(' ') || null });
  } else push({ type: 'other', name: `gh ${noun ?? ''} ${verb ?? ''}`.trim() });
}

// Whole Bash command -> { actions (ordered by offset), docs, cwd }.
// ctx: { cwd, known } — cwd is updated in place by `cd`, so callers can carry it to the next call
// (Claude Code keeps the shell's working directory between calls).
export function analyzeCommand(command, ctx = {}) {
  const rawCmd = String(command ?? '');
  const docs = findHeredocs(rawCmd);
  const masked = maskHeredocs(rawCmd, docs);
  const cmds = tokenize(masked);
  const c = { cwd: ctx.cwd ?? '', known: ctx.known ?? new Set(), docs, raw: rawCmd };
  // Pipelines: a reader followed by a filter stage shows only part of the file.
  const byPipe = new Map();
  for (const x of cmds.filter((x) => !x.sub)) { if (!byPipe.has(x.pipeline)) byPipe.set(x.pipeline, []); byPipe.get(x.pipeline).push(x); }
  const actions = [];
  for (const x of cmds.slice().sort((a, b) => a.start - b.start)) {
    const pipe = x.sub ? [x] : byPipe.get(x.pipeline);
    const downstreamFilter = pipe.some((y) => y.stage > x.stage && FILTERS.has(core(y.words)[0]?.value.replace(/^.*\//, '') ?? ''));
    const prev = x.sub ? null : pipe.find((y) => y.stage === x.stage - 1);
    const upstreamText = prev ? prev._stdout ?? null : null;
    const r = interpret(x, c, { downstreamFilter, upstreamText });
    x._stdout = r.stdoutText;
    actions.push(...r.actions);
  }
  actions.sort((a, b) => a.at - b.at);
  if (ctx) ctx.cwd = c.cwd;
  return { actions, docs, cwd: c.cwd };
}
