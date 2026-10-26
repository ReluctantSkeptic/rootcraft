import numpy as np
from PIL import Image
rng=np.random.default_rng(7)
W,H=1280,800
def vnoise(x,y,seed):
    r=np.random.default_rng(seed); g=r.random((257,257))
    xi=np.floor(x).astype(int)&255; yi=np.floor(y).astype(int)&255
    xf=x-np.floor(x); yf=y-np.floor(y)
    u=xf*xf*(3-2*xf); v=yf*yf*(3-2*yf)
    a=g[yi,xi];b=g[yi,xi+1];c=g[yi+1,xi];d=g[yi+1,xi+1]
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v
def fbm(x,y,s):
    t=0;a=.5
    for i in range(5):
        t+=a*vnoise(x,y,s+i); x,y=x*2.02+3.1,y*2.02+1.7; a*=.5
    return t
ys,xs=np.mgrid[0:H,0:W]/H
p=(xs*2.2,ys*2.2)
q1=fbm(p[0],p[1],1); q2=fbm(p[0]+5.2,p[1]+1.3,10)
n=fbm(p[0]+3.0*q1,p[1]+3.0*q2,20)            # marbled ink field
hx=lambda h: np.array([int(h[i:i+2],16) for i in (1,3,5)])/255
inkA,inkB,umber,lamp,veil=hx('#0B0A0E'),hx('#16121A'),hx('#2A1D12'),hx('#E9B949'),hx('#3B2A4A')
col=inkA+(inkB-inkA)*np.clip(n*1.4-.2,0,1)[...,None]
# ink veins (iron-gall plum / umber edges)
vein=np.exp(-((n-.52)/.035)**2)*.55
col=col+(umber-col)*vein[...,None]*.5
# lamplight pool, upper-centre, behind headline
d=np.sqrt(((xs-0.82)/1.1)**2+((ys-0.12)/0.7)**2)
pool=np.exp(-d*d*3.2)*(.55+.45*q1)
col=col+lamp*pool[...,None]*.085
# cool violet veil low-right, foreshadowing worlds
d2=np.sqrt((xs-1.45)**2+(ys-1.05)**2)
col=col+veil*np.exp(-d2*d2*2.2)[...,None]*.22
# vignette + grain
vig=1-0.35*np.clip(np.sqrt((xs-.8)**2+(ys-.5)**2)*1.1,0,1)
col=col*vig[...,None]+ (rng.random((H,W,1))-.5)*0.018
bg=np.clip(col,0,1)
Image.fromarray((bg*255).astype(np.uint8)).save('consult-b-bg.png')
# composite over screenshot: replace near-bg pixels
s=np.asarray(Image.open('../screens/v10-hero-ascii-1280-t25.png').convert('RGB').resize((W,H))).astype(float)/255
base=np.array([0x12,0x11,0x10])/255
dist=np.abs(s-base).max(-1)
m=np.clip(1-(dist-0.02)/0.05,0,1)[...,None]   # 1 = background pixel
# darker shadow pixels keep relative darkness
lum=s.mean(-1,keepdims=True); shade=np.clip(lum/base.mean(),0,1.2)
out=s*(1-m)+bg*shade*m
Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)).save('consult-b.png')
# section strip
secs=[('Top','#0B0A0E','#16121A','#E9B949'),('Forge','#100C0A','#22180F','#F6D57E'),('Tree','#0A0C0B','#141813','#B9C79A'),('How','#0E0C10','#1A1620','#E9B949'),('Ink','#0C0B0A','#1E1C1A','#F1EDE4'),('Gold','#120E08','#2A2010','#E9B949'),('Silver','#0D0F12','#1E232B','#C8D2DD'),('Amethyst','#100A17','#271838','#C9A2F5')]
