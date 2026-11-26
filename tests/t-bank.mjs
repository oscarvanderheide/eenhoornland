// node cdp.mjs tests/t-bank.mjs — the village benches: the action button, a real tap and walking into one sit her down;
// a key, the button and a tap on the ground get her up again; on the pond bench the ducks come over (tmp-shots/b-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); await t.sleep(500);
  const B = await J('__w.MAP.BENCHES'), sat = '__w.seated() >= 0';
  // 1. in front of the pond bench the action button shows the bench and sits her down; the ducks come to see
  await t.ev(`__w.placeAt(${B[0].x + .5}, ${B[0].z + 1.6})`); await t.sleep(700);
  ok(await t.ev('__w.action().key') === 'bank', 'in front of a bench the button is the bench: ' + await t.ev('__w.action().key'));
  await t.ev('__w.action().run()'); ok(await until(sat), 'the button sits her down');
  ok((await J('__w.kid.lift')) > .1, 'she sits up on the seat');
  ok(await until(`__w.animals.filter(a => a.water && a.path.length).length > 0`, 2000), 'the ducks paddle over');
  await t.sleep(1800); await t.shot('tmp-shots/b-1-pond.png');
  { const x = await t.ev('__w.action().key'); ok(!/^(jump|dip)$/.test(x) && await t.ev('__w.action(true).key') === 'jump', 'sitting, ✕ neither jumps nor hops into the pond (' + x + '), ○ hops her off'); }
  await t.ev('__w.leapNow()'); ok(await until(`!(${sat})`), 'and off she hops');
  // 2. a real tap on the fountain bench from close by, then a key gets her up
  await t.ev(`__w.placeAt(${B[2].x + 1}, ${B[2].z + 2.2})`); await t.sleep(900);
  const s = await J(`__w.screen(${B[2].cx}, .3, ${B[2].z + .45})`); await t.click(s[0], s[1]);
  ok(await until(sat), 'a tap on the bench sits her down'); await t.sleep(1000); await t.shot('tmp-shots/b-2-fountain.png');
  await t.key('ArrowLeft', 400); ok(await until(`!(${sat})`), 'a key gets her up');
  // 3. walking into it from the front sits her down; a tap on the ground walks her off
  await t.ev(`__w.placeAt(${B[1].x + .5}, ${B[1].z + 1.5})`); await t.sleep(600);
  await t.key('ArrowUp', 1200); ok(await until(sat), 'walking into the bench sits her down ' + JSON.stringify(await J(`[__w.kid.pos.x, __w.kid.pos.z, __w.kid.lift, __w.seated(), __w.info()]`)));
  const g = await J(`__w.screen(${B[1].x + 2.5}, 0, ${B[1].z + 2.5})`); await t.click(g[0], g[1]);
  ok(await until(`!(${sat}) && __w.kid.lift === 0 && __w.kid.pos.z > ${B[1].z + 1}`, 5000), 'a tap on the ground walks her off ' + JSON.stringify(await J(`[__w.kid.pos.x, __w.kid.pos.z, __w.kid.lift, __w.seated(), __w.info()]`)) + JSON.stringify(g));
  // 4. riding her unicorn: no sitting (the ride button simply works)
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.placeAt(${B[2].x + .5}, ${B[2].z + 1.5}); 0`); await t.sleep(500);
  await t.ev('__w.action().run()'); await until(sat); await t.ev(`__w.setMount('uni')`); await t.sleep(600);
  ok(!(await t.ev(sat)) && await t.ev(`__w.kid.lift`) > .2, 'getting on her unicorn from the bench: riding, not sitting');
  if (fail) throw new Error(fail + ' failed');
}
