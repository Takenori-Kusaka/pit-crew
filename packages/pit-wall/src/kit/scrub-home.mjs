// Records and results must not carry the local user's name (the repository is public). Host-side errors do:
// e.g. Harbor's message names the staging directory, /home/<name>/.cache/pit-wall/stage/... (scene-check
// 20261116T223040Z, masked by hand). scrubHome replaces the local home directory with `~` in every string of a
// value before it is written: the home of this process (os.homedir()), and the user's home in the other forms
// it takes on this machine (/home/<name>, /Users/<name>, C:\Users\<name>, /mnt/c/Users/<name>), with either slash.
// Only a home path is replaced, never the bare name (it may be an ordinary word). Container paths (/root, /app,
// /home/<another user>) are left alone.
import { homedir, userInfo } from 'node:os';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let cached = null;
const localUser = () => { try { return userInfo().username || null; } catch { return null; } };

// the patterns for a home and a user name; each match must end at a path boundary (so /home/ab does not match /home/abc)
export function homePattern(home = homedir(), user = localUser()) {
  const alts = new Set(), S = '[\\\\/]+';           // either slash; also a backslash escaped in JSON text
  const trimmed = String(home ?? '').replace(/[\\/]+$/, '');
  if (trimmed.length > 1) alts.add(trimmed.split(/[\\/]/).map(esc).join(S));
  if (user && /^[A-Za-z0-9._-]+$/.test(user)) {
    const u = esc(user);
    for (const parts of [['', 'home', u], ['', 'Users', u], ['[A-Za-z]:', 'Users', u], ['', 'mnt', '[a-z]', 'Users', u], ['', '[a-z]', 'Users', u]]) alts.add(parts.join(S));
  }
  if (!alts.size) return null;
  return new RegExp(`(?:${[...alts].sort((a, b) => b.length - a.length).join('|')})(?=$|[\\\\/"'\\s:;,)\\]}])`, 'gi');
}

export function scrubHome(value, pattern = (cached ??= { p: homePattern() }).p) {
  if (!pattern) return value;
  if (typeof value === 'string') return value.replace(pattern, '~');
  if (Array.isArray(value)) return value.map((v) => scrubHome(v, pattern));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [scrubHome(k, pattern), scrubHome(v, pattern)]));
  return value;
}
