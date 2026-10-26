import os, sys
from PIL import Image, ImageDraw
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
src=f'{R}/work/art/w3'; dst=f'{R}/app/src/worlds/w3/art'
ids='uni bi tri quad oct dec cent mill semi multi mono du kilo equi omni poly gon'.split()
os.makedirs(dst,exist_ok=True)
thumbs=[]
for i in ids:
    im=Image.open(f'{src}/{i}.png').convert('RGB')
    w,h=im.size; s=min(w,h); im=im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s))
    im.resize((600,600),Image.LANCZOS).save(f'{dst}/{i}.webp','WEBP',quality=80,method=6)
    t=im.resize((300,300),Image.LANCZOS); ImageDraw.Draw(t).text((8,8),i,fill=(255,0,0)); thumbs.append(t)
cols=6; rows=(len(thumbs)+cols-1)//cols
sheet=Image.new('RGB',(cols*300,rows*300),'white')
for k,t in enumerate(thumbs): sheet.paste(t,((k%cols)*300,(k//cols)*300))
sheet.save(f'{R}/work/screens/w3-art-sheet.png')
print(sheet.size, [os.path.getsize(f'{dst}/{i}.webp')//1024 for i in ids])
