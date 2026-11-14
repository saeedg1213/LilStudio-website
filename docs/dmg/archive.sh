#!/bin/bash
# archive.sh <repo> <project> <scheme>
set -uo pipefail
S=$(dirname "$0"); R=$1; P=$2; SC=$3; B=$S/$R
mkdir -p $B
cd ~/dev/$R
xcodebuild -project "$P" -scheme "$SC" -configuration Release -destination 'generic/platform=macOS' -archivePath $B/$R.xcarchive -allowProvisioningUpdates archive > $B/archive.log 2>&1 || { echo "$R ARCHIVE FAILED"; tail -30 $B/archive.log; exit 1; }
echo "$R archived"
xcodebuild -exportArchive -archivePath $B/$R.xcarchive -exportOptionsPlist $S/ExportOptions.plist -exportPath $B/upload -allowProvisioningUpdates > $B/export.log 2>&1 || { echo "$R EXPORT FAILED"; tail -30 $B/export.log; exit 1; }
echo "$R uploaded for notarization"
for i in $(seq 1 40); do
  sleep 30
  if xcodebuild -exportNotarizedApp -archivePath $B/$R.xcarchive -exportPath $B/notarized -allowProvisioningUpdates > $B/notarize.log 2>&1; then echo "$R notarized"; spctl -a -vv $B/notarized/*.app 2>&1 | tail -3; lipo -info $B/notarized/*.app/Contents/MacOS/*; exit 0; fi
done
echo "$R NOTARIZE TIMEOUT"; tail -20 $B/notarize.log; exit 1
