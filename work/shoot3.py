import os, threading, functools, http.server, json
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT+'/app/dist'); H.log_message=lambda *a: None
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8796),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8796/'
d=json.load(open([ROOT+'/app/dist/'+f for f in os.listdir(ROOT+'/app/dist') if f.startswith('data.')][0]))
prog={l['id']:{'stars':2,'best':50} for l in d['levels']}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True); pg=ctx.new_page()
    pg.goto(B); pg.evaluate(f"localStorage.setItem('rootcraft.v2', JSON.stringify({json.dumps(prog)}))"); pg.reload()
    bad=[]
    for l in d['levels']:
        pg.goto(B+'#/l/'+l['id']); pg.wait_for_timeout(250)
        assert pg.evaluate('location.hash')=='#/l/'+l['id']
        # detect text overflow in cards
        o=pg.evaluate("""[...document.querySelectorAll('.pc-part')].filter(e=>e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().height>40).map(e=>e.textContent)""")
        if o: bad.append((l['id'],o))
        if pg.evaluate('document.documentElement.scrollWidth > innerWidth'): bad.append((l['id'],'pageoverflow'))
    print('phone card issues:', bad)
    pg.goto(B+'#/l/aud'); pg.wait_for_timeout(500); pg.screenshot(path=ROOT+'/work/screens/v2-check-aud-phone.png', full_page=True)
    pg.goto(B+'#/l/port'); pg.wait_for_timeout(500)
    print(pg.evaluate('location.hash'), pg.locator('.pcard').count(), pg.locator('.done').count(), pg.locator('h1').first.inner_text())
    for el in pg.locator('.pcard').all()[:7]: el.tap()
    pg.locator('.done').tap(); pg.wait_for_timeout(2600)
    pg.evaluate("document.querySelector('.dock').style.position='static'")
    pg.screenshot(path=ROOT+'/work/screens/v2-check-port-result-phone.png', full_page=True)
    b.close()
