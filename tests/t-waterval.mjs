// node cdp.mjs tests/t-waterval.mjs — the waterfall in the meadow: singing stepping stones, through the water into the
// grotto, six singing crystals and a rainbow, the koi, and the otter in the pool (tmp-shots/v-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777, sand: [[60, 70, 2]], picked: { munt: [1, 2] } }); 0`); await t.go(URL); await t.sleep(2000); console.log('  (a later cycle: seed ' + await t.ev('__w.seed') + ')'); }
  const F = await J('__w.MAP.FALLS'), R = await J('__w.MAP.ROOMS.val');
  const room = () => t.ev(`__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`);
  const tapAt = async (x, y, z) => { const p = await J(`__w.screen(${x}, ${y}, ${z})`); await t.click(p[0], p[1]); };
  const goNear = async (x, z) => { await t.ev(`(() => { let b = null, bd = 1e9; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const X = Math.floor(${x}) + dx, Z = Math.floor(${z}) + dz; if (!__w.walkable(X, Z)) continue; const d = Math.hypot(X + .5 - ${x}, Z + .5 - ${z}) + (Z + .5 > ${z} + .3 ? 2 : 0); if (d > .9 && d < bd) { bd = d; b = [X, Z]; } } if (b) __w.placeAt(b[0] + .5, b[1] + .5); })()`); await t.sleep(400); };   // taps on things only reach what is near her

  await t.ev(`__w.placeAt(94.5, 43.5)`); await t.sleep(2000); await t.shot('tmp-shots/v-1-falls.png');
  // a tap on the falling water: across the stones and in behind it
  await t.ev(`__w.walkTo(${R.door[0]}, ${R.door[1]})`);   // walking to the falls (a tap on them only reaches them from close by)
  ok(await until(`__w.val.notes() >= 2`, 8000), 'the stepping stones sing as she crosses'); await t.sleep(200); await t.shot('tmp-shots/v-2-stones.png');
  ok(await until(`__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z)) === 'val'`, 10000), 'through the waterfall into the grotto'); await t.sleep(1500); await t.shot('tmp-shots/v-3-grotto.png');
  // six crystals
  const c0 = await t.ev('__w.Q.quest.coins');
  await goNear(R.x0 + 1.4, R.z0 + .35); await tapAt(R.x0 + 1.4, .8, R.z0 + .35); ok(await until(`__w.val.sung().length === 1`, 6000), 'a tap on a crystal: it sings');
  ok(await until(`__w.action() && __w.action().key.startsWith('kristal')`, 3000), 'next to a crystal the action button rings it');
  ok(await t.ev(`[0, 1, 2, 3, 4, 5].every(i => !__w.walkable(Math.floor(${R.x0} + 1.4 + i * 1.55), ${R.z0}))`), 'the crystals are solid');
  for (let i = 1; i < 6; i++) { await t.ev(`__w.val.ring(${i})`); await t.sleep(250); }
  ok(await until(`__w.val.rainbow()`, 3000), 'all six sang: a rainbow in the grotto'); await t.sleep(1500); await t.shot('tmp-shots/v-4-rainbow.png');
  ok(await until(`__w.Q.quest.coins === ${c0 + 1}`, 3000), 'and a coin, once a day');
  // the koi pool
  await tapAt(R.pool.cx, 0, R.pool.cz); await t.sleep(500); await t.shot('tmp-shots/v-5-koi.png');
  // out again: onto the stones in front of the falls
  ok(await t.ev(`__w.walkTo(${R.exit[0]}, ${R.exit[1]})`) && await until(`!__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z)) && __w.kid.pos.z < 50`, 10000), 'out of the grotto, back by the waterfall');
  await t.sleep(800); ok(await t.ev(`__w.walkTo(94, 43)`) && await until(`__w.kid.pos.z > 42.5`, 8000), 'and back across the stones');
  // the otter
  const o = await t.ev(`__w.animals.findIndex(a => a.name === 'Otter')`); ok(o >= 0, 'an otter lives by the pool');
  await t.ev(`(a => { a.pos.set(92.5, 0, 40.5); a.path = []; a.wait = 30; __w.ways.tap(a); })(__w.animals[${o}])`);
  ok(await until(`__w.animals[${o}].way && __w.animals[${o}].way.in`, 3000), 'a tap: splash, into the pool'); await t.sleep(700); await t.shot('tmp-shots/v-6-otter.png');
  const c1 = await t.ev('__w.Q.quest.coins'); await t.ev(`__w.ways.tap(__w.animals[${o}])`);
  ok(await until(`__w.Q.quest.coins === ${c1 + 1}`, 3000), 'a tap while it floats: it cracks its shell, a coin inside');
  ok(await until(`!__w.animals[${o}].way`, 8000) && await t.ev(`__w.walkable(Math.floor(__w.animals[${o}].pos.x), Math.floor(__w.animals[${o}].pos.z))`), 'and back on the bank');
  if (fail) console.log('  WATERVAL FAILED ' + fail);
}
