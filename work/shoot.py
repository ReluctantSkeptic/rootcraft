import sys, os, threading, functools, http.server, json
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
BASE = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith('http') else None
OUT = os.path.join(ROOT, 'work/screens'); os.makedirs(OUT, exist_ok=True)
if not BASE:
    H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(ROOT, 'app/dist'))
    H.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8799), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    BASE = 'http://127.0.0.1:8799/'
routes = sys.argv[2].split(',') if len(sys.argv) > 2 else ['', 'build', 'build/port', 'cards', 'grow', 'dig', 'mint', 'sort', 'build/mystery']
sizes = {'desk': (1280, 860), 'phone': (390, 844)}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    for name, (w, hgt) in sizes.items():
        ctx = b.new_context(viewport={'width': w, 'height': hgt}, device_scale_factor=2 if name == 'phone' else 1, has_touch=name == 'phone')
        pg = ctx.new_page()
        errs = []
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        for r in routes:
            pg.goto(BASE + '#/' + r); pg.wait_for_timeout(900)
            if r == 'build/port':
                for s in ['re', 'port', 'er']:
                    pg.locator(f'.matrix .tile[data-s="{s}"]').first.click(); pg.wait_for_timeout(120)
                pg.wait_for_timeout(500)
            if r == 'cards':
                c = pg.locator('.hand .pcard').first; c.click(); pg.wait_for_timeout(300)
            if r == 'sort':
                chips = pg.locator('.pool .wchip')
                chips.first.click(); pg.locator('.bin').nth(0).click(); pg.wait_for_timeout(300)
            ov = pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')
            fn = f"{OUT}/{name}-{r.replace('/', '_') or 'home'}.png"
            pg.screenshot(path=fn, full_page=True)
            print(name, r or 'home', 'overflowX' if ov else 'ok')
        print(name, 'errors:', errs)
        ctx.close()
    b.close()
