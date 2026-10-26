import json
import sys as _s; _s.path.insert(0, '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5/work/art'); from word_defs import add_defs
def C(s):
    out=[]
    for line in s.strip().splitlines():
        p,m,w,r=[x.strip() for x in line.split('|')]
        out.append({"part":p,"meaning":m,"real":r=='1',"word":w})
    return {"cards":add_defs(out)}
L=[]
def lv(id,root,variants,origin,typ,meaning,start=None,end=None):
    h={}
    if start: h['start']=C(start)
    if end: h['end']=C(end)
    L.append({"id":id,"root":root,"variants":variants,"origin":origin,"type":typ,"meaning":meaning,"art":f"art/{id}.webp","halves":h})
lv("aqua","aqua",["aque"],"Latin","Root","water",start="""
-rium|place for|aquarium|1
-tic|of, living in|aquatic|1
-duct|channel|aqueduct|1
-marine|of the sea|aquamarine|1
-phone|sound|aquaphone|0
-grade|step|aquagrade|0""")
lv("ped","ped",[],"Latin","Root","foot",start="""
-al|thing for|pedal|1
-estrian|goer|pedestrian|1
-icure|care|pedicure|1
-estal|stand|pedestal|1
-ivore|eater|pedivore|0
-onaut|sailor|pedonaut|0""")
lv("manu","manu",["man"],"Latin","Root","hand",start="""
-al|done by|manual|1
-script|written|manuscript|1
-icure|care|manicure|1
-phone|sound|manuphone|0
-dome|roof|manudome|0
-ful|full of|manuful|0""")
lv("dent","dent",[],"Latin","Root","tooth",start="""
-ist|one who|dentist|1
-al|of, about|dental|1
-ure|thing made|denture|1
-arium|place for|dentarium|0
-ivore|eater|dentivore|0
-ique|style|dentique|0""")
lv("terr","terr",["terra"],"Latin","Root","earth, land",start="""
-ain|ground|terrain|1
-itory|place of|territory|1
-arium|place for|terrarium|1
-onaut|sailor|terronaut|0
-ette|little|terrette|0
-oscope|viewer|terroscope|0""",end="""
extra-|beyond|extraterrestrial|1
sub-|under|subterranean|1
medi-|middle|mediterranean|1
anti-|against|antiterrestrial|0
infra-|below|infraterranean|0
semi-|half|semiterranean|0""")
lv("anim","anim",[],"Latin","Root","life, spirit, mind",start="""
-al|living thing|animal|1
-ate|bring to|animate|1
-ation|the act of|animation|1
-ology|study of|animology|0
-ish|somewhat|animish|0
-ster|one who|animster|0""",end="""
in-|not|inanimate|1
un-|one|unanimous|1
magn-|great|magnanimous|1
pro-|forward|proanimous|0
trans-|across|transanimous|0
mis-|wrongly|misanimate|0""")
lv("viv","viv",["vit"],"Latin","Root","live, alive",start="""
-id|full of|vivid|1
-al|of, for|vital|1
-amin|compound|vitamin|1
-ometer|measurer|vivometer|0
-orama|big view|vivorama|0
-arium|place for|vitarium|0""")
lv("vor","vor",["vore"],"Latin","Root","eat, swallow",end="""
carni-|meat|carnivore|1
herbi-|plants|herbivore|1
insecti-|insects|insectivore|1
petri-|rock|petrivore|0
nubi-|cloud|nubivore|0
luni-|moon|lunivore|0""")
lv("spir","spir",["spire"],"Latin","Root","breathe",end="""
in-|in, into|inspire|1
a-|toward|aspire|1
re-|again|respiration|1
per-|through|perspire|1
un-|not|unspire|0
pro-|forward|prospire|0""")
lv("flor","flor",["flour"],"Latin","Root","flower",start="""
-ist|one who|florist|1
-al|of, like|floral|1
-ish|to become|flourish|1
-onaut|sailor|floronaut|0
-ometer|measurer|florometer|0
-atic|full of|floratic|0""")
lv("avi","avi",[],"Latin","Root","bird",start="""
-ary|place for|aviary|1
-ator|one who|aviator|1
-ation|the act of|aviation|1
-naut|sailor|avinaut|0
-tron|machine|avitron|0
-tude|state of|avitude|0""")
lv("opt","opt",[],"Greek","Root","eye, sight",start="""
-ical|about|optical|1
-ician|expert|optician|1
-ometrist|measurer|optometrist|1
-arium|place for|optarium|0
-oscope|viewer|optoscope|0
-orium|hall|optorium|0""")
lv("cardi","cardi",[],"Greek","Root","heart",start="""
-ac|of, about|cardiac|1
-ologist|expert|cardiologist|1
-ovascular|blood vessels|cardiovascular|1
-onaut|sailor|cardionaut|0
-vore|eater|cardivore|0
-otastic|amazing|cardiotastic|0""")
lv("arbor","arbor",[],"Latin","Root","tree",start="""
-etum|place of|arboretum|1
-ist|one who|arborist|1
-eal|living in|arboreal|1
-ology|study of|arborology|0
-ium|place|arborium|0
-ette|little|arborette|0""")
lv("lingu","lingu",["langu"],"Latin","Root","tongue, language",start="""
-ist|expert|linguist|1
-ine|little ones|linguine|1
-age|system of|language|1
-arium|place for|linguarium|0
-ometer|measurer|linguometer|0
-ify|make|linguify|0""")
lv("derm","derm",[],"Greek","Root","skin",end="""
pachy-|thick|pachyderm|1
hypo-|under|hypodermic|1
taxi-|arranging|taxidermy|1
ultra-|beyond|ultraderm|0
poly-|many|polyderm|0
giga-|giant|gigaderm|0""")
W={"id":"w4","order":4,"name":"Amethyst",
 "theme":{"name":"amethyst","bg":"#130F18","bg2":"#1E1626","accent":"#C9A8F2",
   "foil":["#5A2D8C","#A775E6","#F0B6D6","#8A4FCB","#D9B8FF"],"glitter":"#DCC0FF","particle":"sparkle"},
 "levels":L}
json.dump(W,open('app/src/worlds/w4/world.json','w'),indent=1,ensure_ascii=False)
print(len(L))
