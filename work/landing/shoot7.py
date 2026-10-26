import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
tag=sys.argv[1] if len(sys.argv)>1 else 'v7-landing'
only=sys.argv[2] if len(sys.argv)>2 else ''
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8821),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for name,vp,dpr,touch in (('1440',{'width':1440,'height':900},1,False),('390',{'width':390,'height':844},2,True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type in('error','warning') and errs.append(m.text))
        pg.goto('http://127.0.0.1:8821/'); pg.wait_for_timeout(1500)
        vh=vp['height']
        secs=pg.evaluate('''[...document.querySelectorAll('main > section')].map(s=>[s.className.split(' ')[0],s.offsetTop,s.offsetHeight])''')
        d={k:(t,h) for k,t,h in secs}; print(name,secs)
        shots=[]
        t,h=d['tree-sec']
        for f in (0.05,0.3,0.55,1.0): shots.append((f'tree{int(f*100)}',t+int((h-vh)*f),1300))
        t,h=d['split']; shots.append(('split-a',t+int(h/2-vh/2),2000)); shots.append(('split-b',t+int(h/2-vh/2),1600))
        t,h=d['guess']; shots.append(('guess',t+int(h/2-vh/2),3600))
        t,h=d['how']
        for f in (0.35,0.52,0.6,0.66,0.74,0.95): shots.append((f'how{int(f*100)}',t+int((h-vh)*f),900))
        t,h=d['collect']; shots.append(('parade',t+int(h/2-vh/2),1600))
        t,h=d['worlds']
        for f in (0.0,0.34,0.67,1.0): shots.append((f'worlds{int(f*100)}',t+int((h-vh)*f),1200))
        for nm,y,wt in shots:
            if only and not nm.startswith(only): continue
            pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(wt)
            pg.screenshot(path=f'{OUT}{tag}-{name}-{nm}.png')
        if not only:
            H=pg.evaluate('document.documentElement.scrollHeight')
            for yy in range(0,H,500): pg.evaluate(f'scrollTo(0,{yy})'); pg.wait_for_timeout(40)
            pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(500)
            pg.screenshot(path=f'{OUT}{tag}-{name}-full.png',full_page=True)
        print(name,'errors',errs)
        ctx.close()
