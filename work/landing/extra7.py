import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8823),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
FPS="""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2)}; requestAnimationFrame(f)})"""
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8823/'); pg.wait_for_timeout(1000)
    print('webgl2', pg.evaluate("!!document.createElement('canvas').getContext('webgl2')"), 'crumple canvas', pg.evaluate("!!document.querySelector('.crumple')"))
    y=pg.evaluate("document.querySelector('.collect').offsetTop+300"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(1200)
    print('fps parade idle', pg.evaluate(FPS))
    # drag row 1 to scrub
    r=pg.evaluate("(()=>{const b=document.querySelector('.row').getBoundingClientRect();return [b.left,b.top,b.width,b.height]})()")
    x0=700; yy=r[1]+r[3]/2
    pg.mouse.move(x0,yy); pg.mouse.down(); pg.mouse.move(x0+300,yy,steps=12); pg.mouse.up(); pg.wait_for_timeout(250)
    pg.screenshot(path=OUT+'v7-landing-1440-parade-drag.png')
    pg.mouse.move(720,yy,steps=4); pg.wait_for_timeout(900); pg.screenshot(path=OUT+'v7-landing-1440-parade-hover.png')
    # fps while scrubbing through tree and how
    for sel,frac in ():
        t,h=pg.evaluate(f"(()=>{{const s=document.querySelector('{sel}');return [s.offsetTop,s.offsetHeight]}})()")
        pg.evaluate(f"scrollTo(0,{t+int((h-900)*frac)})"); pg.wait_for_timeout(400)
        fps=pg.evaluate("""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; scrollBy(0,3); if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2)}; requestAnimationFrame(f)})""")
        print('fps scrubbing',sel,fps)
    print('errors',errs)
    for name,vp,dpr in (('1440',{'width':1440,'height':900},1),('390',{'width':390,'height':844},2)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,reduced_motion='reduce'); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8823/'); pg.wait_for_timeout(1500)
        H=pg.evaluate('document.documentElement.scrollHeight')
        for yy in range(0,H,700): pg.evaluate(f'scrollTo(0,{yy})'); pg.wait_for_timeout(80)
        pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(500)
        pg.screenshot(path=f'{OUT}v7-landing-{name}-reduced-full.png',full_page=True); print(name,'reduced H',H,errs); ctx.close()
