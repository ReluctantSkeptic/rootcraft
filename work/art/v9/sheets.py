"""Deliverable sheets: work/screens/v9-cast.png and v9-contact-w1..w4.png"""
import json
from PIL import Image, ImageDraw, ImageFont
R = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
V9 = f'{R}/work/art/v9'
PAPER, INK, INK2 = '#F1EDE4', '#161412', '#5F5952'
ACC = {'w1': '#E9B949', 'w2': '#C48A22', 'w3': '#8d97a3', 'w4': '#A775E6'}

def F(sz, w=800, italic=False):
    f = ImageFont.truetype(f'{R}/app/src/fonts/' + ('Newsreader-Italic.woff2' if italic else 'BricolageGrotesque.woff2'), sz)
    try:
        axes = f.get_variation_axes()
        vals = [w if a.get('name', b'').lower() in (b'weight', 'weight') else a['default'] for a in axes]
        f.set_variation_by_axes(vals)
    except Exception: pass
    return f

CAST = json.load(open(f'{V9}/cast.json'))['cast']
def cast_sheet():
    T = 700; th = int(T * 768 / 1408); pad = 30; lab = 70
    W = 2 * T + 3 * pad; H = 140 + 5 * (th + lab + pad)
    S = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(S)
    d.text((pad, 40), 'Rootcraft cast', font=F(64), fill=INK)
    d.text((pad + 470, 62), 'ten original characters, rotated across all 80 roots', font=F(34, italic=True), fill=INK2)
    for k, c in enumerate(CAST):
        x = pad + (k % 2) * (T + pad); y = 140 + (k // 2) * (th + lab + pad)
        im = Image.open(f'{V9}/cast/cast-{c["id"]}.png').convert('RGB').resize((T, th), Image.LANCZOS)
        S.paste(im, (x, y))
        d.text((x, y + th + 10), c['name'], font=F(38), fill=INK)
    S.save(f'{R}/work/screens/v9-cast.png'); print('cast', S.size)

def contact(w):
    d0 = json.load(open(f'{R}/app/src/worlds/{w}/world.json'))
    P = json.load(open(f'{V9}/prompts.json')); an = {(p['world'], p['id']): p['animal'] for p in P}
    L = d0['levels']; cols = 6; T = 300; pad = 24; lab = 86
    rows = (len(L) + cols - 1) // cols
    W = cols * T + (cols + 1) * pad; H = 130 + rows * (T + lab + pad)
    S = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(S)
    d.text((pad, 34), f'{d0["name"]}', font=F(60), fill=INK)
    d.ellipse((pad + 14 + d.textlength(d0['name'], font=F(60)), 58, pad + 44 + d.textlength(d0['name'], font=F(60)), 88), fill=ACC[w])
    d.text((pad + 70 + d.textlength(d0['name'], font=F(60)), 52), f'{len(L)} roots', font=F(34, italic=True), fill=INK2)
    for k, l in enumerate(L):
        x = pad + (k % cols) * (T + pad); y = 130 + (k // cols) * (T + lab + pad)
        im = Image.open(f'{V9}/{w}/{l["id"]}.png').convert('RGB').resize((T, T), Image.LANCZOS)
        S.paste(im, (x, y)); d.rectangle((x, y, x + T - 1, y + T - 1), outline='#cfc8bb')
        d.text((x + 2, y + T + 8), l['root'], font=F(36), fill=INK)
        d.text((x + 4 + d.textlength(l['root'], font=F(36)) + 10, y + T + 18), an[(w, l['id'])], font=F(20, 500), fill=INK2)
        d.text((x + 2, y + T + 50), l['meaning'], font=F(26, italic=True), fill=INK2)
    S.save(f'{R}/work/screens/v9-contact-{w}.png'); print(w, S.size)

if __name__ == '__main__':
    cast_sheet()
    for w in ['w1', 'w2', 'w3', 'w4']: contact(w)
