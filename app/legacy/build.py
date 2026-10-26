#!/usr/bin/env python3
"""Build Rootcraft: validate the curated dataset and write app/dist."""
import json, os, shutil, hashlib, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(HERE, 'src'), os.path.join(HERE, 'dist')
sys.path.insert(0, SRC)
import game_data as G

errors = []
morph = {m['id']: m for m in G.M}
assert len(morph) == len(G.M), 'duplicate morpheme id'

def default_id(surface, pos, n):
    cands = [m for m in G.M if surface in m['forms']]
    if not cands:
        return None
    if len(cands) > 1:
        # positional preference: prefix first, suffix last, base otherwise
        pref = [c for c in cands if c['id'] == 'in_into'] or \
               [c for c in cands if (c['type'] == 'prefix') == (pos == 0)] or cands
        return pref[0]['id']
    return cands[0]['id']

def parse_sum(word, s):
    parts = []
    raw = s.split('+')
    for i, p in enumerate(raw):
        p = p.strip()
        if '~' in p:
            surf, mid = p.split('~')
        else:
            surf, mid = p, default_id(p, i, len(raw))
        if mid not in morph:
            errors.append(f'{word}: unknown part {p}')
            continue
        if surf not in morph[mid]['forms']:
            errors.append(f'{word}: {surf} not a form of {mid}')
        parts.append([surf, mid])
    if ''.join(x[0] for x in parts) != word:
        errors.append(f'{word}: parts {s} do not spell the word')
    if not any(morph[x[1]]['type'] == 'base' for x in parts if x[1] in morph):
        errors.append(f'{word}: no base')
    return parts

words, seen = [], set()
for line in G.WORDS.strip().splitlines():
    w, s, d = [x.strip() for x in line.split('|')]
    if w in seen: errors.append('dup word ' + w)
    seen.add(w)
    words.append(dict(w=w, parts=parse_sum(w, s), d=d))

challenges = []
for line in G.CHALLENGES.strip().splitlines():
    w, s, right, *wrong = [x.strip() for x in line.split('|')]
    challenges.append(dict(w=w, parts=parse_sum(w, s), right=right, wrong=wrong))

families = {}
for m in G.M:
    if m['type'] != 'base': continue
    fam = [x['w'] for x in words if any(p[1] == m['id'] for p in x['parts'])]
    for e in G.FAMILY_EXTRA.get(m['id'], []):
        if e not in fam: fam.append(e)
    families[m['id']] = fam

for b, traps in G.TRAPS.items():
    if b not in families: errors.append('trap family ' + b)
    for t, _ in traps:
        if t in families.get(b, []): errors.append(f'trap {t} is in its own family {b}')

for e in G.MINT_ENDINGS:
    if e not in morph: errors.append('mint ending ' + e)

if errors:
    print('\n'.join(errors)); sys.exit(1)

data = dict(morphemes=morph, words=words, families=families,
            traps={k: [dict(w=t, why=y) for t, y in v] for k, v in G.TRAPS.items()},
            challenges=challenges, mintEndings=G.MINT_ENDINGS)

if os.path.exists(DIST): shutil.rmtree(DIST)
os.makedirs(DIST)
shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(DIST, 'fonts'))
blob = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
def h(b): return hashlib.sha1(b.encode()).hexdigest()[:8]
names = {}
for src, ext in (('app.js', 'js'), ('styles.css', 'css')):
    txt = open(os.path.join(SRC, src)).read()
    nm = f"{src.split('.')[0]}.{h(txt + (blob if ext == 'js' else ''))}.{ext}"
    names[src] = nm
    open(os.path.join(DIST, nm), 'w').write(txt)
dn = f'data.{h(blob)}.json'
open(os.path.join(DIST, dn), 'w').write(blob)
html = open(os.path.join(SRC, 'index.html')).read()
html = html.replace('app.js', names['app.js']).replace('styles.css', names['styles.css']).replace('__DATA__', dn)
open(os.path.join(DIST, 'index.html'), 'w').write(html)
for extra in ('icon.svg', '_headers'):
    p = os.path.join(SRC, extra)
    if os.path.exists(p): shutil.copy(p, DIST)
nb = sum(1 for m in G.M if m['type'] == 'base')
print(f'ok: {len(G.M)} morphemes ({nb} bases), {len(words)} word sums, '
      f'{sum(len(v) for v in families.values())} family entries, {sum(len(v) for v in G.TRAPS.values())} traps, '
      f'{len(challenges)} challenges')
