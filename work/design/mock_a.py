import numpy as np
from PIL import Image, ImageDraw, ImageFont
rng=np.random.default_rng(3)
def hexc(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)/255
# value noise
G=rng.random((257,257))
def vnoise(x,y):
    xi=np.floor(x).astype(int)%256; yi=np.floor(y).astype(int)%256
    xf=x-np.floor(x); yf=y-np.floor(y)
    u=xf*xf*(3-2*xf); v=yf*yf*(3-2*yf)
    a=G[yi,xi];b=G[yi,xi+1];c=G[yi+1,xi];d=G[yi+1,xi+1]
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v
def fbm(x,y,o=4):
    s=0;a=.5
    for i in range(o):
        s+=a*vnoise(x,y); x,y=x*2.03+17.1,y*2.03+9.2; a*=.5
    return s
def field(W,H,pal,t=3.0,lamp=(0.5,-0.08),lampA=.11,scale=2.2,seed=0):
    ys,xs=np.mgrid[0:H,0:W].astype(float)
    asp=W/H
    x=xs/W*scale*asp+seed; y=ys/H*scale+seed*.7
    qx=fbm(x+.05*t,y); qy=fbm(x+5.2,y+1.3-.04*t)
    rx=fbm(x+3.5*qx+1.7,y+3.5*qy+9.2+.03*t); ry=fbm(x+3.5*qx+8.3,y+3.5*qy+2.8)
    f=fbm(x+3.0*rx,y+3.0*ry)
    base,c1,c2,c3,gold=[hexc(c) for c in pal]
    col=np.zeros((H,W,3))+base
    m1=np.clip((f-.35)*2.2,0,1)[...,None]; col=col*(1-m1)+c1*m1
    m2=np.clip((rx-.45)*2.4,0,1)[...,None]*.85; col=col*(1-m2)+c2*m2
    m3=np.clip((qy-.5)*2.6,0,1)[...,None]*.7; col=col*(1-m3)+c3*m3
    # lamp glow
    dx=(xs/W-lamp[0])*asp; dy=(ys/H-lamp[1])
    g=np.exp(-(dx*dx/0.35+dy*dy/0.12))*(0.6+0.8*f)
    col=col+gold[None,None,:]*(g*lampA)[...,None]
    # vignette
    vx=xs/W-.5; vy=ys/H-.5; vig=1-0.55*np.clip((vx*vx+vy*vy)*1.6,0,1)
    col*=vig[...,None]
    col+= (rng.random((H,W))[...,None]-.5)*0.018  # grain/dither
    return np.clip(col,0,1)
PAL=dict(top=['#0D0B0A','#231910','#2A1521','#0F1D1D','#E9B949'])
if __name__=='__main__':
    W,H=1280,800
    bg=field(W,H,PAL['top'])
    shot=np.array(Image.open('../screens/v10-hero-ascii-1280-t10.png').convert('RGB')).astype(float)/255
    night=hexc('#121110')
    mx=shot.max(-1); sat=mx-shot.min(-1)
    w=np.clip((0.2-mx)/0.06,0,1)*np.clip((0.06-sat)/0.04,0,1)
    ratio=np.clip(shot.mean(-1)/night.mean(),0,2)[...,None]
    out=shot*(1-w[...,None])+np.clip(bg*ratio,0,1)*w[...,None]
    Image.fromarray((out*255).astype(np.uint8)).save('consult-a-hero.png')
    # page journey strip
    sections=[('Top · parade',['#0D0B0A','#231910','#2A1521','#0F1D1D','#E9B949']),
      ('Forge',['#0E0B09','#2B1A0E','#311612','#1A1410','#E9B949']),
      ('Tree',['#0B0D0B','#14201A','#221A12','#0E1E1C','#C9D28A']),
      ('Pieces · Guess',['#0D0B0B','#1F1814','#26161E','#141819','#E9B949']),
      ('How',['#0C0C0D','#1A1A1D','#1F1824','#121A1C','#C8D2DD']),
      ('→ Worlds (Ink)',['#0C0B0A','#1E1C1A','#1A1716','#141414','#F1EDE4']),
      ('End',['#0D0B0A','#2A1E10','#2A1521','#101B1B','#E9B949'])]
    sw,sh=360,225
    strip=Image.new('RGB',(sw*len(sections)//1, sh+28),(10,9,8))
    d=ImageDraw.Draw(strip)
    try: fnt=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
    except: fnt=None
    for i,(n,p) in enumerate(sections):
        f=field(sw,sh,p,seed=i*1.3,t=i*2)
        strip.paste(Image.fromarray((f*255).astype(np.uint8)),(i*sw,0))
        d.text((i*sw+10,sh+6),n,fill=(220,212,196),font=fnt)
    strip.save('consult-a-journey.png')
    # stack
    hero=Image.open('consult-a-hero.png'); s2=strip.resize((W,int(strip.height*W/strip.width)))
    full=Image.new('RGB',(W,H+s2.height),(10,9,8)); full.paste(hero,(0,0)); full.paste(s2,(0,H)); full.save('consult-a.png')
