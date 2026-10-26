import sys; sys.path.insert(0,'/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/app/src')
import levels as LV
from PIL import Image, ImageDraw, ImageFont
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/'
ids=[l['id'] for l in LV.LEVELS]; W=260; C=7; rows=(len(ids)+C-1)//C
im=Image.new('RGB',(W*C,(W+28)*rows),'white'); d=ImageDraw.Draw(im)
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18)
except: f=ImageFont.load_default()
src=sys.argv[1] if len(sys.argv)>1 else 'webp'
for i,k in enumerate(ids):
    p=R+('app/src/art/%s.webp'%k if src=='webp' else 'work/art/v3/v3-%s.png'%k)
    x,y=(i%C)*W,(i//C)*(W+28)
    im.paste(Image.open(p).convert('RGB').resize((W-6,W-6)),(x+3,y+3)); d.text((x+8,y+W),k,fill='black',font=f)
im.save(sys.argv[2] if len(sys.argv)>2 else '/tmp/sheet.jpg',quality=85)
