// node cdp.mjs tests/t-boomhut.mjs — the treehouse in the forest: up the ladder, the telescope, the acorns, the zipline
// down to the village, and the squirrel of the oak (tmp-shots/b-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777, sand: [[60, 70, 2]], picked: { munt: [1, 2] } }); 0`); await t.go(URL); await t.sleep(2000); console.log('  (a later cycle: seed ' + await t.ev('__w.seed') + ')'); }
  const R = await J('__w.MAP.ROOMS.hut'), Z = await J('__w.MAP.ZIP');
  const room = () => t.ev(`__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`);
  const tapAt = async (x, y, z) => { const p = await J(`__w.screen(${x}, ${y}, ${z})`); await t.click(p[0], p[1]); };
  const goNear = async (x, z) => { await t.ev(`(() => { let b = null, bd = 1e9; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const X = Math.floor(${x}) + dx, Z = Math.floor(${z}) + dz; if (!__w.walkable(X, Z)) continue; const d = Math.hypot(X + .5 - ${x}, Z + .5 - ${z}) + (Z + .5 > ${z} + .3 ? 2 : 0); if (d > .9 && d < bd) { bd = d; b = [X, Z]; } } if (b) __w.placeAt(b[0] + .5, b[1] + .5); })()`); await t.sleep(400); };   // taps on things only reach what is near her

  await t.ev(`__w.placeAt(${R.door[0] + .5}, ${R.door[1] + 1.5})`); await t.sleep(1800); await t.shot('tmp-shots/b-1-oak.png');
  // a tap on the tree: she walks to the ladder and climbs up into the house
  await tapAt(Z.from[0], 3.2, Z.from[1] - .6);
  ok(await until(`__w.kid.lift > 1.2 && !__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`, 4000), 'she climbs up the ladder'); await t.shot('tmp-shots/b-1b-ladder.png');
  ok(await until(`__w.MAP.roomAt(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z)) === 'hut'`, 10000), 'a tap on the oak: up the ladder into the treehouse'); await t.sleep(1500); await t.shot('tmp-shots/b-2-inside.png');
  // the telescope looks out over the islands
  const S = [R.x0 + 1.5, R.z0 + .7]; await goNear(S[0], S[1]);
  { const k = await J('__w.action() && __w.action().key'); ok(String(k).startsWith('tap'), 'next to the telescope the action button shows it (' + k + ')'); await t.shot('tmp-shots/b-2b-act-telescope.png'); }
  await tapAt(S[0], .5, S[1]);
  ok(await until(`__w.hut.info().view === 1`, 6000), 'a tap on the telescope: she looks through it'); await t.sleep(900); await t.shot('tmp-shots/b-3-telescope.png');
  ok(await until(`Math.hypot(__w.camera.position.x - __w.kid.pos.x, __w.camera.position.z - __w.kid.pos.z) < 30`, 6000), 'and the view comes back to her');
  // the acorns: a coin once a day
  const c0 = await t.ev('__w.Q.quest.coins'); await goNear(R.x1 - .2, R.z1 - .4); await tapAt(R.x1 - .2, .3, R.z1 - .4);
  ok(await until(`__w.Q.quest.coins === ${c0 + 1}`, 6000), 'the squirrel\'s acorns tumble out, with a coin among them'); await t.sleep(300); await t.shot('tmp-shots/b-4-acorns.png');
  // the hammock: in she climbs, rocks and dozes, and hops out again
  await goNear(R.x0 + 4.5, R.z0 + .8); await tapAt(R.x0 + 4.5, .5, R.z0 + .8); ok(await until(`__w.hut.napping()`, 6000), 'a tap on the hammock: she swings in it'); await t.sleep(1800); await t.shot('tmp-shots/b-4b-hammock.png');
  ok(await until(`!__w.hut.napping() && !__w.busy()`, 6000), 'and hops out again');
  // the zipline
  await goNear(R.zip[0] + .5, R.z0 + .1); await tapAt(R.zip[0] + .5, 1, R.z0 + .1);
  ok(await until(`__w.hut.riding()`, 8000), 'a tap on the platform door: onto the zipline'); await t.sleep(1900); await t.shot('tmp-shots/b-5-zip.png');
  ok(await t.ev(`__w.kid.lift > .4`), 'she hangs high above the water');
  ok(await until(`!__w.hut.riding() && !__w.busy()`, 8000), 'and lands'); await t.sleep(600); await t.shot('tmp-shots/b-6-landed.png');
  { const p = await J('__w.info().pos'); ok(Math.hypot(p[0] - Z.to[0], p[1] - Z.to[1]) < .8 && await t.ev(`__w.M.zone[__w.M.I(${Math.floor(Z.to[0])}, ${Math.floor(Z.to[1])})]`) === 'dorp', 'in the village, by the pole ' + p); }
  ok(await t.ev(`__w.walkTo(31, 44)`) && await until(`!__w.kid.path.length`, 8000), 'and walks on from there');
  // the squirrel
  const sq = await t.ev(`__w.animals.findIndex(a => a.name === 'Eekhoorn')`); ok(sq >= 0, 'a squirrel lives by the oak');
  await t.ev(`__w.placeAt(${Z.from[0] + .5}, ${Z.from[1] + 3})`); await t.sleep(800);
  await t.ev(`(a => { a.pos.set(${Z.from[0] - 1.5}, 0, ${Z.from[1] + 2.5}); a.path = []; a.wait = 30; __w.ways.tap(a); })(__w.animals[${sq}])`);
  ok(await until(`__w.animals[${sq}].lift > 2`, 3000), 'a tap: up the oak it goes'); await t.sleep(600); await t.shot('tmp-shots/b-7-squirrel.png');
  const c1 = await t.ev('__w.Q.quest.coins'); await t.ev(`__w.ways.tap(__w.animals[${sq}])`);
  ok(await until(`__w.Q.quest.coins === ${c1 + 1}`, 3000), 'a tap while it is up there: an acorn with a coin');
  ok(await until(`!__w.animals[${sq}].way && __w.animals[${sq}].lift === 0`, 8000), 'and back down it comes');
  if (fail) console.log('  BOOMHUT FAILED ' + fail);
}
