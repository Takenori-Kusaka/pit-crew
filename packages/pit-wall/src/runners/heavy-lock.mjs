// One heavy job per host: a Harbor run and a local judge (ollama) must not run at the same time.
// On 2026-11-03 both ran together; Windows free memory fell to about 1.2 GiB and Claude Code stopped
// both. The lock is a directory holding the owner's pid; a lock whose process is gone is taken over.
// Shell scripts take the same lock with `experiments/heavy-lock.sh`.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const lockDir = () => process.env.PITWALL_HEAVY_LOCK ?? join(homedir(), '.cache', 'pit-wall', 'heavy.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

// Returns a release function. Throws when another live process holds the lock (unless it is ours).
export function acquire(what) {
  const dir = lockDir();
  // A calling script that already holds the lock (experiments/heavy-lock.sh) says so; its children
  // run under it instead of fighting it.
  if (process.env.PITWALL_HEAVY_HELD === '1' && existsSync(join(dir, 'owner'))) return () => {};
  mkdirSync(join(dir, '..'), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      mkdirSync(dir);
      writeFileSync(join(dir, 'owner'), `${process.pid}\t${what}\t${new Date().toISOString()}\n`);
      return () => rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const owner = existsSync(join(dir, 'owner')) ? readFileSync(join(dir, 'owner'), 'utf8') : '';
      const pid = Number(owner.split('\t')[0]);
      if (pid === process.pid) return () => {}; // nested: the outer holder releases
      if (pid && alive(pid)) throw new Error(`another heavy job holds ${dir}: ${owner.trim()}`);
      rmSync(dir, { recursive: true, force: true }); // stale: its process is gone
    }
  }
  throw new Error(`could not take ${dir}`);
}
