import fs from 'node:fs';
const dir = process.argv[2];
const rows = [];
for (const L of ['A','B','C','D','E']) for (const line of fs.readFileSync(`${dir}/ledger-${L}.md`, 'utf8').split('\n')) {
  if (!/^\| [A-E]-\d+ \|/.test(line)) continue;
  const c = line.replace(/^\| /, '').replace(/ \|\s*$/, '').split(' | ').map(s => s.trim());
  rows.push(c);
}
const core = s => { s = s.replace(/\*/g, ''); for (const k of ['常設','一度','提案のみ','言及なし','未確認']) if (s.startsWith(k)) return k; return '?'; };
const cnt = {}; const pre = {};
for (const c of rows) { const k = core(c[4]); cnt[k] = (cnt[k]||0)+1; pre[c[0][0]] ??= {}; pre[c[0][0]][k] = (pre[c[0][0]][k]||0)+1; }
if (process.argv[3] === 'abbr') { const s = new Set(); for (const c of rows) for (const m of c[2].matchAll(/([A-Za-z][\w.-]*):\d/g)) s.add(c[0][0] + ' ' + m[1]); console.log([...s].join('\n')); }
if (process.argv[3] === 'col8') for (const c of rows) if (core(c[4]) === '常設' && 'CE'.includes(c[0][0])) console.log(c[0], '||', (c[7]||'').slice(0, 70));
if (process.argv[3] === 'table') {
  const cut = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
  let out = '| ID | 推奨 | 出典（行） | 状態 | 証拠の要点（全文は台帳） | 日付 | fix の段（計画 31・EXP-44〜47）での扱い |\n|---|---|---|---|---|---|---|\n';
  for (const c of rows) out += `| ${c[0]} | ${c[1]} | ${c[2]} | ${c[4]} | ${cut(c[5], 170)} | ${c[6] || ''} | ${cut(c[7] || '', 110)} |\n`;
  fs.writeFileSync(`${dir}/part1-table.md`, out);
}
console.log(JSON.stringify(cnt), JSON.stringify(pre), rows.length);
