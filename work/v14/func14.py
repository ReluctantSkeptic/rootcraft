"""v14 flip checks: tap flips, drag does not, option cards pick, reduced motion crossfades."""
import threading, http.server, json
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT = ROOT + '/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT + '/app/dist', **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8845), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:8845'
FL = "(sel)=>[...document.querySelectorAll(sel)].filter(c=>c.classList.contains('is-flipped')).length"
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    t = pg.locator('.top-sec .row .tilt').nth(4); bb = t.bounding_box(); x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
    # drag across the parade
    pg.mouse.move(x, y); pg.mouse.down(); [pg.mouse.move(x - k * 12, y) for k in range(1, 9)]; pg.mouse.up(); pg.wait_for_timeout(700)
    res['landing_drag_flipped'] = pg.evaluate(FL, '.rcard')
    t = pg.locator('.top-sec .row .tilt').nth(5); bb = t.bounding_box(); x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
    pg.mouse.click(x, y); pg.wait_for_timeout(900)
    res['landing_tap_flipped'] = pg.evaluate(FL, '.rcard')
    pg.screenshot(path=OUT + 'v14-cards-1280-landing-flipped.png')
    pg.mouse.click(x, y); pg.wait_for_timeout(900)
    res['landing_tap_again'] = pg.evaluate(FL, '.rcard')
    # words: a swipe on the card must not flip it, a tap does
    pg.goto(B + '/play/?all=1#/words/w1/port'); pg.wait_for_timeout(2200)
    bb = pg.evaluate("()=>{let b=null,d=1e9;for(const t of document.querySelectorAll('.tilt-wm')){const r=t.getBoundingClientRect();const k=Math.abs(r.left+r.width/2-innerWidth/2);if(k<d){d=k;b={x:r.left,y:r.top,width:r.width,height:r.height}}}return b}"); x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down(); [pg.mouse.move(x - k * 20, y) for k in range(1, 10)]; pg.mouse.up(); pg.wait_for_timeout(1500)
    res['words_swipe_flipped'] = pg.evaluate(FL, '.rcard'); res['words_hash_after_swipe'] = pg.evaluate('location.hash')
    bb = pg.locator('.wpage.is-live .tilt-wm, .wpage .tilt-wm').first.bounding_box()
    pg.goto(B + '/play/?all=1#/words/w1/port'); pg.wait_for_timeout(2200)
    bb = pg.evaluate("()=>{let b=null,d=1e9;for(const t of document.querySelectorAll('.tilt-wm')){const r=t.getBoundingClientRect();const k=Math.abs(r.left+r.width/2-innerWidth/2);if(k<d){d=k;b={x:r.left,y:r.top,width:r.width,height:r.height}}}return b}"); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.wait_for_timeout(900)
    res['words_tap_flipped'] = pg.evaluate(FL, '.rcard'); res['words_hash_after_tap'] = pg.evaluate('location.hash')
    pg.screenshot(path=OUT + 'v14-cards-1280-words-back.png')
    ctx.close()
    # reduced motion: crossfade, no rotation
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, reduced_motion='reduce'); pg = ctx.new_page()
    pg.goto(B + '/play/?all=1#/w/w3/tri'); pg.wait_for_timeout(1500)
    bb = pg.locator('.tilt-main').bounding_box(); pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.wait_for_timeout(700)
    res['rm'] = pg.evaluate("()=>{const c=document.querySelector('.tilt-main .rcard');const f=c.querySelector('.rface'),k=c.querySelector('.rback');return {flipped:c.classList.contains('is-flipped'),faceOp:getComputedStyle(f).opacity,backOp:getComputedStyle(k).opacity,backTf:getComputedStyle(k).transform}}")
    pg.screenshot(path=OUT + 'v14-cards-390-back-reduced.png')
    ctx.close()
    print(json.dumps(res, indent=1)); print('errors', errs[:5])
