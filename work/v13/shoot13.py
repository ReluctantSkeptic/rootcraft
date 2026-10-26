import threading, http.server, sys, json
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT = ROOT + '/work/screens/'
TAG = sys.argv[1] if len(sys.argv) > 1 else 'v13-smoke'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT + '/app/dist', **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8843), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
U = 'http://127.0.0.1:8843/play/?all=1'
data = json.load(open(ROOT + '/app/dist/play/' + [l for l in open(ROOT + '/app/dist/play/index.html').read().split('"') if l.startswith('data.')][0]))
FIRST = {w['id']: (w['name'].lower(), w['levels'][0]['id']) for w in data['worlds']}
SEEK = "(t)=>{for(const a of document.getAnimations()){if(a.animationName&&a.animationName.startsWith('smk')){a.pause();a.currentTime=t*1000}}}"
def strip(paths, out, crop=None):
    ims = [Image.open(p).convert('RGB') for p in paths]
    if crop: ims = [i.crop(crop(i)) for i in ims]
    W = sum(i.width for i in ims) + 12 * (len(ims) - 1); Hh = max(i.height for i in ims)
    s = Image.new('RGB', (W, Hh), (40, 40, 40)); x = 0
    for i in ims: s.paste(i, (x, 0)); x += i.width + 12
    s.save(out)
with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    for vw, vh, dpr, mob in ((390, 844, 2, True), (1280, 800, 1, False)):
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        for wid, (nm, lid) in FIRST.items():
            for kind, hsh in (('map', f'#/w/{wid}'), ('level', f'#/w/{wid}/{lid}')):
                pg.goto(U + hsh); pg.wait_for_timeout(2200)
                pg.evaluate(SEEK, 30)
                pg.screenshot(path=f'{OUT}{TAG}-{vw}-{nm}-{kind}.png')
        for nm, hsh in (('home', '#/'), ('worlds', '#/worlds'), ('words', '#/words')):
            pg.goto(U + hsh); pg.wait_for_timeout(2200); pg.evaluate(SEEK, 30)
            pg.screenshot(path=f'{OUT}{TAG}-{vw}-{nm}.png')
        # info
        info = pg.evaluate("""()=>({imgs:[...document.querySelectorAll('#smoke img')].map(i=>[i.className,i.src.split('/').pop(),getComputedStyle(i).opacity]),
            anims:document.getAnimations().map(a=>a.animationName||a.transitionProperty).filter(Boolean)})""")
        print(vw, json.dumps(info)[:600])
        ctx.close()
    # 3-frame drift strip, 1280, Amethyst map (seeked t=0/20/40 s) + a real-time check that it moves
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page()
    pg.goto(U + '#/w/w4'); pg.wait_for_timeout(2500)
    paths = []
    for t in (0, 20, 40):
        pg.evaluate(SEEK, t); pg.wait_for_timeout(300)
        f = f'{OUT}{TAG}-drift-t{t}.png'; pg.screenshot(path=f); paths.append(f)
    strip(paths, f'{OUT}{TAG}-drift-strip.png', lambda i: (0, 0, i.width, i.height))
    # amplified diff so the drift is visible in review
    a, c = Image.open(paths[0]).convert('RGB'), Image.open(paths[2]).convert('RGB')
    d = ImageChops.difference(a, c).point(lambda v: min(255, v * 12)); d.save(f'{OUT}{TAG}-drift-diff-x12.png')
    print('mean abs diff t0 vs t40', sum(ImageChops.difference(a, c).convert('L').getdata()) / (1280 * 800))
    ctx.close()
    print('errors', errs)
