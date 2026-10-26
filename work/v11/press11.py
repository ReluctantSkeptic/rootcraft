# deterministic press-sparkle frames: virtual clock frozen at t0 + ms
import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
TAG=sys.argv[1] if len(sys.argv)>1 else 'v11'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8842),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
U='http://127.0.0.1:8842'
INIT="""(()=>{const rn=performance.now.bind(performance);let fz=null;performance.now=()=>fz??rn();window.__freeze=t=>{fz=t};
const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(performance.now()));})()"""
def shot(pg, sel_js, fx, fy, name, ms_list, touch):
    r=pg.evaluate(sel_js)
    for ms in ms_list:
        pg.evaluate('window.__freeze(null)'); pg.wait_for_timeout(900)
        t0=pg.evaluate('performance.now()')
        x,y=r[0]+r[2]*fx, r[1]+r[3]*fy
        if touch: pg.touchscreen.tap(x,y)
        else: pg.mouse.move(x,y); pg.mouse.down()
        pg.evaluate(f'window.__freeze({t0}+{ms})'); pg.wait_for_timeout(250)
        pg.screenshot(path=f'{OUT}{TAG}-sparkle-{name}-{ms}ms.png', clip={'x':max(0,r[0]-24),'y':max(0,r[1]-24),'width':r[2]+48,'height':r[3]+48})
        if not touch: pg.mouse.up()
CENTER="(()=>{const ts=[...document.querySelectorAll('.row .tilt')];let best=null,bd=1e9;for(const t of ts){const b=t.getBoundingClientRect();const d=Math.abs(b.left+b.width/2-innerWidth/2)+b.top*.01;if(d<bd){bd=d;best=b}}return [best.left,best.top,best.width,best.height]})()"
MAIN="(()=>{const b=document.querySelector('.tilt-main, .tilt-wm').getBoundingClientRect();return [b.left,b.top,b.width,b.height]})()"
with sync_playwright() as p:
    b=p.chromium.launch()
    for W,H_,touch in ((390,844,True),(1280,800,False)):
        ctx=b.new_context(viewport={'width':W,'height':H_},device_scale_factor=2,is_mobile=touch,has_touch=touch); ctx.add_init_script(INIT)
        pg=ctx.new_page()
        pg.goto(U+'/play/?all=1#/w/w1/re'); pg.wait_for_timeout(1800)
        shot(pg, MAIN, .62, .42, f'{W}-game', (120,260,450), touch)
        pg.goto(U+'/'); pg.wait_for_timeout(2200)
        shot(pg, CENTER, .45, .4, f'{W}-landing', (260,), touch)
        ctx.close()
    b.close()
