"""rembg isnet masks for v9 originals -> work/art/v14/masks/<w>_<id>.png (1024 L). Args: start end"""
import sys, json, os
from PIL import Image
from rembg import new_session, remove
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
L=[(w,l['id']) for w in ['w1','w2','w3','w4'] for l in json.load(open(f'{R}/app/src/worlds/{w}/world.json'))['levels']]
s=new_session('isnet-general-use')
a,b=int(sys.argv[1]),int(sys.argv[2])
for w,i in L[a:b]:
    out=f'{R}/work/art/v14/masks/{w}_{i}.png'
    if os.path.exists(out): continue
    im=Image.open(f'{R}/work/art/v9/{w}/{i}.png').convert('RGB')
    remove(im,session=s,only_mask=True).save(out)
print(len(L))
