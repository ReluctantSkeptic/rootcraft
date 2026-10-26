# Curated, hand-checked game dataset for Rootcraft.
# Rule: every word sum must concatenate EXACTLY to the word (no silent-e or
# doubling changes), and every etymology was checked to come from the named
# Latin/Greek element. When in doubt, the word was left out.
#
# Morpheme fields:
#   id, type (prefix|base|suffix), label (shown), forms (surface spellings),
#   meaning (kid gloss), origin, tier (from data/roots.json, 3 = concrete extra)
#   mint: how Mint uses it (see app.js)

M = []
def P(id, forms, meaning, origin, tier, adv=None, adj=None, neg=False):
    M.append(dict(id=id, type='prefix', label=forms[0], forms=forms, meaning=meaning, origin=origin, tier=tier,
                  mint=dict(adv=adv or meaning.split(';')[0], adj=adj, neg=neg)))
def B(id, forms, meaning, origin, tier, verb=None, noun=None, mint_form=None, label=None):
    M.append(dict(id=id, type='base', label=label or '/'.join(forms), forms=forms, meaning=meaning, origin=origin, tier=tier,
                  mint=dict(verb=verb, noun=noun, form=mint_form or forms[0])))
def S(id, forms, meaning, origin, tier, kind):
    M.append(dict(id=id, type='suffix', label=forms[0], forms=forms, meaning=meaning, origin=origin, tier=tier,
                  mint=dict(kind=kind)))

# ---------- prefixes ----------
P('re', ['re'], 'again; back', 'Latin', 1, adv='again')
P('un', ['un'], 'not', 'Old English', 1, neg=True)
P('in_not', ['in', 'im'], 'not', 'Latin', 1, neg=True)
P('in_into', ['in', 'im'], 'in; into', 'Latin', 1, adv='inward', adj='inner')
P('dis', ['dis', 'dif'], 'apart; not', 'Latin', 1, adv='apart', adj='scattered')
P('de', ['de'], 'down; away', 'Latin', 1, adv='down and away', adj='downward')
P('ex', ['ex', 'e', 'ef'], 'out', 'Latin', 1, adv='out', adj='outer')
P('pre', ['pre'], 'before', 'Latin', 1, adv='ahead of time', adj='early')
P('pro', ['pro'], 'forward', 'Latin', 1, adv='forward', adj='forward')
P('sub', ['sub', 'sup', 'suf'], 'under', 'Latin', 1, adv='from underneath', adj='underground')
P('con', ['con', 'com', 'cor'], 'together; with', 'Latin', 1, adv='together', adj='shared')
P('trans', ['trans', 'tran'], 'across', 'Latin', 1, adv='across', adj='traveling')
P('inter', ['inter'], 'between', 'Latin', 1, adv='in between', adj='in-between')
P('ad', ['ad', 'ac', 'at', 'as'], 'to; toward', 'Latin', 1, adv='toward you', adj='nearby')
P('ab', ['ab'], 'away from', 'Latin', 2, adv='away', adj='faraway')
P('ob', ['ob', 'of'], 'against; toward', 'Latin', 2, adv='against something', adj='blocking')
P('per', ['per'], 'through; completely', 'Latin', 2, adv='all the way through', adj='complete')
P('super', ['super'], 'above; beyond', 'Latin', 1, adv='from above', adj='super')
P('intro', ['intro'], 'inward', 'Latin', 3, adv='inward', adj='inner')
P('contra', ['contra'], 'against', 'Latin', 2, adv='the opposite way', adj='opposite')
P('post', ['post'], 'after', 'Latin', 3, adv='afterward', adj='later')
P('retro', ['retro'], 'backward', 'Latin', 3, adv='backward', adj='old-time')
P('tele', ['tele'], 'far away', 'Greek', 2, adv='from far away', adj='faraway')
P('auto', ['auto'], 'self', 'Greek', 2, adv='all by itself', adj='self-made')
P('micro', ['micro'], 'very small', 'Greek', 3, adv='a tiny bit', adj='tiny')
P('mega', ['mega'], 'huge', 'Greek', 3, adv='hugely', adj='giant')
P('peri', ['peri'], 'around', 'Greek', 3, adv='all around', adj='surrounding')
P('dia', ['dia'], 'through; across', 'Greek', 2, adv='straight across', adj='crosswise')
P('para', ['para'], 'beside', 'Greek', 2, adv='alongside', adj='side-by-side')
P('sym', ['sym'], 'together; same', 'Greek', 2, adv='together', adj='matching')
P('uni', ['uni'], 'one', 'Latin', 2, adv='as one', adj='single')
P('bi', ['bi'], 'two', 'Latin', 3, adv='twice', adj='double')
P('tri', ['tri'], 'three', 'Latin/Greek', 3, adv='three times', adj='triple')
P('centi', ['centi'], 'hundred; hundredth', 'Latin', 3, adv='a hundred times', adj='hundred-fold')

# ---------- bases ----------
V = lambda b, s, pp, ing: dict(base=b, s=s, pp=pp, ing=ing)
B('port', ['port'], 'carry', 'Latin', 1, verb=V('carry', 'carries', 'carried', 'carrying'))
B('spect', ['spect'], 'look', 'Latin', 1, verb=V('look at', 'looks at', 'looked at', 'looking at'))
B('dict', ['dict'], 'say', 'Latin', 1, verb=V('say', 'says', 'said', 'saying'))
B('duc', ['duct', 'duc'], 'lead', 'Latin', 1, verb=V('lead', 'leads', 'led', 'leading'), label='duc/duct')
B('fac', ['fact', 'fect'], 'make; do', 'Latin', 1, verb=V('make', 'makes', 'made', 'making'), label='fac/fact/fect')
B('vis', ['vis', 'vid'], 'see', 'Latin', 1, verb=V('see', 'sees', 'seen', 'seeing'))
B('vert', ['vert', 'vers', 'verse'], 'turn', 'Latin', 1, verb=V('turn', 'turns', 'turned', 'turning'), label='vert/vers')
B('struct', ['struct'], 'build', 'Latin', 1, verb=V('build', 'builds', 'built', 'building'))
B('ject', ['ject'], 'throw', 'Latin', 1, verb=V('throw', 'throws', 'thrown', 'throwing'))
B('cap', ['capt', 'cap', 'cept', 'ceive'], 'take; seize', 'Latin', 1, verb=V('grab', 'grabs', 'grabbed', 'grabbing'), mint_form='capt', label='cap/cept/ceive')
B('form', ['form'], 'shape', 'Latin', 1, verb=V('shape', 'shapes', 'shaped', 'shaping'))
B('mit', ['mit', 'miss'], 'send', 'Latin', 1, verb=V('send', 'sends', 'sent', 'sending'), label='mit/miss')
B('mot', ['mot', 'mote', 'mob'], 'move', 'Latin', 1, verb=V('move', 'moves', 'moved', 'moving'), label='mot/mob')
B('fer', ['fer'], 'carry; bring', 'Latin', 1, verb=V('bring', 'brings', 'brought', 'bringing'))
B('phon', ['phon', 'phone'], 'sound; voice', 'Greek', 1, noun=dict(sg='sound', pl='sounds'), mint_form='phono', label='phon/phone')
B('graph', ['graph', 'gram'], 'write; draw', 'Greek', 1, verb=V('write', 'writes', 'written', 'writing'), label='graph/gram')
B('scrib', ['scribe', 'script'], 'write', 'Latin', 2, verb=V('write', 'writes', 'written', 'writing'), mint_form='script', label='scrib/script')
B('tract', ['tract'], 'pull; drag', 'Latin', 2, verb=V('pull', 'pulls', 'pulled', 'pulling'))
B('rupt', ['rupt'], 'break', 'Latin', 2, verb=V('break', 'breaks', 'broken', 'breaking'))
B('aud', ['aud', 'audi'], 'hear', 'Latin', 2, verb=V('hear', 'hears', 'heard', 'hearing'))
B('ped', ['ped'], 'foot', 'Latin', 2, noun=dict(sg='foot', pl='feet'))
B('manu', ['manu'], 'hand', 'Latin', 2, noun=dict(sg='hand', pl='hands'))
B('geo', ['geo'], 'earth', 'Greek', 2, noun=dict(sg='the earth', pl='earths'))
B('bio', ['bio'], 'life', 'Greek', 2, noun=dict(sg='life', pl='living things'))
B('photo', ['photo'], 'light', 'Greek', 2, noun=dict(sg='light', pl='lights'))
B('scope', ['scope'], 'look at', 'Greek', 3, verb=V('look at', 'looks at', 'looked at', 'looking at'))
B('meter', ['meter', 'metr'], 'measure', 'Greek', 2, verb=V('measure', 'measures', 'measured', 'measuring'))
B('cycl', ['cycle', 'cycl'], 'circle; wheel', 'Greek', 2, noun=dict(sg='a wheel', pl='wheels'), mint_form='cyclo', label='cycl/cycle')
B('astro', ['astro', 'aster'], 'star', 'Greek', 2, noun=dict(sg='a star', pl='stars'))
B('therm', ['therm', 'thermo'], 'heat', 'Greek', 3, noun=dict(sg='heat', pl='heat'), mint_form='thermo')
B('aqua', ['aqua', 'aque'], 'water', 'Latin', 3, noun=dict(sg='water', pl='water'))
B('press', ['press'], 'push; squeeze', 'Latin', 2, verb=V('squeeze', 'squeezes', 'squeezed', 'squeezing'))
B('sign', ['sign'], 'mark', 'Latin', 2, verb=V('mark', 'marks', 'marked', 'marking'))
B('vent', ['vent', 'vene'], 'come', 'Latin', 2, verb=V('come', 'comes', 'come', 'coming'), label='ven/vent')
B('sect', ['sect'], 'cut', 'Latin', 2, verb=V('cut', 'cuts', 'cut', 'cutting'))
B('dent', ['dent'], 'tooth', 'Latin', 3, noun=dict(sg='a tooth', pl='teeth'), mint_form='denti')
B('mar', ['mar'], 'sea', 'Latin', 3, noun=dict(sg='the sea', pl='seas'), mint_form='mari')
B('chron', ['chrono'], 'time', 'Greek', 2, noun=dict(sg='time', pl='time'), label='chron')
B('zoo', ['zoo'], 'animal', 'Greek', 3, noun=dict(sg='an animal', pl='animals'))
B('naut', ['naut'], 'sailor', 'Greek', 3, noun=dict(sg='a sailor', pl='sailors'))

# ---------- suffixes ----------
S('er', ['er'], 'one who; thing that', 'Old English', 1, 'agent')
S('or', ['or'], 'one who; thing that', 'Latin', 1, 'agent')
S('ion', ['ion'], 'act or result of', 'Latin', 1, 'act')
S('ation', ['ation'], 'act or result of', 'Latin', 1, 'act')
S('able', ['able'], 'can be', 'Latin', 1, 'able')
S('ible', ['ible'], 'can be', 'Latin', 1, 'able')
S('ive', ['ive'], 'tending to', 'Latin', 1, 'tend')
S('al', ['al'], 'relating to', 'Latin', 1, 'rel')
S('ic', ['ic'], 'relating to', 'Greek', 1, 'rel')
S('ure', ['ure'], 'act or result of', 'Latin', 2, 'act')
S('ist', ['ist'], 'person who does', 'Greek', 2, 'expert')
S('ence', ['ence'], 'state or act of', 'Latin', 1, 'act')
S('ity', ['ity'], 'state or quality of', 'Latin', 1, 'act')
S('ory', ['ory'], 'place for', 'Latin', 1, 'place')
S('ary', ['ary'], 'relating to; place for', 'Latin', 1, 'place')
S('ate', ['ate'], 'to make; to do', 'Latin', 2, None)
S('ile', ['ile'], 'able to be; relating to', 'Latin', 3, None)
S('ine', ['ine'], 'relating to', 'Latin', 3, None)
S('oid', ['oid'], 'like; shaped like', 'Greek', 3, None)
S('y', ['y'], 'makes a thing or subject', 'Greek/Latin', 1, None)
S('ful', ['ful'], 'full of', 'Old English', 1, 'full')
S('less', ['less'], 'without', 'Old English', 1, 'less')
S('logy', ['logy'], 'study of', 'Greek', 2, 'study')
# Greek endings usable only in Mint (bases above, offered in the end slot):
MINT_ENDINGS = ['scope', 'graph', 'meter', 'phon', 'naut', 'logy']

# ---------- words (word | sum | kid definition) ----------
# "~id" pins a part to a morpheme when its spelling is shared (in = into by default).
WORDS = """
portable | port+able | easy to carry around
porter | port+er | a person who carries bags
report | re+port | to bring back news of what happened
reporter | re+port+er | a person who brings us the news
import | im+port | to bring goods into a country
importer | im+port+er | a business that brings goods in
export | ex+port | to send goods out of a country
exporter | ex+port+er | a business that sends goods out
transport | trans+port | to carry from one place to another
transportation | trans+port+ation | ways of moving people and things
support | sup+port | to hold something up
supporter | sup+port+er | someone who is on your side
supportive | sup+port+ive | helpful and caring
deport | de+port | to send someone out of a country
inspect | in+spect | to look closely at something
inspector | in+spect+or | a person whose job is to look closely
inspection | in+spect+ion | a careful look
respect | re+spect | to look up to someone
respectful | re+spect+ful | polite and kind to others
respectable | re+spect+able | good enough to be looked up to
disrespect | dis+re+spect | rudeness; not showing respect
prospect | pro+spect | a chance of something in the future
predict | pre+dict | to say what will happen before it does
prediction | pre+dict+ion | a guess about the future
predictable | pre+dict+able | easy to guess ahead of time
unpredictable | un~un+pre+dict+able | impossible to guess ahead of time
contradict | contra+dict | to say the opposite
contradiction | contra+dict+ion | two things that can't both be true
diction | dict+ion | the way you say your words
dictionary | dict+ion+ary | a book that tells what words mean
dictate | dict+ate | to say words for someone to write down
duct | duct | a tube that leads air or water
product | pro+duct | something that is made
production | pro+duct+ion | the making of something
productive | pro+duct+ive | getting a lot done
conduct | con+duct | to lead or guide
conductor | con+duct+or | a person who leads a band or a train
deduct | de+duct | to take away an amount
reduction | re+duct+ion | making something smaller
introduction | intro+duct+ion | the first part that leads you in
educate | e+duc+ate | to teach
education | e+duc+ation | learning and teaching
aqueduct | aque+duct | a bridge that carries water
fact | fact | something that is really true
factory | fact+ory | a place where things are made
factor | fact+or | one thing that helps make a result
manufacture | manu+fact+ure | to make things, often with machines
perfect | per+fect | made completely, with no mistakes
perfection | per+fect+ion | being perfect
effect | ef+fect | what happens because of something
defect | de+fect | a flaw or mistake in how something is made
infection | in+fect+ion | germs getting into your body
vision | vis+ion | the ability to see
visible | vis+ible | able to be seen
invisible | in~in_not+vis+ible | not able to be seen
television | tele+vis+ion | a screen that shows faraway pictures
revision | re+vis+ion | a changed, improved version
supervision | super+vis+ion | watching over someone
evidence | e+vid+ence | proof you can see
visionary | vis+ion+ary | someone who imagines the future
convert | con+vert | to change something into something else
convertible | con+vert+ible | a car whose roof folds back
invert | in+vert | to turn upside down
vertical | vert+ic+al | standing straight up and down
version | vers+ion | one form of something
conversion | con+vers+ion | a change from one thing to another
reverse | re+verse | to go backward
universe | uni+verse | everything that exists, all as one
university | uni+vers+ity | a school for grown-up learning
structure | struct+ure | something that has been built
construct | con+struct | to build
construction | con+struct+ion | the work of building
constructive | con+struct+ive | helpful, building things up
reconstruct | re+con+struct | to build again
destruction | de+struct+ion | the wrecking of something
destructive | de+struct+ive | causing damage
instruct | in+struct | to teach how to do something
instructor | in+struct+or | a teacher or coach
instruction | in+struct+ion | a step that tells you what to do
project | pro+ject | a big piece of work; to throw forward
projector | pro+ject+or | a machine that throws a picture onto a wall
projection | pro+ject+ion | a picture thrown onto a screen
projectile | pro+ject+ile | an object that is thrown or shot
reject | re+ject | to say no to something
rejection | re+ject+ion | being turned down
inject | in+ject | to push medicine in with a needle
injection | in+ject+ion | a shot from the doctor
eject | e+ject | to throw or push out
object | ob+ject | a thing; also, to disagree
objection | ob+ject+ion | a reason you disagree
subject | sub+ject | a topic, like math or science
capture | capt+ure | to catch
captive | capt+ive | someone who has been caught
capable | cap+able | able to do something well
accept | ac+cept | to take what is offered
acceptable | ac+cept+able | good enough
reception | re+cept+ion | a welcome party; a signal you pick up
receptionist | re+cept+ion+ist | a person who greets visitors
receive | re+ceive | to get something
except | ex+cept | leaving out
exception | ex+cept+ion | something left out of a rule
concept | con+cept | an idea
intercept | inter+cept | to catch something on its way
deceive | de+ceive | to trick someone
form | form | a shape; to make a shape
formal | form+al | fancy and proper
informal | in~in_not+form+al | relaxed and casual
formation | form+ation | a shape made by things lined up
reform | re+form | to change for the better
transform | trans+form | to change shape completely
transformation | trans+form+ation | a big change
uniform | uni+form | clothes that make everyone look the same
inform | in+form | to tell someone facts
information | in+form+ation | facts about something
conform | con+form | to follow the same pattern as others
deform | de+form | to bend out of shape
mission | miss+ion | an important job you are sent to do
missile | miss+ile | an object sent flying through the air
transmit | trans+mit | to send a signal across
transmission | trans+miss+ion | a message or signal sent out
submit | sub+mit | to hand in
submission | sub+miss+ion | something handed in
permit | per+mit | to let something happen
permission | per+miss+ion | being allowed
admit | ad+mit | to let in; to say something is true
admission | ad+miss+ion | being let in
emit | e+mit | to send out, like light or smoke
dismiss | dis+miss | to send away
intermission | inter+miss+ion | a break in the middle of a show
motion | mot+ion | movement
motor | mot+or | a machine that makes things move
emotion | e+mot+ion | a feeling that moves you
motive | mot+ive | the reason someone does something
promotion | pro+mot+ion | a move up to a better job
remote | re+mote | far away; a controller for the TV
mobile | mob+ile | able to move around
automobile | auto+mob+ile | a car: it moves by itself
transfer | trans+fer | to move from one place to another
offer | of+fer | to hold something out to give
prefer | pre+fer | to like one thing better
preference | pre+fer+ence | the one you like better
refer | re+fer | to send someone to look at something
reference | re+fer+ence | a source you look things up in
conference | con+fer+ence | a big meeting
difference | dif+fer+ence | the way two things are not alike
suffer | suf+fer | to feel pain
infer | in+fer | to figure out from clues
telephone | tele+phone | a device for faraway talking
microphone | micro+phone | a device that makes small sounds loud
megaphone | mega+phone | a cone that makes your voice huge
symphony | sym+phon+y | music where instruments sound together
phonic | phon+ic | about the sounds of speech
graph | graph | a drawing that shows numbers
graphic | graph+ic | a picture or drawing
autograph | auto+graph | a person's own written name
photograph | photo+graph | a picture made with light
photographer | photo+graph+er | a person who takes pictures
paragraph | para+graph | a group of sentences
biography | bio+graph+y | the written story of someone's life
autobiography | auto+bio+graph+y | the story of your life, written by you
geography | geo+graph+y | the study of places on Earth
telegraph | tele+graph | an old machine that sent written messages far
diagram | dia+gram | a drawing that explains something
telegram | tele+gram | a written message sent far by wire
scribe | scribe | a person who writes things by hand
script | script | the written words for a play or movie
describe | de+scribe | to tell what something is like
description | de+script+ion | words that tell what something is like
subscribe | sub+scribe | to sign up
subscription | sub+script+ion | a sign-up for something that keeps coming
prescription | pre+script+ion | a doctor's written order for medicine
manuscript | manu+script | a book written by hand
inscription | in+script+ion | words carved or written on something
postscript | post+script | a note added after a letter (P.S.)
transcript | tran+script | a written copy of what was said
tractor | tract+or | a machine that pulls heavy loads
traction | tract+ion | grip that keeps wheels from slipping
attract | at+tract | to pull toward
attraction | at+tract+ion | something that pulls people in
attractive | at+tract+ive | nice to look at
subtract | sub+tract | to take away
subtraction | sub+tract+ion | taking one number away from another
distract | dis+tract | to pull attention away
distraction | dis+tract+ion | something that pulls your attention away
extract | ex+tract | to pull out
contract | con+tract | a written deal; to shrink
retract | re+tract | to pull back in
rupture | rupt+ure | a break or burst
erupt | e+rupt | to burst out
eruption | e+rupt+ion | a volcano bursting out
interrupt | inter+rupt | to break in while someone is talking
interruption | inter+rupt+ion | a break in the middle of something
disrupt | dis+rupt | to break up or mess up
disruptive | dis+rupt+ive | causing trouble
abrupt | ab+rupt | sudden
corrupt | cor+rupt | rotten or dishonest
audible | aud+ible | loud enough to hear
inaudible | in~in_not+aud+ible | too quiet to hear
audience | audi+ence | the people who listen or watch
pedal | ped+al | a lever you push with your foot
biped | bi+ped | an animal that walks on two feet
manual | manu+al | done by hand; a how-to book
geology | geo+logy | the study of rocks and the earth
geometry | geo+metr+y | the math of shapes and measuring
geothermal | geo+therm+al | heat from deep inside the earth
biology | bio+logy | the study of living things
zoology | zoo+logy | the study of animals
telescope | tele+scope | a tool for looking at faraway things
microscope | micro+scope | a tool for looking at tiny things
periscope | peri+scope | a tube for looking around, used in submarines
thermometer | thermo+meter | a tool that measures heat
diameter | dia+meter | the distance straight across a circle
perimeter | peri+meter | the distance all around a shape
centimeter | centi+meter | one hundredth of a meter
symmetry | sym+metr+y | when both sides match
bicycle | bi+cycle | a bike with two wheels
tricycle | tri+cycle | a bike with three wheels
unicycle | uni+cycle | a bike with one wheel
recycle | re+cycle | to use again
cyclist | cycl+ist | a person who rides a bike
astronaut | astro+naut | a space traveler (a "star sailor")
asteroid | aster+oid | a space rock (named for looking like a star)
disaster | dis+aster | something terrible ("bad star")
thermal | therm+al | about heat; warm
press | press | to push
pressure | press+ure | a pushing force
express | ex+press | to show what you think or feel
expression | ex+press+ion | a look on your face; a saying
impress | im+press | to make people think you are great
impression | im+press+ion | a feeling you get about someone
compress | com+press | to squeeze together
compressor | com+press+or | a machine that squeezes air
depress | de+press | to push down
suppress | sup+press | to hold back
sign | sign | a mark that shows something
signal | sign+al | a sign that sends a message
design | de+sign | a plan or pattern
assign | as+sign | to give someone a job
event | e+vent | something that happens
invent | in+vent | to make something new
invention | in+vent+ion | a new thing someone made up
inventor | in+vent+or | a person who invents
prevent | pre+vent | to stop something before it happens
prevention | pre+vent+ion | stopping something ahead of time
adventure | ad+vent+ure | an exciting trip
convention | con+vent+ion | a big gathering
section | sect+ion | a part cut off from the rest
insect | in+sect | a bug whose body looks cut into parts
bisect | bi+sect | to cut into two equal parts
intersection | inter+sect+ion | where two roads cut across each other
dissect | dis+sect | to cut apart to study
dentist | dent+ist | a tooth doctor
dental | dent+al | about teeth
trident | tri+dent | a spear with three prongs ("teeth")
marine | mar+ine | about the sea
submarine | sub+mar+ine | a ship that goes under the sea
"""

# Words kids may know that belong to a family but aren't used in word sums
# (Grow + Sort accept them). Each checked against its etymology.
FAMILY_EXTRA = {
    'port': ['portfolio'],
    'spect': ['spectator', 'spectacular', 'spectacles', 'expect', 'suspect', 'aspect', 'perspective'],
    'dict': ['verdict', 'dictator'],
    'duc': ['produce', 'reduce', 'introduce'],
    'fac': ['affect'],
    'vis': ['video', 'visit', 'visitor', 'visual', 'revise', 'supervise', 'provide'],
    'vert': ['versus', 'anniversary', 'divert', 'introvert', 'extrovert'],
    'struct': ['infrastructure', 'obstruct'],
    'ject': ['adjective', 'trajectory'],
    'cap': ['captivate', 'perceive', 'conceive'],
    'form': ['format', 'formula', 'platform'],
    'mit': ['promise', 'commit', 'omit'],
    'mot': ['move', 'movement', 'remove', 'promote', 'motivate', 'motorcycle'],
    'fer': [],
    'phon': ['phone', 'headphones', 'earphones', 'saxophone', 'xylophone', 'phonics'],
    'graph': ['grammar', 'program'],
    'scrib': ['scribble', 'scripture', 'prescribe', 'inscribe'],
    'tract': [],
    'rupt': ['bankrupt'],
    'aud': ['audio', 'audition', 'auditorium', 'audit'],
    'ped': ['pedestrian', 'centipede', 'pedicure', 'pedestal', 'expedition'],
    'manu': ['manicure', 'manipulate'],
    'geo': ['geode'],
    'bio': ['biologist', 'antibiotic', 'biome'],
    'photo': ['photo', 'photosynthesis', 'photocopy'],
    'scope': ['stethoscope', 'kaleidoscope'],
    'meter': ['metric', 'kilometer', 'speedometer', 'barometer'],
    'cycl': ['cycle', 'motorcycle', 'encyclopedia'],
    'astro': ['astronomy', 'astronomer'],
    'therm': ['thermos', 'thermostat'],
    'aqua': ['aquarium', 'aquatic', 'aquamarine'],
    'press': [],
    'sign': ['signature', 'significant'],
    'vent': ['venue', 'convenient'],
    'sect': ['sector'],
    'dent': ['denture'],
    'mar': ['mariner', 'maritime', 'aquamarine'],
}

# Sort: look-alike words that do NOT come from the root.
TRAPS = {
    'ped': [('pediatrician', 'From Greek paid- "child": a children\'s doctor.'),
            ('encyclopedia', 'The -pedia part is Greek paideia "teaching", from paid- "child".'),
            ('torpedo', 'Latin torpedo, "numbness": the name of a fish with an electric shock.')],
    'mit': [('mitten', 'From Old French mitaine, nothing to do with sending.'),
            ('missing', 'From Old English missan, "to fail to hit".'),
            ('summit', 'From Latin summum, "the highest point".')],
    'fer': [('ferry', 'From Old English ferian, "to carry across water". A cousin, not a child, of fer.'),
            ('fern', 'From Old English fearn, the plant.')],
    'cap': [('captain', 'From Latin caput, "head": the head of the team.'),
            ('capital', 'Also from caput, "head": the head city.')],
    'form': [('perform', 'From Old French parfornir, "to carry out". It only looks like form.'),
             ('formidable', 'From Latin formido, "fear".')],
    'aud': [('applaud', 'From Latin plaudere, "to clap".'),
            ('fraud', 'From Latin fraus, "a trick".')],
    'manu': [('human', 'From Latin humanus, "of people".'),
             ('woman', 'From Old English wifmann.'),
             ('mansion', 'From Latin manere, "to stay".')],
    'astro': [('master', 'From Latin magister, "teacher".'),
              ('plaster', 'From Greek emplastron, "something spread on".')],
    'dent': [('accident', 'From Latin cadere, "to fall".'),
             ('student', 'From Latin studere, "to be eager".'),
             ('president', 'From Latin sedere, "to sit": the one who sits in front.')],
    'mar': [('market', 'From Latin mercatus, "trading".'),
            ('marble', 'From Latin marmor, the stone.')],
    'vent': [('venom', 'From Latin venenum, "poison".'),
             ('ventriloquist', 'From Latin venter, "belly", plus loqui, "speak".')],
    'meter': [('meteor', 'From Greek meteoron, "thing high in the air".')],
    'mot': [('moth', 'From Old English moththe, the insect.'),
            ('motto', 'From Italian motto, "a word".')],
    'phon': [('phony', 'Probably from fawney, an old slang word for a fake ring.')],
    'press': [('cypress', 'From Greek kyparissos, the tree.')],
    'vis': [('divide', 'From Latin dividere, "to separate". The vid is not "see".'),
            ('avid', 'From Latin avidus, "eager".')],
    'port': [('portion', 'From Latin portio, "a share". Related to part, not carry.')],
}

# "Never seen it" challenges: rarer words built only from known parts.
CHALLENGES = """
retrospect | retro+spect | looking back at the past | a pair of glasses | a fear of spiders
interject | inter+ject | to throw a remark in while others talk | to shoot a basketball | to hide something
tractable | tract+able | easy to lead or manage | very heavy | full of tractors
teleport | tele+port | to move instantly to a faraway place | to shout across a room | to fix a television
abrupt | ab+rupt | sudden, like something broken off | very slow and smooth | deep underground
transcript | tran+script | a written copy of what was said | a magic spell | a train ticket
biped | bi+ped | an animal that walks on two feet | a bike with two seats | a pair of shoes
edict | e+dict | an official order spoken out | a small dictionary | a secret
emit | e+mit | to send out, like light or smoke | to forget | to swallow
deport | de+port | to send someone away from a country | to carry a big box | to dive underwater
perimeter | peri+meter | the distance all the way around | a tiny ruler | the middle of a circle
chronometer | chrono+meter | a very exact clock | a time machine | a weather map
periscope | peri+scope | a tube for looking around | a map of the sea | a fear of heights
microbiology | micro+bio+logy | the study of tiny living things | a very short story | a small laboratory
intervene | inter+vene | to come between to help | to plant vines | to say goodbye
introvert | intro+vert | someone who turns inward and recharges alone | a door that opens inward | a kind of car
retract | re+tract | to pull back in | to buy again | to draw a map
dissect | dis+sect | to cut apart to study | to explain loudly | to mix together
"""
