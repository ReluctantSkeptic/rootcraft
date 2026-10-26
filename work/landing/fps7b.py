import threading, http.server, sys
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/app/src/landing',**k)
    def log_message(s,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8825),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
  for args in ([], ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']):
    b=p.chromium.launch(args=args)
    pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto('http://127.0.0.1:8825/'); pg.wait_for_timeout(1000)
    print(args[:1], 'webgl2', pg.evaluate("!!document.querySelector('.crumple')"))
    for sel,frac in (('.tree-sec',.2),('.how',.55),('.worlds',.3)):
        t,h=pg.evaluate(f"(()=>{{const s=document.querySelector('{sel}');return [s.offsetTop,s.offsetHeight]}})()")
        pg.evaluate(f"scrollTo(0,{t+int((h-900)*frac)})"); pg.wait_for_timeout(400)
        fps=pg.evaluate("""new Promise(r=>{let n=0,t0=performance.now();const f=()=>{n++; scrollBy(0,4); if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2)}; requestAnimationFrame(f)})""")
        print(' fps scrubbing',sel,fps)
    b.close()
