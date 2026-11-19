// A vitest reporter that prints nothing and writes per-test results to $PITWALL_VITEST_OUT,
// in the shape of vitest's own JSON report ({ testResults: [{ name, status, assertionResults }] }).
// The recorder (recorder.mjs) adds it to every vitest run. vitest's built-in JSON reporter cannot
// be used for this: it prints "JSON report written to ..." to the terminal, which the agent
// would see (found by the in-image test, 2026-11-13).
// Written against the reporter API of vitest 3 and 4 (onTestRunEnd with test modules), with the
// older onFinished(files) as a fallback. Any failure in here is swallowed.
import { writeFileSync } from 'node:fs';

const STATE = { pass: 'passed', passed: 'passed', fail: 'failed', failed: 'failed', skip: 'skipped', skipped: 'skipped', todo: 'todo', pending: 'pending', queued: 'pending', run: 'pending' };
const norm = (s) => STATE[s] ?? String(s ?? 'pending');

function write(testResults) {
  const out = process.env.PITWALL_VITEST_OUT;
  if (!out) return;
  const tests = testResults.flatMap((f) => f.assertionResults);
  const n = (s) => tests.filter((t) => t.status === s).length;
  try {
    writeFileSync(out, JSON.stringify({
      numTotalTestSuites: testResults.length, numTotalTests: tests.length, numPassedTests: n('passed'), numFailedTests: n('failed'),
      numFailedTestSuites: testResults.filter((f) => f.status === 'failed').length,
      success: testResults.every((f) => f.status !== 'failed') && n('failed') === 0,
      testResults,
    }));
  } catch { /* recording never breaks the run */ }
}

export default class PitwallReporter {
  // vitest 3 / 4
  onTestRunEnd(testModules) {
    try {
      write([...(testModules ?? [])].map((m) => ({
        name: m.moduleId ?? m.id ?? '',
        status: norm(typeof m.state === 'function' ? m.state() : m.state),
        assertionResults: [...(m.children?.allTests?.() ?? [])].map((t) => ({ fullName: t.fullName ?? t.name, status: norm(t.result?.()?.state) })),
      })));
    } catch { /* swallowed */ }
  }

  // vitest 1 / 2
  onFinished(files) {
    try {
      const walk = (task, prefix) => (task.tasks ?? []).flatMap((t) => (t.type === 'suite' ? walk(t, `${prefix}${t.name} > `) : [{ fullName: `${prefix}${t.name}`, status: norm(t.mode === 'skip' || t.mode === 'todo' ? t.mode : t.result?.state) }]));
      write((files ?? []).map((f) => ({ name: f.filepath ?? f.name ?? '', status: norm(f.result?.state), assertionResults: walk(f, '') })));
    } catch { /* swallowed */ }
  }
}
