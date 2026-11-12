// Grade a REAL Claude Code role session with the same process graders used on Harbor runs
// (owner 2026-11-11: "設計どおりに動いているかを実態で確かめる"). Exploratory: the facts a cell
// would register (PR, changed files) are inferred from the session's own gh commands when not
// given, which the cells never allow; so this is a reading of the session, not a verdict.
//
// A real session runs for weeks and handles many PRs (the 2026-09..10 QM session: 642 calls,
// 119 gh posts over ~40 PRs), while the graders assume one judgement per record. So the unit is
// the EPISODE: the steps between two user prompts (a wake / relay / typed request). Each episode
// is graded as its own record with its own inferred PR.
//
// Usage: node experiments/live/grade-session.mjs <transcript.jsonl> [--spec spec.json] [--pr N]
//        [--role review|dev] [--episodes] [--min-calls N] [--json] [--lead-only] [--out file.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeClaudeTranscript, withoutSidechain } from '../../packages/pit-wall/src/normalize/claude-transcript.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { ghStateFromCommands, inferPrNumber, changedFilesFromDiff } from '../../packages/pit-wall/src/graders/process/gh-from-commands.mjs';
import { gradeRecord } from '../../packages/pit-wall/src/graders/process/cli.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && !a.endsWith('.json'));
if (!file) { console.error('usage: grade-session.mjs <transcript.jsonl> [--spec spec.json] [--pr N] [--role review|dev] [--episodes] [--min-calls N] [--json] [--lead-only] [--out file.json]'); process.exit(2); }
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const spec = opt('spec') ? JSON.parse(readFileSync(opt('spec'), 'utf8')) : {};
let traj = normalizeClaudeTranscript(readFileSync(file, 'utf8'));
if (args.includes('--lead-only')) traj = withoutSidechain(traj);
const role = opt('role', spec.role ?? 'review');
const minCalls = Number(opt('min-calls', 3));

function gradeTraj(t, { prOverride = null } = {}) {
  const table = eventTable(t);
  const gh = ghStateFromCommands(t, { table });
  const record = { trajectory: t, state: { gh } };
  const pr = prOverride ?? spec.pr ?? inferPrNumber(table);
  const changedFiles = spec.changedFiles ?? changedFilesFromDiff(table, pr);
  const opts = { role, specDocs: [], judgementLabels: [], passLabels: [], escalationLabels: [], decisionWords: [], author: null, ...spec, pr, changedFiles, role };
  const out = gradeRecord(record, opts);
  return { table, gh, pr, changedFiles, out };
}

// Episodes: split steps at each user prompt (by timestamp order). A prompt with no agent steps
// after it before the next prompt is dropped.
function episodes(t) {
  const prompts = (t.extra.pitwall.user_prompts ?? []).filter((p) => p.timestamp).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!prompts.length) return [{ prompt: null, steps: t.steps }];
  const eps = [];
  for (let i = 0; i < prompts.length; i++) {
    const from = prompts[i].timestamp, to = prompts[i + 1]?.timestamp ?? '￿';
    const steps = t.steps.filter((s) => s.extra?.timestamp && s.extra.timestamp >= from && s.extra.timestamp < to);
    if (steps.length) eps.push({ prompt: prompts[i], steps });
  }
  return eps;
}

const fmtChecks = (out) => out.phases.checks.map((c) => `  ${c.result === true ? 'ok  ' : c.result === false ? 'FAIL' : 'n/a '} ${String(c.b ?? '').padEnd(5)} ${c.id}`).join('\n');
const head = (s, n = 70) => String(s ?? '').replace(/\s+/g, ' ').slice(0, n);

if (args.includes('--episodes')) {
  const eps = episodes(traj);
  const rows = [];
  for (const [i, ep] of eps.entries()) {
    const sub = { ...traj, steps: ep.steps, final_message: [...ep.steps].reverse().find((s) => s.message && !s.extra?.sidechain)?.message ?? '' };
    const nCalls = ep.steps.reduce((n, s) => n + s.tool_calls.length, 0);
    if (nCalls < minCalls) continue;
    const g = gradeTraj(sub, { prOverride: opt('pr') ? Number(opt('pr')) : null });
    const f = g.out.phases.facts;
    rows.push({ episode: i, at: ep.prompt?.timestamp ?? null, prompt: head(ep.prompt?.text, 90), steps: ep.steps.length, calls: nCalls, pr: g.pr, changedFiles: g.changedFiles.length, posts: g.gh.derived.map((d) => `${d.verb}#${d.number}${d.applied ? '' : '!'}`), judged: f.judged ?? null, approved: f.approved ?? null, escalated: f.escalated ?? null, B: g.out.phases.B, E: g.out.phases.E, checks: g.out.phases.checks, facts: f });
  }
  const graded = rows.filter((r) => r.B.required > 0);
  const share = (xs) => (xs.length ? xs.reduce((s, r) => s + (r.B.share ?? 0), 0) / xs.length : null);
  const missing = {}; for (const r of graded) for (const id of r.B.missing) missing[id] = (missing[id] ?? 0) + 1;
  const summary = { file, session: traj.session_id, model: traj.agent.model, role, episodes: eps.length, gradedEpisodes: graded.length, judgedEpisodes: graded.filter((r) => r.judged).length, meanBshare: share(graded), missing, rows };
  if (args.includes('--json')) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`session ${traj.session_id} (${traj.agent.model}) role=${role}: ${eps.length} episodes, graded ${graded.length} (≥${minCalls} calls), judged ${summary.judgedEpisodes}, mean B share ${summary.meanBshare?.toFixed(2) ?? '-'}`);
    console.log('missing (count):', JSON.stringify(missing));
    console.log('| ep | at | prompt | calls | pr | files | B | missing | posts |\n|---|---|---|---|---|---|---|---|---|');
    for (const r of graded) console.log(`| ${r.episode} | ${(r.at ?? '').slice(0, 16)} | ${r.prompt.replace(/\|/g, '/')} | ${r.calls} | ${r.pr ?? '-'} | ${r.changedFiles} | ${r.B.satisfied}/${r.B.required} | ${r.B.missing.map((m) => m.replace(/^(review|test|eval|impl|research|intake)\./, '')).join(', ')} | ${r.posts.slice(0, 6).join(' ')}${r.posts.length > 6 ? ' …' : ''} |`);
  }
  if (opt('out')) writeFileSync(opt('out'), JSON.stringify(summary, null, 2));
} else {
  const g = gradeTraj(traj, { prOverride: opt('pr') ? Number(opt('pr')) : null });
  const { table, gh, pr, changedFiles, out } = g;
  const summary = {
    file, session: traj.session_id, model: traj.agent.model, cwd: traj.extra.pitwall.cwd, started: traj.extra.pitwall.started_at, ended: traj.extra.pitwall.ended_at,
    steps: traj.steps.length, sidechainSteps: traj.extra.pitwall.sidechain_steps, calls: table.nCalls, denials: traj.extra.pitwall.permission_denials.length,
    inferred: { pr, changedFiles: changedFiles.length, ghPosts: gh.derived },
    B: out.phases.B, E: out.phases.E, checks: out.phases.checks, facts: out.phases.facts, grounding: out.grounding,
  };
  if (args.includes('--json')) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`session ${summary.session} (${summary.model}) cwd=${summary.cwd} ${summary.started} → ${summary.ended}`);
    console.log(`steps ${summary.steps} (sidechain ${summary.sidechainSteps}) calls ${summary.calls} denials ${summary.denials} | pr ${pr} changedFiles ${changedFiles.length} | gh posts: ${gh.derived.length}`);
    console.log(`B ${out.phases.B.satisfied}/${out.phases.B.required} (share ${out.phases.B.share?.toFixed(2) ?? '-'}) missing: ${out.phases.B.missing.join(', ') || 'none'} | E ${out.phases.E.satisfied}/${out.phases.E.required}`);
    console.log(fmtChecks(out));
    const f = out.phases.facts; console.log(`facts: ${JSON.stringify({ judged: f.judged, approved: f.approved, escalated: f.escalated, firstJudgement: f.firstJudgement, cutUnknown: f.cutUnknown, firstImpl: f.firstImpl, edits: f.edits?.length, delegated: f.delegated?.length, baseFixed: f.baseFixed, depthStated: f.depthStated })}`);
  }
  if (opt('out')) writeFileSync(opt('out'), JSON.stringify(summary, null, 2));
}
