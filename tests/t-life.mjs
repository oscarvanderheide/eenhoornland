// node cdp.mjs tests/t-life.mjs — feeding animals so they follow her, naps, nuts on her head, a frog, twirling, a burp (tmp-shots/l-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  const idx = async name => t.ev(`__w.animals.findIndex(a => a.name === '${name}')`);
  const A = i => `__w.animals[${i}]`;

  // (feeding animals from a bag is gone: nothing is collected besides coins)

  // thrown three times: a nap
  const d = await idx('Hondje'); await t.ev(`(a => { __w.placeAt(31.5, 46.5); a.pos.set(32.5, 0, 46.5); a.path = []; })(${A(d)}); 0`); await t.sleep(800);
  for (let k = 0; k < 3; k++) { await t.ev(`(a => { __w.life.hold(a); a.pos.set(__w.kid.pos.x, 0, __w.kid.pos.z); __w.life.toss(a, 1.2, 0); })(${A(d)})`); await until(`!${A(d)}.fly`, 8000); await t.sleep(300); }
  ok(await t.ev(`${A(d)}.nap > 0`), 'thrown three times, the puppy has a nap'); await t.sleep(1200); await t.shot('tmp-shots/l-5-nap.png');
  ok(await until(`!(${A(d)}.nap > 0)`, 60000), 'and wakes up again');

  // a loose nut lands on her head when she gets to the tree
  const tr = await J(`(() => { const k = __w.kid.pos; let b = -1, bd = 1e9; __w.M.trees.forEach((t, i) => { if (!['tree', 'oak', 'pine'].includes(t.kind)) return; const e = Math.hypot(t.x - k.x, t.z - k.z); if (e < bd) { bd = e; b = i; } }); return b; })()`);
  await t.ev(`(t => { __w.placeAt(t.x + 4.5, t.z + 1.5); })(__w.M.trees[${tr}]); 0`); await t.sleep(800);
  await t.ev(`(() => { const R = Math.random; Math.random = () => .05; try { __w.life.tapProp(__w.M.trees[${tr}]); } finally { Math.random = R; } })()`);
  ok(await t.ev('__w.life.info().pending') === 1, 'a tapped tree can have a loose nut');
  const tt = await J(`(t => [t.x, t.z])(__w.M.trees[${tr}])`); const spot = await J(`(() => { for (const [dx, dz] of [[0,1],[1,0],[-1,0],[1,1],[-1,1],[0,2]]) if (__w.walkable(${tt[0]} + dx, ${tt[1]} + dz)) return [${tt[0]} + dx, ${tt[1]} + dz]; return null; })()`);
  await t.ev(`__w.placeAt(${spot[0]} + .5, ${spot[1]} + .5)`); await t.sleep(500); await t.shot('tmp-shots/l-6-bonk.png');
  ok(await t.ev('__w.life.info().pending') === 0, 'it falls on her head when she gets there');

  // a frog in a bush, a twirl, a burp
  const bu = await t.ev(`__w.M.trees.findIndex(t => ['bush', 'hedge', 'rose', 'fern'].includes(t.kind))`);
  await t.ev(`(t => __w.placeAt(t.x + 2.5, t.z + 1.5))(__w.M.trees[${bu}])`); await t.sleep(800);
  await until('__w.life.info().bits === 0', 6000); const b0 = await t.ev('__w.life.info().bits'); await t.ev(`(() => { const R = Math.random; Math.random = () => .05; try { __w.life.tapProp(__w.M.trees[${bu}]); } finally { Math.random = R; } })()`);
  ok(await until(`__w.life.info().bits > ${b0}`, 3000), 'a frog jumps out of the bush'); await t.shot('tmp-shots/l-7-frog.png');
  ok(!(await t.ev('__w.life.tapKid()')) && !(await t.ev('__w.life.tapKid()')) && await t.ev('__w.life.tapKid()'), 'three quick taps on her: she twirls'); await t.sleep(300); await t.shot('tmp-shots/l-8-twirl.png');
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); await t.sleep(800); await t.ev('__w.life.burp(__w.uni)'); await t.sleep(700); await t.shot('tmp-shots/l-9-burp.png');
  ok(await t.ev('__w.life.friends().length') === 0, 'after a new day (reset) the friends have gone home');

  // things that do something to other things
  await t.ev(`__w.Q._reset({ stage: 'zoek' }); 0`); await t.sleep(600);
  const dg = await idx('Hondje');
  // the dog chases a kicked ball and kicks it back to her
  await t.ev(`(() => { const b = __w.play.balls[0], d = ${A(dg)}; __w.placeAt(b.x - 1.2, b.z); d.pos.set(b.x + 2, 0, b.z + 1); d.path = []; d.nap = 0; })(); 0`); await t.sleep(1500);
  await t.ev('__w.play.kick(0, 1, 0)'); ok(await until(`__w.life.fetching() === 'ball'`, 8000), 'the dog runs after the kicked ball');
  await t.sleep(800); await t.shot('tmp-shots/l-10-dog-ball.png');
  ok(await until(`!__w.life.fetching()`, 60000), 'and kicks it back');
  // the dog brings back a pebble she throws
  const st = [32, 46]; await t.ev(`__w.life.stones[0].pos.set(32.5, 0, 46.5); 0`); await t.ev(`(() => { const d = ${A(dg)}; __w.placeAt(${st[0]} + 1.4, ${st[1]} + .6); d.pos.set(${st[0]} + 2.5, 0, ${st[1]} + 1.5); d.path = []; d.wait = 12; })(); 0`); await t.sleep(1500);
  await t.ev('__w.grabKey()'); await t.sleep(600); await t.ev('__w.grabKey()');
  ok(await until(`__w.life.fetching() === 'stone'`, 15000), 'the dog runs to the pebble she threw');
  ok(await until(`__w.life.stones[0].dog === true`, 60000), 'and picks it up'); await t.sleep(400); await t.shot('tmp-shots/l-11-dog-stone.png');
  ok(await until(`!__w.life.fetching() && Math.hypot(__w.life.stones[0].pos.x - __w.kid.pos.x, __w.life.stones[0].pos.z - __w.kid.pos.z) < 2`, 60000), 'and brings it back to her');
  // a pebble into the fountain: a coin, once a day
  const F = await J('__w.MAP.FOUNT'); const c0 = await t.ev('__w.Q.quest.coins');
  await t.ev(`(c => { __w.placeAt(${F.cx} - 3.5, ${F.cz} + 2.5); __w.life.hold(c); c.pos.set(${F.cx} - 2.5, 0, ${F.cz} + 1); __w.life.toss(c, 3, -1); })(__w.life.stones[0])`);
  ok(await until(`__w.Q.quest.coins > ${c0}`, 20000), 'a pebble in the fountain brings up a coin'); await t.shot('tmp-shots/l-12-wish.png');
  // an animal thrown into the paint is painted
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.Q.giveTool('zwaard'); __w.Q.giveTool('haak'); 0`); await t.sleep(500);
  const pd = await J('__w.toys.info().puddles[0]'); const rb = await idx('Konijn');
  await t.ev(`(a => { __w.placeAt(${pd[0]} - 2, ${pd[1]} + .5); __w.life.hold(a); a.pos.set(${pd[0]} - 1.2, 0, ${pd[1]}); __w.life.toss(a, 1.1, 0); })(${A(rb)})`);
  ok(await until(`!!${A(rb)}.painted`, 20000), 'a rabbit thrown into the paint is painted'); await t.sleep(600); await t.shot('tmp-shots/l-13-painted.png');
  // a ball kicked into a tree shakes it
  ok(await t.ev(`(() => { const t = __w.M.trees.find(t => t.kind === 'apple'); const c0 = t.cool || 0; __w.life.hitAt(t.x + .5, t.z + .5); return (t.cool || 0) > c0; })()`), 'something hitting an apple tree shakes it');
  console.log(fail ? 'LIFE FAILED ' + fail : 'LIFE OK');
}
