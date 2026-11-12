// Mechanical check: do the quotes in the ledgers exist verbatim in the repo docs?
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2];
const read = (d, filt) => fs.readdirSync(path.join(root, d)).filter(filt).map(f => fs.readFileSync(path.join(root, d, f), 'utf8')).join('\n');
const norm = s => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, '');
const research = norm(read('docs/research', f => f.endsWith('.md')));
let ev = read('docs/planning', f => f.endsWith('.md')) + read('docs/experiments', f => f.endsWith('.md')) + read('docs/log', f => f.endsWith('.md'));
ev += fs.readFileSync(path.join(root, 'experiments/audit-2026-11-12/qm-grader-audit.md'), 'utf8');
for (const d of ['experiments', 'experiments/fix', 'experiments/qm', 'experiments/qm-heldout', '.']) { try { ev += fs.readFileSync(path.join(root, d, 'README.md'), 'utf8'); } catch {} }
const evid = norm(ev) + research;
const quotes = cell => { const out = []; let depth = 0, start = -1; for (let i = 0; i < cell.length; i++) { if (cell[i] === '「') { if (depth === 0) start = i + 1; depth++; } else if (cell[i] === '」') { depth--; if (depth === 0 && start >= 0) out.push(cell.slice(start, i)); if (depth < 0) depth = 0; } } return out; };
const segs = q => q.split(/…+|\.\.\.+|（中略）/).map(norm).filter(s => s.length >= 8);
const dir = path.join(root, 'docs/research/_scratch-practice-gap');
let tot = { rows: 0, sq: 0, sqMiss: 0, eq: 0, eqMiss: 0 }; const status = {};
for (const f of fs.readdirSync(dir).filter(f => /^ledger-[A-E]\.md$/.test(f))) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    if (!/^\| [A-E]-\d+ \|/.test(line)) continue;
    const c = line.split(' | ').map(s => s.trim()); tot.rows++;
    const st = c[4].replace(/\*/g, ''); status[st] = (status[st] || 0) + 1;
    for (const q of quotes(c[3])) for (const s of segs(q)) { tot.sq++; if (!research.includes(s)) { tot.sqMiss++; console.log('SRC-MISS', c[0].replace('| ', ''), s.slice(0, 60)); } }
    for (const q of quotes(c[5] + ' ' + (c[7] || ''))) for (const s of segs(q)) { tot.eq++; if (!evid.includes(s)) { tot.eqMiss++; console.log('EV-MISS', c[0].replace('| ', ''), s.slice(0, 60)); } }
  }
}
console.log(JSON.stringify(tot), JSON.stringify(status));
