"""v14 screens: python3 work/v14/shoot14.py [tag]  -> work/screens/<tag>-*.png"""
import threading, http.server, sys, json
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT = ROOT + '/work/screens/'
TAG = sys.argv[1] if len(sys.argv) > 1 else 'v14-cards'
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT + '/app/dist', **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8844), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:8844'; U = B + '/play/?all=1'
SEEK = "(t)=>{for(const a of document.getAnimations()){if(a.animationName&&a.animationName.startsWith('smk')){a.pause();a.currentTime=t*1000}}}"
def want(k): return not ONLY or k in ONLY
with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    for vw, vh, dpr, mob in ((390, 844, 2, True), (1280, 800, 1, False)):
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr, is_mobile=mob, has_touch=mob, reduced_motion='no-preference')
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        if want('level'):
            for wid, lid, nm in (('w1', 'port', 'ink'), ('w4', 'aqua', 'amethyst'), ('w2', 'tele', 'gold')):
                pg.goto(U + f'#/w/{wid}/{lid}'); pg.wait_for_timeout(2000); pg.evaluate(SEEK, 30)
                pg.screenshot(path=f'{OUT}{TAG}-{vw}-level-{nm}.png')
        if want('flip'):
            pg.goto(U + '#/w/w1/port'); pg.wait_for_timeout(1500)
            bb = pg.locator('.tilt-main').bounding_box()
            x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
            if mob: pg.touchscreen.tap(x, y)
            else: pg.mouse.click(x, y)
            pg.wait_for_timeout(250); pg.screenshot(path=f'{OUT}{TAG}-{vw}-flip-mid.png')
            pg.wait_for_timeout(900); pg.evaluate(SEEK, 30)
            st = pg.evaluate("()=>({flipped:document.querySelector('.tilt-main .rcard').classList.contains('is-flipped')})")
            print(vw, 'flip', st)
            pg.screenshot(path=f'{OUT}{TAG}-{vw}-back.png')
            # option cards must still pick, not flip
            pg.locator('.pcard').first.click(); pg.wait_for_timeout(300)
            print(vw, 'pcard sel', pg.evaluate("()=>[document.querySelector('.pcard').classList.contains('is-sel'), !!document.querySelector('.pcard .rback')]"))
        if want('words'):
            pg.goto(U + '#/words/w1/spect'); pg.wait_for_timeout(2600); pg.evaluate(SEEK, 30)
            pg.screenshot(path=f'{OUT}{TAG}-{vw}-words.png')
        if want('result'):
            pg.goto(U + '#/w/w4/ped'); pg.wait_for_timeout(1200)
            pg.evaluate("()=>{document.querySelectorAll('.pcard').forEach((c,i)=>{if(i<3)c.click()})}"); pg.wait_for_timeout(200)
            pg.click('.done'); pg.wait_for_timeout(400)
            if pg.locator('.done:not([disabled])').count():
                pg.evaluate("()=>{document.querySelectorAll('.pcard').forEach((c,i)=>{if(i<3)c.click()})}"); pg.wait_for_timeout(200); pg.click('.done')
            pg.wait_for_timeout(3500); pg.screenshot(path=f'{OUT}{TAG}-{vw}-result.png', full_page=False)
        if want('map'):
            pg.goto(U + '#/w/w2'); pg.wait_for_timeout(1800); pg.screenshot(path=f'{OUT}{TAG}-{vw}-map.png')
            pg.goto(U + '#/worlds'); pg.wait_for_timeout(1800); pg.screenshot(path=f'{OUT}{TAG}-{vw}-worlds.png')
        if want('home'):
            pg.goto(U + '#/'); pg.wait_for_timeout(2200); pg.evaluate(SEEK, 30); pg.screenshot(path=f'{OUT}{TAG}-{vw}-home.png')
        if want('picked'):
            pg.goto(U + '#/w/w1/port'); pg.wait_for_timeout(1500)
            pg.evaluate("()=>{const c=[...document.querySelectorAll('.pcard')];c[0].click();c[2].click();c[4].click()}"); pg.wait_for_timeout(600); pg.evaluate(SEEK, 30)
            pg.screenshot(path=f'{OUT}{TAG}-{vw}-level-picked.png')
        if want('landing'):
            pg.goto(B + '/'); pg.wait_for_timeout(2600)
            pg.screenshot(path=f'{OUT}{TAG}-{vw}-landing-parade.png')
            for sec, fr, nm in (('.how', .35, 'how'), ('.how', .62, 'how-reveal'), ('.worlds', .35, 'worlds')):
                if pg.locator(sec).count():
                    pg.evaluate(f"()=>{{const e=document.querySelector('{sec}');window.scrollTo(0,e.offsetTop+e.offsetHeight*{fr})}}"); pg.wait_for_timeout(1800)
                    pg.screenshot(path=f'{OUT}{TAG}-{vw}-landing-{nm}.png')
        if want('fake'):
            pg.goto(B + '/'); pg.wait_for_timeout(2000)
            for fr in (.505,):
                pg.evaluate(f"()=>{{const e=document.querySelector('.how');window.scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*{fr})}}"); pg.wait_for_timeout(1600)
                print(vw, 'fake', pg.evaluate("()=>[...document.querySelectorAll('.pcard.fake')].map(c=>c.className)"))
                pg.screenshot(path=f'{OUT}{TAG}-{vw}-landing-fake.png')
        ctx.close()
    print('errors', errs[:8])
