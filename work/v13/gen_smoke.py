"""Rootcraft v13 smoke textures. Seamless (periodic spectral noise + periodic domain warp),
low-res, RGBA with the colour baked in and density in alpha, so each layer is a plain <img>
the GPU can composite directly (no mask, no filter, no blend).
  A = slow billows (low frequency, soft)   B = finer wisps (ridged, stringy)
Output: app/src/smoke/<palette>-<a|b>.webp
"""
import numpy as np, os
from PIL import Image
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
OUT = ROOT + '/app/src/smoke'; os.makedirs(OUT, exist_ok=True)
N = 384

def spectral(seed, beta, lo, hi):
    r = np.random.default_rng(seed)
    f = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    f = np.sqrt(f) * N
    amp = np.where((f >= lo) & (f <= hi), 1 / np.maximum(f, 1) ** beta, 0)
    ph = np.exp(2j * np.pi * r.random((N, N)))
    n = np.real(np.fft.ifft2(amp * ph))
    return (n - n.mean()) / n.std()

def warp(n, dx, dy, k):
    y, x = np.mgrid[0:N, 0:N].astype(np.float32)
    xs = (x + k * dx) % N; ys = (y + k * dy) % N
    x0 = np.floor(xs).astype(int); y0 = np.floor(ys).astype(int); fx = xs - x0; fy = ys - y0
    x1 = (x0 + 1) % N; y1 = (y0 + 1) % N
    return (n[y0, x0] * (1 - fx) * (1 - fy) + n[y0, x1] * fx * (1 - fy) + n[y1, x0] * (1 - fx) * fy + n[y1, x1] * fx * fy)

def blur(a, s):  # periodic gaussian via FFT, keeps the tile seamless
    f = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi * s) ** 2 * f)))

def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def layer_a():
    n = spectral(11, 1.9, 1, 24)
    w = warp(n, spectral(12, 2.2, 1, 6), spectral(13, 2.2, 1, 6), 34)
    w = warp(w, spectral(14, 2.0, 2, 10), spectral(15, 2.0, 2, 10), 14)
    d = 1 / (1 + np.exp(-1.6 * (w - .55)))       # soft sigmoid, never a flat plateau
    d = blur(d, 3.0) ** 1.6
    d = (d - d.min()) / (d.max() - d.min())
    return d

def layer_b():
    n = spectral(21, 1.8, 2, 14)
    w = warp(n, spectral(22, 2.2, 1, 6), spectral(23, 2.2, 1, 6), 52)
    w = warp(w, spectral(27, 2.2, 2, 8), spectral(28, 2.2, 2, 8), 18)
    rid = 1 - np.abs(np.tanh(w * .7))            # ridges = wisps where the field crosses zero
    rid = blur(rid ** 2.6, 2.2)
    body = ss(-.6, 1.4, warp(spectral(24, 2.0, 1, 5), spectral(25, 2, 1, 6), spectral(26, 2, 1, 6), 30))
    d = rid * (.15 + .85 * body)
    d = (d - d.min()) / (d.max() - d.min())
    return d ** 1.2

# colour of each layer per palette: A = main tint, B = companion tint (harmony with the
# landing's Lamplight pairs: warm lamp + cool/plum shadow)
PAL = {
    'neutral':  ('#E6DCC8', '#B9C4C0'),
    'ink':      ('#E9CC8A', '#8FC2B6'),   # parchment gold + iron-gall teal
    'gold':     ('#F4BF56', '#E0824E'),   # amber + ember
    'silver':   ('#D2DCE7', '#8FA9CC'),   # silver + steel blue
    'amethyst': ('#BE92F4', '#F2A3CF'),   # lavender + rose
}
hexrgb = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]
A, B = layer_a(), layer_b()
np.save(ROOT + '/work/v13/dens_a.npy', A); np.save(ROOT + '/work/v13/dens_b.npy', B)
tot = 0
for name, (ca, cb) in PAL.items():
    for tag, d, c in (('a', A, ca), ('b', B, cb)):
        rgba = np.zeros((N, N, 4), np.uint8)
        rgba[..., :3] = hexrgb(c)
        rgba[..., 3] = np.round(d * 255).astype(np.uint8)
        p = f'{OUT}/{name}-{tag}.webp'
        Image.fromarray(rgba, 'RGBA').save(p, 'WEBP', quality=72, alpha_quality=70, method=6)
        tot += os.path.getsize(p); print(p.split('/')[-1], os.path.getsize(p))
print('total', tot)
# seam check: tile 2x2 preview
prev = np.tile(A, (2, 2)) * .6 + np.tile(B, (2, 2)) * .4
Image.fromarray(np.round(prev / prev.max() * 255).astype(np.uint8)).save(ROOT + '/work/v13/tile-preview.png')
