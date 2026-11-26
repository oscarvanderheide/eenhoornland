// node cdp.mjs tests/t-speeltuin.mjs — the village playground: the swing builds up only when she pushes in time (a held
// direction gets nowhere), taps push too, she jumps off and lands on her feet; the slide: climb, whoosh, hop off (tmp-shots/sp-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  const S = await J('{ SW: __w.MAP.SWING, SL: __w.MAP.SLIDE }'), on = `[${S.SW.on[0] + .5}, ${S.SW.on[1] + .5}]`;
  await t.ev(`__w.Q._reset({ stage: 'baby' }); __w.placeAt(...${on}); 0`); await t.sleep(800);
  // 1. the action button in front of the swing puts her on; pushing in time takes her high
  ok(await t.ev('__w.action().key') === 'schommel', 'in front of the swing the button is the swing');
  await t.ev('__w.action().run()'); ok(await until(`__w.park.mode() === 'swing'`), 'on the swing');
  for (let i = 0; i < 80; i++) { const om = await t.ev('__w.park.info().om'); await t.ev(`__w.stick(${om >= 0 ? 1 : -1}, 0)`); await t.sleep(100); }
  await t.ev('__w.stick(0, 0)'); const timed = (await J('__w.park.info()')).amp; ok(timed > 1, 'pushing in time takes her high: ' + timed);
  await t.shot('tmp-shots/sp-1-high.png');
  ok(await t.ev('__w.action().key') === 'jump', 'on the swing the button jumps off');
  await t.ev('__w.action().run()'); ok(await until(`__w.park.mode() === null`, 3000), 'she flies off and lands');
  const L = await J(`[__w.kid.pos.x, __w.kid.pos.z, __w.kid.lift, __w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))]`);
  ok(L[3] && L[2] === 0 && Math.abs(L[0] - (S.SW.x + .5)) > 1.5, 'on her feet, clear of the frame: ' + L);
  // 2. holding one way gets nowhere; down hops her off
  await t.ev(`__w.placeAt(...${on})`); await t.sleep(5000); await t.ev('__w.park.boardSwing()'); await until(`__w.park.mode() === 'swing'`);
  await t.ev('__w.stick(1, 0)'); await t.sleep(8000); await t.ev('__w.stick(0, 0)'); const held = (await J('__w.park.info()')).amp;
  ok(held < .6 && held < timed / 2, 'holding one way gets nowhere: ' + held);
  await t.key('ArrowDown', 200); ok(await until(`__w.park.mode() === null`, 3000), 'down: off she hops');
  // 3. real taps: on the swing, then left / right of her push
  await t.ev(`__w.placeAt(...${on})`); await t.sleep(3000);
  const sw = await J(`__w.screen(${S.SW.x + .5}, 2.1, ${S.SW.z + .5})`); await t.click(sw[0], sw[1]); ok(await until(`__w.park.mode() === 'swing'`), 'a tap on the swing: on she gets');
  for (let i = 0; i < 16; i++) { const om = await t.ev('__w.park.info().om'), k = await J(`__w.screen(__w.kid.pos.x, .5, __w.kid.pos.z)`); await t.click(k[0] + (om >= 0 ? 160 : -160), k[1]); await t.sleep(450); }
  const tapped = (await J('__w.park.info()')).amp; ok(tapped > .5, 'taps beside her push her: ' + tapped);
  await t.ev('__w.action().run()'); await until(`__w.park.mode() === null`, 3000);
  // 4. the slide: walking into the ladder starts it; up, whoosh, off at the bottom
  await t.ev(`__w.placeAt(${S.SL.on[0] + .3}, ${S.SL.on[1] + .5})`); await t.sleep(600);
  await t.key('ArrowRight', 600); ok(await until(`__w.park.mode() === 'climb' || __w.park.mode() === 'top'`, 2000), 'walking into the ladder: up she climbs');
  ok(await until(`__w.park.mode() === 'slide'`, 3000), 'down the slide'); await t.sleep(250); await t.shot('tmp-shots/sp-2-slide.png');
  ok(await until(`__w.park.mode() === null`, 3000), 'and off at the bottom');
  const E = await J(`[Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z), __w.kid.lift]`); ok(E[0] === S.SL.off[0] && E[1] === S.SL.off[1] && E[2] === 0, 'standing at the end of the slide ' + E);
  ok(await t.ev(`(__w.placeAt(${S.SL.on[0] + .5}, ${S.SL.on[1] + .5}), __w.action().key)`) === 'glijbaan', 'in front of the ladder the button is the slide');
  // 5. with an animal in her arms down the slide; her egg waits at the edge of the sand
  await t.ev(`__w.Q._reset({ stage: 'ei' }); __w.placeAt(${S.SL.on[0] + .5}, ${S.SL.on[1] + .5}); 0`); await t.sleep(800);
  await t.ev(`(a => { a.pos.set(__w.kid.pos.x, 0, __w.kid.pos.z + .3); a.path = []; a.wait = 30; a.fly = null; a.swim = null; window.__a = a; __w.life.lift(a); })(__w.animals.find(a => a.g.visible && !a.water && !a.uniKind && !a.way && !a.dog))`); await t.sleep(400);
  await t.ev('__w.park.startSlide()'); ok(await until(`__w.park.mode() === 'top' || __w.park.mode() === 'slide'`, 3000), 'with an animal in her arms she climbs the slide');
  ok(await t.ev('__w.life.carrying() === __a && __a.lift > __w.kid.lift + .5'), 'the animal is up there with her, over her head'); await t.shot('tmp-shots/sp-3-animal.png');
  const PW = await J('__w.park.watch()'); await t.sleep(600);
  ok(!!PW && await t.ev(`Math.hypot(__w.uni.pos.x - ${PW[0]}, __w.uni.pos.z - ${PW[1]}) < 1.2`), 'her egg waits at the edge of the sand: ' + PW + ' / ' + await J('[__w.uni.pos.x, __w.uni.pos.z]'));
  ok(await until(`__w.park.mode() === null`, 4000) && await t.ev('__w.life.carrying() === __a'), 'down they go together');
  if (fail) throw new Error(fail + ' failed');
}
