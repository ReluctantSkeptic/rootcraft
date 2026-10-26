#!/usr/bin/env python3
"""Generate app/src/worlds/w3/world.json (World 3 Silver) and validate it."""
import json, os, sys
import sys as _s; _s.path.insert(0, '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/work/art'); from word_defs import add_defs
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
OUT = f'{ROOT}/app/src/worlds/w3'

# level: id, root, variants, origin, type, meaning, start cards, end cards
# card string: part|meaning|word|R or F
L = [
 ('uni','uni',[],'Latin','Prefix','one', """
-corn|horn|unicorn|R
-cycle|wheel|unicycle|R
-form|shape|uniform|R
-son|sound|unison|R
-pede|foot|unipede|F
-gon|angle|unigon|F""", None),
 ('bi','bi',['bin'],'Latin','Prefix','two', """
-cycle|wheels|bicycle|R
-oculars|eyes|binoculars|R
-lingual|languages|bilingual|R
-weekly|every week|biweekly|R
-pede|feet|bipede|F
-angle|corners|biangle|F""", None),
 ('tri','tri',[],'Latin','Prefix','three', """
-angle|corners|triangle|R
-cycle|wheels|tricycle|R
-ceratops|horned face|triceratops|R
-pod|feet|tripod|R
-pede|feet|tripede|F
-month|months|trimonth|F""", None),
 ('quad','quad',['quadr'],'Latin','Prefix','four', """
-uple|times over|quadruple|R
-ant|a part|quadrant|R
-copter|flying machine|quadcopter|R
-wheel|wheels|quadwheel|F
-month|months|quadmonth|F
-corn|horns|quadcorn|F""", None),
 ('oct','oct',['octo'],'Latin','Prefix','eight', """
-pus|foot|octopus|R
-ave|eighth note|octave|R
-ober|eighth month|October|R
-et|group|octet|R
-corn|horns|octocorn|F
-week|weeks|octoweek|F""", None),
 ('dec','dec',['deca'],'Latin','Prefix','ten', """
-ade|group|decade|R
-imal|tenths|decimal|R
-athlon|contests|decathlon|R
-ember|tenth month|December|R
-pede|feet|decapede|F
-cycle|wheels|decacycle|F""", None),
 ('cent','cent',['centi'],'Latin','Prefix','hundred', """
-ury|group of years|century|R
-ipede|feet|centipede|R
-imeter|measure|centimeter|R
-ennial|years|centennial|R
-corn|horns|centicorn|F
-week|weeks|centiweek|F""", None),
 ('mill','mill',['milli'],'Latin','Prefix','thousand', """
-ion|big number|million|R
-ennium|years|millennium|R
-imeter|measure|millimeter|R
-igram|weight|milligram|R
-cycle|wheels|millicycle|F
-angle|corners|millangle|F""", None),
 ('semi','semi',[],'Latin','Prefix','half', """
-circle|ring|semicircle|R
-final|last game|semifinal|R
-colon|pause mark|semicolon|R
-corn|horn|semicorn|F
-week|week|semiweek|F
-quartet|group of four|semiquartet|F""", None),
 ('multi','multi',[],'Latin','Prefix','many', """
-ply|fold|multiply|R
-colored|colors|multicolored|R
-tude|state of|multitude|R
-player|players|multiplayer|R
-corn|horns|multicorn|F
-week|weeks|multiweek|F""", None),
 ('mono','mono',['mon'],'Greek','Prefix','one, alone', """
-rail|track|monorail|R
-tone|sound|monotone|R
-logue|speech|monologue|R
-ocle|eye|monocle|R
-pede|foot|monopede|F
-week|week|monoweek|F""", None),
 ('du','du',[],'Latin','Prefix','two', """
-et|little group|duet|R
-al|having|dual|R
-plicate|folded|duplicate|R
-tone|sound|dutone|F
-lateral|sides|dulateral|F
-cycle|wheels|ducycle|F""", None),
 ('kilo','kilo',[],'Greek','Prefix','thousand', """
-gram|weight|kilogram|R
-meter|measure|kilometer|R
-watt|power unit|kilowatt|R
-corn|horns|kilocorn|F
-week|weeks|kiloweek|F
-tone|sounds|kilotone|F""", None),
 ('equi','equi',['equ'],'Latin','Prefix','equal, even', """
-al|being|equal|R
-ator|evener|equator|R
-nox|night|equinox|R
-lateral|sides|equilateral|R
-corn|horn|equicorn|F
-month|month|equimonth|F""", None),
 ('omni','omni',[],'Latin','Prefix','all', """
-vore|eater|omnivore|R
-potent|powerful|omnipotent|R
-present|here|omnipresent|R
-scient|knowing|omniscient|R
-cycle|wheels|omnicycle|F
-tone|sounds|omnitone|F""", None),
 ('poly','poly',[],'Greek','Prefix','many', """
-gon|angles|polygon|R
-hedron|faces|polyhedron|R
-mer|parts|polymer|R
-corn|horns|polycorn|F
-week|weeks|polyweek|F
-pede|feet|polypede|F""", None),
 ('gon','gon',[],'Greek','Suffix','angle, corner', None, """
penta-|five|pentagon|R
hexa-|six|hexagon|R
octa-|eight|octagon|R
uni-|one|unigon|F
centi-|hundred|centigon|F
multi-|many|multigon|F"""),
]

def cards(block):
    out = []
    for line in block.strip().splitlines():
        p, m, w, r = [x.strip() for x in line.split('|')]
        out.append({'part': p, 'meaning': m, 'real': r == 'R', 'word': w})
    return add_defs(out)

levels = []
for lid, root, var, origin, typ, meaning, s, e in L:
    halves = {}
    if s: halves['start'] = {'cards': cards(s)}
    if e: halves['end'] = {'cards': cards(e)}
    levels.append({'id': lid, 'root': root, 'variants': var, 'origin': origin, 'type': typ,
                   'meaning': meaning, 'art': f'art/{lid}.webp', 'halves': halves})

world = {
  'id': 'w3', 'order': 3, 'name': 'Silver',
  'theme': {'name': 'silver', 'bg': '#0e1013', 'bg2': '#171a20', 'accent': '#c8d2dd',
            'foil': ['#8d97a3', '#f3f6f9', '#a9b3be'], 'glitter': '#dde5ee', 'particle': 'stars'},
  'levels': levels,
}
os.makedirs(OUT, exist_ok=True)
json.dump(world, open(f'{OUT}/world.json', 'w'), indent=2, ensure_ascii=False)

# ---- validate (same checks as app/build.py: wordfreq zipf + english-words web2/gcide) ----
import wordfreq
from english_words import get_english_words_set
DICT = get_english_words_set(['web2', 'gcide'], lower=True)
errors, warnings = [], []
forms_all = lambda lv: [lv['root']] + lv['variants']
ids = set()
for lv in world['levels']:
    if lv['id'] in ids: errors.append('dup level ' + lv['id'])
    ids.add(lv['id'])
    if not os.path.exists(os.path.join(OUT, lv['art'])): errors.append(f"{lv['id']}: missing art {lv['art']}")
    if not lv['halves']: errors.append(f"{lv['id']}: no halves")
    for side, half in lv['halves'].items():
        cs = half['cards']; tag = f"{lv['id']}/{side}"
        if len(cs) != 6: errors.append(f'{tag}: {len(cs)} cards')
        nr = sum(c['real'] for c in cs)
        if not 3 <= nr <= 4: errors.append(f'{tag}: {nr} real')
        ws = [c['word'].lower() for c in cs]
        if len(set(ws)) != 6: errors.append(f'{tag}: duplicate word')
        for c in cs:
            w = c['word'].lower(); p = c['part'].strip('-').lower()
            if side == 'start' and not (c['part'].startswith('-') and w.endswith(p)): errors.append(f'{tag}: {w} part {c["part"]}')
            if side == 'end' and not (c['part'].endswith('-') and w.startswith(p)): errors.append(f'{tag}: {w} part {c["part"]}')
            stem = w[:-len(p)] if side == 'start' else w[len(p):]
            if stem not in [f.lower() for f in forms_all(lv)]: errors.append(f'{tag}: {w} root piece "{stem}" not in root/variants')
            z = wordfreq.zipf_frequency(w, 'en')
            if c['real']:
                if z < 2.0: warnings.append(f'{tag}: rare real word {w} ({z})')
            elif z > 0 or w in DICT: errors.append(f'{tag}: fake {w} is a real word ({z})')
print('levels', len(world['levels']))
print('ERRORS', errors); print('WARNINGS', warnings)
sys.exit(1 if errors else 0)
