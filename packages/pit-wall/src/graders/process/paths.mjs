// Path normalisation shared by the process graders (research §3.2 step 3).
// Agents name the same file in many forms: `/app/bin/price`, `./bin/price`, `bin\price`,
// `C:/work/repo/bin/price`, `/c/work/repo/bin/price`. Every form is reduced to a
// repository-relative path ('bin/price') when it can be; anything else stays absolute.

// Container working directories used by the runners (Harbor mounts the task at /app).
export const CONTAINER_ROOTS = ['/app', '/workspace', '/testbed', '/repo', '/src/app'];

// Collapse `.` and `..` segments. A leading `..` that escapes the root is kept.
function collapse(parts) {
  const out = [];
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..' && out.length && out.at(-1) !== '..') out.pop();
    else out.push(p);
  }
  return out;
}

// p: a path as written; cwd: repo-relative ('' = root) or absolute ('/tmp').
// Returns a repo-relative path ('bin/price', '' for the root) or an absolute one ('/tmp/x'),
// or null when the path cannot be resolved statically (it contains a variable).
export function normPath(p, cwd = '', roots = CONTAINER_ROOTS) {
  if (p == null) return null;
  let s = String(p).trim().replace(/\\/g, '/');
  if (!s) return null;
  if (s.includes('$') || s.includes('`')) return null;
  s = s.replace(/^['"]|['"]$/g, '');
  // Git-Bash (/c/x) and Windows (C:/x) drive forms: keep absolute in one form.
  s = s.replace(/^\/([a-zA-Z])\//, (_, d) => `${d.toUpperCase()}:/`).replace(/^([a-z]):\//, (_, d) => `${d.toUpperCase()}:/`);
  if (s === '~' || s.startsWith('~/')) return s;
  for (const r of roots) {
    if (s === r) return '';
    if (s.startsWith(`${r}/`)) return collapse(s.slice(r.length + 1).split('/')).join('/');
  }
  if (s.startsWith('/') || /^[A-Z]:\//.test(s)) {
    const head = s.match(/^([A-Z]:)?\//)[0];
    return head + collapse(s.slice(head.length).split('/')).join('/');
  }
  if (cwd && cwd.startsWith('/')) return `/${collapse(`${cwd}/${s}`.split('/')).join('/')}`;
  return collapse(`${cwd ? `${cwd}/` : ''}${s}`.split('/')).join('/');
}

export const isAbsolute = (p) => typeof p === 'string' && (p.startsWith('/') || /^[A-Z]:\//.test(p) || p.startsWith('~'));

// Match a written path against the known repo files: exact, or an absolute path that ends
// with a known repo path (a worktree or host checkout of the same repo). Returns the known
// path or null.
export function resolveKnown(p, known) {
  if (p == null) return null;
  if (known.has(p)) return p;
  if (isAbsolute(p)) {
    const hits = [...known].filter((k) => p.endsWith(`/${k}`));
    if (hits.length) return hits.sort((a, b) => b.length - a.length)[0];
  }
  return null;
}

// Unique known file with this basename, or null (none or ambiguous).
export function byBasename(name, known) {
  const hits = [...known].filter((k) => k === name || k.endsWith(`/${name}`));
  return hits.length === 1 ? hits[0] : null;
}

export const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const hasGlob = (s) => /[*?[{]/.test(s);

// Shell glob -> RegExp over repo-relative paths. `*` and `?` stay within one segment.
export function globRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') { if (glob[i + 1] === '*') { re += '.*'; i++; } else re += '[^/]*'; }
    else if (c === '?') re += '[^/]';
    else if (c === '[') { const j = glob.indexOf(']', i); if (j > i) { re += glob.slice(i, j + 1).replace(/^\[!/, '[^'); i = j; } else re += '\\['; }
    else if (c === '{') { const j = glob.indexOf('}', i); if (j > i) { re += `(?:${glob.slice(i + 1, j).split(',').map(esc).join('|')})`; i = j; } else re += '\\{'; }
    else re += esc(c);
  }
  return new RegExp(`^${re}$`);
}

// Expand a written argument to known files: a glob, a directory (prefix), or the path itself.
// dir=true means a directory argument should expand to the files under it (grep -r).
export function expand(arg, cwd, known, { dir = false } = {}) {
  const p = normPath(arg, cwd);
  if (p == null) return [];
  if (hasGlob(p)) { const re = globRe(p); return [...known].filter((k) => re.test(k)); }
  const k = resolveKnown(p, known);
  if (k) return [k];
  if (dir) {
    const prefix = p === '' ? '' : `${p.replace(/\/$/, '')}/`;
    const under = [...known].filter((x) => x.startsWith(prefix));
    if (under.length) return under;
  }
  return [p];
}

// Files that are tests / notes. Exported so callers can see what the defaults are.
export const TEST_RE = /(^|\/)(tests?|spec|specs|__tests__)\/|(^|\/)[^/]*([._-]test|[._-]spec)\.[^/]+$|(^|\/)test_[^/]+$/i;
export const NOTES_RE = /(^|\/)(notes|plans?|\.notes)\/|(^|\/)(PLAN|NOTES|TODO|plan|notes|todo)[^/]*\.md$|(^|\/)\.dev-state\.md$/;
