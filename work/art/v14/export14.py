"""Export v14 cutouts (work/art/v14/cut/<w>_<id>.png, 1024 RGBA) -> transparent webp.
game: app/src/worlds/<w>/art/<id>.webp 600px (+ w1 legacy mirror app/src/art/<id>.webp)
landing: app/src/landing/img/<id>.webp 440px for roots the landing uses. Originals: work/art/v_disc_backup/."""
import json, os, glob
from PIL import Image
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; C=R+'/work/art/v14/cut'
Q=int(os.environ.get('Q','72')); AQ=int(os.environ.get('AQ','70'))
land=[os.path.basename(f)[:-5] for f in glob.glob(R+'/app/src/landing/img/*.webp') if 'glitter' not in f]
tot={}; where={}
def save(im,size,dst):
    im.resize((size,size),Image.LANCZOS).save(dst,'WEBP',quality=Q,alpha_quality=AQ,method=6)
    return os.path.getsize(dst)
for w in ['w1','w2','w3','w4']:
    for l in json.load(open(f'{R}/app/src/worlds/{w}/world.json'))['levels']:
        im=Image.open(f'{C}/{w}_{l["id"]}.png').convert('RGBA')
        dst=f'{R}/app/src/worlds/{w}/{l.get("art") or "art/"+l["id"]+".webp"}'
        tot[w]=tot.get(w,0)+save(im,600,dst)
        if w=='w1' and os.path.exists(f'{R}/app/src/art/{l["id"]}.webp'): save(im,600,f'{R}/app/src/art/{l["id"]}.webp')
        where[l['id']]=im
lt=sum(save(where[n],440,f'{R}/app/src/landing/img/{n}.webp') for n in land)
print({k:round(v/1024) for k,v in tot.items()},'KB; landing',len(land),round(lt/1024),'KB')
