// Scripted records for the process-grader tests. A script is a list of steps:
//   ['say', text]                         an assistant message
//   ['Bash', command, output, isError?]   a Bash call and its result
//   [Tool, input, output, isError?]       any other tool (input is the arguments object)
// files: the end state { path: text }; final: the final reply.
export function rec(script, { files = {}, final = '', instruction = null, log = null, arm = 'a', kase = 'c' } = {}) {
  const steps = [];
  let step = { message: '', tool_calls: [] };
  let id = 0;
  const flush = () => { if (step.message || step.tool_calls.length) steps.push(step); step = { message: '', tool_calls: [] }; };
  for (const s of script) {
    if (s[0] === 'say') { flush(); step.message = s[1]; continue; }
    const [tool, input, output = '', isError = false] = s;
    step.tool_calls.push({
      tool_call_id: `t${++id}`, function_name: tool,
      arguments: tool === 'Bash' ? { command: input } : input,
      extra: { kind: 'x', locations: [], denied: false, result: { is_error: isError, text: output } },
    });
    flush();
  }
  flush();
  if (final) steps.push({ message: final, tool_calls: [] });
  return {
    arm, case: kase, trial: 1,
    trajectory: { steps, final_message: final, extra: { pitwall: { instruction } } },
    state: { files: Object.fromEntries(Object.entries(files).map(([p, t]) => [p, { sha256: 'x', text: t }])), git: { log: log ?? [] } },
  };
}

// A small repository used by most tests: a price script with a rounding bug, its caller,
// and a test.
export const REPO = {
  'bin/price': '#!/bin/bash\n# Member price in cents: 10% off, rounded down.\necho $(( ($1 * 90 + 99) / 100 ))\n',
  'bin/quote': '#!/bin/bash\n# Quote shown on the order page.\necho "quote: $(bash bin/price $1)"\n',
  'tests/price_test.sh': '#!/bin/bash\nfail=0\n[ "$(bash bin/price 500)" = 450 ] || { echo "price 500"; fail=1; }\nexit $fail\n',
  'README.md': 'Member price: 10% off, rounded down. Used by `bin/price` and `bin/quote`.\n',
};
export const CAT_PRICE = REPO['bin/price'];
