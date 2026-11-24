// node cdp.mjs tests/t-toys.mjs — every island's own toy, in a real browser (screenshots in tmp-shots/y-*.png: look at them)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const toys = () => J('__w.toys.info()'), play = () => J('__w.play.info()');
  const shot = n => t.shot(`tmp-shots/y-${n}.png`), place = (x, z) => t.ev(`__w.placeAt(${x},${z})`);
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null, run = n => !only || only.includes(n);
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL);
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.Q.giveTool('zwaard'); __w.Q.giveTool('hamer'); 0`); await t.sleep(800);
  const M = await J('({POTS:__w.MAP.POTS,CAN:__w.MAP.CAN,STALL:__w.MAP.STALL,BUCKET:__w.MAP.BUCKET,KITE:__w.MAP.KITE,RAMPS:__w.MAP.RAMPS,WHALE:__w.MAP.WHALE,POND:__w.MAP.POND,C:__w.MAP.CASTLE})');

  if (run('dorp')) {   // the watering can and the flower pots
    await place(31.5, 37.2); await t.sleep(2500); await shot('01-pots');
    await t.ev(`__w.toys.usePot(0)`); await t.sleep(600); let s = await toys(); ok(s.pots[0] === 0, 'without the can a pot does not grow');
    await t.ev(`__w.toys.take('gieter')`); await t.sleep(400); s = await toys(); ok(s.carry === 'gieter' && s.water === 0, 'she carries the can, it is empty');
    await t.sleep(1200); await shot('01b-fountain-glows');
    await t.ev(`__w.toys.usePot(0)`); ok(await until(`__w.toys.info().pots[0] === 1`, 40000), 'an empty can: she fetches water at the fountain, comes back and waters');
    await place(M.POND.cx + 2.6, M.POND.cz); await t.sleep(1500); s = await toys(); ok(s.water === 3, 'at the pond the can fills up by itself'); await shot('02-can-full');
    await place(31.5, 36.6); await t.sleep(500);
    await t.sleep(800); await shot('02b-thirsty-pot-glows');
    for (let k = 0; k < 3; k++) { await t.ev(`__w.toys.usePot(1)`); await t.sleep(1100); if (k === 0) await shot('03-watering'); }
    s = await toys(); ok(s.pots[1] === 3 && s.water === 0, 'three pours and the flower is in bloom (' + s.pots + ')'); await t.sleep(600); await shot('04-bloom');
    ok(await t.ev(`__w.Q.quest.garden[1]`) === 3, 'and that is saved');
    // walking up to a thirsty pot with water in the can waters it; the pick-up key there waters too and never drops the can
    await place(M.POND.cx + 2.6, M.POND.cz); await t.sleep(1200); ok((await toys()).water === 3, 'the can is full again');
    await place(33.5, 37.4); await t.sleep(300); await t.key('ArrowUp', 900); ok(await until(`__w.toys.info().pots[3] >= 1`, 3000), 'walking up to a thirsty pot waters it');
    await t.sleep(1500); const w0 = (await toys()).water; await t.ev('__w.grabKey()'); await t.sleep(700); s = await toys(); ok(s.carry === 'gieter' && s.water < w0, 'the pick-up key next to a pot pours, it does not drop the can');
    ok(await t.ev(`!__w.walkable(Math.floor(__w.MAP.POTS[0][0]), Math.floor(__w.MAP.POTS[0][1])) && !__w.walkable(...__w.M.toolSpots.zwaard)`), 'pots and the sword stone are solid');
    ok(await t.ev(`(() => { const B = id => __w.BUILDINGS.find(b => b.id === id); const a = B('atelier'), st = B('stal'); return (!a || !__w.walkable(a.x - 1, a.z + a.d)) && (!st || !__w.walkable(st.x + st.w, st.z + st.d - 1)) && __w.toys.info().hides.every(([x, z]) => !__w.walkable(Math.floor(x), Math.floor(z))); })()`), 'the easel, the hay bales and the hiding bushes are solid');
    await t.ev(`__w.toys.take('gieter')`); await place(31.5, 36.6); await t.sleep(300);
    await t.ev(`__w.toys.putDown()`); await t.sleep(300);
    await t.ev(`__w.toys.usePot(1)`); await t.sleep(1000); await shot('04b-sneeze'); s = await toys(); ok(s.pots[1] === 0, 'picking the flower: a sneeze, and the pot starts again');
    // watering an animal
    await t.ev(`__w.toys.take('gieter')`); await place(M.POND.cx + 2.6, M.POND.cz); await t.sleep(1200);
    ok(await t.ev(`(()=>{const d=__w.animals.find(a=>a.water); return __w.toys.tapAnimal(d)})()`) === true, 'with the can a tap on a duck waters it'); await t.sleep(900); await shot('05-duck');
    await t.ev(`__w.toys.putDown()`);
    // the stall
    await place(M.STALL.x + .5, M.STALL.z + 3.5); await t.sleep(2500); await shot('06-stall');
    await t.ev(`__w.Q.quest.coins = 0; for (let k = 0; k < 3; k++) __w.Q.collect('munt', 900 + k); 0`);
    await t.ev(`__w.toys.openStall()`); await t.sleep(700); ok(await t.ev(`document.querySelectorAll('.winkel .wk').length`) === await t.ev(`__w.Q.SHOP.length`), 'the stall shows every thing'); await shot('07-shop');
    ok(await t.ev(`document.querySelector('.wk[data-id="krans"]').classList.contains('kan') && !document.querySelector('.wk[data-id="kroon"]').classList.contains('kan')`), 'what she has the coins for is lit');
    await t.ev(`for (let k = 3; k < 12; k++) __w.Q.collect('munt', 900 + k); 0`);
    for (const id of ['krans', 'ketting', 'jurkgeel', 'ballon']) { await t.ev(`document.querySelector('.wk[data-id="${id}"]').click()`); await t.sleep(400); }
    ok(await t.ev(`['krans','ketting','jurkgeel','ballon'].every(__w.Q.owns)`), 'four things bought'); ok(await t.ev(`__w.Q.quest.coins`) === 0, 'paid with coins'); await shot('08-shop-bought');
    await t.ev(`document.querySelector('.wk[data-id="kroon"]').click()`); await t.sleep(300); ok(!(await t.ev(`__w.Q.owns('kroon')`)), 'no coins left, no crown');
    await t.ev(`document.querySelector('#modal [data-close]').click()`); await t.sleep(900); await place(M.STALL.x + .5, M.STALL.z + 2.5); await t.sleep(1500); await shot('09-dressed');
    const w = await J(`__w.Q.wearing(__w.who())`); ok(w.head === 'krans' && w.neck === 'ketting' && w.dress === 'jurkgeel' && w.hand === 'ballon', 'she has it all on');
    const other = await t.ev(`__w.who() === 'anna' ? 'fenna' : 'anna'`); await t.ev(`__w.setWho('${other}')`); await t.sleep(700); ok(!(await J(`__w.Q.wearing('${other}')`)).head, 'her sister dresses herself'); await shot('10-sister');
  }
  if (run('fiets')) {   // bell, trailer, ramp
    const b = (await play()).bike; await place(b[0] - 1, b[1] + 1); await t.sleep(1200); await t.ev(`__w.play.tapBike()`); await t.sleep(1200); ok(await t.ev(`__w.mount()`) === 'fiets', 'on the bike');
    ok(await t.ev(`__w.play.tapAnimal(__w.animals[0]) && __w.play.tapAnimal(__w.animals[2])`) === true, 'on the bike a tap on an animal puts it in the trailer'); await t.sleep(1500); ok((await play()).riders === 2, 'two ride along'); await shot('11-trailer');
    const r = M.RAMPS[1]; await place(r[0] - 4, r[1]); await t.sleep(600); await t.ev(`__w.walkTo(${Math.floor(r[0]) + 4},${Math.floor(r[1])})`); ok(await until(`__w.play.info().flip`, 15000), 'the hump bridge gives the bike a happy hop'); await shot('12-ramp');
    await t.sleep(2500); const a0 = await J(`[__w.animals[0].pos.x, __w.kid.pos.x]`); ok(Math.abs(a0[0] - a0[1]) < 2.5, 'the animals came along'); await t.ev(`__w.jump()`); await t.sleep(300);
    await t.ev(`__w.play.tapBike()`); await t.sleep(900); ok((await play()).riders === 0 && await t.ev(`__w.animals[0].lift`) === 0, 'off the bike: everybody out'); await shot('13-out');
    await place(r[0] - 3, r[1]); await t.sleep(400); await t.ev(`__w.walkTo(${Math.floor(r[0]) + 3},${Math.floor(r[1])})`); await until(`__w.info().pos[0] > ${r[0] + 1}`, 15000); ok(!(await play()).flip && await t.ev(`__w.info().pos[0]`) > r[0] + 1, 'on foot the hump is just a bump in the road');
  }
  if (run('bos')) {   // hide and seek
    let s = await toys(); ok(s.hides.length >= 5 && s.hiders.length === 3 && s.hides.filter(h => h[2]).length === 3, 'three are hiding in ' + s.hides.length + ' bushes');
    const i = s.hides.findIndex(h => h[2]); await place(s.hides[i][0] + 1.6, s.hides[i][1] + 1.4); await t.sleep(2500); await shot('14-hiding');
    await t.ev(`__w.toys.rustle(${i})`); await t.sleep(350); await shot('15-found'); s = await toys(); ok(s.hiders.some(h => h !== 'hid') && !s.hides[i][2], 'tapped: out she jumps');
    ok(await until(`__w.toys.info().hiders.every(h => h === 'hid')`, 30000), 'and hides again'); s = await toys(); ok(s.hides.filter(h => h[2]).length === 3 && !s.hides[i][2], 'in another bush');
    const tr = await J(`(t=>({x:t.x,z:t.z,i:__w.M.trees.indexOf(t)}))(__w.M.trees.find(t=>t.kind==='apple'))`); await place(tr.x + .5, tr.z + 2.6); await t.sleep(800); const n0 = await t.ev(`__w.extras.info().items`);
    await t.ev(`__w.life.tapProp(__w.M.trees[${tr.i}])`); await t.sleep(1600); ok(await t.ev(`__w.extras.info().items`) === n0 + 1, 'a shaken apple tree drops an apple to keep'); await shot('16-apple');
    await t.ev(`__w.M.trees[${tr.i}].cool = 0; __w.life.tapProp(__w.M.trees[${tr.i}])`); await t.sleep(1400); ok(await t.ev(`__w.extras.info().items`) === n0 + 1, 'one a day');
  }
  if (run('wei')) {   // kite and dandelions
    await place(M.KITE[0] - 1.5, M.KITE[1] + 1.5); await t.sleep(2500); await shot('17-kite');
    await t.ev(`__w.toys.take('vlieger')`); await t.ev(`__w.walkTo(72,46)`); await t.sleep(3500); let s = await toys(); ok(s.carry === 'vlieger' && s.kite[1] > 1.6, 'running, the kite climbs (' + s.kite[1].toFixed(2) + ')'); await shot('18-kite-up');
    await t.ev(`__w.toys.putDown()`); await t.sleep(300); s = await toys(); ok(s.carry === null, 'put down');
    const d = s.puffs[0]; await place(d[0] - 1.2, d[1] + .4); await t.sleep(1500); await shot('19-dandelion'); await t.ev(`__w.toys.blow(0)`); await t.sleep(500); await shot('20-blown'); ok(!(await toys()).puffs[0][2], 'the dandelion is blown');
  }
  if (run('strand')) {   // sand towers
    await place(M.BUCKET[0] + 1.5, M.BUCKET[1] + 1.5); await t.sleep(2500); await shot('21-bucket');
    ok(await t.ev(`__w.toys.tapGround(60, 72)`) === false, 'without the bucket a tap on the sand just walks');
    await t.ev(`__w.toys.take('emmer')`); await t.sleep(1200); await shot('21b-ghost'); ok(await t.ev(`__w.toys.info().ahead !== null`), 'with the bucket a see-through tower shows where it goes');
    await t.ev(`__w.toys.putDown()`); await t.sleep(400); ok(await t.ev(`__w.toys.info().towers.length === 1 && __w.toys.carrying() === 'emmer'`), 'putting it down on the sand flips it into a tower'); await t.ev(`(([x, z]) => __w.Q.stompSand(x, z))(__w.toys.info().towers[0]); 0`); await t.sleep(300);
    ok(await t.ev(`__w.toys.tapGround(59, 72)`) === true, 'with the bucket a tap on the sand builds'); ok(await until(`__w.toys.info().towers.length === 1`, 20000), 'a sand tower stands');
    await t.ev(`__w.toys.build(59,72); __w.toys.build(59,72); __w.toys.build(61,72); __w.toys.build(56,72)`); await t.sleep(900); let s = await toys(); ok(s.towers.length === 3 && s.towers.some(x => x[2] === 3), 'towers grow three high'); await place(58.5, 73.6); await t.sleep(1500); await shot('22-towers');
    ok(await t.ev(`__w.Q.quest.sand.length`) === 3, 'saved'); await place(59.9, 72.6); await t.sleep(300); await t.ev(`__w.toys.putDown(true); __w.jump()`); await t.sleep(1200); s = await toys(); ok(s.towers.length === 2, 'jumping on a tower flattens it'); await shot('23-stomped');
  }
  if (run('boot')) {   // sailing
    await place(91.5, 70.5); await t.sleep(600); await place(95.5, 70.5); ok(await until(`__w.play.info().sailing`, 10000), 'stepping on the pier: into the boat'); ok(await until(`!__w.play.info().moving`, 30000), 'it pushes off and waits'); let s = await play(); ok(Math.hypot(s.boat[0] - 96.6, s.boat[1] - 71) > 2, 'a little way out (' + s.boat + ')'); await t.sleep(800); await shot('24-pushed-off');
    await t.ev(`__w.play.steer(103.5, 74.5)`); ok(await until(`!__w.play.info().moving`, 40000), 'a tap on the water sails there'); s = await play(); ok(Math.hypot(s.boat[0] - 103.5, s.boat[1] - 74.5) < 1, 'arrived at ' + s.boat); await t.sleep(800); await shot('25-sailing');
    await t.ev(`__w.play.steer(-40, 30)`); ok(await until(`!__w.play.info().moving`, 60000), 'a tap far outside'); s = await play(); ok(s.boat[0] >= 92 && s.boat[1] >= 27 && s.sailing, 'stays inside the buoys (' + s.boat + ')'); await shot('26-buoys');
    await t.ev(`__w.play.steer(${M.WHALE[0] + 1}, ${M.WHALE[1] - 3})`); ok(await until(`!__w.play.info().moving`, 60000) && !(await play()).whale, 'the whale sleeps under its shadow'); await t.sleep(600); await shot('27a-shadow'); await t.ev(`__w.play.steer(${M.WHALE[0]}, ${M.WHALE[1]})`); ok(await until(`__w.play.info().whale`, 20000), 'a tap on the shadow and up it comes'); await t.sleep(1500); await shot('27-whale');
    const c = (await play()).chests; ok(c.length >= 1, 'chests float in the lagoon (' + c.length + ' left)'); const coins = await t.ev(`__w.Q.quest.coins`); await t.ev(`__w.play.steer(${c[0][0]}, ${c[0][1]})`); ok(await until(`__w.Q.quest.coins === ${coins + 1}`, 60000), 'sailing into one gives a coin');
    await t.ev(`__w.play.steer(130.5, 67.5)`); ok(await until(`!__w.play.info().sailing`, 150000), 'a tap on the island: ashore there'); await t.sleep(600); s = await play(); ok(s.side === 'eiland' && !(await t.ev(`__w.busy()`)), 'on the rainbow island'); ok(await until(`__w.info().pos[0] > 125`, 40000), 'and she walks on to where the tap was');
  }
  if (run('vissen')) {   // fishing at the end of the old pier
    const F = await J('__w.MAP.FISH'); await place(F.pier[0] + 3.5, F.pier[1] + .5); await t.sleep(1200); await t.ev(`__w.walkTo(${F.pier[0]}, ${F.pier[1]})`);
    ok(await until(`__w.fishing.info().st === 'wait'`, 20000), 'at the end of the pier she casts'); await t.sleep(600); await shot('30-fishing');
    ok(await until(`__w.fishing.info().st === 'bite'`, 20000), 'the float bobs'); await shot('31-bite'); const n0 = await t.ev('__w.fishing.info().n');
    await t.ev('__w.jump()'); ok(await until(`__w.fishing.info().n === ${n0 + 1}`, 5000), 'the jump key reels in'); await t.sleep(700); await shot('32-catch');
    ok(await until(`__w.fishing.info().st === 'wait'`, 20000), 'and she casts again'); await place(F.pier[0] + 5.5, F.pier[1] + .5); await t.sleep(800); ok(await t.ev(`__w.fishing.info().st`) === 'off', 'walking off the pier puts the rod back');
  }
  if (run('eiland')) {   // paint
    let s = await toys(); ok(s.puddles.length === 3, 'three puddles of paint'); const [a, b] = s.puddles; await place(a[0] + 1.5, a[1] + 1.2); await t.sleep(2500); await shot('28-paint');
    await place(a[0], a[1]); await t.sleep(700); s = await toys(); ok(s.paint && s.paint.base.length === 1, 'stepped in the paint'); await t.ev(`__w.walkTo(${Math.floor(a[0]) + 3},${Math.floor(a[1]) + 1})`); await t.sleep(3500); s = await toys(); ok(s.prints >= 4, 'she leaves footprints (' + s.prints + ')'); await shot('29-prints');
    await place(b[0], b[1]); await t.sleep(700); s = await toys(); ok(s.paint.base.length === 2, 'a second colour mixes'); await t.ev(`__w.walkTo(${Math.floor(b[0]) + 3},${Math.floor(b[1])})`); await t.sleep(3000); await shot('30-mixed');
  }
  if (run('kasteel')) {
    await place(M.C.x + M.C.w / 2, M.C.z + M.C.d + 4.5); await t.sleep(2500); await t.ev(`for (let k = 0; k < 5; k++) __w.toys.peek({ point: { x: ${M.C.x} + k * 2 } })`); await t.sleep(700); ok((await toys()).peekers === 5, 'somebody looks out of the castle windows'); await shot('31-castle');
    ok(await until(`__w.toys.info().peekers === 0`, 10000), 'and goes back in');
  }
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors ' + t.logs.filter(l => /EXC|Error/.test(l)).join('|'));
  console.log(fail ? 'FAILED ' + fail : 'TOYS OK');
}
