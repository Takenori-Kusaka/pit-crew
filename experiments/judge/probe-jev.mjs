// One minimal System One call to confirm the key and the response shape (prints status, answer
// keys and usage only; never the key). Usage: node experiments/judge/probe-jev.mjs
import { apiKey, systemOne, readerQuestion, pickFromAnswer, JEV_URL, JEV_MODEL } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';

if (!apiKey()) { console.error('no key'); process.exit(2); }
const options = [{ text: 'reuse the existing helper' }, { text: 'write a new helper' }];
const rationale = 'The existing helper already handles the error cases we need; writing a new one would duplicate that logic.';
const { state, questions, labelOf } = readerQuestion(options, 0, rationale, 7);
console.log(`POST ${JEV_URL} model=${JEV_MODEL}`);
try {
  const r = await systemOne(state, questions);
  console.log('answers:', JSON.stringify(r.answers));
  console.log('usage:', JSON.stringify(r.usage ?? null));
  console.log('pick index:', pickFromAnswer(r.answers, labelOf), '(expected 0)');
} catch (e) {
  console.log('error:', String(e.message ?? e).slice(0, 400));
  process.exit(1);
}
