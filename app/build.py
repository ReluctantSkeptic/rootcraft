#!/usr/bin/env python3
"""Build Rootcraft v6 -> app/dist.

  dist/            landing page (copied from app/src/landing/ if it has index.html, else a redirect)
  dist/play/       the game: index.html, hashed app/css/data, fonts/, art/<world>/<level>.<hash>.webp

Discovers every app/src/worlds/*/world.json present at build time and validates it
against work/swarm/SPEC.md (6 cards per half, 3-4 real, dictionary-checked words).

usage: python3 app/build.py [--allow-partial]
  default         any validation error fails the build (exit 1)
  --allow-partial worlds with errors are LEFT OUT (loudly listed) and the rest still build
"""
import json, os, shutil, hashlib, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(HERE, 'src'), os.path.join(HERE, 'dist')
PLAY = os.path.join(DIST, 'play')
PARTIAL = '--allow-partial' in sys.argv

try:
    import wordfreq
    from english_words import get_english_words_set
except ImportError:
    sys.exit('wordfreq/english-words not installed: run `pip install wordfreq english-words` '
             'so the dictionary checks run (they are never skipped)')
DICT = get_english_words_set(['web2', 'gcide'], lower=True)

def is_word(w):
    """A real English word: in the 370k list or has measurable frequency."""
    w = w.lower()
    return w in DICT or wordfreq.zipf_frequency(w, 'en') >= 1.5

def looks_real(w):
    """For fakes: anything a dictionary or frequency list knows counts as real."""
    w = w.lower()
    return w in DICT or wordfreq.zipf_frequency(w, 'en') > 0

def lev(a, b):
    """Levenshtein distance."""
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def h(b): return hashlib.sha1(b if isinstance(b, bytes) else b.encode()).hexdigest()[:8]

THEME_KEYS = ('bg', 'bg2', 'accent', 'foil', 'glitter', 'particle')

def validate_world(path):
    wdir = os.path.dirname(path)
    errs, warns = [], []
    try:
        W = json.load(open(path))
    except Exception as e:
        return None, [f'cannot parse {path}: {e}'], []
    wid = W.get('id') or os.path.basename(wdir)
    if W.get('id') != os.path.basename(wdir): errs.append(f'id {W.get("id")!r} != folder {os.path.basename(wdir)!r}')
    if not isinstance(W.get('order'), (int, float)): errs.append('order missing')
    if not W.get('name'): errs.append('name missing')
    th = W.get('theme') or {}
    for k in THEME_KEYS:
        if k not in th: errs.append(f'theme.{k} missing')
    if not (isinstance(th.get('foil'), list) and len(th.get('foil', [])) >= 2): errs.append('theme.foil needs >=2 colours')
    if th.get('particle') not in ('none', 'dust', 'sparkle', 'stars'): warns.append(f'theme.particle {th.get("particle")!r} -> none')
    levels = W.get('levels') or []
    if not levels: errs.append('no levels')
    seen = set()
    for lv in levels:
        lid = lv.get('id', '?'); P = f'{lid}'
        if lid in seen: errs.append(f'{P}: duplicate level id')
        seen.add(lid)
        for k in ('root', 'meaning', 'origin', 'type'):
            if not lv.get(k): errs.append(f'{P}: {k} missing')
        if lv.get('origin') not in ('Latin', 'Greek'): warns.append(f'{P}: origin {lv.get("origin")!r}')
        if lv.get('type') not in ('Prefix', 'Root', 'Suffix'): warns.append(f'{P}: type {lv.get("type")!r}')
        art = os.path.join(wdir, lv.get('art') or f'art/{lid}.webp')
        if not os.path.exists(art): errs.append(f'{P}: missing art {os.path.relpath(art, SRC)}')
        variants = [v.lower() for v in (lv.get('variants') or []) if v]
        main = (lv.get('root') or '').lower()
        # spelling rule (Yuriy, Oct 23 2026): at most ONE alternative spelling, within one letter of the main root
        if len(variants) > 1: errs.append(f'{P}: {len(variants)} variants {variants} (max 1)')
        for v in variants:
            if v == main or lev(main, v) > 1: errs.append(f'{P}: variant {v!r} must differ from {main!r} by exactly one letter')
        forms = [f for f in [main] + variants if f]
        halves = lv.get('halves') or {}
        if not any(k in halves for k in ('start', 'end')): errs.append(f'{P}: no start/end half')
        for k in halves:
            if k not in ('start', 'end'): errs.append(f'{P}: unknown half {k!r}')
        for side in ('start', 'end'):
            if side not in halves: continue
            cards = (halves[side] or {}).get('cards') or []
            Q = f'{P}/{side}'
            if len(cards) != 6: errs.append(f'{Q}: {len(cards)} cards (must be exactly 6)')
            nr = sum(bool(c.get('real')) for c in cards)
            if not 3 <= nr <= 4: errs.append(f'{Q}: {nr} real cards (must be 3 or 4)')
            words = []
            for c in cards:
                part, mean, word = (c.get('part') or '').strip(), (c.get('meaning') or '').strip(), (c.get('word') or '').strip().lower()
                if not part: errs.append(f'{Q}: card without part')
                if not mean: errs.append(f'{Q}: {part}: no meaning')
                if not word: errs.append(f'{Q}: {part}: no word'); continue
                words.append(word)
                if side == 'start' and not part.startswith('-'): errs.append(f'{Q}: part {part!r} should start with "-" (an ending)')
                if side == 'end' and not part.endswith('-'): errs.append(f'{Q}: part {part!r} should end with "-" (a beginning)')
                bare = part.strip('-').lower()
                # the root (main or the kept variant) must sit exactly at the join
                if side == 'start' and not any(word == f + bare for f in forms):
                    errs.append(f'{Q}: {word!r} is not root form {forms} + {part!r} exactly')
                if side == 'end' and not any(word.startswith(bare + f) for f in forms):
                    errs.append(f'{Q}: {word!r} does not have root form {forms} right after {part!r}')
                if c.get('real'):
                    if not is_word(word): errs.append(f'{Q}: real word {word!r} not found in dictionary')
                    if not any(f in word for f in forms): warns.append(f'{Q}: {word!r} contains no root form {forms}')
                    if side == 'start' and not any(word.startswith(f) for f in forms): warns.append(f'{Q}: {word!r} does not start with a root form')
                    if side == 'end' and not word.startswith(bare): warns.append(f'{Q}: {word!r} does not start with {bare!r}')
                    if side == 'start' and not word.endswith(bare): warns.append(f'{Q}: {word!r} does not end with {bare!r}')
                else:
                    if looks_real(word): errs.append(f'{Q}: fake {word!r} is a real/dictionary word')
            if len(set(words)) != len(words): errs.append(f'{Q}: duplicate word')
    return W, errs, warns

def main():
    paths = sorted(glob.glob(os.path.join(SRC, 'worlds', '*', 'world.json')))
    if not paths: sys.exit('no worlds found in app/src/worlds/*/world.json')
    worlds, failed, all_warn = [], [], []
    for p in paths:
        W, errs, warns = validate_world(p)
        name = os.path.basename(os.path.dirname(p))
        all_warn += [f'{name}: {w}' for w in warns]
        if errs:
            failed.append(name)
            print(f'\nERROR in world {name} ({len(errs)}):'); print('\n'.join('  ' + e for e in errs))
        else:
            W['_dir'] = os.path.dirname(p); worlds.append(W)
    if failed and not PARTIAL:
        sys.exit(f'\nbuild failed: {len(failed)} invalid world(s): {", ".join(failed)} (use --allow-partial to build without them)')
    if failed: print(f'\n!!! LEFT OUT invalid worlds: {", ".join(failed)} !!!\n')
    if not worlds: sys.exit('no valid worlds')
    worlds.sort(key=lambda w: w['order'])
    roots = {}
    for W in worlds:
        for lv in W['levels']:
            roots.setdefault(lv['root'], []).append(W['id'])
    for r, ws in roots.items():
        if len(ws) > 1: all_warn.append(f'root {r!r} repeated in worlds {ws}')

    if os.path.exists(DIST): shutil.rmtree(DIST)
    os.makedirs(os.path.join(PLAY, 'art'))
    shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(PLAY, 'fonts'))
    out = []
    for W in worlds:
        os.makedirs(os.path.join(PLAY, 'art', W['id']), exist_ok=True)
        levels = []
        for lv in W['levels']:
            src = os.path.join(W['_dir'], lv.get('art') or f"art/{lv['id']}.webp")
            b = open(src, 'rb').read()
            rel = f"art/{W['id']}/{lv['id']}.{h(b)}.webp"
            open(os.path.join(PLAY, rel), 'wb').write(b)
            forms = [lv['root']] + [v for v in (lv.get('variants') or []) if v and v != lv['root']]
            halves = {}
            for side in ('start', 'end'):
                if side in lv['halves']:
                    halves[side] = [dict(p=c['part'], m=c['meaning'], w=c['word'].lower(), real=bool(c['real']),
                                         **({'d': c['def']} if c.get('def') else {})) for c in lv['halves'][side]['cards']]
            levels.append(dict(id=lv['id'], root=lv['root'], forms=forms, origin=lv['origin'], type=lv['type'],
                               meaning=lv['meaning'], art=rel, halves=halves))
        th = W['theme']
        out.append(dict(id=W['id'], order=W['order'], name=W['name'],
                        theme={k: th.get(k) for k in ('name',) + THEME_KEYS}, levels=levels))

    blob = json.dumps(dict(worlds=out), separators=(',', ':'), ensure_ascii=False)
    gb = open(os.path.join(SRC, 'glitter.webp'), 'rb').read()
    gname = f'art/glitter.{h(gb)}.webp'
    open(os.path.join(PLAY, gname), 'wb').write(gb)
    names = {}
    for src, ext in (('app.js', 'js'), ('styles.css', 'css')):
        txt = open(os.path.join(SRC, src)).read()
        if src == 'app.js':  # v13 smoke textures -> hashed art/smoke/ files
            for f in sorted(os.listdir(os.path.join(SRC, 'smoke'))):
                if not f.endswith('.webp'): continue
                sb = open(os.path.join(SRC, 'smoke', f), 'rb').read()
                sname = f"art/smoke/{f[:-5]}.{h(sb)}.webp"
                os.makedirs(os.path.join(PLAY, 'art', 'smoke'), exist_ok=True)
                open(os.path.join(PLAY, sname), 'wb').write(sb)
                assert f"'smoke/{f}'" in txt, f
                txt = txt.replace(f"'smoke/{f}'", f"'{sname}'")
        if src == 'styles.css':
            assert 'glitter.webp' in txt
            txt = txt.replace('glitter.webp', gname)
            # v14 crayon card textures -> hashed art/card/ files
            os.makedirs(os.path.join(PLAY, 'art', 'card'), exist_ok=True)
            for f in sorted(os.listdir(os.path.join(SRC, 'card'))):
                if not f.endswith('.webp'): continue
                cb = open(os.path.join(SRC, 'card', f), 'rb').read()
                cname = f"art/card/{f[:-5]}.{h(cb)}.webp"
                open(os.path.join(PLAY, cname), 'wb').write(cb)
                assert f'card/{f}' in txt, f
                txt = txt.replace(f'url(card/{f})', f'url({cname})')
        nm = f"{src.split('.')[0]}.{h(txt)}.{ext}"
        names[src] = nm
        open(os.path.join(PLAY, nm), 'w').write(txt)
    dn = f'data.{h(blob)}.json'
    open(os.path.join(PLAY, dn), 'w').write(blob)
    html = open(os.path.join(SRC, 'index.html')).read()
    html = html.replace('app.js', names['app.js']).replace('styles.css', names['styles.css']).replace('__DATA__', dn)
    open(os.path.join(PLAY, 'index.html'), 'w').write(html)
    if os.path.exists(os.path.join(SRC, 'icon.svg')):
        shutil.copy(os.path.join(SRC, 'icon.svg'), PLAY); shutil.copy(os.path.join(SRC, 'icon.svg'), DIST)
    shutil.copy(os.path.join(SRC, '_headers'), DIST)
    share = os.path.join(SRC, 'share')  # link-preview assets (og.jpg, og.mp4, apple-touch-icon.png) -> site root
    if os.path.isdir(share):
        for f in os.listdir(share): shutil.copy(os.path.join(share, f), DIST)

    landing = os.path.join(SRC, 'landing')
    if os.path.exists(os.path.join(landing, 'index.html')):
        for item in os.listdir(landing):
            s, d = os.path.join(landing, item), os.path.join(DIST, item)
            if item == 'play': print('warn: landing/play ignored (reserved for the game)'); continue
            (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, d)
        land = 'landing'
        # v14: the landing cards use the same crayon textures (landing.css -> img/card/*.webp)
        shutil.copytree(os.path.join(SRC, 'card'), os.path.join(DIST, 'img', 'card'), dirs_exist_ok=True)
    else:
        open(os.path.join(DIST, 'index.html'), 'w').write(
            '<!doctype html><meta charset="utf-8"><title>Rootcraft</title>'
            '<meta http-equiv="refresh" content="0; url=/play/"><link rel="canonical" href="/play/">'
            '<script>location.replace("/play/"+location.search+location.hash)</script>')
        land = 'redirect'

    for w in all_warn: print('warn:', w)
    for W in out:
        n2 = sum(len(l['halves']) == 2 for l in W['levels'])
        print(f"ok: {W['id']} {W['name']}: {len(W['levels'])} levels ({n2} two-half), "
              f"{sum(len(l['halves']) for l in W['levels'])} halves")
    print(f'root: {land}; play/: {names["app.js"]}, {names["styles.css"]}, {dn}')

if __name__ == '__main__':
    main()
