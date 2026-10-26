import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8833),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8833'
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    for nm,h,wt in (('level-w1-port','#/w/w1/port',2500),('level-w3-tri','#/w/w3/tri',2500),('words-w4-aqua','#/words/w4/aqua',4500),('words-w2-tele','#/words/w2/tele',4500),('worlds','#/worlds',2500),('map-w2','#/w/w2',2500)):
        pg.goto(B+'/play/?all=1'+h); pg.wait_for_timeout(wt); pg.screenshot(path=f'{OUT}v9-390-{nm}.png'); print('shot',nm)
    pg.goto(B+'/'); pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}v9-390-landing-hero.png')
    ctx.close()
    ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page()
    pg.goto(B+'/'); pg.wait_for_timeout(1200)
    y=pg.evaluate("(()=>{const e=[...document.querySelectorAll('section')].find(s=>/Collect the roots/.test(s.textContent));return e?e.getBoundingClientRect().top+scrollY:0})()")
    pg.evaluate(f"scrollTo(0,{y}+200)"); pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}v9-1280-landing-parade.png')
    print('errors',errs)
