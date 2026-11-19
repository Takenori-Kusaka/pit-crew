#!/usr/bin/env node
// EXP-48 task selection, stage 1 verification (plan 34 §3 stage 5, run by the task author, no model).
//
//   node experiments/exp48/verify-candidates.mjs [--from N] [--to M] [--no-samedir]
//
// Input : local/exp48-gq/static-pass.json (written by select-candidates.mjs select)
// Output: local/exp48-gq/verify/<pr>.json  (booleans, counts, runtimes; no test names, no code)
//         local/exp48-gq/verify/raw/       (vitest JSON reports; local only)
//
// For each candidate, in one scratch work tree with the arms-A/B/C strip applied (plan §4):
//   D0  pre-fix tree                         : existing tests of the hidden-check directories
//   A   pre-fix tree + hidden tests (+ tests/ support files of the fix)   x3  -> must have >=1 failure
//   B   A + the fix's src/ implementation paths only                      x1  -> must pass (no unlisted dependency)
//   C   fix tree                                                           x3  -> must pass
//   D1  fix tree                             : tests of the hidden-check directories
//
// Limits of this local run (it does not replace the implementer's image): Windows + the local node version,
// one shared node_modules copied from a current checkout (lock file differs for older commits), network not cut.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, symlinkSync, writeFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const LOCAL = join(ROOT, 'local', 'exp48-gq');
const GIT_DIR = join(LOCAL, 'src', 'gq.git');
const WT = join(LOCAL, 'wt', 'run');
const NM = join(LOCAL, 'nm', 'node_modules');
const OUT = join(LOCAL, 'verify');
const RAW = join(OUT, 'raw');
// blob id of package-lock.json in the checkout node_modules was copied from (measured once, 2026-11-13)
const NM_LOCK_BLOB = '967f352ef26081e769cb6158a2210e91b4cec21b';
const STRIPPED_REF = /CLAUDE\.md|docs\/sessions|\.claude\/|copilot-instructions|graphify-out/;
const RUN_TIMEOUT_MS = 900_000;
// the repository requires node >=22.22.2 <23 (native modules are built for it). A node 22 binary is taken from
// the npm package "node" installed under local/ (npm i node@22.22.2), or from EXP48_NODE.
const NODE = process.env.EXP48_NODE ?? join(LOCAL, 'node22', 'node_modules', 'node', 'bin', 'node.exe');
const NODE_VERSION = execFileSync(NODE, ['-v'], { encoding: 'utf8' }).trim();
const ENV_BLOCK = /Failed to resolve import|NODE_MODULE_VERSION|Cannot find (?:module|package)|ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED/;

const arg = (name, dflt) => {
	const i = process.argv.indexOf(name);
	return i > 0 ? process.argv[i + 1] : dflt;
};
const FROM = Number(arg('--from', 1));
const TO = Number(arg('--to', 9999));
const SAMEDIR = !process.argv.includes('--no-samedir');

const git = (...a) => execFileSync('git', ['--git-dir', GIT_DIR, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const wgit = (...a) => execFileSync('git', a, { cwd: WT, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const has = (commit, path) => {
	try {
		git('cat-file', '-e', `${commit}:${path}`);
		return true;
	} catch {
		return false;
	}
};

// minimal environment: nothing that could carry a secret
const ENV = {};
for (const k of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH', 'ComSpec', 'COMSPEC', 'PATHEXT', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE'])
	if (process.env[k]) ENV[k] = process.env[k];
ENV.PATH = `${dirname(NODE)};${ENV.PATH ?? ENV.Path ?? ''}`;
delete ENV.Path;
ENV.CI = 'true';
ENV.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

function unlinkNm() {
	const p = join(WT, 'node_modules');
	try {
		if (lstatSync(p)) rmdirSync(p); // removes the junction only
	} catch {}
}
function linkNm() {
	symlinkSync(NM, join(WT, 'node_modules'), 'junction');
}
function strip() {
	let n = 0;
	const walk = (dir) => {
		const dirEntries = readdirSync(dir, { withFileTypes: true });
		for (const e of dirEntries) {
			if (e.name === 'node_modules' || e.name === '.git') continue;
			const p = join(dir, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.name === 'CLAUDE.md') {
				rmSync(p);
				n++;
			}
		}
	};
	walk(WT);
	for (const p of ['.claude', 'docs/sessions', '.github/copilot-instructions.md', 'graphify-out'])
		if (existsSync(join(WT, p))) {
			rmSync(join(WT, p), { recursive: true, force: true });
			n++;
		}
	return n;
}
function resetTo(commit) {
	if (!existsSync(WT)) {
		mkdirSync(dirname(WT), { recursive: true });
		git('worktree', 'add', '--detach', WT, commit);
	} else {
		unlinkNm();
		wgit('checkout', '-f', '--detach', commit);
		wgit('clean', '-fdxq');
	}
	const n = strip();
	linkNm();
	spawnSync(NODE, ['node_modules/@sveltejs/kit/svelte-kit.js', 'sync'], { cwd: WT, env: ENV, stdio: 'ignore', timeout: 120_000 });
	return n;
}
function vitest(tag, filters) {
	const report = join(RAW, `${tag}.json`);
	rmSync(report, { force: true });
	const t0 = Date.now();
	const r = spawnSync(NODE, ['node_modules/vitest/vitest.mjs', 'run', ...filters, '--reporter=json', `--outputFile=${report.replace(/\\/g, '/')}`], {
		cwd: WT,
		env: ENV,
		stdio: 'ignore',
		timeout: RUN_TIMEOUT_MS,
	});
	const ms = Date.now() - t0;
	if (!existsSync(report)) return { ok: false, report: false, timed_out: r.error?.code === 'ETIMEDOUT', exit: r.status, ms };
	const j = JSON.parse(readFileSync(report, 'utf8'));
	const failedFiles = j.testResults.filter((f) => f.status !== 'passed').length;
	// failures caused by the local environment (missing dependency / native module), not by the tree under test
	const envBlocked = j.testResults.some((f) => f.status !== 'passed' && (ENV_BLOCK.test(f.message ?? '') || f.assertionResults.some((a) => a.status === 'failed' && ENV_BLOCK.test((a.failureMessages ?? []).join(' ')))));
	return {
		ok: j.success === true && j.numFailedTests === 0 && j.numFailedTestSuites === 0 && j.numTotalTests > 0,
		report: true,
		files: j.testResults.length,
		failed_files: failedFiles,
		total: j.numTotalTests,
		passed: j.numPassedTests,
		failed: j.numFailedTests,
		failed_suites: j.numFailedTestSuites,
		env_blocked: envBlocked,
		exit: r.status,
		ms,
	};
}
const sig = (r) => `${r.report}:${r.total}:${r.passed}:${r.failed}:${r.failed_suites}`;

mkdirSync(RAW, { recursive: true });
const items = JSON.parse(readFileSync(join(LOCAL, 'static-pass.json'), 'utf8')).filter((it) => it.static_order >= FROM && it.static_order <= TO);
for (const it of items) {
	const t0 = Date.now();
	const { pr, pre_fix_commit: base, fix_commit: fix } = it;
	const hidden = it.hidden_check_test_paths;
	const support = it.test_support_paths.filter((p) => has(fix, p));
	const tag = (s) => `${pr}-${s}`;
	const st = {
		hidden_tests: hidden.map((p) => ({ path: p, exists_before: has(base, p) })),
		hidden_tests_reference_stripped_paths: false,
		stripped_ref_files: 0,
		lock_same_as_local_node_modules: git('rev-parse', `${base}:package-lock.json`).trim() === NM_LOCK_BLOB,
		lock_changed_by_fix: git('rev-parse', `${base}:package-lock.json`).trim() !== git('rev-parse', `${fix}:package-lock.json`).trim(),
	};
	st.all_hidden_tests_new = st.hidden_tests.every((h) => !h.exists_before);
	for (const p of [...hidden, ...support]) if (STRIPPED_REF.test(git('show', `${fix}:${p}`))) st.stripped_ref_files++;
	st.hidden_tests_reference_stripped_paths = st.stripped_ref_files > 0;

	const run = { ran: true, node: NODE_VERSION, platform: process.platform };
	try {
		run.stripped_entries_removed = resetTo(base);
		const dirs = [...new Set(hidden.map((p) => `${dirname(p)}/`))];
		if (SAMEDIR) run.samedir_before = vitest(tag('D0'), dirs);
		// A: hidden tests on the pre-fix tree
		wgit('checkout', fix, '--', ...hidden, ...support);
		run.A = [1, 2, 3].map((i) => vitest(tag(`A${i}`), hidden));
		run.fails_before = run.A.every((r) => r.report && !r.ok && (r.failed > 0 || r.failed_suites > 0 || r.failed_files > 0));
		// B: + implementation paths only
		for (const p of it.impl_paths) {
			if (has(fix, p)) wgit('checkout', fix, '--', p);
			else rmSync(join(WT, p), { force: true });
		}
		run.B = vitest(tag('B'), hidden);
		run.passes_with_impl_and_tests_only = run.B.ok;
		// C: the fix tree
		resetTo(fix);
		run.C = [1, 2, 3].map((i) => vitest(tag(`C${i}`), hidden));
		run.passes_after = run.C.every((r) => r.ok);
		run.stable_3x = new Set(run.A.map(sig)).size === 1 && new Set(run.C.map(sig)).size === 1;
		// a missing module is the expected way for A to fail (new file of the fix); only B and C tell an environment problem
		run.local_env_blocked = [run.B, ...run.C].some((r) => !r.ok && (r.env_blocked || !r.report));
		if (SAMEDIR) {
			run.samedir_after = vitest(tag('D1'), dirs);
			run.samedir_dirs = dirs.length;
			run.existing_pass_before = run.samedir_before.ok;
			run.existing_pass_after = run.samedir_after.ok;
		}
	} catch (e) {
		run.error = String(e.message ?? e).split('\n')[0].slice(0, 200);
	}
	run.wall_ms = Date.now() - t0;
	writeFileSync(join(OUT, `${pr}.json`), `${JSON.stringify({ pr, static: st, run }, null, 1)}\n`);
	process.stderr.write(
		`#${it.static_order} pr${pr} failsBefore=${run.fails_before} implOnly=${run.passes_with_impl_and_tests_only} after=${run.passes_after} stable=${run.stable_3x} dirB=${run.existing_pass_before} dirA=${run.existing_pass_after} envBlocked=${run.local_env_blocked} strippedRef=${st.hidden_tests_reference_stripped_paths} ${Math.round(run.wall_ms / 1000)}s${run.error ? ` ERR ${run.error}` : ''}\n`,
	);
}
unlinkNm();
