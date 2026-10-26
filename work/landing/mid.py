import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8812),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,dpr in (('1440',{'width':1440,'height':900},1),('390',{'width':390,'height':844},2)):
        pg=b.new_page(viewport=vp,device_scale_factor=dpr); pg.goto('http://127.0.0.1:8812/'); pg.wait_for_timeout(2000)
        for n in range(4):
            pg.click('.w'); pg.wait_for_timeout(330); pg.screenshot(path=f'{OUT}v6-landing-{name}-hero-mid{n}.png'); pg.wait_for_timeout(900)
        pg.screenshot(path=f'{OUT}v6-landing-{name}-hero-settled.png')
