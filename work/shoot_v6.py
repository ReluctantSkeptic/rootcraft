import os, threading, http.server, json, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
OUT=ROOT+'/work/screens/v6-engine-'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8799),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8799/play/'
LID=sys.argv[1] if len(sys.argv)>1 else 'port'
def pick(pg, n_real, n_fake):
    # choose cards by reading data from the hidden state: use word text vs data
    return pg.evaluate(f"""(()=>{{const H=S.halves[S.h];let r={n_real},f={n_fake};
      H.order.forEach((c,k)=>{{ if((c.real&&r-->0)||(!c.real&&f-->0)) document.querySelector('.pcard[data-k="'+k+'"]').click(); }}); return H.order.map(c=>c.p+(c.real?'+':'x'))}})()""")
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,touch in (('desktop',{'width':1280,'height':800},False),('phone',{'width':390,'height':844},True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=2 if name=='phone' else 1,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        pg.goto(B+'?all=1#/'); pg.wait_for_timeout(1400); pg.screenshot(path=OUT+f'worlds-{name}.png')
        pg.goto(B+'?all=1#/w/w1'); pg.wait_for_timeout(900); pg.screenshot(path=OUT+f'map-{name}.png')
        pg.goto(B+f'?all=1#/w/w1/{LID}'); pg.wait_for_timeout(1200)
        print(name,'start',pick(pg,3,1)); pg.wait_for_timeout(400)
        pg.screenshot(path=OUT+f'{LID}-start-{name}.png')
        pg.click('.done'); pg.wait_for_timeout(260); pg.screenshot(path=OUT+f'{LID}-turn-{name}.png')
        pg.wait_for_timeout(1300)
        if pg.evaluate('S.halves.length')>1:
            print(name,'end',pick(pg,4,0)); pg.wait_for_timeout(300); pg.screenshot(path=OUT+f'{LID}-end-{name}.png')
            pg.click('.done')
        pg.wait_for_timeout(2600); pg.screenshot(path=OUT+f'{LID}-result-{name}.png')
        pg.screenshot(path=OUT+f'{LID}-result-full-{name}.png', full_page=True)
        print(name,'errors',errs, 'scrollH', pg.evaluate('document.documentElement.scrollHeight'))
        ctx.close()
    b.close()
