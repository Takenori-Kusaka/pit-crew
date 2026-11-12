#!/usr/bin/env node
// EXP-48 task selection, stage 1: the mechanical filter (plan 34 §3) and the ordered candidate list.
//
// Usage (Git Bash, from the pit-crew root):
//   node experiments/exp48/select-candidates.mjs fetch    # GitHub -> local/exp48-gq/cache/ (issue text: never tracked)
//   node experiments/exp48/select-candidates.mjs select   # cache + local clone -> experiments/exp48/candidates.json
//
// `select` is deterministic for a given cache and clone: no clock, no network, no randomness other than a
// seeded hash tiebreak. The tracked output holds pointers only (numbers, commit ids, paths, counts, hashes,
// booleans). Issue text, diffs and test code stay under local/exp48-gq/ (git-ignored).
//
// The script reads no harness text (CLAUDE.md, .claude/, docs/sessions): it only looks at path names,
// `git diff` output of the fixing PR, and the issue title/body.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const LOCAL = join(ROOT, 'local', 'exp48-gq');
const CACHE = join(LOCAL, 'cache');
const GIT_DIR = join(LOCAL, 'src', 'gq.git');
const OUT = join(HERE, 'candidates.json');
const VERIFY_DIR = join(LOCAL, 'verify'); // written by verify-candidates.mjs (local)
const CLASSIFICATION = join(HERE, 'hidden-check-classification.json'); // tracked, counts only

// ---------------------------------------------------------------------------------------------
// Pre-specified parameters. Every value the plan left open is listed in THRESHOLD_CHOICES with the
// alternatives; the chosen value is the most conservative one (the one that rejects more).
// ---------------------------------------------------------------------------------------------
const P = {
	repo: { owner: 'Takenori-Kusaka', name: 'ganbari-quest' },
	population_label: 'type:fix',
	max_files: 20, // plan §3 stage 2
	max_lines: 800, // plan §3 stage 2 (additions + deletions)
	size_ignored_prefixes: ['graphify-out/'], // plan §3 stage 2
	leak_min_chars: 20, // stage 6: non-whitespace chars of an added line that must appear verbatim in the issue body
	leak_min_chars_alt: 30, // recorded for sensitivity only (the probe rule of review §5.5 uses 30)
	primaries: 16,
	reserves: 8,
	nearest_rejected: 20,
	seed: 'exp48-task-order-v1',
	// the paths arms A/B/C strip from the tree (plan §4, table row D). Used only as path patterns.
	harness_path_patterns: [
		'(^|/)CLAUDE\\.md$',
		'^\\.claude/',
		'^docs/sessions/',
		'^\\.github/copilot-instructions\\.md$',
		'^graphify-out/',
	],
};

const THRESHOLD_CHOICES = [
	{
		id: 'T1',
		stage: '1',
		question: 'Which link between issue and PR counts as "closed by a merged fixing PR"',
		options: [
			'a: any merged PR in closedByPullRequestsReferences (GitHub fills this only for PRs into the default branch)',
			'b: exactly one merged, non-excluded PR in closedByPullRequestsReferences, and the issue stateReason is COMPLETED',
			'c: exactly one merged, non-excluded PR whose closing set (GitHub link, or a GitHub closing keyword + issue number in the PR body, any base branch) contains the issue, and stateReason is COMPLETED',
		],
		chosen: 'c',
		note: 'b is narrower in count but keeps only PRs merged straight into main (all static passes fell in 2026-04/05); c is the conservative choice for the memorisation risk and matches the plan wording "exclude integration PRs". Count under b is recorded as stage1_github_link_only_count.',
	},
	{
		id: 'T2',
		stage: '1',
		question: 'PR that closes several issues (the request text would be ambiguous)',
		options: ['a: keep', 'b: reject unless the PR closes exactly one issue'],
		chosen: 'b',
	},
	{
		id: 'T3',
		stage: '2',
		question: 'What "800 lines" counts',
		options: ['a: additions only', 'b: additions + deletions (git numstat, first parent .. merge commit)'],
		chosen: 'b',
	},
	{
		id: 'T4',
		stage: '3',
		question: 'What a "unit test" file is',
		options: [
			'a: any *.test.ts collected by vitest (tests/unit + tests/integration)',
			'b: tests/unit/**/*.test.ts or src/**/*.{test,spec}.ts only; a PR touching tests/integration/ is rejected',
		],
		chosen: 'b',
	},
	{
		id: 'T5',
		stage: '4',
		question: 'Rune modules (*.svelte.ts / *.svelte.js) under the ".svelte" exclusion',
		options: ['a: only *.svelte', 'b: *.svelte and *.svelte.ts / *.svelte.js'],
		chosen: 'b',
	},
	{
		id: 'T6',
		stage: '4',
		question: 'What "DB migration" covers',
		options: [
			'a: drizzle/ and **/migration(s)/ and *.sql',
			'b: a + any file whose name contains "schema" under src/lib/server/db/',
		],
		chosen: 'b',
	},
	{
		id: 'T7',
		stage: '4',
		question: 'Extra exclusions for the team-lead signals (secrets / cloud / UI screenshots) that the plan table does not name',
		options: [
			'a: none beyond the plan table',
			'b: also .env*, Dockerfile*, docker-compose*, .storybook/, playwright config, site/ (static LP pages), static/, *-baseline/ directories',
		],
		chosen: 'b',
	},
	{
		id: 'T8',
		stage: '6',
		question: 'When an added line "overlaps" the issue body',
		options: [
			'a: line with >= 30 non-whitespace chars appears verbatim (whitespace removed) in the body',
			'b: same with >= 20 chars',
			'c: same with >= 20 chars, but only lines that are not already in the pre-fix version of the changed files',
		],
		chosen: 'b',
		note: 'counts for option a are recorded per item as leak_lines_ge30',
	},
	{
		id: 'T9',
		stage: '6b',
		question: 'When the issue body "names" a changed file',
		options: [
			'a: full repository path of a changed implementation file appears in the body',
			'b: full path or bare file name (with extension) of a changed implementation file appears',
		],
		chosen: 'b',
		note: 'both counts are recorded; the stratum flag uses b (the wider reading, so fewer items count as "not named")',
	},
	{
		id: 'T10',
		stage: '7',
		question: 'What puts an item in the heavy stratum',
		options: [
			'a: label priority:critical on issue or PR',
			'b: a, or PR head branch starts with hotfix/ or a label contains "hotfix", or issue/PR title contains 再発',
			'c: b, or issue body contains 再発',
		],
		chosen: 'b',
		note: 'c was not chosen: a body-level match would mostly hit boilerplate wording, which is not the plan stratum',
	},
	{
		id: 'T11',
		stage: '7',
		question: 'How the two strata are merged into one fixed order',
		options: [
			'a: all heavy first, then normal',
			'b: alternate heavy, normal, heavy, ... (heavy first); inside a stratum newest merge first, then PR number descending, then sha256(seed:number); when one stratum is exhausted the other continues',
		],
		chosen: 'b',
	},
	{
		id: 'T12',
		stage: '7',
		question: 'Training-cutoff rule',
		options: [
			'a: keep only merges after the published cutoff of the subject model',
			'b: cutoff not established from a primary source -> no item is rejected on it; merge date is recorded for later stratification',
		],
		chosen: 'b',
		note: 'cutoff status: 未確認',
	},
];

// ---------------------------------------------------------------------------------------------
const sh = (cmd, args, opts = {}) =>
	execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const git = (...args) => sh('git', ['--git-dir', GIT_DIR, ...args]);
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

function gql(query, vars = {}) {
	const args = ['api', 'graphql', '-f', `query=${query}`];
	for (const [k, v] of Object.entries(vars)) {
		if (v === null || v === undefined) continue;
		args.push(typeof v === 'number' ? '-F' : '-f', `${k}=${v}`);
	}
	return JSON.parse(sh('gh', args)).data;
}

// --------------------------------------- fetch ------------------------------------------------
function fetchAll() {
	mkdirSync(CACHE, { recursive: true });
	const issues = [];
	let after = null;
	const Q = `query($owner:String!,$name:String!,$label:String!,$after:String){
	  repository(owner:$owner,name:$name){
	    issues(first:40,after:$after,labels:[$label],states:CLOSED,orderBy:{field:CREATED_AT,direction:ASC}){
	      pageInfo{hasNextPage endCursor}
	      nodes{ number title body createdAt closedAt lastEditedAt stateReason
	        author{login __typename}
	        labels(first:40){nodes{name}}
	        closedByPullRequestsReferences(first:20,includeClosedPrs:true){nodes{number}}
	        timelineItems(itemTypes:[CLOSED_EVENT],last:1){nodes{... on ClosedEvent{closer{__typename ... on PullRequest{number} ... on Commit{oid}}}}}
	      } } } }`;
	for (;;) {
		const d = gql(Q, { owner: P.repo.owner, name: P.repo.name, label: P.population_label, after });
		const c = d.repository.issues;
		issues.push(...c.nodes);
		process.stderr.write(`issues ${issues.length}\n`);
		if (!c.pageInfo.hasNextPage) break;
		after = c.pageInfo.endCursor;
	}
	// every merged PR of the repository (with body): PRs merged into a non-default branch are not linked
	// by GitHub to the issues they close, so the closing keywords in the PR body are parsed in `select`.
	const prs = [];
	after = null;
	const QP = `query($owner:String!,$name:String!,$after:String){
	  repository(owner:$owner,name:$name){
	    pullRequests(first:40,after:$after,states:MERGED,orderBy:{field:CREATED_AT,direction:ASC}){
	      pageInfo{hasNextPage endCursor}
	      nodes{ number title body createdAt merged mergedAt baseRefName headRefName additions deletions changedFiles
	        author{login __typename} mergeCommit{oid} labels(first:40){nodes{name}}
	        closingIssuesReferences(first:30){nodes{number}}
	      } } } }`;
	for (;;) {
		const d = gql(QP, { owner: P.repo.owner, name: P.repo.name, after });
		const c = d.repository.pullRequests;
		prs.push(...c.nodes);
		if (prs.length % 400 < 40) process.stderr.write(`prs ${prs.length}
`);
		if (!c.pageInfo.hasNextPage) break;
		after = c.pageInfo.endCursor;
	}
	writeFileSync(join(CACHE, 'issues.json'), JSON.stringify(issues));
	writeFileSync(join(CACHE, 'prs.json'), JSON.stringify(prs));
	writeFileSync(join(CACHE, 'fetched-at.txt'), new Date().toISOString());
	process.stderr.write(`cache written: ${issues.length} issues, ${prs.length} PRs\n`);
}

// --------------------------------------- classify paths ----------------------------------------
const RX = {
	ignoredForSize: (p) => P.size_ignored_prefixes.some((x) => p.startsWith(x)),
	unitTest: (p) => /^tests\/unit\/.*\.test\.ts$/.test(p) || /^src\/.*\.(test|spec)\.ts$/.test(p),
	testTree: (p) => p.startsWith('tests/'),
	impl: (p) => p.startsWith('src/') && !/\.(test|spec)\.[cm]?[jt]s$/.test(p),
	harness: (p) => P.harness_path_patterns.some((x) => new RegExp(x).test(p)),
};
// stage 4 exclusion codes -> predicate on a single path
const EXCLUDE = {
	// --- named in the plan table (§3 stage 4) ---
	X_SVELTE: (p) => /\.svelte$/.test(p),
	X_E2E: (p) => p.startsWith('tests/e2e/'),
	X_INFRA: (p) => p.startsWith('infra/'),
	X_GITHUB: (p) => p.startsWith('.github/'),
	X_IMAGE: (p) => /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp)$/i.test(p),
	X_DB_MIGRATION: (p) => p.startsWith('drizzle/') || /(^|\/)migrations?\//.test(p) || /\.sql$/.test(p),
	X_LOCK: (p) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/.test(p) || /\.lock$/.test(p),
	// --- added by the task author (flagged choices T4-T7; own codes so that each choice can be audited) ---
	X_INTEGRATION_TEST: (p) => p.startsWith('tests/integration/'), // T4
	X_SVELTE_RUNE_MODULE: (p) => /\.svelte\.[jt]s$/.test(p), // T5
	X_DB_SCHEMA_FILE: (p) => /^src\/lib\/server\/db\//.test(p) && /schema/i.test(p.split('/').pop()), // T6
	X_PLAYWRIGHT_CONFIG: (p) => /(^|\/)playwright[^/]*\.config\.[cm]?[jt]s$/.test(p), // T7
	X_DOCKER: (p) => /(^|\/)(Dockerfile[^/]*|docker-compose[^/]*)$/.test(p), // T7
	X_BASELINE_DIR: (p) => /-baseline\//.test(p), // T7
	X_SECRET_ENV: (p) => /(^|\/)\.env[^/]*$/.test(p), // T7
	X_UI_STATIC: (p) => p.startsWith('.storybook/') || p.startsWith('site/') || p.startsWith('static/'), // T7
};

function diffInfo(base, fix) {
	// name-status with rename detection: both sides of a rename are counted as touched paths
	const ns = git('diff', '--name-status', '-M', '-z', base, fix).split('\0').filter((x) => x !== '');
	const files = [];
	for (let i = 0; i < ns.length; ) {
		const st = ns[i++];
		if (st[0] === 'R' || st[0] === 'C') {
			const from = ns[i++];
			const to = ns[i++];
			files.push({ status: st[0], path: to, from });
		} else files.push({ status: st[0], path: ns[i++] });
	}
	const num = git('diff', '--numstat', '--no-renames', base, fix).split('\n').filter(Boolean);
	let add = 0;
	let del = 0;
	const sizedPaths = new Set();
	for (const line of num) {
		const [a, d, p] = line.split('\t');
		if (RX.ignoredForSize(p)) continue;
		sizedPaths.add(p);
		if (a !== '-') add += Number(a);
		if (d !== '-') del += Number(d);
	}
	return { files, additions: add, deletions: del, sized_file_count: sizedPaths.size };
}

function addedLines(base, fix) {
	const out = git('diff', '-U0', '--no-renames', base, fix, '--', '.', ':(exclude)graphify-out');
	const lines = [];
	for (const l of out.split('\n')) if (l.startsWith('+') && !l.startsWith('+++')) lines.push(l.slice(1));
	return lines;
}
const squash = (s) => s.replace(/\s+/g, '');

// --------------------------------------- select ------------------------------------------------
function select() {
	const issues = readJson(join(CACHE, 'issues.json'));
	const prs = new Map(readJson(join(CACHE, 'prs.json')).map((p) => [p.number, p]));
	const cacheHash = sha256(readFileSync(join(CACHE, 'issues.json')) + '\n' + readFileSync(join(CACHE, 'prs.json')));
	const fetchedAt = readFileSync(join(CACHE, 'fetched-at.txt'), 'utf8').trim();

	const isExcludedPr = (pr) => {
		const login = pr.author?.login ?? '';
		if (pr.author?.__typename === 'Bot' || /\[bot\]$/.test(login) || /bot$/i.test(login)) return 'bot';
		if (/^back-merge\//.test(pr.headRefName) || /back-merge/i.test(pr.title)) return 'back-merge';
		if (/^\s*\[統合\]/.test(pr.title) || /^(develop|release\/.*)$/.test(pr.headRefName)) return 'integration';
		return null;
	};

	const funnel = [];
	const step = (stage, label, inN, outN) => funnel.push({ stage, label, in: inN, out: outN });

	// ---- stage 1 ----
	// closing set of a PR = GitHub's closingIssuesReferences (only filled for PRs into the default branch)
	// + GitHub closing keywords parsed from the PR body (fenced code, inline code and HTML comments removed).
	const KW = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+(?:https:\/\/github\.com\/Takenori-Kusaka\/ganbari-quest\/issues\/|(?:Takenori-Kusaka\/ganbari-quest)?#)(\d+)/gi;
	const closingSet = (pr) => {
		const api = pr.closingIssuesReferences.nodes.map((n) => n.number);
		const text = (pr.body ?? '').replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
		const kw = [...text.matchAll(KW)].map((m) => Number(m[1]));
		return { api: new Set(api), all: new Set([...api, ...kw]) };
	};
	const byIssue = new Map(); // issue number -> [{pr, via}]
	const byIssueAny = new Map(); // including excluded PRs (for the funnel)
	for (const pr of prs.values()) {
		if (!pr.merged || !pr.mergeCommit?.oid) continue;
		const cs = closingSet(pr);
		pr._closes = cs.all;
		const excluded = isExcludedPr(pr);
		for (const n of cs.all) {
			if (!byIssueAny.has(n)) byIssueAny.set(n, []);
			byIssueAny.get(n).push(pr);
			if (excluded) continue;
			if (byIssue.get(n) === undefined) { byIssue.set(n, []); }
			byIssue.get(n).push({ pr, via: cs.api.has(n) ? 'github-link' : 'body-keyword' });
		}
	}
	const s1 = [];
	const s1reject = {};
	const bump = (o, k) => (o[k] = (o[k] ?? 0) + 1);
	let withMergedLink = 0;
	let githubLinkOnly = 0; // sensitivity for T1: items that option "github link only" would also have produced
	for (const is of issues) {
		if (!byIssueAny.has(is.number)) {
			bump(s1reject, 'S1_NO_MERGED_CLOSING_PR');
			continue;
		}
		withMergedLink++;
		const fixing = byIssue.get(is.number) ?? [];
		if (fixing.length === 0) {
			bump(s1reject, 'S1_ONLY_BOT_BACKMERGE_INTEGRATION');
			continue;
		}
		if (is.stateReason !== 'COMPLETED') {
			bump(s1reject, 'S1_NOT_COMPLETED');
			continue;
		}
		if (fixing.length !== 1) {
			bump(s1reject, 'S1_SEVERAL_FIXING_PRS');
			continue;
		}
		const { pr, via } = fixing[0];
		if (pr._closes.size !== 1) {
			bump(s1reject, 'S1_PR_CLOSES_SEVERAL_ISSUES');
			continue;
		}
		if (via === 'github-link') githubLinkOnly++;
		s1.push({ issue: is, pr, via });
	}
	step('0', 'closed issues with label type:fix', issues.length, issues.length);
	step('1a', 'closed by >=1 merged PR (GitHub link or closing keyword in the PR body)', issues.length, withMergedLink);
	step('1', 'exactly one non-excluded merged fixing PR, COMPLETED, PR closes one issue', withMergedLink, s1.length);

	// ---- evaluate every stage-1 item against every later criterion (no short-circuit) ----
	const items = [];
	let missingCommit = 0;
	for (const { issue, pr, via } of s1) {
		const fix = pr.mergeCommit.oid;
		let base;
		try {
			base = git('rev-parse', `${fix}^1`).trim();
		} catch {
			missingCommit++;
			continue;
		}
		const d = diffInfo(base, fix);
		const touched = [...new Set(d.files.flatMap((f) => (f.from ? [f.path, f.from] : [f.path])))].sort();
		const sized = touched.filter((p) => !RX.ignoredForSize(p));
		const present = d.files.filter((f) => f.status !== 'D').map((f) => f.path);
		const hidden = present.filter(RX.unitTest).sort();
		const deletedTests = d.files.filter((f) => f.status === 'D' && RX.unitTest(f.path)).map((f) => f.path).sort();
		const testSupport = sized.filter((p) => RX.testTree(p) && !RX.unitTest(p)).sort();
		const impl = sized.filter((p) => RX.impl(p)).sort();
		const other = sized.filter((p) => !RX.impl(p) && !RX.testTree(p) && !RX.unitTest(p)).sort();
		const reasons = [];
		if (d.sized_file_count > P.max_files) reasons.push('S2_FILES');
		if (d.additions + d.deletions > P.max_lines) reasons.push('S2_LINES');
		if (hidden.length === 0) reasons.push('S3_NO_UNIT_TEST');
		if (impl.length === 0) reasons.push('S3_NO_SRC_IMPL');
		for (const [code, pred] of Object.entries(EXCLUDE)) if (sized.some(pred)) reasons.push(code);

		// stage 6: leakage
		const body = issue.body ?? '';
		const bodySq = squash(body);
		const titleBody = `${issue.title}\n${body}`;
		const uniq = [...new Set(addedLines(base, fix).map(squash))];
		const leak = (n) => uniq.filter((l) => l.length >= n && bodySq.includes(l)).length;
		const leak20 = leak(P.leak_min_chars);
		const leak30 = leak(P.leak_min_chars_alt);
		if (leak20 > 0) reasons.push('S6_LEAK');

		// stage 6b: naming (recorded, never rejects)
		const namesFull = (list) => list.filter((p) => titleBody.includes(p)).length;
		const namesBase = (list) => list.filter((p) => titleBody.includes(p.split('/').pop())).length;
		const implFull = namesFull(impl);
		const implBase = namesBase(impl);

		// stage 7: stratum
		const labels = [...issue.labels.nodes, ...pr.labels.nodes].map((l) => l.name);
		const heavySignals = [];
		if (labels.includes('priority:critical')) heavySignals.push('critical');
		if (/^hotfix\//.test(pr.headRefName) || labels.some((l) => /hotfix/i.test(l))) heavySignals.push('hotfix');
		if (/再発/.test(issue.title) || /再発/.test(pr.title)) heavySignals.push('saihatsu-title');

		items.push({
			issue: issue.number,
			pr: pr.number,
			pre_fix_commit: base,
			fix_commit: fix,
			merge_parents: git('rev-list', '--parents', '-n', '1', fix).trim().split(' ').length - 1,
			base_branch: pr.baseRefName,
			link_source: via,
			merged_at: pr.mergedAt,
			issue_created_at: issue.createdAt,
			impl_paths: impl,
			hidden_check_test_paths: hidden,
			deleted_test_paths: deletedTests,
			test_support_paths: testSupport,
			other_paths: other,
			size: {
				files: d.sized_file_count,
				additions: d.additions,
				deletions: d.deletions,
				lines: d.additions + d.deletions,
				impl_files: impl.length,
				hidden_test_files: hidden.length,
				issue_body_chars: body.length,
			},
			strata: {
				heavy: heavySignals.length > 0,
				heavy_signals: heavySignals,
				names_changed_files: implFull + implBase > 0,
				named_impl_full_path: implFull,
				named_impl_basename: implBase,
				named_test_full_path: namesFull(hidden),
				after_training_cutoff: '未確認',
				merged_month: pr.mergedAt.slice(0, 7),
			},
			flags: {
				leak_lines_ge20: leak20,
				leak_lines_ge30: leak30,
				touches_harness_paths: touched.some(RX.harness),
				touches_package_json: touched.includes('package.json'),
				issue_edited_after_merge: !!issue.lastEditedAt && issue.lastEditedAt > pr.mergedAt,
				issue_created_after_pr: issue.createdAt > pr.createdAt,
				issue_body_has_image: /!\[[^\]]*\]\(|<img\s|user-attachments\/assets/.test(body),
				issue_author_is_pr_author: (issue.author?.login ?? '') === (pr.author?.login ?? '-'),
			},
			reasons,
		});
	}

	const pass = (codes) => (it) => !it.reasons.some((r) => codes.some((c) => r.startsWith(c)));
	const s2 = items.filter(pass(['S2']));
	const s3 = s2.filter(pass(['S3']));
	const s4 = s3.filter(pass(['X_']));
	const s6 = s4.filter(pass(['S6']));
	step('1c', 'fix commit and its first parent present in the clone', s1.length, items.length);
	step('2', `size: <=${P.max_files} files and <=${P.max_lines} lines (graphify-out/ ignored)`, items.length, s2.length);
	step('3', '>=1 unit test added/changed and >=1 non-test src/ file', s2.length, s3.length);
	step('4', 'no excluded path touched', s3.length, s4.length);
	step('6', `no added line (>=${P.leak_min_chars} chars) verbatim in the issue body`, s4.length, s6.length);

	// ---- stage 7: fixed order ----
	const key = (it) => [it.merged_at, String(it.pr).padStart(7, '0'), sha256(`${P.seed}:${it.pr}`)];
	const cmp = (a, b) => {
		const ka = key(a);
		const kb = key(b);
		if (ka[0] !== kb[0]) return ka[0] < kb[0] ? 1 : -1; // newest merge first
		if (ka[1] !== kb[1]) return ka[1] < kb[1] ? 1 : -1; // higher PR number first
		return ka[2] < kb[2] ? -1 : 1;
	};
	const heavy = s6.filter((x) => x.strata.heavy).sort(cmp);
	const normal = s6.filter((x) => !x.strata.heavy).sort(cmp);
	const ordered = [];
	for (let i = 0; i < Math.max(heavy.length, normal.length); i++) {
		if (i < heavy.length) ordered.push(heavy[i]);
		if (i < normal.length) ordered.push(normal[i]);
	}
	ordered.forEach((it, i) => (it.static_order = i + 1));
	step('7', `ordered (heavy ${heavy.length} / normal ${normal.length}, alternating)`, s6.length, ordered.length);

	// ---- merge in the local verification (stage 5) and the tracked classification (stage 5b) ----
	const cls = existsSync(CLASSIFICATION) ? readJson(CLASSIFICATION).items : {};
	for (const it of ordered) {
		const vp = join(VERIFY_DIR, `${it.pr}.json`);
		it.verification = existsSync(vp) ? readJson(vp) : null;
		it.hidden_check_validity = cls[String(it.pr)] ?? null;
		it.post_reasons = [];
		const v = it.verification;
		if (v) {
			if (v.static && v.static.hidden_tests_reference_stripped_paths) it.post_reasons.push('S5_TEST_READS_STRIPPED_PATH');
			// U5 = not verifiable on the author's machine (not a rejection): a run error, a missing/native module,
			// or the fix tree failing while the lock file differs from the one the local node_modules was built from.
			const depsDrift = v.static && v.static.lock_same_as_local_node_modules === false;
			if (v.run && (v.run.error || v.run.local_env_blocked || (v.run.passes_after === false && depsDrift))) it.post_reasons.push('U5_LOCAL_RUN_BLOCKED');
			else if (v.run && v.run.ran) {
				if (v.run.fails_before === false) it.post_reasons.push('S5_NOT_FAILING_BEFORE');
				if (v.run.passes_after === false) it.post_reasons.push('S5_NOT_PASSING_AFTER');
				if (v.run.passes_with_impl_and_tests_only === false) it.post_reasons.push('S5_DEPENDS_ON_UNLISTED_PATH');
				if (v.run.stable_3x === false) it.post_reasons.push('S5_UNSTABLE');
			}
		}
		if (it.hidden_check_validity?.class === 'implementation-bound') it.post_reasons.push('S5B_IMPLEMENTATION_BOUND');
	}
	const examined = ordered.filter((it) => it.verification || it.hidden_check_validity);
	const usable = ordered.filter((it) => it.verification && it.hidden_check_validity && it.post_reasons.length === 0);
	const dropped = examined.filter((it) => it.post_reasons.length > 0);
	const postCounts = {};
	for (const it of dropped) for (const r of it.post_reasons) bump(postCounts, r);
	const classCounts = {};
	for (const it of examined) if (it.hidden_check_validity) bump(classCounts, it.hidden_check_validity.class);
	const usableClass = {};
	for (const it of usable) bump(usableClass, it.hidden_check_validity.class);
	step('5/5b', 'examined in order: verification + hidden-check classification, no post reason', examined.length, usable.length);
	const primaries = usable.slice(0, P.primaries);
	const reserves = usable.slice(P.primaries, P.primaries + P.reserves);

	// ---- nearest rejected: fewest reasons first, then the fixed order key ----
	const rejected = items
		.filter((it) => it.reasons.length > 0)
		.sort((a, b) => a.reasons.length - b.reasons.length || cmp(a, b))
		.slice(0, P.nearest_rejected)
		.map((it) => ({
			issue: it.issue,
			pr: it.pr,
			fix_commit: it.fix_commit,
			merged_at: it.merged_at,
			reasons: it.reasons,
			size: it.size,
			leak_lines_ge20: it.flags.leak_lines_ge20,
			leak_lines_ge30: it.flags.leak_lines_ge30,
		}));

	const reasonCounts = {};
	for (const it of items) for (const r of it.reasons) bump(reasonCounts, r);
	const singleReason = {};
	for (const it of items) if (it.reasons.length === 1) bump(singleReason, it.reasons[0]);
	const months = {};
	for (const it of ordered) bump(months, it.strata.merged_month);

	const slim = (it, role, n) => {
		const { reasons, ...rest } = it;
		return { order: n, role, ...rest };
	};
	const out = {
		schema: 'exp48-candidates/1',
		source: { repo: `${P.repo.owner}/${P.repo.name}`, license: 'AGPL-3.0', cache_sha256: cacheHash, fetched_at: fetchedAt },
		note: 'Pointers only. No issue text, no source, no diff. Rebuild: select-candidates.mjs fetch && select.',
		parameters: P,
		threshold_choices: THRESHOLD_CHOICES,
		training_cutoff: { status: '未確認', rule_applied: 'none (T12 option b)' },
		funnel,
		stage1_rejections: s1reject,
		stage1_commit_missing_in_clone: missingCommit,
		stage1_github_link_only_count: githubLinkOnly,
		rejection_reason_counts: reasonCounts,
		rejection_single_reason_counts: singleReason,
		static_pass: {
			count: ordered.length,
			heavy: heavy.length,
			normal: normal.length,
			names_changed_files: ordered.filter((x) => x.strata.names_changed_files).length,
			named_full_path: ordered.filter((x) => x.strata.named_impl_full_path > 0).length,
			merged_month: months,
			leak_would_reject_at_ge30_only: s4.filter((x) => x.flags.leak_lines_ge30 > 0).length,
			leak_rejected_at_ge20: s4.length - s6.length,
		},
		examined_count: examined.length,
		examined_class_counts: classCounts,
		post_reason_counts: postCounts,
		usable_class_counts: usableClass,
		usable_heavy: usable.filter((it) => it.strata.heavy).length,
		usable_names_changed_files: usable.filter((it) => it.strata.names_changed_files).length,
		usable_count: usable.length,
		primaries: primaries.map((it, i) => slim(it, 'primary', i + 1)),
		reserves: reserves.map((it, i) => slim(it, 'reserve', P.primaries + i + 1)),
		dropped_after_examination: dropped.map((it) => ({
			static_order: it.static_order,
			issue: it.issue,
			pr: it.pr,
			fix_commit: it.fix_commit,
			post_reasons: it.post_reasons,
			hidden_check_validity: it.hidden_check_validity,
		})),
		not_examined_static_pass: ordered
			.filter((it) => !examined.includes(it))
			.map((it) => ({ static_order: it.static_order, issue: it.issue, pr: it.pr, heavy: it.strata.heavy, merged_at: it.merged_at })),
		nearest_rejected: rejected,
	};
	writeFileSync(OUT, `${JSON.stringify(out, null, '\t')}\n`);
	// full static-pass list for the verifier (local; pointers only, but kept out of the tracked tree to stay small)
	mkdirSync(LOCAL, { recursive: true });
	writeFileSync(join(LOCAL, 'static-pass.json'), JSON.stringify(ordered, null, 1));
	process.stderr.write(`${funnel.map((f) => `${f.stage}: ${f.in} -> ${f.out}  ${f.label}`).join('\n')}\n`);
	process.stderr.write(`usable ${usable.length}, primaries ${primaries.length}, reserves ${reserves.length}\n`);
}

const cmd = process.argv[2];
if (cmd === 'fetch') fetchAll();
else if (cmd === 'select') select();
else {
	process.stderr.write('usage: select-candidates.mjs fetch|select\n');
	process.exit(2);
}
