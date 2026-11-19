// How many trials Harbor may run at once (its -n), decided from the host's free memory, memory and
// CPU pressure (PSI) and CPU count at job start, with a reserve for the OS and other processes; and
// a watchdog rule for stopping a job when memory runs short while it runs.
// Design and sources: docs/research/research-eval-parallelism.md §4. Linux cannot reserve memory
// for later use, so the "reservation" is this admission arithmetic, and each container also gets a
// hard memory limit, so one runaway trial is OOM-killed alone (and recorded invalid) instead of
// pushing the host into the OOM killer.
import { existsSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { spawnSync } from 'node:child_process';

export const DEFAULTS = {
  peakMiB: 256,      // per-trial peak: measured 136-159 MiB on the biggest cell (perf-memory-run), rounded up
  headroom: 1.5,     // for swings of the peak
  cap: 6,            // never more than this (start value; raise only after the checks)
  limitMiB: 1024,    // hard limit per container (about 6x the measured peak)
  winReserveMiB: 2048, // kept free on the Windows host
};

export const parseMeminfo = (t) => Object.fromEntries(t.split('\n').filter(Boolean).map((l) => {
  const [k, v] = l.split(':');
  return [k.trim(), Math.floor(Number.parseInt(v, 10) / 1024)]; // MiB
}));
// "some avg10=0.06 avg60=0.17 avg300=0.18 total=..." -> { some: {avg10, avg60, avg300}, full: {...} }
export const parsePsi = (t) => Object.fromEntries((t ?? '').split('\n').filter(Boolean).map((l) => {
  const [kind, ...kv] = l.trim().split(/\s+/);
  return [kind, Object.fromEntries(kv.map((x) => x.split('=')).filter(([k]) => k !== 'total').map(([k, v]) => [k, Number(v)]))];
}));

// host: { memTotalMiB, memAvailableMiB, winFreeMiB|null, psiMem, psiCpu, nproc }
export function admit(host, o = DEFAULTS) {
  // Each side keeps its own reserve: inside WSL for the kernel, Docker and other processes; on the
  // Windows host for Windows itself. The room is the smaller of the two (the WSL VM's memory is
  // backed by the host's). The first version subtracted both reserves from the Windows side and
  // refused to start even one trial on this machine (Windows free 4836 MiB) although n=3 had run
  // all day using about 0.4 GiB in total.
  const reserve = Math.max(2048, Math.floor(0.15 * host.memTotalMiB));
  const room = Math.min(host.memAvailableMiB - reserve, host.winFreeMiB == null ? Infinity : host.winFreeMiB - o.winReserveMiB);
  const avail = host.memAvailableMiB;
  const nMem = Math.floor(room / (o.peakMiB * o.headroom));
  const nCpu = Math.max(1, host.nproc - 2);
  const pm = host.psiMem ?? {}, pc = host.psiCpu ?? {};
  const pressure = (pm.some?.avg60 ?? 0) > 10 || (pm.full?.avg10 ?? 0) > 1 || (pc.some?.avg60 ?? 0) > 50;
  if (nMem < 1 || pressure) return { n: 0, reserve, avail, room, nMem, nCpu, reason: nMem < 1 ? 'not enough free memory' : 'memory or CPU pressure' };
  const n = Math.max(1, Math.min(nMem, nCpu, o.cap));
  return { n, reserve, avail, room, nMem, nCpu, reason: n === o.cap ? 'cap' : n === nCpu ? 'cpu' : 'memory' };
}

// Stop when, in the last 3 samples in a row, available memory is below the reserve or memory
// pressure (full avg10) is above 5. A single spike does not stop the job.
export function shouldStop(samples, reserve) {
  const bad = (s) => s.memAvailableMiB < reserve || (s.psiMem?.full?.avg10 ?? 0) > 5;
  return samples.length >= 3 && samples.slice(-3).every(bad);
}

// Windows host side: stop when its free memory stays below the reserve 2 checks in a row.
export const shouldStopWindows = (winFree, reserve) => winFree.length >= 2 && winFree.slice(-2).every((f) => f < reserve);

export function readHost({ windows = true } = {}) {
  const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
  const mi = parseMeminfo(read('/proc/meminfo') ?? '');
  let winFreeMiB = null;
  if (windows && /microsoft/i.test(read('/proc/version') ?? '')) {
    // WSL: the Windows host's free memory also bounds what WSL can get.
    const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'], { encoding: 'utf8', timeout: 20000 });
    const kb = Number.parseInt(r.stdout ?? '', 10);
    if (Number.isFinite(kb)) winFreeMiB = Math.floor(kb / 1024);
  }
  return { memTotalMiB: mi.MemTotal ?? 0, memAvailableMiB: mi.MemAvailable ?? 0, winFreeMiB, psiMem: parsePsi(read('/proc/pressure/memory')), psiCpu: parsePsi(read('/proc/pressure/cpu')), nproc: cpus().length };
}
