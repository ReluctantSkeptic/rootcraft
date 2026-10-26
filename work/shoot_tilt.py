import os, threading, functools, http.server, json, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT+'/app/dist'); H.log_message=lambda *a: None
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8796),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8796/'
d=json.load(open([ROOT+'/app/dist/'+f for f in os.listdir(ROOT+'/app/dist') if f.startswith('data.')][0]))
prog={l['id']:{'stars':2,'best':50} for l in d['levels']}
lid=sys.argv[1] if len(sys.argv)>1 else 'duc'; out=sys.argv[2] if len(sys.argv)>2 else 'v4-tilt-desktop'
fx,fy=(float(sys.argv[3]),float(sys.argv[4])) if len(sys.argv)>4 else (0.88,0.12)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    ctx=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=2); pg=ctx.new_page()
    pg.goto(B); pg.evaluate(f"localStorage.setItem('rootcraft.v2', JSON.stringify({json.dumps(prog)}))"); pg.reload()
    pg.goto(B+'#/l/'+lid); pg.wait_for_selector('.rcard-in',state='attached'); pg.wait_for_timeout(900)
    bb=pg.locator('.tilt-main').bounding_box()
    pg.mouse.move(bb['x']+bb['width']/2, bb['y']+bb['height']/2)
    for k in range(1,15):
        pg.mouse.move(bb['x']+bb['width']*(0.5+(fx-0.5)*k/14), bb['y']+bb['height']*(0.5+(fy-0.5)*k/14)); pg.wait_for_timeout(16)
    pg.wait_for_timeout(900)
    pg.screenshot(path=f'{ROOT}/work/screens/{out}.png', clip={'x':bb['x']-50,'y':bb['y']-30,'width':bb['width']+100,'height':bb['height']+60})
    b.close()
