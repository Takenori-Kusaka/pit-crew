// EXP-20261101-02: split the v0 harness into rule units (paragraphs, list items, table
// rows, code blocks) so that two classifiers label exactly the same units.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'subjects/ganbari-quest-v0';
const files = [];
for (const d of ['skills', 'agents']) {
  for (const n of readdirSync(join(root, d))) {
    const p = join(root, d, n);
    files.push(statSync(p).isDirectory() ? join(p, 'SKILL.md') : p);
  }
}
const units = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  let buf = [];
  let inCode = false;
  const flush = () => {
    const s = buf.join('\n').trim();
    buf = [];
    if (s.length >= 20) units.push({ id: `u${String(units.length + 1).padStart(3, '0')}`, file: f.split('\\').join('/'), text: s });
  };
  for (const line of text.split('\n')) {
    if (/^```/.test(line)) { inCode = !inCode; buf.push(line); if (!inCode) flush(); continue; }
    if (inCode) { buf.push(line); continue; }
    if (/^\s*$/.test(line) || /^#+\s/.test(line)) { flush(); continue; }
    if (/^\s?([-*]|\d+\.)\s/.test(line)) { flush(); buf.push(line); continue; }
    if (/^\|/.test(line)) { if (/^\|[\s|:-]+\|$/.test(line)) continue; flush(); buf.push(line); flush(); continue; }
    buf.push(line);
  }
  flush();
}
writeFileSync('experiments/exp02/units.json', `${JSON.stringify(units, null, 1)}\n`);
const by = {};
for (const u of units) by[u.file] = (by[u.file] ?? 0) + 1;
console.log(units.length, by);
