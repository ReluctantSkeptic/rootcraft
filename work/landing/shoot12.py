import threading, http.server, sys
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
tag=sys.argv[1] if len(sys.argv)>1 else 'v12'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8832),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for name,vp,dpr,touch in (('1280',{'width':1280,'height':800},1,False),('390',{'width':390,'height':844},2,True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=dpr,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type in('error','warning') and errs.append(m.text))
        pg.goto('http://127.0.0.1:8832/'); pg.wait_for_timeout(3000)
        print(name,'gl:',pg.evaluate("document.documentElement.className"))
        vh=vp['height']
        d={k:(t,h) for k,t,h in pg.evaluate('''[...document.querySelectorAll('main > section')].map(s=>[s.className.split(' ')[0],s.offsetTop,s.offsetHeight])''')}
        shots=[('top',0,1500)]
        t,h=d['hero']; shots.append(('forge',t,2500))
        t,h=d['tree-sec']; shots.append(('tree',t+int((h-vh)*.6),1800))
        t,h=d['split']; shots.append(('pieces',t+int(h/2-vh/2),1800))
        t,h=d['wintro']; shots.append(('intro',t+int(h/2-vh/2),1800))
        t,h=d['worlds']
        for f in (0.0,0.34,0.67,1.0): shots.append((f'worlds{int(f*100)}',t+int((h-vh)*f),1300))
        t,h=d['end']; shots.append(('end',t,1800))
        for nm,y,wt in shots:
            pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(wt)
            pg.screenshot(path=f'{OUT}{tag}-{name}-{nm}.png')
        # motion strip: top section, field time advanced in steps (each step = ~40 s of real time at 0.06/s)
        pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(1200)
        fr=[]
        for i in range(4):
            pg.evaluate(f'window.__rcbg.t = 37 + {i}*2.4; window.__rcbg.still()'); pg.wait_for_timeout(120)
            fp=f'/tmp/strip{name}{i}.png'; pg.screenshot(path=fp); fr.append(Image.open(fp))
        if name=='1280':
            w,hh=fr[0].size; s=Image.new('RGB',(w*2,hh*2))
            for i,im in enumerate(fr): s.paste(im,((i%2)*w,(i//2)*hh))
            s.resize((w,hh)).save(f'{OUT}{tag}-bg-motion-strip.png')
        print(name,'errors',errs)
        ctx.close()
