#!/usr/bin/env python3
"""Teacher-forced log-probabilities for the E-series defect flags (research-machine-only §2.4
#13-#14, design 23 §3.3). For each item, score the SAME rationale under two contexts and report
the per-token mean log p and the gap:
  rule_dependence = mean log p(r | task + rules) - mean log p(r | task)      (#13; large = parroting the rules)
  specificity     = mean log p(r | task + observations) - mean log p(r | "")  (#14; ~0 = boilerplate)
Input (stdin, JSON): {"model": "<gguf path>", "items": [{"id", "rationale", "task", "rules", "observations"}]}
Output (stdout, JSON lines): {"id", "lp_task", "lp_task_rules", "lp_task_obs", "lp_empty", "rule_dependence", "specificity", "tokens"}
CPU only (llama-cpp-python), logits_all=True for the whole sequence. Runs one model load per invocation.
"""
import json, math, sys
from llama_cpp import Llama

def mean_logprob(llm, context, target):
    # Tokenise context and target separately; score only the target tokens given the context.
    ctx = llm.tokenize(context.encode('utf-8'), add_bos=True) if context else llm.tokenize(b"", add_bos=True)
    tgt = llm.tokenize(target.encode('utf-8'), add_bos=False)
    if not tgt:
        return None, 0
    toks = (ctx + tgt)[-llm.n_ctx():]
    n_ctx = len(toks) - len(tgt)
    llm.reset()
    llm.eval(toks)
    import numpy as np
    logits = np.array(llm.scores[: len(toks)], dtype=np.float64)
    total = 0.0
    for i in range(n_ctx, len(toks)):
        row = logits[i - 1]
        m = row.max()
        lse = m + math.log(np.exp(row - m).sum())
        total += row[toks[i]] - lse
    return total / len(tgt), len(tgt)

def main():
    req = json.load(sys.stdin)
    llm = Llama(model_path=req["model"], n_ctx=int(req.get("n_ctx", 4096)), logits_all=True, verbose=False, n_threads=int(req.get("threads", 6)))
    for it in req["items"]:
        r = it["rationale"]
        task, rules, obs = it.get("task", ""), it.get("rules", ""), it.get("observations", "")
        lp_task, n = mean_logprob(llm, task, r)
        lp_rules, _ = mean_logprob(llm, f"{task}\n\n{rules}", r)
        lp_obs, _ = mean_logprob(llm, f"{task}\n\n{obs}", r)
        lp_empty, _ = mean_logprob(llm, "", r)
        out = {"id": it["id"], "tokens": n, "lp_task": lp_task, "lp_task_rules": lp_rules, "lp_task_obs": lp_obs, "lp_empty": lp_empty,
               "rule_dependence": None if lp_task is None else lp_rules - lp_task,
               "specificity": None if lp_task is None else lp_obs - lp_empty}
        print(json.dumps(out, ensure_ascii=False)); sys.stdout.flush()

if __name__ == "__main__":
    main()
