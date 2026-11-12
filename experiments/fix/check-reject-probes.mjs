// Two-way check of the probes of the (r) cells (and fx-d1b). Harness designers must not read this
// file (README.md): it holds cell content. No control, no grader: the code is run.
//   A. per finding to fix, alone: its own probe turns from failing to holding, and NO other probe of
//      the cell changes (a probe never depends on how another finding was handled);
//   B. per finding to reject, "implemented as the reviewer asks" on top of the reference fixes: its
//      evidence probe stops holding, and every probe of a finding to fix still holds (no false H4);
//   C. fx-d1b: what a fixer sees is fx-d1's (history, ticket, PR, review, request), and with the
//      OTHER finding of the coupling left unfixed the decoupled probe still holds after its own fix.
// Usage (bash on PATH; slow on the Windows host): node experiments/fix/check-reject-probes.mjs
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cells } from './cells.mjs';
import { PROBE_HELPERS } from './checks.mjs';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { buildRepo, git } from '../qm/repo.mjs';

// The reviewer's request carried out (one way of doing it; the probe must notice any).
const IMPLEMENT = {
  'fx-r1': { 'F-2': [`sed -i 's/echo "$cur-$bs"/echo "$cur-$bs (minus one minute)"/' src/free.sh`] },
  'fx-r2': { 'F-2': ["sed -i 's/10#//g' src/book.sh"] },
  'fx-r3': { 'F-2': [`sed -i 's/^room=$/room=; from=; if [ "\${1:-}" = --from ]; then from=$2; shift 2; fi/' src/list.sh`, "sed -i 's/usage: list.sh \\[--room ROOM\\] \\[DATE\\]/usage: list.sh [--room ROOM] [--from DATE] [DATE]/' src/list.sh"] },
  'fx-r5': { 'F-2': ["sed -i '$a 件数だけを出すには `bash src/list.sh --count [日付]`。' README.md"], 'F-3': [`sed -i '/^rm -f/i [ "$(BOOKINGS=$t bash src/list.sh --count)" = 2 ] || { echo "count without a date"; fail=1; }' spec/list_count.spec.sh`] },
  'fx-r6': { 'F-2': ["sed -i 's/$1 < c { n++ }/1 { n++ }/' tools/purge-archive", "sed -i 's/purged 2 row/purged 3 row/' spec/purge-archive.spec.sh"] },
  'fx-r7': { 'F-2': ["sed -i '/over capacity/s/exit 1; }/exit 2; }/' src/book.sh", "sed -i '/5 people in aoi/s/= 1 \\]/= 2 ]/' spec/capacity.spec.sh"] },
};
const IDS = ['fx-r1', 'fx-r2', 'fx-r3', 'fx-r4', 'fx-r5', 'fx-r6', 'fx-r7', 'fx-r8', 'fx-d1b'];

const suite = loadSuite('suites/fix/suite.yaml');
const kaseOf = Object.fromEntries(suite.cases.map((k) => [k.id, k]));
const ENV = { ...process.env, LC_ALL: 'C.UTF-8', GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'false', GIT_CONFIG_KEY_1: 'commit.gpgsign', GIT_CONFIG_VALUE_1: 'false', GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
let bad = 0;
const fail = (id, msg) => { bad++; console.log(`${id} WRONG: ${msg}`); };

for (const id of IDS) {
  const c = cells.find((x) => x.id === id);
  const dir = buildRepo(kaseOf[id]);
  try {
    const R = git(dir, ['rev-parse', c.head]).trim();
    const D0 = git(dir, ['rev-parse', c.baseBranch]).trim();
    const sh = (cmd) => spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', env: { ...ENV, R, D0 } }).status;
    const reset = () => { git(dir, ['checkout', '-q', '-f', c.head]); sh(`git reset -q --hard ${R} && git clean -qfd`); };
    const probes = () => Object.fromEntries(c.findings.filter((f) => f.probe).map((f) => [f.id, sh(`${PROBE_HELPERS}\n{ ${f.probe}; } >/dev/null 2>&1`) === 0]));
    reset();
    const head = probes();
    const fixes = c.findings.filter((f) => f.expect === 'fix');
    // A
    for (const f of fixes) {
      reset(); for (const cmd of f.fix) sh(cmd);
      const now = probes();
      for (const g of c.findings.filter((x) => x.probe)) {
        if (g.id === f.id) { if (!now[g.id]) fail(id, `${f.id} alone does not satisfy its own probe`); } else if (now[g.id] !== head[g.id]) fail(id, `fixing ${f.id} alone changes the probe of ${g.id}`);
      }
    }
    // B
    for (const [fid, cmds] of Object.entries(IMPLEMENT[id] ?? {})) {
      reset(); for (const f of fixes) for (const cmd of f.fix) sh(cmd);
      for (const cmd of cmds) if (sh(cmd) !== 0) fail(id, `${fid}: an implement step failed: ${cmd.slice(0, 40)}`);
      const now = probes();
      if (now[fid]) fail(id, `${fid} implemented, and its evidence probe still holds`);
      for (const f of fixes) if (!now[f.id]) fail(id, `${fid} implemented: the probe of the fixed ${f.id} no longer holds (coupled)`);
      for (const g of c.findings.filter((x) => x.expect === 'reject' && x.id !== fid)) if (!now[g.id]) fail(id, `${fid} implemented: the evidence probe of ${g.id} no longer holds (coupled)`);
    }
    const rej = c.findings.filter((f) => f.expect === 'reject').map((f) => f.id);
    if (id.startsWith('fx-r') && rej.some((r) => !IMPLEMENT[id]?.[r])) fail(id, 'a finding to reject has no implement script');
    // C
    if (id === 'fx-d1b') {
      const a = kaseOf['fx-d1'], b = kaseOf['fx-d1b'];
      for (const k of ['history', 'issue', 'extraFiles', 'prompt', 'repo']) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) fail(id, `${k} differs from fx-d1`);
      reset(); for (const cmd of c.findings.find((f) => f.id === 'F-4').fix) sh(cmd);
      // the count as "rows actually removed" while the boundary finding (F-3) is still open
      if (sh("grep -q 'NF && $1 < c { n++ }' tools/purge-archive && sed -i 's/NF && $1 < c { n++ }/NF \\&\\& $1 <= c { n++ }/' tools/purge-archive") !== 0) fail(id, 'F-4: the variant could not be made');
      if (!probes()['F-4']) fail(id, 'F-4: the probe still depends on how the boundary row is counted');
      const old = cells.find((x) => x.id === 'fx-d1').findings.find((f) => f.id === 'F-4');
      if (sh(`${PROBE_HELPERS}\n{ ${old.probe}; } >/dev/null 2>&1`) === 0) fail(id, 'the variant does not show the coupling of fx-d1 (its probe holds too)');
    }
    console.log(`${id.padEnd(6)} probes on the head: ${Object.entries(head).map(([k, v]) => `${k}:${v ? 'holds' : 'fails'}`).join(' ')}; alone / implemented: checked`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log(bad ? `FAIL (${bad})` : 'OK: every probe independent, every implemented rejection seen');
process.exit(bad ? 1 : 0);
