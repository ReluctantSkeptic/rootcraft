import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8816),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    for rm in ('reduce','no-preference'):
        ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion=rm); pg=ctx.new_page(); pg.goto('http://127.0.0.1:8816/'); pg.wait_for_timeout(1500)
        print(rm, pg.evaluate("""[document.querySelector('.w').outerHTML.slice(0,300), [...document.querySelectorAll('.wname')].map(n=>[n.textContent,n.scrollWidth,n.clientWidth,n.style.fontSize,getComputedStyle(n).left, n.closest('.wpanel').clientWidth])]"""))
