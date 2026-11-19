// Check that every structure arm carries exactly the content of the design doc:
// the same content lines, each the same number of times, and nothing else except
// navigation text inside <!-- nav --> blocks, headings and table header rows.
// Usage: node experiments/structure/check-arms.mjs [design.md] [armsDir]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { build, parse, stages } from './build-arms.mjs';

const [src = 'docs/planning/11-dev-role-design.md', root = 'subjects/dev-structure'] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

const SEP = /^\|[\s|:-]+\|$/;
function units(text, headers) {
  const t = text.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<!-- nav -->[\s\S]*?<!-- \/nav -->/g, '');
  // A stage label (bold first cell of a steps row) is structure: F moves it into a heading.
  return t.split('\n').map((l) => l.trimEnd().replace(/^\| \*\*[^|]*\*\* \|/, '| |')).filter((l) => l.trim() && !/^#{1,4} /.test(l) && !SEP.test(l) && !headers.has(l));
}

const count = (arr) => arr.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
// The source, in the same normal form the arms use (stage cell blanked, stage label in a heading).
function expected(text) {
  const doc = parse(text);
  const srcParts = [doc.principles, ...doc.phases.flatMap((p) => [p.purpose, ...p.subs.map((s) => {
    if (!s.title.startsWith('工程の内部の段階')) return s.body;
    const st = stages(s);
    return [st.intro, st.header.join('\n'), ...st.stages.flatMap((x) => x.rows), st.outro].join('\n');
  })]), ...doc.phases.map((p) => `| ${p.num} | ${p.name} | ${doc.oneLiner[p.num]} |`)];
  const srcText = srcParts.join('\n');
  const lines = srcText.split('\n');
  const headers = new Set(lines.filter((l, i) => l.startsWith('|') && SEP.test(lines[i + 1] ?? '')));
  headers.add('| # | 工程 | ひとことで |');
  return { doc, headers, want: count(units(srcText, headers)) };
}
const base = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const { doc } = expected(base);
// A variant arm (build-variant.mjs) names its candidate file in SOURCE.md. It is checked against
// the design text with that candidate's replacements applied, so it may differ from the design
// only in the replaced rule text.
function designFor(arm) {
  let source = '';
  try { source = readFileSync(join(root, arm, 'SOURCE.md'), 'utf8'); } catch { return base; }
  const m = source.match(/with the replacements in (\S+?)\.\s/);
  if (!m) return base;
  const block = readFileSync(m[1], 'utf8').replace(/\r\n/g, '\n').match(/```json\n([\s\S]*?)\n```/);
  let t = base;
  for (const r of JSON.parse(block[1])) t = t.split(r.old).join(r.new);
  return t;
}

let bad = 0;
for (const arm of readdirSync(root)) {
  const files = walk(join(root, arm)).filter((f) => f.endsWith('.md') && !f.endsWith('SOURCE.md'));
  const { want, headers } = expected(designFor(arm));
  const got = count(files.flatMap((f) => units(readFileSync(f, 'utf8'), headers)));
  const missing = [...want].filter(([l, n]) => (got.get(l) ?? 0) < n);
  const extra = [...got].filter(([l, n]) => (want.get(l) ?? 0) < n);
  const chars = files.reduce((s, f) => s + readFileSync(f, 'utf8').length, 0);
  console.log(`${arm}: ${files.length} files, ${chars} chars, missing ${missing.length}, extra ${extra.length}`);
  for (const [l] of [...missing.slice(0, 3)]) console.log('  missing:', l.slice(0, 100));
  for (const [l] of [...extra.slice(0, 3)]) console.log('  extra:', l.slice(0, 100));
  bad += missing.length + extra.length;
}
// Same build twice gives the same files (deterministic).
const a = JSON.stringify(build(doc)), b = JSON.stringify(build(parse(readFileSync(src, 'utf8'))));
if (a !== b) { console.log('not deterministic'); bad++; }
console.log(bad ? `FAIL (${bad})` : 'OK: every arm has the same content lines');
process.exit(bad ? 1 : 0);
