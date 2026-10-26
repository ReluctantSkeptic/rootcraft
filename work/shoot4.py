import os, threading, functools, http.server, json
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT+'/app/dist'); H.log_message=lambda *a: None
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8797),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8797/'
d=json.load(open([ROOT+'/app/dist/'+f for f in os.listdir(ROOT+'/app/dist') if f.startswith('data.')][0]))
prog={l['id']:{'stars':2,'best':50} for l in d['levels']}
CHECK="""(()=>{const c=document.querySelector('.rcard-in');const r=c.getBoundingClientRect();const bad=[];
for(const e of c.querySelectorAll('.rcard-top,.rcard-art,.rcard-mean,.rcard-forms,.rcard-foot')){const b=e.getBoundingClientRect();if(b.bottom>r.bottom+0.5||b.right>r.right+0.5)bad.push(e.className)}
const m=document.querySelector('.rcard-mean');const lines=Math.round(m.getBoundingClientRect().height/parseFloat(getComputedStyle(m).lineHeight));
return {bad,lines,font:getComputedStyle(m).fontStyle, nameW:getComputedStyle(document.querySelector('.rcard-name')).fontWeight}})()"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    for name,vp,touch in (('desktop',{'width':1280,'height':800},False),('phone',{'width':390,'height':844},True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=2 if name=='phone' else 1,has_touch=touch); pg=ctx.new_page()
        pg.goto(B); pg.evaluate(f"localStorage.setItem('rootcraft.v2', JSON.stringify({json.dumps(prog)}))"); pg.reload()
        issues=[]
        for l in d['levels']:
            pg.goto(B+'#/l/'+l['id']); print(l['id'],end=' ',flush=True); pg.wait_for_selector('.rcard-in', timeout=5000); pg.wait_for_timeout(150); pg.evaluate('document.fonts.ready')
            r=pg.evaluate(CHECK)
            if r['bad'] or r['lines']>2: issues.append((l['id'],r))
        print(name,'card issues:',issues, r)
        for lid in ('trans','duc'):
            pg.goto(B+'#/l/'+lid); pg.wait_for_timeout(700)
            pg.screenshot(path=f'{ROOT}/work/screens/v3-{lid}-{name}.png', full_page=(name=='phone'))
        pg.goto(B); pg.wait_for_timeout(700); pg.screenshot(path=f'{ROOT}/work/screens/v3-map-{name}.png')
        ctx.close()
    b.close()
