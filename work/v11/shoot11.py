import threading, http.server, sys, json
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT = ROOT + '/work/screens/'
TAG = sys.argv[1] if len(sys.argv) > 1 else 'v11'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT + '/app/dist', **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8841), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
U = 'http://127.0.0.1:8841'
def strip(paths, out, box=None):
    ims = [Image.open(p) for p in paths]
    if box: ims = [i.crop(box(i)) for i in ims]
    W = sum(i.width for i in ims) + 12 * (len(ims) - 1); Hh = max(i.height for i in ims)
    s = Image.new('RGB', (W, Hh), (20, 20, 20)); x = 0
    for i in ims: s.paste(i, (x, 0)); x += i.width + 12
    s.save(out)
CARDT = "(sel)=>{const e=document.querySelector(sel+' .rcard');return e?e.style.transform:null}"
def rect(pg, sel):
    return pg.evaluate("(s)=>{const b=document.querySelector(s).getBoundingClientRect();return [b.left,b.top,b.width,b.height]}", sel)
with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- phone 390, touch ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(U + '/'); pg.wait_for_timeout(2500)
    print('mq hover:none', pg.evaluate("matchMedia('(hover: none), (pointer: coarse)').matches"))
    paths = []; ts = []
    for k, t in enumerate((0, 2, 4)):
        if k: pg.wait_for_timeout(2000)
        f = f'{OUT}{TAG}-sparkle-390-landing-drift-t{t}.png'; pg.screenshot(path=f); paths.append(f)
        ts.append(pg.evaluate("[...document.querySelectorAll('.row .tilt:not(.lite) .rcard')].map(e=>e.style.transform).slice(0,4)"))
    print('landing drift transforms', json.dumps(ts)[:600])
    strip(paths, f'{OUT}{TAG}-sparkle-390-landing-drift-strip.png', lambda i: (0, int(i.height * .28), i.width, int(i.height * .86)))
    # press sparkle on parade (finger)
    r = pg.evaluate("(()=>{const ts=[...document.querySelectorAll('.row .tilt')];let best=null,bd=1e9;for(const t of ts){const b=t.getBoundingClientRect();const d=Math.abs(b.left+b.width/2-195);if(d<bd){bd=d;best=b}}return [best.left,best.top,best.width,best.height]})()")
    pg.touchscreen.tap(r[0] + r[2] * .6, r[1] + r[3] * .45); pg.wait_for_timeout(170)
    pg.screenshot(path=f'{OUT}{TAG}-sparkle-390-landing-press.png', clip={'x': max(0, r[0] - 40), 'y': r[1] - 20, 'width': min(390, r[2] + 80), 'height': r[3] + 40})
    print('spark canvases after tap', pg.evaluate("document.querySelectorAll('.spark').length"))
    pg.wait_for_timeout(900); print('spark canvases after 1.1s', pg.evaluate("document.querySelectorAll('.spark').length"))
    # game level
    pg.goto(U + '/play/?all=1#/w/w1/re'); pg.wait_for_timeout(2000)
    paths = []; tt = []
    for k, t in enumerate((0, 2, 4)):
        if k: pg.wait_for_timeout(2000)
        f = f'{OUT}{TAG}-sparkle-390-game-drift-t{t}.png'; pg.screenshot(path=f); paths.append(f); tt.append(pg.evaluate(CARDT, '.tilt-main'))
    print('game drift', tt)
    strip(paths, f'{OUT}{TAG}-sparkle-390-game-drift-strip.png', lambda i: (0, 0, i.width, int(i.height * .5)))
    r = rect(pg, '.tilt-main')
    pg.touchscreen.tap(r[0] + r[2] * .35, r[1] + r[3] * .62); pg.wait_for_timeout(170)
    pg.screenshot(path=f'{OUT}{TAG}-sparkle-390-game-press.png', clip={'x': r[0] - 30, 'y': max(0, r[1] - 20), 'width': r[2] + 60, 'height': r[3] + 40})
    # option card still selects
    pg.wait_for_timeout(600)
    pg.tap('.pcard'); pg.wait_for_timeout(300)
    print('pcard pressed after tap', pg.evaluate("document.querySelector('.pcard').getAttribute('aria-pressed')"))
    # words mode
    pg.goto(U + '/play/?all=1#/words'); pg.wait_for_timeout(2500)
    a = pg.evaluate(CARDT, '.tilt-wm'); pg.wait_for_timeout(2000); bb = pg.evaluate(CARDT, '.tilt-wm')
    print('words drift', a, '|', bb)
    pg.screenshot(path=f'{OUT}{TAG}-sparkle-390-words.png')
    # hidden tab pauses: count rAF-driven changes not measurable headless; check visibility handler exists implicitly
    print('errors 390', errs); ctx.close()
    # ---------- reduced motion phone: no drift ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(U + '/play/?all=1#/w/w1/re'); pg.wait_for_timeout(1500)
    a = pg.evaluate(CARDT, '.tilt-main'); pg.wait_for_timeout(1500); print('reduced game transform', repr(a), repr(pg.evaluate(CARDT, '.tilt-main'))); ctx.close()
    # ---------- desktop 1280 ----------
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(U + '/play/?all=1#/w/w1/re'); pg.wait_for_timeout(2000)
    a = pg.evaluate(CARDT, '.tilt-main'); pg.wait_for_timeout(1500); print('desktop idle game (should be static)', a, '|', pg.evaluate(CARDT, '.tilt-main'))
    r = rect(pg, '.tilt-main')
    pg.mouse.move(r[0] + r[2] * .62, r[1] + r[3] * .4, steps=6); pg.wait_for_timeout(500)
    pg.mouse.down(); pg.wait_for_timeout(190)
    pg.screenshot(path=f'{OUT}{TAG}-sparkle-1280-game-press.png', clip={'x': r[0] - 40, 'y': max(0, r[1] - 30), 'width': r[2] + 80, 'height': r[3] + 60}); pg.mouse.up()
    pg.goto(U + '/'); pg.wait_for_timeout(2500)
    r = pg.evaluate("(()=>{const ts=[...document.querySelectorAll('.row .tilt')];let best=null,bd=1e9;for(const t of ts){const b=t.getBoundingClientRect();const d=Math.abs(b.left+b.width/2-640);if(d<bd){bd=d;best=b}}return [best.left,best.top,best.width,best.height]})()")
    pg.mouse.move(r[0] + r[2] * .5, r[1] + r[3] * .5, steps=6); pg.wait_for_timeout(500)
    r = pg.evaluate("(()=>{const b=document.querySelector('.row .tilt:not(.lite)').getBoundingClientRect();return [b.left,b.top,b.width,b.height]})()")
    pg.mouse.move(r[0] + r[2] * .4, r[1] + r[3] * .35, steps=3); pg.mouse.down(); pg.wait_for_timeout(190)
    pg.screenshot(path=f'{OUT}{TAG}-sparkle-1280-landing-press.png', clip={'x': r[0] - 40, 'y': max(0, r[1] - 30), 'width': r[2] + 80, 'height': r[3] + 60}); pg.mouse.up()
    print('errors 1280', errs); ctx.close(); b.close()
