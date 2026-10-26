import threading, http.server, sys, os
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
OUT=ROOT+'/work/screens/'
tag=sys.argv[1] if len(sys.argv)>1 else 'v6-landing'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8811),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8811/'
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,dpr,touch in (('1440',{'width':1440,'height':900},1,False),('390',{'width':390,'height':844},2,True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        pg.goto(B); pg.wait_for_timeout(700)
        pg.screenshot(path=f'{OUT}{tag}-{name}-hero-intro.png')
        pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}{tag}-{name}-hero-snap.png')
        pg.wait_for_timeout(2600); pg.screenshot(path=f'{OUT}{tag}-{name}-hero-b.png')
        H=pg.evaluate('document.documentElement.scrollHeight'); vh=vp['height']
        secs=pg.evaluate('''[...document.querySelectorAll('main > section')].map(s=>[s.className,s.offsetTop,s.offsetHeight])''')
        print(name,'H',H,secs)
        d={k:(t,h) for k,t,h in secs}
        shots=[('parade',d['collect'][0]+int(d['collect'][1]*0.25))]
        t,h=d['how']
        for f in (0.08,0.35,0.64,0.72,0.95): shots.append((f'how{int(f*100)}',t+int((h-vh)*f)))
        t,h=d['worlds']
        for f in (0.0,0.17,0.34,0.67,1.0): shots.append((f'worlds{int(f*100)}',t+int((h-vh)*f)))
        shots.append(('end',d['end'][0]))
        for nm,y in shots:
            # scroll gradually so scroll-driven state settles
            pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(1400)
            pg.screenshot(path=f'{OUT}{tag}-{name}-{nm}.png')
        pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}{tag}-{name}-full.png',full_page=True)
        print(name,'errors',errs)
        ctx.close()
