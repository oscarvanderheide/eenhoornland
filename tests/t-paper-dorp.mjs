// The village blockout (paper/set-dorp.js, /paper/?set=dorp): it loads, every named place of the old map can be walked to,
// and a set thrown away is really gone (island -> village -> island leaves nothing behind).
//   SERVE=8766 node cdp.mjs tests/t-paper-dorp.mjs      shots in tmp-shots/d-*.png
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  const open = async (q, m) => { await t.send('Emulation.setDeviceMetricsOverride', m); await t.go(`http://127.0.0.1:${port}/paper/${q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500); };
  const DESK = { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }, LAND = { width: 750, height: 313, deviceScaleFactor: 2, mobile: true };

  await open('?set=dorp&fps', DESK);
  const info = await t.ev('__p.info()'); ok(info.set === 'dorp' && info.h !== null, `the village loads and she stands on it (${info.girl.map(v => v.toFixed(1))})`);
  const r = await t.ev('__p.reach()'), lost = Object.entries(r.places).filter(([, v]) => !v).map(([n]) => n);
  ok(!lost.length && Object.keys(r.places).length > 10, `she can walk to every named place (${Object.keys(r.places).length} places, ${r.cells} steps of floor)` + (lost.length ? ' NOT: ' + lost.join(', ') : ''));
  await t.sleep(2600); const s = await t.ev('__p.stats()');
  ok(s.fps > 5 && s.calls < 260, `it draws: ${s.calls} draws, ${(s.tris / 1000).toFixed(0)}k triangles, built in ${s.load.toFixed(0)} ms, she is ${s.her.toFixed(0)} points tall`);
  await t.shot('tmp-shots/d-start-desk.png');
  const places = await t.ev('__p.places()');
  for (const n of ['fountain', 'swing', 'pond', 'pen', 'east', 'north', 'mud']) { await t.ev(`__p.placeAt(${places[n][0]}, ${places[n][1]})`); await t.sleep(2200); await t.shot(`tmp-shots/d-${n}-desk.png`); }

  // she walks: down the stairs from her door to the square
  await t.ev(`__p.placeAt(${places.start[0]}, ${places.start[1]}); __p.walkTo(${places.start[0]}, -1.5)`); await t.sleep(3500);
  const w = await t.ev('__p.info()'); ok(Math.abs(w.girl[1] + 1.5) < .3 && Math.abs(w.h) < .01, `she walks down the stairs from her door to the square (${w.girl.map(v => v.toFixed(1))})`);

  // thrown away means gone: back and forth, and nothing piles up
  await open('', DESK); for (let i = 0; i < 20 && (await t.ev('__p.doll().warm')) > 0; i++) await t.sleep(300);
  const first = await t.ev('__p.count()');
  await t.ev(`__p.load('dorp')`); await t.sleep(400); await t.ev(`__p.load('eiland')`); await t.sleep(6500);   // the first visit makes what is kept for good; the wait lets her blink once (a drawing made late)
  const v1 = await t.ev('__p.count()'); console.log('     kept after a first visit: ' + ['geometries', 'textures', 'programs', 'newest'].map(k => `${k} ${first[k]} -> ${v1[k]}`).join(', '));
  const trips = async () => { for (let i = 0; i < 3; i++) { await t.ev(`__p.load('dorp')`); await t.sleep(400); await t.ev(`__p.load('eiland')`); await t.sleep(400); } await t.sleep(1600); return t.ev('__p.count()'); };
  const a = await trips(), b = await trips();   // the theatre's own pieces count once they have been in view, so compare three trips with three more
  const same = ['geometries', 'textures', 'programs', 'newest', 'calls', 'taps', 'solids', 'trees', 'ground', 'figures', 'things'].filter(k => a[k] !== b[k]);   // newest: no program was made again
  ok(!same.length, `island, village, island six times over leaves nothing behind and builds no program twice (${b.geometries} shapes, ${b.textures} pictures, ${b.programs} programs)` + (same.length ? ' CHANGED: ' + same.map(k => `${k} ${a[k]} -> ${b[k]}`).join(', ') : ''));
  const ms = []; for (let i = 0; i < 3; i++) { ms.push(await t.ev(`__p.load('dorp')`)); await t.sleep(300); } console.log('     the village builds in ' + ms.map(v => v.toFixed(0)).join(', ') + ' ms here');
  await t.ev(`__p.load('eiland')`); await t.sleep(600);
  await t.ev('__p.tap("house")'); await t.sleep(500); ok((await t.ev('__p.info()')).door === 1, 'the island still answers after all that (its door opens)');

  // the phone, lying down
  await open('?set=dorp&fps', LAND); await t.sleep(2600);
  const p = await t.ev('__p.stats()'); ok(p.fps > 5, `on the phone lying down she is ${p.her.toFixed(0)} points tall, ${p.calls} draws`);
  await t.shot('tmp-shots/d-start-land.png');
  for (const n of ['fountain', 'east']) { await t.ev(`__p.placeAt(${places[n][0]}, ${places[n][1]})`); await t.sleep(2200); await t.shot(`tmp-shots/d-${n}-land.png`); }
}
