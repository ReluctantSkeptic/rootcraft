import json
from PIL import Image, ImageDraw
R='/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
w=json.load(open(R+'/app/src/worlds/w2/world.json'))
ids=[l['id'] for l in w['levels']]
for i in ids:
    im=Image.open(f'{R}/work/art/w2/{i}.png').convert('RGB')
    print(i, im.size)
    im.resize((600,600),Image.LANCZOS).save(f'{R}/app/src/worlds/w2/art/{i}.webp','WEBP',quality=80,method=6)
S=320; sheet=Image.new('RGB',(S*4,(S+24)*4),'#13100B'); d=ImageDraw.Draw(sheet)
for k,i in enumerate(ids):
    im=Image.open(f'{R}/app/src/worlds/w2/art/{i}.webp').resize((S,S))
    x,y=(k%4)*S,(k//4)*(S+24); sheet.paste(im,(x,y)); d.text((x+6,y+S+5),i,fill='#E9B949')
sheet.save(R+'/work/screens/w2-art-sheet.png')
