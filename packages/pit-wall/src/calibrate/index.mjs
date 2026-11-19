// Judge calibration: humans label a sample of judge-graded runs, blind to the arm
// and to every judge verdict; then each judge is scored against those labels.
//
//   sample  pick runs from stored results into <dir>/items.json (key + view)
//   serve   local labelling page on 127.0.0.1; labels go to <dir>/labels.json
//   score   agreement and Cohen's kappa of each judge (and their majority) vs humans
//
// Everything lives in files under <dir>, so the set is versioned with the repo.

import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { toolCalls } from '../normalize/claude-stream.mjs';

const PAGE = join(dirname(fileURLToPath(import.meta.url)), 'page.html');

function mulberry(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Verdicts for one record: pit-wall's own (record.judged) plus any judge-agree
// outputs saved next to the results as judge-<model>.json.
function siblingVerdicts(resultsPath) {
  const out = {};
  const dir = dirname(resultsPath);
  for (const f of existsSync(dir) ? readdirSync(dir) : []) {
    const m = f.match(/^judge-(.+)\.json$/);
    if (!m) continue;
    for (const x of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
      (out[`${x.arm}|${x.case}|${x.trial}|${x.grader}`] ??= {})[m[1]] = x.pitwall;
    }
  }
  return out;
}

// sources: [{ path, records, runner }]; suite: loaded suite. Stratified by case x arm,
// runs where judges disagree first, then a deterministic shuffle.
export function sampleItems(sources, suite, { n = 30, seed = 7 } = {}) {
  const cases = Object.fromEntries(suite.cases.map((c) => [c.id, c]));
  const pool = [];
  for (const src of sources) {
    const extra = siblingVerdicts(src.path);
    for (const r of src.records) {
      const kase = cases[r.case];
      if (!kase || !r.trajectory || r.validity?.status === 'invalid') continue;
      // Runs made with other case materials (or before digests were recorded) are left
      // out: the page would show documents the agent never saw.
      if (r.caseDigest !== kase.digest) continue;
      for (const g of kase.graders.filter((x) => x.type === 'judge')) {
        const judges = { ...(extra[`${r.arm}|${r.case}|${r.trial}|${g.name}`] ?? {}) };
        const own = r.judged?.[g.name];
        if (own && own.passed !== null && judges[own.model] === undefined) judges[own.model] = own.passed;
        const vals = Object.values(judges).filter((v) => v !== null && v !== undefined);
        pool.push({
          key: { results: src.path, runner: src.runner, arm: r.arm, case: r.case, trial: r.trial, grader: g.name },
          judges,
          disagree: new Set(vals).size > 1,
          view: {
            case: r.case,
            guide: kase.labelGuide ?? null,
            rubric: g.rubric,
            task: kase.prompt,
            docs: Object.entries(kase.files).map(([path, text]) => ({ path, text })),
            // What the agent ran and what came back: without the output a labeller cannot
            // tell a label that was added from one that failed.
            actions: toolCalls(r.trajectory).filter((c) => ['execute', 'edit'].includes(c.extra.kind)).map((c) => ({
              command: String(c.arguments.command ?? c.arguments.file_path ?? ''),
              output: String(c.extra.result?.text ?? '').slice(0, 800),
              error: !!c.extra.result?.is_error,
            })),
            reply: r.trajectory.final_message,
          },
        });
      }
    }
  }
  const rand = mulberry(seed);
  const shuffle = (xs) => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
  const picked = shuffle(pool.filter((p) => p.disagree)).slice(0, n);
  const strata = {};
  for (const p of shuffle(pool.filter((p) => !p.disagree))) (strata[`${p.key.case}|${p.key.arm}`] ??= []).push(p);
  const keys = Object.keys(strata).sort();
  while (picked.length < n && keys.some((k) => strata[k].length)) {
    for (const k of keys) if (picked.length < n && strata[k].length) picked.push(strata[k].shift());
  }
  return shuffle(picked).map((p, i) => ({ id: `c${String(i + 1).padStart(2, '0')}`, ...p }));
}

// Japanese aids for labellers who do not read English fluently. The translation is
// stored in items.json (versioned, reviewed like any other file) and the page always
// shows the original next to it.
//
// A translation is labelling material, so it is checked like a grader. The first version
// translated reply and actions in one call: it showed action descriptions as the reply
// (7 of 30) and left replies wholly or partly in English (3 of 30). Now the
// reply and the actions are separate calls, a mechanical check rejects untranslated text,
// and a second model compares meaning (negation, who did what, numbers). Anything that
// still fails is marked unverified and the page says so.
const REPLY_SYSTEM = [
  'Translate the English text into natural Japanese for a human reviewer.',
  'Output only the translation. Translate every sentence, literally and completely.',
  'Do not summarize, soften, strengthen, add or evaluate anything. Keep negations exactly.',
  'Keep numbers, file paths, label names, issue numbers and code as they are.',
].join(' ');

const ACTIONS_SYSTEM = [
  'For each numbered shell command and its output, write one Japanese sentence saying what the command did and what came back,',
  'for example: Issue #12 にラベル needs-decision を付けた（成功）. Do not evaluate. Keep code, numbers and names as they are.',
].join(' ');

const CHECK_SYSTEM = [
  'You check a Japanese translation against its English source for a human reviewer who cannot read English.',
  'Report only differences in meaning: missing or added sentences, flipped negation, changed actor (who did or did not do what),',
  'changed numbers, values or names, or text left in English. Ignore style.',
].join(' ');

const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });

// Share of Japanese characters among letters, outside code spans and URLs.
export function japaneseShare(text) {
  const prose = String(text).replace(/`[^`]*`/g, '').replace(/https?:\S+/g, '');
  const ja = (prose.match(/[぀-ヿ一-鿿]/g) ?? []).length;
  const latin = (prose.match(/[A-Za-z]/g) ?? []).length;
  return ja + latin ? ja / (ja + latin) : 1;
}

function translateReply(text, call, models) {
  if (!text?.trim()) return { text: '', status: 'verified', problems: [] };
  let feedback = '';
  let last = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ja = call(REPLY_SYSTEM, text + feedback, obj({ translation: { type: 'string' } }), models.translate).translation;
    const problems = [];
    if (japaneseShare(ja) < 0.5) problems.push('untranslated: most of the text is still English');
    else {
      const c = call(CHECK_SYSTEM, `## English source\n${text}\n\n## Japanese translation\n${ja}\n`,
        obj({ faithful: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }), models.check);
      if (!c.faithful) problems.push(...c.problems);
    }
    last = { text: ja, status: problems.length ? 'unverified' : 'verified', problems };
    if (!problems.length) return last;
    feedback = `\n\n(A previous translation had these problems; avoid them: ${problems.join(' / ')})`;
  }
  return last;
}

// call(system, prompt, schema, model) -> parsed JSON. Items already verified are kept.
export function translateItems(items, { call, models = { translate: 'sonnet', check: 'haiku' } }) {
  return items.map((it) => {
    if (it.ja?.status === 'verified') return it;
    const reply = translateReply(it.view.reply, call, models);
    const n = it.view.actions.length;
    const acts = it.view.actions.map((a, i) => `[${i + 1}] $ ${a.command}\n${a.error ? '(error) ' : ''}${a.output || '(no output)'}`).join('\n\n');
    const actions = n ? call(ACTIONS_SYSTEM, acts, obj({ sentences: { type: 'array', items: { type: 'string' }, minItems: n, maxItems: n } }), models.translate).sentences : [];
    return { ...it, ja: { models, reply: reply.text, actions, status: reply.status, problems: reply.problems } };
  });
}

// Hash of exactly what the labeller is shown. Each label records it; a label made on
// other material (an earlier, defective translation) no longer counts in score().
export const shownDigest = (it) => createHash('sha256').update(JSON.stringify([it.view, it.ja?.reply ?? null, it.ja?.actions ?? null])).digest('hex').slice(0, 16);

// What the labeller sees: no arm, no runner, no judge verdicts.
export const blindView = (items) => items.map((it) => ({ id: it.id, ...it.view, shown: shownDigest(it),
  ja: it.ja ? { reply: it.ja.reply, actions: it.ja.actions, status: it.ja.status, problems: it.ja.problems ?? [] } : null }));

export function serve(dir, { port = 4319 } = {}) {
  const items = JSON.parse(readFileSync(join(dir, 'items.json'), 'utf8'));
  const labelsPath = join(dir, 'labels.json');
  const load = () => (existsSync(labelsPath) ? JSON.parse(readFileSync(labelsPath, 'utf8')) : {});
  const ids = new Set(items.map((i) => i.id));
  const server = createServer((req, res) => {
    const send = (code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
    if (req.method === 'GET' && req.url === '/') return send(200, readFileSync(PAGE), 'text/html; charset=utf-8');
    if (req.method === 'GET' && req.url === '/api/items') return send(200, JSON.stringify(blindView(items)));
    if (req.method === 'GET' && req.url === '/api/labels') return send(200, JSON.stringify(load()));
    const m = req.url.match(/^\/api\/labels\/([\w-]+)$/);
    if (req.method === 'PUT' && m && ids.has(m[1])) {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
      req.on('end', () => {
        try {
          const v = JSON.parse(body);
          if (v.label && !['pass', 'fail', 'unsure'].includes(v.label)) return send(400, '"bad label"');
          const shown = shownDigest(items.find((i) => i.id === m[1]));
          if (v.shown !== shown) return send(409, '"the material changed since the page was loaded: reload"');
          const all = load();
          all[m[1]] = { label: v.label ?? all[m[1]]?.label ?? null, note: String(v.note ?? all[m[1]]?.note ?? ''), shown, updatedAt: new Date().toISOString() };
          const tmp = `${labelsPath}.tmp`;
          writeFileSync(tmp, JSON.stringify(all, null, 2) + '\n');
          renameSync(tmp, labelsPath); // atomic: a crash never leaves half a file
          send(200, JSON.stringify(all[m[1]]));
        } catch (e) { send(400, JSON.stringify(String(e.message))); }
      });
      return;
    }
    send(404, '"not found"');
  });
  server.listen(port, '127.0.0.1');
  return server;
}

// Cohen's kappa for two binary raters.
export function kappa(pairs) {
  const n = pairs.length;
  if (!n) return null;
  const agree = pairs.filter(([a, b]) => a === b).length / n;
  const pa = pairs.filter(([a]) => a).length / n, pb = pairs.filter(([, b]) => b).length / n;
  const pe = pa * pb + (1 - pa) * (1 - pb);
  return pe === 1 ? (agree === 1 ? 1 : 0) : (agree - pe) / (1 - pe);
}

// Score every judge (and the majority of all judges) against human labels.
// 'unsure' labels are excluded from agreement and counted separately.
// Labels made on other material than the item now shows (no `shown` digest, or a
// different one) are reported as stale and left out.
export function score(items, allLabels) {
  const judgeNames = [...new Set(items.flatMap((it) => Object.keys(it.judges)))].sort();
  const stale = items.filter((it) => allLabels[it.id]?.label && allLabels[it.id].shown !== shownDigest(it)).map((it) => it.id);
  const labels = Object.fromEntries(items.filter((it) => allLabels[it.id] && !stale.includes(it.id)).map((it) => [it.id, allLabels[it.id]]));
  const sure = items.filter((it) => ['pass', 'fail'].includes(labels[it.id]?.label));
  const human = (it) => labels[it.id].label === 'pass';
  const rows = [];
  const rater = (name, verdict) => {
    const pairs = sure.map((it) => [human(it), verdict(it)]).filter(([, v]) => v !== null && v !== undefined);
    const misses = sure.filter((it) => { const v = verdict(it); return v !== null && v !== undefined && v !== human(it); });
    rows.push({ judge: name, n: pairs.length, agreement: pairs.length ? pairs.filter(([a, b]) => a === b).length / pairs.length : null, kappa: kappa(pairs),
      falsePass: misses.filter((it) => !human(it)).map((it) => it.id), falseFail: misses.filter((it) => human(it)).map((it) => it.id) });
  };
  for (const j of judgeNames) rater(j, (it) => it.judges[j]);
  if (judgeNames.length > 1) {
    rater('majority', (it) => { const v = judgeNames.map((j) => it.judges[j]).filter((x) => x !== null && x !== undefined); const p = v.filter(Boolean).length; return v.length && p * 2 !== v.length ? p * 2 > v.length : null; });
  }
  return { stale, labelled: Object.values(labels).filter((l) => l?.label).length, unsure: items.filter((it) => labels[it.id]?.label === 'unsure').map((it) => it.id), total: items.length, rows };
}

