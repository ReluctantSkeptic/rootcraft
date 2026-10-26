import threading, http.server, sys, io, base64
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8832),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
U='http://127.0.0.1:8832/'
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(U); pg.wait_for_timeout(20000)
    # sway smoothness: 10 canvas frames, 100ms apart, mean abs alpha diff between consecutive frames
    fr=[]
    for i in range(10):
        d=pg.evaluate("document.querySelector('.hero-ascii').toDataURL()")
        fr.append(Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).split()[3]); pg.wait_for_timeout(100)
    diffs=[round(ImageStat.Stat(ImageChops.difference(fr[i],fr[i+1])).mean[0],4) for i in range(9)]
    print('frame diffs',diffs)
    strip=Image.new('L',(260*5,260*2))
    for i in range(10): strip.paste(fr[i].crop((40,300,300,560)).point(lambda v:min(255,v*12)),((i%5)*260,(i//5)*260))
    strip.save(OUT+'v10-hero-ascii-sway-seq-1280.png')
    fps=pg.evaluate("new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++;performance.now()-t0<3000?requestAnimationFrame(f):r(n/3)};requestAnimationFrame(f)})")
    print('page rAF fps at top', round(fps,1))
    # time spent in the trees' draw per frame
    ms=pg.evaluate("""new Promise(r=>{const c=document.querySelector('.hero-ascii').getContext('2d');const o=c.clearRect.bind(c);let tot=0,n=0;const di=c.drawImage.bind(c);let t=0;c.clearRect=(...a)=>{t=performance.now();o(...a)};const og=c.setTransform.bind(c);
      const s=CanvasRenderingContext2D.prototype; let start=0; c.setTransform=(...a)=>{if(start){tot+=performance.now()-start;n++}start=performance.now();og(...a)};setTimeout(()=>r([tot/Math.max(1,n),n]),2000)})""")
    print('approx frame interval incl. draw (ms), frames in 2s:', ms)
    # second section: the forge
    y=pg.evaluate("document.querySelector('.hero').offsetTop"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'v10-1280-forge-intro.png'); pg.wait_for_timeout(5500); pg.screenshot(path=OUT+'v10-1280-forge.png')
    print('errors',errs); ctx.close()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce'); pg=ctx.new_page()
    pg.goto(U); pg.wait_for_timeout(2500); pg.screenshot(path=OUT+'v10-hero-ascii-390-reduced.png')
    ctx.close()
