// Command-line arguments of the kit's tools, checked BEFORE the tool does anything.
// Several of these tools write a result file with a default path. Asked for `--help`, they used to ignore the word,
// run, and overwrite that file (2026-11-16: two roles lost uncommitted results this way). So:
//   --help / -h          print the usage, exit 0, do nothing else
//   an unknown --word,   print what is wrong and the usage to stderr, exit 2, do nothing else
//   a missing value,
//   too few / too many
//   plain arguments
// spec: { usage, flags: [names without --], options: [names that take a value], min, max (plain arguments) }
// Returns { flags: { name: true }, options: { name: value }, rest: [plain arguments] }.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv, { flags = [], options = [], min = 0, max = Infinity } = {}) {
  if (argv.some((a) => a === '--help' || a === '-h')) return { help: true };
  const out = { flags: {}, options: {}, rest: [] };
  for (let at = 0; at < argv.length; at += 1) {
    const a = argv[at];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      if (flags.includes(name)) out.flags[name] = true;
      else if (options.includes(name)) {
        if (argv[at + 1] === undefined || argv[at + 1].startsWith('--')) return { error: `${a} needs a value` };
        out.options[name] = argv[at += 1];
      } else return { error: `unknown argument: ${a}` };
    } else if (/^-[A-Za-z]/.test(a)) return { error: `unknown argument: ${a}` };
    else out.rest.push(a);
  }
  if (out.rest.length < min) return { error: out.rest.length ? `too few arguments (${out.rest.length}, at least ${min})` : `missing argument (at least ${min})` };
  if (out.rest.length > max) return { error: `unexpected argument: ${out.rest[max]}` };
  return out;
}

// The same, for a command: ends the process on --help (0) and on a bad argument (2).
export function cliArgs(argv, spec) {
  const r = parseArgs(argv, spec);
  if (r.help) { process.stdout.write(`${spec.usage}\n`); process.exit(0); }
  if (r.error) { process.stderr.write(`${r.error}\n${spec.usage}\nNothing was run.\n`); process.exit(2); }
  return r;
}

// Is this module the program that was started (not an import)?
export const isMain = (metaUrl) => { try { return !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(metaUrl); } catch { return false; } };
