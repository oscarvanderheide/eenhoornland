// node cdp.mjs tests/t-keien.mjs — big stones: ✕ next to one lifts it over her head, ✕ again puts it down in front of her,
// she jumps on top of it (also with an animal in her arms), and where it lies is kept after a reload (tmp-shots/k-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); await t.sleep(300);
  const info = await J('__w.keien.info()'); ok(info.stones.length >= 10, 'big stones lie around: ' + info.stones.length);
  const S = await J(`(() => { const st = __w.keien.stones().find(s => s.zone === 'dorp'); for (const [dx, dz] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) if (__w.walkable(st.x + dx, st.z + dz)) return { id: st.id, x: st.x, z: st.z, sx: st.x + dx + .5, sz: st.z + dz + .5 }; })()`);
  ok(!(await t.ev(`__w.walkable(${S.x}, ${S.z})`)), 'a stone is solid: she does not walk through it');
  await t.ev(`__w.placeAt(${S.sx}, ${S.sz})`); await t.sleep(700); await t.shot('tmp-shots/k-1-next-to.png');
  ok(await t.ev('__w.action().key') === 'kei', '✕ next to it: lift it (' + await t.ev('__w.action().key') + ')');
  await t.ev('__w.jump()'); ok(await until(`__w.keien.holding() && __w.keien.holding().id === ${S.id}`), 'up it goes, over her head'); await t.sleep(500); await t.shot('tmp-shots/k-2-held.png');
  ok(await t.ev(`__w.walkable(${S.x}, ${S.z})`), 'where it lay is free now');
  ok(await t.ev('__w.action().key') === 'putkei', 'holding it, ✕ puts it down');
  // walk a bit with it, then put it down
  await t.ev(`__w.placeAt(30.5, 46.5); __w.kid.face = 1`); await t.sleep(600);
  ok(await t.ev('__w.leap({ x: 1, z: 0 })') === false, 'too heavy to jump with');
  await t.ev('__w.jump()'); await t.sleep(600);
  const put = await J(`__w.keien.info().stones[${S.id}]`); ok(!(await t.ev('__w.keien.holding()')) && Math.abs(put[0] - 30) <= 1 && Math.abs(put[1] - 46) <= 1, 'put down right next to her: ' + put);
  await t.shot('tmp-shots/k-3-put.png');
  // jump on it with an animal in her arms
  const from = await J(`(() => { const x = ${put[0]}, z = ${put[1]}; for (const dx of [-2, 2]) if (__w.walkable(x + dx, z) && __w.walkable(x + dx / 2, z)) return [x + dx + .5, z + .5, -Math.sign(dx)]; return [x - 1.5, z + .5, 1]; })()`);
  await t.ev(`__w.placeAt(${from[0]}, ${from[1]})`); await t.sleep(500);
  await t.ev(`(a => { a.pos.set(__w.kid.pos.x, 0, __w.kid.pos.z + .3); a.path = []; a.wait = 30; a.fly = null; a.swim = null; window.__a = a; __w.life.lift(a); })(__w.animals.find(a => a.g.visible && !a.water && !a.uniKind && !a.way && !a.dog))`); await t.sleep(600);
  ok(await t.ev('__w.life.carrying() === __a'), 'she holds an animal');
  await t.ev(`__w.kid.face = ${from[2]}; __w.leap({ x: ${from[2]}, z: 0 })`);
  ok(await until(`__w.kid.lift > .3`, 2500), 'she jumps on top of the stone with the animal'); await t.sleep(500); await t.shot('tmp-shots/k-4-on-top.png');
  ok(await t.ev('__w.life.carrying() === __a'), 'and still holds it');
  // arms full: no stone while she holds an animal, and no animal while she holds a stone
  await t.ev(`__w.placeAt(${from[0]}, ${from[1]})`); await t.sleep(500);
  const nx = await J(`(() => { const x = ${put[0]}, z = ${put[1]}; for (const [dx, dz] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) if (__w.walkable(x + dx, z + dz)) return [x + dx + .5, z + dz + .5]; })()`);
  await t.ev(`__w.placeAt(${nx[0]}, ${nx[1]})`); await t.sleep(500);
  ok(/^throw/.test(await t.ev('__w.action().key')), 'next to the stone with an animal in her arms, ✕ throws the animal (' + await t.ev('__w.action().key') + ')');
  await t.ev(`__w.keien.lift(__w.keien.stones()[${S.id}])`); await t.sleep(200);
  ok(!(await t.ev('__w.keien.holding()')) && await t.ev('__w.life.carrying() === __a'), 'the stone will not come up: she still holds the animal');
  await t.ev('__w.life.throwIt()'); await t.sleep(1200);
  ok(await t.ev('__w.action().key') === 'kei', 'the animal thrown, ✕ lifts the stone');
  await t.ev('__w.jump()'); ok(await until('!!__w.keien.holding()'), 'up it goes');
  await t.ev(`__a.pos.set(__w.kid.pos.x + .4, 0, __w.kid.pos.z); __a.path = []; __a.fly = null; __w.life.lift(__a)`); await t.sleep(200);
  ok(!(await t.ev('__w.life.carrying()')), 'holding the stone she cannot pick up an animal');
  await t.ev(`__w.placeAt(${nx[0]}, ${nx[1]})`); await t.ev('__w.keien.putDown()'); await t.sleep(400);
  const put2 = await J(`__w.keien.info().stones[${S.id}]`); put.splice(0, 2, ...put2);
  // the stone stays where she left it
  await t.go(URL.replace('?', '?r&')); await t.sleep(1200);
  ok(JSON.stringify(await J(`__w.keien.info().stones[${S.id}]`)) === JSON.stringify(put), 'after a reload the stone is where she put it');
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l) && !/favicon/.test(l)).slice(0, 8)) console.log('  log', l);
}
