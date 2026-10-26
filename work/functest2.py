import os, threading, functools, http.server, json
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT+'/app/dist'); H.log_message=lambda *a: None
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8797),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8797/'
d=json.load(open([ROOT+'/app/dist/'+f for f in os.listdir(ROOT+'/app/dist') if f.startswith('data.')][0]))
L=d['levels']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    for rm in ('no-preference','reduce'):
        ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion=rm,has_touch=True); pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto(B); pg.evaluate('localStorage.clear()'); pg.goto(B+'#/l/in'); pg.wait_for_timeout(500)
        print(rm,'locked redirect ->', pg.evaluate('location.hash'), pg.locator('.node.is-current').get_attribute('data-id'))
        pg.goto(B+'#/l/re'); pg.wait_for_timeout(600)
        reals={c['p'] for c in L[0]['cards'] if c['real']}
        for el in pg.locator('.pcard').all():
            if el.locator('.pc-part').inner_text() in reals: el.tap()
        pg.locator('.done').tap(); pg.wait_for_timeout(2500)
        print(' perfect: stars', pg.locator('.big-stars .star.on').count(), 'score', pg.locator('.score').inner_text(), 'cards in', pg.locator('.wcard.in').count())
        pg.locator('a.btn-gold').tap(); pg.wait_for_timeout(500)
        print(' next ->', pg.evaluate('location.hash'))
        # zero-star: pick only fakes
        fakes={c['p'] for c in L[1]['cards'] if not c['real']}
        for el in pg.locator('.pcard').all():
            if el.locator('.pc-part').inner_text() in fakes: el.tap()
        pg.locator('.done').tap(); pg.wait_for_timeout(2200)
        print(' zero: stars', pg.locator('.big-stars .star.on').count(), 'score', pg.locator('.score').inner_text(), 'primary', pg.locator('.btn-gold').inner_text())
        pg.locator('.again').first.tap(); pg.wait_for_timeout(400); print(' again ->', pg.locator('.pcard').count(),'cards')
        pg.goto(B+'#/'); pg.wait_for_timeout(500)
        print(' map current', pg.locator('.node.is-current').get_attribute('data-id'), 'store', pg.evaluate("localStorage.getItem('rootcraft.v2')"))
        print(' errors', errs); ctx.close()
    b.close()
