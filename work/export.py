import json, csv
rows=json.load(open('work/ranked.json'))
SRC={'W':'White, Sowell & Yanagihara 1989','L':'Lane, Gutlohn & van Dijk 2019','H':'Honig et al. Teaching Reading Sourcebook (Diamond & Gutlohn roots)','RR':'Reading Rockets / McEwan 2008','CDL':'Center for Development & Learning'}
disp={'in-not':'in- (not)','in-into':'in- (into)','er-agent':'-er/-or','a-not':'a-/an- (not)','est':'-est/-er (more)'}
out=[]
for r in rows:
    k=r['key']
    name=disp.get(k) or (k+'-' if r['type']=='prefix' else ('-'+k if r['type']=='suffix' else k))
    tier=1 if r['rank']<=60 else (2 if r['rank']<=150 else 3)
    srcs='; '.join(SRC[s] for s in r['src'])
    notes=r['notes'].strip()
    extra=f"Corpus: ~{r['n']} common English words (wordfreq Zipf>=3) match this element."
    if srcs: extra+=f" Listed in: {srcs}."
    out.append(dict(rank=r['rank'],root=name,type=r['type'],origin=r['origin'],meaning=r['meaning'],
        variants=r['variants'],example_words=r['examples'],kid_friendly_example=r['kid'],
        frequency_tier=tier,difficulty_grade=r['grade'],notes=(notes+' ' if notes else '')+extra))
cols=list(out[0].keys())
with open('data/roots.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); w.writerows(out)
json.dump(out,open('data/roots.json','w'),indent=1,ensure_ascii=False)
from collections import Counter
print(len(out), Counter(o['frequency_tier'] for o in out), Counter(o['type'] for o in out), Counter(o['origin'] for o in out))
for o in out[:30]: print(o['rank'],o['root'],o['type'],'|',o['meaning'])
# sanity
bad=[o['root'] for o in out if len(o['example_words'].split('|'))<4]
print('few examples:',bad)
