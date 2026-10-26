import json, math, csv, os
rows=json.load(open('scored.json'))
P=dict(x.split(':') for x in """er-agent:.25 est:.2 y:.35 ly:.8 tion:.95 con:.7 re:.6 ad:.4 in-not:.55 in-into:.2 ex:.5 a-not:.1 ic:.9 dis:.85 de:.7 ity:.8 un:.7 ant:.8 sta:.85 an:.35 pro:.9 ive:.9 able:.9 vert:.9 ance:.85 en:.4 fac:.95 ment:.95 leg:.9 mit:.8 cap:.9 ary:.85 sub:.9 ate:.6 pos:.85 vid:.9 log:.95 ten:.8 ob:.7 dia:.4 ous:.95 fer:.9 pre:.95 tend:.9 nat:.9 rect:.8 ven:.85 duc:.95 port:.9 graph:.95 form:.9 mov:.95 ced:.9 plic:.9 ist:.7 ness:.9 part:.9 ure:.8 trans:.7 age:.7 super:.9 astro:.15 dict:.95 mem:.9 spect:.95 jus:.8 per:.9 pend:.9 grad:.95 ar:.7 sens:.9 quest:.95 ism:.9 nom:.8 cur:.85 via:.7 ize:.5 meter:.9 gen:.85 min:.85 fort:.9 fin:.9 ship:.9 sequ:.9 sed:.9 mis:.7 para:.4 geo:.3 ish:.6 man:.9 ord:.9 mand:.9 ab:.7 pel:.5 oper:.9 aud:.5 bio:.8 prim:.9 viv:.9 spir:.9 vac:.9 trib:.85 anti:.5 bi:.3 phil:.5 vict:.8 ify:.8 mono:.2 loc:.95 poli:.85 uni:.9 nov:.8 medi:.9 capit:.8 fore:.8 post:.9 syn:.8 phon:.95 pater:.7 mid:.8 tri:.4 cred:.95 ver:.7 mort:.8 migr:.9 ped:.9 bene:.5 pan:.1 son:.7 mal:.4 dent:.5 micro:.9 milli:.8 mar:.9 urb:.5 lum:.7 scope:.9 aqua:.5 sol:.8 cent:.8 semi:.7 epi:.3 mater:.9 therm:.8 zoo:.8 dino:.8 mega:.7""".split())
P={k:float(v) for k,v in P.items()}
WP={'un':26.4,'re':13.6,'in-not':10.6,'dis':7.3,'en':4.5,'non':4.3,'in-into':3.5,'over':3.3,'mis':2.8,'sub':2.7,'pre':2.7,'inter':2.6,'fore':2.5,'de':2.4,'trans':1.6,'super':1.5,'semi':1.3,'anti':1.1,'mid':1.1,'under':0.8}
WS={'ly':7,'er-agent':4,'tion':4,'able':2,'al':1,'y':1,'ness':1,'ity':1,'ment':1,'ic':1,'ous':1,'en':1,'est':1,'ive':1,'ful':1,'less':1}
SW={'W':2,'L':1.5,'H':1,'RR':1,'CDL':0.5}
for r in rows:
    k=r['key']; p=P.get(k,1.0)
    if k=='en' and r['type']=='prefix': p=.5
    r['c']=math.log1p(r['n']*p); r['m']=math.log1p(r['mass']*p)
    r['e']=sum(SW.get(s,0) for s in r['src'])
    r['k']=(9-r['grade'])/7
    pct = WP.get(k) if r['type']=='prefix' else (WS.get(k) if r['type']=='suffix' else None)
    r['wb']=0.25*math.log1p(pct)/math.log1p(26.4) if pct else 0
mx={f:max(r[f] for r in rows) for f in 'cme'}
for r in rows:
    r['score']=0.35*r['c']/mx['c']+0.15*r['m']/mx['m']+0.20*r['e']/mx['e']+0.15*r['k']+r['wb']
rows.sort(key=lambda r:-r['score'])
for i,r in enumerate(rows,1):
    r['rank']=i; r['tier']=1 if i<=50 else (2 if i<=120 else 3)
json.dump(rows,open('ranked.json','w'))
for r in rows: print(r['rank'],r['key'],r['type'],round(r['score'],3),r['n'])
