// node cdp.mjs tests/t-weather.mjs — rain and frogs, autumn piles, snow and the snowman (tmp-shots/w-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  ok(await t.ev('__w.weather.info().wx') === 'zon', 'the first day is sunny'); ok(await t.ev('__w.weather.info().frogs') === 0 && !(await t.ev('__w.weather.info().snowman')), 'no frogs, no snowman');
  const seen = new Set(); for (let d = 2; d < 40; d++) { await t.ev(`__w.Q.quest.day = ${d}`); seen.add(await t.ev('__w.Q.weather()')); } ok(seen.size === 4, 'over the days every weather comes by: ' + [...seen]);
  const force = async w => { await t.ev(`__w.Q.quest.day = 2; __w.Q.quest.wxForce = '${w}'; __w.weather.sync(); 0`); await t.sleep(500); };

  await force('regen'); await t.ev('__w.placeAt(27.5, 44.5)'); await t.sleep(2000);
  ok(await t.ev('__w.weather.info().frogs') === 3, 'rain: the frogs are out'); await t.shot('tmp-shots/w-1-regen.png');

  await force('herfst'); ok(await t.ev('__w.weather.info().piles') === 8, 'autumn: piles of leaves');
  const p = await J('__w.weather.piles()[3]'); await t.ev(`__w.placeAt(${p[0]} - 1.6, ${p[1]})`); await t.sleep(1500); await t.shot('tmp-shots/w-2-herfst.png');
  await t.ev(`__w.placeAt(${p[0]}, ${p[1]})`); await t.sleep(300); await t.ev('__w.jump()'); await t.sleep(500);
  ok(await t.ev('__w.weather.info().piles') === 7, 'jumping in a pile: leaves everywhere'); await t.shot('tmp-shots/w-3-jump.png');
  ok(await t.ev(`Math.hypot(__w.animals.find(a => a.name === 'Egel').pos.x - ${p[0]}, __w.animals.find(a => a.name === 'Egel').pos.z - ${p[1]}) < 1.5`), 'a hedgehog was sleeping in it');
  ok(await t.ev('__w.Q.pileGone(3)'), 'the pile stays flat (saved)');

  await force('sneeuw'); await t.sleep(300); ok(await t.ev('__w.weather.info().snowman') && await t.ev('__w.weather.info().piles') === 7, 'snow: a snowman and heaps of snow');
  await t.ev(`__w.placeAt(${await t.ev('__w.MAP.FOUNT.cx')} - 4, ${await t.ev('__w.MAP.FOUNT.cz')} + 3.5)`); await t.sleep(1500); await t.shot('tmp-shots/w-4-sneeuw.png');
  for (let k = 0; k < 3; k++) { await t.ev('__w.weather.tapSnowman()'); await t.sleep(500); }
  ok(!(await t.ev('__w.weather.info().nose')), 'the third tap: his carrot nose falls off'); await t.sleep(1800); await t.shot('tmp-shots/w-5-nose.png');
  await t.ev(`__w.Q.quest.wxForce = null; __w.Q.quest.day = 1; __w.weather.sync(); 0`);
  console.log(fail ? 'WEATHER FAILED ' + fail : 'WEATHER OK');
}
