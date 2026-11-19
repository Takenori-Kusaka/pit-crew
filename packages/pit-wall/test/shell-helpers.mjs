// Runs a bash script for a test: directly on Linux, through WSL on Windows
// (`wsl -- bash -l <file>`). Paths handed to the script are converted with toShell().
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIN = process.platform === 'win32';

// A host path as the shell sees it (C:\x\y -> /mnt/c/x/y under WSL).
export function toShell(p) {
  if (!WIN) return p;
  const m = p.match(/^([A-Za-z]):[\\/](.*)$/);
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}` : p.replace(/\\/g, '/');
}

export const SHIMS = toShell(fileURLToPath(new URL('../shims/', import.meta.url))).replace(/\/$/, '');
export const RUNNERS = toShell(fileURLToPath(new URL('../src/runners/', import.meta.url))).replace(/\/$/, '');

// script: text, or (shellDir) => text for a script that works in its own temp directory.
export function shell(script) {
  const dir = mkdtempSync(join(tmpdir(), 'pitwall-sh-'));
  const f = join(dir, 'script.sh');
  writeFileSync(f, (typeof script === 'function' ? script(toShell(dir)) : script).replace(/\r\n/g, '\n'));
  const r = WIN
    ? spawnSync('wsl', ['--', 'bash', '-l', toShell(f)], { encoding: 'utf8', maxBuffer: 64 << 20 })
    : spawnSync('bash', [f], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`shell script failed (${r.status}): ${r.stderr}`);
  return { stdout: r.stdout, dir, shellDir: toShell(dir) };
}

// Installs gh, pitwall-mark-run and pitwall-ran-on-final from shims/ on PATH in a private
// directory, and keeps the machine's raw gh log (/tmp/pitwall-gh.log) as it was.
export const PRELUDE = `set -u
PW_BIN=$(mktemp -d)
tr -d '\\r' < '${SHIMS}/gh' > "$PW_BIN/gh"
tr -d '\\r' < '${SHIMS}/mark-run.sh' > "$PW_BIN/pitwall-mark-run"
tr -d '\\r' < '${SHIMS}/ran-on-final.sh' > "$PW_BIN/pitwall-ran-on-final"
chmod +x "$PW_BIN/gh" "$PW_BIN/pitwall-mark-run" "$PW_BIN/pitwall-ran-on-final"
export PATH="$PW_BIN:$PATH"
PW_RAWLOG_SAVED=$(mktemp)
if [ -f /tmp/pitwall-gh.log ]; then cp /tmp/pitwall-gh.log "$PW_RAWLOG_SAVED"; PW_HAD_RAWLOG=1; else PW_HAD_RAWLOG=0; fi
pw_restore() { if [ "$PW_HAD_RAWLOG" = 1 ]; then cp "$PW_RAWLOG_SAVED" /tmp/pitwall-gh.log; else rm -f /tmp/pitwall-gh.log; fi; }
trap pw_restore EXIT
`;

// Each scenario runs in a fresh directory with its own state files. Output per scenario:
// PWOUT\t<name>\t<state.json b64>\t<state.tsv b64>\t<unparsed b64>\t<runs.log b64>
export const EMPTY_JSON = '{"items":{},"created":{"pullRequests":[],"issues":[]}}\n';
export function runScenarios(scenarios) {
  const parts = [PRELUDE, `pw_run() {
  local name=$1 d script
  d=$(mktemp -d); script=$(cat)
  mkdir -p "$d/.st"
  ( cd "$d" && export PITWALL_GH_STATE="$d/.st/s.json" PITWALL_RUNS_LOG="$d/.st/runs.log" && bash -c "$script" >/dev/null 2>&1 )
  b() { [ -f "$1" ] && base64 -w0 < "$1"; }
  printf 'PWOUT\\t%s\\t%s\\t%s\\t%s\\t%s\\n' "$name" "$(b "$d/.st/s.json")" "$(b "$d/.st/s.tsv")" "$(b "$d/.st/s.unparsed")" "$(b "$d/.st/runs.log")"
}
`];
  for (const [name, script] of Object.entries(scenarios)) parts.push(`pw_run '${name.replace(/'/g, '')}' <<'PW_EOF'\n${script}\nPW_EOF\n`);
  const { stdout } = shell(parts.join('\n'));
  const dec = (b) => (b ? Buffer.from(b, 'base64').toString('utf8') : null);
  return Object.fromEntries(stdout.split('\n').filter((l) => l.startsWith('PWOUT\t')).map((l) => {
    const [, name, json, tsv, unparsed, runs] = l.split('\t');
    // No gh call writes no file; readState reads that as the empty state, and so does this.
    const j = dec(json) ?? EMPTY_JSON;
    return [name, { wrote: !!json, json: j, state: JSON.parse(j), tsv: dec(tsv) ?? '', unparsed: dec(unparsed), runs: dec(runs) }];
  }));
}
