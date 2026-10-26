"""Rootcraft v9 comic card art: cast rotation + per-root action prompts.
Rotation: one global sequence over all 80 levels in world order (w1..w4, each world's level order);
animal = CAST[global_index % 10]. Period 10 => never the same animal on adjacent levels (also across
world boundaries) and exactly 8 cards per animal.
Run: python3 work/art/v9/prompts.py  -> work/art/v9/prompts.json
"""
import json, os
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
CASTJ = json.load(open(f'{ROOT}/work/art/v9/cast.json'))
CAST = [c['id'] for c in CASTJ['cast']]
DESC = {c['id']: (c['name'], c['desc']) for c in CASTJ['cast']}
DESC['rabbit'] = ('Pip the Rabbit', 'a small round chubby caramel-tan bunny kid with cream tummy and muzzle, pink nose, one ear up and one ear flopped over, wearing sunflower-yellow overalls')
DESC['raccoon'] = ('Rizzo the Raccoon', 'a grey raccoon with a black bandit eye mask, white face markings, big bushy black-and-grey ringed tail, wearing an orange hoodie, blue jeans and light-blue sneakers')

WORLD = {
 'w1': 'Palette: warm cream paper and ink-black linework with honey-gold #E9B949 as the main accent colour (props, highlights, the background disc), plus natural colours where needed.',
 'w2': 'Palette: warm golden world: rich amber-gold #C48A22 and pale gold #F6D57E dominate props, sky shapes and the background disc, plus natural colours where needed.',
 'w3': 'Palette: cool silver world: soft silver-blue-grey #A9B3BE and #C8D2DD dominate props and the background disc, with crisp white highlights, plus natural colours where needed.',
 'w4': 'Palette: amethyst world: lavender #C9A8F2 and violet #A775E6 with touches of rose pink #F0B6D6 dominate props and the background disc, plus natural colours where needed.',
}

A = {
# ---- w1 Ink
're':    'throwing a boomerang that is curving back around and returning to its paw, with a looping dotted motion trail showing it coming BACK again',
'in':    'firmly refusing: wings crossed in a big X in front of its chest, head turned away with eyes shut, saying NO to a plate of broccoli held out toward it',
'dis':   'pulling two halves of a big jigsaw puzzle piece APART, one half in each hand, with little separation motion lines between them',
'de':    'zooming DOWN a tall playground slide head first, ears flying, with strong downward speed lines',
'sub':   'piloting a little round golden submarine deep UNDER the water, waving out of the porthole; a wavy water surface line high above, bubbles and a small fish',
'pre':   'peeking excitedly through a gap in a red stage curtain BEFORE the show starts, one eye and a big grin showing',
'inter': 'lounging in a hammock strung BETWEEN two trees, one tree on each side of the picture',
'trans': 'balancing while walking ACROSS a river on a log from one bank to the other bank, arms out',
'super': 'flying high ABOVE the clouds like a superhero with a golden cape flapping, trunk pointing up and forward',
'con':   'snapping two big puzzle pieces TOGETHER with a satisfying click, little star sparkle where they join',
'graph': 'painting a cheerful picture of a sun and a little house on an easel canvas, brush in hand, paint palette in the other',
'dict':  'standing on a small wooden crate giving a big passionate speech, one wing raised, beak wide open, bold sound lines coming from its mouth (no speech bubble, no words)',
'duc':   'LEADING a neat line of three fluffy yellow ducklings who march behind it, the turtle proudly in front holding a small blank pennant flag',
'fac':   'MAKING a wooden toy car at a workbench, hammer raised mid-swing, wood shavings flying',
'vis':   'shading its eyes with one paw, eyes huge with wonder, SEEING a bright butterfly fluttering just in front of it',
'ex':    'bursting OUT of an open cardboard box with arms flung wide, the box flaps blown open',
'vert':  'TURNING a big wooden ship steering wheel with both hands, curved motion arcs showing the wheel spinning round',
'pro':   'sprinting FORWARD toward the viewer leaning way forward, one arm pointing ahead, speed lines behind',
'port':  'CARRYING a huge wobbling tower of suitcases and boxes stacked on its back, holding the top one steady with its trunk',
'struct':'BUILDING a little brick wall with a trowel, laying a brick on top, a stack of bricks beside it',
'ject':  'THROWING a ball with a big wind-up pitching pose, the ball flying off with a motion trail',
'form':  'SHAPING a lump of clay into a star shape on a potter\'s table, a clay circle and triangle beside it',
'spect': 'LOOKING through a long brass spyglass, one eye squinting, leaning forward curiously',
'mit':   'SENDING a letter: popping an envelope into a round-topped mailbox, on tiptoe',
'mot':   'MOVING fast on roller skates, zooming across with big motion lines and a dust puff behind',
'fer':   'BRINGING a big birthday cake on a tray, walking carefully toward the viewer with a proud smile',
'phon':  'blasting a shiny golden trumpet, cheeks puffed, big curved SOUND waves and a few music notes bursting out',
'scrib': 'WRITING with a feather quill on a long unrolled paper scroll, the writing shown only as wavy scribble lines (no real letters)',
'tract': 'PULLING a heavy red wagon full of watermelons by a rope gripped in its trunk, leaning back with effort',
'rupt':  'POPPING a big balloon with a pin, the balloon BURSTING with a star-shaped burst and flying bits, penguin flinching with surprise',
'aud':   'cupping one big ear with a paw, eyes closed blissfully, HEARING a little bird singing on a branch nearby (music notes)',
# ---- w2 Gold
'tele':  'waving both wings excitedly at a tiny hot-air balloon FAR, FAR AWAY on the distant horizon, a long rolling landscape stretching out',
'auto':  'taking a selfie of ITSELF: holding a camera at arm\'s length pointed back at its own grinning face',
'bio':   'gently watering a tiny green sprout with a watering can, a small butterfly and a ladybug nearby: new LIFE',
'geo':   'giving a big hug to a large globe of planet EARTH (blue oceans, green land) that is as big as its belly',
'photo': 'holding up a big glowing light bulb with bright rays of LIGHT bursting out, eyes squinting happily in the glow',
'logy':  'STUDYING a huge open book at a desk with a reading lamp, magnifying glass in hand, more books stacked (pages show only squiggles, no letters)',
'scope': 'peering into a microscope on a table, one eye pressed to the eyepiece',
'meter': 'MEASURING its own long trunk with a stretched-out tape measure (tick marks only, no numbers)',
'cycl':  'rolling a big round wooden wagon WHEEL along, running beside it, circular motion lines',
'therm': 'warming its paws by a crackling campfire, toasting a marshmallow on a stick, wavy HEAT lines rising',
'astro': 'reaching up on tiptoe to catch a falling golden STAR from a deep navy night-sky circle full of little stars',
'hydr':  'spraying a big arc of blue WATER from a garden hose, splashes and droplets everywhere',
'chron': 'holding a giant ticking alarm clock (tick marks only, no numbers), eyes wide, in a panicked hurry about the TIME',
'dynam': 'lifting a gigantic barbell high over its head with POWER, muscles bulging, the bar bending, power sparks',
'aero':  'hanging from a big kite that lifts it up into the AIR, feet dangling, swirly wind lines',
'saur':  'riding happily on the back of a friendly green cartoon dinosaur LIZARD, holding on to its neck',
# ---- w3 Silver
'uni':   'riding a UNICYCLE with exactly ONE wheel, arms out for balance',
'bi':    'riding a BICYCLE with exactly TWO wheels, trunk waving',
'tri':   'juggling exactly THREE balls in the air (one, two, three — no more)',
'quad':  'holding exactly FOUR colourful balloons on strings, one, two, three, four, clearly separated',
'oct':   'giving a high-five to a friendly purple-grey OCTOPUS with exactly EIGHT curly tentacles',
'dec':   'bowling: rolling a ball toward exactly TEN white bowling pins set up in a neat triangle (4-3-2-1)',
'cent':  'laughing as a very long, friendly CENTIPEDE with a HUNDRED tiny legs walks past in a long wavy line',
'mill':  'diving joyfully into a giant mountain of THOUSANDS of tiny shiny silver marbles',
'semi':  'cutting a big round cake exactly in HALF with a big knife, the two halves sliding apart',
'multi': 'balancing an ice-cream cone with MANY scoops stacked impossibly high, wobbling',
'mono':  'sitting ALONE on a tiny round desert island with ONE single palm tree, in the middle of the sea',
'du':    'drumming on exactly TWO identical drums, one drumstick in its trunk and one in its hand',
'kilo':  'straining to lift a gigantic heavy iron weight onto a big old-fashioned balance scale, sweat drops (no numbers)',
'equi':  'standing in the exact middle of a perfectly level seesaw, arms out, with two EQUAL identical boxes on each end, perfectly balanced',
'omni':  'happily hugging a huge plate piled with ALL kinds of food: fruit, vegetables, fish, bread and cheese',
'poly':  'rolling a big shiny faceted silver gem shape with MANY flat sides and corners',
'gon':   'standing inside a big silver HEXAGON outline frame, pointing up at one of its sharp CORNERS',
# ---- w4 Amethyst
'aqua':  'swimming happily in clear blue WATER with a snorkel mask, bubbles rising, a little fish nearby',
'ped':   'proudly lifting one big FOOT and wiggling its toes, a trail of funny footprints behind it',
'manu':  'pressing both paint-covered HANDS onto a big sheet of paper, colourful handprints all over it, hands up and grinning',
'dent':  'brushing its big shiny TEETH with a giant toothbrush, foamy bubbles, a huge toothy grin',
'terr':  'digging in rich brown EARTH with a shovel, a mound of soil and a little patch of LAND with a sprout',
'anim':  'jumping back amazed as a little wind-up toy robot springs to LIFE and starts dancing in front of it',
'viv':   'leaping high with joy, full of LIFE and energy, in a meadow of vivid flowers under a big sun',
'vor':   'EATING a gigantic sandwich, mouth chomping wide, cheeks stuffed, crumbs flying',
'spir':  'taking a big deep BREATH and blowing on a dandelion, the seeds floating away on the breeze',
'flor':  'holding a big bouquet of colourful FLOWERS, eyes closed, sniffing them happily',
'avi':   'standing still with a gentle smile while three little BIRDS perch on its outstretched arm and head',
'opt':   'trying on a pair of giant round magnifying glasses that make its EYES look enormous',
'cardi': 'listening to its own HEART with a doctor\'s stethoscope, a big red heart shape glowing on its chest, little hearts floating',
'arbor': 'hugging and climbing the trunk of a big leafy TREE, tail curled around it',
'lingu': 'sticking out its TONGUE to lick a giant swirly lollipop',
'derm':  'rubbing sunscreen lotion onto its arm (SKIN) on a sunny beach, a lotion bottle (no label text) beside it',
}

TEMPLATE = ("Square 1:1 illustration for a children's word-game card. The character MUST be exactly the character in the attached model sheet: {name}, {desc}. "
 "Keep the same body shape, colours, markings and outfit as the model sheet. ACTION: the {animal} is {action}. "
 "Composition: one single character (only one {animal}), full body, centred, large and instantly readable even when the card is small, comfortable margin all around so nothing important touches the edges; only a few simple props. "
 "Style: modern 2010s TV cartoon-shorts animation style: bold, confident brush-weight black ink outlines with lively thick-thin line variation, flat cel colours with at most one flat shadow tone, squash-and-stretch, rubbery dynamic pose, big expressive eyes. "
 "Background: flat cream paper (#F5F0E6) with one large simple flat round disc of the world accent colour behind the character. {world} "
 "Must NOT contain: any text, letters, numbers, words, signature, watermark, border, frame, extra characters of the same species, extra limbs or fingers.")

def build():
    out = []; gi = 0
    for w in ['w1', 'w2', 'w3', 'w4']:
        d = json.load(open(f'{ROOT}/app/src/worlds/{w}/world.json'))
        for lv in d['levels']:
            an = CAST[gi % 10]; name, desc = DESC[an]
            out.append(dict(world=w, id=lv['id'], root=lv['root'], meaning=lv['meaning'], animal=an, gi=gi,
                            ref=f'{ROOT}/work/art/v9/cast/cast-{an}.png',
                            prompt=TEMPLATE.format(name=name, desc=desc, animal=an, action=A[lv['id']], world=WORLD[w])))
            gi += 1
    return out

if __name__ == '__main__':
    o = build(); json.dump(o, open(f'{ROOT}/work/art/v9/prompts.json', 'w'), indent=1)
    from collections import Counter; print(len(o), Counter(x['animal'] for x in o))
