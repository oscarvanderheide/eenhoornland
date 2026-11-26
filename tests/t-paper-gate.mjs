// The gate between two sets (paper/paper.js stepGate): she walks over the north bridge out of the village and into the forest
// behind a sheet of paper, and back. Also the forest blockout (paper/set-bos.js) itself.
//   SERVE=8766 node cdp.mjs tests/t-paper-gate.mjs      shots in tmp-shots/g-*.png
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  const open = async (q, m) => { await t.send('Emulation.setDeviceMetricsOverride', m); await t.go(`http://127.0.0.1:${port}/paper/${q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500); };
  const DESK = { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }, LAND = { width: 750, height: 313, deviceScaleFactor: 2, mobile: true };
  const until = async (expr, secs) => { for (let i = 0; i < secs * 10; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };

  // the forest by itself
  await open('?set=bos&fps', DESK); await t.sleep(2600);
  const s = await t.ev('__p.stats()'), r = await t.ev('__p.reach()'), lost = Object.entries(r.places).filter(([, v]) => !v).map(([n]) => n);
  ok(s.set === 'bos' && s.fps > 5, `the forest loads: ${s.calls} draws, ${(s.tris / 1000).toFixed(0)}k triangles, built in ${s.load.toFixed(0)} ms`);
  ok(!lost.length && Object.keys(r.places).length >= 8, `she can walk to every named place in the forest (${Object.keys(r.places).length})` + (lost.length ? ' NOT: ' + lost.join(', ') : ''));
  await t.shot('tmp-shots/g-bos-start-desk.png');
  const bp = await t.ev('__p.places()');
  for (const n of ['clearing', 'grot', 'oak']) { await t.ev(`__p.placeAt(${bp[n][0]}, ${bp[n][1]})`); await t.sleep(3000); await t.shot(`tmp-shots/g-bos-${n}-desk.png`); }
  ok((await t.ev('__p.shots()')).on !== 'grot', 'away from the cave the cave shot is off'); await t.ev(`__p.placeAt(${bp.grot[0]}, ${bp.grot[1]})`); await t.sleep(600);
  ok((await t.ev('__p.shots()')).on === 'grot', 'at the mouth of the cave the camera comes close');

  // out of the village, over the bridge, into the forest: with the stick held up all the way
  await open('?set=dorp&fps', DESK); await t.sleep(1500);
  await t.ev('__p.placeAt(6, -7.6)'); await t.sleep(2800); await t.shot('tmp-shots/g-1-before.png');
  const before = await t.ev('__p.info()');
  await t.ev(`__p.keys(['w'])`);
  ok(await until('__p.gate().active', 3), 'walking up the bridge, the sheet of paper starts across'); await t.sleep(330); await t.shot('tmp-shots/g-2-sheet.png');
  ok(await until(`__p.info().set === 'bos'`, 3), 'behind it the forest is built'); await t.ev('__p.keys([])');
  ok(await until('!__p.gate().active', 3), 'and the sheet slides on'); await t.sleep(300);
  const a = await t.ev('__p.info()'), g = await t.ev('__p.gate()');
  ok(a.set === 'bos' && Math.abs(a.h + .12) < .01 && Math.abs(a.girl[0] - (before.girl[0] - 1.2)) < .2 && a.girl[1] < 7.8 && a.girl[1] > 4.6, `she stands on the same bridge, further along, seen from the forest (${a.girl.map(v => v.toFixed(1))}); built in ${g.build.toFixed(0)} ms, first picture ${g.first.toFixed(0)} ms`);
  ok((await t.ev('__p.shots()')).on === 'brug' && await t.ev('__p.uniOk()'), 'the far bridge shot is still on and the unicorn came along');
  await t.sleep(1500); await t.shot('tmp-shots/g-3-after.png');
  // on into the forest
  await t.ev(`__p.keys(['w'])`); await t.sleep(1400); await t.ev('__p.keys([])'); await t.sleep(400);
  const inF = await t.ev('__p.info()'); ok(inF.set === 'bos' && inF.h === 0, `she walks off the bridge onto the forest floor (${inF.girl.map(v => v.toFixed(1))})`);
  // and back: turn round, the gate takes her home
  await t.ev(`__p.keys(['s'])`);
  ok(await until(`__p.info().set === 'dorp' && !__p.gate().active`, 9), 'walking back down the bridge she comes home to the village'); await t.ev('__p.keys([])'); await t.sleep(300);
  const home = await t.ev('__p.info()'); ok(Math.abs(home.h + .12) < .01 && home.girl[1] > -9.4 && home.girl[1] < -5.5, `on the village's side of the bridge (${home.girl.map(v => v.toFixed(1))}), and no second gate took her straight back`);
  await t.sleep(1200); ok((await t.ev('__p.info()')).set === 'dorp', 'she stays there');

  // a tap far up the bridge instead of the stick: she walks, the gate takes her, she walks on a little and stops
  await t.ev('__p.placeAt(6, -7.6)'); await t.sleep(600); await t.ev('__p.walkTo(6, -11.5)');
  ok(await until(`__p.info().set === 'bos' && !__p.gate().active`, 6), 'a tap up the bridge takes her through as well'); await t.sleep(900);
  const st = await t.ev('__p.info()'); await t.sleep(500); const st2 = await t.ev('__p.info()');
  ok(st.set === 'bos' && Math.hypot(st.girl[0] - st2.girl[0], st.girl[1] - st2.girl[1]) < .05, 'and then she stands still, waiting');

  // nothing piles up, and no program is built twice: four more times there and back
  const trip = async () => { await t.ev(`__p.keys(['s'])`); await until(`__p.info().set === 'dorp' && !__p.gate().active`, 9); await t.ev(`__p.keys(['w'])`); await until(`__p.info().set === 'bos' && !__p.gate().active`, 9); await t.ev('__p.keys([])'); await t.sleep(1800); return t.ev('__p.count()'); };
  const c1 = await trip(), c2 = await trip(); await trip(); const c4 = await trip();
  const diff = ['geometries', 'textures', 'programs', 'newest', 'taps', 'solids', 'trees', 'ground', 'figures', 'things'].filter(k => c2[k] !== c4[k]);
  ok(c4.set === 'bos' && !diff.length, `there and back four times: nothing left behind, no program built twice (${c4.geometries} shapes, ${c4.programs} programs)` + (diff.length ? ' CHANGED: ' + diff.map(k => `${k} ${c2[k]} -> ${c4[k]}`).join(', ') : ''));
  console.log(`     after the first trips: programs ${c1.programs} -> ${c4.programs}, newest ${c1.newest} -> ${c4.newest}; last gate built in ${(await t.ev('__p.gate()')).build.toFixed(0)} ms`);

  // the phone, lying down
  await open('?set=dorp&fps', LAND); await t.sleep(1500); await t.ev('__p.placeAt(6, -8.6)'); await t.sleep(2800); await t.shot('tmp-shots/g-1-before-land.png');
  await t.ev(`__p.keys(['w'])`); await until('__p.gate().active', 3); await t.sleep(330); await t.shot('tmp-shots/g-2-sheet-land.png');
  ok(await until(`__p.info().set === 'bos' && !__p.gate().active`, 4), 'on the phone lying down the gate takes her through'); await t.ev('__p.keys([])'); await t.sleep(1500); await t.shot('tmp-shots/g-3-after-land.png');
  await t.ev(`__p.placeAt(${bp.grot[0]}, ${bp.grot[1]})`); await t.sleep(3200); await t.shot('tmp-shots/g-bos-grot-land.png');
  const sh = await t.ev('__p.shots()'); console.log('     in the forest she is, in points on the phone: ' + sh.list.map(x => `${x.name} ${x.her.toFixed(0)}`).join(', '));
}
