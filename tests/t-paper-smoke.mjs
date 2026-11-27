// The quick look: does the world load, can she walk to every named place, and what does it look like at a few spots.
// About half a minute. Use this while building; the longer tests are for when something they cover was changed.
//   SERVE=8766 node cdp.mjs tests/t-paper-smoke.mjs      shots in tmp-shots/s-*.png      AT=fountain,swing picks the spots
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  await t.send('Emulation.setDeviceMetricsOverride', { width: 750, height: 313, deviceScaleFactor: 2, mobile: true });
  await t.go(`http://127.0.0.1:${port}/paper/?set=${process.env.SET || 'dorp'}&fps`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
  await t.ev(`window.__err = []; addEventListener('error', e => __err.push(String(e.message)))`); await t.sleep(2200);
  const s = await t.ev('__p.stats()'), shut = await t.ev('__p.reach()'), r = await t.ev('__p.open(), __p.reach()'), lost = Object.entries(r.places).filter(([n, v]) => !v && !n.startsWith('boomhut ') && !['kasteel', 'regenboog', 'kasteelzaal'].some(k => n.startsWith(k + ' ') && (process.env.SET || 'dorp') !== k) && !(['kasteel', 'regenboog', 'kasteelzaal'].includes(process.env.SET) && n.includes(' '))).map(([n]) => n);   // (the castle is reached only by flying, over its mountains; the rainbow island by boat: from either, only its own places)
  ok(s.fps > 5, `it runs: ${s.sets.join(', ')}; built in ${s.load.toFixed(0)} ms; ${s.calls} draws, ${(s.tris / 1000).toFixed(0)}k triangles`);
  ok(!lost.length, `she can walk to all ${Object.keys(r.places).length} named places` + (lost.length ? ' NOT: ' + lost.join(', ') : ''));
  { const n = Object.values(shut.places).filter(v => !v).length; if (n) console.log(`     (with the gates shut, ${n} of them lie beyond)`); }
  await t.shot('tmp-shots/s-start.png');
  const all = {}; for (const n of s.sets) Object.assign(all, Object.fromEntries(Object.entries(await t.ev(`__p.places('${n}')`)).map(([k, v]) => [n === s.set ? k : n + ' ' + k, v])));
  for (const n of (process.env.AT || 'fountain,swing,mud,north').split(',')) { const p = all[n]; if (!p) { console.log('     (no place called ' + n + ')'); continue; } await t.ev(`__p.placeAt(${p[0]}, ${p[1]})`); await t.sleep(2800); await t.shot(`tmp-shots/s-${n.replace(' ', '-')}.png`); }
  const err = await t.ev('__err'); ok(!err.length, 'no errors on the page' + (err.length ? ': ' + err.join(' | ') : ''));
}
