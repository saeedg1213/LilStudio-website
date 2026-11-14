#!/usr/bin/env python3
"""shot.py page out.png [--w 1440] [--h 1000] [--dark] [--css '...'] [--q 'sim=pop'] [--js '...'] [--motion] [--budget 4000] [--dom]
Makes a temporary _s.html copy next to the page (so relative URLs work), screenshots it with headless Chrome, deletes it."""
import sys, os, subprocess, argparse, tempfile, shutil, re
ap=argparse.ArgumentParser()
ap.add_argument('page'); ap.add_argument('out')
ap.add_argument('--w',type=int,default=1440); ap.add_argument('--h',type=int,default=1000)
ap.add_argument('--dark',action='store_true'); ap.add_argument('--css',default=''); ap.add_argument('--q',default='')
ap.add_argument('--js',default=''); ap.add_argument('--motion',action='store_true'); ap.add_argument('--budget',type=int,default=4000)
ap.add_argument('--dom',action='store_true'); ap.add_argument('--jsfile',default='')
a=ap.parse_args()
if a.jsfile: a.js=open(a.jsfile).read()
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
PORT=os.environ.get('PORT','8790')
src=os.path.join(ROOT,a.page)
d=os.path.dirname(src); tmp=os.path.join(d,'_s.html')
s=open(src).read()
inj="<script>window.__errs=[];addEventListener('error',e=>__errs.push(e.message+' @'+e.lineno))</script>"
inj+="<script>try{localStorage.clear();localStorage.setItem('theme','%s')}catch(e){};document.documentElement.setAttribute('data-theme','%s')</script>"%(('dark' if a.dark else 'light'),('dark' if a.dark else 'light'))
if a.css: inj+='<style>%s</style>'%a.css
s=s.replace('<script src="/assets/theme.js"></script>','<script src="/assets/theme.js"></script>'+inj,1)
if a.js: s=s.replace('</body>','<script>%s</script></body>'%a.js,1)
open(tmp,'w').write(s)
rel=os.path.relpath(tmp,ROOT)
url='http://localhost:'+PORT+'/'+rel+('?'+a.q if a.q else '')
ud=tempfile.mkdtemp(prefix='chr')
cmd=['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','--headless=new','--disable-gpu','--hide-scrollbars','--user-data-dir='+ud,'--window-size=%d,%d'%(a.w,a.h),'--virtual-time-budget=%d'%a.budget]
if not a.motion: cmd.append('--force-prefers-reduced-motion')
if a.dom: cmd.append('--dump-dom')
else: cmd.append('--screenshot='+os.path.abspath(a.out))
cmd.append(url)
try:
    r=subprocess.run(cmd,capture_output=True,text=True,timeout=90)
    if a.dom:
        m=re.search(r'<title>(.*?)</title>',r.stdout,re.S); print(m.group(1) if m else r.stdout[:2000])
    else: print('ok', a.out)
finally:
    os.remove(tmp); shutil.rmtree(ud,ignore_errors=True)
