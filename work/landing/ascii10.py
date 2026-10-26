import threading, http.server, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageOps
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
tag=sys.argv[1] if len(sys.argv)>1 else 'v10-hero-ascii'
url=sys.argv[2] if len(sys.argv)>2 else None
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
if not url:
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',8831),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
    url='http://127.0.0.1:8831/'
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,dpr,touch in (('1280',{'width':1280,'height':800},1,False),('390',{'width':390,'height':844},2,True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type in('error','warning') and errs.append(m.text))
        t0=time.time(); pg.goto(url)
        for ts in (2,10,25):
            dt=ts-(time.time()-t0)
            if dt>0: pg.wait_for_timeout(int(dt*1000))
            f=f'{OUT}{tag}-{name}-t{ts}.png'; pg.screenshot(path=f)
            # debug: amplified canvas-only view (structure check)
            d=pg.evaluate("(()=>{const c=document.querySelector('.hero-ascii');return c.toDataURL('image/png')})()")
            import base64,io
            im=Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGBA')
            a=im.split()[3].point(lambda v:min(255,v*12))
            bg=Image.new('RGB',im.size,(18,17,16)); fg=Image.new('RGB',im.size,(241,237,228))
            Image.composite(fg,bg,a).save(f'{OUT}{tag}-{name}-t{ts}-x12.png')
        print(name,'errors',errs)
        ctx.close()
