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

  // the camera: walking over the border of a shot changes it exactly once, and she never turns back on the screen while it glides
  const sh0 = await t.ev('__p.shots()');
  console.log('     she is, in points on this screen: ' + sh0.list.map(s => `${s.name} ${s.her.toFixed(0)}`).join(', '));
  const cross = async (what, from, press, want, secs, expect) => {
    await t.ev(`__p.placeAt(${from[0]}, ${from[1]})`); await t.sleep(2600);
    const before = await t.ev('__p.shots()');
    await t.ev(`__p.track(${JSON.stringify(want)})`); await press(true); await t.sleep(secs * 1000); await press(false);
    const tr = await t.ev('__p.tracked()'), sh = await t.ev('__p.shots()'); await t.ev('__p.track(null)');
    ok(sh.on === expect && sh.changes - before.changes === 1 && tr.min > 0 && tr.n > 20, `${what}: ${before.on} -> ${sh.on}, ${sh.changes - before.changes} change, slowest step along her way ${tr.min.toFixed(2)} a second (${tr.sx.toFixed(1)} right, ${tr.sz.toFixed(1)} down on the screen)`);
  };
  const key = k => on => t.ev(`__p.keys(${on ? JSON.stringify([k]) : '[]'})`);
  await cross('left into the playground', [-.6, -.4], key('a'), [-1, 0], 1.7, 'speeltuin');
  await cross('right out of it again', [-4.6, .3], key('d'), [1, 0], 1.7, 'dorp');
  await cross('right onto the east bridge', [7.0, 2.4], key('d'), [1, 0], 1.3, 'brug-oost');
  await cross('left off it again', [10.2, 2.4], key('a'), [-1, 0], 1.6, 'dorp');
  await cross('down from her door', [places.start[0], places.start[1]], key('s'), [0, 1], 1.0, 'dorp');
  await cross('up to her door', [places.start[0], -1.7], key('w'), [0, -1], 1.1, 'thuis');
  await cross('up onto the north bridge', [6, -5], key('w'), [0, -1], 1.5, 'brug-noord');
  await cross('down off it again', [6, -8.5], key('s'), [0, 1], 1.6, 'dorp');
  // the same with a finger held still on the glass, to her right
  const finger = on => t.send('Input.dispatchMouseEvent', { type: on ? 'mousePressed' : 'mouseReleased', x: 1000, y: 430, button: 'left', clickCount: 1, pointerType: 'mouse' });
  await cross('a finger held to her right, onto the east bridge', [7.0, 2.4], finger, [1, 0], 1.15, 'brug-oost');
  await t.sleep(2500); await t.shot('tmp-shots/d-shot-brug-oost-desk.png');
  const fingerL = on => t.send('Input.dispatchMouseEvent', { type: on ? 'mousePressed' : 'mouseReleased', x: 250, y: 430, button: 'left', clickCount: 1, pointerType: 'mouse' });
  await cross('a finger held to her left, into the playground where the camera turns', [-.6, -.4], fingerL, [-1, 0], 1.5, 'speeltuin');
  for (const [n, at] of [['thuis', places.start], ['speeltuin', places.swing], ['vijver', places.pond], ['wei', places.pen], ['brug-noord', places.north], ['modder', places.mud], ['dorp', places.fountain]]) { await t.ev(`__p.placeAt(${at[0]}, ${at[1]})`); await t.sleep(3200); ok((await t.ev('__p.shots()')).on === n, `the shot at ${n} is on there`); await t.shot(`tmp-shots/d-shot-${n}-desk.png`); }

  await t.ev('__p.placeAt(10.2, 2.4)'); await t.sleep(3200);
  // and tapping makes no new program (confetti is cut from paper that is kept)
  const n0 = (await t.ev('__p.count()')).newest; await t.ev(`__p.tap('unicorn')`); await t.sleep(2500); await t.ev(`__p.tap('girl')`); await t.sleep(600);
  ok((await t.ev('__p.count()')).newest === n0, 'a tap with confetti builds no program again');

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
  { const taps = async () => { for (const who of ['sheep', 'mama', 'unicorn']) { await t.ev(`__p.tap('${who}')`); await t.sleep(900); } await t.sleep(1500); return (await t.ev('__p.count()')).newest; };
    const n1 = await taps(), n2 = await taps(); ok(n1 === n2, 'on the island too: sheep, mama and unicorn tapped a second time, no program built again'); }
  await t.ev('__p.tap("house")'); await t.sleep(500); ok((await t.ev('__p.info()')).door === 1, 'the island still answers after all that (its door opens)');

  // the phone, lying down
  await open('?set=dorp&fps', LAND); await t.sleep(2600);
  const p = await t.ev('__p.stats()'); ok(p.fps > 5, `on the phone lying down she is ${p.her.toFixed(0)} points tall, ${p.calls} draws`);
  await t.shot('tmp-shots/d-start-land.png');
  const shp = await t.ev('__p.shots()'), small = shp.list.filter(s => s.play && s.her < 40), tiny = shp.list.filter(s => s.her < 22);
  console.log('     she is, in points on the phone: ' + shp.list.map(s => `${s.name} ${s.her.toFixed(0)}${s.play ? '' : ' (walk through)'}`).join(', '));
  ok(!small.length && !tiny.length, 'on the phone she is at least 40 points tall wherever there are things to tap, and 22 where she only walks through' + (small.length || tiny.length ? ' NOT: ' + [...small, ...tiny].map(s => s.name).join(', ') : ''));
  // a finger that just misses a small thing still counts: far back on the bridge the unicorn is small. Find a spot on the screen
  // that is off every card but within a finger's width of the unicorn, and tap there
  await t.ev('__p.placeAt(10.2, 2.4)'); await t.sleep(3500);
  const u = await t.ev(`__p.screen('unicorn')`); let spot = null;
  for (let k = 0; k < 16 && !spot; k++) { const x = u[0] + Math.cos(k / 16 * 6.283) * 19, y = u[1] + Math.sin(k / 16 * 6.283) * 19; if (!(await t.ev(`__p.direct(${x}, ${y})`)) && (await t.ev(`__p.near(${x}, ${y})`)) === 'unicorn') spot = [x, y]; }
  if (spot) { await t.click(spot[0], spot[1]); await t.sleep(250); }
  ok(spot && await t.ev(`__p.hop('unicorn')`) > .05, 'a tap 19 points from the small unicorn on the bridge, off its card, still makes it hop' + (spot ? '' : ' (no such spot found)'));
  for (const [n, at] of [['thuis', places.start], ['speeltuin', places.swing], ['vijver', places.pond], ['wei', places.pen], ['brug-oost', places.east], ['brug-noord', places.north], ['modder', places.mud], ['dorp', places.fountain]]) { await t.ev(`__p.placeAt(${at[0]}, ${at[1]})`); await t.sleep(3200); await t.shot(`tmp-shots/d-shot-${n}-land.png`); }
}
