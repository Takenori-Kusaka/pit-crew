// The evidence bundle a juror sees for one E-series item (research §5.1 "input"). The same
// structure for every arm: what the agent could see (tool results) and what it wrote, as
// plain text spans with ids, formatting stripped and arm-specific words replaced by neutral
// tokens. Only the window the item needs goes in (TRAIL: do not hand over the trajectory).
//
// Span ids: T = the task, O<n> = a tool result the agent saw (an observation), A<n> = a piece
// of text the agent wrote, C = the claim under test (S2), K<n> = an option (R2, shown in a
// fixed shuffled order with the adopted one not marked).
//
// Input "case" (scripted validation cases use it directly; `fromRecord` builds one from a
// pit-wall record):
//   { item, task, observations: [{ tool?, text }], authored: string | string[],
//     options?: string[] (R2), claim?: string (S2) }

import { createHash } from 'node:crypto';

// Generic words that tell which arm wrote the text, or that a decision template was followed
// (harness-specific names, e.g. the harness's own name, come from the suite via extraArmWords). They
// are replaced, not deleted, so sentences stay readable.
export const ARM_WORDS = [
  /\bharness(?:es)?\b/gi, /ハーネス/g,
  /\b(?:skill|plugin|rule ?file|playbook)s?\b/gi, /スキル|プラグイン|規則ファイル/g,
  /\bADR-?\d+\b/gi, /\b(?:rule|item|criterion) [A-Z]?\d+(?:\.\d+)?\b/gi, /\b[RNS][0-9]\b(?=[:\s).,]|$)/g,
  /§\s?\d+(?:\.\d+)*/g, /設計書\s?\d+/g, /工程\s?\d+/g, /\b(?:T[012]|track [012])\b/g,
  /\bper the (?:rules?|process|template|checklist)\b/gi, /\bas the (?:rules?|process|template) requires?\b/gi,
];
// Lines that only say where a text came from or which template section it is ("Decision
// record", "Written by Claude"). Source labels move judges up or down (Chae et al. 2026).
// Adopted / rejected / alternatives headings carry meaning (R5 needs to know which option was
// rejected) and are kept; pure template section names are dropped.
const TEMPLATE_LINE = /^(?:decision(?: record| log)?|rationale|why(?: \(decisive\))?|consequences|context|status|summary|finding|notes?|test results?|option [A-Z0-9]+|alternative [A-Z0-9]+|案\s?[A-Z0-9]+|決定(?:記録)?|理由|背景|結果|状態)\s*:?\s*$/i;
const ORIGIN_LINE = /^\(?(?:written|generated|authored|produced|output|text) (?:by|from)\b.*$|^(?:source|origin|author)\s*:.*$|^(?:your|the model'?s?|another model'?s?|a human'?s?|the agent'?s?|claude'?s?|gpt'?s?) (?:output|answer|response)\b.*$|^[^\n]{0,40}(?:の出力|が書いた|が生成した)\s*[:：]?\s*$/i;
// Emoji and pictographs (and their joiners / variation selectors).
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
// File names that reveal a template location (notes/decision-003.md, docs/decisions/0001-x.md).
const NOTE_PATH = /(?:^|(?<=[\s(`'"]))(?:\.?\/)?(?:notes|docs\/decisions|decisions|\.claude)\/[\w./-]+/gi;

// Strip markdown and decoration from one text, line by line. Code stays (identifiers are
// evidence), only the fences and backticks go.
export function stripFormat(text) {
  const out = [];
  for (let l of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(l)) continue; // fences
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) continue; // horizontal rules
    if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l)) continue; // table rules
    l = l.replace(/^\s*#{1,6}\s+/, ''); // headings
    l = l.replace(/^\s*>\s?/, ''); // blockquotes
    l = l.replace(/^\s*(?:[-*+•・]|\d+[.)]|\(\d+\)|[a-z][.)])\s+(?:\[[ xX]\]\s+)?/, ''); // list marks, checkboxes
    l = l.replace(/^\s*\|(.*)\|\s*$/, (_, c) => c.split('|').map((s) => s.trim()).filter(Boolean).join('; ')); // table rows
    l = l.replace(/(\*\*|__)(.+?)\1/g, '$2').replace(/(^|[^\w*])[*_]([^*_\s][^*_]*?)[*_](?=[^\w*]|$)/g, '$1$2'); // bold, italic
    l = l.replace(/`([^`]+)`/g, '$1').replace(/~~(.+?)~~/g, '$1');
    l = l.replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1'); // links keep their text
    l = l.replace(EMOJI, '');
    l = l.replace(/[ \t]+/g, ' ').trim();
    if (!l) continue;
    out.push(l);
  }
  return out.join('\n');
}

// Replace arm-specific words, note paths, template headings and origin labels.
export function neutralise(text, { armWords = ARM_WORDS, extra = [] } = {}) {
  const lines = [];
  for (let l of String(text ?? '').split('\n')) {
    if (ORIGIN_LINE.test(l.trim())) continue;
    l = l.replace(NOTE_PATH, '[note]');
    for (const re of [...armWords, ...extra]) l = l.replace(re, '[x]');
    // "(rule R4)" → "": a bracketed reference to the harness's rules says nothing else.
    l = l.replace(/\s*[(（]\s*\[x\]\s*[)）]/g, '').replace(/(?:\[x\][\s,]*){2,}/g, '[x] ').replace(/[ \t]+/g, ' ').trim();
    if (TEMPLATE_LINE.test(l)) continue;
    // "Decision: we use X" → "we use X": a template label in front of content.
    l = l.replace(/^(?:decision|rationale|context|consequences?|status|finding|verified|option [A-Z0-9]+|alternative [A-Z0-9]+|決定|理由|案\s?[A-Z0-9]+)\s*[:：]\s*/i, '');
    if (l && l !== '[x]') lines.push(l);
  }
  return lines.join('\n');
}

export const normaliseText = (text, opts) => neutralise(stripFormat(text), opts);

// Words that mark which option was adopted (R2 asks with the adopted option hidden).
const ADOPTION = /[ \t]*[(（]\s*(?:adopted|chosen|selected|recommended|preferred|rejected|discarded|採用|却下|推奨)\s*[)）][ \t]*|^(?:adopted|chosen|selected|recommended|preferred|rejected|discarded|winner|採用|却下|推奨)(?:\s+option)?\s*[:：-]\s*|\b(?:we|I) (?:chose|picked|went with|adopted|rejected|discarded|ruled out|prefer(?:red)?)\b[^.]*\.?/gim;
export const hideAdoption = (text) => String(text).replace(ADOPTION, ' ').replace(/[ \t]+/g, ' ').trim();

// Deterministic shuffle (the order options were written in can reveal the adopted one).
function shuffled(xs, seed) {
  const a = xs.map((x, i) => ({ x, k: createHash('sha256').update(`${seed}:${i}:${x}`).digest('hex') }));
  return a.sort((p, q) => (p.k < q.k ? -1 : 1)).map((p) => p.x);
}

// Paragraph spans: authored text split at blank lines (after normalisation, one line is one
// former paragraph or list item; consecutive short lines are kept together).
function paragraphs(text) {
  const raw = String(text ?? '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => normaliseText(p)).filter(Boolean);
  return raw;
}

// Build the bundle for one case. Returns { item, spans: [{ id, kind, text }], hash }.
export function buildBundle(c, { maxObsChars = 2400, extraArmWords = [] } = {}) {
  const opts = { extra: extraArmWords };
  const spans = [];
  if (c.task) spans.push({ id: 'T', kind: 'task', text: normaliseText(c.task, opts) });
  (c.observations ?? []).forEach((o, i) => {
    // Tool results are evidence as the agent saw them: no markdown stripping, only arm words
    // and note paths (a harness arm's notes must not show through a `cat notes/...`).
    let t = String(o.text ?? '').replace(/\r\n?/g, '\n').trim();
    if (t.length > maxObsChars) t = `${t.slice(0, maxObsChars)}\n[truncated]`;
    t = t.split('\n').map((l) => { let x = l.replace(NOTE_PATH, '[note]'); for (const re of [...ARM_WORDS, ...extraArmWords]) x = x.replace(re, '[x]'); return x; }).join('\n');
    const head = o.tool ? `${o.tool.replace(NOTE_PATH, '[note]')}\n` : '';
    spans.push({ id: `O${i + 1}`, kind: 'observation', text: `${head}${t}` });
  });
  if (c.item === 'R2') {
    const opt = (c.options ?? []).map((o) => normaliseText(hideAdoption(stripFormat(o)), opts)).filter(Boolean);
    shuffled(opt, c.id ?? '').forEach((t, i) => spans.push({ id: `K${i + 1}`, kind: 'option', text: t }));
  } else {
    const parts = Array.isArray(c.authored) ? c.authored.flatMap(paragraphs) : paragraphs(c.authored);
    parts.forEach((t, i) => spans.push({ id: `A${i + 1}`, kind: 'authored', text: t }));
  }
  if (c.item === 'S2' && c.claim != null) spans.push({ id: 'C', kind: 'claim', text: normaliseText(c.claim, opts) });
  const hash = createHash('sha256').update(JSON.stringify([c.item, spans])).digest('hex').slice(0, 16);
  return { item: c.item, spans, hash };
}

export function renderBundle(b) {
  return b.spans.map((s) => `[${s.id}] (${s.kind})\n${s.text}`).join('\n\n');
}

// Build a case from a pit-wall record (stage 1 use): observations = non-error tool results
// visible before `before`, authored = the prose the agent wrote. The window is the last
// `maxObs` observations that share a token with the authored text, so the bundle stays small.
export function caseFromRecord({ item, task, vis, authored, before = Infinity, maxObs = 6, options, claim }) {
  const prose = authored.filter((a) => a.prose && a.pos < before).map((a) => a.text);
  const words = new Set(prose.join(' ').match(/[A-Za-z_][\w.-]{3,}|\d{2,}/g) ?? []);
  const obs = vis.corpus.filter((c) => c.pos >= 0 && c.pos < before && c.text?.trim())
    .map((c) => ({ text: c.text, score: [...words].filter((w) => c.text.includes(w)).length }))
    .filter((o) => o.score > 0).slice(-maxObs).map((o) => ({ text: o.text }));
  return { item, task, observations: obs, authored: prose, options, claim };
}
