#!/usr/bin/env python3
"""World 1 "Ink" authoring source (Rootcraft v6).

Run `python3 app/src/levels.py` to regenerate app/src/worlds/w1/world.json.
The build reads world.json only; this file is just a compact way to write it.

Half blocks, one card per line:
  real:  part | part meaning | word | kid meaning of the word
  fake:  part | part meaning | spelled made-up word        (3 fields = fake)
`start` = root at the BEGINNING (parts are endings, "-able").
`end`   = root at the END (parts are beginnings, "trans-").
"""
import json, os

THEME = dict(name='ink', bg='#121110', bg2='#1B1917', accent='#E9B949',
             foil=['#F7DE92', '#C99A3A', '#F3E3B0', '#A9D3C8', '#CBB1E6', '#F0C866', '#B8862C'], glitter='#E9D9B4', particle='dust')
LEVELS = []

def W(id, origin, type, meaning, variants=(), start=None, end=None):
    halves = {}
    for k, block in (('start', start), ('end', end)):
        if not block: continue
        cards = []
        for line in block.strip().splitlines():
            f = [x.strip() for x in line.split('|')]
            if len(f) == 4: cards.append(dict(part=f[0], meaning=f[1], real=True, word=f[2], def_=f[3]))
            elif len(f) == 3: cards.append(dict(part=f[0], meaning=f[1], real=False, word=f[2]))
            else: raise SystemExit(f'{id}/{k}: bad line {line!r}')
        halves[k] = dict(cards=[{('def' if a == 'def_' else a): b for a, b in c.items()} for c in cards])
    LEVELS.append(dict(id=id, root=id, variants=list(variants), origin=origin, type=type,
                       meaning=meaning, art=f'art/{id}.webp', halves=halves))

# ---------------- prefixes: start only ----------------
W('re', 'Latin', 'Prefix', 'again, or back', start="""
-play | to have fun | replay | to play again
-turn | to go around | return | to come back
-cycle | a circle | recycle | to use again
-build | to make | rebuild | to build again
-happy | glad | rehappy
-lunch | a midday meal | relunch
""")
W('in', 'Latin', 'Prefix', 'not', start="""
-correct | right | incorrect | not right
-visible | can be seen | invisible | not able to be seen
-credible | believable | incredible | so amazing it's hard to believe
-fair | just | infair
-lucky | having luck | inlucky
-safe | not in danger | insafe
""")
W('dis', 'Latin', 'Prefix', 'not, or apart', start="""
-agree | to think the same | disagree | to not agree
-appear | to come into view | disappear | to go out of sight
-honest | truthful | dishonest | not telling the truth
-connect | to join | disconnect | to pull apart
-run | to go fast | disrun
-big | large | disbig
""")
W('de', 'Latin', 'Prefix', 'down, or away', start="""
-frost | ice | defrost | to melt the ice away
-code | a secret message | decode | to figure out a secret message
-rail | a track | derail | to run off the track
-throne | a king's seat | dethrone | to push a king off the throne
-cake | a sweet treat | decake
-sock | a foot cover | desock
""")
W('sub', 'Latin', 'Prefix', 'under, below', start="""
-marine | of the sea | submarine | a ship that goes under the sea
-way | a path | subway | a train that runs under the city
-merge | to dip | submerge | to go under water
-sky | the air above | subsky
-laugh | to giggle | sublaugh
-happy | glad | subhappy
""")
W('pre', 'Latin', 'Prefix', 'before', start="""
-view | to see | preview | a look before it's out
-heat | to warm | preheat | to heat the oven before cooking
-school | a place to learn | preschool | school before kindergarten
-historic | from history | prehistoric | from before history was written
-jump | to leap | prejump
-sing | to make music | presing
""")
W('inter', 'Latin', 'Prefix', 'between', start="""
-net | a web | internet | the network between computers
-national | of nations | international | between countries
-rupt | to break | interrupt | to break in while someone talks
-sleep | to rest | intersleep
-dog | a pet | interdog
-happy | glad | interhappy
""")
W('trans', 'Latin', 'Prefix', 'across, to the other side', start="""
-port | to carry | transport | to carry from place to place
-form | shape | transform | to change shape completely
-plant | to set in the ground | transplant | to move a plant to a new spot
-fer | to carry | transfer | to move from one place to another
-sing | to make music | transsing
-cake | a sweet treat | transcake
""")
W('super', 'Latin', 'Prefix', 'above, or beyond', start="""
-market | a store | supermarket | a giant food store
-hero | a brave one | superhero | a hero with powers beyond normal
-sonic | sound | supersonic | faster than the speed of sound
-spoon | for eating soup | superspoon
-nap | a short sleep | supernap
-sock | a foot cover | supersock
""")
W('con', 'Latin', 'Prefix', 'together, with', start="""
-nect | to tie | connect | to join together
-struct | to build | construct | to build by putting parts together
-tact | to touch | contact | touching; getting in touch
-sleep | to rest | consleep
-happy | glad | conhappy
-jump | to leap | conjump
""")
W('graph', 'Greek', 'Root', 'to write or draw', end="""
auto- | self | autograph | your own written name
photo- | light | photograph | a picture made with light
para- | beside | paragraph | a group of sentences
geo- | earth | geography | the study of places on Earth
un- | not | ungraph
pre- | before | pregraph
""")
W('dict', 'Latin', 'Root', 'to say', start="""
-ion | act of | diction | the way you say your words
-ate | to make | dictate | to say words for someone to write
-ator | one who | dictator | a ruler whose word is law
-ionary | a book of | dictionary | a book of words and what they mean
-ful | full of | dictful
-ness | state of | dictness
""", end="""
pre- | before | predict | to say what will happen
contra- | against | contradict | to say the opposite
ver- | true | verdict | a jury's "true saying"
re- | again | redict
un- | not | undict
sub- | under | subdict
""")
W('duc', 'Latin', 'Root', 'to lead', ['duct'], end="""
con- | with | conduct | to lead a band or a group
pro- | forward | product | something that is made
e- | out | educate | to lead out of not knowing; to teach
de- | away | deduct | to take away from a total
un- | not | unduct
tele- | far | teleduct
""")
W('fac', 'Latin', 'Root', 'to make or do', ['fact'], start="""
-ory | place for | factory | a place where things are made
-or | thing that | factor | one thing that helps make a result
-ual | about | factual | true; about facts
-ling | little one | factling
-hood | state of | facthood
-ify | to make | factify
""", end="""
arti- | skill | artifact | an old object made by people long ago
manu- | by hand | manufacture | to make things, often in a factory
satis- | enough | satisfaction | the good feeling of enough done
tele- | far | telefact
mis- | wrongly | misfact
sub- | under | subfact
""")
W('vis', 'Latin', 'Root', 'to see', ['vid'], start="""
-ion | act of | vision | the ability to see
-ible | can be | visible | able to be seen
-ual | about | visual | about seeing
-eo | I do | video | Latin for "I see"
-ful | full of | visful
-ness | state of | visness
""", end="""
tele- | far | television | pictures sent from far away
in- | not | invisible | not able to be seen
super- | above | supervisor | a person who watches over others
e- | out | evidence | what you can see that proves something
sub- | under | subvision
mis- | wrongly | misvision
""")
W('ex', 'Latin', 'Prefix', 'out, out of', start="""
-it | to go | exit | the way out
-tract | to pull | extract | to pull out
-hale | to breathe | exhale | to breathe out
-pand | to spread | expand | to spread out bigger
-sleep | to rest | exsleep
-cake | a sweet treat | excake
""")
W('vert', 'Latin', 'Root', 'to turn', ['vers'], start="""
-ical | about | vertical | standing straight up
-ion | act of | version | one form of something
-atile | able to | versatile | able to turn to many things
-ful | full of | vertful
-ness | state of | vertness
-ish | kind of | vertish
""", end="""
con- | with | convert | to change into something else
in- | in | invert | to turn upside down
ad- | toward | advertise | to turn people toward buying something
anni- | year | anniversary | the day a year turns around again
un- | not | unvert
tele- | far | televert
""")
W('pro', 'Latin', 'Prefix', 'forward', start="""
-ject | to throw | project | to throw a picture forward
-gress | to step | progress | stepping forward
-tect | to cover | protect | to cover and keep safe
-cake | a sweet treat | procake
-happy | glad | prohappy
-rupt | to break | prorupt
""")
W('port', 'Latin', 'Root', 'to carry', start="""
-able | can be | portable | easy to carry
-er | one who | porter | someone who carries bags
-folio | pages | portfolio | a case that carries your work
-ful | full of | portful
-ness | state of | portness
-ish | kind of | portish
""", end="""
trans- | across | transport | to carry from place to place
ex- | out | export | to send goods out of a country
im- | into | import | to bring goods into a country
re- | back | report | to bring back news
un- | not | unport
mis- | wrongly | misport
""")
W('struct', 'Latin', 'Root', 'to build', end="""
con- | together | construct | to build
in- | in | instruct | to build knowledge in; to teach
ob- | against | obstruct | to block by building in the way
un- | not | unstruct
tele- | far | telestruct
mis- | wrongly | misstruct
""")
W('ject', 'Latin', 'Root', 'to throw', end="""
pro- | forward | project | to throw a picture forward
re- | back | reject | to throw back; to say no
in- | into | inject | to push medicine in
e- | out | eject | to throw out
un- | not | unject
tele- | far | teleject
""")
W('form', 'Latin', 'Root', 'shape', start="""
-al | about | formal | fancy and proper
-ula | little | formula | a recipe of steps or numbers
-at | shaped | format | the shape or layout of something
-ation | act of | formation | the way things are shaped or lined up
-ish | kind of | formish
-ness | state of | formness
""", end="""
trans- | across | transform | to change shape completely
uni- | one | uniform | clothes that make everyone look the same
in- | into | inform | to tell someone facts
mega- | huge | megaform
tele- | far | teleform
anti- | against | antiform
""")
W('spect', 'Latin', 'Root', 'to look at', ['spec'], start="""
-ator | one who | spectator | someone who watches
-acle | a thing | spectacle | an amazing thing to look at
-imen | a sample | specimen | a sample to look at closely
-ful | full of | spectful
-ness | state of | spectness
-ish | kind of | spectish
""", end="""
in- | into | inspect | to look closely
re- | back | respect | to look up to someone
su- | under | suspect | someone you look at closely
un- | not | unspect
tele- | far | telespect
mis- | wrongly | misspect
""")
W('mit', 'Latin', 'Root', 'to send', end="""
trans- | across | transmit | to send a signal across
sub- | under | submit | to hand in
ad- | to | admit | to let in
per- | through | permit | to let something happen
un- | not | unmit
tele- | far | telemit
""")
W('mot', 'Latin', 'Root', 'to move', ['mob'], start="""
-ion | act of | motion | movement
-or | thing that | motor | a machine that makes things move
-ive | tending to | motive | the reason you do something
-ile | able to | mobile | able to move around
-ful | full of | motful
-ness | state of | motness
""", end="""
pro- | forward | promote | to move up to a better job
re- | back | remote | far away; moved back
e- | out | emotion | a feeling that moves you
loco- | place | locomotive | a train engine that moves from place to place
un- | not | unmote
tele- | far | telemote
""")
W('fer', 'Latin', 'Root', 'to carry or bring', end="""
trans- | across | transfer | to move from one place to another
of- | toward | offer | to hold something out to give
pre- | before | prefer | to like one thing better
suf- | under | suffer | to feel pain
un- | not | unfer
mis- | wrongly | misfer
""")
W('phon', 'Greek', 'Root', 'sound', ['phone'], end="""
tele- | far | telephone | a device for faraway talking
micro- | small | microphone | makes small sounds loud
mega- | huge | megaphone | a cone that makes your voice huge
xylo- | wood | xylophone | music from wooden bars
un- | not | unphone
sub- | under | subphone
""")
W('scrib', 'Latin', 'Root', 'to write', ['scribe'], end="""
de- | down | describe | to write down what it's like
sub- | under | subscribe | to sign up (write your name under)
pre- | before | prescribe | a doctor writing an order for medicine
un- | not | unscribe
tele- | far | telescribe
mega- | huge | megascribe
""")
W('tract', 'Latin', 'Root', 'to pull', end="""
at- | toward | attract | to pull toward
sub- | under | subtract | to take away
dis- | apart | distract | to pull attention away
ex- | out | extract | to pull out
un- | not | untract
mis- | wrongly | mistract
""")
W('rupt', 'Latin', 'Root', 'to break or burst', end="""
e- | out | erupt | to burst out
inter- | between | interrupt | to break in while someone talks
dis- | apart | disrupt | to break up or mess up
un- | not | unrupt
re- | again | rerupt
tele- | far | telerupt
""")
W('aud', 'Latin', 'Root', 'to hear', start="""
-ience | act of | audience | the people who listen or watch
-ition | act of | audition | a tryout where you're heard
-itorium | place for | auditorium | a big hall for listening
-ible | can be | audible | loud enough to hear
-ful | full of | audful
-ness | state of | audness
""")

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    out = dict(id='w1', order=1, name='Ink', theme=THEME, levels=LEVELS)
    p = os.path.join(here, 'worlds', 'w1', 'world.json')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(out, open(p, 'w'), indent=1, ensure_ascii=False)
    print('wrote', p, len(LEVELS), 'levels')
