#!/bin/bash
# Can an open model run on this host as a judge juror (planning 23 §4)? Starts ollama (user-local,
# 127.0.0.1 only), pulls a model, runs a judge-sized prompt 3 times, and reports load/eval speed,
# GPU memory and host free memory. Stops the server afterwards.
# Usage (WSL): experiments/judge/probe-local.sh [model]   (default qwen3:8b)
set -u -o pipefail
M=${1:-qwen3:8b}
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
$O pull $M 2>&1 | tail -1
free -m | awk '/^Mem:/{print "host available MiB before", $7}'
# a judge-sized request: a rubric item and an evidence window of about 3k tokens
EVID=$(for i in $(seq 1 120); do echo "step $i: read lib/util/money.sh line $i; observed value round_down($i) = $((i*9/10))"; done)
PROMPT="You judge one rubric item. Item R4: the decisive argument refers to at least one observation from this task. Evidence:\n$EVID\nClaim: 'We chose rounding down because money.sh line 42 shows round_down is used by all three callers.'\nAnswer as JSON {quotes:[...], reasoning:'...', verdict:'met'|'not-met'}."
for k in 1 2 3; do
  node -e "
const body=JSON.stringify({model:'$M',prompt:process.argv[1],stream:false,options:{temperature:0},think:false});
fetch('http://127.0.0.1:11434/api/generate',{method:'POST',body}).then(r=>r.json()).then(j=>console.log('run $k: load', (j.load_duration/1e9).toFixed(1)+'s', 'prompt tok', j.prompt_eval_count, 'in', (j.prompt_eval_duration/1e9).toFixed(1)+'s', 'out tok', j.eval_count, 'in', (j.eval_duration/1e9).toFixed(1)+'s', '| verdict:', (j.response||'').match(/not-met|met/)?.[0]))" "$(printf "$PROMPT")"
done
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader
free -m | awk '/^Mem:/{print "host available MiB during", $7}'
$O ps
