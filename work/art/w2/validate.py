#!/usr/bin/env python3
import json, os, sys, wordfreq
from english_words import get_english_words_set
D = get_english_words_set(['web2', 'gcide'], lower=True)
W = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/app/src/worlds/w2'
w = json.load(open(os.path.join(W, 'world.json')))
W1 = set('re in dis de sub pre inter trans super con graph dict duc fac vis ex vert pro port struct ject form spect mit mot fer phon scrib tract rupt aud'.split())
err, warn = [], []
ids = [l['id'] for l in w['levels']]
if len(set(ids)) != len(ids): err.append('dup ids')
for lv in w['levels']:
    i = lv['id']
    if i in W1: err.append(f'{i}: root used in w1')
    if not os.path.exists(os.path.join(W, lv['art'])): err.append(f'{i}: missing {lv["art"]}')
    forms = [lv['root']] + lv['variants']
    if not lv['halves']: err.append(f'{i}: no halves')
    for side, h in lv['halves'].items():
        cs = h['cards']; nr = sum(c['real'] for c in cs)
        if len(cs) != 6: err.append(f'{i}/{side}: {len(cs)} cards')
        if not 3 <= nr <= 4: err.append(f'{i}/{side}: {nr} real')
        if len({c["word"] for c in cs}) != 6: err.append(f'{i}/{side}: dup word')
        for c in cs:
            p, wd = c['part'], c['word']
            if side == 'start' and not p.startswith('-'): err.append(f'{i}: start part {p} needs leading -')
            if side == 'end' and not p.endswith('-'): err.append(f'{i}: end part {p} needs trailing -')
            core = p.strip('-')
            ok = any((wd == f + core if side == 'start' else wd == core + f) for f in forms)
            if not ok: err.append(f'{i}/{side}: {wd} != root form + {p}')
            if not 1 <= len(c['meaning'].split()) <= 3: warn.append(f'{i}: meaning length "{c["meaning"]}"')
            z = wordfreq.zipf_frequency(wd, 'en')
            if c['real']:
                if z < 2.0: warn.append(f'{i}: rare real {wd} ({z})')
            elif z > 0 or wd in D: err.append(f'{i}: fake {wd} is a word (zipf {z})')
print('\n'.join('ERR ' + e for e in err) or 'no errors')
print('\n'.join('warn ' + x for x in warn))
print(len(w['levels']), 'levels,', sum(len(l['halves']) for l in w['levels']), 'halves')
sys.exit(1 if err else 0)
