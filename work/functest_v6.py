import threading, http.server, json
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/dist',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8798),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8798/play/'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B); pg.evaluate("localStorage.clear(); localStorage.setItem('rootcraft.v2', JSON.stringify({re:{stars:3,best:80}, in:{stars:2,best:50}, bogus:{stars:1}}))"); pg.reload(); pg.wait_for_timeout(600)
    print('migrated', pg.evaluate("localStorage.getItem('rootcraft.v6')"))
    print('orbs', pg.evaluate("[...document.querySelectorAll('.orb')].map(o=>o.className)"))
    pg.goto(B+'#/w/w2'); pg.wait_for_timeout(300); print('w2 locked ->', pg.evaluate('location.hash'))
    pg.goto(B+'#/l/in'); pg.wait_for_timeout(400); print('legacy ->', pg.evaluate('location.hash'), pg.evaluate("!!document.querySelector('.hand')"))
    pg.goto(B+'#/w/w1/port'); pg.wait_for_timeout(300); print('locked level ->', pg.evaluate('location.hash'))
    # perfect run on a two-half level with all=1
    pg.goto(B+'?all=1#/w/w1/dict'); pg.wait_for_timeout(700)
    for h in range(2):
        pg.evaluate("S.halves[S.h].order.forEach((c,k)=>c.real&&document.querySelector('.pcard[data-k=\"'+k+'\"]').click())"); pg.click('.done'); pg.wait_for_timeout(700)
    print('dict perfect:', pg.evaluate("[document.querySelectorAll('.bs .star.on').length, document.querySelector('.score').dataset.to]"))
    # finish w1 last level -> w2 unlock
    pg.goto(B+'?all=1#/w/w1/aud'); pg.wait_for_timeout(600)
    pg.evaluate("S.halves[S.h].order.forEach((c,k)=>c.real&&document.querySelector('.pcard[data-k=\"'+k+'\"]').click())"); pg.click('.done'); pg.wait_for_timeout(500)
    print('aud primary:', pg.evaluate("document.querySelector('.dock .btn-acc').textContent.trim()"))
    pg.goto(B); pg.wait_for_timeout(500)
    print('orbs no-all', pg.evaluate("[...document.querySelectorAll('.orb')].map(o=>o.className.replace('orb ',''))"))
    print('errors', errs)
    b.close()
