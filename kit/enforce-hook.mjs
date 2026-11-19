#!/usr/bin/env node
// PreToolUse enforcement hook for Claude Code — the runtime half of kit/gen-enforce.mjs.
//
// The generator copies this file next to a rules file (enforce-rules.json) that it compiles from the
// `forbidden[].enforce` rows of a role spec (kit/schema/role-spec.md). This file holds no role-specific
// logic: it interprets the enforce vocabulary (deny_tool, deny_path, allow_write_only, deny_command,
// deny_ref_push, guard_edit) against one tool call.
//
// Contract with Claude Code (formats: see the URLs at the top of kit/gen-enforce.mjs):
//   stdin  = the PreToolUse JSON ({ tool_name, tool_input, cwd, session_id, tool_use_id, ... })
//   exit 2 = block the call (stderr is shown to the model as the reason); exit 0 with no output = no decision
// Fail closed: unreadable rules, unparseable stdin, a shell command the lexer cannot read, or an
// unwritable decision log all end in exit 2.
// Decision log: one JSON line per call to the file named by $PIT_ENFORCE_LOG
//   { ts, role, rule, kind, tool, decision, near?, session_id, tool_use_id, input_sha256 }
// It never holds the command text or file contents.
//
// How it decides: structurally. File tools by their resolved path (.., absolute, symlinks). Bash by a shell
// lexer: quotes, escapes, literal variable assignments, command substitution, wrappers (env, command, sudo,
// timeout, xargs, find -exec), `sh -c` / eval / here-documents are unwrapped into simple commands, and rules
// look at the program name, sub-command words, option values, redirect targets and the arguments of
// programs known to write files. It does not match regular expressions against the command text.

import { readFileSync, appendFileSync, mkdirSync, lstatSync, readdirSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

export const LOG_ENV = 'PIT_ENFORCE_LOG';

class Block extends Error {
  constructor(rule, reason, extra = {}) { super(reason); this.rule = rule; this.extra = extra; }
}
class ShellError extends Error {}

const arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
const posix = (p) => String(p).replace(/\\/g, '/');

// ---------------------------------------------------------------------------------------------------
// globs (the spec's glob language: ** across directories, * and ? inside one segment)
// ---------------------------------------------------------------------------------------------------
export function globRe(glob, ci = false) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[\\^$.|+()[\]{}]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, ci ? 'i' : '');
}
const matchAny = (forms, globs, ci) => { const res = arr(globs).map((g) => globRe(g, ci)); return forms.some((f) => res.some((r) => r.test(f))); };

// does the directory `abs` (known under the spellings `forms`) hold a file that matches one of the globs?
// The tree is walked (node_modules and .git are not entered). Past the cap the answer is yes (fail closed).
function dirHolds(abs, forms, globs, ci) {
  const res = arr(globs).map((g) => globRe(g, ci));
  const stack = ['']; let seen = 0;
  while (stack.length) {
    const sub = stack.pop();
    let ents; try { ents = readdirSync(join(abs, sub), { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (++seen > 20000) return true;
      const s = sub ? `${sub}/${e.name}` : e.name;
      if (forms.some((f) => res.some((r) => r.test(f ? `${f}/${s}` : s)))) return true;
      if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') stack.push(s);
    }
  }
  return false;
}

// ---------------------------------------------------------------------------------------------------
// paths
// ---------------------------------------------------------------------------------------------------
function realish(abs) {
  // realpath of the deepest existing ancestor + the rest (the target of a write may not exist yet)
  let head = abs; const rest = [];
  for (let n = 0; n < 64; n++) {
    try { return posix(join(realpathSync(head), ...rest)); } catch { /* go up */ }
    const up = dirname(head);
    if (up === head) break;
    rest.unshift(basename(head)); head = up;
  }
  return posix(abs);
}
function relTo(root, abs) {
  if (abs === root) return '';
  return abs.startsWith(root.endsWith('/') ? root : `${root}/`) ? abs.slice((root.endsWith('/') ? root : `${root}/`).length) : null;
}
// every spelling a rule may match: absolute, real, and relative to the project root (plain and real)
function pathForms(S, p, cwd) {
  const abs = posix(resolve(cwd, p));
  const forms = new Set();
  let inside = false;
  for (const a of new Set([abs, realish(abs)])) {
    forms.add(a);
    for (const r of S.roots) { const rel = relTo(r, a); if (rel !== null) { forms.add(rel); inside = true; } }
  }
  return { abs, forms: [...forms], rel: [...forms].filter((f) => !/^([A-Za-z]:)?\//.test(f)), inside };
}
const lexists = (p) => { try { lstatSync(p); return true; } catch { return false; } };
const isDir = (p) => { try { return lstatSync(p).isDirectory(); } catch { return false; } };

// ---------------------------------------------------------------------------------------------------
// shell lexer: source -> flat list of simple commands (nested substitutions first)
//   command = { assigns: [{name, word}], words: [word], redirects: [{op, word, body?}], pipedIn }
//   word    = { parts: [{k:'lit', v, q} | {k:'var', name, q} | {k:'dyn'}] }
// ---------------------------------------------------------------------------------------------------
export function parseShell(src, depth = 0) {
  if (depth > 6) throw new ShellError('nesting too deep');
  const n = src.length, out = [];
  let i = 0, pending = [], lastSep = '';
  const fresh = () => ({ assigns: [], words: [], redirects: [], pipedIn: lastSep === '|' || lastSep === '|&' });
  let cur = fresh();
  const flush = (sep) => { if (cur.words.length || cur.redirects.length || cur.assigns.length) out.push(cur); lastSep = sep; cur = fresh(); };
  const nested = (text) => { for (const c of parseShell(text, depth + 1)) out.push(c); };

  const skipSQ = (j) => { const e = src.indexOf("'", j); if (e < 0) throw new ShellError('unterminated single quote'); return e + 1; };
  const skipBT = (j) => { for (; j < n; j++) { if (src[j] === '\\') j++; else if (src[j] === '`') return j + 1; } throw new ShellError('unterminated backquote'); };
  const skipDQ = (j) => {
    while (j < n) {
      const c = src[j];
      if (c === '\\') j += 2;
      else if (c === '"') return j + 1;
      else if (c === '$' && src[j + 1] === '(') j = skipBal(j + 2, ')') + 1;
      else if (c === '`') j = skipBT(j + 1);
      else j++;
    }
    throw new ShellError('unterminated double quote');
  };
  // index of the closing `close` that matches an opener just before j (quotes, nesting and here-documents skipped)
  function skipBal(j, close) {
    const docs = [];
    while (j < n) {
      const c = src[j];
      if (c === '\\') j += 2;
      else if (c === "'") j = skipSQ(j + 1);
      else if (c === '"') j = skipDQ(j + 1);
      else if (c === '`') j = skipBT(j + 1);
      else if (c === '$' && src[j + 1] === '(') j = skipBal(j + 2, ')') + 1;
      else if (c === '(' && close === ')') j = skipBal(j + 1, ')') + 1;
      else if (c === '{' && close === '}') j = skipBal(j + 1, '}') + 1;
      else if (c === '<' && src[j + 1] === '<' && src[j + 2] !== '<') {
        j += 2; const strip = src[j] === '-'; if (strip) j++;
        while (src[j] === ' ' || src[j] === '\t') j++;
        let d = '';
        while (j < n && !/[\s;&|<>()]/.test(src[j])) { if (src[j] === "'" || src[j] === '"' || src[j] === '\\') { j++; continue; } d += src[j++]; }
        if (d) docs.push({ d, strip });
      } else if (c === '\n' && docs.length) {
        j++;
        for (const { d, strip } of docs.splice(0)) {
          for (;;) {
            const e = src.indexOf('\n', j); const line = src.slice(j, e < 0 ? n : e);
            j = e < 0 ? n : e + 1;
            if ((strip ? line.replace(/^\t+/, '') : line) === d || e < 0) break;
          }
        }
      } else if (c === close) return j;
      else j++;
    }
    throw new ShellError(`unbalanced ${close}`);
  }

  function expansion(parts, q) {             // at src[i] === '$'
    const c = src[i + 1];
    if (c === '(' && src[i + 2] === '(') {
      const e = src.indexOf('))', i + 3);
      if (e >= 0) { i = e + 2; parts.push({ k: 'dyn' }); return; }
    }
    if (c === '(') { const e = skipBal(i + 2, ')'); nested(src.slice(i + 2, e)); i = e + 1; parts.push({ k: 'dyn' }); return; }
    if (c === '{') {
      const e = skipBal(i + 2, '}'); const inner = src.slice(i + 2, e); i = e + 1;
      if (/^[A-Za-z_]\w*$/.test(inner)) parts.push({ k: 'var', name: inner, q });
      else { if (/\$\(|`/.test(inner)) throw new ShellError('substitution inside ${}'); parts.push({ k: 'dyn' }); }
      return;
    }
    const m = /^[A-Za-z_]\w*/.exec(src.slice(i + 1, i + 200));
    if (m) { parts.push({ k: 'var', name: m[0], q }); i += 1 + m[0].length; return; }
    if (c !== undefined && /[0-9@*#?$!-]/.test(c)) { parts.push({ k: 'dyn' }); i += 2; return; }
    parts.push({ k: 'lit', v: '$', q: true }); i++;
  }
  function ansiC() {                          // at src[i] === '$' and src[i+1] === "'"
    let j = i + 2, v = '';
    for (; j < n && src[j] !== "'"; j++) {
      if (src[j] !== '\\') { v += src[j]; continue; }
      const r = src.slice(j + 1, j + 9); let m;
      if ((m = /^x([0-9a-fA-F]{1,2})/.exec(r))) { v += String.fromCharCode(parseInt(m[1], 16)); j += m[0].length; }
      else if ((m = /^u([0-9a-fA-F]{1,4})/.exec(r))) { v += String.fromCharCode(parseInt(m[1], 16)); j += m[0].length; }
      else if ((m = /^[0-7]{1,3}/.exec(r))) { v += String.fromCharCode(parseInt(m[0], 8)); j += m[0].length; }
      else { const map = { n: '\n', t: '\t', r: '\r', e: '\x1b', a: '\x07', b: '\b', f: '\f', v: '\v' }; v += map[src[j + 1]] ?? src[j + 1] ?? ''; j++; }
    }
    if (j >= n) throw new ShellError('unterminated $\' quote');
    i = j + 1; return { k: 'lit', v, q: true };
  }
  function readWord() {
    const parts = [];
    while (i < n) {
      const c = src[i];
      if (/[\s;&|<>()]/.test(c)) break;
      if (c === "'") { const e = skipSQ(i + 1); parts.push({ k: 'lit', v: src.slice(i + 1, e - 1), q: true }); i = e; }
      else if (c === '"') {
        i++; let v = ''; const push = () => { parts.push({ k: 'lit', v, q: true }); v = ''; };
        for (;;) {
          if (i >= n) throw new ShellError('unterminated double quote');
          const d = src[i];
          if (d === '"') { i++; break; }
          if (d === '\\') { const x = src[i + 1]; if (x === '\n') i += 2; else if (x !== undefined && '$`"\\'.includes(x)) { v += x; i += 2; } else { v += d; i++; } }
          else if (d === '$') { push(); expansion(parts, true); }
          else if (d === '`') { push(); const e = skipBT(i + 1); nested(src.slice(i + 1, e - 1).replace(/\\`/g, '`')); i = e; parts.push({ k: 'dyn' }); }
          else { v += d; i++; }
        }
        push();
      } else if (c === '\\') { if (src[i + 1] === '\n') i += 2; else { parts.push({ k: 'lit', v: src[i + 1] ?? '\\', q: true }); i += 2; } }
      else if (c === '$' && src[i + 1] === "'") parts.push(ansiC());
      else if (c === '$') expansion(parts, false);
      else if (c === '`') { const e = skipBT(i + 1); nested(src.slice(i + 1, e - 1).replace(/\\`/g, '`')); i = e; parts.push({ k: 'dyn' }); }
      else {
        let j = i; while (j < n && !/[\s;&|<>()'"\\$`]/.test(src[j])) j++;
        parts.push({ k: 'lit', v: src.slice(i, j), q: false }); i = j;
      }
    }
    return { parts };
  }
  const blanks = () => { while (i < n && (src[i] === ' ' || src[i] === '\t' || src[i] === '\r')) i++; };
  const literal = (w) => w.parts.map((p) => (p.k === 'lit' ? p.v : '')).join('');

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === '\n') {
      flush('\n'); i++;
      for (const h of pending.splice(0)) {
        const lines = [];
        for (;;) {
          const e = src.indexOf('\n', i); const line = src.slice(i, e < 0 ? n : e);
          i = e < 0 ? n : e + 1;
          if ((h.strip ? line.replace(/^\t+/, '') : line) === h.delim) break;
          lines.push(line);
          if (e < 0) break;
        }
        h.redirect.body = lines.join('\n');
      }
      continue;
    }
    if (c === '#' && (i === 0 || /[\s;&|()]/.test(src[i - 1]))) { const e = src.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if ((c === '<' || c === '>') && src[i + 1] === '(') {       // process substitution
      const e = skipBal(i + 2, ')'); nested(src.slice(i + 2, e)); i = e + 1; cur.words.push({ parts: [{ k: 'dyn' }] }); continue;
    }
    const fd = /^(\d*)(&>>|&>|<<<|<<-|<<|<&|<>|>>|>&|>\||>|<)/.exec(src.slice(i, i + 8));
    if (fd) {
      // a digit run counts as a descriptor only when it is glued to the operator (`2>`), which the regex requires
      i += fd[0].length; const op = fd[2]; blanks();
      const word = readWord();
      if (!word.parts.length) throw new ShellError('redirect without a target');
      const r = { op, word };
      if (op === '<<' || op === '<<-') pending.push({ redirect: r, delim: literal(word), strip: op === '<<-' });
      cur.redirects.push(r);
      continue;
    }
    if (c === ';' || c === '&' || c === '|' || c === '(' || c === ')') {
      const two = src.slice(i, i + 2);
      const op = ['&&', '||', ';;', '|&'].includes(two) ? two : c;
      flush(op); i += op.length; continue;
    }
    const before = i;
    const w = readWord();
    if (i === before) throw new ShellError('lexer made no progress');
    const first = w.parts[0];
    const am = !cur.words.length && first && first.k === 'lit' && !first.q ? /^([A-Za-z_]\w*)\+?=/.exec(first.v) : null;
    if (am) cur.assigns.push({ name: am[1], word: { parts: [{ ...first, v: first.v.slice(am[0].length) }, ...w.parts.slice(1)] } });
    else cur.words.push(w);
  }
  flush('');
  return out;
}

const escGlob = (v) => v.replace(/[*?[\]\\]/g, '\\$&');
// word -> [{ text, dynamic, tail, pat, glob, alts }] (an unquoted variable holding blanks splits into words)
function resolveWord(word, env) {
  const ps = word.parts;
  if (ps.length === 1 && ps[0].k === 'var' && !ps[0].q && env.has(ps[0].name) && /\s/.test(env.get(ps[0].name))) {
    return env.get(ps[0].name).split(/\s+/).filter(Boolean).map((t) => ({ text: t, dynamic: false, tail: t, pat: escGlob(t), glob: false, alts: null }));
  }
  let text = '', dynamic = false, tail = '', pat = '', glob = false, brace = false;
  for (const p of ps) {
    if (p.k === 'lit') {
      text += p.v; tail += p.v; pat += p.q ? escGlob(p.v) : p.v;
      if (!p.q && /[*?]|[[^]]+]/.test(p.v)) glob = true;          // a lone `[` (the test command) is not a pattern
      if (!p.q && /\{[^{}]*,[^{}]*\}/.test(p.v)) brace = true;
    } else if (p.k === 'var' && env.has(p.name)) { const v = env.get(p.name); text += v; tail += v; pat += escGlob(v); }
    else { dynamic = true; tail = ''; }
  }
  let alts = null;
  if (brace) {
    if (ps.length === 1) {
      alts = [text];
      for (let k = 0; k < 6; k++) alts = alts.flatMap((t) => { const m = /\{([^{}]*,[^{}]*)\}/.exec(t); return m ? m[1].split(',').map((x) => t.slice(0, m.index) + x + t.slice(m.index + m[0].length)) : [t]; }).slice(0, 256);
    } else dynamic = true;
  }
  return [{ text, dynamic, tail, pat, glob, alts }];
}
// expand a shell glob against the file system (dot files only when the segment starts with a dot)
function fsGlob(pat, cwd) {
  const segs = pat.split('/'); let cur = [pat.startsWith('/') ? '/' : ''];
  const has = (s) => /(^|[^\\])[*?[]/.test(s);
  const unesc = (s) => s.replace(/\\(.)/g, '$1');
  for (const seg of segs) {
    if (seg === '') continue;
    const next = [];
    if (!has(seg)) for (const b of cur) next.push(b ? `${b.replace(/\/$/, '')}/${unesc(seg)}` : unesc(seg));
    else {
      let re = '';
      for (let k = 0; k < seg.length; k++) {
        const c = seg[k];
        if (c === '\\') { re += (seg[++k] ?? '').replace(/[\\^$.|+()[\]{}*?]/g, '\\$&'); }
        else if (c === '*') re += '.*'; else if (c === '?') re += '.';
        else if (c === '[') { const e = seg.indexOf(']', k + 2); if (e < 0) re += '\\['; else { re += `[${seg.slice(k + 1, e).replace(/^!/, '^').replace(/\\/g, '\\\\')}]`; k = e; } }
        else re += c.replace(/[\\^$.|+()[\]{}]/g, '\\$&');
      }
      let rx; try { rx = new RegExp(`^${re}$`); } catch { return [unesc(pat)]; }
      for (const b of cur) {
        let names; try { names = readdirSync(resolve(cwd, b || '.')); } catch { continue; }
        for (const nm of names) { if (nm[0] === '.' && seg[0] !== '.') continue; if (rx.test(nm)) next.push(b ? `${b.replace(/\/$/, '')}/${nm}` : nm); if (next.length > 5000) return next; }
      }
    }
    cur = next;
  }
  return cur.length ? cur : [unesc(pat)];
}
function pathsOf(w, st) {
  if (w.dynamic) return [];
  let texts = w.alts ?? [w.text];
  if (w.glob && !w.alts) texts = fsGlob(w.pat, st.cwd);
  return texts.map((t) => (t === '~' ? st.home : t.startsWith('~/') ? `${st.home}/${t.slice(2)}` : t));
}

// ---------------------------------------------------------------------------------------------------
// rule checks
// ---------------------------------------------------------------------------------------------------
function stripComments(text, file) {
  if (/\.(py|rb|sh|bash|ya?ml|toml)$/i.test(file)) return text.replace(/#.*$/gm, '');
  let out = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '/' && text[i + 1] === '/' && text[i - 1] !== ':') { const e = text.indexOf('\n', i); if (e < 0) break; i = e - 1; }
    else if (text[i] === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); if (e < 0) break; i = e + 1; }
    else out += text[i];
  }
  return out;
}
function countIdents(text, names, prefix) {
  let nHit = 0;
  for (const m of text.matchAll(/[A-Za-z_$][\w$]*/g)) {
    const id = m[0];
    if (names.some((nm) => id === nm || (prefix && id.startsWith(nm) && /[A-Z_]/.test(id[nm.length])))) nHit++;
  }
  return nHit;
}

// a write to one path. how = { tool, ti } for a file tool, { bash: true, recursive } for a shell command
function checkWrite(S, p, cwd, how) {
  const f = pathForms(S, p, cwd);
  const dir = how.recursive && isDir(f.abs);
  const hit = (globs) => matchAny(f.forms, globs, S.ci) || (dir && dirHolds(f.abs, f.forms, globs, S.ci));
  if (hit(S.protect)) throw new Block('_enforce-self', 'the enforcement settings, hook and log are not writable');
  for (const r of S.rules) {
    if (r.kind === 'deny_path' && r.access !== 'read' && hit(r.paths)) throw new Block(r.id, `writing ${p} is not allowed for this role (${r.id})`);
    if (r.kind === 'allow_write_only' && f.inside) {
      const ok = matchAny(f.rel, r.paths, S.ci) || (dir && f.rel.some((x) => arr(r.paths).some((g) => globRe(g, S.ci).test(`${x}/x`))));
      if (!ok) throw new Block(r.id, `${p} is outside the paths this task may change (${r.id})`);
    }
    if (r.kind === 'guard_edit' && hit(r.paths) && lexists(f.abs)) {
      let before = null, after = null;
      if (!how.bash && !dir) {
        try { before = readFileSync(f.abs, 'utf8'); } catch { before = null; }
        const ti = how.ti ?? {};
        if (before !== null && how.tool === 'Write' && typeof ti.content === 'string') after = ti.content;
        else if (before !== null && how.tool === 'Edit' && typeof ti.old_string === 'string' && typeof ti.new_string === 'string') {
          if (before.includes(ti.old_string)) after = ti.replace_all ? before.split(ti.old_string).join(ti.new_string) : before.replace(ti.old_string, () => ti.new_string);
          else { before = ti.old_string; after = ti.new_string; }
        } else if (before !== null && how.tool === 'MultiEdit' && Array.isArray(ti.edits)) {
          after = before;
          for (const e of ti.edits) if (typeof e?.old_string === 'string' && typeof e?.new_string === 'string') after = e.replace_all ? after.split(e.old_string).join(e.new_string) : after.replace(e.old_string, () => e.new_string);
        }
      }
      if (before === null || after === null) throw new Block(r.id, `${p} is guarded: change it with the Edit or Write tool so that the change can be checked (${r.id})`);
      const b = stripComments(before, f.abs), a = stripComments(after, f.abs);
      if (arr(r.must_not_decrease).length && countIdents(a, arr(r.must_not_decrease), true) < countIdents(b, arr(r.must_not_decrease), true)) throw new Block(r.id, `this edit removes ${arr(r.must_not_decrease).join(' / ')} calls from ${p} (${r.id})`);
      if (arr(r.must_not_increase).length && countIdents(a, arr(r.must_not_increase), false) > countIdents(b, arr(r.must_not_increase), false)) throw new Block(r.id, `this edit adds ${arr(r.must_not_increase).join(' / ')} to ${p} (${r.id})`);
    }
  }
}
// a read of one path. A shell argument is a path only if it exists (`grep secret src/` names no file)
function checkRead(S, p, cwd, mustExist) {
  const f = pathForms(S, p, cwd);
  if (mustExist && !lexists(f.abs)) return;
  if (matchAny(f.forms, S.protect, S.ci)) S.observe.push('_enforce-self-read');
  for (const r of S.rules) if (r.kind === 'deny_path' && r.access !== 'write' && matchAny(f.forms, r.paths, S.ci)) throw new Block(r.id, `reading ${p} is not allowed for this role (${r.id})`);
}

const VALUE_OPTS = { git: ['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--config-env'], gh: ['-R', '--repo', '--hostname'] };
function positionals(prog, args) {
  const out = []; const vo = VALUE_OPTS[prog] ?? [];
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (!a.dynamic && a.text === '--') { out.push(...args.slice(k + 1)); break; }
    if (!a.dynamic && a.text.startsWith('-') && a.text !== '-') { if (vo.includes(a.text)) k++; continue; }
    out.push(a);
  }
  return out;
}
const hasFlag = (args, flag) => args.some((a) => !a.dynamic && (a.text === flag || a.text.startsWith(`${flag}=`) || (/^-[A-Za-z]$/.test(flag) && /^-[A-Za-z]+$/.test(a.text) && a.text.includes(flag[1]))));

function checkCommandRules(S, prog, args, open) {
  const pos = positionals(prog, args);
  for (const r of S.rules) {
    if (r.kind !== 'deny_command' || !arr(r.program).includes(prog)) continue;
    let ok = true;
    for (let k = 0; k < arr(r.subcommand).length && ok; k++) {
      const w = pos[k];
      if (!w) { if (open) throw new Block('_unresolvable', `the ${prog} sub-command comes from input the hook cannot see`, { near: r.id }); ok = false; }
      else if (w.dynamic || w.alts || w.glob) throw new Block('_unresolvable', `the ${prog} sub-command is not a literal word`, { near: r.id });
      else if (w.text !== r.subcommand[k]) ok = false;
    }
    if (!ok) continue;
    if (r.bare_only && (args.length || open)) continue;
    if (r.flags_any && !r.flags_any.some((fl) => hasFlag(args, fl))) continue;
    if (r.args_any && !pos.some((w) => !w.dynamic && matchAny([w.text], r.args_any, false))) continue;
    if (r.option_values) {
      let hit = false;
      for (let k = 0; k < args.length && !hit; k++) {
        const a = args[k]; if (a.dynamic) continue;
        for (const o of r.option_values.options) {
          let v = null;
          if (a.text === o) v = args[k + 1] ?? null; else if (a.text.startsWith(`${o}=`)) v = { text: a.text.slice(o.length + 1), dynamic: false };
          if (v === null) continue;
          if (v.dynamic) throw new Block('_unresolvable', `the value of ${o} is not a literal word`, { near: r.id });
          if (v.text.split(',').some((x) => matchAny([x.trim()], r.option_values.values, false))) hit = true;
        }
      }
      if (!hit) continue;
    }
    throw new Block(r.id, `${prog}${arr(r.subcommand).length ? ` ${r.subcommand.join(' ')}` : ''} is not allowed for this role (${r.id})`);
  }
}

const git = (dir, argv) => { const r = spawnSync('git', ['-C', dir, ...argv], { encoding: 'utf8', timeout: 3000 }); return r.status === 0 ? r.stdout.trim() : null; };
function checkPush(S, st, rule, args) {
  // args = everything after `git`
  let dir = st.cwd;
  for (let k = 0; k < args.length; k++) if (!args[k].dynamic && args[k].text === '-C' && args[k + 1] && !args[k + 1].dynamic) dir = resolve(dir, args[k + 1].text);
  const pos = positionals('git', args);
  const at = args.indexOf(pos[0]);
  const rest = args.slice(at + 1);
  const refs = arr(rule.refs);
  const isProtected = (name) => matchAny([name.replace(/^refs\/heads\//, '')], refs, false);
  const current = () => { const b = st.cwdKnown ? git(dir, ['symbolic-ref', '--quiet', '--short', 'HEAD']) : null; if (b === null) throw new Block('_unresolvable', 'git push: the current branch cannot be resolved', { near: rule.id }); return b; };
  const plain = []; let del = false;
  for (let k = 0; k < rest.length; k++) {
    const a = rest[k];
    if (a.dynamic || a.alts) throw new Block('_unresolvable', 'git push: an argument is not a literal word', { near: rule.id });
    const t = a.text;
    if (t === '--all' || t === '--mirror' || t === '--branches') throw new Block(rule.id, `git push ${t} would update a protected branch (${rule.id})`);
    if (t === '--delete' || t === '-d') { del = true; continue; }
    if (['-o', '--push-option', '--receive-pack', '--exec', '--repo'].includes(t)) { k++; continue; }
    if (t.startsWith('-') && t !== '-') continue;
    plain.push(t);
  }
  const specs = plain.slice(1);
  if (!specs.length) {
    const b = current();
    if (isProtected(b)) throw new Block(rule.id, `git push from ${b} would update a protected branch (${rule.id})`);
    const up = git(dir, ['config', '--get', `branch.${b}.merge`]);
    if (up && isProtected(up)) throw new Block(rule.id, `git push: the upstream of ${b} is a protected branch (${rule.id})`);
    if (git(dir, ['config', '--get-regexp', '^remote\\..*\\.push$'])) throw new Block('_unresolvable', 'git push: a configured push refspec decides the destination', { near: rule.id });
    if (git(dir, ['config', '--get', 'push.default']) === 'matching') throw new Block(rule.id, `git push with push.default=matching would update a protected branch (${rule.id})`);
    return;
  }
  for (let k = 0; k < specs.length; k++) {
    let s = specs[k];
    if (s === 'tag') { k++; continue; }
    if (s.startsWith('+')) s = s.slice(1);
    if (s === ':' || s.includes('*')) throw new Block(rule.id, `git push with a wildcard refspec would update a protected branch (${rule.id})`);
    let dst = s.includes(':') ? s.slice(s.indexOf(':') + 1) : s;
    if (dst === '' || dst === 'HEAD' || dst === '@') dst = del ? dst : current();
    if (/^refs\/(?!heads\/)/.test(dst)) continue;
    if (isProtected(dst)) throw new Block(rule.id, `pushing to ${dst} is not allowed for this role (${rule.id})`);
  }
}

// which arguments does a program write? -> { words, recursive } | null
function writeTargets(prog, args) {
  const pos = positionals(prog, args);
  const flagLike = (re) => args.some((a) => !a.dynamic && re.test(a.text));
  const lastOrT = () => { const t = args.findIndex((a) => !a.dynamic && (a.text === '-t' || a.text === '--target-directory')); return t >= 0 && args[t + 1] ? [args[t + 1]] : pos.slice(-1); };
  switch (prog) {
    case 'rm': case 'rmdir': case 'unlink': case 'shred': case 'truncate': case 'touch': case 'chmod': case 'chown': case 'chgrp': case 'mv':
      return { words: pos, recursive: true };
    case 'tee': return { words: pos, recursive: false };
    case 'cp': case 'install': case 'rsync': case 'ln': return { words: lastOrT(), recursive: true };
    case 'dd': return { words: args.filter((a) => !a.dynamic && a.text.startsWith('of=')).map((a) => ({ ...a, text: a.text.slice(3), glob: false, alts: null })), recursive: false };
    case 'sed': return flagLike(/^(-[A-Za-z]*i|--in-place)/) ? { words: pos, recursive: false } : null;
    case 'perl': case 'ruby': return flagLike(/^-[A-Za-z0-9]*i/) ? { words: pos, recursive: false } : null;
    case 'awk': case 'gawk': return flagLike(/^inplace$/) ? { words: pos, recursive: false } : null;
    case 'git': {
      const sub = pos[0];
      if (!sub || sub.dynamic || !['checkout', 'restore', 'rm', 'mv', 'clean'].includes(sub.text)) return null;
      // index-only forms leave the files alone
      if (sub.text === 'rm' && flagLike(/^--cached$/)) return null;
      if (sub.text === 'restore' && flagLike(/^(--staged|-S)$/) && !flagLike(/^(--worktree|-W)$/)) return null;
      const dd = args.findIndex((a) => !a.dynamic && a.text === '--');
      const after = dd >= 0 ? args.slice(dd + 1) : [];
      return { words: pos.slice(1).filter((w) => !after.includes(w)), existing: true, always: after, recursive: true };
    }
    default: return null;
  }
}

const SHELLS = new Set(['sh', 'bash', 'dash', 'zsh', 'ksh', 'ash']);
const KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'while', 'until', '{', '}', '!', 'time', 'coproc']);
const SKIP_HEADS = new Set(['for', 'select', 'case', 'esac', 'function', '[[', ']]', 'in']);
const NOT_PATHS = new Set(['echo', 'printf', ':', 'true', 'false']);

function analyse(S, st, c, argv, depth, open = false) {
  if (depth > 8) throw new Block('_fail-closed', 'command nesting too deep');
  if (!argv.length) return;
  const w0 = argv[0];
  if (w0.alts || w0.glob) throw new Block('_unresolvable', 'the program name is not a literal word');
  const name = w0.dynamic ? (w0.tail.includes('/') ? w0.tail : null) : w0.text;
  if (name === null) throw new Block('_unresolvable', 'the program name comes from an expansion the hook cannot resolve');
  const prog = basename(posix(name)).replace(/\.exe$/i, '');
  const args = argv.slice(1);
  const lit = (a) => a && !a.dynamic ? a.text : null;
  const script = (text) => runScript(S, st, text, depth + 1);

  if (KEYWORDS.has(prog)) return analyse(S, st, c, args, depth + 1, open);
  if (SKIP_HEADS.has(prog)) return;
  const dropFlags = (valued = []) => { let k = 0; while (k < args.length && lit(args[k])?.startsWith('-')) k += valued.includes(args[k].text) ? 2 : 1; return args.slice(k); };
  switch (prog) {
    case 'command': case 'builtin': case 'exec': case 'nohup': case 'setsid': case 'stdbuf': return analyse(S, st, c, dropFlags(), depth + 1, open);
    case 'nice': case 'ionice': return analyse(S, st, c, dropFlags(['-n', '-c', '-p']), depth + 1, open);
    case 'sudo': case 'doas': return analyse(S, st, c, dropFlags(['-u', '-g', '-h', '-p', '-C', '-D', '-R', '-T', '-r', '-t', '-U']), depth + 1, open);
    case 'timeout': return analyse(S, st, c, dropFlags(['-s', '--signal', '-k', '--kill-after']).slice(1), depth + 1, open);
    case 'xargs': return analyse(S, st, c, dropFlags(['-I', '-n', '-P', '-d', '-L', '-s', '-a', '-E', '--max-args', '--max-procs', '--delimiter', '--arg-file', '--replace']), depth + 1, true);
    case 'env': {
      let k = 0;
      for (; k < args.length; k++) {
        const t = lit(args[k]);
        if (t === null) break;
        if (t === '-S' || t === '--split-string') { if (!lit(args[k + 1])) throw new Block('_unresolvable', 'env -S with a value that is not a literal'); script(args[k + 1].text); return; }
        if (t === '-u' || t === '--unset' || t === '-C' || t === '--chdir') { k++; continue; }
        if (t.startsWith('-') || /^[A-Za-z_]\w*=/.test(t)) continue;
        break;
      }
      if (k < args.length) return analyse(S, st, c, args.slice(k), depth + 1, open);
      break;                                                     // `env` alone: fall through to the rules
    }
    case 'eval': if (args.some((a) => a.dynamic)) throw new Block('_unresolvable', 'eval of text the hook cannot resolve'); script(args.map((a) => a.text).join(' ')); return;
    case 'alias': for (const a of args) { const t = lit(a); if (t === null) throw new Block('_unresolvable', 'alias with a value that is not a literal'); if (t.includes('=')) script(t.slice(t.indexOf('=') + 1)); } return;
    case 'cd': case 'pushd': {
      const t = args.length ? lit(args.find((a) => !lit(a)?.startsWith('-')) ?? args[0]) : st.home;
      if (t === null || t === '-') st.cwdKnown = false; else st.cwd = resolve(st.cwd, t === '~' ? st.home : t.startsWith('~/') ? `${st.home}/${t.slice(2)}` : t);
      return;
    }
    case 'export': case 'declare': case 'local': case 'readonly': case 'typeset':
      for (const a of args) { const m = lit(a) && /^([A-Za-z_]\w*)=(.*)$/s.exec(a.text); if (m) st.env.set(m[1], m[2]); else if (a.dynamic && /^[A-Za-z_]\w*=/.test(a.tail)) st.env.delete(a.tail.split('=')[0]); }
      return;
    default:
  }
  if (SHELLS.has(prog)) {
    const ci = args.findIndex((a) => lit(a) !== null && /^-[A-Za-z]*c[A-Za-z]*$/.test(a.text));
    if (ci >= 0) { const s = args[ci + 1]; if (!s || s.dynamic) throw new Block('_unresolvable', `${prog} -c with a script the hook cannot resolve`); script(s.text); return; }
    const file = positionals(prog, args)[0];
    if (!file) {
      let fed = false;
      for (const r of c.redirects) {
        if (r.op === '<<<') { const [w] = resolveWord(r.word, st.env); if (w.dynamic) throw new Block('_unresolvable', `${prog} reads a script the hook cannot resolve`); script(w.text); fed = true; }
        if ((r.op === '<<' || r.op === '<<-') && typeof r.body === 'string') { script(r.body); fed = true; }
      }
      if (!fed && (c.pipedIn || open)) throw new Block('_opaque-shell', `${prog} reads its commands from a pipe, which the hook cannot see`);
      return;
    }
  }
  if (prog === 'find') {
    for (let k = 0; k < args.length; k++) {
      const t = lit(args[k]);
      if (t === '-exec' || t === '-execdir' || t === '-ok' || t === '-okdir') {
        let e = k + 1; while (e < args.length && lit(args[e]) !== ';' && lit(args[e]) !== '+') e++;
        analyse(S, st, c, args.slice(k + 1, e).filter((a) => lit(a) !== '{}'), depth + 1, true); k = e;
      }
    }
    if (args.some((a) => lit(a) === '-delete')) for (const a of args) { if (lit(a)?.startsWith('-')) break; for (const p of pathsOf(a, st)) checkWrite(S, p, st.cwd, { bash: true, recursive: true }); }
  }

  checkCommandRules(S, prog, args, open);
  if (prog === 'git') {
    const pos = positionals('git', args);
    const gitRules = S.rules.some((r) => r.kind === 'deny_ref_push' || (r.kind === 'deny_command' && arr(r.program).includes('git')));
    if (gitRules) {
      const near = { near: S.rules.find((r) => r.kind === 'deny_ref_push' || (r.kind === 'deny_command' && arr(r.program).includes('git'))).id };
      for (let k = 0; k < args.length; k++) if (lit(args[k]) === '-c' && (args[k + 1]?.dynamic || /^alias\./i.test(args[k + 1]?.text ?? ''))) throw new Block('_unresolvable', 'git -c alias.* hides the sub-command', near);
      if (pos[0]?.dynamic) throw new Block('_unresolvable', 'the git sub-command is not a literal word', near);
      if (lit(pos[0]) === 'config' && pos.filter((w) => !w.dynamic && /^alias\./i.test(w.text)).length && pos.length >= 3) throw new Block('_unresolvable', 'defining a git alias hides the sub-command', near);
    }
    if (lit(pos[0]) === 'push') for (const r of S.rules) if (r.kind === 'deny_ref_push') checkPush(S, st, r, args);
  }

  // paths named by this command
  let cwd = st.cwd;
  if (prog === 'git') for (let k = 0; k < args.length; k++) if (lit(args[k]) === '-C' && lit(args[k + 1]) !== null) cwd = resolve(cwd, args[k + 1].text);
  if (NOT_PATHS.has(prog)) return;
  const wt = writeTargets(prog, args);
  const written = new Set();
  if (wt) {
    for (const w of wt.words) for (const p of pathsOf(w, st)) { if (wt.existing && !lexists(resolve(cwd, p))) continue; written.add(w); checkWrite(S, p, cwd, { bash: true, recursive: wt.recursive }); }
    for (const w of wt.always ?? []) for (const p of pathsOf(w, st)) { written.add(w); checkWrite(S, p, cwd, { bash: true, recursive: wt.recursive }); }
  }
  for (const a of args) {
    if (a.dynamic) continue;
    const eq = /^--?[\w-]+=(.+)$/s.exec(a.text);
    if (a.text.startsWith('-') && !eq) continue;
    const cand = eq ? [eq[1]] : pathsOf(a, st);
    for (const p of cand) { if (/\s/.test(p) && !lexists(resolve(cwd, p))) continue; checkRead(S, p, cwd, true); }
  }
}

function runCommand(S, st, c, depth) {
  for (const a of c.assigns) { const [w] = resolveWord(a.word, st.env); if (w.dynamic) st.env.delete(a.name); else st.env.set(a.name, w.text); }
  const argv = c.words.flatMap((w) => resolveWord(w, st.env));
  analyse(S, st, c, argv, depth);
  for (const r of c.redirects) {
    if (['<<', '<<-', '<<<', '<&'].includes(r.op)) continue;
    const [w] = resolveWord(r.word, st.env);
    if (w.dynamic) continue;
    if (r.op === '>&' && /^(\d+|-)$/.test(w.text)) continue;
    for (const p of pathsOf(w, st)) { if (r.op === '<') checkRead(S, p, st.cwd, true); else checkWrite(S, p, st.cwd, { bash: true }); }
  }
}
function runScript(S, st, text, depth) {
  if (depth > 8) throw new Block('_fail-closed', 'command nesting too deep');
  let cmds;
  try { cmds = parseShell(text); } catch (e) { if (e instanceof ShellError) throw new Block('_fail-closed', `the shell command cannot be parsed (${e.message})`); throw e; }
  for (const c of cmds) runCommand(S, st, c, depth);
}

const FILE_PARAM = { Read: 'file_path', Edit: 'file_path', Write: 'file_path', MultiEdit: 'file_path', NotebookEdit: 'notebook_path', Grep: 'path', Glob: 'path' };
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

// Decide one tool call. Returns { decision: 'allow' | 'deny', rule, kind, reason, near, observe }.
export function decide(input, rules, ctx = {}) {
  const S = { rules: rules.rules ?? [], observe: [], ci: (ctx.platform ?? process.platform) === 'win32' || (ctx.platform ?? process.platform) === 'darwin' };
  const done = (decision, rule = null, reason = '', near) => ({ decision, rule, kind: S.rules.find((r) => r.id === rule)?.kind ?? null, reason, near, observe: S.observe });
  try {
    if (!input || typeof input !== 'object' || typeof input.tool_name !== 'string' || !input.tool_input || typeof input.tool_input !== 'object') throw new Block('_fail-closed', 'the hook input has no tool_name / tool_input');
    if (!Array.isArray(rules.rules)) throw new Block('_fail-closed', 'the rules file has no rules');
    const tool = input.tool_name, ti = input.tool_input;
    const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : (ctx.cwd ?? process.cwd());
    const root = posix(resolve(ctx.root ?? process.env.CLAUDE_PROJECT_DIR ?? cwd));
    S.roots = [...new Set([root, realish(root)])];
    const self = [ctx.hookDir, ...arr(rules.protect), ctx.logPath].filter(Boolean).map((p) => posix(resolve(cwd, p)));
    S.protect = [...self.flatMap((p) => [p, `${p}/**`, realish(p), `${realish(p)}/**`]), '.claude/settings.json', '.claude/settings.local.json'];

    for (const r of S.rules) if (r.kind === 'deny_tool' && arr(r.tools).includes(tool)) throw new Block(r.id, `the ${tool} tool is not allowed for this role (${r.id})`);
    if (tool === 'PowerShell') throw new Block('_unparsed-shell', 'PowerShell commands cannot be checked by this hook; use Bash');
    if (FILE_PARAM[tool]) {
      let p = ti[FILE_PARAM[tool]];
      if (p === undefined && (tool === 'Grep' || tool === 'Glob')) p = cwd;
      if (typeof p !== 'string' || !p) throw new Block('_fail-closed', `the ${tool} call has no ${FILE_PARAM[tool]}`);
      if (WRITE_TOOLS.has(tool)) checkWrite(S, p, cwd, { tool, ti }); else checkRead(S, p, cwd, false);
    } else if (tool === 'Bash') {
      if (typeof ti.command !== 'string') throw new Block('_fail-closed', 'the Bash call has no command');
      if (ti.command.length > 200000) throw new Block('_fail-closed', 'the command is too long to check');
      const home = posix(ctx.home ?? homedir());
      runScript(S, { env: new Map([['HOME', home], ['PWD', posix(cwd)]]), cwd, cwdKnown: true, home }, ti.command, 0);
    }
    return done('allow');
  } catch (e) {
    if (e instanceof Block) return done('deny', e.rule, e.message, e.extra?.near);
    return done('deny', '_fail-closed', `the hook failed (${e?.message ?? e})`);
  }
}

// ---------------------------------------------------------------------------------------------------
// command line: read the PreToolUse JSON from stdin, log, exit 2 to block
// ---------------------------------------------------------------------------------------------------
function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const logPath = process.env[LOG_ENV] || null;
  let raw = '', input = null, rules = { rules: null }, d;
  try { raw = readFileSync(0, 'utf8'); } catch { raw = ''; }
  try {
    rules = JSON.parse(readFileSync(join(here, 'enforce-rules.json'), 'utf8'));
    try { input = JSON.parse(raw); } catch { input = null; }
    d = input === null
      ? { decision: 'deny', rule: '_fail-closed', kind: null, reason: 'the hook input is not JSON', observe: [] }
      : decide(input, rules, { hookDir: here, logPath });
  } catch (e) {
    d = { decision: 'deny', rule: '_fail-closed', kind: null, reason: `the enforcement rules cannot be read (${e?.message ?? e})`, observe: [] };
  }
  if (logPath) {
    const base = { ts: new Date().toISOString(), role: rules.role ?? null, tool: input?.tool_name ?? null, session_id: input?.session_id ?? null, tool_use_id: input?.tool_use_id ?? null, input_sha256: createHash('sha256').update(raw).digest('hex').slice(0, 16) };
    const lines = [...d.observe.map((o) => ({ ...base, rule: o, kind: null, decision: 'observe' })), { ...base, rule: d.rule, kind: d.kind, decision: d.decision, ...(d.near ? { near: d.near } : {}) }];
    try {
      if (!existsSync(dirname(logPath))) mkdirSync(dirname(logPath), { recursive: true });
      appendFileSync(logPath, lines.map((l) => `${JSON.stringify(l)}\n`).join(''));
    } catch (e) {
      d = { decision: 'deny', rule: '_fail-closed', reason: `the decision log cannot be written (${e?.code ?? e?.message})` };
    }
  }
  if (d.decision === 'deny') { process.stderr.write(`[pit-enforce ${d.rule}] ${d.reason}\n`); process.exit(2); }
  process.exit(0);
}

const invoked = (() => { try { return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (invoked) main();
