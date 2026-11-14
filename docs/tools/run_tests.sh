#!/bin/bash
# Runs every app page's interaction test, the JS error check and the link check.
# Needs a preview server on $PORT (default 8790) from the repo root:  python3 -m http.server 8790
# Usage: docs/tools/run_tests.sh [appid ...]
cd "$(dirname "$0")"
APPS=${@:-lilstats lilhide lilusage lildock lilsnap lildim lilmirror lilvibe lilpass lilpad lilbounce}
for a in $APPS; do
  cat tests/t_common.js tests/t_$a.js > /tmp/_lilstudio_run.js
  echo "$a: $(python3 shot.py $a/index.html /dev/null --jsfile /tmp/_lilstudio_run.js --dom --budget 20000 2>&1 | tail -1 | cut -c1-110)"
done
for p in index.html lildisplay/index.html; do
  echo "$p errors: $(python3 shot.py $p /dev/null --js 'setTimeout(()=>document.title="E:"+__errs.length+" "+__errs.join("|"),2500)' --dom 2>&1 | tail -1)"
done
echo "wheel peek: $(python3 shot.py index.html /dev/null --jsfile tests/t_peek.js --dom --motion --budget 15000 2>&1 | tail -1 | cut -c1-200)"
python3 links.py | tail -1
