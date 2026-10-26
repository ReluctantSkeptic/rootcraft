import threading, http.server, sys, time
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
tag=sys.argv[1] if len(sys.argv)>1 else 'v8'
only=sys.argv[2] if len(sys.argv)>2 else ''
BASE=sys.argv[3] if len(sys.argv)>3 else None
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
if not BASE:
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',8831),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
    BASE='http://127.0.0.1:8831'
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,dpr,touch in (('1280',{'width':1280,'height':800},1,False),('390',{'width':390,'height':844},2,True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,has_touch=touch,is_mobile=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type in('error','warning') and errs.append(m.text))
        def shot(nm):
            if only and not nm.startswith(only): return
            pg.screenshot(path=f'{OUT}{tag}-{name}-{nm}.png'); print('shot',name,nm)
        def go(h, wait):
            pg.goto(BASE+'/play/'+h); pg.wait_for_timeout(wait)
        if not only or only.startswith('menu'):
            go('#/', 2600); shot('menu')
        for nm,h in (('ink-port','#/words/w1/port'),('amethyst-terr','#/words/w4/terr')):
            if only and not nm.startswith(only.split('-')[0]) and not only.startswith(nm): continue
            pg.goto(BASE+'/play/'); pg.wait_for_timeout(400)
            pg.evaluate(f"location.hash='{h}'"); pg.wait_for_timeout(1050 if name=='1280' else 1150); shot(nm+'-mid')
            pg.wait_for_timeout(3200); shot(nm+'-full')
        if not only or only.startswith('index'):
            go('#/words/w1/port', 1500)
            pg.click('.wm-find'); pg.wait_for_timeout(700); shot('index')
            pg.fill('.wx-search input','port'); pg.wait_for_timeout(300); shot('index-search')
            # jump to a word from the index
            pg.fill('.wx-search input','sub'); pg.wait_for_timeout(200)
            pg.click('.wx-words .wx-row:not([hidden]) >> text=subterranean'); pg.wait_for_timeout(1400); shot('jump-mid')
            pg.wait_for_timeout(2600); shot('jump-full')
            pg.click('.wm-world'); pg.wait_for_timeout(800); shot('roots')
        print(name,'errors:',errs, 'url', pg.url)
        ctx.close()
    b.close()
