// Masking for the third-edition reader measure (design 23 §13; research-reader-leakage §4.1).
// Every planted option's identifying terms are replaced by ONE shared mask "[案]" (a per-option mask
// would itself leak the mapping — Poché 2026), then adoption wording is removed (hideAdoption).
// Exact-string masking only (Believing without Seeing 2025); paraphrases are caught per point by the
// masked degenerate baseline (L1 / k), not here.
export const MASK = '[案]';
// Adoption WORDS only (bundle.mjs/hideAdoption removes whole sentences, which empties a masked
// rationale: 2026-11-06 00:1x test). The reader must not learn which option was taken from these.
const ADOPT_LATIN = /\b(adopt(?:ed|s|ing|ion)?|chose|chosen|choose|choosing|decid(?:e|ed|es|ing)|decision|select(?:ed|s|ing)?|pick(?:ed|s|ing)?|went with|go(?:ing)? with|opt(?:ed|s|ing)? for|settled on|will use|we use|i use|prefer(?:red|s)?)\b/gi;
const ADOPT_JA = /(採用(?:する|した|します)?|採る|採った|採り|選ぶ|選んだ|選択(?:する|した)?|決定(?:する|した)?|決めた|決める|ことにする|にする|方針|却下(?:する|した)?|不採用)/g;
export const stripAdoptionWords = (t) => String(t ?? '').replace(ADOPT_LATIN, ' ').replace(ADOPT_JA, ' ');
const CJK = /[぀-ヿ㐀-鿿]/;

// Identifying terms of one option text: the whole text, path-like / snake_case / camelCase tokens,
// latin words of 4+ letters, and (for Japanese) fragments between particles of 2+ characters.
export function identifierTerms(optionText) {
  const t = String(optionText ?? '');
  const terms = new Set();
  if (t.trim()) terms.add(t.trim());
  for (const m of t.match(/[A-Za-z0-9_][A-Za-z0-9_./-]*[._/-][A-Za-z0-9_./-]*/g) ?? []) terms.add(m);
  for (const m of t.match(/[A-Za-z][a-z]+(?:[A-Z][a-z]+)+/g) ?? []) terms.add(m);
  for (const m of t.match(/[A-Za-z][A-Za-z0-9]{3,}/g) ?? []) if (!STOP.has(m.toLowerCase())) terms.add(m);
  if (CJK.test(t)) for (const f of t.split(/[をにでとのはがへもや、。・,.\s（）()「」]+/)) { const g = f.replace(/^(する|して|した|し)$/, ''); if (g.length >= 2) terms.add(g); }
  return [...terms].filter((x) => x.length >= 2).sort((a, b) => b.length - a.length);
}
const STOP = new Set(['with', 'from', 'that', 'this', 'then', 'into', 'over', 'under', 'inside', 'after', 'before', 'them', 'they', 'their', 'what', 'when', 'where', 'which', 'while', 'would', 'should', 'could', 'have', 'been', 'were', 'also', 'only', 'just', 'each', 'other', 'another', 'same', 'more', 'most', 'some', 'such', 'than', 'very', 'does', 'make', 'made', 'keep', 'kept', 'call', 'site', 'code', 'file', 'line', 'does', 'adds', 'add']);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// mask(text, options[, extraTerms]) -> text with every identifying term of every option replaced by MASK.
export function maskOptions(text, options, extraTerms = []) {
  let out = String(text ?? '');
  const terms = new Set(extraTerms);
  for (const o of options) for (const t of identifierTerms(o.text)) terms.add(t);
  for (const t of [...terms].sort((a, b) => b.length - a.length)) {
    const latin = /^[A-Za-z0-9_./-]+$/.test(t);
    const re = new RegExp(latin ? `(?<![A-Za-z0-9_])${escapeRe(t)}(?![A-Za-z0-9_])` : escapeRe(t), 'gi');
    out = out.replace(re, MASK);
  }
  out = stripAdoptionWords(out);
  // collapse runs of masks
  return out.replace(new RegExp(`(${escapeRe(MASK)}[\\s、,/の・-]*){2,}`, 'g'), `${MASK} `).replace(/[ \t]{2,}/g, ' ').trim();
}

// How much of the text survived masking (0..1, by characters outside masks); used to report
// "nothing left to read" points (S ≈ 0 is then the right reading, not a defect).
export function maskedResidue(masked, original = null) {
  const word = (s) => String(s ?? '').replace(new RegExp(escapeRe(MASK), 'g'), '').replace(/[^\p{L}\p{N}]+/gu, '');
  const kept = word(masked).length;
  const total = original != null ? word(original).length : kept + String(masked ?? '').split(MASK).length - 1; // without the original, count each mask as one unit
  return total ? Math.min(1, kept / total) : 0;
}
