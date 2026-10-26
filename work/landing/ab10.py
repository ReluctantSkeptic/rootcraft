import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8833),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
F="new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++;performance.now()-t0<4000?requestAnimationFrame(f):r(n/4)};requestAnimationFrame(f)})"
with sync_playwright() as p:
    b=p.chromium.launch()
    for off in (False,True,False,True):
        ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page()
        if off: pg.add_init_script("document.addEventListener('DOMContentLoaded',()=>document.querySelector('.hero-ascii').remove())")
        pg.goto('http://127.0.0.1:8833/'); pg.wait_for_timeout(6000)
        print('trees off' if off else 'trees on ', round(pg.evaluate(F),1)); ctx.close()
