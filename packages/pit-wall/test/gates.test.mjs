// Gates (process v2 P5): the check passes only with PASS verdicts written by an allowed role,
// and a run script that sources experiments/gates.sh does not get past it otherwise.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGate, checkGates, roleId, sha256File, validateGate } from '../src/gates.mjs';
import { shell, toShell } from './shell-helpers.mjs';

const CLI = fileURLToPath(new URL('../src/gates.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const good = (gate, over = {}) => ({ gate, experiment: 'expX', verdict: 'PASS', date: '2026-11-13', written_by: { role: 'auditor (監査役)', lineage: 'test' }, inputs: [{ ref: 'result', sha256: 'a'.repeat(64) }], numbers: {}, open_items: [], ...over });
function repoWith(files) {
  const d = mkdtempSync(join(tmpdir(), 'pw-gates-'));
  mkdirSync(join(d, 'gates', 'expX'), { recursive: true });
  for (const [n, doc] of Object.entries(files)) writeFileSync(join(d, 'gates', 'expX', `${n}.json`), typeof doc === 'string' ? doc : JSON.stringify(doc));
  return d;
}

test('a PASS verdict by an allowed role passes; each defect stops', () => {
  const repo = repoWith({
    G5: good('G5', { written_by: { role: 'reviewer (査読役). Not the designer.', lineage: 'x' } }),
    G4: good('G4'),
    Gfail: good('Gfail', { verdict: 'FAIL' }),
    Gchg: good('Gchg', { verdict: 'PASS WITH CHANGES' }),
    Gdes: good('Gdes', { written_by: { role: 'designer', lineage: 'x' } }),
    Gdes2: good('Gdes2', { written_by: { role: 'auditor', role_id: 'designer', lineage: 'x' } }),
    G2: good('G2', { written_by: { role: 'implementer (基盤の実装役)', lineage: 'x' } }),
    Gname: good('G9'),
    Gnorole: good('Gnorole', { written_by: { lineage: 'x' } }),
    Gnolin: good('Gnolin', { written_by: { role: 'auditor' } }),
    Gnoin: { ...good('Gnoin'), inputs: undefined },
    Gbad: '{not json',
  });
  const c = (g) => checkGate('expX', g, { repo });
  assert.equal(c('G5').ok, true);
  assert.equal(c('G4').ok, true);
  assert.match(c('Gmissing').reason, /missing/);
  assert.match(c('Gfail').reason, /not PASS/);
  assert.match(c('Gchg').reason, /not PASS/);
  assert.match(c('Gdes').reason, /may not write/);
  assert.match(c('Gdes2').reason, /may not write/);
  assert.match(c('G2').reason, /may not write/); // the implementer on its own instruments
  assert.match(c('Gname').reason, /filed as Gname/);
  assert.match(c('Gnorole').reason, /role is missing/);
  assert.match(c('Gnolin').reason, /lineage is missing/);
  assert.match(c('Gnoin').reason, /inputs is missing/);
  assert.match(c('Gbad').reason, /not JSON/);
  assert.equal(checkGates('expX', ['G5', 'G4'], { repo }).ok, true);
  assert.equal(checkGates('expX', ['G5', 'G4', 'Gfail'], { repo }).ok, false);
  assert.equal(checkGates('expX', [], { repo }).ok, false); // asking for nothing is not a pass
});

test('the role is the role_id, or the first word of the role text', () => {
  assert.equal(roleId({ written_by: { role: 'reviewer (査読役, G5). Did not write the plan. Not the designer.' } }), 'reviewer');
  assert.equal(roleId({ written_by: { role: 'Machine (in-image tests)' } }), 'machine');
  assert.equal(roleId({ written_by: { role: '査読役' } }), null);
  assert.equal(validateGate(good('G1', { written_by: { role: 'someone', lineage: 'x' } }), 'G1').filter((e) => /unknown role/.test(e)).length, 1);
});

test('a verdict about a file that has changed since no longer passes', () => {
  const repo = repoWith({});
  writeFileSync(join(repo, 'result.json'), '{"a":1}');
  const doc = good('G4', { inputs: [{ path: 'result.json', sha256: sha256File(join(repo, 'result.json')) }] });
  writeFileSync(join(repo, 'gates', 'expX', 'G4.json'), JSON.stringify(doc));
  assert.equal(checkGate('expX', 'G4', { repo }).ok, true);
  writeFileSync(join(repo, 'result.json'), '{"a":2}');
  assert.match(checkGate('expX', 'G4', { repo }).reason, /changed since/);
});

test('the recorded G5 of exp48 is read as a reviewer PASS', () => {
  const r = checkGate('exp48', 'G5', { repo: REPO });
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.role, 'reviewer');
});

test('CLI: exit 0 only when every needed gate passes', () => {
  const repo = repoWith({ G5: good('G5'), G4: good('G4', { verdict: 'FAIL' }) });
  const run = (need) => spawnSync(process.execPath, [CLI, 'check', 'expX', '--need', need, '--repo', repo], { encoding: 'utf8' });
  assert.equal(run('G5').status, 0);
  assert.equal(run('G5,G4').status, 1);
  assert.match(run('G5,G4').stdout, /STOP expX\/G4: verdict is "FAIL"/);
  assert.equal(run('G5,G2').status, 1);
  assert.equal(spawnSync(process.execPath, [CLI, 'check', 'expX'], { encoding: 'utf8' }).status, 2);
});

test('a run script that sources gates.sh starts with the gates and stops without them', () => {
  const repo = repoWith({ G5: good('G5'), G4: good('G4', { verdict: 'FAIL' }) });
  mkdirSync(join(repo, 'experiments'));
  mkdirSync(join(repo, 'packages', 'pit-wall', 'src'), { recursive: true });
  writeFileSync(join(repo, 'experiments', 'gates.sh'), readFileSync(join(REPO, 'experiments', 'gates.sh'), 'utf8').replace(/\r\n/g, '\n'));
  writeFileSync(join(repo, 'packages', 'pit-wall', 'src', 'gates.mjs'), readFileSync(CLI, 'utf8'));
  writeFileSync(join(repo, 'package.json'), '{"type":"module"}');
  const script = (need) => `#!/bin/bash\nsource experiments/gates.sh expX ${need}\necho MAIN-RUN-STARTED\n`;
  writeFileSync(join(repo, 'run-ok.sh'), script('G5'));
  writeFileSync(join(repo, 'run-stop.sh'), script('G5,G4'));
  writeFileSync(join(repo, 'run-noargs.sh'), '#!/bin/bash\nsource experiments/gates.sh\necho MAIN-RUN-STARTED\n');
  const { stdout } = shell(`cd '${toShell(repo)}'
bash run-ok.sh; echo "ok=$?"
bash run-stop.sh; echo "stop=$?"
bash run-noargs.sh; echo "noargs=$?"
`);
  const [ok, rest] = stdout.split('ok=');
  assert.match(ok, /MAIN-RUN-STARTED/);
  assert.match(rest, /^0\n/);
  const [stop, tail] = rest.split('stop=');
  assert.doesNotMatch(stop, /MAIN-RUN-STARTED/);
  assert.match(tail, /^4\n/);
  assert.doesNotMatch(tail, /MAIN-RUN-STARTED/);
  assert.match(tail, /noargs=4/);
});
