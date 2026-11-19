// Watchdog for one Harbor job (admission.mjs shouldStop). Started by the runner beside Harbor:
//   node watchdog.mjs <reserveMiB> <runner pid> <log file>
// Samples WSL memory every 5 s and, on WSL, the Windows host's free memory every 30 s (2026-11-03:
// WSL had 10 GiB available while Windows fell to 1.2 GiB and Claude Code stopped the run). Stops
// when WSL stays short 3 samples in a row, or Windows stays below its reserve 2 checks in a row:
// sends SIGINT to the runner's Harbor child (Harbor cleans up its containers) and writes "STOPPED"
// to the log, so the runner treats the run as incomplete. Exits when the runner exits.
import { appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DEFAULTS, readHost, shouldStop, shouldStopWindows } from './admission.mjs';

const [reserve, pid, log] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const samples = [], win = [];
let ticks = 0;
const alive = () => { try { process.kill(pid, 0); return true; } catch { return false; } };
const stop = (why) => {
  appendFileSync(log, `STOPPED ${why}\n`);
  spawnSync('pkill', ['-INT', '-P', String(pid), '-f', 'harbor run']);
  process.exit(0);
};
const tick = () => {
  if (!alive()) process.exit(0);
  const withWindows = ticks++ % 6 === 0;
  const h = readHost({ windows: withWindows });
  samples.push(h);
  if (samples.length > 3) samples.shift();
  if (withWindows && h.winFreeMiB != null) { win.push(h.winFreeMiB); if (win.length > 2) win.shift(); }
  appendFileSync(log, `${new Date().toISOString()}\tavail=${h.memAvailableMiB}\tpsiMemFull10=${h.psiMem?.full?.avg10 ?? '-'}${withWindows ? `\twinFree=${h.winFreeMiB ?? '-'}` : ''}\n`);
  if (shouldStop(samples, reserve)) stop('wsl memory short');
  // Windows short: first give the WSL page cache back (owner-installed helper); it returns within
  // about 90 s, i.e. before the next two checks. Stop only if Windows stays short after that.
  if (withWindows && h.winFreeMiB != null && h.winFreeMiB < DEFAULTS.winReserveMiB) {
    const r = spawnSync('sudo', ['-n', '/usr/local/sbin/pitwall-drop-caches']);
    appendFileSync(log, `dropped page cache (exit ${r.status})\n`);
    if (r.status === 0) win.length = 0; // restart the count: judge Windows again after the return
  }
  if (shouldStopWindows(win, DEFAULTS.winReserveMiB)) stop('windows memory short');
};
setInterval(tick, 5000);
tick();
