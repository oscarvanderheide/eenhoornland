// node cdp.mjs tests/t-pickup.mjs — picking an animal up with a real pointer (screenshots in tmp-shots/p-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  const info = await J(`(()=>{const k=__w.kid.pos; let best=null,d=1e9; __w.animals.forEach((a,i)=>{const e=Math.hypot(a.pos.x-k.x,a.pos.z-k.z); if(a.g.visible&&!a.water&&!a.uniKind&&e<d){d=e;best=i;}}); return {i:best,d}})()`);
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
  await t.ev(`__w.animals.forEach(a=>{a.fly=null;a.lift=0})`); await t.ev(`(a=>{a.pos.set(32.5,0,43.5);a.path=[];a.wait=30;__w.placeAt(30.5,43.5)})(__w.animals[${info.i}])`); await t.sleep(2500);
  // the first tap shows the animal's own hello (world-ways.js); the tap after that picks it up
  const hello = () => t.ev(`(a => { a.wayAt = performance.now(); a.path = []; a.wait = 30; })(__w.animals[${info.i}])`);
  await hello(); s = await scr(); await t.click(s.x, s.y); const got = async () => t.ev(`__w.life.carrying()===__w.animals[${info.i}]`);
  let up = false; for (let k = 0; k < 40 && !up; k++) { up = await got(); if (!up) await t.sleep(400); } ok(up, 'a tap on an animal: she walks over and lifts it'); await t.sleep(900); await t.shot('tmp-shots/p-3-carry.png');
  await t.ev(`__w.walkTo(34,45)`); await t.sleep(5000); h = await scr(); ok(await got() && Math.hypot(h.px - (await J('__w.info().pos'))[0]) < .3, 'it goes where she goes'); await t.shot('tmp-shots/p-4-walk.png');
  const kp = await J(`__w.screen(__w.kid.pos.x,.4,__w.kid.pos.z)`); await t.click(kp[0], kp[1]); await t.sleep(600); ok(!(await got()) && !(await scr()).held, 'a tap on her puts it down'); await t.shot('tmp-shots/p-5-down.png');
  await t.sleep(1500); await hello(); s = await scr(); await t.click(s.x, s.y); up = false; for (let k = 0; k < 30 && !up; k++) { up = await got(); if (!up) await t.sleep(400); } ok(up, 'and up again'); await t.sleep(900);
  s = await J(`__w.screen(__w.kid.pos.x,1.35,__w.kid.pos.z)`); await t.click(s[0], s[1]); await t.sleep(300); h = await scr(); ok(h.fly && !(await got()), 'a tap on the animal above her head throws it'); await t.shot('tmp-shots/p-6-throw.png');
  // no rain puddles: she jumps into the duck pond and the fountain
  ok(await t.ev('__w.M.puddles.length') === 0, 'no rain puddles lie around');
  const P = await J('__w.MAP.POND'); await t.ev(`__w.placeAt(${P.cx + P.rx + .9}, ${P.cz + .2})`); await t.sleep(1200); await t.ev('__w.jump()');
  ok(await until(`__w.life.dipping()`, 1500), 'a jump next to the duck pond: in she goes, at once'); await t.sleep(1800); await t.shot('tmp-shots/p-7-pond.png');
  await t.sleep(3000); ok(await t.ev(`__w.life.dipping() && !__w.busy() && __w.action().key === 'splash'`), 'and stays in, free to play (the button splashes)');
  const before = await J('__w.info().pos'), wp = await J(`__w.screen(${P.cx - .8},0,${P.cz})`); await t.click(wp[0], wp[1]); await t.sleep(1500);
  const after = await J('__w.info().pos'); ok(after[0] < before[0] - .5 && await t.ev('__w.life.dipping()'), 'a tap in the water: she swims there ' + before + ' -> ' + after); await t.shot('tmp-shots/p-7a-swim.png');
  await t.key('ArrowDown', 1600); ok(await until(`!__w.life.dipping()`, 2000), 'walking against the edge hops her out'); await t.sleep(500); await t.shot('tmp-shots/p-7b-wet.png');
  await t.ev(`__w.placeAt(${P.cx}, ${P.cz + P.rz + .9}); __w.animals.filter(a => a.water).forEach(a => { a.pos.set(${P.cx - 1.2}, 0, ${P.cz - .6}); a.path = []; a.wait = 30; })`); await t.sleep(800); const pp = await J(`__w.screen(${P.cx + .3},0,${P.cz - .2})`); await t.click(pp[0], pp[1]); ok(await until(`__w.life.dipping()`, 2500), 'a tap on the pond: in she hops');
  const land = await J(`__w.screen(${P.cx},0,${P.cz + P.rz + 2.5})`); await t.click(land[0], land[1]); ok(await until(`!__w.life.dipping()`, 2500), 'a tap on land: out she hops'); ok(await until(`Math.abs(__w.info().pos[1] - ${P.cz + P.rz + 2.5}) < .8`, 4000), 'and walks on to where the tap was');
  const F = await J('__w.MAP.FOUNT'); await t.ev(`__w.placeAt(${F.cx + .5}, ${F.cz + 2.3})`); await t.sleep(1000); await t.ev('__w.jump()'); ok(await until(`__w.life.dipping()`, 1500), 'and into the fountain'); await t.sleep(1800); await t.shot('tmp-shots/p-7c-fountain.png');
  await t.key('ArrowDown', 1200); ok(await until(`!__w.life.dipping()`, 2000), 'and out of the fountain');
  // the jump button is the action button: it shows and does what fits right here
  await t.ev(`__w.placeAt(40.5, 47.5)`); await t.sleep(800); ok(await t.ev(`__w.action().key`) === 'jump', 'with nothing around the button jumps: ' + await t.ev(`__w.action().key`));
  await t.ev(`(a=>{a.fly=null;a.swim=null;a.pos.set(41.3,0,47.5);a.path=[];a.wait=30})(__w.animals[${info.i}])`); await t.sleep(300);
  ok((await t.ev(`__w.action().key`)).startsWith('lift'), 'next to an animal it picks it up: ' + await t.ev(`__w.action().key`)); await t.shot('tmp-shots/p-7d-act-lift.png');
  const jb = await J(`(r => [r.x + r.width / 2, r.y + r.height / 2])(document.getElementById('b-jump').getBoundingClientRect())`); await t.click(jb[0], jb[1]); await t.sleep(400);
  ok(await t.ev(`__w.life.carrying()===__w.animals[${info.i}]`), 'pressing it lifts the animal'); ok((await t.ev(`__w.action().key`)).startsWith('throw'), 'and then it throws');
  await t.click(jb[0], jb[1]); await t.sleep(300); ok(!(await t.ev(`__w.life.carrying()`)), 'pressed again: thrown');
  // next to brambles with the sword: the button shows the sword and cuts
  await t.ev(`__w.Q._reset({ stage: 'ei' }); __w.Q.giveTool('zwaard'); 0`); await t.sleep(300);
  const br = await J(`(o => { const i = __w.M.obstacles.findIndex(o => o.type === 'break' && o.tool === 'zwaard'); const b = __w.M.obstacles[i]; for (const [dx, dz] of [[-1,0],[1,0],[0,1],[0,-1]]) if (__w.walkable(b.x + dx, b.z + dz)) return { i, x: b.x + dx + .5, z: b.z + dz + .5 }; })()`);
  await t.ev(`__w.placeAt(${br.x}, ${br.z})`); await t.sleep(500); ok(await t.ev(`__w.action().key`) === 'usezwaard', 'next to brambles with the sword: it cuts ' + await t.ev(`__w.action().key`)); await t.shot('tmp-shots/p-7e-act-sword.png');
  await t.click(jb[0], jb[1]); await t.sleep(1500); ok(await t.ev(`__w.Q.quest.broken.includes(${br.i})`), 'pressed: the brambles are gone');
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.setMount('uni'); 0`); await t.sleep(500); await t.key('ArrowLeft', 900); ok(await t.ev('__w.uni.face') === -1, 'riding left with the keys, the unicorn looks left'); await t.shot('tmp-shots/p-8-ride-left.png');
  // into the water: an animal swims back, a ball is blown back by the wind; behind a tree an animal still shows
  await t.ev(`__w.Q._reset({ stage: 'zoek' }); __w.placeAt(20.5, 45.5); 0`); await t.sleep(1500);
  await t.ev(`(a=>{__w.life.hold(a); a.pos.set(17.5,0,45.5); __w.life.toss(a,-5,0)})(__w.animals[0])`); ok(await until(`!!__w.animals[0].swim`, 20000), 'thrown into the sea it swims'); await t.sleep(700); await t.shot('tmp-shots/p-9-swim.png');
  ok(await until(`!__w.animals[0].swim && __w.walkable(Math.floor(__w.animals[0].pos.x), Math.floor(__w.animals[0].pos.z))`, 60000), 'and climbs out on the beach');
  const bw = `__w.M.ground[__w.M.I(Math.floor(__w.play.info().balls[0][0]), Math.floor(__w.play.info().balls[0][1]))]`;
  await t.ev(`__w.placeAt(19.5, 42.5); Object.assign(__w.play.balls[0], { x: 17.5, z: 42.5, vx: 0, vz: 0, float: 0, gust: null }); (d => { d.pos.set(44.5, 0, 46.5); d.path = []; d.wait = 30; })(__w.animals.find(a => a.name === 'Hondje')); 0`); let wet = false; for (let k = 0; k < 10 && !wet; k++) { await t.ev(`__w.play.kick(0, -1, 0)`); wet = await until(`${bw} === __w.MAP.SE`, 900); } ok(wet, 'the ball rolls into the sea ' + await t.ev(`JSON.stringify(__w.play.info().balls[0])`)); await t.sleep(600); await t.shot('tmp-shots/p-10-ball-floats.png');
  ok(await until(`${bw} !== __w.MAP.SE`, 30000), 'and a gust of wind blows it back'); await t.sleep(1500); await t.shot('tmp-shots/p-11-ball-back.png');
  const R = await J('__w.MAP.RAMPS[0]'); await t.ev(`__w.placeAt(${R[0]} + 1.6, ${R[1]} + 1.2)`); await t.sleep(2000); await t.shot('tmp-shots/p-12-ramp.png');
  const B = await J('__w.MAP.BIKE'); await t.ev(`__w.placeAt(${B[0]} - 1.5, ${B[1]} + 1)`); await t.sleep(2000); await t.shot('tmp-shots/p-13-bike.png');
  // pebbles and the pick-up key
  const st = await J('__w.M.stones[0]'); await t.ev(`__w.placeAt(${st[0]} + 1.4, ${st[1]} + .6)`); await t.sleep(1500); await t.shot('tmp-shots/p-14-stone.png');
  await t.ev(`__w.grabKey()`); await t.sleep(900); ok(await t.ev(`!!__w.life.carrying() && __w.life.carrying().stone === true`), 'the pick-up key lifts the pebble next to her'); await t.shot('tmp-shots/p-15-stone-held.png');
  await t.ev(`__w.grabKey()`); await t.sleep(250); ok(await t.ev(`!__w.life.carrying() && !!__w.life.stones[0].fly`), 'the key again throws it'); ok(await until(`!__w.life.stones[0].fly`, 20000), 'and it lands'); await t.shot('tmp-shots/p-16-stone-thrown.png');
  console.log(fail ? 'PICKUP FAILED ' + fail : 'PICKUP OK');
}
