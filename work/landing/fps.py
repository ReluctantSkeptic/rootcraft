import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8814),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
F="""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2)}; requestAnimationFrame(f)})"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-gpu-rasterization','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto('http://127.0.0.1:8814/'); pg.wait_for_timeout(800)
    print('hero',pg.evaluate(F))
    y=pg.evaluate("document.querySelector('.marquee').offsetTop-200"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(800)
    print('marquee',pg.evaluate(F))
    y=pg.evaluate("document.querySelector('.worlds').offsetTop+300"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(800)
    print('worlds',pg.evaluate(F))
    y=pg.evaluate("document.querySelector('.end').offsetTop"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(800)
    print('end(idle)',pg.evaluate(F))
