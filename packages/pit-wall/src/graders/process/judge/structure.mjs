// Deterministic reasoning over an extracted decision structure (research-machine-only-rationale-
// evaluation §2.2 #7-#9, §4 step 3): the SEURAT inferences (Burge 2005, truth-valued subset), the
// grounded extension of the argumentation framework the pros / cons form (Dung 1995), the
// counting / dominance decision principles (Amgoud & Prade 2009) and Pareto non-inferiority on a
// criteria matrix. All definitional: no model, no labels. Internal coherence only — the truth of
// the premises and the completeness of the option set are out of scope (research §7).
//
// structure = {
//   decision: string,
//   options: [{ id, text, adopted: boolean, pros: [string], cons: [string | { text, rebuttal?: string }] }],
//   criteria?: { names: [string], matrix: { [optionId]: { [criterion]: '+' | '-' | '0' } } },
//   trivial?: { claimed: boolean, reason?: string },
// }

const norm = (s) => String(s ?? '').toLowerCase().replace(/[`*_"'“”「」『』]/g, '').replace(/\s+/g, ' ').trim();
const conText = (c) => (typeof c === 'string' ? c : c?.text ?? '');
const conRebuttal = (c) => (typeof c === 'string' ? null : c?.rebuttal ?? null);
export const adoptedOf = (s) => (s.options ?? []).filter((o) => o.adopted);

// SEURAT-style inferences, truth-valued. Each finding names the inference and what triggered it.
//   S1  the adopted option has no supporting argument
//   S2  the adopted option has only arguments against it
//   M1  another option has strictly more unrebutted support (pros - cons) than the adopted one
//   M3  the same statement is used both for and against one option (contradiction)
//   M4  the same argument text is used for two or more options (duplicate argument)
//   M10 the adopted option has no argument against it (one-sided: trade-off missing)
//   T0  no option is marked adopted / more than one is
export function seurat(s) {
  const out = [];
  const opts = s.options ?? [];
  const adopted = adoptedOf(s);
  if (adopted.length !== 1) { out.push({ code: 'T0', detail: `${adopted.length} adopted options` }); return out; }
  const a = adopted[0];
  if (!(a.pros ?? []).length) out.push({ code: 'S1', detail: 'adopted option has no pro' });
  if (!(a.pros ?? []).length && (a.cons ?? []).length) out.push({ code: 'S2', detail: 'adopted option has only cons' });
  if (!(a.cons ?? []).length && opts.length > 1) out.push({ code: 'M10', detail: 'adopted option has no con (no trade-off stated)' });
  for (const o of opts) {
    const pros = new Set((o.pros ?? []).map(norm)), cons = new Set((o.cons ?? []).map((c) => norm(conText(c))));
    for (const p of pros) if (cons.has(p)) out.push({ code: 'M3', detail: `"${p.slice(0, 60)}" is both for and against ${o.id}` });
  }
  const seen = new Map();
  for (const o of opts) for (const t of [...(o.pros ?? []), ...(o.cons ?? []).map(conText)]) {
    const k = norm(t); if (!k) continue;
    if (seen.has(k) && seen.get(k) !== o.id) out.push({ code: 'M4', detail: `"${k.slice(0, 60)}" used for ${seen.get(k)} and ${o.id}` });
    else seen.set(k, o.id);
  }
  const support = (o) => (o.pros ?? []).length - (o.cons ?? []).filter((c) => !conRebuttal(c)).length;
  for (const o of opts) if (!o.adopted && support(o) > support(a)) out.push({ code: 'M1', detail: `${o.id} has more unrebutted support (${support(o)}) than the adopted ${a.id} (${support(a)})` });
  return out;
}

// Argumentation framework: option nodes, con nodes (attack their option), rebuttal nodes (attack
// their con). Pros support (no attack) and are not nodes. Acyclic by construction, so the grounded
// extension is unique and equals the preferred / stable one (Dung 1995 Thm 30); computed by the
// characteristic-function fixed point. The adopted option is `in` when every con on it is rebutted.
export function grounded(s) {
  const nodes = new Set(), attacks = []; // [attacker, target]
  for (const o of s.options ?? []) {
    nodes.add(o.id);
    (o.cons ?? []).forEach((c, i) => {
      const cid = `${o.id}#con${i}`; nodes.add(cid); attacks.push([cid, o.id]);
      if (conRebuttal(c)) { const rid = `${cid}#reb`; nodes.add(rid); attacks.push([rid, cid]); }
    });
  }
  const attackersOf = (n) => attacks.filter(([, t]) => t === n).map(([a]) => a);
  let inSet = new Set(), outSet = new Set();
  for (;;) {
    const nextIn = new Set([...nodes].filter((n) => attackersOf(n).every((a) => outSet.has(a))));
    const nextOut = new Set([...nodes].filter((n) => attackersOf(n).some((a) => nextIn.has(a))));
    if (nextIn.size === inSet.size && nextOut.size === outSet.size) break;
    inSet = nextIn; outSet = nextOut;
  }
  const status = (n) => (inSet.has(n) ? 'in' : outSet.has(n) ? 'out' : 'undec');
  const adopted = adoptedOf(s)[0];
  return { in: [...inSet], out: [...outSet], adopted: adopted ? status(adopted.id) : null, options: Object.fromEntries((s.options ?? []).map((o) => [o.id, status(o.id)])) };
}

// Pareto non-inferiority on the criteria matrix: the adopted option is dominated when some
// rejected option is at least as good on every criterion and strictly better on one. A decisive
// criterion is one on which the adopted option strictly beats every rejected option.
const RANK = { '+': 1, '0': 0, '-': -1 };
export function pareto(s) {
  const m = s.criteria?.matrix, names = s.criteria?.names ?? [];
  const adopted = adoptedOf(s)[0];
  if (!m || !adopted || !names.length) return { applicable: false };
  const v = (id, c) => RANK[m[id]?.[c] ?? '0'] ?? 0;
  const dominatedBy = [];
  for (const o of s.options ?? []) {
    if (o.adopted) continue;
    const geAll = names.every((c) => v(o.id, c) >= v(adopted.id, c)), gtOne = names.some((c) => v(o.id, c) > v(adopted.id, c));
    if (geAll && gtOne) dominatedBy.push(o.id);
  }
  const decisive = names.filter((c) => (s.options ?? []).filter((o) => !o.adopted).every((o) => v(adopted.id, c) > v(o.id, c)));
  return { applicable: true, dominatedBy, nonInferior: dominatedBy.length === 0, decisive };
}

// One coherence verdict per structure (design 26 / research §3.1 "coherent"): no SEURAT finding,
// the adopted option survives the grounded extension, and it is Pareto non-inferior when a matrix
// is given. Findings are returned so a 2x2 reading against `correct` stays possible.
export function coherence(s) {
  const findings = seurat(s), g = grounded(s), p = pareto(s);
  const coherent = findings.length === 0 && g.adopted === 'in' && (!p.applicable || p.nonInferior);
  return { coherent, findings, grounded: g.adopted, pareto: p };
}
