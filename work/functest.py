import os, threading, functools, http.server
from playwright.sync_api import sync_playwright
ROOT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT+'/app/dist'); H.log_message=lambda *a:None
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8798),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8798/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-1208/chrome-linux/headless_shell'))
    pg=b.new_page(viewport={'width':1200,'height':900}); pg.set_default_timeout(3000); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    # cards: find a possible word and drag its cards
    pg.goto(B+'#/cards'); pg.wait_for_timeout(700)
    hand=pg.evaluate("[...document.querySelectorAll('.hand .pcard .pc-s')].map(e=>e.textContent)")
    data=pg.evaluate("fetch(document.documentElement.dataset.data).then(r=>r.json())")
    poss=[w for w in data['words'] if len(w['parts'])>1 and all(pp[0] in hand for pp in w['parts']) and len({pp[0] for pp in w['parts']})==len(w['parts'])]
    w=poss[0]; print('hand',hand,'target',w['w'])
    for s,_ in w['parts']:
        src=pg.locator('.hand .pcard',has=pg.locator('.pc-s',has_text=s)).filter(has_text=s).first
        # exact match
        src=pg.locator(f".hand .pcard:has(.pc-s:text-is('{s}'))").first
        bb=src.bounding_box(); lb=pg.locator('.line').bounding_box()
        pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.mouse.down()
        pg.mouse.move(bb['x']+20,bb['y']-20,steps=4)
        pg.mouse.move(lb['x']+lb['width']-30,lb['y']+lb['height']/2,steps=8); pg.mouse.up(); pg.wait_for_timeout(150)
    pg.wait_for_timeout(300)
    print('cards result:', pg.locator('.card-result').inner_text().replace('\n',' | '))
    pg.wait_for_timeout(1700)
    # grow
    pg.goto(B+'#/grow/spect'); pg.wait_for_timeout(500)
    for t in ['inspector','expect','pedal','zzz']:
        pg.fill('.word-input',t); pg.keyboard.press('Enter'); pg.wait_for_timeout(150); print('grow',t,'->',pg.locator('.lab .hint').first.inner_text())
    # dig: cut correct
    pg.goto(B+'#/dig'); pg.wait_for_timeout(500)
    word=''.join(pg.evaluate("[...document.querySelectorAll('.dl')].map(e=>e.textContent)"))
    ws=[x for x in data['words'] if x['w']==word][0]; acc=0
    for pp in ws['parts'][:-1]:
        acc+=len(pp[0]); pg.locator('.gap').nth(acc-1).click()
    pg.click('.dig .cta'); pg.wait_for_timeout(300); print('dig',word,'->',pg.locator('.verdict').inner_text())
    # mint
    pg.goto(B+'#/mint'); pg.wait_for_timeout(400)
    pg.click(".mchip[data-k='st'][data-id='tele']"); pg.click(".mchip[data-k='mid'][data-id='astro']"); pg.click(".mchip[data-k='en'][data-id='logy']")
    print('mint', pg.locator('.mint-word').inner_text(), '|', pg.locator('.mint-mean').inner_text())
    pg.click(".mchip[data-k='st'][data-id='un']"); pg.click(".mchip[data-k='mid'][data-id='spect']"); pg.click(".mchip[data-k='en'][data-id='able']")
    print('mint', pg.locator('.mint-word').inner_text(), '|', pg.locator('.mint-mean').inner_text())
    pg.click(".mchip[data-k='st'][data-id='ped']"); pg.click(".mchip[data-k='mid'][data-id='mot']"); pg.click(".mchip[data-k='en'][data-id='or']") if pg.locator(".mchip[data-k='en'][data-id='or']").count() else pg.click(".mchip[data-k='en'][data-id='er']")
    print('mint', pg.locator('.mint-word').inner_text(), '|', pg.locator('.mint-mean').inner_text())
    for i in range(6):
        pg.click("text=Surprise me"); print('  rnd', pg.locator('.mint-word').inner_text(), '|', pg.locator('.mint-mean').inner_text())
    # sort: place all via tap
    pg.goto(B+'#/sort'); pg.wait_for_timeout(500)
    while pg.locator('.pool .wchip').count():
        pg.locator('.pool .wchip').first.click(); pg.locator('.bin').last.click(); pg.wait_for_timeout(60)
    pg.click('.sort .cta'); pg.wait_for_timeout(300)
    print('sort', pg.locator('.notes').inner_text().replace('\n',' | ')[:400])
    pg.screenshot(path=ROOT+'/work/screens/desk-sort-checked.png', full_page=True)
    # mystery
    pg.goto(B+'#/build/mystery'); pg.wait_for_timeout(400); pg.locator('.option').first.click(); print('mystery ok', pg.locator('.option.right').count())
    print('localStorage', pg.evaluate("localStorage.getItem('rootcraft.v1')")[:300])
    print('errors', errs)
