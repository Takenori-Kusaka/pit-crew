#!/usr/bin/env node
// EXP-48: the numbers of one graphify-probe.sh run (see there). No text of the subject:
// exit code, sizes, hashes, the exception type, its position numbers, frames inside python packages.
//   node experiments/exp48/graphify-probe.mjs <id> <work dir> <pre-fix commit> <graph.json blob id> <graphify version>
import { createHash } from 'node:crypto';
import { statSync, existsSync, readFileSync } from 'node:fs'; // (order: the usual one is also a line of the subject)
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// What a python traceback says, without its message text.
export function readTraceback(stderr) {
  const lines = String(stderr).split('\n').filter((l) => l.trim());
  const last = lines.at(-1) ?? '';
  return {
    traceback: /Traceback \(most recent call last\)/.test(stderr),
    exceptionType: /^[A-Za-z_][\w.]*(Error|Exception)/.test(last) ? last.split(':')[0].trim() : null,
    jsonErrorAt: (last.match(/line (\d+) column (\d+) \(char (\d+)\)/) ?? []).slice(1).map(Number),
    frames: [...String(stderr).matchAll(/File "([^"]+)", line (\d+), in (\S+)/g)].slice(-4).map((m) => `${m[1].replace(/^.*\/(site-packages|dist-packages|site|python3[.\d]*)\//, '')}:${m[2]}:${m[3]}`),
  };
}

// Is the graph a JSON document, and if not, what kind of break is at the reported place:
// merge-conflict markers anywhere, and whether the file ends as a complete document.
export function graphFacts(text) {
  let parses = true, at = null;
  try { JSON.parse(text); } catch (e) { parses = false; at = Number(String(e.message).match(/position (\d+)/)?.[1] ?? NaN); }
  const lines = text.split('\n');
  return { graphJsonParses: parses, parseErrorAtChar: Number.isFinite(at) ? at : null, lines: lines.length, conflictMarkerLines: lines.filter((l) => /^(<{7}|={7}|>{7})( |$)/.test(l)).length, endsWithClosingBrace: /\}\s*$/.test(text) };
}

const self = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (self) {
  const [id, dir, commit, blob, version] = process.argv.slice(2);
  const gj = join(dir, 'graphify-out/graph.json');
  const raw = existsSync(gj) ? readFileSync(gj) : null;
  const err = existsSync(join(dir, 'err.txt')) ? readFileSync(join(dir, 'err.txt'), 'utf8') : '';
  const doc = {
    id, where: 'outside the image (WSL, same graphify version, the tracked graph of the pre-fix commit)', graphifyVersion: version, prefix_commit: commit,
    graphJsonBlob: blob, graphJsonBytes: raw ? raw.length : null, graphJsonSha256: raw ? createHash('sha256').update(raw).digest('hex') : null,
    ...(raw ? graphFacts(raw.toString('utf8')) : {}),
    explain: { exit: Number(readFileSync(join(dir, 'exit.txt'), 'utf8').trim()), outChars: statSync(join(dir, 'out.txt')).size, errChars: err.length, ...readTraceback(err) },
    when: new Date().toISOString(),
  };
  process.stdout.write(`${JSON.stringify(doc, null, 1)}\n`);
}
