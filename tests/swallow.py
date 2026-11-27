# Has a comment in the middle of a line swallowed code? (It happened four times: the files are written in long lines, and
# a `   // note` patched in before the end of one silently turns the rest of the line into a note. The page still loads.)
#   python3 tests/swallow.py      (run by tests/parse.sh)
import re, glob, sys
pat = re.compile(r"(\); |; |\) )(S\.\w+\(|const |let |for \(|if \(|root\.add|step\w*\(|return |\w+\.step\(|else |\w+\.\w+(\.\w+)? = )")
bad = 0
for f in sorted(glob.glob('paper/*.js')):
    for n, line in enumerate(open(f).read().split('\n'), 1):
        st = line.strip()
        if st.startswith('//') or st.startswith('*') or st.startswith('/*'): continue
        i = line.find('   // ')
        if i >= 0 and pat.search(line[i + 6:]):
            print(f"FAIL {f}:{n}: code after a comment: ...{line[i + 6:][:110]}"); bad = 1
if not bad: print("ok   no code swallowed by a comment")
sys.exit(bad)
