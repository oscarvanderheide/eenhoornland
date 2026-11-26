// node cdp.mjs tests/t-powers.mjs — an old unicorn from the meadow comes along and shows what she can do (tmp-shots/u-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  // a herd of five, one of every kind, as after five adventures
  await t.ev(`(() => { const K = __w.Q.KINDS, herd = ['bos', 'bloem', 'zee', 'regenboog', 'ster'].map((k, i) => ({ body: K[k].bodies[0], mane: K[k].manes[0], horn: K[k].horns[0], name: 'U' + k, kind: k, mark: null, wings: false })); __w.Q._reset({ stage: 'zoek', cycle: 5, herd }); })(); 0`);
  await t.sleep(1500);
  const herdIdx = k => t.ev(`__w.animals.findIndex(a => a.uniKind === '${k}')`);
  ok((await J(`__w.animals.filter(a => a.uniKind).map(a => a.uniKind)`)).length === 5, 'the five old unicorns are in the meadow');
  const come = async k => { const i = await herdIdx(k); await t.ev(`(a => { a.pos.set(36.5, 0, 46.5); __w.placeAt(34.5, 46.5); })(__w.animals[${i}]); 0`); await t.sleep(700); await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); return i; };

  // the forest unicorn: trees around shake, mushrooms pop up
  let i = await come('bos'); ok(await until(`__w.animals[${i}].friend`, 15000), 'a tap on an old unicorn: she comes along'); ok(!(await t.ev('!!__w.life.carrying()')), 'she is not lifted');
  await t.ev(`__w.walkTo(31, 44)`); await t.sleep(4000); ok(await t.ev(`Math.hypot(__w.animals[${i}].pos.x - __w.kid.pos.x, __w.animals[${i}].pos.z - __w.kid.pos.z) < 4`), 'and walks along'); await t.shot('tmp-shots/u-1-along.png');
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); ok(await until(`__w.life.info().power === 'bos'`, 10000), 'a second tap: the forest power'); await t.sleep(900); await t.shot('tmp-shots/u-2-bos.png');
  // the flower unicorn: flowers in her footsteps
  { const p = await J(`(a => [a.pos.x, a.pos.z])(__w.animals[${i}])`); await t.ev(`__w.placeAt(${p[0] + .6}, ${p[1]})`); await t.sleep(300);
    const k = await t.ev('__w.action().key'); ok(!/^hallo/.test(k), 'next to the old unicorn walking along, ✕ is not for her (' + k + ')'); }
  i = await come('bloem'); await until(`__w.animals[${i}].friend`, 15000); ok(await t.ev(`__w.animals.filter(a => a.uniKind && a.friend).length`) === 1, 'one old unicorn at a time');
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); await t.sleep(300); await t.ev(`__w.walkTo(30, 45)`); await t.sleep(5000); ok(await t.ev('__w.life.info().blooms') > 3, 'the flower power: flowers grow where she walks'); await t.shot('tmp-shots/u-3-bloem.png');
  // the rainbow unicorn: a rainbow slide to somewhere further on
  i = await come('regenboog'); await until(`__w.animals[${i}].friend`, 15000); const p0 = await J('__w.info().pos');
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); await t.sleep(700); await t.shot('tmp-shots/u-4-regenboog.png');
  ok(await until(`Math.hypot(__w.info().pos[0] - ${p0[0]}, __w.info().pos[1] - ${p0[1]}) > 5 && !__w.busy()`, 20000), 'the rainbow power: she slides far away'); ok(await t.ev('__w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))'), 'and lands on her feet'); await t.sleep(600); await t.shot('tmp-shots/u-5-landed.png');
  // the sea unicorn: under the sea, but only near the water
  i = await come('zee'); await until(`__w.animals[${i}].friend`, 15000);
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); await t.sleep(800); ok(!(await t.ev(`!!document.querySelector('#activity:not([hidden])') && !!window.__zee`)), 'far from the sea she only shows a wave');
  const shore = await J(`(() => { const M = __w.M, k = __w.kid.pos; let best = null, bd = 1e9; for (let z = 3; z < M.H - 3; z++) for (let x = 3; x < M.W - 3; x++) { if (!__w.walkable(x, z) || !__w.walkable(x + 1, z)) continue; let wet = false; for (let d = -2; d <= 2 && !wet; d++) for (let e = -2; e <= 2; e++) if (M.ground[M.I(x + d, z + e)] === __w.MAP.SE && !M.deck[M.I(x + d, z + e)]) wet = true; const dd = Math.hypot(x - k.x, z - k.z); if (wet && dd < bd) { bd = dd; best = [x, z]; } } return best; })()`);
  await t.ev(`(() => { const a = __w.animals[${i}]; __w.placeAt(${shore[0]} + .5, ${shore[1]} + .5); a.pos.set(${shore[0]} + 1.5, 0, ${shore[1]} + .5); })(); 0`); await t.sleep(800);
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); ok(await until('!!window.__zee', 30000), 'near the sea: down she dives'); await t.sleep(1500); await t.shot('tmp-shots/u-6-zee.png');
  const coins0 = await t.ev('__w.Q.quest.coins');
  await t.ev(`__zee.tap(__zee.octo.x, __zee.octo.y - 6)`); await t.ev(`__zee.tap(__zee.puffer.x, __zee.puffer.y)`); await t.ev(`__zee.tap(__zee.chest.x, __zee.chest.y - 4)`); await t.ev(`__zee.tap(__zee.clam.x, __zee.clam.y - 2)`); await t.sleep(700);
  ok(await t.ev('__zee.octo.hide > 0 && __zee.puffer.puff > 0'), 'the octopus hides in its ink, the pufferfish puffs up'); await t.shot('tmp-shots/u-7-zee-tapped.png');
  await t.ev(`__zee.tap(__zee.clam.x, __zee.clam.y - 2)`); await t.sleep(300);
  ok(await t.ev('__w.Q.quest.coins') === coins0 + 2, 'a coin from the chest and one from the clam');
  await t.ev(`__zee.chest.open = 0; __zee.tap(__zee.chest.x, __zee.chest.y - 4)`); await t.sleep(200); ok(await t.ev('__w.Q.quest.coins') === coins0 + 2, 'but only once a day');
  await t.ev(`__zee.tap(120, 4)`); ok(await until('!window.__zee', 10000), 'a tap on the surface: back up'); await t.sleep(1000);
  // the star unicorn: up into the clouds
  i = await come('ster'); await until(`__w.animals[${i}].friend`, 15000);
  await t.ev(`__w.life.tapAnimal(__w.animals[${i}])`); ok(await until('!!window.__wolk', 10000), 'the star unicorn flies her up into the clouds'); await t.sleep(1500);
  await t.ev(`__wolk.tap(__wolk.moon.x, __wolk.moon.y)`); await t.ev(`__wolk.tap(__wolk.clouds[1].x, __wolk.clouds[1].y)`); await t.sleep(900); ok(await t.ev('__wolk.moon.awake > 0 && __wolk.clouds[1].rain > 0'), 'the moon wakes up, a cloud rains'); await t.shot('tmp-shots/u-8-wolken.png');
  await t.ev(`__wolk.me.x = __wolk.clouds[1].x; __wolk.me.tx = __wolk.me.x; __wolk.me.y = __wolk.clouds[1].y + 22; __wolk.me.ty = __wolk.me.y; 0`); ok(await until('__wolk.rainbow() > 0', 15000), 'under the rain: a rainbow'); await t.shot('tmp-shots/u-9-rainbow.png');
  await t.ev(`__wolk.tap(120, 126)`); ok(await until('!window.__wolk', 10000), 'a tap on the ground below: home');
  console.log(fail ? 'POWERS FAILED ' + fail : 'POWERS OK');
}
