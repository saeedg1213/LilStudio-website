#!/bin/bash
# make_dmg.sh <AppName> <path/to/App.app> <icon.png> <tagline> <hex> <out.dmg>
set -euo pipefail
S=$(cd "$(dirname "$0")" && pwd)
NAME=$1 APP=$2 ICON=$3 TAG=$4 HEX=$5 OUT=$6
CS=$(codesign -dv --verbose=2 "$APP" 2>&1 || true); [[ "$CS" == *"Authority=Developer ID Application"* ]] || { echo "not Developer ID"; exit 1; }
SP=$(spctl -a -vv "$APP" 2>&1 || true); [[ "$SP" == *"Notarized Developer ID"* ]] || { echo "not notarized"; exit 1; }
BG=$S/bg/$NAME; mkdir -p $BG
$S/make_bg "$ICON" "$NAME" "$TAG" "$HEX" $BG
tiffutil -cathidpicheck $BG/background.png $BG/background@2x.png -out $BG/background.tiff >/dev/null
STAGE=$(mktemp -d -t $NAME-dmg); ditto "$APP" "$STAGE/$NAME.app"
rm -f "$OUT"
create-dmg --volname "$NAME" --volicon "$STAGE/$NAME.app/Contents/Resources/AppIcon.icns" \
  --background $BG/background.tiff --window-pos 200 120 --window-size 640 448 \
  --icon-size 112 --text-size 13 --icon "$NAME.app" 170 220 --hide-extension "$NAME.app" \
  --app-drop-link 470 220 --no-internet-enable "$OUT" "$STAGE" >/dev/null
hdiutil verify "$OUT" 2>&1 | tail -1
rm -rf "$STAGE"; ls -la "$OUT"
