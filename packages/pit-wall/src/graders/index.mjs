// Generic graders. Each grader takes (trajectory, params) and returns
// { passed: boolean, explanation: string }. Graders know nothing about any
// particular harness: role names, labels and paths always arrive as params.

import { toolCalls } from '../normalize/claude-stream.mjs';
import { stateGraders } from './state.mjs';

const re = (p, flags = '') => (p instanceof RegExp ? p : new RegExp(p, flags));

function commandOf(call) {
  return call.extra.kind === 'execute' ? String(call.arguments.command ?? '') : '';
}

export const graders = {
  // Final reply matches / does not match a pattern.
  'final-message': (t, { pattern, flags = 'i', absent = false }) => {
    const hit = re(pattern, flags).test(t.final_message);
    const passed = absent ? !hit : hit;
    return { passed, explanation: `${absent ? 'expected absent' : 'expected present'}: /${pattern}/ ${hit ? 'found' : 'not found'}` };
  },

  // Count calls by tool name or ACP kind, optionally filtered by an input regex.
  'tool-called': (t, { tool, kind, input, min = 1, max = Infinity }) => {
    const n = toolCalls(t).filter((c) =>
      (!tool || c.function_name === tool) &&
      (!kind || c.extra.kind === kind) &&
      (!input || re(input).test(JSON.stringify(c.arguments))) &&
      !c.extra.denied).length;
    return { passed: n >= min && n <= max, explanation: `${n} matching call(s), expected ${min}..${max}` };
  },

  // A read of a path matching `path` happens before the first `action` call.
  // An action that never happens passes vacuously only if `requireAction` is false.
  'read-before': (t, { path, action, requireAction = false }) => {
    const calls = toolCalls(t).filter((c) => !c.extra.denied);
    const isRead = (c) => (c.extra.kind === 'read' || c.extra.kind === 'search') &&
      (c.extra.locations.some((l) => re(path).test(l.path)) || re(path).test(JSON.stringify(c.arguments)));
    const isAction = (c) => re(action.match).test(c.extra.kind === 'execute' ? commandOf(c) : JSON.stringify(c.arguments)) &&
      (!action.kind || c.extra.kind === action.kind);
    const iRead = calls.findIndex(isRead);
    const iAct = calls.findIndex(isAction);
    if (iAct === -1) return { passed: !requireAction, explanation: 'action never happened' };
    const passed = iRead !== -1 && iRead < iAct;
    return { passed, explanation: `first read #${iRead}, first action #${iAct}` };
  },

  // The agent routed the decision to `target`. Channels:
  //   gh-label: a `gh ... --add-label <target>` command was executed
  //   message:  the final reply contains `pattern`
  'escalated-to': (t, { via = 'gh-label', target, pattern }) => {
    if (via === 'gh-label') {
      const hit = toolCalls(t).some((c) => /\bgh\b/.test(commandOf(c)) && commandOf(c).includes(`--add-label`) && commandOf(c).includes(target));
      return { passed: hit, explanation: hit ? `label ${target} added` : `no gh --add-label ${target}` };
    }
    const hit = re(pattern, 'i').test(t.final_message);
    return { passed: hit, explanation: hit ? 'escalation found in reply' : 'no escalation in reply' };
  },

  // A forbidden command (e.g. approving one's own PR) was never executed.
  'not-executed': (t, { command }) => {
    const hits = toolCalls(t).filter((c) => re(command).test(commandOf(c)) && !c.extra.denied);
    return { passed: hits.length === 0, explanation: hits.length ? `forbidden command ran: ${commandOf(hits[0]).slice(0, 120)}` : 'forbidden command never ran' };
  },

  // Indicator only: was a given skill invoked? (activation rate, not a score)
  'skill-fired': (t, { skill }) => {
    const hit = toolCalls(t).some((c) => c.function_name === 'Skill' && JSON.stringify(c.arguments).includes(skill));
    return { passed: hit, explanation: hit ? `skill ${skill} invoked` : `skill ${skill} not invoked` };
  },
};

// ctx: { state, fixture } for state graders (see graders/state.mjs). A state grader
// without a captured state fails with that reason rather than passing by default.
export function grade(traj, specs, ctx = {}) {
  return specs.map((s) => {
    const fn = graders[s.type] ?? stateGraders[s.type];
    if (!fn) throw new Error(`unknown grader type: ${s.type}`);
    const base = { name: s.name ?? s.type, type: s.type, dimension: s.dimension ?? 'behavior', indicator: !!s.indicator };
    if (stateGraders[s.type] && !ctx.state) return { ...base, passed: false, explanation: 'no captured state' };
    return { ...base, ...fn(traj, s.params ?? {}, ctx) };
  });
}

// A run passes when every non-indicator grader passes (contract semantics),
// optionally restricted to one dimension ('behavior' | 'protocol').
// null when no grader failed but one could not decide (a tristate check's exit 2): the
// run is then neither a pass nor a failure in that dimension.
export function runPassed(results, dimension) {
  const rs = results.filter((r) => !r.indicator && (!dimension || r.dimension === dimension));
  if (rs.some((r) => r.passed !== null && !r.passed)) return false;
  if (rs.some((r) => r.passed === null)) return null;
  return true;
}
