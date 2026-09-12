#!/usr/bin/env bash
set -euo pipefail
: "${SCHEME:?Set SCHEME}"; : "${PROJECT_OR_WORKSPACE:?Set PROJECT_OR_WORKSPACE}"
mkdir -p build/archive build/ipa
P=(-scheme "$SCHEME" -configuration Release); if [[ "$PROJECT_OR_WORKSPACE" == *.xcworkspace ]]; then P=(-workspace "$PROJECT_OR_WORKSPACE" "${P[@]}"); else P=(-project "$PROJECT_OR_WORKSPACE" "${P[@]}"); fi
xcodebuild "${P[@]}" -destination 'generic/platform=iOS' -archivePath "build/archive/$SCHEME.xcarchive" archive
if [[ -n "${EXPORT_OPTIONS:-}" ]]; then xcodebuild -exportArchive -archivePath "build/archive/$SCHEME.xcarchive" -exportOptionsPlist "$EXPORT_OPTIONS" -exportPath build/ipa; fi
