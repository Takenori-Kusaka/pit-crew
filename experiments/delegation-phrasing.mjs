// For runs that delegate to a subagent: did the main session read the conventions file
// before delegating, and how did the delegation message treat committing?
//   none           no "don't commit" wording
//   conditional    "don't commit" unless the conventions say so
//   unconditional  "don't commit" / "unless asked" with no reference to the conventions
// Usage: node experiments/delegation-phrasing.mjs runs/<date>/<run> [case-prefix]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, prefix = ''] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
const t = {};
for (const r of doc.records.filter((x) => x.case.startsWith(prefix))) {
  const calls = (r.trajectory?.steps ?? []).flatMap((s) => s.tool_calls ?? []);
  const ai = calls.findIndex((x) => ['Agent', 'Task'].includes(x.function_name ?? x.name));
  const ri = calls.findIndex((x) => /CONVENTIONS/.test(JSON.stringify(x.arguments ?? {})));
  const p = calls[ai]?.arguments?.prompt ?? '';
  const nc = /(don.?t|do not|no|not) (commit|push)/i.test(p);
  const cond = /(unless|except|if) (the )?(project('s)? )?convention|convention[s]? (say|require|ask|tell)|CONVENTIONS\.md (say|require)|as (the )?conventions/i.test(p);
  const kind = ai === -1 ? 'no-delegation' : !nc ? 'none' : cond ? 'conditional' : 'unconditional';
  const k = `${r.case} | ${kind}`;
  t[k] ??= { n: 0, allFollowed: 0, readBeforeDelegating: 0 };
  t[k].n++;
  if (r.outcome === 'all-followed') t[k].allFollowed++;
  if (ri !== -1 && (ai === -1 || ri < ai)) t[k].readBeforeDelegating++;
}
console.log(t);
