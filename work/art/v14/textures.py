"""v14 crayon card textures -> app/src/card/*.webp
panel.webp  504x704 alpha mask: cream panel with a rough crayon/chalk edge (card face is 63:88)
grain.webp  128x128 RGBA seamless riso grain (light + dark specks), tiled over the coloured border/back
back-star.webp, back-dots.webp 504x704 alpha masks: big grainy riso shapes for the card back"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
OUT='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/app/src/card/'
rng=np.random.default_rng(14)
W,H=504,704
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def smooth(sig, amp, shape=(H,W), mode='reflect'):
    n=ndi.gaussian_filter(rng.standard_normal(shape).astype(np.float32),sig,mode=mode)
    return n/n.std()*amp
def sstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
AQ={'panel.webp':90}
def save_mask(a,name):
    a=(np.clip(a,0,1)*255).astype(np.uint8)
    im=np.dstack([np.full_like(a,255)]*3+[a])
    Image.fromarray(im,'RGBA').save(OUT+name,'WEBP',quality=80,alpha_quality=AQ.get(name,70),method=6)
# ---- panel
b=0.054*W; rr=0.05*W
qx=np.maximum(np.abs(xx-W/2)-(W/2-b-rr),0); qy=np.maximum(np.abs(yy-H/2)-(H/2-b-rr),0)
inx=np.minimum(np.maximum(np.abs(xx-W/2)-(W/2-b-rr),np.abs(yy-H/2)-(H/2-b-rr)),0)
sd=np.hypot(qx,qy)+inx-rr                # signed distance, <0 inside
sd=sd+smooth(40,1.1)+smooth(7,.45)        # hand-drawn wobble (gentle)
p=sstep(2.0,-11.0,sd)**2.0               # probability of cream: dry crayon grain fades ~13px into the panel
grain=ndi.gaussian_filter(rng.random((H,W)).astype(np.float32),1.0)+ndi.gaussian_filter(rng.random((H,W)).astype(np.float32),2.2)*1.5
grain=(np.argsort(np.argsort(grain.ravel())).reshape(H,W)/grain.size).astype(np.float32)  # uniform 0..1
a=(grain<p*1.02).astype(np.float32)
a=np.where(sd<-13,1,a); a=np.where(sd>4,0,a)
a=ndi.gaussian_filter(a,.45)
save_mask(a,'panel.webp')
# ---- grain tile (seamless)
T=192
n=rng.random((T,T))
g=np.zeros((T,T,4),np.float32)
dark=n<.07; light=n>.935
mott=ndi.gaussian_filter(rng.standard_normal((T,T)),6,mode='wrap'); mott/=mott.std()
g[...,:3]=np.where(dark[...,None],0,255)
al=np.where(dark,.16,0)+np.where(light,.20,0)
# soft mottling: slightly darker clouds
g[...,3]=al
Image.fromarray((g.clip(0,1)*[1,1,1,255]).astype(np.uint8) if False else np.dstack([g[...,:3],g[...,3]*255]).astype(np.uint8),'RGBA').save(OUT+'grain.webp','WEBP',lossless=True,method=6)
# ---- back shapes
def stipple(field, dens=1.0, edge=10):
    # field = signed distance (<0 inside); grainy riso edge, flat ink inside (grain.webp adds texture on top)
    pr=sstep(edge*.6,-edge,field)
    gr=ndi.gaussian_filter(rng.random((H,W)).astype(np.float32),.8)
    gr=(np.argsort(np.argsort(gr.ravel())).reshape(H,W)/gr.size).astype(np.float32)
    return ndi.gaussian_filter((gr<pr).astype(np.float32),.5)*dens
# chunky 8-point burst star (straight edges), drawn as a polygon then turned into a distance field
from PIL import ImageDraw
cx,cy=W*.54,H*.5; k=8; R1,R0=W*.66,W*.40
pts=[]
for j in range(2*k):
    a=j*np.pi/k+.2; rr_=R1 if j%2==0 else R0
    pts.append((cx+rr_*np.cos(a),cy+rr_*np.sin(a)))
pm=Image.new('L',(W,H),0); ImageDraw.Draw(pm).polygon(pts,fill=255)
inside=np.asarray(pm)>127
sdist=ndi.distance_transform_edt(~inside)-ndi.distance_transform_edt(inside)
save_mask(stipple(sdist+smooth(20,2.5),.86,16),'back-star.webp')
# soft grainy dots
f=np.full((H,W),1e9,np.float32)
for (x,y,rd) in [(.30,.26,.19),(.78,.47,.17),(.24,.62,.16),(.60,.86,.18),(.86,.10,.11)]:
    f=np.minimum(f,np.hypot(xx-x*W,yy-y*H)-rd*W)
save_mask(stipple(f+smooth(16,2.5),.62,18),'back-dots.webp')
import os
for fn in sorted(os.listdir(OUT)): print(fn, os.path.getsize(OUT+fn))
# ---- speck.webp: 96px seamless alpha tile, clumpy ~55% coverage. Used as the rough crayon band around the cream
# panels of small containers (pick cards, chips, buttons): mask = solid content-box + this tile in the padding band.
T2=96
n1=ndi.gaussian_filter(rng.random((T2,T2)),.9,mode='wrap'); n2=ndi.gaussian_filter(rng.random((T2,T2)),2.4,mode='wrap')
v=n1/n1.std()+.8*n2/n2.std(); v=(np.argsort(np.argsort(v.ravel())).reshape(T2,T2)/v.size)
sp=ndi.gaussian_filter((v>.36).astype(np.float32),.4,mode='wrap')
Image.fromarray(np.dstack([np.full((T2,T2),255,np.uint8)]*3+[(sp*255).astype(np.uint8)]),'RGBA').save(OUT+'speck.webp','WEBP',lossless=True,method=6)
print('speck.webp', os.path.getsize(OUT+'speck.webp'))
