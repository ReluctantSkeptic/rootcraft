"""Export v9 originals (work/art/v9/<w>/<id>.png, 1024) -> app webp.
game: app/src/worlds/<w>/art/<id>.webp 600px (+ legacy mirror app/src/art/<id>.webp for w1)
landing: app/src/landing/img/<id>.webp 440px for every root the landing already uses."""
import json, os, glob
from PIL import Image
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'; V9=R+'/work/art/v9'
Q=int(os.environ.get('Q','78'))
tot={}
land=[os.path.basename(f)[:-5] for f in glob.glob(R+'/app/src/landing/img/*.webp') if 'glitter' not in f]
where={}
for w in ['w1','w2','w3','w4']:
    for l in json.load(open(f'{R}/app/src/worlds/{w}/world.json'))['levels']:
        im=Image.open(f'{V9}/{w}/{l["id"]}.png').convert('RGB')
        a=im.resize((600,600),Image.LANCZOS)
        dst=f'{R}/app/src/worlds/{w}/{l.get("art") or "art/"+l["id"]+".webp"}'
        a.save(dst,'WEBP',quality=Q,method=6); tot[w]=tot.get(w,0)+os.path.getsize(dst)
        if w=='w1' and os.path.exists(f'{R}/app/src/art/{l["id"]}.webp'): a.save(f'{R}/app/src/art/{l["id"]}.webp','WEBP',quality=Q,method=6)
        where[l['id']]=im
lt=0
for n in land:
    dst=f'{R}/app/src/landing/img/{n}.webp'
    where[n].resize((440,440),Image.LANCZOS).save(dst,'WEBP',quality=Q,method=6); lt+=os.path.getsize(dst)
print({k:round(v/1024) for k,v in tot.items()},'KB; landing',len(land),round(lt/1024),'KB')
