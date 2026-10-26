import sys, os, threading, functools, http.server, json
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
BASE = sys.argv[1] if len(sys.argv) > 1 else None
OUT = os.path.join(ROOT, 'work/screens'); os.makedirs(OUT, exist_ok=True)
if not BASE:
    H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(ROOT, 'app/dist'))
    H.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8798), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    BASE = 'http://127.0.0.1:8798/'
data = json.load(open([os.path.join(ROOT,'app/dist',f) for f in os.listdir(os.path.join(ROOT,'app/dist')) if f.startswith('data.')][0]))
lv = {l['id']: l for l in data['levels']}
progress = {'re': {'stars': 3, 'best': 80}, 'in': {'stars': 2, 'best': 60}, 'dis': {'stars': 3, 'best': 80}, 'de': {'stars': 1, 'best': 30}, 'sub': {'stars': 2, 'best': 55}}
sizes = {'desktop': (1280, 800), 'phone': (390, 844)}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    for name, (w, hgt) in sizes.items():
        ctx = b.new_context(viewport={'width': w, 'height': hgt}, device_scale_factor=2 if name == 'phone' else 1, has_touch=name == 'phone')
        pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE); pg.evaluate(f"localStorage.setItem('rootcraft.v2', JSON.stringify({json.dumps(progress)}))")
        pg.goto(BASE + '#/'); pg.reload(); pg.wait_for_timeout(1200)
        ov = lambda: pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')
        pg.screenshot(path=f'{OUT}/v2-map-{name}.png'); print(name, 'map', 'OVERFLOW' if ov() else 'ok')
        pg.goto(BASE + '#/l/pre'); pg.wait_for_timeout(1000)
        cards = lv['pre']['cards']
        # pick 6 of 8 real + 1 fake
        picks = [c['p'] for c in cards if c['real']][:6] + [c['p'] for c in cards if not c['real']][:1]
        for el in pg.locator('.pcard').all():
            t = el.locator('.pc-part').inner_text()
            if t in picks: el.click(); pg.wait_for_timeout(60)
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}/v2-level-{name}.png'); print(name, 'level', 'OVERFLOW' if ov() else 'ok')
        pg.screenshot(path=f'{OUT}/v2-level-{name}-full.png', full_page=True)
        pg.locator('.done').click(); pg.wait_for_timeout(3200)
        pg.screenshot(path=f'{OUT}/v2-result-{name}.png'); print(name, 'result', 'OVERFLOW' if ov() else 'ok')
        pg.screenshot(path=f'{OUT}/v2-result-{name}-full.png', full_page=True)
        pg.goto(BASE + '#/'); pg.wait_for_timeout(1200)
        pg.screenshot(path=f'{OUT}/v2-map-after-{name}.png')
        print(name, 'errors:', errs)
        ctx.close()
    b.close()
