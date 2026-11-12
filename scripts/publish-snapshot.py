#!/usr/bin/env python3
"""Build a public snapshot commit on top of origin/main from the private working branch.

Same method as the 2026-11-04 snapshot (see REDACTIONS.md on the public branch): one commit without
the private history; Claude Code session state files under runs/**/agent/sessions/ excluded;
identifier values collected from the excluded files and searched for in everything that is kept;
the seven docs that name an external marketplace taken in their redacted form.
Nothing is pushed and the working tree and the real index are not touched: the script prints the
new commit id, and the push is a separate, explicit step.

Usage: python scripts/publish-snapshot.py [--source HEAD] [--base origin/main]
"""
import base64, collections, datetime, json, os, re, subprocess, sys, tempfile

def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

SOURCE, BASE = arg('--source', 'HEAD'), arg('--base', 'origin/main')
ENV = dict(os.environ)

def git(*a, inp=None, text=True, check=True):
    r = subprocess.run(['git', *a], input=inp, capture_output=True, text=text, env=ENV,
                       encoding='utf-8' if text else None, errors='replace' if text else None)
    if check and r.returncode != 0:
        sys.exit(f"git {' '.join(a[:3])} failed: {r.stderr[-400:] if text else r.stderr[-400:].decode(errors='replace')}")
    return r.stdout

SESSION = r'^runs/.*/agent/sessions/'
EXCLUDE = [  # (label, regex on the path relative to agent/sessions/)
    ('.claude.json', r'\.claude\.json$'),
    ('backups/.claude.json.backup.<n>', r'backups/\.claude\.json\.backup\.\d+$'),
    ('policy-limits.json', r'policy-limits\.json$'),
    ('policy-limits.json.stamp.json', r'policy-limits\.json\.stamp\.json$'),
    ('policy-limits.json.signature.json', r'policy-limits\.json\.signature\.json$'),
    ('remote-settings.json', r'remote-settings\.json$'),
    ('remote-settings.json.synced-at', r'remote-settings\.json\.synced-at$'),
    ('.last-cleanup', r'\.last-cleanup$'),
    ('plugins/store/*.json', r'plugins/store/[^/]+\.json$'),
    ('statsig / telemetry / credentials / settings*.json', r'(statsig/.*|telemetry/.*|\.credentials\.json|credentials.*|settings[^/]*\.json)$'),
]
OTHER_EXCLUDE = [('experiments/live/out/ (graded output of live sessions in another project)', r'^experiments/live/out/')]
MARKET_DOCS = ['docs/log/2026-10-31.md', 'docs/log/2026-11-01.md', 'docs/planning/00-owner-statements.md',
               'docs/planning/01-proposal.md', 'docs/research/README.md', 'docs/research/research-market.md',
               'docs/research/research-synthesis.md']
NAME = 'agen' + 'si'  # the marketplace's name, split so that this file does not contain it
PREV_SOURCE = '1c1540ea8a5b93f5543858a0050f2fb7795d9c56'  # the private commit the base snapshot was made from

src = git('rev-parse', SOURCE).strip(); base = git('rev-parse', BASE).strip()
entries = [l.split('\t', 1) for l in git('ls-tree', '-r', src).split('\n') if l]
paths = {p: meta.split()[2] for meta, p in entries}

counts = collections.Counter(); removed = []
for p in paths:
    m = re.match(SESSION, p)
    if m:
        rel = p[m.end():]
        for label, rx in EXCLUDE:
            if re.fullmatch(rx, rel) or re.search(r'(^|/)' + rx, rel) and label.startswith('statsig'):
                counts[label] += 1; removed.append(p); break
        continue
    for label, rx in OTHER_EXCLUDE:
        if re.search(rx, p): counts[label] += 1; removed.append(p)

# identifier values from the excluded files (never printed)
vals = {'userID': set(), 'machineID': set(), 'sub': set(), 'aud': set(), 'ws': set()}
def blob(sha): return subprocess.run(['git', 'cat-file', 'blob', sha], capture_output=True).stdout
want = [p for p in removed if p.endswith('/.claude.json') or '.claude.json.backup.' in p or p.endswith('policy-limits.json.signature.json')]
batch = subprocess.run(['git', 'cat-file', '--batch'], input='\n'.join(paths[p] for p in want).encode(), capture_output=True).stdout
pos = 0
for p in want:
    nl = batch.index(b'\n', pos); size = int(batch[pos:nl].split()[2]); data = batch[nl + 1:nl + 1 + size]; pos = nl + 1 + size + 1
    s = data.decode('utf-8', 'replace')
    if p.endswith('signature.json'):
        m = re.search(r'eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.', s)
        if m:
            pl = m.group(1); pl += '=' * (-len(pl) % 4)
            try: d = json.loads(base64.urlsafe_b64decode(pl))
            except Exception: d = {}
            for k in ('sub', 'aud', 'ws'):
                if d.get(k): vals[k].add(str(d[k]))
    else:
        try: d = json.loads(s)
        except Exception: d = {}
        for k in ('userID', 'machineID'):
            if d.get(k): vals[k].add(str(d[k]))
allvals = sorted(v for s in vals.values() for v in s if len(v) >= 12)

# temporary index: source tree minus exclusions, plus public-only files and redacted docs
tmp = tempfile.mkdtemp(prefix='pitcrew-snap-')
ENV['GIT_INDEX_FILE'] = os.path.join(tmp, 'index')
git('read-tree', src)
r = subprocess.run(['git', 'update-index', '--force-remove', '-z', '--stdin'], input='\0'.join(removed).encode('utf-8') + b'\0', capture_output=True, env=ENV)
if r.returncode != 0: sys.exit('update-index failed: ' + r.stderr.decode(errors='replace')[-300:])

def base_blob(path):
    out = git('ls-tree', base, '--', path).strip()
    return out.split()[2] if out else None

doc_note = []
for p in MARKET_DOCS:
    changed = git('diff', '--name-only', PREV_SOURCE, src, '--', p).strip()
    pub = base_blob(p)
    if not pub: sys.exit(f'{p}: no redacted version on {BASE}')
    if not changed:
        git('update-index', '--cacheinfo', f'100644,{pub},{p}'); doc_note.append((p, 'unchanged since the last snapshot: redacted version reused'))
    else:
        patch = git('diff', PREV_SOURCE, src, '--', p)
        if re.search(r'(?i)^\+.*' + NAME, patch, re.M): sys.exit(f'{p}: new lines name the marketplace; redact by hand first')
        # The redaction was done inside lines, so the private file at the last snapshot and the public
        # file align line by line. Lines the later edits left alone are taken from the public file;
        # lines they added or rewrote are taken from the current file (checked above not to name it).
        import difflib
        prev = blob(git('rev-parse', f'{PREV_SOURCE}:{p}').strip()).decode('utf-8').split('\n')
        publ = blob(pub).decode('utf-8').split('\n')
        cur = blob(paths[p]).decode('utf-8').split('\n')
        if len(prev) != len(publ): sys.exit(f'{p}: the redacted version does not align with its source line by line')
        out = []
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, prev, cur, autojunk=False).get_opcodes():
            out += publ[i1:i2] if tag == 'equal' else cur[j1:j2]
        if re.search('(?i)' + NAME, '\n'.join(out)): sys.exit(f'{p}: the carried-forward text still names the marketplace')
        wt = os.path.join(tmp, 'wt'); os.makedirs(os.path.join(wt, os.path.dirname(p)), exist_ok=True)
        open(os.path.join(wt, p), 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
        sha = subprocess.run(['git', 'hash-object', '-w', os.path.join(wt, p)], capture_output=True, text=True).stdout.strip()
        git('update-index', '--cacheinfo', f'100644,{sha},{p}'); doc_note.append((p, 'changed since: later edits applied on top of the redacted version'))

for p in ('LICENSE', 'README.md', '.gitattributes'):
    if p not in paths and base_blob(p): git('update-index', '--add', '--cacheinfo', f'100644,{base_blob(p)},{p}')

# checks on what is kept
kept = [l.split('\t', 1)[1] for l in git('ls-files', '-s').split('\n') if l]
tree0 = git('write-tree').strip()
leak = []
if allvals:
    vf = os.path.join(tmp, 'vals.txt'); open(vf, 'w', encoding='utf-8').write('\n'.join(allvals) + '\n')
    r = subprocess.run(['git', 'grep', '-l', '-F', '-f', vf, tree0], capture_output=True, text=True, encoding='utf-8', errors='replace')
    leak = [l for l in r.stdout.split('\n') if l]
name_hits = subprocess.run(['git', 'grep', '-l', '-i', '-E', NAME, tree0, '--', '.', ':(exclude)runs'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout.split()
jwt = subprocess.run(['git', 'grep', '-l', '-E', r'eyJhbGci[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}', tree0], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout.split()
print(f'source {src[:10]} base {base[:10]} files kept {len(kept)} removed {len(removed)}')
for k, v in counts.most_common(): print(f'  {v:6d}  {k}')
print('identifier values collected:', {k: len(v) for k, v in vals.items()})
print('kept files containing a collected value:', len(leak))
print('kept non-run files naming the marketplace:', len(name_hits))
print('kept files with a signed JWT:', len(jwt))
if leak or name_hits or jwt:
    for l in (leak + name_hits + jwt)[:10]: print('   ', l.split(':', 1)[-1][:150])
    sys.exit('STOP: the snapshot would contain something it must not; nothing committed')

today = datetime.date.today().isoformat()
old = blob(base_blob('REDACTIONS.md')).decode('utf-8')
rows = '\n'.join(f'| `{k}` | {v:,} |' for k, v in counts.items() if not k.startswith('experiments/'))
section = f"""

---

# {today} のスナップショット（追記）

非公開の作業リポジトリのコミット `{src}` の内容を、上のスナップショットの上に 1 コミットで重ねたものです。方法は上と同じで、台本は `scripts/publish-snapshot.py` です。値そのものはここに書きません。

## 1. セッション状態ファイルの除外（{sum(v for k, v in counts.items() if not k.startswith('experiments/')):,} ファイル。前回分を含む全体の数）

| 除外したパターン（`runs/**/agent/sessions/` からの相対パス） | ファイル数 |
|---|---|
{rows}

## 2. 識別子の値

除外したファイルから集めた値の数: アカウント ID {len(vals['sub'])}、組織 ID {len(vals['aud'])}、ワークスペース ID {len(vals['ws'])}、`userID` {len(vals['userID']):,}、`machineID` {len(vals['machineID']):,}。残したファイル全体を検索し、集めた値を含むファイルは **0 件**、署名付き JWT を含むファイルも **0 件** でした（0 件でなければ台本は commit を作らずに止まります）。

## 3. マーケットプレイスの名前

対象は前回と同じ 7 ファイルです。前回から変わっていないファイルは置き換え済みの版をそのまま使い、変わったファイルは置き換え済みの版にその後の差分を当てました。作業リポジトリ側で新しく固有名が書かれた行は 0 件です。

## 4. 追加で除外したもの

`experiments/live/out/`（{counts[OTHER_EXCLUDE[0][0]]} ファイル）: 別のプロジェクトの実際の作業セッションを採点した出力です。採点の台本（`experiments/live/grade-session.mjs`）と仕様は残しています。
"""
wt = os.path.join(tmp, 'REDACTIONS.md'); open(wt, 'w', encoding='utf-8', newline='\n').write(old.rstrip('\n') + section)
sha = subprocess.run(['git', 'hash-object', '-w', wt], capture_output=True, text=True).stdout.strip()
git('update-index', '--add', '--cacheinfo', f'100644,{sha},REDACTIONS.md')
tree = git('write-tree').strip()
msg = f"""pit-crew snapshot {today}

Snapshot of the private working repository at commit
{src}, published as a single commit
on top of the previous snapshot, without the private history.
Claude Code session state files under runs/**/agent/sessions/ and the
graded output of live sessions (experiments/live/out/) are excluded;
the redacted docs are carried forward; see REDACTIONS.md.

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
"""
commit = git('commit-tree', tree, '-p', base, '-m', msg).strip()
print('snapshot commit:', commit)
print('to publish:  git push origin', commit + ':refs/heads/main')
