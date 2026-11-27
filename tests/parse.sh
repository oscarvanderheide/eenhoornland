#!/bin/sh
# Does every file of the paper game parse? (`node --check file.js` says yes to anything here: it does not read these
# files as modules. Fed in as a module, a slip is caught.)     sh tests/parse.sh
bad=0
for f in paper/*.js; do
  node --input-type=module --check < "$f" 2> /tmp/parse-paper.err || { echo "FAIL $f"; head -4 /tmp/parse-paper.err; bad=1; }
done
[ $bad = 0 ] && echo "ok   every paper file parses"
exit $bad
