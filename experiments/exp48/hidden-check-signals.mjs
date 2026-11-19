#!/usr/bin/env node
// EXP-48: mechanical signals about the hidden check of each static-pass candidate (plan 34 §3 stage 5b).
// These are aids for the task author's classification (behavioural / mixed / implementation-bound); they do
// not decide it. Output is local: local/exp48-gq/signals.json (counts and booleans) and
// local/exp48-gq/testdiffs/<pr>.diff (test code; never tracked).
//
//   node experiments/exp48/hidden-check-signals.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCAL = join(resolve(HERE, '..', '..'), 'local', 'exp48-gq');
const GIT_DIR = join(LOCAL, 'src', 'gq.git');
const git = (...a) => execFileSync('git', ['--git-dir', GIT_DIR, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const show = (c, p) => {
	try {
		return git('show', `${c}:${p}`);
	} catch {
		return null;
	}
};
const issues = new Map(JSON.parse(readFileSync(join(LOCAL, 'cache', 'issues.json'), 'utf8')).map((i) => [i.number, i]));
const items = JSON.parse(readFileSync(join(LOCAL, 'static-pass.json'), 'utf8'));
mkdirSync(join(LOCAL, 'testdiffs'), { recursive: true });

function resolveModule(commit, fromFile, spec) {
	let base;
	if (spec.startsWith('$lib/')) base = `src/lib/${spec.slice(5)}`;
	else if (spec.startsWith('.')) base = posix.normalize(posix.join(posix.dirname(fromFile), spec));
	else return undefined; // package or other alias: not a repository module
	const stem = base.replace(/\.(js|ts|mjs)$/, '');
	const cands = [base, `${stem}.ts`, `${stem}.js`, `${stem}.mjs`, `${stem}.svelte.ts`, `${stem}/index.ts`, `${stem}/index.js`, `${stem}.svelte`];
	return { cands, found: cands.find((c) => show(commit, c) !== null) ?? null };
}
const exportsName = (src, name) =>
	new RegExp(`export\\s+(?:declare\\s+)?(?:async\\s+)?(?:function\\*?|const|let|var|class|type|interface|enum)\\s+${name}\\b`).test(src) ||
	new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`).test(src) ||
	/export\s+\*\s+from/.test(src);

const out = {};
for (const it of items) {
	const { pre_fix_commit: base, fix_commit: fix, pr } = it;
	const issue = issues.get(it.issue);
	const issueText = `${issue.title}\n${issue.body ?? ''}`;
	const s = {
		test_cases_added: 0,
		test_cases_total_after: 0,
		vi_mock: 0,
		spy_on: 0,
		called_assert: 0,
		called_times_assert: 0,
		source_text_reads: 0,
		private_access: 0,
		repo_imports: 0,
		new_module_imports: 0,
		new_module_imports_named_in_issue: 0,
		new_symbol_imports: 0,
		new_symbol_imports_named_in_issue: 0,
		new_impl_files: it.impl_paths.filter((p) => show(base, p) === null).length,
	};
	const diff = git('diff', '-U3', base, fix, '--', ...it.hidden_check_test_paths, ...it.test_support_paths);
	writeFileSync(join(LOCAL, 'testdiffs', `${pr}.diff`), diff);
	const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
	const count = (rx, lines) => lines.reduce((n, l) => n + (l.match(rx) ?? []).length, 0);
	const CASE = /^\s*(?:it|test)(?:\.(?:each|skip|only|todo|concurrent|fails)\b(?:\([^)]*\))?)*\s*\(/;
	s.test_cases_added = added.filter((l) => CASE.test(l)).length;
	s.vi_mock = count(/\bvi\.(?:mock|doMock|hoisted)\(/g, added);
	s.spy_on = count(/\bvi\.spyOn\(/g, added);
	s.called_assert = count(/\.toHaveBeenCalled(?:With|Once|OnceWith)?\(|\.toHaveBeenLastCalledWith\(|\.toHaveBeenNthCalledWith\(|\.not\.toHaveBeenCalled\(/g, added);
	s.called_times_assert = count(/\.toHaveBeenCalledTimes\(|\.toHaveBeenCalledOnce\(/g, added);
	s.source_text_reads = count(/\b(?:readFileSync|readdirSync|readFile|globSync|fg\.sync|import\.meta\.glob)\(/g, added);
	s.private_access = count(/\bas any\b|\b__\w+__\b|_internal\b|\[['"]_/g, added);
	for (const tp of it.hidden_check_test_paths) {
		const after = show(fix, tp) ?? '';
		const before = show(base, tp);
		s.test_cases_total_after += after.split('\n').filter((l) => CASE.test(l)).length;
		const importRx = /import\s+(?:type\s+)?([^'"]*?)\s*from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|vi\.(?:mock|doMock)\(\s*['"]([^'"]+)['"]/g;
		const seen = new Set();
		for (const m of after.matchAll(importRx)) {
			const spec = m[2] ?? m[3] ?? m[4];
			const r = resolveModule(fix, tp, spec);
			if (!r || !r.found) continue;
			const names = m[1] && /\{/.test(m[1]) ? m[1].replace(/^[^{]*\{|\}.*$/gs, '').split(',').map((x) => x.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean) : [];
			const key = `${spec}|${names.join(',')}`;
			if (seen.has(key)) continue;
			seen.add(key);
			if (before !== null && before.includes(`'${spec}'`) && names.every((n) => before.includes(n))) continue; // unchanged import
			s.repo_imports++;
			const atBase = resolveModule(base, tp, spec);
			if (!atBase.found) {
				s.new_module_imports++;
				const bn = r.found.split('/').pop();
				if (issueText.includes(r.found) || issueText.includes(bn)) s.new_module_imports_named_in_issue++;
				continue;
			}
			const baseSrc = show(base, atBase.found);
			for (const n of names) {
				if (!exportsName(baseSrc, n)) {
					s.new_symbol_imports++;
					if (issueText.includes(n)) s.new_symbol_imports_named_in_issue++;
				}
			}
		}
	}
	out[pr] = s;
}
writeFileSync(join(LOCAL, 'signals.json'), `${JSON.stringify(out, null, 1)}\n`);
for (const it of items) {
	const s = out[it.pr];
	console.log(
		[it.static_order, it.pr, `cases+${s.test_cases_added}/${s.test_cases_total_after}`, `mock${s.vi_mock}`, `spy${s.spy_on}`, `called${s.called_assert}`, `times${s.called_times_assert}`, `srcread${s.source_text_reads}`, `priv${s.private_access}`, `newMod${s.new_module_imports}(${s.new_module_imports_named_in_issue})`, `newSym${s.new_symbol_imports}(${s.new_symbol_imports_named_in_issue})`, `newImpl${s.new_impl_files}`].join(' '),
	);
}
