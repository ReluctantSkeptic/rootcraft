#!/usr/bin/env python3
"""State-machine regressions for Rootcraft. Serves app/dist and drives the built site.

Run from the repo root after `python3 app/build.py`:
  python3 app/test/test_state.py
"""
import os, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST = os.path.join(ROOT, 'app', 'dist')
PORT = 8765

fails = []

def check(name, cond, detail=''):
    if cond:
        print(f'  ok  {name}')
    else:
        print(f' FAIL {name} {detail}')
        fails.append(name)

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)
    def log_message(self, *a):
        pass

def serve():
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), H)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def main():
    serve()
    base = f'http://127.0.0.1:{PORT}'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # ---------- highlight joins the picked part, not a longer overlap ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/play/?all=1#/words/w2/logy', wait_until='load')
        pg.wait_for_selector('.tw-w', timeout=8000)
        html = pg.locator('.tw-w', has_text='technology').first.inner_html()
        check('logy highlight is techno+logy', 'techno<b>logy</b>' in html, html)
        check('logy highlight does not swallow the prefix', 'techn<b>ology</b>' not in html, html)
        ctx.close()

        # ---------- leaving during the half-turn must not grade the next level ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/play/?all=1#/w/w1/port', wait_until='load')
        pg.wait_for_selector('.level-screen .pcard')
        pg.locator('.pcard').first.click()
        pg.locator('.done').click()
        pg.evaluate("location.hash = '#/w/w1/dict'")
        pg.wait_for_selector('.level-screen')
        pg.wait_for_timeout(700)
        live = pg.locator('#live').inner_text()
        check('half-turn does not announce the next half early', 'comes last' not in live, repr(live))
        pg.locator('.pcard').first.click()
        pg.locator('.done').click()
        pg.wait_for_timeout(500)
        check('next level still has its second half', pg.locator('.result-screen').count() == 0 and pg.locator('.level-screen').count() == 1,
              f"result={pg.locator('.result-screen').count()} level={pg.locator('.level-screen').count()} done={pg.locator('.done').inner_text() if pg.locator('.done').count() else ''}")
        ctx.close()

        # ---------- words: far jump must not rewrite the URL after leaving ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/play/#/words', wait_until='load')
        pg.wait_for_selector('.wpage.is-live')
        pg.wait_for_timeout(300)
        # End starts a fade and does not move the target yet. ArrowRight asks for the next root.
        # The fade's onfinish must not overwrite that step.
        pg.evaluate("""() => {
          document.dispatchEvent(new KeyboardEvent('keydown', {key:'End', bubbles:true}));
          document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}));
        }""")
        pg.wait_for_timeout(900)
        h = pg.evaluate('location.hash')
        check('a step during a far jump is not overwritten', h.endswith('/w1/in'), h)
        ctx.close()

        # ---------- words: resize debounce must not revive words mode ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/play/#/words', wait_until='load')
        pg.wait_for_selector('.wpage')
        pg.evaluate("""() => { dispatchEvent(new Event('resize')); location.hash = '#/'; }""")
        pg.wait_for_timeout(400)
        h = pg.evaluate('location.hash')
        check('resize after leaving does not restore the words url', h in ('#/', '#', ''), h)
        ctx.close()

        # ---------- words: pointerup outside the stage must not freeze the carousel ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/play/#/words', wait_until='load')
        pg.wait_for_selector('.wpage.is-live')
        pg.wait_for_timeout(300)
        before = pg.evaluate('location.hash')
        pg.evaluate("""() => {
          const stage = document.querySelector('.wm-stage');
          const r = stage.getBoundingClientRect();
          stage.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true, clientX:r.left+40, clientY:r.top+40, pointerId:1, pointerType:'mouse', button:0, buttons:1}));
          document.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, cancelable:true, clientX:8, clientY:8, pointerId:1, pointerType:'mouse', button:0}));
        }""")
        pg.evaluate("""() => document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}))""")
        pg.wait_for_timeout(1200)
        after = pg.evaluate('location.hash')
        check('arrow key still moves after a pointerup outside the stage', after != before, f'{before} -> {after}')
        ctx.close()

        # ---------- parade: pointerup outside a shelf must not freeze it ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '/', wait_until='load')
        pg.wait_for_selector('.shelf .row .tilt')
        def tile():
            return pg.locator('.shelf .row').first.locator('.tilt').first.evaluate('el => el.style.transform')
        moved = False
        a = tile()
        for _ in range(15):
            pg.wait_for_timeout(150)
            if tile() != a:
                moved = True
                break
        check('parade is moving before the drag', moved)
        pg.evaluate("""() => {
          const row = document.querySelector('.shelf .row');
          const r = row.getBoundingClientRect();
          row.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true, clientX:r.left+30, clientY:r.top+30, pointerId:3, pointerType:'mouse', button:0, buttons:1}));
          document.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, cancelable:true, clientX:4, clientY:4, pointerId:3, pointerType:'mouse', button:0}));
        }""")
        b = tile()
        pg.wait_for_timeout(500)
        check('parade keeps moving after pointerup outside the shelf', tile() != b, f'before {b} after {tile()}')
        ctx.close()

        # ---------- contact: required fields, single flight, hung request ----------
        ctx = browser.new_context(viewport={'width': 1100, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script("""
          window.__posts = 0;
          const orig = window.fetch;
          window.fetch = function(url, opts) {
            if (String(url).includes('site-contact')) {
              window.__posts++;
              const n = window.__posts;
              return new Promise(res => setTimeout(() => res(new Response(JSON.stringify({ok:true}), {status:200, headers:{'Content-Type':'application/json'}})), 200));
            }
            return orig.apply(this, arguments);
          };
        """)
        pg.goto(base + '/contact/', wait_until='load')
        pg.locator('button[type=submit]').click()
        pg.wait_for_timeout(400)
        empty_n = pg.evaluate('window.__posts')
        empty_status = pg.locator('.cx-status').inner_text()
        check('empty contact form does not post', empty_n == 0, f'posts={empty_n} status={empty_status!r}')
        pg.fill('#cx-email', 'ada@example.com')
        pg.fill('#cx-msg', 'Hello from the test.')
        pg.evaluate("""() => { const f = document.querySelector('[data-contact]'); f.requestSubmit(); f.requestSubmit(); }""")
        pg.wait_for_timeout(700)
        n = pg.evaluate('window.__posts')
        status = pg.locator('.cx-status').inner_text()
        check('double submit posts once', n == empty_n + 1, f'posts={n} after empty={empty_n}')
        check('successful send keeps the thanks message', 'on its way' in status, status)
        ctx.close()

        ctx = browser.new_context(viewport={'width': 1100, 'height': 800})
        pg = ctx.new_page()
        # Shrink only the long abort timer so a hung request is observable without waiting 20s.
        pg.add_init_script("""
          const orig = window.setTimeout;
          window.setTimeout = (fn, ms, ...a) => orig(fn, ms >= 5000 ? 40 : ms, ...a);
          const origFetch = window.fetch;
          window.fetch = function(url, opts) {
            if (String(url).includes('site-contact')) {
              return new Promise((resolve, reject) => {
                const sig = opts && opts.signal;
                const abort = () => reject(Object.assign(new Error('aborted'), {name:'AbortError'}));
                if (sig) {
                  if (sig.aborted) abort();
                  else sig.addEventListener('abort', abort, {once:true});
                }
              });
            }
            return origFetch.apply(this, arguments);
          };
        """)
        pg.goto(base + '/contact/', wait_until='load')
        pg.fill('#cx-email', 'ada@example.com')
        pg.fill('#cx-msg', 'Still there?')
        pg.locator('button[type=submit]').click()
        pg.wait_for_function("() => document.querySelector('button[type=submit]').disabled === true")
        pg.wait_for_timeout(250)
        disabled = pg.locator('button[type=submit]').is_disabled()
        msg = pg.locator('.cx-status').inner_text()
        check('hung contact send does not stick', disabled is False and "Couldn't" in msg, f'disabled={disabled} msg={msg!r}')
        ctx.close()

        # ---------- boot: failed data load, and a deep link survives a slow load ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('boot:' + str(e)))
        pg.route('**/data.*.json', lambda route: route.fulfill(status=500, body='no'))
        pg.goto(base + '/play/', wait_until='load')
        pg.wait_for_timeout(400)
        check('failed data load offers a retry', pg.locator('#boot-retry').count() == 1)
        ctx.close()

        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.add_init_script("""
          const orig = window.fetch;
          window.fetch = function(url, opts) {
            const p = orig.apply(this, arguments);
            if (String(url).includes('data.')) return p.then(r => new Promise(res => setTimeout(() => res(r), 1500)));
            return p;
          };
        """)
        pg.goto(base + '/play/?all=1#/w/w1/port', wait_until='load')
        pg.evaluate("location.hash = '#/w/w1/dict'")
        try:
            pg.wait_for_selector('.rcard-name', timeout=6000)
            h = pg.evaluate('location.hash')
            title = pg.locator('.rcard-name').inner_text()
        except Exception as e:
            h, title = pg.evaluate('location.hash'), str(e)
        check('deep link survives a hash change while data is loading', isinstance(title, str) and 'dict' in h and 'dict' in title.lower(), f'{h} {title!r}')
        ctx.close()

        # ---------- saves: valid v6 is kept, v2 migrates, a corrupt value does not crash ----------
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('save:' + str(e)))
        pg.goto(base + '/play/', wait_until='load')
        pg.evaluate("""() => {
          localStorage.clear();
          localStorage.setItem('rootcraft.v6', JSON.stringify({'w1/re': {stars: 2, best: 40, note: 'keep'}}));
        }""")
        pg.reload(wait_until='load')
        pg.wait_for_timeout(300)
        kept = pg.evaluate("localStorage.getItem('rootcraft.v6')")
        check('valid save is not rewritten', '"note":"keep"' in kept or '"note": "keep"' in kept, kept)
        pg.goto(base + '/play/?all=1#/w/w1/re', wait_until='load')
        pg.wait_for_selector('.pcard')
        for i in range(6):
            pg.locator('.pcard').nth(i).click()
        pg.locator('.done').click()
        pg.wait_for_selector('.result-screen')
        kept2 = pg.evaluate("JSON.parse(localStorage.getItem('rootcraft.v6'))['w1/re']")
        check('finishing a level keeps unknown save fields', kept2.get('note') == 'keep' and kept2.get('stars', 0) >= 2, str(kept2))
        pg.evaluate("""() => {
          localStorage.clear();
          localStorage.setItem('rootcraft.v2', JSON.stringify({re:{stars:3,best:80}, bogus:{stars:1}}));
        }""")
        pg.reload(wait_until='load')
        pg.wait_for_timeout(300)
        mig = pg.evaluate("JSON.parse(localStorage.getItem('rootcraft.v6'))")
        check('v2 stars migrate and old best scores do not', mig.get('w1/re') == {'stars': 3, 'best': 0} and 'w1/bogus' not in mig, str(mig))
        pg.evaluate("""() => { localStorage.setItem('rootcraft.v6', '"bad"'); }""")
        pg.goto(base + '/play/?all=1#/w/w1/re', wait_until='load')
        pg.wait_for_selector('.pcard')
        for i in range(6):
            pg.locator('.pcard').nth(i).click()
        pg.locator('.done').click()
        try:
            pg.wait_for_selector('.result-screen', timeout=4000)
            showed = True
        except Exception as e:
            showed = False
            errs.append('corrupt:' + str(e).split('\n')[0])
        check('corrupt save still reaches the result', showed)
        fixed = pg.evaluate("JSON.parse(localStorage.getItem('rootcraft.v6'))")
        check('corrupt save is replaced by an object', isinstance(fixed, dict) and 'w1/re' in fixed, str(fixed))
        ctx.close()

        # ---------- happy path: a two-half level grades only the cards the player picked ----------
        ctx = browser.new_context(viewport={'width': 1100, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('play:' + str(e)))
        pg.goto(base + '/play/?all=1#/w/w1/port', wait_until='load')
        pg.wait_for_selector('.level-screen .pcard')
        halves = pg.evaluate("""async () => {
          const data = await (await fetch(document.documentElement.dataset.data)).json();
          const lv = data.worlds.find(w => w.id === 'w1').levels.find(l => l.id === 'port');
          return { start: lv.halves.start.filter(c => c.real).map(c => c.p.replace(/-/g, '')),
                   end: (lv.halves.end || []).filter(c => c.real).map(c => c.p.replace(/-/g, '')) };
        }""")
        def pick(parts):
            cards = pg.locator('.level-screen .pcard')
            for i in range(cards.count()):
                shown = cards.nth(i).locator('.pc-part').inner_text().replace('-', '').replace(' ', '').lower()
                if shown in parts:
                    cards.nth(i).click()
        pick(halves['start'])
        pg.locator('.done').click()
        pg.wait_for_function("() => document.querySelector('.done') && document.querySelector('.done').textContent === 'Done'", timeout=4000)
        pg.wait_for_timeout(80)
        live = pg.locator('#live').inner_text()
        check('second half is announced when it actually appears', 'comes last' in live, live)
        pick(halves['end'])
        pg.locator('.done').click()
        pg.wait_for_selector('.result-screen')
        stars = pg.locator('.big-stars .star.on').count()
        saved = pg.evaluate("JSON.parse(localStorage.getItem('rootcraft.v6'))['w1/port']")
        check('a perfect port level is 3 stars and saved once', stars == 3 and saved.get('stars') == 3, f'stars={stars} saved={saved}')
        # one result, not two, and replaying does not add a second record shape
        pg.locator('.again').click()
        pg.wait_for_selector('.level-screen .pcard')
        check('replay deals a fresh hand', pg.locator('.result-screen').count() == 0)
        ctx.close()

        # landing still renders its headings and does not throw
        ctx = browser.new_context(viewport={'width': 390, 'height': 844})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('land:' + str(e)))
        pg.goto(base + '/', wait_until='load')
        pg.wait_for_selector('h1')
        check('landing has one h1', pg.locator('h1').count() == 1)
        check('landing json-ld is only the website', pg.locator('script[type="application/ld+json"]').count() == 1)
        pg.goto(base + '/play/', wait_until='load')
        pg.wait_for_selector('.menu-screen')
        check('play json-ld is only the application', pg.locator('script[type="application/ld+json"]').count() == 1)
        pg.goto(base + '/contact/', wait_until='load')
        check('contact json-ld is only the contact page', pg.locator('script[type="application/ld+json"]').count() == 1
              and 'ContactPage' in pg.locator('script[type="application/ld+json"]').inner_text())
        ctx.close()

        # ---------- cache headers: immutable only on content-hashed play assets ----------
        headers = open(os.path.join(DIST, '_headers')).read()
        play_html = open(os.path.join(DIST, 'play', 'index.html')).read()
        font_dir = os.path.join(DIST, 'play', 'fonts')
        names = os.listdir(font_dir)
        check('play fonts are content-hashed', bool(names) and all(n.count('.') >= 2 for n in names), str(names))
        check('play html points at hashed fonts', 'fonts/fonts.css' not in play_html and 'BricolageGrotesque.woff2"' not in play_html)
        blocks, cur = [], None
        for line in headers.splitlines():
            if not line.strip() or line.strip().startswith('#'):
                continue
            if line[:1] in ' \t':
                if cur: cur[1].append(line.strip())
            else:
                cur = [line.strip(), []]
                blocks.append(cur)
        immutable = [p for p, body in blocks if any('immutable' in b for b in body)]
        allowed = {'/play/fonts/*', '/play/*.js', '/play/*.css', '/play/data.*', '/play/art/*'}
        check('immutable only on hashed play assets', set(immutable) <= allowed, str(immutable))
        landing_fonts = [body for p, body in blocks if p == '/fonts/*']
        check('landing fonts are cacheable but not immutable',
              bool(landing_fonts) and not any('immutable' in b for b in landing_fonts[0]))
        for name in ('robots.txt', 'sitemap.xml', 'llms.txt'):
            check(name + ' is shipped', os.path.exists(os.path.join(DIST, name)))

        check('no page errors', not errs, '\n'.join(errs[:8]))

    print(f'\n{len(fails)} failed' if fails else '\nall passed')
    return 1 if fails else 0

if __name__ == '__main__':
    raise SystemExit(main())
