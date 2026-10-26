import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8824),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
FPS="""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; if(performance.now()-t0<2500) requestAnimationFrame(f); else r(n/2.5)}; requestAnimationFrame(f)})"""
flags=sys.argv[1]=='gl'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] if flags else [])
    for css in ('', '.shelf{-webkit-mask-image:none!important;mask-image:none!important}', '.shelf .holo,.shelf .sheen,.shelf .glare{display:none!important}', '.shelf{-webkit-mask-image:none!important;mask-image:none!important;perspective:none!important}.row{transform-style:flat!important}'):
        pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto('http://127.0.0.1:8824/'); pg.wait_for_timeout(800)
        if css: pg.add_style_tag(content=css)
        y=pg.evaluate("document.querySelector('.collect').offsetTop+300"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(800)
        print(flags, css[:40] or 'base', pg.evaluate(FPS)); pg.close()
    pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto('http://127.0.0.1:8824/'); pg.wait_for_timeout(800)
    print('hero', pg.evaluate(FPS))
