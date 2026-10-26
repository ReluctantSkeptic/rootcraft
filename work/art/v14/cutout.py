"""v14: cut the v9 card art out of its cream background + world disc.
in : work/art/v9/<w>/<id>.png (1024 RGB), work/art/v14/masks/<w>_<id>.png (rembg isnet prior)
out: work/art/v14/cut/<w>_<id>.png (1024 RGBA)
Method: colour-key the cream and the flat disc colour, keep only key components that are
background (touch the frame, or rembg says background), then a soft matte on a 2-3 px band by
un-mixing each edge pixel between its nearest background colour and nearest solid foreground colour
(no halos). Overrides per image live in FIX below.
usage: python3 cutout.py [w_id ...]"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

R = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
SEED = {'w1': [(233, 185, 73)], 'w2': [(217, 164, 65), (196, 138, 34)], 'w3': [(200, 210, 221)], 'w4': [(201, 168, 242)]}
# per-image tweaks: tc/td = cream/disc tolerance, keep_frac = rembg fraction above which an
# enclosed key region is kept, nodisc = do not key the disc, shadow = turn disc-shadow into soft shadow
FIX = json.load(open(R + '/work/art/v14/fix.json')) if os.path.exists(R + '/work/art/v14/fix.json') else {}


def levels():
    for w in ['w1', 'w2', 'w3', 'w4']:
        for l in json.load(open(f'{R}/app/src/worlds/{w}/world.json'))['levels']:
            yield w, l['id']


def dist(a, c):
    return np.sqrt(((a - np.array(c, np.float32)) ** 2).sum(-1))


def cut(w, i):
    key = f'{w}_{i}'
    fx = FIX.get(key, {})
    im = np.asarray(Image.open(f'{R}/work/art/v9/{w}/{i}.png').convert('RGB')).astype(np.float32)
    H, W, _ = im.shape
    prior = np.asarray(Image.open(f'{R}/work/art/v14/masks/{key}.png').convert('L')).astype(np.float32) / 255
    border = np.concatenate([im[:6].reshape(-1, 3), im[-6:].reshape(-1, 3), im[:, :6].reshape(-1, 3), im[:, -6:].reshape(-1, 3)])
    cream = np.median(border, 0)
    # disc colour: nearest seed, refined by the median of pixels close to it
    best = None
    for s in SEED[w]:
        m = dist(im, s) < 34
        if best is None or m.sum() > best[1]:
            best = (s, m.sum(), m)
    disc = np.median(im[best[2]], 0) if best[1] > 500 else np.array(best[0], np.float32)
    tc, td = fx.get('tc', 24), fx.get('td', 14)
    dc, dd = dist(im, cream), dist(im, disc)
    cand = dc < tc
    discbg = np.zeros_like(cand)
    circ = None
    if not fx.get('nodisc'):
        # the disc is a flat circle: fit it on the disc/cream border, then every disc-coloured
        # pixel inside it is background (rembg often calls the whole disc foreground)
        dm = dd < td
        nearc = ndi.binary_dilation(dc < tc, iterations=3)
        ys, xs = np.nonzero(dm & nearc & ~ndi.binary_erosion(dm, iterations=1))
        if len(xs) > 200:
            A = np.c_[2 * xs, 2 * ys, np.ones(len(xs))]
            sol = np.linalg.lstsq(A, xs ** 2 + ys ** 2, rcond=None)[0]
            cx, cy = sol[0], sol[1]; Rr = np.sqrt(sol[2] + cx * cx + cy * cy)
            for _ in range(2):  # robust refit on inliers
                rr = np.hypot(xs - cx, ys - cy); keep = np.abs(rr - np.median(rr)) < 8
                A2, b2 = A[keep], (xs ** 2 + ys ** 2)[keep]
                sol = np.linalg.lstsq(A2, b2, rcond=None)[0]; cx, cy = sol[0], sol[1]; Rr = np.sqrt(sol[2] + cx * cx + cy * cy)
            yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot(xx - cx, yy - cy)
            # disc pieces = disc-coloured components that reach the rim (pieces cut off by the
            # character still touch the rim; a body part of the same colour is enclosed by outline)
            dl, dn = ndi.label(dm & (r < Rr + 4), structure=np.ones((3, 3)))
            rimhit = np.unique(dl[(np.abs(r - Rr) < 7) & (dl > 0)])
            ok = np.zeros(dn + 1, bool); ok[rimhit] = True; ok[0] = False
            discbg = ok[dl]
            circ = r < Rr - 3
            # anti-aliased rim: colours on the cream-disc segment in a thin annulus
            seg = disc - cream; t = np.clip(((im - cream) * seg).sum(-1) / (seg * seg).sum(), 0, 1)
            off = np.sqrt(((im - (cream + t[..., None] * seg)) ** 2).sum(-1))
            discbg |= (np.abs(r - Rr) < fx.get('rim', 7)) & (off < 24)
            if 'protect' in fx:
                for (x0, y0, x1, y1) in fx['protect']:
                    discbg[y0:y1, x0:x1] = False
        cand |= dm
    lab, n = ndi.label(cand, structure=np.ones((3, 3)))
    idx = np.arange(1, n + 1)
    area = ndi.sum(np.ones_like(prior), lab, idx)
    frac = ndi.mean(prior, lab, idx)
    edge = np.zeros(n + 1, bool)
    sides = {'top': lab[0], 'bottom': lab[-1], 'left': lab[:, 0], 'right': lab[:, -1]}
    for nm, e in sides.items():
        if nm in fx.get('noedge', []): continue
        edge[np.unique(e)] = True
    # cream inside the disc cannot be background (the background there is the disc colour):
    # it is a body part (a penguin's belly, a drum head) even when rembg says otherwise
    incirc = ndi.mean(circ.astype(np.float32), lab, idx) if circ is not None else np.zeros(n)
    creamy = ndi.mean((dc < tc).astype(np.float32), lab, idx)
    kf = fx.get('keep_frac', .5)
    isbg = np.zeros(n + 1, bool)
    for k in idx:
        a, f = area[k - 1], frac[k - 1]
        if edge[k] or (f < kf and a > 60) or f < .2:
            isbg[k] = True
        if not edge[k] and creamy[k - 1] > .8 and incirc[k - 1] > .6 and not fx.get('nocreamkeep'):
            isbg[k] = False
    isbg[0] = False
    B = isbg[lab] | discbg
    # per-image: force-keep key-coloured pixels inside ellipses (a cream boulder cut by the frame)
    for (ex, ey, rx, ry) in fx.get('keepell', []):
        yy2, xx2 = np.ogrid[0:H, 0:W]
        B &= ~((((xx2 - ex) / rx) ** 2 + ((yy2 - ey) / ry) ** 2) < 1)
    # big border-touching key region may leak into a pale body part: give rembg the final say on
    # strongly-foreground pixels that are far from the frame
    if fx.get('rescue', True):
        res = B & ~discbg & (prior > fx.get('rescue_t', .85))
        res = ndi.binary_opening(res, iterations=3)
        B &= ~res
    # optional: shadows drawn on the disc (darker disc tone) -> soft grey shadow
    shadow = None
    if fx.get('shadow'):
        hsv_d = im.mean(-1) / max(disc.mean(), 1)
        sh = (~B) & (prior < .3) & (dist(im / im.mean(-1, keepdims=True).clip(1), disc / disc.mean()) < .09) & (hsv_d < .93)
        shadow = sh
        B |= sh
    F = ~B
    # drop tiny foreground specks (keying noise), keep anything >= 40 px
    fl, fn = ndi.label(F, structure=np.ones((3, 3)))
    if fn:
        fa = ndi.sum(np.ones_like(prior), fl, np.arange(1, fn + 1))
        small = np.zeros(fn + 1, bool); small[1:] = fa < fx.get('speck', 40)
        F &= ~small[fl]; B = ~F
    # soft matte on the band around the boundary
    band = ndi.binary_dilation(F, iterations=2) & ndi.binary_dilation(B, iterations=2)
    bcore = B & ~band
    fcore = F & ~band
    # nearest background-core colour and nearest foreground-core colour for each band pixel
    _, bi = ndi.distance_transform_edt(~bcore, return_indices=True)
    _, fi = ndi.distance_transform_edt(~fcore, return_indices=True)
    Bc = im[bi[0], bi[1]]
    Fc = im[fi[0], fi[1]]
    d = Fc - Bc
    a = ((im - Bc) * d).sum(-1) / np.maximum((d * d).sum(-1), 1)
    a = np.clip(a, 0, 1)
    alpha = F.astype(np.float32)
    alpha[band] = a[band]
    # un-mix colour: C = B + (P - B) / a
    col = im.copy()
    am = np.maximum(alpha, 1e-3)[..., None]
    un = Bc + (im - Bc) / am
    col[band] = np.clip(un[band], 0, 255)
    # pixels that are nearly opaque keep their real colour
    keep = band & (alpha > .92)
    col[keep] = im[keep]
    if shadow is not None:
        s = ndi.gaussian_filter(shadow.astype(np.float32), 3) * .22
        put = s > alpha
        col[put] = (60, 45, 40)
        alpha = np.maximum(alpha, s)
    out = np.dstack([col, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'{R}/work/art/v14/cut/{key}.png')
    return key, round(float(alpha.mean()), 3), tuple(int(x) for x in disc)


if __name__ == '__main__':
    want = set(sys.argv[1:])
    for w, i in levels():
        if want and f'{w}_{i}' not in want:
            continue
        print(*cut(w, i), flush=True)
