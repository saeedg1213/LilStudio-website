import sys,re,subprocess,os,tempfile
for f in sys.argv[1:]:
    s=open(f).read()
    blocks=re.findall(r'<script>(.*?)</script>',s,re.S)
    for i,b in enumerate(blocks):
        p=os.path.join(tempfile.gettempdir(),'_lilstudio_chk.js')
        open(p,'w').write(b)
        r=subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc','-e','checkSyntax("%s")'%p],capture_output=True,text=True)
        out=(r.stdout+r.stderr).strip()
        print(f,i,'OK' if not out else out[:500])
