# Rootcraft v2 level data. One root = one level, ordered by impact
# (rank in data/roots.json). Every real word was checked to be a common
# English word that genuinely comes from root + part; every fake was checked
# not to be an English word (tools: wordfreq + a 370k-word list, see build.py).
#
# Line formats
#   real: part | part meaning (blank for plain English words) | word | kid meaning
#   fake: part | part meaning | the made-up combination
# In root levels, a part ending in "-" goes BEFORE the root, one starting
# with "-" goes AFTER it. In prefix levels every part follows the prefix.

LEVELS = []
def L(id, label, kind, meaning, origin, rank, real, fake, forms=None):
    LEVELS.append(dict(id=id, label=label, kind=kind, meaning=meaning, origin=origin, rank=rank,
                       forms=forms or [label], real=real, fake=fake))

L('re', 're', 'prefix', 'again, or back', 'Latin', 1, """
play | | replay | to play again
do | | redo | to do again
turn | | return | to come back
build | | rebuild | to build again
fill | | refill | to fill up again
cycle | circle | recycle | to use again
port | to carry | report | to bring back news
read | | reread | to read again
""", """
happy | | rehappy
lunch | | relunch
graph | to write | regraph
dict | to say | redict
sky | | resky
""")

L('in', 'in', 'prefix', 'not', 'Latin', 3, """
correct | | incorrect | not right
visible | | invisible | not able to be seen
complete | | incomplete | not finished
active | | inactive | not moving or doing anything
direct | | indirect | not straight to the point
formal | | informal | relaxed, not fancy
credible | | incredible | so amazing it's hard to believe
expensive | | inexpensive | cheap; costs little
""", """
happy | | inhappy
fair | | infair
lucky | | inlucky
safe | | insafe
tall | | intall
""")

L('dis', 'dis', 'prefix', 'not, or apart', 'Latin', 6, """
agree | | disagree | to not agree
appear | | disappear | to go out of sight
like | | dislike | to not like
honest | | dishonest | not telling the truth
connect | | disconnect | to pull apart
obey | | disobey | to not do as you're told
tract | to pull | distract | to pull attention away
rupt | to break | disrupt | to break up or mess up
""", """
happy | | dishappy
run | | disrun
big | | disbig
duct | to lead | disduct
sleep | | dissleep
""")

L('de', 'de', 'prefix', 'down, or away', 'Latin', 10, """
frost | | defrost | to melt the ice away
code | | decode | to figure out a secret message
part | | depart | to go away; leave
scribe | to write | describe | to tell what something is like
tour | | detour | a way around a blocked road
sign | a mark | design | a plan or pattern
rail | | derail | to run off the track
throne | | dethrone | to push a king off the throne
""", """
cake | | decake
sock | | desock
swim | | deswim
jump | | dejump
phon | sound | dephon
""")

L('sub', 'sub', 'prefix', 'under, below', 'Latin', 12, """
marine | of the sea | submarine | a ship that goes under the sea
way | | subway | a train that runs under the city
tract | to pull | subtract | to take away
merge | to dip | submerge | to go under water
title | | subtitle | words under a movie picture
ject | to throw | subject | a topic, like math or science
mit | to send | submit | to hand in
zero | | subzero | colder than zero
""", """
sky | | subsky
happy | | subhappy
dict | to say | subdict
laugh | | sublaugh
""")

L('pre', 'pre', 'prefix', 'before', 'Latin', 13, """
view | to see | preview | a look before it's out
dict | to say | predict | to say what will happen before it does
fix | to fasten | prefix | a word part fastened to the front
heat | | preheat | to heat the oven before cooking
vent | to come | prevent | to stop something before it happens
school | | preschool | school before kindergarten
caution | care | precaution | something done before, to stay safe
historic | | prehistoric | from before history was written
""", """
jump | | prejump
sing | | presing
port | to carry | preport
duct | to lead | preduct
purple | | prepurple
""")

L('inter', 'inter', 'prefix', 'between', 'Latin', 19, """
net | | internet | the network between computers
national | | international | between countries
rupt | to break | interrupt | to break in while someone talks
view | to see | interview | a talk between two people
act | | interact | to act with each other
sect | to cut | intersect | to cut across each other
state | | interstate | a highway between states
cept | to take | intercept | to catch something on its way
""", """
sleep | | intersleep
dog | | interdog
happy | | interhappy
spect | to look | interspect
""")

L('trans', 'trans', 'prefix', 'across, to the other side', 'Latin', 25, """
port | to carry | transport | to carry from place to place
form | shape | transform | to change shape completely
fer | to carry | transfer | to move from one place to another
mit | to send | transmit | to send a signal across
plant | | transplant | to move a plant to a new spot
action | | transaction | a trade across a counter
atlantic | | transatlantic | across the Atlantic Ocean
""", """
happy | | transhappy
sing | | transsing
dict | to say | transdict
vis | to see | transvis
cake | | transcake
""")

L('super', 'super', 'prefix', 'above, or beyond', 'Latin', 27, """
market | | supermarket | a giant food store
star | | superstar | a star above all others
hero | | superhero | a hero with powers beyond normal
vision | seeing | supervision | watching over someone
natural | | supernatural | beyond nature, like ghosts
power | | superpower | a power beyond normal
human | | superhuman | beyond what people can do
""", """
spoon | | superspoon
dict | to say | superdict
duct | to lead | superduct
rupt | to break | superrupt
""")

L('con', 'con', 'prefix', 'together, with', 'Latin', 31, """
nect | to tie | connect | to join together
struct | to build | construct | to build by putting parts together
duct | to lead | conduct | to lead a group
vert | to turn | convert | to change one thing into another
tract | to pull | contract | a deal that pulls people together
cept | to take | concept | an idea you take in
test | | contest | a competition
tact | to touch | contact | touching; getting in touch
""", """
happy | | conhappy
sleep | | consleep
port | to carry | conport
graph | to write | congraph
jump | | conjump
""")

L('graph', 'graph', 'root', 'to write or draw', 'Greek', 33, """
auto- | self | autograph | your own written name
photo- | light | photograph | a picture made with light
para- | beside | paragraph | a group of sentences
-ic | relating to | graphic | a picture or drawing
tele- | far | telegraph | an old machine that sent messages far
-ite | a kind of rock | graphite | the "lead" in a pencil
""", """
-ful | full of | graphful
un- | not | ungraph
-ness | state of | graphness
pre- | before | pregraph
-ment | result of | graphment
""")

L('dict', 'dict', 'root', 'to say', 'Latin', 34, """
pre- | before | predict | to say what will happen
contra- | against | contradict | to say the opposite
-ion | act of | diction | the way you say your words
-ate | to do | dictate | to say words for someone to write
ver- | true | verdict | a jury's "true saying"
-ator | one who | dictator | a ruler whose word is law
""", """
re- | again | redict
un- | not | undict
-ful | full of | dictful
sub- | under | subdict
-ness | state of | dictness
""")

L('duc', 'duc', 'root', 'to lead', 'Latin', 35, """
pro- | forward | produce | to make or grow
con- | with | conduct | to lead a band or a group
de- | away | deduct | to take away an amount
aque- | water | aqueduct | a bridge that leads water
re- | back | reduce | to make smaller
intro- | inward | introduce | to lead someone in to meet others
""", """
un- | not | unduct
-ful | full of | ductful
-ness | state of | ductness
tele- | far | teleduct
mis- | wrongly | misduct
""", forms=['duc', 'duct', 'duce'])

L('fac', 'fac', 'root', 'to make or do', 'Latin', 36, """
-ory | place for | factory | a place where things are made
per- | completely | perfect | made completely, no mistakes
de- | away | defect | a flaw in how something is made
in- | into | infect | to put germs into
-or | thing that | factor | one thing that helps make a result
ef- | out | effect | what happens because of something
""", """
tele- | far | telefact
mega- | huge | megafact
mis- | wrongly | misfact
photo- | light | photofact
""", forms=['fac', 'fact', 'fect'])

L('vis', 'vis', 'root', 'to see', 'Latin', 37, """
-ion | act of | vision | the ability to see
-ible | can be | visible | able to be seen
-ual | relating to | visual | about seeing
-eo | I | video | Latin for "I see"
pro- | ahead | provide | to give what's needed (to see ahead)
super- | above | supervise | to watch over
re- | again | revise | to look again and fix
""", """
un- | not | unvis
-ful | full of | visful
-ness | state of | visness
mis- | wrongly | misvis
-ment | result of | visment
""", forms=['vis', 'vid', 'vise'])

L('ex', 'ex', 'prefix', 'out, out of', 'Latin', 38, """
port | to carry | export | to send goods out
it | to go | exit | the way out
tract | to pull | extract | to pull out
press | to push | express | to push your feelings out
hale | to breathe | exhale | to breathe out
pand | to spread | expand | to spread out bigger
claim | to shout | exclaim | to shout out
change | | exchange | to swap
""", """
sleep | | exsleep
cake | | excake
dict | to say | exdict
phon | sound | exphon
jump | | exjump
""")

L('vert', 'vert', 'root', 'to turn', 'Latin', 39, """
con- | with | convert | to change into something else
in- | in | invert | to turn upside down
re- | back | reverse | to go backward
uni- | one | universe | everything, turned into one
-ion | act of | version | one form of something
intro- | inward | introvert | someone who turns inward
-ical | relating to | vertical | standing straight up
""", """
un- | not | unvert
-ful | full of | vertful
-ness | state of | vertness
tele- | far | televert
-ment | result of | vertment
""", forms=['vert', 'vers', 'verse'])

L('pro', 'pro', 'prefix', 'forward', 'Latin', 41, """
ject | to throw | project | to throw forward onto a screen
duct | to lead | product | something that is made
mote | to move | promote | to move up to a better job
gress | to step | progress | stepping forward
pel | to push | propel | to push forward
tect | to cover | protect | to cover and keep safe
noun | | pronoun | a word that stands for a noun
claim | to shout | proclaim | to announce out loud
""", """
happy | | prohappy
cake | | procake
dict | to say | prodict
rupt | to break | prorupt
swim | | proswim
""")

L('port', 'port', 'root', 'to carry', 'Latin', 42, """
trans- | across | transport | to carry from place to place
ex- | out | export | to send goods out of a country
im- | into | import | to bring goods into a country
re- | back | report | to bring back news
sup- | under | support | to hold up from below
-able | can be | portable | easy to carry
-er | one who | porter | a person who carries bags
de- | away | deport | to send out of a country
""", """
un- | not | unport
-ful | full of | portful
-ness | state of | portness
mis- | wrongly | misport
pre- | before | preport
""")

L('struct', 'struct', 'root', 'to build', 'Latin', 43, """
con- | together | construct | to build
in- | in | instruct | to build knowledge in; to teach
-ure | result of | structure | something that has been built
ob- | against | obstruct | to block by building in the way
de- | down | destroy | to un-build; to wreck
-ural | relating to | structural | about how something is built
""", """
un- | not | unstruct
-ful | full of | structful
-ness | state of | structness
tele- | far | telestruct
mis- | wrongly | misstruct
""", forms=['struct', 'stroy'])

L('ject', 'ject', 'root', 'to throw', 'Latin', 44, """
pro- | forward | project | to throw a picture forward
re- | back | reject | to throw back; say no
in- | into | inject | to push medicine in
e- | out | eject | to throw out
ob- | against | object | to throw a reason against
sub- | under | subject | a topic, like math
""", """
un- | not | unject
-ful | full of | jectful
-ly | in a way | jectly
anti- | against | antiject
photo- | light | photoject
""")

L('form', 'form', 'root', 'shape', 'Latin', 47, """
trans- | across | transform | to change shape completely
uni- | one | uniform | clothes that make everyone look the same
in- | into | inform | to tell someone facts
re- | again | reform | to change for the better
con- | with | conform | to fit the same shape as others
de- | down | deform | to bend out of shape
-al | relating to | formal | fancy and proper
-ula | little | formula | a recipe of steps or numbers
""", """
mega- | huge | megaform
-ness | state of | formness
ex- | out | exform
tele- | far | teleform
""")

L('spect', 'spect', 'root', 'to look at', 'Latin', 54, """
in- | into | inspect | to look closely
re- | back | respect | to look up to someone
pro- | forward | prospect | a chance in the future
-ator | one who | spectator | someone who watches
-acle | thing | spectacle | an amazing thing to look at
ex- | out | expect | to look out for; think it will happen
sus- | under | suspect | someone you look at closely
""", """
un- | not | unspect
-ful | full of | spectful
tele- | far | telespect
trans- | across | transspect
-ness | state of | spectness
""", forms=['spect', 'pect'])

L('mit', 'mit', 'root', 'to send', 'Latin', 55, """
trans- | across | transmit | to send a signal across
sub- | under | submit | to hand in
per- | through | permit | to let something happen
ad- | to | admit | to let in
e- | out | emit | to send out light or smoke
dis- | apart | dismiss | to send away
-ion | act of | mission | an important job you're sent on
-ile | thing that | missile | something sent flying
""", """
un- | not | unmit
-ful | full of | mitful
photo- | light | photomit
tele- | far | telemit
-ness | state of | mitness
""", forms=['mit', 'miss'])

L('mot', 'mot', 'root', 'to move', 'Latin', 57, """
-ion | act of | motion | movement
-or | thing that | motor | a machine that makes things move
-ive | tending to | motive | the reason you do something
pro- | forward | promote | to move up
re- | away | remove | to move away
-ile | able to | mobile | able to move around
-ment | act of | movement | the act of moving
""", """
un- | not | unmot
-ful | full of | motful
sub- | under | submot
tele- | far | telemot
-ness | state of | motness
""", forms=['mot', 'mov', 'mob'])

L('fer', 'fer', 'root', 'to carry or bring', 'Latin', 59, """
trans- | across | transfer | to move from one place to another
of- | toward | offer | to hold something out to give
pre- | before | prefer | to like one thing better
re- | back | refer | to send someone to look
con- | together | confer | to talk things over together
suf- | under | suffer | to feel pain
in- | in | infer | to figure out from clues
dif- | apart | differ | to be unlike
""", """
un- | not | unfer
-ful | full of | ferful
mis- | wrongly | misfer
tele- | far | telefer
-ness | state of | ferness
""")

L('phon', 'phon', 'root', 'sound', 'Greek', 60, """
tele- | far | telephone | a device for faraway talking
micro- | small | microphone | makes small sounds loud
mega- | huge | megaphone | a cone that makes your voice huge
xylo- | wood | xylophone | music from wooden bars
-ics | study of | phonics | the sounds letters make
head- | | headphones | speakers you wear on your head
""", """
un- | not | unphone
re- | again | rephone
-ful | full of | phonful
trans- | across | transphone
-ness | state of | phonness
""", forms=['phon', 'phone'])

L('scrib', 'scrib', 'root', 'to write', 'Latin', 66, """
de- | down | describe | to write down what it's like
sub- | under | subscribe | to sign up (write your name under)
pre- | before | prescribe | a doctor writing an order for medicine
manu- | hand | manuscript | a book written by hand
post- | after | postscript | a note after a letter (P.S.)
tran- | across | transcript | a written copy of what was said
""", """
un- | not | unscribe
-ful | full of | scribful
mega- | huge | megascribe
-ness | state of | scribness
tele- | far | telescribe
""", forms=['scrib', 'scribe', 'script'])

L('tract', 'tract', 'root', 'to pull', 'Latin', 82, """
-or | thing that | tractor | a machine that pulls heavy loads
at- | toward | attract | to pull toward
sub- | under | subtract | to take away
dis- | apart | distract | to pull attention away
ex- | out | extract | to pull out
con- | together | contract | a written deal; to shrink
re- | back | retract | to pull back in
-ion | act of | traction | grip that keeps wheels from slipping
""", """
un- | not | untract
-ful | full of | tractful
mis- | wrongly | mistract
tele- | far | teletract
-ness | state of | tractness
""")

L('rupt', 'rupt', 'root', 'to break or burst', 'Latin', 84, """
e- | out | erupt | to burst out
inter- | between | interrupt | to break in while someone talks
dis- | apart | disrupt | to break up or mess up
ab- | away | abrupt | sudden, broken off
cor- | completely | corrupt | rotten or dishonest
-ure | result of | rupture | a break or burst
bank- | bench | bankrupt | out of money (a "broken bench")
""", """
un- | not | unrupt
-ful | full of | ruptful
re- | again | rerupt
tele- | far | telerupt
-ness | state of | ruptness
""")

L('aud', 'aud', 'root', 'to hear', 'Latin', 104, """
-io | | audio | sound you can hear
-ience | act of | audience | the people who listen or watch
-ible | can be | audible | loud enough to hear
-ition | act of | audition | a tryout where you're heard
-itorium | place for | auditorium | a big hall for listening
-itory | relating to | auditory | about hearing
""", """
re- | again | reaud
-ful | full of | audful
tele- | far | teleaud
-ment | result of | audment
""", forms=['aud', 'audi'])
