import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8832),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8832/play/'
h=lambda pg: pg.evaluate('location.hash')
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B+'#/words'); pg.wait_for_timeout(1200); print('start', h(pg))
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(900); print('key right', h(pg))
    pg.keyboard.press('End'); pg.wait_for_timeout(900); print('End', h(pg))
    pg.keyboard.press('Home'); pg.wait_for_timeout(900); print('Home', h(pg))
    pg.keyboard.press('PageDown'); pg.wait_for_timeout(900); print('PgDn', h(pg))
    # mouse drag left
    pg.mouse.move(900,400); pg.mouse.down(); 
    for x in range(900,500,-40): pg.mouse.move(x,400); pg.wait_for_timeout(16)
    pg.mouse.up(); pg.wait_for_timeout(1000); print('drag', h(pg))
    # trackpad wheel gesture
    for i in range(20): pg.mouse.wheel(30,0); pg.wait_for_timeout(16)
    pg.wait_for_timeout(1000); print('wheel', h(pg))
    pg.mouse.wheel(0,100); pg.wait_for_timeout(900); print('mousewheel', h(pg))
    # scrubber click on Amethyst
    box=pg.locator('.ws-seg').nth(3).bounding_box(); pg.mouse.click(box['x']+box['width']*.5, box['y']+1); pg.wait_for_timeout(1200); print('scrub', h(pg))
    pg.click('.wm-next'); pg.wait_for_timeout(900); print('next btn', h(pg))
    # deep links
    pg.goto(B+'#/words?w=astronaut'); pg.wait_for_timeout(2500); print('?w=astronaut', h(pg), pg.locator('.tw.hl').count(), pg.locator('.tw.hl .tw-w').inner_text())
    pg.goto(B+'#/words/w3/tri'); pg.wait_for_timeout(1500); print('w3/tri', h(pg), pg.locator('.wm-world .wn').inner_text())
    print('home links', pg.evaluate("[...document.querySelectorAll('a')].map(a=>a.getAttribute('href'))"))
    pg.goto(B+'#/w/w1'); pg.wait_for_timeout(800); print('w1 map', h(pg), pg.locator('.map').count())
    pg.goto(B+'#/w/w1/port'); pg.wait_for_timeout(800); print('w1 level', pg.locator('.level-screen').count())
    pg.goto(B+'#/l/port'); pg.wait_for_timeout(800); print('legacy', h(pg))
    pg.goto(B+'#/worlds'); pg.wait_for_timeout(800); print('worlds', pg.locator('.journey').count())
    pg.goto(B); pg.wait_for_timeout(800); print('menu', pg.locator('.mode').count())
    pg.click('.mode-words'); pg.wait_for_timeout(1500); print('menu->words', h(pg))
    pg.go_back(); pg.wait_for_timeout(800); print('back', h(pg), pg.locator('.mode').count(), pg.evaluate("document.documentElement.className"))
    print('errors', errs); ctx.close()
    # reduced motion + touch phone swipe
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True,reduced_motion='reduce'); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B+'#/words/w2/astro'); pg.wait_for_timeout(500); pg.screenshot(path=OUT+'v8-390-reduced-motion.png')
    print('RM words on', pg.locator('.wpage.is-live .tw.on').count(), '/', pg.locator('.wpage.is-live .tw').count())
    # touch swipe via CDP
    cdp=ctx.new_cdp_session(pg)
    def swipe(x0,x1,y=500):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y}]})
        for k in range(1,9): cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+(x1-x0)*k/8,'y':y}]}); pg.wait_for_timeout(16)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    swipe(330,80); pg.wait_for_timeout(700); print('touch swipe', h(pg))
    print('errors', errs)
    b.close()
