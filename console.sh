#!/bin/bash
# prints page console messages/errors: ./console.sh "?act=atelier"
cd "$(dirname "$0")"; python3 build-dev.py
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --virtual-time-budget=6000 --enable-logging=stderr --v=0 --dump-dom "http://localhost:8765/dev.html$1" 2>&1 >/dev/null | grep -A6 "CONSOLE" | grep -v -E "GPU stall|cv_display|gcm" | head -60
echo "(console check done)"
