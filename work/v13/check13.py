import threading, http.server, json, collections
from playwright.sync_api import sync_playwright
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; OUT = ROOT + '/work/screens/'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT + '/app/dist', **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8844), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
U = 'http://127.0.0.1:8844/play/?all=1'
CATS = 'devtools.timeline,disabled-by-default-devtools.timeline,blink.animations,devtools.timeline.frame'
def trace(pg, cdp, ms):
    evs = []
    cdp.on('Tracing.dataCollected', lambda e: evs.extend(e['value']))
    done = []
    cdp.on('Tracing.tracingComplete', lambda e: done.append(1))
    cdp.send('Tracing.start', {'categories': CATS, 'transferMode': 'ReportEvents'})
    pg.wait_for_timeout(ms); cdp.send('Tracing.end')
    while not done: pg.wait_for_timeout(100)
    c = collections.Counter(e['name'] for e in evs if e.get('ph') in ('X', 'B', 'I', 'i', 'n', 'b'))
    return {k: c.get(k, 0) for k in ('Layout', 'Paint', 'UpdateLayoutTree', 'PrePaint', 'Layerize', 'RasterTask', 'Animation')}, evs
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    # kill the existing particle canvas + other ambient anims so only the smoke remains
    STILL = "()=>{const c=document.getElementById('fx');c.style.display='none';for(const a of document.getAnimations()){if(!(a.animationName||'').startsWith('smk'))a.finish&&a.cancel()}}"
    pg.goto(U + '#/w/w2'); pg.wait_for_timeout(2500); pg.evaluate(STILL); pg.wait_for_timeout(500)
    on, evs = trace(pg, cdp, 3000)
    anims = [e for e in evs if e['name'] == 'Animation']
    print('smoke ON 3s (fx canvas hidden):', on)
    ult = [e.get('dur', 0) for e in evs if e['name'] == 'UpdateLayoutTree' and e.get('ph') == 'X']
    print('  UpdateLayoutTree total ms', round(sum(ult) / 1000, 2), 'max ms', round(max(ult or [0]) / 1000, 3))
    fails = [e for e in evs if 'ompositorAnimation' in e['name'] or 'compositeFailed' in json.dumps(e.get('args', {}))]
    print('  composite-failure events:', len(fails), [json.dumps(e.get('args'))[:160] for e in fails[:3]])
    print('  compositor-animation hints:', sorted({json.dumps(e.get('args', {}).get('data', {}))[:140] for e in anims})[:4])
    pg.evaluate("()=>document.getElementById('smoke').remove()"); pg.wait_for_timeout(500)
    off, _ = trace(pg, cdp, 3000)
    print('smoke OFF 3s (fx canvas hidden):', off)
    # Words mode: tint follows the root's world while swiping
    pg.close(); pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(U + '#/words'); pg.wait_for_timeout(1500)
    seq = []
    for _ in range(34):
        pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(120)
    pg.wait_for_timeout(2200)
    seq.append(pg.evaluate("[document.documentElement.dataset.world,[...document.querySelectorAll('#smoke img')].map(i=>i.src.split('/').pop()+':'+i.className)]"))
    pg.keyboard.press('End'); pg.wait_for_timeout(2500)
    seq.append(pg.evaluate("[document.documentElement.dataset.world,[...document.querySelectorAll('#smoke img')].map(i=>i.src.split('/').pop()+':'+i.className)]"))
    pg.screenshot(path=OUT + 'v13-smoke-1280-words-amethyst.png')
    print('words swipe:', seq)
    # route switch crossfade mid-way
    pg.goto(U + '#/w/w1'); pg.wait_for_timeout(1500); pg.evaluate("location.hash='#/w/w3'"); pg.wait_for_timeout(700)
    print('mid crossfade:', pg.evaluate("[...document.querySelectorAll('#smoke img')].map(i=>i.src.split('/').pop()+' op='+(+getComputedStyle(i).opacity).toFixed(3))"))
    pg.wait_for_timeout(1600)
    print('after:', pg.evaluate("[...document.querySelectorAll('#smoke img')].map(i=>i.src.split('/').pop()+' op='+getComputedStyle(i).opacity)"))
    # hidden-tab pause class
    print('visible smoke-off:', pg.evaluate("document.documentElement.classList.contains('smoke-off')"))
    pg.evaluate("Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))")
    print('hidden smoke-off:', pg.evaluate("[document.documentElement.classList.contains('smoke-off'),getComputedStyle(document.querySelector('.smk')).animationPlayState]"))
    ctx.close()
    # reduced motion: static
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page()
    pg.goto(U + '#/w/w4'); pg.wait_for_timeout(2500)
    print('reduced motion:', pg.evaluate("[...document.querySelectorAll('.smk')].map(i=>[getComputedStyle(i).animationName,getComputedStyle(i).transform.slice(0,40),getComputedStyle(i).opacity])"))
    pg.screenshot(path=OUT + 'v13-smoke-390-amethyst-map-reduced.png')
    print('errors', errs)
