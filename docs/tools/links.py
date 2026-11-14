import os,re,sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
bad=[]
for dp,dn,fn in os.walk(ROOT):
    if '/.git' in dp or '/docs' in dp: continue
    for f in fn:
        if not f.endswith('.html') or f.startswith('_'): continue
        p=os.path.join(dp,f); s=open(p,errors='ignore').read()
        ids=set(re.findall(r'id="([^"]+)"',s))
        for attr,u in re.findall(r'(href|src|srcset|poster)="([^"]+)"',s):
            for u in ([x.strip().split(' ')[0] for x in u.split(',')] if attr=='srcset' else [u]):
                if re.match(r'^(https?:|mailto:|tel:|data:|javascript:|\$\{)',u) or '${' in u or u=='': continue
                if u.startswith('#'):
                    if u!='#' and u[1:] not in ids: bad.append((p,u))
                    continue
                path=u.split('#')[0].split('?')[0]
                if not path: continue
                full=os.path.join(ROOT,path.lstrip('/')) if path.startswith('/') else os.path.normpath(os.path.join(dp,path))
                if path.endswith('/'): full=os.path.join(full,'index.html')
                if not os.path.exists(full): bad.append((p.replace(ROOT,''),u))
for b in bad: print(*b)
print(len(bad),'problems')
