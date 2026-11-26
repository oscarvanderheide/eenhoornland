// node cdp.mjs tests/t-eiland.mjs — the rainbow island's new ends: bouncy mushrooms, the flamingo lagoon (tmp-shots/e-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777 }); 0`); await t.go(URL); await t.sleep(2000); }
  const MU = await J('__w.MAP.MUSHROOMS'), FL = await J('__w.MAP.FLAMINGO');
  const tapAt = async (x, y, z) => { const p = await J(`__w.screen(${x}, ${y}, ${z})`); await t.click(p[0], p[1]); };
  // a mushroom: a tap close by and up she jumps, and bounces
  const [mx, mz] = MU[3]; await t.ev(`__w.placeAt(${mx - .5}, ${mz + .5}); __w.kid.face = 1`); await t.sleep(1500); await t.shot('tmp-shots/e-1-mushrooms.png');
  await tapAt(mx + .5, .9, mz + .5);
  ok(await until(`!!__w.perch()`, 3000), 'a tap on a mushroom: she jumps on top');
  ok(await until(`__w.isle.bouncing() >= 3`, 6000), 'and bounces, higher and higher'); await t.sleep(250); await t.shot('tmp-shots/e-2-bounce.png');
  await t.key('ArrowDown', 400); ok(await until(`!__w.perch() && __w.isle.bouncing() === 0`, 4000), 'a step and she jumps off');
  // the flamingos
  await t.ev(`__w.placeAt(${FL.cx}, ${FL.cz - FL.rz - 1.5})`); await t.sleep(1200);
  const fl = await J(`__w.animals.map((a, i) => a.name === 'Flamingo' ? i : -1).filter(i => i >= 0)`); ok(fl.length === 3, 'three flamingos live by the lagoon');
  fl.forEach(async (i, k) => {});
  for (const [k, i] of fl.entries()) await t.ev(`(a => { a.pos.set(${FL.cx - 1.5} + ${k} * 1.2, 0, ${FL.cz - FL.rz - .6}); a.path = []; a.wait = 30; })(__w.animals[${i}])`);
  await t.ev(`__w.ways.tap(__w.animals[${fl[0]}])`); ok(await until(`__w.animals[${fl[0]}].way && __w.animals[${fl[0]}].way.kind === 'been'`, 2000), 'a tap: up on one leg'); await t.sleep(400); await t.shot('tmp-shots/e-3-oneleg.png');
  await t.ev(`__w.ways.tap(__w.animals[${fl[0]}])`); ok(await until(`${JSON.stringify(fl)}.every(i => __w.animals[i].way && __w.animals[i].way.dance)`, 3000), 'another tap: the whole flock dances'); await t.sleep(600); await t.shot('tmp-shots/e-4-dance.png');
  ok(await until(`${JSON.stringify(fl)}.every(i => !__w.animals[i].way)`, 6000), 'and stops again');
  // the rainbow tree: ✕ under it (never a jump) shakes it, twice and the fruit falls
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); await t.sleep(600);
  { const T = await J('__w.MAP.RAINBOW_TREE'); await t.ev(`__w.placeAt(${T[0] + 1.5}, ${T[1] + 1.5})`); await t.sleep(800);
    ok(await t.ev('__w.action().key') === 'shake', 'under the rainbow tree ✕ shakes it (' + await t.ev('__w.action().key') + ')');
    for (let k = 0; k < 2; k++) { await t.ev('__w.jump()'); await t.sleep(700); }
    ok(await until('!__w.extras.info().fruitInTree', 5000), 'twice: the fruit falls out'); await t.shot('tmp-shots/e-5-shake.png'); }
  if (fail) console.log('  EILAND FAILED ' + fail);
}
