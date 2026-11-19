#!/usr/bin/env node
// EXP-48: full against shallow history, per candidate and tree kind (owner decision 2026-11-13:
// history in every arm; the reviewer chooses the depth). For depth 0 (all), 200 and 50: the
// commits given, the size of dotgit.tar (what the tree layer adds, before the checkout), the time
// to make it, and how many of those commits mention the task's issue or fix PR. Nothing is kept:
// each repository is written under local/exp48-gq/tmp/depth/ and deleted.
//   node experiments/exp48/depth-measure.mjs [id ...]   -> local/exp48-gq/verify/depth.json
// The tracked summary goes into image-verify.json through `image-verify.mjs collect`.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { historyMentions, writeHistory } from '../../packages/pit-wall/src/realrepo/task.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const L = join(ROOT, 'local/exp48-gq'), V = join(L, 'verify');
const DEPTHS = [0, 200, 50];
const outFile = join(V, 'depth.json');
const prev = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readFileSync(join(V, 'ids.txt'), 'utf8').split('\n').filter(Boolean);
for (const id of ids) {
  if (prev[id] && !process.argv.includes('--force')) continue;
  const spec = JSON.parse(readFileSync(join(V, 'specs', `${id}.json`), 'utf8'));
  const prep = JSON.parse(readFileSync(join(V, 'specs', `${id}.prep.json`), 'utf8'));
  const row = {};
  for (const kind of ['abc', 'd']) {
    const source = join(L, kind === 'abc' ? 'gq-filtered.git' : 'gq.git');
    const commit = prep.history[kind].commit;
    row[kind] = {};
    for (const depth of DEPTHS) {
      const dir = join(L, 'tmp', 'depth', `${id}-${kind}-${depth}`);
      rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      const t0 = Date.now();
      const h = writeHistory(dir, { source, commit, depth });
      const ms = Date.now() - t0;
      row[kind][depth] = { commits: h.commits, tarMiB: Math.round(h.tarBytes / (1 << 20) * 10) / 10, sec: Math.round(ms / 100) / 10, mentions: historyMentions(join(L, 'gq.git'), kind === 'abc' ? spec.prefix_commit : commit, [spec.issue, spec.pr], depth) };
      rmSync(dir, { recursive: true, force: true });
    }
  }
  prev[id] = row;
  writeFileSync(outFile, JSON.stringify(prev, null, 1));
  process.stdout.write(`${id} ${JSON.stringify(row)}\n`);
}
