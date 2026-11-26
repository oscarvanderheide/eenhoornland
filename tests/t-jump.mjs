// node cdp.mjs tests/t-jump.mjs — the joystick, jumping (forwards, onto a stump, off an animal) and the cave's crate puzzle (tmp-shots/j-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  const pos = () => J('__w.info().pos');

  // the joystick: drag the knob up-right and she walks that way
  await t.ev(`__w.placeAt(40.5, 44.5)`); await t.sleep(600);
  const st = await J(`(r => [r.x + r.width / 2, r.y + r.height / 2, r.width])(document.getElementById('stick').getBoundingClientRect())`);
  let a = await pos();
  await t.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: st[0], y: st[1], button: 'left', buttons: 1, clickCount: 1 });
  await t.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: st[0] + st[2] * .4, y: st[1], button: 'left', buttons: 1 }); await t.sleep(900); await t.shot('tmp-shots/j-1-stick.png');
  await t.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: st[0] + st[2] * .4, y: st[1], button: 'left', clickCount: 1 });
  let b = await pos(); ok(b[0] > a[0] + 1.2 && Math.abs(b[1] - a[1]) < .4, 'the joystick walks her east ' + a + ' -> ' + b);
  await t.sleep(400); const c = await pos(); ok(Math.abs(c[0] - b[0]) < .3, 'let go: she stops');

  // a leap forward while walking
  await t.ev(`__w.placeAt(40.5, 44.5); __w.stick(1, 0)`); await t.sleep(300); a = await pos(); await t.ev(`__w.leapNow()`); await t.ev(`__w.stick(0, 0)`); await t.sleep(700); b = await pos();
  ok(b[0] - a[0] > 1.2, '○ while she walks leaps forwards ' + a + ' -> ' + b);

  // up onto the stump in the forest, and down again
  await t.ev(`__w.Q._reset({ stage: 'zoek' }); __w.placeAt(24.5, 10.5); 0`); await t.sleep(800);
  ok(await t.ev(`__w.tops.has(__w.M.I(26, 10))`), 'the stump is something to stand on');
  await t.ev(`__w.kid.face = 1; __w.leapNow()`); ok(await until(`!!__w.perch()`, 2000), 'a jump next to the stump: she stands on top of it'); await t.sleep(500); await t.shot('tmp-shots/j-2-stump.png');
  ok(await t.ev(`__w.kid.lift > .2`), 'up high');
  await t.key('ArrowRight', 500); ok(await until(`!__w.perch() && __w.kid.lift === 0`, 2000), 'walking off jumps her down'); await t.sleep(300);
  // tapping the stump from nearby jumps her onto it
  await t.ev(`__w.placeAt(27.5, 10.5)`); await t.sleep(500); const sp = await J(`__w.screen(26.5, .3, 10.6)`); await t.click(sp[0], sp[1]); ok(await until(`!!__w.perch()`, 2500), 'a tap on the stump close by: up she jumps');

  // off an animal's back
  await t.ev(`__w.placeAt(38.5, 45.5)`); await t.sleep(400);
  const dog = await t.ev(`__w.animals.findIndex(a => a.name === 'Hondje')`);
  await t.ev(`(a => { a.pos.set(40.3, 0, 45.5); a.path = []; a.wait = 30; a.way = null; })(__w.animals[${dog}]); __w.stick(1, 0)`); await t.sleep(150); await t.ev(`__w.leapNow(); __w.stick(0, 0)`);
  ok(await until(`__w.animals[${dog}].squash > 0`, 1500), 'jumping at the dog: she bounces off its back'); await t.sleep(150); await t.shot('tmp-shots/j-3-bounce.png');
  ok(await until(`__w.info().pos[0] > 40.6 && !__w.kid.path.length`, 3000), 'and lands on the other side ' + await pos());

  // the cave: two rooms, the crate goes on the button, the gate sinks
  await t.ev(`__w.placeAt(27.5, 117.5)`); await t.sleep(1500); await t.shot('tmp-shots/j-4-cave.png');
  let pz = await J('__w.rooms.puzzle()'); ok(!pz.open && !await t.ev(`__w.walkable(35, 113)`), 'the crystal gate to the back room is closed');
  ok(await t.ev(`__w.walkTo(42, 112)`) && await until(`__w.rooms.puzzle().box.join() !== '${pz.box.join()}'`, 6000) && await t.ev(`__w.info().pos[0] < 35`), 'walking to the egg room goes to the crate and pushes it instead');
  await t.ev(`__w.rooms.reset()`); pz = await J('__w.rooms.puzzle()');
  { const [px, pzz] = pz.plate; await t.ev(`__w.placeAt(${px + .5}, ${pzz + .5})`); await until(`__w.rooms.puzzle().hold >= 1`, 3000); await t.shot('tmp-shots/j-4b-onbutton.png');
    const h = await J('__w.rooms.puzzle()'); ok(h.on && h.hold >= 1 && !h.open && !await t.ev(`__w.walkable(35, 113)`), 'standing on the button herself sinks the bars (a hint), the gate stays shut');
    await t.ev(`__w.placeAt(${px + 2.5}, ${pzz + .5})`); ok(await until(`__w.rooms.puzzle().hold === 0`, 3000) && !(await J('__w.rooms.puzzle()')).open, 'stepping off: the bars come back up'); }
  // walking into the crate pushes it; pushing it into a corner puffs it back
  const bx = pz.box; await t.ev(`__w.placeAt(${bx[0] + .5}, ${bx[1] - .5 + 2})`); await t.sleep(300); await t.key('ArrowUp', 350);
  pz = await J('__w.rooms.puzzle()'); ok(pz.box[1] === bx[1] - 1, 'walking into the crate pushes it ' + JSON.stringify(pz.box));
  // taps push it the right way until it is on the button
  { await t.ev(`__w.placeAt(${bx[0] + 3.5}, ${bx[1] + .5})`); await t.sleep(300); const p = await J('__w.rooms.puzzle().box'); const sc = await J(`__w.screen(${p[0] + .5}, .3, ${p[1] + .6})`); await t.click(sc[0], sc[1]); ok(await until(`__w.rooms.puzzle().box.join() !== '${pz.box.join()}'`, 5000), 'a tap on the crate: she walks round and pushes it the right way'); }
  for (let k = 0; k < 14 && !(await J('__w.rooms.puzzle()')).open; k++) { await t.ev(`__w.rooms.tapBox()`); await until(`!__w.kid.path.length`, 5000); await t.sleep(450); }
  pz = await J('__w.rooms.puzzle()'); ok(pz.open && pz.box.join() === pz.plate.join(), 'tapping the crate pushes it onto the button'); await t.sleep(400); await t.shot('tmp-shots/j-5-button.png');
  ok(await until(`__w.walkable(35, 113) && __w.walkable(35, 114)`, 4000), 'and the gate sinks'); await t.sleep(300); await t.shot('tmp-shots/j-6-open.png');
  ok(await t.ev(`__w.walkTo(41, 113)`) && await until(`__w.info().pos[0] > 40`, 8000), 'into the back room with the egg'); await t.sleep(800); await t.shot('tmp-shots/j-7-eggroom.png');
  // the crate can be jumped on
  await t.ev(`__w.placeAt(${pz.box[0] - .5}, ${pz.box[1] + .5}); __w.kid.face = 1; __w.leapNow()`); ok(await until(`!!__w.perch()`, 2000), 'she can jump on top of the crate'); await t.sleep(400); await t.shot('tmp-shots/j-8-on-crate.png');
  // a fresh start: the gate stays open
  await t.go(URL); await t.sleep(2000); ok(await t.ev(`__w.rooms.puzzle().open && __w.walkable(35, 113)`), 'after a reload the gate is still open');
  console.log(fail ? 'JUMP FAILED ' + fail : 'JUMP OK');
}
