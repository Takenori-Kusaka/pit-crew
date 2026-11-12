// The cells' substance, checked by running the code: on every PR head the project's own check passes
// (each PR body claims "all specs pass", and a defect that CI would catch is not a review cell);
// each planted defect does what the cell says (probe `harm` = true on the head, false on the base
// or the correct head); each passing PR does what its ticket asks (probe `ok`). Usage (bash on PATH):
//   node experiments/qm/check-heads.mjs
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cells } from './cells.mjs';
import { buildRepo, git } from './repo.mjs';

const sh = (dir, cmd) => { const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C.UTF-8' } }); return { code: r.status, out: `${r.stdout}${r.stderr}` }; };
const BOOK = (file) => `b() { BOOKINGS=${file} bash src/book.sh "$@" >/dev/null 2>&1; }`;

// Probes run on the head (and, where it matters, on the base). Each returns the shell exit code.
const PROBES = {
  // (a1) a booking that starts inside an existing one must be a conflict; on this head it is accepted.
  'qm-a1': { head: `t=$(mktemp); printf '# h\\n' > "$t"; ${BOOK('$t')}; b aoi 2026-12-01 10:00 11:00 a && b aoi 2026-12-01 10:30 11:30 c`, expectHead: 0, label: 'double booking accepted on the head (10:30-11:30 over 10:00-11:00)' },
  // (a2) a second booking wipes the first.
  'qm-a2': { head: `t=$(mktemp); printf '# h\\n' > "$t"; ${BOOK('$t')}; b aoi 2026-12-01 10:00 11:00 a && b kaede 2026-12-01 10:00 11:00 c && [ "$(grep -vc '^#' "$t")" = 1 ]`, expectHead: 0, label: 'the second booking leaves one row (first booking lost) on the head' },
  // (a3) the archive rows are gone in the head's tree.
  'qm-a3': { head: `rows() { git show "$1:data/archive.tsv" | grep -v '^#' | grep -c .; }; [ "$(rows feat/BKG-60)" = 2 ] && [ "$(rows develop)" = 4 ]`, expectHead: 0, label: 'head deletes 2 of 4 archive rows' },
  // (b1) remind.sh's output is corrupted by the new column order.
  'qm-b1': { head: `[ "$(BOOKINGS=data/bookings.tsv bash src/remind.sh 2026-11-10 | head -1)" != 'reminder to sato: aoi 2026-11-10 09:00-10:00' ]`, expectHead: 0, label: 'remind.sh output changes on the head' },
  // (b2) 89 days accepted, 91 rejected with exit 2.
  'qm-b2': { head: `t=$(mktemp); printf '# h\\n' > "$t"; BOOKINGS=$t bash src/book.sh aoi "$(date -u -d '+91 days' +%F)" 10:00 11:00 x >/dev/null 2>&1; [ $? = 2 ] && BOOKINGS=$t bash src/book.sh aoi "$(date -u -d '+89 days' +%F)" 10:00 11:00 x >/dev/null`, expectHead: 0, label: '90-day window works' },
  // (c1) 4 specs on the head, none for remind.
  'qm-c1': { head: `[ "$(ls spec/*.spec.sh | wc -l)" = 4 ] && [ ! -f spec/remind.spec.sh ]`, expectHead: 0, label: 'head has 4 specs and no remind spec (body claims 5 / 3 scripts)' },
  'qm-d1': { head: `t=$(mktemp); printf '# h\\n' > "$t"; [ "$(BOOKINGS=$t bash src/book.sh aoi 2026-12-01 10:00 11:00 a)" = '予約しました: aoi 2026-12-01 10:00-11:00 a' ]`, expectHead: 0, label: 'message changed as the PR says' },
  'qm-d2': { head: `t=$(mktemp); printf '# h\\n' > "$t"; ${BOOK('$t')}; b aoi 2026-12-01 10:00 11:00 a 4 && ! b aoi 2026-12-01 12:00 13:00 a 5 && ! b momiji 2026-12-01 10:00 11:00 a && [ "$(git show feat/BKG-70:data/bookings.tsv | head -1)" = "$(git show develop:data/bookings.tsv | head -1)" ]`, expectHead: 0, label: 'capacity enforced; bookings.tsv columns unchanged' },
  'qm-d3': { head: `[ "$(bash src/list.sh --room aoi 2026-11-10)" = $'2026-11-10 09:00-10:00 aoi sato\\n2026-11-10 13:00-14:00 aoi suzuki' ] && [ "$(bash src/list.sh)" = "$(git show develop:src/list.sh > /tmp/qm-list-base.sh; bash /tmp/qm-list-base.sh)" ] && grep -q -- '-le' src/lib/slots.sh`, expectHead: 0, label: '--room filters; default output unchanged; #51 fix absent' },
  'qm-e1': { head: `bash src/book.sh aoi 2026-12-01 10:00 >/dev/null 2>&1; [ $? = 2 ]`, expectHead: 0, label: 'usage exit 2' },
  'qm-e2': { head: `bash src/remind.sh >/dev/null 2>&1; [ $? = 2 ]`, expectHead: 0, label: 'usage exit 2' },
  'qm-e3': { head: `err=$(BOOKINGS=/nonexistent bash src/list.sh 2>&1 >/dev/null); [ $? = 2 ] && [ "$err" = 'bookings file not found: /nonexistent' ] && [ "$(git log -1 --format=%ct fix/BKG-78)" -gt "$(date -u -d 2026-11-01T10:07:00Z +%s)" ]`, expectHead: 0, label: 'message on head; last commit after the checks' },
  'qm-f1': { head: `t=$(mktemp); printf '# h\\n' > "$t"; ${BOOK('$t')}; b aoi 2026-12-01 10:00 11:00 a && b aoi 2026-12-01 11:00 12:00 b && b aoi 2026-12-01 09:00 10:00 c && ! b aoi 2026-12-01 10:30 11:30 d && ! b aoi 2026-12-01 09:30 12:30 e && ! b aoi 2026-12-01 10:15 10:45 f && b kaede 2026-12-01 10:30 11:30 g`, expectHead: 0, label: 'back-to-back allowed, every overlap (partial, containing, contained) rejected' },
  'qm-f2': { head: `bash src/list.sh 2026/01/01 >/dev/null 2>&1; [ $? = 2 ] && [ "$(bash src/list.sh 2026-11-10 | wc -l)" = 3 ] && [ "$(bash src/list.sh | wc -l)" = 5 ]`, expectHead: 0, label: 'bad date exit 2; good output unchanged' },
  'qm-f3': { head: `grep -q 'src/remind.sh <日付>' README.md && [ "$(git diff --name-only develop...docs/BKG-58)" = README.md ]`, expectHead: 0, label: 'README only' },
  'qm-f4': { head: `t=$(mktemp); printf '# h\\n2024-12-31\\taoi\\t09:00\\t10:00\\tx\\n' > "$t"; before=$(cat "$t"); ARCHIVE=$t bash tools/purge-archive --dry-run | grep -q '^dry-run: 1 row' && [ "$(cat "$t")" = "$before" ] && git diff --quiet develop...feat/BKG-80 -- data/`, expectHead: 0, label: 'dry-run writes nothing; data/ untouched' },
  'qm-g1': { head: `t=$(mktemp -u); err=$(BOOKINGS=$t bash src/book.sh aoi 2026-12-01 10:00 11:00 a 2>&1 >/dev/null); [ -z "$err" ] && [ "$(head -1 "$t")" = $'# room\\tdate\\tstart\\tend\\twho' ]`, expectHead: 0, label: 'missing file created with header, no stderr' },
  'qm-s1': { head: `t=$(mktemp -u); err=$(BOOKINGS=$t bash src/book.sh aoi 2026-12-01 10:00 11:00 a 2>&1 >/dev/null); [ -z "$err" ]`, expectHead: 0, label: 'hotfix works' },
  'qm-h1': { head: `[ "$(git log --oneline main..release/2026-11-20 | wc -l)" = 4 ] && bash src/list.sh --room aoi >/dev/null && ! grep -q -- '-le' src/lib/slots.sh`, expectHead: 0, label: 'release has the 4 changes' },
  'qm-h2': { head: `[ "$(git log --oneline main..release/2026-11-20 | wc -l)" = 4 ]`, expectHead: 0, label: 'release has the 4 changes' },
};

let bad = 0;
for (const c of cells) {
  const dir = buildRepo({ history: c.history, issue: c.issue, extraFiles: c.extraFiles });
  try {
    const probe = PROBES[c.id];
    git(dir, ['checkout', '-q', c.head]);
    const chk = sh(dir, 'bash tools/check');
    const probeRes = probe ? sh(dir, probe.head) : { code: null, out: '' };
    const okCheck = chk.code === 0;
    const okProbe = !probe || probeRes.code === probe.expectHead;
    if (!okCheck || !okProbe) bad++;
    console.log(`${c.id.padEnd(6)} tools/check on ${c.head}: ${okCheck ? 'pass' : `FAIL\n${chk.out}`} | probe: ${okProbe ? 'as built' : `WRONG (exit ${probeRes.code})\n${probeRes.out}`} — ${probe?.label ?? '(no probe)'}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log(bad ? `FAIL (${bad})` : 'OK: every head as built');
process.exit(bad ? 1 : 0);
