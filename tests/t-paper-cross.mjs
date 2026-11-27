// The village and the forest stand in one world with one bridge between them (paper/lands.js, paper/paper.js loadWorld):
// she walks the whole bridge both ways and nothing is built, swapped or covered on the way. Also the forest blockout itself.
//   SERVE=8766 node cdp.mjs tests/t-paper-cross.mjs      shots in tmp-shots/x-*.png
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  const open = async (q, m) => { await t.send('Emulation.setDeviceMetricsOverride', m); await t.go(`http://127.0.0.1:${port}/paper/${q === '' ? '?new' : q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500); };
  const DESK = { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }, LAND = { width: 750, height: 313, deviceScaleFactor: 2, mobile: true };
  const until = async (expr, secs) => { for (let i = 0; i < secs * 10; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };

  await open('?set=dorp&fps', DESK); await t.sleep(2600);
  const s = await t.ev('__p.stats()'), r = await t.ev('__p.reach()'), lost = Object.entries(r.places).filter(([, v]) => !v).map(([n]) => n);
  ok(s.sets.join() === 'dorp,bos,huis' && s.set === 'dorp', `the village and the forest both exist; built in ${s.load.toFixed(0)} ms; from her door ${s.calls} draws, ${(s.tris / 1000).toFixed(0)}k triangles`);
  ok(!lost.length && Object.keys(r.places).some(n => n.startsWith('bos ')), `from her door she can walk to every named place of both, over the bridge (${Object.keys(r.places).length} places)` + (lost.length ? ' NOT: ' + lost.join(', ') : ''));
  const bp = await t.ev(`__p.places('bos')`), dp = await t.ev('__p.places()');
  await t.ev(`__p.placeAt(${dp.fountain[0]}, ${dp.fountain[1]})`); await t.sleep(3000); await t.shot('tmp-shots/x-from-square-desk.png');

  // the whole bridge, stick held up: village -> far bridge shot -> forest, two changes of shot, never a long frame, nothing built
  const walk = async (what, from, k, want, done, shots) => {
    await t.ev(`__p.placeAt(${from[0]}, ${from[1]})`); await t.sleep(2800);
    const c0 = await t.ev('__p.count()'), s0 = await t.ev('__p.shots()');
    await t.ev(`__p.track(${JSON.stringify(want)}); __p.keys(['${k}'])`); const got = await until(done, 14); await t.ev('__p.keys([])');
    const tr = await t.ev('__p.tracked()'), s1 = await t.ev('__p.shots()'), c1 = await t.ev('__p.count()'), i = await t.ev('__p.info()'); await t.ev('__p.track(null)');
    ok(got && s1.changes - s0.changes === shots && tr.min > 0 && tr.slow < 60 && c1.newest === c0.newest && c1.programs === c0.programs,
      `${what}: she is on ${i.set} (${i.girl.map(v => v.toFixed(1))}), ${s1.changes - s0.changes} changes of shot (${s0.on} -> ${s1.on}), longest frame ${tr.slow.toFixed(0)} ms, no program built on the way (her walk drawings are shown for the first time, that is all)`);
    return i;
  };
  const far = await walk('up the whole bridge', [6, -5.2], 'w', [0, -1], `__p.shots().on === 'bos'`, 2);
  ok(far.set === 'bos' && far.h === 0, 'at the end she stands on the forest floor'); await t.shot('tmp-shots/x-arrived-desk.png');
  const back = await walk('and all the way back', [far.girl[0], far.girl[1]], 's', [0, 1], `__p.shots().on === 'dorp'`, 2);
  ok(back.set === 'dorp' && back.h === 0, 'at the end she stands in the village again');
  // halfway: the picture a child sees most of the crossing
  await t.ev('__p.placeAt(6, -12.5)'); await t.sleep(3200); ok((await t.ev('__p.shots()')).on === 'brug-noord', 'halfway the far bridge shot is on'); await t.shot('tmp-shots/x-mid-bridge-desk.png');
  // which set she is on decides whose trees are drawn one by one and whose as one glued piece: the picture must not care
  await t.ev(`__p.still(true); document.getElementById('stat').style.visibility = 'hidden'`); await t.sleep(2500); await t.shot('tmp-shots/x-pin-dorp.png'); await t.ev(`__p.pin('bos')`); await t.sleep(900); await t.shot('tmp-shots/x-pin-bos.png'); await t.ev(`__p.pin(null); __p.still(false); document.getElementById('stat').style.visibility = ''`);   // (the readout is hidden: it names the set)
  const same = await t.ev(`(async () => {
    const load = u => new Promise((res, rej) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); res(g.getImageData(0, 0, c.width, c.height)); }; i.onerror = () => rej(new Error('no ' + u)); i.src = u + '?' + Date.now(); });
    try { const a = await load('/tmp-shots/x-pin-dorp.png'), b = await load('/tmp-shots/x-pin-bos.png'); let n = 0; for (let i = 0; i < a.data.length; i += 4) if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > 24) n++; return n / (a.data.length / 4) * 100; } catch (e) { return String(e.message || e); }
  })()`);
  ok(typeof same === 'number' && same < .06, `halfway, with both shores in view, it makes no difference to the picture which set she counts as standing on (${typeof same === 'number' ? same.toFixed(3) + '% changed' : same})`);
  // a tap on the far shore instead of the stick: she walks the whole way
  await t.ev('__p.placeAt(6, -6.8)'); await t.sleep(500); await t.ev(`__p.walkTo(${bp.start[0]}, ${bp.start[1]})`);
  ok(await until(`__p.info().set === 'bos' && __p.info().h === 0`, 12), 'a tap on the forest shore walks her over the whole bridge');
  // crossing again and again makes nothing: the count of everything after two crossings and after six
  const cross = async () => { await t.ev(`__p.placeAt(6, -7); __p.keys(['w'])`); await until(`__p.shots().on === 'bos'`, 14); await t.ev(`__p.keys(['s'])`); await until(`__p.shots().on === 'dorp'`, 14); await t.ev('__p.keys([])'); await t.sleep(600); return t.ev('__p.count()'); };
  const a = await cross(), b = (await cross(), await cross());
  const diff = ['geometries', 'textures', 'programs', 'newest', 'taps', 'solids', 'trees', 'ground', 'figures', 'things'].filter(k => a[k] !== b[k]);
  ok(!diff.length, `there and back three times: nothing is built and nothing left behind (${b.geometries} shapes, ${b.programs} programs)` + (diff.length ? ' CHANGED: ' + diff.map(k => `${k} ${a[k]} -> ${b[k]}`).join(', ') : ''));

  // the forest
  for (const n of ['clearing', 'grot', 'oak']) { await t.ev(`__p.placeAt(${bp[n][0]}, ${bp[n][1]})`); await t.sleep(3000); await t.shot(`tmp-shots/x-bos-${n}-desk.png`); }
  ok((await t.ev('__p.shots()')).on !== 'grot', 'away from the cave the cave shot is off'); await t.ev(`__p.placeAt(${bp.grot[0]}, ${bp.grot[1]})`); await t.sleep(600);
  ok((await t.ev('__p.shots()')).on === 'grot', 'at the mouth of the cave the camera comes close');
  // starting in the forest works too, and the island by itself still stands alone
  await open('?set=bos&fps', DESK); await t.sleep(1500); const f = await t.ev('__p.stats()'), fi = await t.ev('__p.info()');
  ok(f.set === 'bos' && f.sets.join() === 'bos,dorp,huis' && fi.h === 0, `started in the forest she stands there, with the village across the water (${fi.girl.map(v => v.toFixed(1))})`);
  await open('', DESK); await t.sleep(1200); ok((await t.ev('__p.stats()')).sets.join() === 'eiland', 'the test island is still a world of its own');

  // the phone, lying down
  await open('?set=dorp&fps', LAND); await t.sleep(2600);
  const p0 = await t.ev('__p.stats()'); await t.shot('tmp-shots/x-door-land.png');
  await t.ev(`__p.placeAt(${dp.fountain[0]}, ${dp.fountain[1]})`); await t.sleep(3200); await t.shot('tmp-shots/x-from-square-land.png');
  await t.ev('__p.placeAt(6, -7.2)'); await t.sleep(3200); await t.shot('tmp-shots/x-bridge-start-land.png');
  await t.ev('__p.placeAt(6, -12.5)'); await t.sleep(3200); const p1 = await t.ev('__p.stats()'); await t.shot('tmp-shots/x-mid-bridge-land.png');
  await t.ev('__p.placeAt(6, -17.5)'); await t.sleep(3200); await t.shot('tmp-shots/x-bridge-end-land.png');
  await t.ev(`__p.placeAt(${bp.grot[0]}, ${bp.grot[1]})`); await t.sleep(3200); await t.shot('tmp-shots/x-bos-grot-land.png');
  console.log(`     on the phone's shape: at her door ${p0.calls} draws, ${(p0.tris / 1000).toFixed(0)}k triangles; mid-bridge ${p1.calls} draws, ${(p1.tris / 1000).toFixed(0)}k triangles`);
  const sh = await t.ev('__p.shots()'); console.log('     she is, in points on the phone: ' + sh.list.map(x => `${x.name} ${x.her.toFixed(0)}`).join(', '));
}
