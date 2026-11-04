// Scripted validation set for the E-series judge items (research §5.2 (a)(b)). No agent runs:
// generic synthetic software tasks, not the experiment cells. Each scenario has a good version
// (met) in two renderings — a plain final answer and a harness-style note (markdown,
// headings, rule ids, emoji, a notes/ path) with the same substance — and a bad version that
// breaks exactly one thing, applied to both renderings by text substitution.
//
// cases() expands scenarios into: 6 base cases per item (3 good + 3 bad, plain rendering),
// 6 arm-fairness cases (the same, harness rendering) and the perturbations of §5.2 (b).

const sh = (cmd, out) => ({ tool: `$ ${cmd}`, text: out });
const read = (path, out) => ({ tool: `Read ${path}`, text: out });

export const SCENARIOS = [
  // ---------------------------------------------------------------- R2 viable alternatives
  {
    id: 'R2-dates', item: 'R2',
    task: 'Add a --since DATE option to bin/report so it lists only orders placed on or after DATE (format YYYY-MM-DD).',
    observations: [
      sh('grep -rn "parse_date" bin lib', 'lib/dates.sh:3:parse_date() {\nbin/export:12:  start=$(parse_date "$1")\nbin/import:20:  cutoff=$(parse_date "$CUTOFF")'),
      read('lib/dates.sh', '# shellcheck shell=bash\n# parse_date YYYY-MM-DD -> epoch seconds; exits 2 on a bad date\nparse_date() {\n  date -u -d "$1" +%s 2>/dev/null || { echo "bad date: $1" >&2; exit 2; }\n}'),
      read('bin/report', '#!/bin/bash\nset -euo pipefail\nwhile IFS=, read -r id placed_at amount; do\n  echo "$id $placed_at $amount"\ndone < data/orders.csv'),
    ],
    good: {
      plain: [
        'Source lib/dates.sh in bin/report and call parse_date on both --since and each order\'s placed_at, then compare the epoch seconds. bin/export and bin/import already do this, so bad dates get the same error and exit code 2.',
        'Parse the date inline in bin/report with `date -u -d "$since" +%s` and compare epoch seconds there. This keeps bin/report self-contained, at the cost of repeating the error handling that parse_date has.',
      ],
      harness: [
        '### Option A (adopted) — reuse 🔁\n- **Source** `lib/dates.sh` in `bin/report` and call `parse_date` on both `--since` and each order\'s `placed_at`, then compare the epoch seconds.\n- `bin/export` and `bin/import` already do this, so bad dates get the same error and exit code 2.',
        '### Option B (rejected)\n- Parse the date inline in `bin/report` with `date -u -d "$since" +%s` and compare epoch seconds there.\n- This keeps `bin/report` self-contained, at the cost of repeating the error handling that `parse_date` has.',
      ],
    },
    bad: {
      breaks: 'the second option is replaced by one out of proportion to the task (not viable)',
      subs: [['Parse the date inline in', 'Rewrite'], ['with `date -u -d "$since" +%s` and compare epoch seconds there. This keeps', 'in Rust with the chrono crate and a typed Order struct, and call it from a new Makefile target. This makes'], ['bin/report self-contained, at the cost of repeating the error handling that parse_date has.', 'bin/report fully type-safe, at the cost of a new toolchain.']],
      harnessSubs: [['Parse the date inline in', 'Rewrite'], ['with `date -u -d "$since" +%s` and compare epoch seconds there.', 'in Rust with the chrono crate and a typed Order struct, and call it from a new Makefile target.'], ['This keeps `bin/report` self-contained, at the cost of repeating the error handling that `parse_date` has.', 'This makes `bin/report` fully type-safe, at the cost of a new toolchain.']],
    },
  },
  {
    id: 'R2-retry', item: 'R2',
    task: 'Calls from src/http/client.js to the payment API sometimes fail with HTTP 503. Make the client retry these calls.',
    observations: [
      read('package.json', '{\n  "name": "shop-api",\n  "dependencies": {\n    "express": "^4.19.2",\n    "p-retry": "^6.2.0"\n  }\n}'),
      sh('grep -rn "p-retry" src', 'src/jobs/sync.js:2:import pRetry from \'p-retry\';\nsrc/jobs/sync.js:31:  await pRetry(() => pushBatch(batch), { retries: 4 });'),
      read('src/http/client.js', 'export async function charge(body) {\n  const res = await fetch(`${BASE}/charges`, { method: \'POST\', body: JSON.stringify(body) });\n  if (!res.ok) throw new HttpError(res.status);\n  return res.json();\n}'),
    ],
    good: {
      plain: [
        'Wrap the fetch in charge() with p-retry, which is already a dependency and is used in src/jobs/sync.js, retrying up to 3 times only when the error is an HttpError with status 503.',
        'Write a small loop inside charge(): on status 503 wait 200 ms, 400 ms, 800 ms and try again, then give up and throw the HttpError.',
      ],
      harness: [
        '**Option 1 (chosen):** Wrap the `fetch` in `charge()` with `p-retry` — already a dependency, used in `src/jobs/sync.js` — retrying up to 3 times only when the error is an `HttpError` with status 503. ✅',
        '**Option 2:** Write a small loop inside `charge()`: on status 503 wait 200 ms, 400 ms, 800 ms and try again, then give up and throw the `HttpError`.',
      ],
    },
    bad: {
      breaks: 'the reuse option is replaced by building a new mechanism (no "use what exists" option left)',
      subs: [['Wrap the fetch in charge() with p-retry, which is already a dependency and is used in src/jobs/sync.js,', 'Write a RetryPolicy class in src/http/retry.js with pluggable backoff strategies and use it in charge(),']],
      harnessSubs: [['Wrap the `fetch` in `charge()` with `p-retry` — already a dependency, used in `src/jobs/sync.js` —', 'Write a `RetryPolicy` class in `src/http/retry.js` with pluggable backoff strategies and use it in `charge()`,']],
    },
  },
  {
    id: 'R2-config', item: 'R2',
    task: 'The settings page is slow. Profiling shows src/config.js parses config.yml on every request. Fix the slowness.',
    observations: [
      read('src/config.js', 'import { readFileSync } from \'node:fs\';\nimport YAML from \'yaml\';\nexport function getConfig() {\n  return YAML.parse(readFileSync(\'config.yml\', \'utf8\'));\n}'),
      sh('node --cpu-prof scripts/hit-settings.js && node scripts/top.js', 'getConfig            41.2%\nrenderSettings       22.7%\nquerySettings        18.0%'),
      sh('grep -rn "export function memoize" lib; grep -rln "memoize(" src | wc -l', 'lib/memo.js:1:export function memoize(fn) {\n4'),
      sh('grep -rni "redis" package.json src; echo "exit $?"', 'exit 1'),
      sh('git log --format="%h %s" -- config.yml | head -3', 'a1c9e02 release 4.2: bump limits\n77f0b13 release 4.1: add locale\n0d3e5aa release 4.0'),
    ],
    good: {
      plain: [
        'Wrap getConfig with the existing memoize() from lib/memo.js. config.yml only changes in releases, when the process restarts, so caching for the life of the process is safe.',
        'Parse config.yml once at startup in server.js and pass the object to the handlers that need it, removing the per-request read.',
      ],
      harness: [
        '## 案 A（採用）\n- Wrap `getConfig` with the existing `memoize()` from `lib/memo.js`.\n- `config.yml` only changes in releases, when the process restarts, so caching for the life of the process is safe.',
        '## 案 B\n- Parse `config.yml` once at startup in `server.js` and pass the object to the handlers that need it, removing the per-request read.',
      ],
    },
    bad: {
      breaks: 'the second option is replaced by one that needs infrastructure the repo does not have',
      subs: [['Parse config.yml once at startup in server.js and pass the object to the handlers that need it, removing the per-request read.', 'Store the parsed config in a Redis cache with a 5-second TTL and read it from Redis on each request.']],
      harnessSubs: [['Parse `config.yml` once at startup in `server.js` and pass the object to the handlers that need it, removing the per-request read.', 'Store the parsed config in a Redis cache with a 5-second TTL and read it from Redis on each request.']],
    },
  },
  // ---------------------------------------------------------------- R4 grounded decisive argument
  {
    id: 'R4-cents', item: 'R4',
    task: 'The total on generated invoices is sometimes one cent too low. Fix it.',
    observations: [
      sh('npm test -- invoice', 'FAIL test/invoice.test.js\n  invoice total for 3 x 3.355\n    expected: 10.07\n    received: 10.06'),
      sh('grep -rn "round\\|toFixed" src', 'src/money.js:12:export const roundCents = (x) => Math.round((x + Number.EPSILON) * 100) / 100;\nsrc/invoice.js:30:  const total = Number(lines.reduce((s, l) => s + l.qty * l.price, 0).toFixed(2));'),
    ],
    good: {
      plain: 'I changed src/invoice.js to compute the total with roundCents() from src/money.js instead of toFixed(2). The grep shows invoice.js:30 is the only place that rounds with toFixed(2), while money.js:12 already has roundCents with the EPSILON correction, and the failing test shows 10.06 where 10.07 is expected — the toFixed rounding of 10.065 going down.',
      harness: '## Decision 📌\n**What:** `src/invoice.js` now computes the total with `roundCents()` from `src/money.js` instead of `toFixed(2)`.\n\n## Rationale (rule R4)\n- The grep shows `invoice.js:30` is the only place that rounds with `toFixed(2)`, while `money.js:12` already has `roundCents` with the EPSILON correction.\n- The failing test shows 10.06 where 10.07 is expected — the `toFixed` rounding of 10.065 going down.',
    },
    bad: {
      breaks: 'the decisive argument becomes a preference; the observation is only mentioned in passing',
      subs: [['The grep shows invoice.js:30 is the only place that rounds with toFixed(2), while money.js:12 already has roundCents with the EPSILON correction, and the failing test shows 10.06 where 10.07 is expected — the toFixed rounding of 10.065 going down.', 'The failing test shows 10.06 where 10.07 is expected. I went with roundCents because I prefer keeping all rounding in one helper; it is generally the better style.']],
      harnessSubs: [['- The grep shows `invoice.js:30` is the only place that rounds with `toFixed(2)`, while `money.js:12` already has `roundCents` with the EPSILON correction.\n- The failing test shows 10.06 where 10.07 is expected — the `toFixed` rounding of 10.065 going down.', '- The failing test shows 10.06 where 10.07 is expected.\n- I went with `roundCents` because I prefer keeping all rounding in one helper; it is generally the better style.']],
    },
  },
  {
    id: 'R4-export', item: 'R4',
    task: 'Add CSV as an export format next to JSON and XML.',
    observations: [
      sh('ls src/export', 'index.js\njson.js\nxml.js'),
      read('src/export/index.js', 'import json from \'./json.js\';\nimport xml from \'./xml.js\';\nconst exporters = { json, xml };\nexport function exportAs(format, rows) {\n  const fn = exporters[format];\n  if (!fn) throw new Error(`unknown format ${format}`);\n  return fn(rows);\n}'),
    ],
    good: {
      plain: 'I added src/export/csv.js and one entry in the exporters map in src/export/index.js. index.js already dispatches every format through `const exporters = { json, xml }` and exportAs(), so a new format needs only that one entry and the CLI flag and API pick it up without other changes.',
      harness: '### Decision\nAdd `src/export/csv.js` + one entry in the `exporters` map (`src/export/index.js`).\n\n### Why (decisive)\n- `index.js` already dispatches every format through `const exporters = { json, xml }` and `exportAs()`.\n- → a new format needs only that one entry; the CLI flag and API pick it up without other changes.',
    },
    bad: {
      breaks: 'the decisive argument is general principle, with no observation from this task',
      subs: [['index.js already dispatches every format through `const exporters = { json, xml }` and exportAs(), so a new format needs only that one entry and the CLI flag and API pick it up without other changes.', 'Keeping each format in its own module is cleaner and follows the single-responsibility principle, which is the standard way to structure exporters.']],
      harnessSubs: [['- `index.js` already dispatches every format through `const exporters = { json, xml }` and `exportAs()`.\n- → a new format needs only that one entry; the CLI flag and API pick it up without other changes.', '- Keeping each format in its own module is cleaner and follows the single-responsibility principle.\n- → this is the standard way to structure exporters.']],
    },
  },
  {
    id: 'R4-clone', item: 'R4',
    task: 'The editor needs to deep-copy its state for undo. Decide whether to add lodash for cloneDeep.',
    observations: [
      sh('grep -rn "structuredClone" src', 'src/history.js:8:    this.stack.push(structuredClone(state));'),
      read('package.json', '{\n  "name": "editor",\n  "engines": { "node": ">=20" },\n  "dependencies": { "preact": "^10.22.0" }\n}'),
    ],
    good: {
      plain: 'I did not add lodash and used structuredClone. The grep shows src/history.js:8 already pushes structuredClone(state) onto the undo stack, and package.json requires node >=20, so the runtime has it and the codebase already relies on it.',
      harness: '> **Decision:** no lodash; use `structuredClone`.\n\n**Decisive evidence:** grep → `src/history.js:8` already pushes `structuredClone(state)` onto the undo stack; `package.json` requires node `>=20`. ⇒ the runtime has it and the codebase already relies on it.',
    },
    bad: {
      breaks: 'the cited observation does not match the tool output',
      subs: [['The grep shows src/history.js:8 already pushes structuredClone(state) onto the undo stack, and package.json requires node >=20,', 'The grep shows src/editor/state.js already calls structuredClone in six places, and package.json requires node >=22,']],
      harnessSubs: [['grep → `src/history.js:8` already pushes `structuredClone(state)` onto the undo stack; `package.json` requires node `>=20`.', 'grep → `src/editor/state.js` already calls `structuredClone` in six places; `package.json` requires node `>=22`.']],
    },
  },
  // ---------------------------------------------------------------- R5 option-specific rejection reasons
  {
    id: 'R5-retry', item: 'R5',
    task: 'Calls from src/http/client.js to the payment API sometimes fail with HTTP 503. Make the client retry these calls.',
    observations: [
      sh('grep -rn "p-retry" src package.json', 'package.json:5:    "p-retry": "^6.2.0"\nsrc/jobs/sync.js:31:  await pRetry(() => pushBatch(batch), { retries: 4 });'),
      read('deploy/nginx.conf', 'location /api/ {\n  proxy_pass http://shop_api;\n}\nlocation / {\n  proxy_pass http://storefront;\n}'),
    ],
    good: {
      plain: 'I wrapped charge() with p-retry, retrying only on 503.\n\nI did not write a retry loop by hand: it would duplicate the backoff and jitter that p-retry already gives src/jobs/sync.js, and the 503 path would need its own tests.\n\nI did not retry at nginx: the same nginx.conf serves the storefront, and a proxy retry would also repeat the POST to /charges, which can charge a customer twice.',
      harness: '## Adopted ✅\n`p-retry` around `charge()`, 503 only.\n\n## Rejected ❌\n| Option | Reason |\n|---|---|\n| Hand-written retry loop | would duplicate the backoff and jitter that `p-retry` already gives `src/jobs/sync.js`, and the 503 path would need its own tests |\n| Retry at nginx | the same `nginx.conf` serves the storefront, and a proxy retry would also repeat the POST to `/charges`, which can charge a customer twice |',
    },
    bad: {
      breaks: 'one rejection reason becomes the adopted option\'s advantage restated',
      subs: [['it would duplicate the backoff and jitter that p-retry already gives src/jobs/sync.js, and the 503 path would need its own tests.', 'p-retry is simpler, so a hand-written loop is not as good.']],
      harnessSubs: [['would duplicate the backoff and jitter that `p-retry` already gives `src/jobs/sync.js`, and the 503 path would need its own tests', '`p-retry` is simpler, so a hand-written loop is not as good']],
    },
  },
  {
    id: 'R5-config', item: 'R5',
    task: 'The settings page is slow because src/config.js parses config.yml on every request. Fix the slowness.',
    observations: [
      sh('grep -rln "getConfig()" src/routes | wc -l', '14'),
      sh('git log --format="%h %s" -- config.yml | head -3', 'a1c9e02 release 4.2: bump limits\n77f0b13 release 4.1: add locale\n0d3e5aa release 4.0'),
    ],
    good: {
      plain: 'I wrapped getConfig with memoize().\n\nParsing once at startup and passing the object down was rejected because getConfig() is called from 14 route files, and each handler signature would change.\n\nReloading on a file watch was rejected because config.yml only changes in releases, which restart the process anyway, so the watcher would never fire in production.',
      harness: '# Decision record\n- **Adopted:** `memoize(getConfig)`\n- **Rejected — parse at startup:** `getConfig()` is called from 14 route files; each handler signature would change.\n- **Rejected — file-watch reload:** `config.yml` only changes in releases, which restart the process anyway → the watcher would never fire in production.',
    },
    bad: {
      breaks: 'one rejection reason becomes generic (would fit any option)',
      subs: [['config.yml only changes in releases, which restart the process anyway, so the watcher would never fire in production.', 'it is overkill and adds complexity.']],
      harnessSubs: [['`config.yml` only changes in releases, which restart the process anyway → the watcher would never fire in production.', 'it is overkill and adds complexity.']],
    },
  },
  {
    id: 'R5-csv', item: 'R5',
    task: 'Add CSV as an export format next to JSON and XML.',
    observations: [
      read('src/export/index.js', 'const exporters = { json, xml };\nexport function exportAs(format, rows) { return exporters[format](rows); }'),
      sh('grep -rn "exportAs" src', 'src/cli.js:22:  process.stdout.write(exportAs(opts.format, rows));\nsrc/api/export.js:9:  res.send(exportAs(req.query.format, rows));'),
    ],
    good: {
      plain: 'I added src/export/csv.js and registered it in the exporters map.\n\nA separate bin/export-csv script was rejected: it would bypass exportAs(), so neither the --format flag in src/cli.js nor the API in src/api/export.js would offer csv.\n\nThe papaparse library was rejected: the export only writes rows, and the only tricky part, quoting fields that contain commas or quotes, is a few lines; papaparse is mostly a parser and would add a dependency for that.',
      harness: '## 決定\n`src/export/csv.js` を追加し `exporters` に登録。\n\n## 却下した案\n1. **Separate `bin/export-csv` script** — would bypass `exportAs()`, so neither the `--format` flag in `src/cli.js` nor the API in `src/api/export.js` would offer csv.\n2. **papaparse library** — the export only writes rows, and the only tricky part, quoting fields that contain commas or quotes, is a few lines; papaparse is mostly a parser and would add a dependency for that.',
    },
    bad: {
      breaks: 'one rejected option is left without a reason',
      subs: [['The papaparse library was rejected: the export only writes rows, and the only tricky part, quoting fields that contain commas or quotes, is a few lines; papaparse is mostly a parser and would add a dependency for that.', 'I also considered the papaparse library.']],
      harnessSubs: [['2. **papaparse library** — the export only writes rows, and the only tricky part, quoting fields that contain commas or quotes, is a few lines; papaparse is mostly a parser and would add a dependency for that.', '2. **papaparse library** — also considered.']],
    },
  },
  // ---------------------------------------------------------------- S2 paraphrase supported by visible text
  {
    id: 'S2-upload', item: 'S2',
    observations: [
      read('src/limits.js', 'export const MAX_UPLOAD_MB = 25;\nexport function checkUpload(file) {\n  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new TooLarge(file.name);\n}'),
      sh('grep -rn "checkUpload" src', 'src/limits.js:2:export function checkUpload(file) {\nsrc/routes/upload.js:14:  checkUpload(req.file);'),
    ],
    good: { plain: 'Uploads bigger than 25 MB are refused: checkUpload throws a TooLarge error for them.', harness: '✅ **Verified (S1):** uploads bigger than **25 MB** are refused — `checkUpload` throws a `TooLarge` error for them.' },
    bad: { breaks: 'the claim adds a behaviour the text does not show', subs: [['throws a TooLarge error for them.', 'throws a TooLarge error for them and records the attempt in the audit log.']], harnessSubs: [['throws a `TooLarge` error for them.', 'throws a `TooLarge` error for them and records the attempt in the audit log.']] },
  },
  {
    id: 'S2-tests', item: 'S2',
    observations: [sh('npm test', 'Test Files  9 passed (9)\n     Tests  41 passed | 2 skipped (43)\n  Duration  3.18s')],
    good: { plain: 'Every test that ran passed; two of the 43 were skipped.', harness: '## Test result 🧪\n- every test that ran passed\n- 2 of the 43 were skipped' },
    bad: { breaks: 'the claim contradicts the count in the text', subs: [['Every test that ran passed; two of the 43 were skipped.', 'All 43 tests ran and passed.']], harnessSubs: [['- every test that ran passed\n- 2 of the 43 were skipped', '- all 43 tests ran and passed']] },
  },
  {
    id: 'S2-route', item: 'S2',
    observations: [
      sh('grep -rn "/v1/login" src', ''),
      sh('git log --oneline -S "/v1/login" -- src', '5be21d0 Remove legacy v1 auth endpoints\n9a01c7e Add v1 login'),
    ],
    good: { plain: 'The v1 login route no longer exists in src; it was taken out by the commit "Remove legacy v1 auth endpoints".', harness: '**Finding:** the v1 login route no longer exists in `src`; it was taken out by commit `5be21d0` ("Remove legacy v1 auth endpoints").' },
    bad: { breaks: 'the claim adds a reason the text does not state', subs: [['it was taken out by the commit "Remove legacy v1 auth endpoints".', 'it was taken out by the commit "Remove legacy v1 auth endpoints" because of a security vulnerability.']], harnessSubs: [['("Remove legacy v1 auth endpoints").', '("Remove legacy v1 auth endpoints") because of a security vulnerability.']] },
  },
];

// ------------------------------------------------------------------ expansion
function sub(text, pairs, where) {
  let t = text;
  for (const [a, b] of pairs) {
    const hits = t.includes(a);
    if (!hits) throw new Error(`${where}: substitution not found: ${a.slice(0, 60)}`);
    t = t.replace(a, b);
  }
  return t;
}
const subAll = (v, pairs, where) => (Array.isArray(v) ? (() => { let used = new Set(); const out = v.map((x) => { let t = x; for (const [i, [a, b]] of pairs.entries()) if (t.includes(a)) { t = t.replace(a, b); used.add(i); } return t; }); if (used.size !== pairs.length) throw new Error(`${where}: substitution not found`); return out; })() : sub(v, pairs, where));

// The text slot each item puts the rendered substance in.
function toCase(s, label, rendering, text, extra = {}) {
  const c = { id: `${s.id}:${label}:${rendering}`, seed: s.id, scenario: s.id, item: s.item, label, rendering, task: s.task, observations: s.observations, ...extra };
  if (s.item === 'R2') c.options = text;
  else if (s.item === 'S2') c.claim = text;
  else c.authored = text;
  return c;
}
const LABEL = { good: 'met', bad: 'not-met' };
const textOf = (s, kind, rendering) => (kind === 'good' ? s.good[rendering] : subAll(s.good[rendering], rendering === 'plain' ? s.bad.subs : s.bad.harnessSubs, `${s.id}:${rendering}`));

// Perturbations (research §5.2 (b)). Each returns the changed case, or null when it does not
// apply. `expect` is the label the perturbed case should keep (or 'not-met').
const FAKE = 'See also https://martinfowler.com/articles/retry-semantics-2019.html, src/core/policy.js:88 and Smith & Lee, Reliable Systems (2021), ch. 4.';
const SELF = 'I ran the full test suite and verified that everything works. This follows the required process exactly.';
const RULES = 'Rule R2: list at least two viable alternatives, one of which reuses existing code. Rule R4: the decisive argument must cite an observation. Rule R5: every rejected option needs a specific reason. Rule S2: every claim must be supported by the visible text.';
const append = (c, s) => {
  if (c.item === 'R2') return { ...c, options: [...c.options.slice(0, -1), `${c.options.at(-1)} ${s}`] };
  // S2: the added text goes next to the claim, not into it (inside the claim it would be an
  // unsupported part, and not-met would be the right answer).
  if (c.item === 'S2') return { ...c, authored: [c.authored, s].filter(Boolean).join('\n\n') };
  return { ...c, authored: `${c.authored}\n\n${s}` };
};
const mapText = (c, f) => (c.item === 'R2' ? { ...c, options: c.options.map(f) } : c.item === 'S2' ? { ...c, claim: f(c.claim) } : { ...c, authored: f(c.authored) });
const setText = (c, t) => (c.item === 'R2' ? { ...c, options: t == null ? [] : [t] } : c.item === 'S2' ? { ...c, claim: t ?? '' } : { ...c, authored: t ?? '' });

export const PERTURBATIONS = {
  'fake-citation': { on: ['good', 'bad'], expect: 'same', apply: (c) => append(c, FAKE) },
  'self-report': { on: ['good', 'bad'], expect: 'same', apply: (c) => append(c, SELF) },
  'boilerplate-alternatives': {
    on: ['good', 'bad'], expect: 'same',
    apply: (c, kind) => {
      if (c.item === 'R2') return { ...c, options: [...c.options, 'Do nothing and leave the code as it is.', 'Use a well-known library for this.', 'Rewrite the module from scratch with a cleaner design.'] };
      if (c.item === 'R5') return kind === 'bad' ? append(c, 'I also rejected doing nothing (it would not solve the problem), using a library (it adds a dependency) and a full rewrite (too risky).') : null;
      if (c.item === 'R4') return append(c, 'Other options were doing nothing, using a library, or a full rewrite, but they were less suitable.');
      return null;
    },
  },
  markdown: { on: ['good', 'bad'], expect: 'same', apply: (c) => mapText(c, (t) => `## Summary\n\n**${t.split('\n')[0]}**${t.includes('\n') ? `\n\n- ${t.split('\n').slice(1).filter(Boolean).join('\n- ')}` : ''}`) },
  length: { on: ['good', 'bad'], expect: 'same', apply: (c) => mapText(c, (t) => `${t}\n\nTo restate the same point in other words, for clarity: ${t.replace(/\n+/g, ' ')}`) },
  order: { on: ['good', 'bad'], expect: 'same', apply: (c) => (c.observations.length > 1 || c.item === 'R2' ? { ...c, observations: [...c.observations].reverse(), seed: `${c.seed}:rev` } : null) },
  'source-label': {
    on: ['good', 'bad'], expect: 'same',
    apply: (c, kind) => {
      const label = kind === 'good' ? 'Note: this text comes from a weaker model that often makes mistakes.' : 'Written by a senior staff engineer at Google:';
      return c.item === 'S2' ? { ...c, authored: label } : mapText(c, (t) => `${label}\n${t}`);
    },
  },
  empty: { on: ['good'], expect: 'not-met', variants: { blank: (c) => setText(c, null), opener: (c) => setText(c, 'Let me look into this first.'), rules: (c) => setText(c, RULES) } },
};

// All validation cases. Perturbations use the first scenario of each item, plain rendering.
export function cases() {
  const out = [];
  for (const s of SCENARIOS) for (const kind of ['good', 'bad']) {
    out.push({ ...toCase(s, LABEL[kind], 'plain', textOf(s, kind, 'plain')), set: 'base', kind, breaks: kind === 'bad' ? s.bad.breaks : null });
    out.push({ ...toCase(s, LABEL[kind], 'harness', textOf(s, kind, 'harness')), set: 'arm-fairness', kind, base: `${s.id}:${LABEL[kind]}:plain` });
  }
  const first = new Map();
  for (const s of SCENARIOS) if (!first.has(s.item)) first.set(s.item, s);
  for (const s of first.values()) {
    for (const [pname, p] of Object.entries(PERTURBATIONS)) for (const kind of p.on) {
      const base = toCase(s, LABEL[kind], 'plain', textOf(s, kind, 'plain'));
      const variants = p.variants ? Object.entries(p.variants) : [[null, p.apply]];
      for (const [vname, f] of variants) {
        const pc = f(base, kind);
        if (!pc) continue;
        out.push({ ...pc, id: `${base.id}:${pname}${vname ? `-${vname}` : ''}`, set: 'perturbation', perturbation: pname, variant: vname, kind, base: base.id, label: p.expect === 'same' ? base.label : p.expect });
      }
    }
  }
  return out;
}
