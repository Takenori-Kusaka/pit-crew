// Build subjects/ganbari-quest-v0-full (owner, 2026-11-03: compare with the GQ harness copied whole
// into another project): the v0 skills and agents (subjects/ganbari-quest-v0, GQ commit 0b32d8bab),
// plus the docs/sessions files the Dev role reads, from the same commit, under workspace/ (the
// Harbor runner places workspace/ in the project tree and hides it from git).
// Stops if any copied text has a secret-like string or company words.
// Usage: node experiments/structure/make-v0full.mjs <path to the ganbari-quest clone>
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const gq = process.argv[2];
if (!gq) { console.error('usage: make-v0full.mjs <ganbari-quest clone>'); process.exit(1); }
const COMMIT = '0b32d8bab';
const out = 'subjects/ganbari-quest-v0-full';
const show = (p) => execFileSync('git', ['show', `${COMMIT}:${p}`], { cwd: gq, encoding: 'utf8', maxBuffer: 1 << 26 });
const list = (p) => execFileSync('git', ['ls-tree', '-r', '--name-only', COMMIT, p], { cwd: gq, encoding: 'utf8' }).split('\n').filter(Boolean);
const DOCS = ['docs/sessions/dev-session.md', 'docs/sessions/README.md', 'docs/sessions/label-mailbox.md', 'docs/sessions/branch-strategy.md', ...list('docs/sessions/dev-process/')];
const SECRET = /(sk-ant-|ghp_|github_pat_|xox[bp]-|AKIA[0-9A-Z]{12}|discord(app)?\.com\/api\/webhooks|hooks\.slack\.com|-----BEGIN|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})/;
const COMPANY = /会社|社外秘|勤務先|取引先名/;

rmSync(out, { recursive: true, force: true });
cpSync('subjects/ganbari-quest-v0', out, { recursive: true });
let bad = 0, bytes = 0;
for (const p of DOCS) {
  const t = show(p);
  const s = t.match(SECRET), c = t.match(COMPANY);
  if (s || c) { console.log(`STOP ${p}: ${s ? `secret-like "${s[0]}"` : ''} ${c ? `company word "${c[0]}"` : ''}`); bad++; continue; }
  const f = join(out, 'workspace', p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, t);
  bytes += Buffer.byteLength(t);
}
writeFileSync(join(out, 'SOURCE.md'), `# ganbari-quest-v0-full（GQ のハーネスを丸ごと別のプロジェクトに写したもの）

- 出典: \`subjects/ganbari-quest-v0\`（GQ commit ${COMMIT} の skills 5・agents 5）に、Dev が読む docs/sessions（${DOCS.length} ファイル、${bytes} バイト、同じ commit）を \`workspace/\` として足した。手を加えずに写した
- 位置づけ（オーナー 2026-11-03）: 性能評価で汎用の Dev スキルと比べる相手の 1 つ。「汎用化せずに GQ のハーネスを新しいプロジェクトに写して使ったら」
- Harbor の runner は \`workspace/\` を作業ツリーに置き、git から隠す（課題の履歴にも他の arm にも入らない）
- 作り直し: \`node experiments/structure/make-v0full.mjs <GQ のクローン>\`。秘密の形（トークン・Webhook・鍵・メールアドレス）と会社の情報の語を検索し、1 つでもあれば止まる
- 載せた文書: ${DOCS.join('、')}
`);
console.log(bad ? `FAIL: ${bad} file(s) stopped` : `ok: ${DOCS.length} docs, ${bytes} bytes -> ${out}`);
process.exit(bad ? 1 : 0);
