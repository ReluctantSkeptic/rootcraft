import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8817),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce'); pg=ctx.new_page(); pg.goto('http://127.0.0.1:8817/'); pg.wait_for_timeout(1500)
    pg.screenshot(path='/tmp/rmhero.png')
    print(pg.evaluate("[...document.querySelectorAll('.root, .root .ch')].map(e=>{const s=getComputedStyle(e);return [e.textContent,e.getBoundingClientRect().width,s.opacity,s.transform,s.animationName,s.color]})"))
    pg.set_viewport_size({'width':844,'height':390}); pg.wait_for_timeout(300); pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(300)
    print(pg.evaluate("[...document.querySelectorAll('.wname')].map(n=>[n.textContent,n.scrollWidth,n.style.fontSize])"))
