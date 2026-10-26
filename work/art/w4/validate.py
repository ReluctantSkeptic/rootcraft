import json,os,sys,wordfreq
from english_words import get_english_words_set as g
D=g(['web2','gcide'],lower=True)
R='app/src/worlds/w4'; W=json.load(open(R+'/world.json'))
E=[];Wn=[]
for k in ['id','order','name','theme','levels']: 
    if k not in W: E.append('missing '+k)
ids=set()
for lv in W['levels']:
    i=lv['id']
    if i in ids: E.append('dup '+i)
    ids.add(i)
    for k in ['id','root','variants','origin','type','meaning','art','halves']:
        if k not in lv: E.append(f'{i}: missing {k}')
    if not os.path.exists(os.path.join(R,lv['art'])): E.append(f'{i}: art missing')
    forms=[lv['root']]+lv['variants']
    for side,h in lv['halves'].items():
        cs=h['cards']; nr=sum(c['real'] for c in cs)
        if len(cs)!=6: E.append(f'{i}/{side}: {len(cs)} cards')
        if not 3<=nr<=4: E.append(f'{i}/{side}: {nr} real')
        ws=[c['word'] for c in cs]
        if len(set(ws))!=6: E.append(f'{i}/{side}: dup word')
        for c in cs:
            w,p=c['word'],c['part']
            if side=='start' and not p.startswith('-'): E.append(f'{i}: start part {p}')
            if side=='end' and not p.endswith('-'): E.append(f'{i}: end part {p}')
            core=p.strip('-')
            if side=='start' and not w.endswith(core): E.append(f'{i}: {w} !endswith {core}')
            if side=='end' and not w.startswith(core): E.append(f'{i}: {w} !startswith {core}')
            if not any(f in w for f in forms) and not ('pire' in w): E.append(f'{i}: {w} lacks root')
            z=wordfreq.zipf_frequency(w,'en')
            if c['real']:
                if z<2.0: Wn.append(f'{i}: rare real {w} ({z:.2f})')
            elif z>0 or w in D: E.append(f'{i}: fake {w} is a word')
print('levels',len(W['levels']));print('ERRORS',E or 'none');print('WARN',Wn or 'none')
