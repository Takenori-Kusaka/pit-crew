#!/usr/bin/env node
// EXP-48: one smallest request to TypeSafe Jev, to learn whether the key and the endpoint work.
// Entered in gates/exp48/jev-ledger.json (amounts only). The key is read from TYPESAFE_API_KEY or
// ~/.config/pit-wall/typesafe-api-key (judge/jev.mjs) and is never printed or stored.
//   node experiments/exp48/jev-ping.mjs            one request
//   node experiments/exp48/jev-ping.mjs --status   no request: the ledger total and whether a key is present
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiKey } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import { ping, readLedger } from '../../packages/pit-wall/src/graders/process/judge/jev-audit.mjs';

const ledger = resolve(fileURLToPath(new URL('../../gates/exp48/jev-ledger.json', import.meta.url)));
const l = readLedger(ledger);
if (process.argv.includes('--status')) {
  process.stdout.write(`${JSON.stringify({ keyPresent: !!apiKey(), total_usd: l.total_usd, limit_usd: l.limit_usd, requests: l.requests })}\n`);
} else if (!apiKey()) {
  process.stdout.write('no key: not called\n');
} else {
  try {
    const r = await ping({ ledger });
    process.stdout.write(`${JSON.stringify({ ok: r.ok, answer: r.answer, inputTokens: r.inputTokens, usd: Number(r.usd.toFixed(8)), totalUsd: r.totalUsd })}\n`);
  } catch (e) {
    // The message of a failed request carries the status and the first bytes of the body, never the key.
    process.stdout.write(`${JSON.stringify({ ok: false, error: String(e.message).slice(0, 160) })}\n`);
  }
}
