# usage: python3 shoot.py <outdir> <fps> <dur> [start_frame end_frame] [--dpr N]  | stills: python3 shoot.py stills t1 t2 ...
import sys, threading, http.server, os, json
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
CFG = dict(f0=0.5, f1=1.05, reset=1.1, g0=1.35, g1=5.15)  # total 7.0 s
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
port = srv.server_address[1]
args = sys.argv[1:]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/work/og/capture.html'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(600)
    pg.evaluate('window.__tree.build()'); pg.wait_for_timeout(100)
    def at(T): pg.evaluate(f'window.__og.frame({T}, {json.dumps(CFG)})')
    if args[0] == 'stills':
        for t in args[1:]:
            # step up to t at 30 fps so transitions are born at the right virtual time
            pass
        ts = [float(x) for x in args[1:]]; T = 0.0; k = 0
        while k < len(ts):
            at(T)
            if T >= ts[k] - 1e-6:
                pg.screenshot(path=f'{ROOT}/work/og/still-{ts[k]:.2f}.png'); k += 1
            T = round(T + 1/30, 5)
    else:
        out, fps, dur = args[0], int(args[1]), float(args[2])
        n = int(round(fps * dur)); s, e = (int(args[3]), int(args[4])) if len(args) > 4 else (0, n)
        os.makedirs(out, exist_ok=True)
        for i in range(0, e):  # always replay from 0 so CSS transitions are born identically
            at(i / fps)
            if i >= s: pg.screenshot(path=f'{out}/f{i:04d}.png')
    print('errors:', errs)
    b.close()
