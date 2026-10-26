import os, threading, functools, http.server, json, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8797),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8797/'
d=json.load(open([ROOT+'/app/dist/'+f for f in os.listdir(ROOT+'/app/dist') if f.startswith('data.')][0]))
prog={l['id']:{'stars':2,'best':50} for l in d['levels']}
CHECK="""(()=>{const c=document.querySelector('.rcard-in');const r=c.getBoundingClientRect();const bad=[];
for(const e of c.querySelectorAll('.rcard-top,.rcard-art,.rcard-mean,.rcard-foot')){const b=e.getBoundingClientRect();if(b.bottom>r.bottom+0.5||b.right>r.right+0.5)bad.push(e.className)}
const h=document.querySelector('.rcard-name'); if(h.scrollWidth>h.parentElement.clientWidth+1) bad.push('title-overflow');
if(h.getBoundingClientRect().height>parseFloat(getComputedStyle(h).fontSize)*1.3) bad.push('title-wrap');
const m=document.querySelector('.rcard-mean');const lines=Math.round(m.getBoundingClientRect().height/parseFloat(getComputedStyle(m).lineHeight));
const cards=[...document.querySelectorAll('.pcard')];const xs=new Set(cards.map(e=>Math.round(e.offsetLeft)));const ys=new Set(cards.map(e=>Math.round(e.offsetTop)));
for(const p of document.querySelectorAll('.pc-part,.pc-mean')){const pb=p.getBoundingClientRect(),cb=p.parentElement.getBoundingClientRect();if(pb.right>cb.right+0.5||pb.left<cb.left-0.5)bad.push('pcard-overflow:'+p.textContent)}
return {bad,lines,n:cards.length,cols:xs.size,rows:ys.size,title:h.textContent,fs:getComputedStyle(h).fontSize,cw:c.getBoundingClientRect().width}})()"""
only=sys.argv[1:] 
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    for name,vp,touch in (('desktop',{'width':1280,'height':800},False),('phone',{'width':390,'height':844},True)):
        ctx=b.new_context(viewport=vp,device_scale_factor=2 if name=='phone' else 1,has_touch=touch); pg=ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(B); pg.evaluate(f"localStorage.setItem('rootcraft.v2', JSON.stringify({json.dumps(prog)}))"); pg.reload()
        issues=[]
        for l in d['levels']:
            pg.goto(B+'#/l/'+l['id']); print(l['id'],end=' ',flush=True); 
            try: pg.wait_for_selector('.rcard-in', timeout=8000, state='attached')
            except Exception as e:
                print('URL',pg.url,'ERRS',errs, pg.evaluate("document.body.innerHTML.slice(0,600)")); pg.screenshot(path='/tmp/fail.png'); raise
            pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(120)
            r=pg.evaluate(CHECK)
            if r['bad'] or r['lines']>2 or r['n']!=12 or r['cols']!=3 or r['rows']!=4: issues.append((l['id'],r))
        print(name,'issues:',json.dumps(issues), 'last:', r, 'errors:', errs)
        lid,shot=('trans','desktop') if name=='desktop' else ('duc','phone')
        pg.goto(B+'#/l/'+lid); pg.wait_for_timeout(900)
        pg.screenshot(path=f'{ROOT}/work/screens/v5-{lid}-{name}.png', full_page=(name=='phone'))
        print('fonts:', pg.evaluate("[...document.fonts].filter(f=>f.status=='loaded').map(f=>f.family+' '+f.style).join(', ')"))
        if name=='desktop':
            pg.goto(B); pg.wait_for_timeout(900); pg.screenshot(path=f'{ROOT}/work/screens/v5-map-desktop.png')
        ctx.close()
    b.close()
