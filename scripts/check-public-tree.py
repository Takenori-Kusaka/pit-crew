#!/usr/bin/env python3
"""Check that a tree holds nothing that must not be public. Replaces the checks of publish-snapshot.py
now that the raw run records are no longer in git (2026-11-19).

  python scripts/check-public-tree.py --collect <commit>   # once: collect identifier values from an old commit
  python scripts/check-public-tree.py [<tree-ish>]         # check a tree (default: the index, i.e. what is staged)

--collect reads the Claude Code session state files of <commit> (.claude.json, its backups, the signed policy
file) and writes the identifier values found there (userID, machineID, account / organisation / workspace id) to
local/identifier-values.txt. local/ is git-ignored; the values are never printed.

The check then fails (exit 1) if the tree has: a collected value; the name of the external marketplace; a signed
JWT; a Claude Code session state file; a copy of the GQ harness (subjects/ganbari-quest-v0*/ other than SOURCE.md,
experiments/live/out/).
"""
import base64, json, os, re, subprocess, sys

VALS = 'local/identifier-values.txt'
NAME = 'agen' + 'si'  # split so that this file does not contain the name
STATE = r'(^|/)(\.claude\.json|\.claude\.json\.backup\.\d+|policy-limits\.json(\.stamp\.json|\.signature\.json)?|remote-settings\.json(\.synced-at)?|\.last-cleanup|\.credentials\.json)$'
GQ = r'^subjects/ganbari-quest-v0(-full)?/(?!SOURCE\.md$)|^experiments/live/out/|subjects_ganbari-quest-v0[^/]*/.*(skills|agents)/'

def run(*a, inp=None):
    return subprocess.run(['git', *a], input=inp, capture_output=True)

if '--collect' in sys.argv:
    commit = sys.argv[sys.argv.index('--collect') + 1]
    want = []
    for line in run('ls-tree', '-r', commit).stdout.decode('utf-8', 'replace').split('\n'):
        if not line: continue
        meta, p = line.split('\t', 1)
        if p.endswith('/.claude.json') or '.claude.json.backup.' in p or p.endswith('policy-limits.json.signature.json'):
            want.append((meta.split()[2], p))
    batch = run('cat-file', '--batch', inp='\n'.join(s for s, _ in want).encode()).stdout
    vals, pos = set(), 0
    for _, p in want:
        nl = batch.index(b'\n', pos); size = int(batch[pos:nl].split()[2]); data = batch[nl + 1:nl + 1 + size]; pos = nl + 1 + size + 1
        s = data.decode('utf-8', 'replace')
        if p.endswith('signature.json'):
            m = re.search(r'eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.', s)
            if m:
                pl = m.group(1); pl += '=' * (-len(pl) % 4)
                try: d = json.loads(base64.urlsafe_b64decode(pl))
                except Exception: d = {}
                vals |= {str(d[k]) for k in ('sub', 'aud', 'ws') if d.get(k)}
        else:
            try: d = json.loads(s)
            except Exception: d = {}
            vals |= {str(d[k]) for k in ('userID', 'machineID') if d.get(k)}
    vals = sorted(v for v in vals if len(v) >= 12)
    os.makedirs('local', exist_ok=True)
    open(VALS, 'w', encoding='utf-8', newline='\n').write('\n'.join(vals) + '\n')
    print(f'files read {len(want)}, values written {len(vals)} -> {VALS}')
    sys.exit(0)

args = [a for a in sys.argv[1:] if not a.startswith('--')]
tree = args[0] if args else run('write-tree').stdout.decode().strip()
if not os.path.exists(VALS): sys.exit(f'{VALS} is missing: run --collect <old commit> first')
paths = [l.split('\t', 1)[1] for l in run('ls-tree', '-r', tree).stdout.decode('utf-8', 'replace').split('\n') if l]
def grep(*a):
    out = run('grep', '-l', *a, tree).stdout.decode('utf-8', 'replace')
    return [l.split(':', 1)[-1] for l in out.split('\n') if l]
res = {
    'identifier value': grep('-F', '-f', VALS),
    'marketplace name': grep('-i', '-E', NAME),
    'signed JWT': grep('-E', r'eyJhbGci[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'),
    'API key / token pattern': grep('-E', r'sk-ant-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}'),
    'session state file': [p for p in paths if re.search(STATE, p)],
    'GQ harness copy': [p for p in paths if re.search(GQ, p)],
}
print(f'tree {tree[:10]} files {len(paths)}')
bad = 0
for k, v in res.items():
    print(f'  {len(v):5d}  {k}')
    for p in v[:8]: print('         ', p[:150])
    bad += len(v)
sys.exit(1 if bad else 0)
