"""v9 helpers.
python3 tools.py move            -> move generated <w>-<id>.png from project root into work/art/v9/<w>/<id>.png
                                    (an existing file is kept as <id>.rN.png = rejected take N)
python3 tools.py review w1 [ids] -> /tmp/review.png grid (300px tiles labelled)
"""
import sys, os, glob, json, re
from PIL import Image, ImageDraw, ImageFont
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
V9 = f'{ROOT}/work/art/v9'
FONT = f'{ROOT}/app/src/fonts'

def font(sz, italic=False):
    fs = glob.glob(f'{FONT}/*.ttf') + glob.glob(f'{FONT}/*.otf')
    for f in fs:
        if ('Newsreader' in f) == italic or not fs:
            try: return ImageFont.truetype(f, sz)
            except Exception: pass
    return ImageFont.load_default()

def move():
    for f in glob.glob(f'{ROOT}/w[1-4]-*.png'):
        b = os.path.basename(f)[:-4]; w, i = b.split('-', 1)
        dst = f'{V9}/{w}/{i}.png'
        if os.path.exists(dst):
            n = 1
            while os.path.exists(f'{V9}/{w}/{i}.r{n}.png'): n += 1
            os.rename(dst, f'{V9}/{w}/{i}.r{n}.png')
        os.rename(f, dst); print('moved', w, i)

def levels(w):
    return json.load(open(f'{ROOT}/app/src/worlds/{w}/world.json'))['levels']

def review(w, ids=None, out='/tmp/review.png', T=300, cols=6):
    L = [l for l in levels(w) if not ids or l['id'] in ids]
    L = [l for l in L if os.path.exists(f'{V9}/{w}/{l["id"]}.png')]
    rows = (len(L) + cols - 1) // cols
    S = Image.new('RGB', (cols * T, rows * (T + 34)), '#222')
    d = ImageDraw.Draw(S); f = ImageFont.load_default(size=18) if hasattr(ImageFont, 'load_default') else None
    for k, l in enumerate(L):
        im = Image.open(f'{V9}/{w}/{l["id"]}.png').convert('RGB').resize((T, T), Image.LANCZOS)
        x, y = (k % cols) * T, (k // cols) * (T + 34)
        S.paste(im, (x, y)); d.text((x + 6, y + T + 6), f'{l["id"]} - {l["meaning"]}', fill='white', font=f)
    S.save(out); print(out, S.size)

if __name__ == '__main__':
    if sys.argv[1] == 'move': move()
    else: review(sys.argv[2], sys.argv[3:] or None)
