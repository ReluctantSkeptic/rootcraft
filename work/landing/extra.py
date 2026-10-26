import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8813),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    # hover tilt on a parade card
    pg=b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8813/'); pg.wait_for_timeout(800)
    y=pg.evaluate("document.querySelector('.marquee').offsetTop-200"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(1500)
    pg.mouse.move(700,450); pg.wait_for_timeout(200)
    for x,yy in ((640,330),(760,560)):
        pg.mouse.move(x,yy,steps=8); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT+'v6-landing-1440-tilt-hover.png')
    # fps sample during marquee + worlds scroll
    fps=pg.evaluate("""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2)}; requestAnimationFrame(f)})""")
    print('fps(headless, marquee):',fps, errs)
    # reduced motion
    for name,vp,dpr in (('1440',{'width':1440,'height':900},1),('390',{'width':390,'height':844},2)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,reduced_motion='reduce'); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8813/'); pg.wait_for_timeout(1500)
        H=pg.evaluate('document.documentElement.scrollHeight')
        for yy in range(0,H,800): pg.evaluate(f'scrollTo(0,{yy})'); pg.wait_for_timeout(60)
        pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}v6-landing-{name}-reduced-full.png',full_page=True); print(name,'reduced H',H,errs); ctx.close()
