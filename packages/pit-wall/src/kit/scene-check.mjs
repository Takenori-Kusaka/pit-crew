// The docker check of the scene staging (kit/results/dev/infra-scenes.md §6), as one plan and one reading.
// Not a gate run: no contract table, no model, no harness. It runs the scripted controls of the two templates
// (test/fixtures/kit/dev-scene, dev-layer) in docker and says, for each of the five things that could not be seen
// without a container: confirmed / differs (what) / cannot be confirmed (why).
//   plan()      the trials, in order (pure: no docker, no git)
//   verdicts()  the five answers from the saved trials (pure)
// scripts/scene-check.mjs does the running.

// The probe script (dev-scene): what it finds is written as branches of the logged remote, so the answers are in
// the captured facts and nothing has to be read from a container's output.
//   probe-root        a push by the user the script runs as
//   probe-su          `su` to another user works in the image (without it, the next two say nothing)
//   probe-user-push   another user can clone the remote and push to it
//   probe-user-read   another user can read the seeded gh snapshot
//   probe-node        node is on PATH        probe-json   `gh pr view --json` answers from the snapshot
//   probe-uid-<n>     the uid the script runs as (Harbor runs the agent and a script as the same user: the task's
//                     [agent] user, else the image's USER)     probe-whoami-<name>   its user name
//   probe-user-push-error   when the other user's push failed: a commit whose message is its stderr (first 400 bytes)
export const PROBE = [
  'git push -q origin HEAD:refs/heads/probe-root',
  'git push -q origin "HEAD:refs/heads/probe-uid-$(id -u | tr -cd 0-9)"',
  'git push -q origin "HEAD:refs/heads/probe-whoami-$(whoami 2>/dev/null | tr -cd a-z0-9_-)"',
  'if su -s /bin/bash nobody -c true 2>/dev/null; then git push -q origin HEAD:refs/heads/probe-su',
  '  if ! su -s /bin/bash nobody -c "cd /tmp && rm -rf pc && git clone -q /srv/git/origin.git pc && cd pc && git -c user.name=p -c user.email=p@example.com commit -q --allow-empty -m probe && git push -q origin HEAD:refs/heads/probe-user-push" 2>/tmp/probe-user-push.err; then',
  '    e=$(git commit-tree "HEAD^{tree}" -p HEAD -m "$(head -c 400 /tmp/probe-user-push.err)") && git push -q origin "$e:refs/heads/probe-user-push-error"',
  '  fi',
  '  su -s /bin/bash nobody -c "cd /tmp && gh issue list --state all" 2>/dev/null | grep -q "^12" && git push -q origin HEAD:refs/heads/probe-user-read',
  'fi',
  'command -v node >/dev/null 2>&1 && git push -q origin HEAD:refs/heads/probe-node',
  'gh pr view 31 --json number 2>/dev/null | grep -q 31 && git push -q origin HEAD:refs/heads/probe-json',
  'true',
].join('\n');

const CONTROLS = ['null', 'reference', 'incident'];
// only: null | 'scene' | 'layer'
export function plan({ only = null } = {}) {
  const t = (phase, fixture, script, what) => ({ phase, fixture, arm: `script:${script}`, trial: 1, what });
  const scene = [
    ...CONTROLS.map((c) => t('controls', 'dev-scene', c, 'item 1: the control is graded as built; the remote and the snapshot were made')),
    t('probe', 'dev-scene', 'probe', 'items 2 and 5: pushes and snapshot reads by another user; node and --json'),
    t('baseline', 'dev-scene', 'reference', 'item 4: the verifier reads its own copy of the start facts'),
  ];
  const layer = [
    ...CONTROLS.map((c) => t('controls', 'dev-layer', c, 'item 3: a layer on the small base image; the control is graded as built')),
    t('wrong-base', 'dev-layer', 'null', 'item 3: a base_head that is not the base image\'s stops the build'),
  ];
  return [...(only === 'layer' ? [] : scene), ...(only === 'scene' ? [] : layer)];
}

const ans = (status, detail) => ({ status, detail });
const OK = 'confirmed', NO = 'differs', NA = 'cannot be confirmed';
const pick = (rows, phase, fixture, script) => rows.find((r) => r.phase === phase && r.fixture === fixture && r.script === script) ?? null;
const cap = (r) => r?.saved?.record?.kit_facts?.capture ?? null;
const failed = (r) => (!r ? 'not run' : r.saved?.infra_error ? `infra: ${r.saved.infra_error}` : r.saved?.record?.error ? `runner: ${r.saved.record.error}` : !r.saved?.record ? 'no record' : null);

// rows: [{ phase, fixture, script, saved (gate-run.mjs runTrial), as_built: true | false | null, why }]
// local: { layer_head: the staged head of dev-layer replayed without a container | null }
export function verdicts(rows, local = {}) {
  const out = {};
  // 1. the controls of a staged scene, and the facts of its remote and snapshot
  {
    const cs = CONTROLS.map((c) => pick(rows, 'controls', 'dev-scene', c));
    const bad = cs.map((r, i) => failed(r) ?? (r.as_built === true ? null : `${CONTROLS[i]} not as built (${r.why ?? '?'})`)).filter(Boolean);
    const c = cap(cs[1]);
    const branches = Object.keys(c?.remote?.refs_before ?? {}).length;
    if (cs.some((r) => !r)) out[1] = ans(NA, 'the dev-scene controls were not run');
    else if (bad.length) out[1] = ans(NO, bad.join('; '));
    else if (c?.remote?.status !== 'made' || branches !== 3 || c?.gh_snapshot?.status !== 'made') out[1] = ans(NO, `remote.status ${c?.remote?.status}, ${branches} branches at the start (3 declared), gh_snapshot.status ${c?.gh_snapshot?.status}`);
    else out[1] = ans(OK, 'null / reference / incident graded as built; remote made with 3 branches; snapshot installed');
  }
  // 2 and 5. the probe
  {
    const p = pick(rows, 'probe', 'dev-scene', 'probe'), f = failed(p);
    const refs = Object.keys(cap(p)?.remote?.refs_after ?? {}).filter((n) => n.startsWith('refs/heads/probe-')).map((n) => n.slice('refs/heads/probe-'.length));
    const has = (n) => refs.includes(n);
    const uid = refs.find((n) => /^uid-\d+$/.test(n))?.slice(4) ?? null, who = refs.find((n) => n.startsWith('whoami-'))?.slice(7) || null;
    const errId = cap(p)?.remote?.refs_after?.['refs/heads/probe-user-push-error'];
    const err = errId ? (cap(p)?.git?.commits ?? []).find((c) => c.id === errId)?.message ?? '(the message was not captured)' : null;
    const as = uid === null ? '; the user the script ran as was not reported' : `; the script ran as uid ${uid}${who ? ` (${who})` : ''}`;
    if (f) { out[2] = ans(NA, `the probe: ${f}`); out[5] = ans(NA, `the probe: ${f}`); }
    else if (!has('root')) { out[2] = ans(NO, 'the probe could not push at all'); out[5] = ans(NA, 'the probe could not push, so it could not report'); }
    else {
      out[2] = !has('su') ? ans(NA, `the image has no usable \`su\` to another user; another user was not observed${as}`)
        : has('user-push') && has('user-read') ? ans(OK, `another user (nobody) cloned the remote, pushed to it, and read the snapshot${as}`)
          : ans(NO, `as another user: push ${has('user-push') ? 'worked' : 'FAILED'}, snapshot read ${has('user-read') ? 'worked' : 'FAILED'}${err !== null ? ` (push error: ${err.replace(/\s+/g, ' ').trim().slice(0, 240)})` : ''}${as}`);
      out[5] = has('node') && has('json') ? ans(OK, 'node is in the task image of dev-scene and `gh pr view --json` answered') : ans(NO, `node ${has('node') ? 'present' : 'MISSING'}, --json ${has('json') ? 'answered' : 'DID NOT answer'}`);
      if (out[5].status === OK) out[5].detail += ' (the base image of a real scene is not this one: its node is not shown here)';
    }
  }
  // 3. the layer
  {
    const cs = CONTROLS.map((c) => pick(rows, 'controls', 'dev-layer', c)), wrong = pick(rows, 'wrong-base', 'dev-layer', 'null');
    if (cs.some((r) => !r)) out[3] = ans(NA, 'the dev-layer controls were not run');
    else {
      const bad = cs.map((r, i) => failed(r) ?? (r.as_built === true ? null : `${CONTROLS[i]} not as built (${r.why ?? '?'})`)).filter(Boolean);
      const heads = [...new Set(cs.map((r) => cap(r)?.git?.head_before ?? 'none'))];
      const files = Math.max(...cs.map((r) => Object.keys(r.saved?.record?.state?.files ?? {}).length));
      const total = cap(cs[1])?.tree?.total ?? null;
      const stopped = wrong ? (wrong.saved?.infra_error || wrong.saved?.record?.error || !wrong.saved?.record?.state ? (wrong.saved?.infra_error ?? wrong.saved?.record?.error ?? 'no end state') : null) : undefined;
      if (heads.length !== 1 || heads[0] === 'none') bad.push(`the staged head differs between builds (${heads.join(', ')})`);
      else if (local.layer_head && heads[0] !== local.layer_head) bad.push(`the staged head ${heads[0]} is not the one replayed without a container (${local.layer_head})`);
      if (files > 50) bad.push(`the end state holds ${files} files (the whole base tree was walked)`);
      if (cs.some((r) => !cap(r)?.tree)) bad.push('no tree facts in the capture');
      if (wrong && stopped === null) bad.push('a wrong base_head did NOT stop the build');
      const seconds = cs.map((r) => r.saved?.wall_seconds ?? '?').join(' / ');
      out[3] = bad.length ? ans(NO, bad.join('; '))
        : ans(wrong ? OK : NA, `controls as built; staged head ${heads[0]} on every build${local.layer_head ? ' and equal to the replay without a container' : ''}; ${files} files in the end state; tree.total ${total}; wall seconds ${seconds}${wrong ? `; a wrong base_head stopped the task (${String(stopped).slice(0, 120)})` : '; the wrong-base trial was not run'}`);
    }
  }
  // 4. the verifier's own copy
  {
    const b = pick(rows, 'baseline', 'dev-scene', 'reference'), f = failed(b), base = cap(b)?.baseline;
    out[4] = f ? ans(NA, f) : !base ? ans(NO, 'the capture has no baseline fact')
      : base.source !== 'verifier' ? ans(NO, 'the capture read the image\'s copy: tests/kit-baseline did not reach the verifier')
        : base.differs.length ? ans(NO, `the verifier's copy was read, but it is not what the image built: ${base.differs.join(', ')} (the replay without a container and the docker build do not give the same start facts)`)
          : ans(OK, 'tests/kit-baseline reached the verifier, and the start facts replayed without a container are the image\'s');
  }
  return out;
}

export function render(out, meta = {}) {
  const what = { 1: 'the scripted controls of a staged scene (remote, snapshot)', 2: 'another user: push to the remote, read the snapshot', 3: 'a layer on a base tree image', 4: 'the start facts kept by the verifier', 5: 'node and --json in the task image' };
  return [`# scene-check ${meta.stamp ?? ''}`, '', 'Not a gate run. Scripted controls of the templates dev-scene and dev-layer in docker; no model.', '',
    '| # | what | answer | detail |', '|---|---|---|---|', ...[1, 2, 3, 4, 5].map((k) => `| ${k} | ${what[k]} | ${out[k]?.status ?? NA} | ${String(out[k]?.detail ?? 'not run').replace(/\|/g, '/')} |`), '',
    ...(meta.notes ?? []).map((n) => `- ${n}`), ''].join('\n');
}
