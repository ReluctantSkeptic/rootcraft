"""contact sheet of cutouts: each tile = cutout on card cream (top-left half) and on mid grey checker; label."""
import sys, glob, os
from PIL import Image, ImageDraw
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/work/art/v14'
keys=sys.argv[2:] or sorted(os.path.basename(f)[:-4] for f in glob.glob(R+'/cut/*.png'))
T=int(os.environ.get('T','200')); cols=int(os.environ.get('C','10'))
rows=(len(keys)+cols-1)//cols
S=Image.new('RGB',(cols*T,rows*(T+14)),(40,40,40)); d=ImageDraw.Draw(S)
for n,k in enumerate(keys):
    im=Image.open(f'{R}/cut/{k}.png').resize((T,T),Image.LANCZOS)
    bg=Image.new('RGBA',(T,T),(247,241,227,255))
    dk=Image.new('RGBA',(T,T),(205,60,48,255))
    m=Image.new('L',(T,T),0); ImageDraw.Draw(m).polygon([(0,0),(T,0),(0,T)],fill=255)
    bg.paste(dk,(0,0),Image.eval(m,lambda v:255-v))
    bg.alpha_composite(im)
    x,y=(n%cols)*T,(n//cols)*(T+14)
    S.paste(bg.convert('RGB'),(x,y)); d.text((x+3,y+T+1),k,fill=(230,230,230))
S.save(sys.argv[1]); print(S.size)
