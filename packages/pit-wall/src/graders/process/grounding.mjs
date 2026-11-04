// Q2: were the cited sources actually opened (design 23 §3.2, research §3.2-3.3)?
// Citations are extracted from the agent's prose (messages, final reply, notes, commit and
// PR text), normalised, and classified by what was visible in non-error tool results written
// before the citation:
//   O opened     the target (and the cited range) was visible
//   P partial    touched, but out of range / grep hit lines only / a diff / WebFetch summary /
//                WebSearch snippet / a subagent's relay
//   M name only  seen in a listing or mentioned in some output
//   N not opened nowhere in the log before the citation (includes internal knowledge)
//   X not exist  the target does not exist in anything the record can show
//   U unknowable no locator, a negated mention, a file the agent creates later, a derived number
// The judgement never uses what the agent says about itself (research §3.1). Support is
// only S1 here (the cited token itself appears verbatim in what was seen); S2/S3/S0 need a
// judge and are left null.
//
// X is conservative: only when the record holds the end state, the path is repo-relative,
// the agent never deleted or renamed it, and it appears in no result, file or code at all.

import { eventTable } from './events.mjs';
import { authoredTexts } from './authored.mjs';
import { visibility, seen, tokenSeen, existsAnywhere } from './visibility.mjs';
import { normPath, isAbsolute, resolveKnown, byBasename, esc } from './paths.mjs';

const EXT = 'sh|bash|zsh|js|mjs|cjs|ts|tsx|jsx|py|rb|go|rs|java|kt|kts|c|h|cc|cpp|hpp|cs|php|swift|scala|json|ya?ml|toml|md|markdown|txt|html?|css|scss|svelte|vue|sql|ini|cfg|conf|lock|xml|csv|env|bats|gradle|mk|dockerfile|tf|proto|graphql';
const PATH_RE = new RegExp(String.raw`(?<![\w/.@-])((?:\.{1,2}\/|\/)?(?:[\w@.+-]+\/)*[\w@+-][\w@.+-]*)(?::(\d+)(?:[-–](\d+))?|#L(\d+)(?:-L?(\d+))?)?(?![\w/@-])`, 'g');
const HAS_EXT = new RegExp(String.raw`\.(?:${EXT})$`, 'i');
const URL_RE = /\bhttps?:\/\/[^\s)<>\]"'`]+/g;
const CMD_WORDS = /^(?:\.\/|bash|sh|zsh|git|gh|npm|npx|yarn|pnpm|node|python3?|pytest|go|cargo|make|grep|rg|cat|sed|awk|head|tail|ls|find|curl|jq|docker|deno|bun|vitest|jest|mocha|bats)\b/;
const NEGATED = /\b(no|not|never|missing|absent|without|nonexistent|non-existent)\b|n't\b|無い|ない|存在しない|ありません|しなかった/i;

// Sentence around an index (for the negation check).
function sentenceAt(text, idx) {
  const s = text.lastIndexOf('\n', idx);
  const startDot = Math.max(s, ...['. ', '。'].map((d) => text.lastIndexOf(d, idx)));
  let end = text.length;
  for (const d of ['\n', '. ', '。']) { const k = text.indexOf(d, idx); if (k !== -1 && k < end) end = k; }
  return text.slice(startDot + 1, end);
}

// Extract citations from one text. Returns [{ type, value, line?, to?, index }].
// type: path | symbol | command | url | issue | commit | number | quote
export function extractCitations(text, { topDirs = new Set(), known = new Set() } = {}) {
  const t = String(text ?? '');
  const out = [];
  const taken = []; // [start, end) spans already claimed by a citation
  const free = (a, b) => !taken.some(([x, y]) => a < y && b > x);
  const claim = (a, b) => taken.push([a, b]);
  for (const m of t.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;:!?]+$/, '');
    out.push({ type: 'url', value: url, index: m.index }); claim(m.index, m.index + m[0].length);
  }
  const isPathish = (v) => {
    if (!v || /^\d+(\.\d+)*$/.test(v) || /^v?\d+\.\d+/.test(v)) return false;
    if (known.has(v.replace(/^\.\//, ''))) return true;
    // `/dev` (a slash command) and `/100` (a division) are not paths: an absolute path needs
    // two segments or a file extension.
    if (/^\/[^/]+\/?$/.test(v) && !HAS_EXT.test(v)) return false;
    if (v.split('/').filter(Boolean).every((s) => /^\d+$/.test(s))) return false;
    const first = v.replace(/^\.\//, '').split('/')[0];
    if (v.includes('/')) return HAS_EXT.test(v) || topDirs.has(first) || /^(\.{1,2})?\//.test(v);
    return HAS_EXT.test(v);
  };
  // Code spans: a whole command, a whole path (with optional :line), a symbol, or a quote.
  for (const m of t.matchAll(/`([^`\n]+)`/g)) {
    if (!free(m.index, m.index + m[0].length)) continue;
    const body = m[1].trim();
    // Templates and placeholders (`notes/<ticket ID>.md`) locate nothing.
    if (/<[^>]+>|\{\{|\.\.\.|…/.test(body)) { claim(m.index, m.index + m[0].length); continue; }
    const pm = body.match(/^((?:\.{1,2}\/|\/)?[\w@.+/-]+?)(?::(\d+)(?:[-–](\d+))?|#L(\d+)(?:-L?(\d+))?)?$/);
    const firstWord = body.split(/\s+/)[0];
    if (pm && isPathish(pm[1])) out.push({ type: 'path', value: pm[1], line: num(pm[2] ?? pm[4]), to: num(pm[3] ?? pm[5]), index: m.index });
    else if (/\s/.test(body) && (CMD_WORDS.test(body) || isPathish(firstWord))) out.push({ type: 'command', value: body, index: m.index });
    else if (/^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*)*(?:\(\))?$/.test(body) && (/[_.:]|[a-z][A-Z]|\(\)$/.test(body))) out.push({ type: 'symbol', value: body.replace(/\(\)$/, ''), index: m.index });
    else if (body.length >= 12) out.push({ type: 'quote', value: body, index: m.index });
    else { continue; }
    claim(m.index, m.index + m[0].length);
  }
  for (const m of t.matchAll(PATH_RE)) {
    if (!free(m.index, m.index + m[0].length)) continue;
    // A sentence-final period is not part of the path.
    const v = m[1].replace(/[.,;:]+$/, '');
    if (!isPathish(v)) continue;
    out.push({ type: 'path', value: v, line: num(m[2] ?? m[4]), to: num(m[3] ?? m[5]), index: m.index });
    claim(m.index, m.index + m[0].length);
  }
  for (const m of t.matchAll(/(?:\b(?:issue|Issue|ISSUE|PR|pr|pull request|Pull request|ticket|チケット|イシュー)\s*#?\s*(\d+)\b)|(?<![\w&/#])#(\d+)\b/g)) {
    if (!free(m.index, m.index + m[0].length)) continue;
    out.push({ type: 'issue', value: Number(m[1] ?? m[2]), kind: /PR|pr|pull/i.test(m[0]) ? 'pr' : 'issue', index: m.index }); claim(m.index, m.index + m[0].length);
  }
  for (const m of t.matchAll(/\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/g)) {
    if (!free(m.index, m.index + m[0].length)) continue;
    out.push({ type: 'commit', value: m[0], index: m.index }); claim(m.index, m.index + m[0].length);
  }
  for (const m of t.matchAll(/(?<![\w.,/#:$-])(\d{3,}|\d+\.\d+|\d+%)(?![\w/:]|\.\d)/g)) {
    if (!free(m.index, m.index + m[0].length)) continue;
    out.push({ type: 'number', value: m[1], index: m.index }); claim(m.index, m.index + m[0].length);
  }
  return out.sort((a, b) => a.index - b.index);
}
const num = (x) => (x == null ? null : Number(x));

// Same URL in different forms (http/https, trailing slash, arXiv abs/pdf/html and version).
export function normUrl(u) {
  let s = String(u).trim().replace(/^http:/, 'https:').replace(/[#?].*$/, '').replace(/\/$/, '');
  const ax = s.match(/arxiv\.org\/(?:abs|pdf|html)\/(\d{4}\.\d{4,5})(?:v\d+)?/);
  if (ax) s = `arxiv:${ax[1]}`;
  return s;
}

const normCmd = (c) => String(c).replace(/\s+/g, ' ').replace(/(^| )(?:\/app\/|\.\/)/g, '$1').trim();
// A cited command matches a command that ran when its words occur in order within it: agents
// cite a short form (`sed '$d'` for `sed -i '$d' tests/t.sh`).
const words = (c) => normCmd(String(c).replace(/[;&|()]/g, ' ')).replace(/['"]/g, '').split(' ').filter(Boolean);
function cmdMatches(cited, ran) {
  const want = words(cited), have = words(ran);
  let k = 0;
  for (const w of have) if (k < want.length && w === want[k]) k++;
  return want.length > 0 && k === want.length && have.includes(want[0]);
}

// Classify one citation written at `pos`. ctx: { vis, table, gitLog }
export function classify(cit, pos, ctx, sentence = '') {
  const { vis, table } = ctx;
  const negated = NEGATED.test(sentence);
  const r = (cls, reason, extra = {}) => ({ cls, reason, support: null, ...extra });
  switch (cit.type) {
    case 'path': {
      let p = normPath(cit.value, '');
      if (p == null) return r('U', 'unresolvable');
      const k = resolveKnown(p, vis.known) ?? (!p.includes('/') ? byBasename(p, vis.known) : null);
      const target = k ?? p;
      const s = seen(vis, target, pos, { line: cit.line, to: cit.to });
      if (s) return r(s.level, s.via, { path: target });
      // A file the agent creates later (plans name what they will write). Only a creation with
      // no earlier sight of the file counts; an existing file edited later is still N.
      const future = vis.created.get(target);
      if (future != null && future >= pos && !vis.views.some((v) => v.path === target && v.pos < future) && !seen(vis, target, future)) return r('U', 'own-future-file', { path: target });
      if (vis.deleted.has(target)) return r('U', 'deleted-or-renamed', { path: target });
      if (k) return r('N', 'not-opened', { path: target });
      if (negated) return r('U', 'negated-mention', { path: target });
      if (isAbsolute(p) || !vis.hasState) return r('U', 'outside-record', { path: target });
      // A bare name ("Node.js", "config.yaml") may name a product or a file elsewhere: never X.
      if (!p.includes('/')) return r('U', 'bare-name-unresolved', { path: target });
      // Mentioned somewhere later (e.g. a later listing): it exists, it was not opened yet.
      if (vis.corpus.some((c) => c.text.includes(p)) || existsAnywhere(vis, p.replace(/^.*\//, ''))) return r('N', 'not-opened', { path: target });
      return r('X', 'not-in-record', { path: target });
    }
    case 'symbol': {
      if (writtenBefore(ctx, cit.value, pos)) return r('O', 'self', { support: 'S1' });
      const s = tokenSeen(vis, cit.value, pos);
      if (s) return r(s.level, s.via, { support: 'S1' });
      if (existsAnywhere(vis, cit.value)) return r('N', 'not-opened');
      if (negated) return r('U', 'negated-mention');
      return vis.hasState ? r('X', 'not-in-record') : r('U', 'outside-record');
    }
    case 'command': {
      const want = normCmd(cit.value);
      const ran = table.events.find((e) => e.pos < pos && e.command && cmdMatches(want, e.command));
      if (ran) return r(ran.shown ? 'O' : 'P', 'ran', { support: ran.shown ? 'S1' : null });
      const s = tokenSeen(vis, want, pos, { word: false });
      if (s) return r('M', `mentioned:${s.via}`);
      // Run only after it was written: a plan ("next: bash bin/price 999"), like a file the
      // agent creates later. Never run at all: N.
      if (table.events.some((e) => e.command && cmdMatches(want, e.command))) return r('U', 'planned-command');
      return r('N', 'never-ran');
    }
    case 'url': {
      const u = normUrl(cit.value);
      const fetched = vis.webViews.find((w) => w.pos < pos && w.url && normUrl(w.url) === u);
      if (fetched) return r(fetched.tool === 'WebFetch' ? 'P' : 'O', fetched.tool === 'WebFetch' ? 'web-summary' : fetched.tool, {});
      const s = tokenSeen(vis, cit.value, pos, { word: false }) ?? (u !== cit.value ? tokenSeen(vis, u, pos, { word: false }) : null);
      if (s) return r(s.via.startsWith('web-snippet') ? 'P' : 'M', s.via.startsWith('web-snippet') ? 'web-snippet' : `mentioned:${s.via}`);
      return r('N', 'internal-or-unseen');
    }
    case 'issue': {
      const views = vis.ghViews.filter((g) => g.number === cit.value && g.pos < pos);
      if (views.some((g) => !g.missing)) return r('O', 'gh-view', { support: 'S1' });
      const cache = [...vis.known].find((k) => new RegExp(`(^|/)(issue|pr|pull)[-_]?${cit.value}\\.(md|json|txt)$`, 'i').test(k));
      if (cache) { const s = seen(vis, cache, pos); if (s && s.level !== 'M') return r(s.level, `cache:${s.via}`); }
      if (views.length) return r('X', 'gh-not-found');
      const s = tokenSeen(vis, `#${cit.value}`, pos, { word: false }) ?? tokenSeen(vis, `issue ${cit.value}`, pos, { word: false });
      if (s) return r('M', `mentioned:${s.via}`);
      return r('N', 'not-viewed');
    }
    case 'commit': {
      const s = tokenSeen(vis, cit.value, pos, { word: false });
      if (s) return r(s.level === 'O' ? 'O' : 'P', s.via, { support: 'S1' });
      const inLog = (ctx.gitLog ?? []).some((c) => c.sha?.startsWith(cit.value));
      if (inLog || vis.corpus.some((c) => c.text.includes(cit.value))) return r('N', 'not-seen-yet');
      return vis.hasState && ctx.gitLog ? r('X', 'not-in-log') : r('U', 'outside-record');
    }
    case 'number': {
      const s = tokenSeen(vis, cit.value, pos);
      return s ? r(s.level, s.via, { support: 'S1' }) : r('U', 'derived-or-unseen');
    }
    case 'quote': {
      if (writtenBefore(ctx, cit.value, pos)) return r('O', 'self', { support: 'S1' });
      // A fragment of a command the agent ran (`--is-ancestor`): it typed it.
      if (table.events.some((e) => e.pos < pos && e.command && normCmd(e.command).includes(normCmd(cit.value)))) return r('O', 'self-command', { support: 'S1' });
      const s = tokenSeen(vis, cit.value, pos, { word: false });
      return s ? r(s.level, s.via, { support: 'S1' }) : r('U', 'no-verbatim-match');
    }
    default: return r('U', 'unknown-type');
  }
}

// The agent's own code containing the token, written before pos (it knows what it wrote).
function writtenBefore(ctx, token, pos) {
  const re = new RegExp(`(^|[^\\w])${esc(token)}($|[^\\w])`);
  return ctx.table.events.some((e) => e.pos < pos && e.writes.some((w) => w.text && re.test(w.text)));
}

// Types that locate a source (paths, symbols, commands, URLs, issues, commits). Numbers and
// quotes are reported, but N + X is computed over locators: a number cannot be "not opened".
export const LOCATORS = ['path', 'symbol', 'command', 'url', 'issue', 'commit'];

export function gradeGrounding(record, opts = {}) {
  const table = opts.table ?? eventTable(record);
  const authored = opts.authored ?? authoredTexts(record, table);
  const vis = opts.vis ?? visibility(table, authored);
  const topDirs = new Set([...vis.known].filter((k) => k.includes('/')).map((k) => k.split('/')[0]));
  const ctx = { vis, table, gitLog: record?.state?.git?.log ?? null };
  const citations = [];
  for (const a of authored.filter((x) => x.prose)) {
    for (const c of extractCitations(a.text, { topDirs, known: vis.known })) {
      const res = classify(c, a.pos, ctx, sentenceAt(a.text, c.index));
      citations.push({ type: c.type, value: c.value, line: c.line ?? null, where: a.where, pos: a.pos, ...res });
    }
  }
  const count = (list) => Object.fromEntries(['O', 'P', 'M', 'N', 'X', 'U'].map((k) => [k, list.filter((c) => c.cls === k).length]));
  const loc = citations.filter((c) => LOCATORS.includes(c.type));
  const byType = Object.fromEntries([...new Set(citations.map((c) => c.type))].map((t) => [t, count(citations.filter((c) => c.type === t))]));
  const all = count(citations), locs = count(loc);
  return {
    citations, counts: all, byType, locators: loc.length,
    nx: locs.N + locs.X, nxRate: loc.length ? (locs.N + locs.X) / loc.length : null,
    uRate: loc.length ? locs.U / loc.length : null,
    s1: citations.filter((c) => c.support === 'S1').length,
  };
}
