import re, json, math
from wordfreq import top_n_list, zipf_frequency
vocab_list=[w for w in top_n_list('en',80000) if w.isalpha() and w.islower() and len(w)>=3]
Z={w:zipf_frequency(w,'en') for w in vocab_list}
common=[w for w in vocab_list if Z[w]>=3.0]   # >= ~1 per million tokens
vset=set(w for w in vocab_list if Z[w]>=2.5)
print('vocab', len(vocab_list), 'common', len(common))
rows=[]
for line in open('roots_data.txt'):
    if line.startswith('#') or not line.strip(): continue
    f=[x.strip() for x in line.split('~')]
    assert len(f)==12, (len(f), line[:40])
    key,typ,orig,mean,var,rx,exc,ex,kid,gr,notes,src=f
    ex='|'.join(e for e in ex.split('|') if '?' not in e and e.strip())
    exc='|'.join(e.strip() for e in exc.split('|') if '?' not in e and e.strip())
    var='|'.join(v for v in var.split('|') if v!='ble')
    rows.append(dict(key=key,type=typ,origin=orig,meaning=mean,variants=var,rx=rx,exc=exc,examples=ex,kid=kid,grade=int(gr),notes=notes,src=[s for s in src.split('|') if s]))
rootrx=[r['rx'] for r in rows if r['type']=='root' and r['rx']]
ROOTRE=re.compile('|'.join('(?:%s)'%x for x in rootrx))
def base_ok(b):
    if len(b)<3: return False
    c=[b,b+'e']
    if b.endswith('i'): c.append(b[:-1]+'y')
    if len(b)>3 and b[-1]==b[-2]: c.append(b[:-1])
    return any(x in vset for x in c)
def match(r):
    out=set()
    vs=r['variants'].split('|')
    exre=re.compile(r['exc']) if r['exc'] else None
    for w in common:
        ok=False
        if r['type']=='root':
            if re.search(r['rx'],w): ok=True
        elif r['type']=='prefix':
            for v in vs:
                if w.startswith(v) and len(w)-len(v)>=3:
                    rest=w[len(v):]
                    if base_ok(rest) or (len(v)>=2 and ROOTRE.match(rest)) : ok=True
                    if len(v)==1 and ROOTRE.match(rest) and len(rest)>=4: ok=True
        else:
            for v in vs:
                if w.endswith(v) and len(w)-len(v)>=3 and base_ok(w[:-len(v)]): ok=True
                if v in('tion','sion','ation','ity','ment','ous','ive','ance','ence','ure','ary','ory','ize','logy','ology','ism','ist','ify','ical','ic','al','ial','ant','ent','ate','age','ian','ar','ible','able') and w.endswith(v) and len(w)-len(v)>=3 and ROOTRE.search(w[:-len(v)]): ok=True
        if ok and exre and re.search(exre,w): ok=False
        if ok: out.add(w)
    return out
for r in rows:
    m=match(r)
    r['n']=len(m); r['mass']=sum(10**(Z[w]-3) for w in m)  # per-million tokens
    r['top']=sorted(m,key=lambda w:-Z[w])[:15]
json.dump(rows,open('scored.json','w'),indent=0)
for r in sorted(rows,key=lambda r:-r['n']):
    print(f"{r['key']:10} {r['type']:6} n={r['n']:4} mass={r['mass']:8.0f}  {' '.join(r['top'][:12])}")
