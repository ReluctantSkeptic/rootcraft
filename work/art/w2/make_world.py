#!/usr/bin/env python3
"""Source of truth for World 2 (Gold). Writes app/src/worlds/w2/world.json.
Card line: part | part meaning | word | R/F"""
import json, os
import sys as _s; _s.path.insert(0, '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/work/art'); from word_defs import add_defs
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
OUT = os.path.join(ROOT, 'app/src/worlds/w2/world.json')

def cards(txt):
    out = []
    for ln in txt.strip().splitlines():
        p, m, w, rf = [x.strip() for x in ln.split('|')]
        out.append(dict(part=p, meaning=m, real=(rf == 'R'), word=w))
    return add_defs(out)

LV = []
def L(id, root, variants, type_, meaning, start=None, end=None):
    h = {}
    if start: h['start'] = {'cards': cards(start)}
    if end: h['end'] = {'cards': cards(end)}
    LV.append(dict(id=id, root=root, variants=variants, origin='Greek', type=type_,
                   meaning=meaning, art=f'art/{id}.webp', halves=h))

L('tele', 'tele', [], 'Prefix', 'far, far away', start="""
-phone | sound | telephone | R
-scope | look | telescope | R
-vision | seeing | television | R
-port | carry | teleport | R
-chair | seat | telechair | F
-soup | broth | telesoup | F
""")
L('auto', 'auto', [], 'Prefix', 'self', start="""
-graph | write | autograph | R
-mobile | moving | automobile | R
-matic | acting | automatic | R
-biography | life story | autobiography | R
-nap | short sleep | autonap | F
-puddle | little pool | autopuddle | F
""")
L('bio', 'bio', [], 'Root', 'life', start="""
-logy | study of | biology | R
-graphy | writing | biography | R
-degradable | breaks down | biodegradable | R
-nose | sniffer | bionose | F
-spoon | scoop | biospoon | F
-hat | cap | biohat | F
""")
L('geo', 'geo', [], 'Root', 'earth', start="""
-graphy | describing | geography | R
-logy | study of | geology | R
-metry | measuring | geometry | R
-naut | sailor | geonaut | F
-cookie | sweet treat | geocookie | F
-pillow | soft cushion | geopillow | F
""")
L('photo', 'photo', [], 'Root', 'light', start="""
-graph | write | photograph | R
-synthesis | putting together | photosynthesis | R
-copy | copy | photocopy | R
-naut | sailor | photonaut | F
-sneeze | achoo | photosneeze | F
-pickle | sour snack | photopickle | F
""")
L('logy', 'logy', ['ology'], 'Suffix', 'the study of', end="""
techno- | skill | technology | R
zoo- | animals | zoology | R
myth- | old stories | mythology | R
eco- | home | ecology | R
sock- | foot warmer | sockology | F
toast- | crispy bread | toastology | F
""")
L('scope', 'scope', [], 'Root', 'look at', end="""
tele- | far | telescope | R
micro- | small | microscope | R
peri- | around | periscope | R
kaleido- | beautiful shapes | kaleidoscope | R
geo- | earth | geoscope | F
nose- | sniffer | nosescope | F
""")
L('meter', 'meter', [], 'Root', 'measure', end="""
thermo- | heat | thermometer | R
speedo- | speed | speedometer | R
peri- | around | perimeter | R
dia- | across | diameter | R
sleepo- | sleep | sleepometer | F
giggle- | laugh | gigglemeter | F
""")
L('cycl', 'cycl', ['cycle'], 'Root', 'circle, wheel', start="""
-one | whirling | cyclone | R
-ist | one who | cyclist | R
-ops | eye | cyclops | R
-onaut | sailor | cyclonaut | F
-ish | sort of | cyclish | F
-ness | state of | cycleness | F
""", end="""
bi- | two | bicycle | R
tri- | three | tricycle | R
uni- | one | unicycle | R
motor- | engine | motorcycle | R
banana- | yellow fruit | bananacycle | F
sofa- | couch | sofacycle | F
""")
L('therm', 'therm', [], 'Root', 'heat', start="""
-ometer | measure | thermometer | R
-ostat | standing still | thermostat | R
-al | about | thermal | R
-onaut | sailor | thermonaut | F
-oboot | shoe | thermoboot | F
-ojelly | wobbly treat | thermojelly | F
""")
L('astro', 'astro', [], 'Root', 'star', start="""
-naut | sailor | astronaut | R
-nomy | arranging | astronomy | R
-logy | study of | astrology | R
-phone | sound | astrophone | F
-puppy | young dog | astropuppy | F
-cookie | sweet treat | astrocookie | F
""")
L('hydr', 'hydr', [], 'Root', 'water', start="""
-ant | thing that | hydrant | R
-ate | to give | hydrate | R
-ogen | maker | hydrogen | R
-onaut | sailor | hydronaut | F
-ofork | prongs | hydrofork | F
-otoast | crispy bread | hydrotoast | F
""")
L('chron', 'chron', [], 'Root', 'time', start="""
-ological | in order | chronological | R
-icle | record | chronicle | R
-ic | lasting | chronic | R
-ozebra | striped horse | chronozebra | F
-obounce | hop | chronobounce | F
-opizza | cheesy pie | chronopizza | F
""")
L('dynam', 'dynam', [], 'Root', 'power', start="""
-ite | stuff | dynamite | R
-ic | full of | dynamic | R
-o | machine | dynamo | R
-ish | sort of | dynamish | F
-ful | full of | dynamful | F
-ness | state of | dynamness | F
""")
L('aero', 'aero', [], 'Root', 'air', start="""
-dynamic | power | aerodynamic | R
-space | space | aerospace | R
-sol | liquid mix | aerosol | R
-bics | life | aerobics | R
-fish | swimmer | aerofish | F
-noodle | pasta | aeronoodle | F
""")
L('saur', 'saur', [], 'Root', 'lizard', end="""
dino- | terrible | dinosaur | R
ptero- | wing | pterosaur | R
plesio- | near | plesiosaur | R
toaster- | bread warmer | toastersaur | F
kitty- | little cat | kittysaur | F
pizza- | cheesy pie | pizzasaur | F
""")

world = {
  "id": "w2", "order": 2, "name": "Gold",
  "theme": {
    "name": "gold",
    "bg": "#13100B",
    "bg2": "#1E180F",
    "accent": "#E9B949",
    "foil": ["#8A5A12", "#F6D57E", "#C48A22"],
    "glitter": "#F2C866",
    "particle": "dust"
  },
  "levels": LV,
}
json.dump(world, open(OUT, 'w'), indent=2, ensure_ascii=False)
print('wrote', OUT, len(LV), 'levels')
