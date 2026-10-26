#!/usr/bin/env python3
"""Cloudflare Pages direct upload that works behind the Hark auth proxy.
API-token calls go through the proxy (token injected); JWT asset calls go direct (--noproxy).
usage: cf_pages_deploy.py <dir> <project> [branch]"""
import sys,os,json,base64,subprocess,mimetypes,tempfile
from blake3 import blake3
ACC='3fcd0c68ceb84f7dca22ed15603fbb57'; API='https://api.cloudflare.com/client/v4'
d,proj=sys.argv[1],sys.argv[2]; branch=sys.argv[3] if len(sys.argv)>3 else 'main'
def curl(args,proxy=True):
    cmd=['curl','-s','--max-time','300']+([] if proxy else ['--noproxy','*'])+args
    out=subprocess.run(cmd,capture_output=True,text=True).stdout
    try: return json.loads(out)
    except Exception: print(out[:500]); raise
files={}; special={}
for root,_,fs in os.walk(d):
    for f in fs:
        p=os.path.join(root,f); rel='/'+os.path.relpath(p,d).replace(os.sep,'/')
        b=open(p,'rb').read(); ext=os.path.splitext(f)[1].lstrip('.')
        h=blake3((base64.b64encode(b).decode()+ext).encode()).hexdigest()[:32]
        if rel in ('/_headers','/_redirects'): special[rel[1:]]=p; continue  # sent as form fields, like wrangler
        files[rel]=(p,h,b)
print(len(files),'files')
jwt=curl([f'{API}/accounts/{ACC}/pages/projects/{proj}/upload-token'])['result']['jwt']
H=['-H',f'Authorization: Bearer {jwt}','-H','Content-Type: application/json']
hashes=list({v[1] for v in files.values()})
missing=curl(['-X','POST',f'{API}/pages/assets/check-missing']+H+['--data-binary',json.dumps({'hashes':hashes})],proxy=False)['result']
print(len(missing),'missing')
byhash={v[1]:(v[0],v[2]) for v in files.values()}
batch=[];size=0
def flush():
    global batch,size
    if not batch: return
    tf=tempfile.NamedTemporaryFile('w',delete=False,suffix='.json'); json.dump(batch,tf); tf.close()
    r=curl(['-X','POST',f'{API}/pages/assets/upload']+H+['--data-binary','@'+tf.name],proxy=False)
    os.unlink(tf.name)
    if not r.get('success'): print('upload fail',r); sys.exit(1)
    print('uploaded',len(batch)); batch=[];size=0
for h in missing:
    p,b=byhash[h]; v=base64.b64encode(b).decode()
    batch.append({'key':h,'value':v,'metadata':{'contentType':mimetypes.guess_type(p)[0] or 'application/octet-stream'},'base64':True}); size+=len(v)
    if size>30_000_000 or len(batch)>=1000: flush()
flush()
curl(['-X','POST',f'{API}/pages/assets/upsert-hashes']+H+['--data-binary',json.dumps({'hashes':hashes})],proxy=False)
manifest={k:v[1] for k,v in files.items()}
tf=tempfile.NamedTemporaryFile('w',delete=False,suffix='.json'); json.dump(manifest,tf); tf.close()
r=curl(['-X','POST',f'{API}/accounts/{ACC}/pages/projects/{proj}/deployments','-F',f'manifest=<{tf.name}','-F',f'branch={branch}']+sum([['-F',f'{k}=@{v}'] for k,v in special.items()],[]))
print(json.dumps({k:r.get('result',{}).get(k) for k in ('id','url','environment')}), r.get('errors'))
