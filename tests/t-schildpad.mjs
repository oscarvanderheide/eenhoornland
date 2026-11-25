// node cdp.mjs tests/t-schildpad.mjs — the south beach: the turtle's nest hatches, the babies run to the sea, the mother
// lays new eggs (tmp-shots/s-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777 }); 0`); await t.go(URL); await t.sleep(2000); }
  const N = await J('__w.MAP.NEST'); const tapAt = async (x, y, z) => { const p = await J(`__w.screen(${x}, ${y}, ${z})`); await t.click(p[0], p[1]); };
  await t.ev(`__w.placeAt(${N[0] + .5}, ${N[1] - 1.5})`); await t.sleep(1500); await t.shot('tmp-shots/s-1-nest.png');
  ok(await t.ev('__w.beach.eggs()'), 'there are eggs in the nest');
  await t.ev(`__w.placeAt(${N[0] + .5}, ${N[1] - .4})`); await t.sleep(400);
  ok(await t.ev(`__w.action() && __w.action().key`) === 'nest', 'next to the nest the action button hatches it');
  await t.ev(`__w.placeAt(${N[0] + .5}, ${N[1] - 1.5})`); await t.sleep(400); await tapAt(N[0] + .5, .15, N[1] + .5);
  ok(await until('__w.beach.babies() === 4', 3000), 'a tap: four little turtles crawl out'); await t.sleep(1400); await t.shot('tmp-shots/s-2-babies.png');
  ok(await until('__w.beach.babies() === 0', 8000), 'and they all reach the sea'); ok(!(await t.ev('__w.beach.eggs()')), 'the nest is empty');
  const mum = await t.ev(`__w.animals.findIndex(a => a.name === 'Schildpad')`); ok(mum >= 0, 'the mother turtle lives on the beach');
  await t.ev(`(a => { a.pos.set(${N[0] - 2.5}, 0, ${N[1] - 1.5}); a.path = []; a.wait = 30; __w.ways.tap(a); })(__w.animals[${mum}])`);
  ok(await until(`__w.animals[${mum}].way && __w.animals[${mum}].way.kind === 'leggen'`, 2000), 'a tap on her: she goes to lay eggs'); await t.sleep(2500); await t.shot('tmp-shots/s-3-laying.png');
  ok(await until('__w.beach.eggs()', 12000), 'new eggs in the nest');
  ok(await until(`!__w.animals[${mum}].way`, 4000), 'and she is done');
  await t.ev(`__w.ways.tap(__w.animals[${mum}])`); ok(await until(`__w.animals[${mum}].way && __w.animals[${mum}].way.kind === 'verlegen'`, 2000), 'eggs there already: she is shy');
  if (fail) console.log('  SCHILDPAD FAILED ' + fail);
}
