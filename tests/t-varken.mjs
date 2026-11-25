// node cdp.mjs tests/t-varken.mjs — the village's south: the pig rolls in the mud, and a wash with the watering can
// makes it pink again (tmp-shots/p2-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  const M = await J('{ MUD: __w.MAP.MUD, POND: __w.MAP.POND }');
  const pig = await t.ev(`__w.animals.findIndex(a => a.name === 'Varken')`); ok(pig >= 0, 'a pig lives in the village');
  const P = `__w.animals[${pig}]`;
  await t.ev(`__w.placeAt(${M.MUD.cx + 2.5}, ${M.MUD.cz - 1.5})`); await t.ev(`(a => { a.pos.set(${M.MUD.cx + 1.5}, 0, ${M.MUD.cz - 1.5}); a.path = []; a.wait = 30; })(${P})`); await t.sleep(1500); await t.shot('tmp-shots/p2-1-pig.png');
  await t.ev(`__w.ways.tap(${P})`); ok(await until(`${P}.way && ${P}.way.roll`, 3000), 'a tap: the pig rolls in the mud'); await t.sleep(500); await t.shot('tmp-shots/p2-2-roll.png');
  ok(await until(`!${P}.way && ${P}.dirty`, 5000), 'and is all muddy'); await t.sleep(300); await t.shot('tmp-shots/p2-3-muddy.png');
  // fetch water with the can and wash it
  await t.ev(`__w.toys.take('gieter')`); await t.ev(`__w.placeAt(${M.POND.cx + 2.6}, ${M.POND.cz})`); ok(await until(`__w.toys.info().water === 3`, 4000), 'the can fills at the pond');
  await t.ev(`(a => { a.pos.set(${M.MUD.cx + 2.5}, 0, ${M.MUD.cz - 1.5}); a.path = []; a.wait = 30; })(${P}); __w.placeAt(${M.MUD.cx + 3.5}, ${M.MUD.cz - 1.5})`); await t.sleep(400);
  ok(await t.ev(`__w.action() && __w.action().key`) === 'was', 'next to the muddy pig with the can, the action button pours');
  const c0 = await t.ev('__w.Q.quest.coins'); await t.ev('__w.jump()');
  ok(await until(`!${P}.dirty`, 3000), 'a wash: the pig is pink again'); await t.sleep(300); await t.shot('tmp-shots/p2-4-clean.png');
  ok(await until(`__w.Q.quest.coins === ${c0 + 1}`, 3000), 'with a coin, once a day');
  if (fail) console.log('  VARKEN FAILED ' + fail);
}
