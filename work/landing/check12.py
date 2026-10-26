import threading, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8833),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
FPS='''new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r(n/3)};requestAnimationFrame(f)})'''
with sync_playwright() as p:
    # 1) no flags: does WebGL exist? fallback check + fps
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':800}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8833/'); pg.wait_for_timeout(2500)
    print('noflags class:',pg.evaluate('document.documentElement.className'),'fps',pg.evaluate(FPS),errs)
    pg.screenshot(path=OUT+'v12-1280-fallback-check.png'); b.close()
    # 2) reduced motion with GL
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':1280,'height':800},reduced_motion='reduce'); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8833/'); pg.wait_for_timeout(2000)
    a=pg.screenshot(); pg.wait_for_timeout(2000); bb=pg.screenshot()
    print('RM class',pg.evaluate('document.documentElement.className'),'still identical:',a==bb,errs)
    ctx.close()
    # 3) GL: bg cost — time per draw via gl.finish at quarter res
    ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page(); pg.goto('http://127.0.0.1:8833/'); pg.wait_for_timeout(2000)
    print('canvas size',pg.evaluate("(c=>c.width+'x'+c.height)(document.querySelector('.bg-ink'))"))
    print('ms/draw (swiftshader CPU):',pg.evaluate('''(()=>{const c=document.querySelector('.bg-ink'),g=c.getContext('webgl');let t=performance.now();for(let i=0;i<20;i++){window.__rcbg.still();}g.finish();const x=new Uint8Array(4);g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,x);return ((performance.now()-t)/20).toFixed(2)})()'''))
    a=pg.screenshot(); pg.wait_for_timeout(3000); bb=pg.screenshot(); print('animating:',a!=bb)
    pg.evaluate('document.dispatchEvent(new Event("visibilitychange"))')
    ctx.close(); b.close()
