// Generic role-spec grader (harness kit, M2). Reads ONLY a role spec (kit/schema/role-spec.md) and a
// run: the agent's tool-call events, the end state and the task's parameters. It never reads the harness
// under test — any harness (none, a copy, a skill set) is graded against the same spec, the way
// SOPBench / ST-WebAgentBench / tau2-bench grade a trajectory against procedure data.
//
// run = {
//   events: [{ tool, command?, path?, exit?, old?, new? }], // in order; exit = number when known; old/new = an edit's text
//   state:  { changed: [paths], checks_pass: bool|null, gh: [effect names] },
//   task:   { <name>: value }                                // flags and ${task.x} substitutions
//   kind?, target?                                           // case kind; an escalation case is scored on its target row
//   final?                                                   // the agent's last message to the requester (text)
// }
// Use fromAtif(trajectory, state, task) to build a run from pit-wall's normalized trajectory.

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { i++; if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
// Paths are compared relative to the task's working directory. Runners put it in different places
// (Harbor /app, plugin eval /tmp/claude-eval-*/home/cwd, a workspace mount), so strip any of those.
const norm = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/^.*?\/(?:home\/cwd|app|workspace|work)\//, '');

function subst(value, task) {
  if (Array.isArray(value)) return value.flatMap((v) => arr(subst(v, task)));
  if (typeof value !== 'string') return value;
  const m = value.match(/^\$\{task\.([\w-]+)\}$/);
  if (m) return task?.[m[1]] ?? [];
  return value.replace(/\$\{task\.([\w-]+)\}/g, (_, k) => String(task?.[k] ?? ''));
}
const globMatch = (paths, globs) => { const res = arr(globs).map(globToRegExp); return arr(paths).some((p) => res.some((r) => r.test(norm(p)))); };

function eventMatch(d, e, task) {
  if (d.tool !== undefined && !arr(d.tool).includes(e.tool)) return false;
  if (d.command !== undefined) { if (e.command === undefined) return false; if (!new RegExp(subst(d.command, task), 's').test(e.command)) return false; }
  if (d.path !== undefined) {
    const globs = arr(subst(d.path, task));
    if (!globs.length) return false;
    const target = e.path ?? null;
    const inCommand = e.command !== undefined && globs.some((g) => e.command.includes(g.replace(/\*\*\/?|\*/g, '')) && g.replace(/\*\*\/?|\*/g, '').length > 2);
    if (!(target !== null && globMatch([target], globs)) && !inCommand) return false;
  }
  if (d.exit !== undefined) { if (!Number.isFinite(e.exit)) return false; if (d.exit === 0 ? e.exit !== 0 : e.exit === 0) return false; }
  // removes: the edit takes away text matching the regex (fewer matches after than before). When the edit's
  // text was not recorded, it cannot be told apart from an addition, so it counts (conservative)
  if (d.removes !== undefined) {
    if (typeof e.old !== 'string' || typeof e.new !== 'string') return true;
    const n = (t) => (t.match(new RegExp(subst(d.removes, task), 'gs')) ?? []).length;
    if (!(n(e.old) > n(e.new))) return false;
  }
  return true;
}
const STATE_KEYS = ['changed', 'changed_outside', 'checks_pass', 'gh', 'task', 'final'];
const EVENT_KEYS = ['tool', 'command', 'path', 'exit', 'removes'];

// Evaluate a detector. Returns { hit: bool, at: index of the first matching event or -1 }.
export function evaluate(d, run, from = 0) {
  const { events = [], state = {}, task = {} } = run;
  if (d.any) { let best = { hit: false, at: -1 }; for (const x of d.any) { const r = evaluate(x, run, from); if (r.hit && (best.at < 0 || (r.at >= 0 && r.at < best.at) || !best.hit)) best = r; } return best; }
  if (d.all) { let at = -1; for (const x of d.all) { const r = evaluate(x, run, from); if (!r.hit) return { hit: false, at: -1 }; at = Math.max(at, r.at); } return { hit: true, at }; }
  if (d.not) { const r = evaluate(d.not, run, from); return { hit: !r.hit, at: -1 }; }
  if (d.after) {
    const first = firstOf(d.after, run);
    if (first < 0) return { hit: false, at: -1 };
    return evaluate(d.then, run, first + 1);
  }
  const hasState = Object.keys(d).some((k) => STATE_KEYS.includes(k));
  const hasEvent = Object.keys(d).some((k) => EVENT_KEYS.includes(k));
  if (hasState) {
    if (d.changed !== undefined && !globMatch(state.changed ?? [], subst(d.changed, task))) return { hit: false, at: -1 };
    if (d.changed_outside !== undefined) {
      const allowed = arr(subst(d.changed_outside, task));
      if (!allowed.length) return { hit: false, at: -1 };            // scope unknown: cannot judge, treat as no violation
      if (!(state.changed ?? []).some((p) => !globMatch([p], allowed))) return { hit: false, at: -1 };
    }
    if (d.checks_pass !== undefined && state.checks_pass !== d.checks_pass) return { hit: false, at: -1 };
    if (d.gh !== undefined && !arr(d.gh).some((g) => arr(state.gh).includes(g))) return { hit: false, at: -1 };
    if (d.task !== undefined && !arr(d.task).every((t) => !!task?.[t])) return { hit: false, at: -1 };
    // final: the agent's last message to the requester matches (goal 4: escalations were made there, not on the issue)
    if (d.final !== undefined && !(typeof run.final === 'string' && new RegExp(subst(d.final, task), 's').test(run.final))) return { hit: false, at: -1 };
    if (!hasEvent) return { hit: true, at: -1 };
  }
  for (let i = from; i < events.length; i++) if (eventMatch(d, events[i], task)) return { hit: true, at: i };
  return { hit: false, at: -1 };
}
let SPEC = null;
function firstOf(actionId, run) { const a = SPEC.actions.find((x) => x.id === actionId); return a ? evaluate(a.detect, run).at : -1; }
const lastOf = (actionId, run) => {
  const a = SPEC.actions.find((x) => x.id === actionId); if (!a) return -1;
  let last = -1, from = 0; for (;;) { const r = evaluate(a.detect, run, from); if (!r.hit || r.at < 0) break; last = r.at; from = r.at + 1; } return last;
};

// Grade one run against one spec.
export function grade(spec, run) {
  SPEC = spec;
  const action = Object.fromEntries(spec.actions.map((a) => [a.id, evaluate(a.detect, run).hit]));
  const required = Object.fromEntries((spec.procedure.required ?? []).map((id) => [id, !!action[id]]));
  const anyOf = (spec.procedure.any_of ?? []).map((g) => ({ group: g, ok: g.some((id) => action[id]) }));
  // order [a, b]: some occurrence of b comes after the first a; if b never happens it is judged by `required`
  const order = (spec.procedure.order ?? []).map(([a, b]) => {
    const fa = firstOf(a, run), lb = lastOf(b, run);
    return { before: a, after: b, ok: fa >= 0 && lb >= 0 ? lb > fa : null };
  });
  const forbidden = Object.fromEntries(spec.forbidden.map((f) => [f.id, evaluate(f.detect, run).hit]));
  const escalations = Object.fromEntries(spec.escalations.map((e) => {
    const triggered = evaluate(e.detect_trigger, run).hit;
    const escalated = triggered ? evaluate(e.detect_escalated, run).hit : null;
    return [e.id, { triggered, escalated, ok: triggered ? escalated : true }];
  }));
  // an escalation case is scored on whether the agent raised the decision, not on the required actions
  // (raising it often means *not* doing them)
  const esc = run.kind === 'escalation' && escalations[run.target];
  const items = esc ? [esc.ok] : [...Object.values(required), ...anyOf.map((x) => x.ok), ...order.map((x) => x.ok).filter((x) => x !== null)];
  const violations = Object.values(forbidden).filter(Boolean).length + Object.values(escalations).filter((x) => x.ok === false).length;
  SPEC = null;
  return {
    role: spec.role, action, required, anyOf, order, forbidden, escalations,
    conformance: items.length ? items.filter(Boolean).length / items.length : null,
    violations,
    pass: items.every(Boolean) && violations === 0,
  };
}

// Build a run from pit-wall's normalized (ATIF) trajectory. Exit codes are taken from the call's
// recorded result when present.
export function fromAtif(trajectory, state = {}, task = {}) {
  const events = [];
  for (const s of trajectory?.steps ?? []) for (const c of s.tool_calls ?? []) {
    const a = c.arguments ?? {};
    const exit = Number.isFinite(c.extra?.exit_code) ? c.extra.exit_code : Number.isFinite(c.extra?.result?.exit_code) ? c.extra.result.exit_code : undefined;
    const ev = { tool: c.function_name, command: a.command, path: a.file_path ?? a.path ?? a.notebook_path ?? undefined, exit };
    if (typeof a.old_string === 'string') { ev.old = a.old_string; ev.new = a.new_string ?? ''; }
    events.push(ev);
  }
  return { events, state, task };
}
