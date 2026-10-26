from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':900})
    try: pg.goto('https://www.timeless.co/type',wait_until='domcontentloaded',timeout=45000)
    except Exception as e: print('goto',str(e)[:100])
    pg.wait_for_timeout(6000)
    H=pg.evaluate('document.body?document.body.scrollHeight:0'); print('H',H)
    for i,y in enumerate(range(0,min(H,14000),900)):
        pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(1000)
        pg.screenshot(path=f'ref-{i:02d}.png')
    info=pg.evaluate('''(()=>{const out=[];for(const e of document.querySelectorAll('*')){const t=[...e.childNodes].filter(n=>n.nodeType==3).map(n=>n.textContent.trim()).join('');if(!t)continue;const s=getComputedStyle(e);const fs=parseFloat(s.fontSize);if(fs>=24)out.push([t.slice(0,30),s.fontSize,s.fontFamily.slice(0,30),s.fontWeight,s.letterSpacing,s.lineHeight,Math.round(e.getBoundingClientRect().top+scrollY)])}return out.slice(0,50)})()''')
    for r in info: print(r)
    print(pg.evaluate("getComputedStyle(document.body).backgroundColor+' '+getComputedStyle(document.body).color"))
