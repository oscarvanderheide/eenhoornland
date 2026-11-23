#!/bin/bash
# usage: ./shot.sh "<query e.g. ?act=atelier>" out.png [width] [height] [ms]
# Renders dev.html inside an iframe of exactly WxH (headless Chrome can't make windows narrower than ~500px).
Q="$1"; OUT="$2"; W="${3:-1100}"; H="${4:-700}"; MS="${5:-5000}"
cd "$(dirname "$0")"; python3 build-dev.py
QE=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$Q")
WW=$(( W > 600 ? W : 600 ))
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --mute-audio --hide-scrollbars --force-device-scale-factor=1 --use-angle=swiftshader --enable-unsafe-swiftshader --enable-webgl --ignore-gpu-blocklist \
  --window-size=$WW,$H --virtual-time-budget=$MS --screenshot="$OUT" "http://localhost:8765/frame.html?w=$W&h=$H&q=$QE" 2>/dev/null
echo "saved $OUT"
