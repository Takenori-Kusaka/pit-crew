// EXP-20261101-02: agreement between the two classifiers, label shares, disagreements.
import { readFileSync, writeFileSync } from 'node:fs';

const units = JSON.parse(readFileSync('experiments/exp02/units.json', 'utf8'));
const a = JSON.parse(readFileSync('experiments/exp02/labels-a.json', 'utf8'));
const b = JSON.parse(readFileSync('experiments/exp02/labels-b.json', 'utf8'));
const L = ['C', 'P', 'A', 'X'];
const byA = Object.fromEntries(a.map((x) => [x.id, x]));
const byB = Object.fromEntries(b.map((x) => [x.id, x]));
const ids = units.map((u) => u.id).filter((id) => byA[id] && byB[id]);
const missing = units.length - ids.length;
const count = (m) => Object.fromEntries(L.map((l) => [l, ids.filter((id) => m[id].label === l).length]));
const ca = count(byA), cb = count(byB);
const agree = ids.filter((id) => byA[id].label === byB[id].label).length;
const po = agree / ids.length;
const pe = L.reduce((s, l) => s + (ca[l] / ids.length) * (cb[l] / ids.length), 0);
const kappa = (po - pe) / (1 - pe);
const confusion = Object.fromEntries(L.map((x) => [x, Object.fromEntries(L.map((y) => [y, ids.filter((id) => byA[id].label === x && byB[id].label === y).length]))]));
const share = (c) => Object.fromEntries(L.map((l) => [l, +(c[l] / ids.length).toFixed(3)]));
const distinctWhy = (m) => new Set(ids.map((id) => m[id].why)).size;
const byFile = {};
for (const u of units) {
  const f = u.file.split('/').slice(-2).join('/');
  byFile[f] ??= { n: 0, C: 0, P: 0, A: 0, X: 0, agree: 0 };
  byFile[f].n++;
  if (byA[u.id]) byFile[f][byA[u.id].label]++;
  if (byA[u.id] && byB[u.id] && byA[u.id].label === byB[u.id].label) byFile[f].agree++;
}
const dis = ids.filter((id) => byA[id].label !== byB[id].label).map((id) => ({ id, a: byA[id].label, b: byB[id].label, text: units.find((u) => u.id === id).text.slice(0, 160), whyA: byA[id].why, whyB: byB[id].why }));
const out = { n: ids.length, missing, countA: ca, countB: cb, shareA: share(ca), shareB: share(cb), agreement: +po.toFixed(3), kappa: +kappa.toFixed(3), confusion, distinctWhyA: distinctWhy(byA), distinctWhyB: distinctWhy(byB), byFile, disagreements: dis };
writeFileSync('experiments/exp02/agreement.json', `${JSON.stringify(out, null, 1)}\n`);
console.log(JSON.stringify({ ...out, disagreements: dis.length, byFile: undefined }, null, 1));
console.log(byFile);
