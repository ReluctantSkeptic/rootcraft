import threading, http.server
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT=ROOT+'/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8827),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,dpr in (('1440',{'width':1440,'height':900},1),('390',{'width':390,'height':844},2)):
        pg=b.new_page(viewport=vp,device_scale_factor=dpr); pg.goto('http://127.0.0.1:8827/'); pg.wait_for_timeout(2600)
        pg.screenshot(path=f'{OUT}v7-landing-{name}-hero.png')
        y=pg.evaluate("document.querySelector('.end').offsetTop"); pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}v7-landing-{name}-end.png'); pg.close()
        seq=['hero','tree100','split-b','guess','how95','parade','worlds0','worlds34','worlds67','worlds100','end']
        ims=[Image.open(f'{OUT}v7-landing-{name}-{s}.png').convert('RGB') for s in seq]
        W=ims[0].width; o=Image.new('RGB',(W,sum(i.height for i in ims)))
        y=0
        for i in ims: o.paste(i,(0,y)); y+=i.height
        if name=='390': o=o.resize((W//2,o.height//2))
        o.save(f'{OUT}v7-landing-{name}-full.png'); print(name,o.size)
