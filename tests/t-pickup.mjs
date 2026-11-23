// node cdp.mjs tests/t-pickup.mjs — picking an animal up with a real pointer (screenshots in tmp-shots/p-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  const info = await J(`(()=>{const k=__w.kid.pos; let best=null,d=1e9; __w.animals.forEach((a,i)=>{const e=Math.hypot(a.pos.x-k.x,a.pos.z-k.z); if(a.g.visible&&e<d){d=e;best=i;}}); return {i:best,d}})()`);
  console.log('nearest animal', JSON.stringify(info));
  await t.ev(`(a=>{__w.placeAt(a.pos.x-1.5,a.pos.z+1.2)})(__w.animals[${info.i}])`); await t.sleep(2500);
  const scr = () => J(`(()=>{const a=__w.animals[${info.i}]; const p=__w.screen(a.pos.x,.35,a.pos.z); return {x:p[0],y:p[1],held:!!a.held,fly:!!a.fly,px:a.pos.x,pz:a.pos.z}})()`);
  let s = await scr(); console.log(JSON.stringify(s)); await t.shot('tmp-shots/p-1-before.png');
  await t.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let k = 1; k <= 6; k++) { await t.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.x + k * 15, y: s.y - k * 4, button: 'left', buttons: 1 }); await t.sleep(60); }
  let h = await scr(); ok(h.held, 'a drag on an animal lifts it'); await t.shot('tmp-shots/p-2-held.png');
  await t.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x + 90, y: s.y - 24, button: 'left', clickCount: 1 });
  h = await scr(); ok(h.fly || Math.abs(h.px - s.px) > .3, 'letting go throws it');
  // a plain tap: she walks over and carries it; a tap on her puts it down; a tap on it throws it
  await t.ev(`__w.animals.forEach(a=>{a.fly=null;a.lift=0})`); await t.ev(`(a=>{a.pos.set(32.5,0,43.5);__w.placeAt(30.5,43.5)})(__w.animals[${info.i}])`); await t.sleep(2500);
  s = await scr(); await t.click(s.x, s.y); const got = async () => t.ev(`__w.life.carrying()===__w.animals[${info.i}]`);
  let up = false; for (let k = 0; k < 40 && !up; k++) { up = await got(); if (!up) await t.sleep(400); } ok(up, 'a tap on an animal: she walks over and lifts it'); await t.sleep(900); await t.shot('tmp-shots/p-3-carry.png');
  await t.ev(`__w.walkTo(34,45)`); await t.sleep(5000); h = await scr(); ok(await got() && Math.hypot(h.px - (await J('__w.info().pos'))[0]) < .3, 'it goes where she goes'); await t.shot('tmp-shots/p-4-walk.png');
  const kp = await J(`__w.screen(__w.kid.pos.x,.4,__w.kid.pos.z)`); await t.click(kp[0], kp[1]); await t.sleep(600); ok(!(await got()) && !(await scr()).held, 'a tap on her puts it down'); await t.shot('tmp-shots/p-5-down.png');
  await t.sleep(1500); s = await scr(); await t.click(s.x, s.y); up = false; for (let k = 0; k < 30 && !up; k++) { up = await got(); if (!up) await t.sleep(400); } ok(up, 'and up again'); await t.sleep(900);
  s = await J(`__w.screen(__w.kid.pos.x,1.35,__w.kid.pos.z)`); await t.click(s[0], s[1]); await t.sleep(300); h = await scr(); ok(h.fly && !(await got()), 'a tap on the animal above her head throws it'); await t.shot('tmp-shots/p-6-throw.png');
  // no rain puddles: she jumps into the duck pond and the fountain
  ok(await t.ev('__w.M.puddles.length') === 0, 'no rain puddles lie around');
  const P = await J('__w.MAP.POND'); await t.ev(`__w.placeAt(${P.cx + P.rx + .9}, ${P.cz + .2})`); await t.sleep(1200); await t.ev('__w.jump()');
  ok(await until(`__w.life.dipping()`, 3000), 'a jump next to the duck pond: in she goes'); await t.sleep(1800); await t.shot('tmp-shots/p-7-pond.png');
  ok(await until(`!__w.life.dipping() && !__w.busy()`, 20000), 'and out she climbs again'); await t.sleep(500); await t.shot('tmp-shots/p-7b-wet.png');
  const F = await J('__w.MAP.FOUNT'); await t.ev(`__w.placeAt(${F.cx + .5}, ${F.cz + 2.3})`); await t.sleep(1000); await t.ev('__w.jump()'); ok(await until(`__w.life.dipping()`, 3000), 'and into the fountain'); await t.sleep(1800); await t.shot('tmp-shots/p-7c-fountain.png'); await until(`!__w.life.dipping()`, 20000);
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.setMount('uni'); 0`); await t.sleep(500); await t.key('ArrowLeft', 900); ok(await t.ev('__w.uni.face') === -1, 'riding left with the keys, the unicorn looks left'); await t.shot('tmp-shots/p-8-ride-left.png');
  // into the water: an animal swims back, a ball is blown back by the wind; behind a tree an animal still shows
  await t.ev(`__w.Q._reset({ stage: 'zoek' }); __w.placeAt(20.5, 45.5); 0`); await t.sleep(1500);
  await t.ev(`(a=>{__w.life.hold(a); a.pos.set(17.5,0,45.5); __w.life.toss(a,-5,0)})(__w.animals[0])`); ok(await until(`!!__w.animals[0].swim`, 20000), 'thrown into the sea it swims'); await t.sleep(700); await t.shot('tmp-shots/p-9-swim.png');
  ok(await until(`!__w.animals[0].swim && __w.walkable(Math.floor(__w.animals[0].pos.x), Math.floor(__w.animals[0].pos.z))`, 60000), 'and climbs out on the beach');
  const bw = `__w.M.ground[__w.M.I(Math.floor(__w.play.info().balls[0][0]), Math.floor(__w.play.info().balls[0][1]))]`;
  await t.ev(`__w.placeAt(19.5, 42.5)`); for (let k = 0; k < 8 && await t.ev(`${bw} !== __w.MAP.SE`); k++) { await t.ev(`__w.play.kick(0, -1, 0)`); await t.sleep(700); } ok(await until(`${bw} === __w.MAP.SE`, 8000), 'the ball rolls into the sea'); await t.sleep(600); await t.shot('tmp-shots/p-10-ball-floats.png');
  ok(await until(`${bw} !== __w.MAP.SE`, 30000), 'and a gust of wind blows it back'); await t.sleep(1500); await t.shot('tmp-shots/p-11-ball-back.png');
  const R = await J('__w.MAP.RAMPS[0]'); await t.ev(`__w.placeAt(${R[0]} + 1.6, ${R[1]} + 1.2)`); await t.sleep(2000); await t.shot('tmp-shots/p-12-ramp.png');
  const B = await J('__w.MAP.BIKE'); await t.ev(`__w.placeAt(${B[0]} - 1.5, ${B[1]} + 1)`); await t.sleep(2000); await t.shot('tmp-shots/p-13-bike.png');
  // pebbles and the pick-up key
  const st = await J('__w.M.stones[0]'); await t.ev(`__w.placeAt(${st[0]} + 1.4, ${st[1]} + .6)`); await t.sleep(1500); await t.shot('tmp-shots/p-14-stone.png');
  await t.ev(`__w.grabKey()`); await t.sleep(900); ok(await t.ev(`!!__w.life.carrying() && __w.life.carrying().stone === true`), 'the pick-up key lifts the pebble next to her'); await t.shot('tmp-shots/p-15-stone-held.png');
  await t.ev(`__w.grabKey()`); await t.sleep(250); ok(await t.ev(`!__w.life.carrying() && !!__w.life.stones[0].fly`), 'the key again throws it'); ok(await until(`!__w.life.stones[0].fly`, 20000), 'and it lands'); await t.shot('tmp-shots/p-16-stone-thrown.png');
  console.log(fail ? 'PICKUP FAILED ' + fail : 'PICKUP OK');
}
