// node cdp.mjs tests/t-cave.mjs — the cave behind the waterfall and the hookshot: before the unicorn hatched the crystals
// only sing; then all six open the bars to room B, a stone and herself on the two buttons open room C, three switches
// (sword, tap, ✕) raise the bridge, the chest gives the hookshot (she holds it up), the bridge falls into the stream and
// the hookshot pulls her back across. The beach's little islands: post to post to the coins. (tmp-shots/cv-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 6000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  const R = await J('__w.MAP.ROOMS.val'), H = await J('__w.MAP.HOPS');
  const pos = () => J('[__w.kid.pos.x, __w.kid.pos.z]');
  const face = async (x, z) => { await t.ev(`__w.stick(${x}, ${z})`); await t.sleep(60); await t.ev('__w.stick(0, 0)'); };
  const walk = (x, z) => t.ev(`__w.placeAt(${x}, ${z})`);

  // before the unicorn hatched: all six crystals sing, but the bars stay down
  await t.ev(`__w.Q._reset({ stage: 'ei' }); __w.Q.giveTool('zwaard'); 0`); await t.sleep(300);
  ok(await t.ev(`__w.val.spot() === null && !__w.val.cave().shown`), 'no chest and no goal yet');
  await walk(R.in[0] + .5, R.in[1] + .5); await t.sleep(500);
  for (let i = 0; i < 6; i++) { await t.ev(`__w.val.ring(${i})`); await t.sleep(150); }
  ok(await until('__w.val.rainbow()', 2000) && !(await J('__w.val.cave()')).a, 'six crystals: a rainbow, but the bars to the next room stay');
  ok(!(await t.ev(`__w.walkable(${R.walls[0].gate[0][0]}, ${R.walls[0].gate[0][1]})`)), 'the gate is shut');
  // the unicorn has hatched: the hookshot waits; from outside the waterfall is where it is
  await t.ev(`__w.Q._reset({ stage: 'baby' }); __w.Q.giveTool('zwaard'); 0`); await walk(94.5, 43.5); await t.sleep(600);
  ok(JSON.stringify(await J('__w.tools.spot("haak")')) === JSON.stringify(R.door), 'the map points at the waterfall: ' + JSON.stringify(await J('__w.tools.spot("haak")')));
  await t.shot('tmp-shots/cv-0-falls.png');
  await walk(R.in[0] + .5, R.in[1] + .5); await t.sleep(800);
  ok(await t.ev('!__w.val.rainbow() && __w.val.sung().length === 0'), 'a new visit, a new tune');
  for (let i = 0; i < 5; i++) { await t.ev(`__w.val.ring(${i})`); await t.sleep(150); }
  await t.sleep(300); await t.shot('tmp-shots/cv-1-five.png');
  await t.ev('__w.val.ring(5)');
  ok(await until('__w.val.cave().a', 1500), 'all six: the bars to room B open (saved)');
  ok(await until(`__w.walkable(${R.walls[0].gate[0][0]}, ${R.walls[0].gate[0][1]})`, 5000), 'the bars have sunk'); await t.sleep(300); await t.shot('tmp-shots/cv-2-open-a.png');
  // room B: herself on one button does not do it; a stone on the other does
  const [p0, p1] = R.plates;
  await t.ev(`__w.walkTo(${p0[0]}, ${p0[1]})`); ok(await until(`__w.val.cave().plates[0]`, 15000), 'she walks through and onto a button: it goes down');
  await t.sleep(800); ok(!(await J('__w.val.cave()')).b, 'one button is not enough'); await t.shot('tmp-shots/cv-3-one-button.png');
  const st = await J(`(() => { const s = __w.keien.stones().find(s => s.tag === 'val'); return [s.id, s.x, s.z]; })()`);
  ok(st[1] === R.stone[0] && st[2] === R.stone[1], 'the big stone lies in room B');
  await walk(st[1] + .5, st[2] - .5); await t.sleep(300); await t.ev(`__w.keien.lift(__w.keien.stones()[${st[0]}])`); await t.sleep(300);
  await walk(p1[0] + .5, p1[1] + 1.5); await face(0, -1); await t.ev('__w.keien.putDown()'); await t.sleep(400);
  ok(JSON.stringify(await J(`__w.keien.info().stones[${st[0]}]`)) === JSON.stringify(p1), 'the stone is put down on the other button');
  await t.ev(`__w.walkTo(${p0[0]}, ${p0[1]})`);
  ok(await until('__w.val.cave().b', 15000), 'herself on one, the stone on the other: the bars to room C open');
  ok(await until(`__w.walkable(${R.walls[1].gate[0][0]}, ${R.walls[1].gate[0][1]})`, 5000), 'and sink'); await t.shot('tmp-shots/cv-4-open-b.png');
  // room C: three switches, three ways
  const S = R.switches;
  ok(!(await J('__w.val.cave()')).bridge.some(Boolean), 'no bridge over the stream yet');
  await walk(S[0][0] + .5, S[0][1] + 1.5); await face(0, -1); await walk(S[0][0] + .5, S[0][1] + 1.5); await t.sleep(200); await t.ev('__w.slash()');
  ok(await until('__w.val.cave().sw[0]', 2000), 'the sword lights the first switch');
  await walk(S[1][0] + 1.5, S[1][1] + .5); await t.sleep(300);
  const sp = await J(`__w.screen(${S[1][0] + .5}, .6, ${S[1][1] + .5})`); await t.click(sp[0], sp[1]);
  ok(await until('__w.val.cave().sw[1]', 4000), 'a tap lights the second');
  await walk(S[2][0] - .5, S[2][1] + .5); await t.sleep(400);
  ok((await J('__w.action()')).key === 'knop2', 'next to the third the action button shows it'); await t.ev('__w.jump()');
  ok(await until('__w.val.cave().sw[2]', 2000), '✕ lights the third');
  ok(await until('__w.val.cave().bridge.every(Boolean)', 3000), 'the bridge is whole'); await t.sleep(400); await t.shot('tmp-shots/cv-5-bridge.png');
  // over the bridge to the chest
  const [cx, cz] = R.chest;
  ok(await t.ev(`__w.walkTo(${cx}, ${cz + 1})`) && await until(`Math.hypot(__w.kid.pos.x - ${cx + .5}, __w.kid.pos.z - ${cz + 1.5}) < .3`, 15000), 'she walks over the bridge to the chest');
  ok((await J('__w.action()')).key === 'kist', 'the action button shows the chest'); await t.ev('__w.jump()');
  ok(await until(`__w.Q.hasTool('haak')`, 1500), 'the chest opens: the hookshot is hers (saved first)');
  ok(await until(`__w.gift.active() && __w.kid.pose === 'up'`, 2000), 'she holds it up over her head'); await t.sleep(900); await t.shot('tmp-shots/cv-6-hold-up.png');
  ok(await t.ev('__w.busy()'), 'nothing moves her meanwhile');
  ok(await until('!__w.gift.active() && !__w.busy() && !__w.kid.pose', 6000), 'then it is hers and she can move again');
  ok(await until('__w.val.cave().fell', 2000), 'the bridge falls into the stream'); await t.sleep(1800); await t.shot('tmp-shots/cv-7-fallen.png');
  ok(!(await J('__w.val.cave()')).bridge.some(Boolean), 'the stream cannot be walked over any more');
  ok(await t.ev(`!__w.walkTo(${S[0][0] - 1}, ${S[0][1]})`), 'walking back does not work');
  // the hookshot is the way back (and over again)
  await face(-1, 0); await t.ev('__w.hook()');
  ok(await until(`__w.kid.pos.x < ${R.stream.x0} && !__w.busy()`, 5000), 'the hookshot pulls her back over the stream: ' + (await pos()).map(v => v.toFixed(1)));
  await t.shot('tmp-shots/cv-8-back.png');
  await face(1, 0); await t.ev('__w.hook()'); ok(await until(`__w.kid.pos.x > ${R.stream.x1 + 1} && !__w.busy()`, 5000), 'and over again');
  await face(-1, 0); await t.ev('__w.hook()'); ok(await until(`__w.kid.pos.x < ${R.stream.x0} && !__w.busy()`, 5000), 'and back');
  // a fresh page: all of it is still so
  await t.go(URL); await t.sleep(1500);
  const c = await J('__w.val.cave()'); ok(c.a && c.b && c.fell && !c.bridge.some(Boolean) && await t.ev(`__w.Q.hasTool('haak')`), 'after a reload: gates open, bridge gone, hookshot hers');
  ok(await t.ev(`__w.walkable(${R.walls[1].gate[0][0]}, ${R.walls[1].gate[0][1]}) && __w.walkable(${R.walls[0].gate[0][0]}, ${R.walls[0].gate[0][1]})`), 'both gates can be walked through');
  // stranded on the far bank after a reload: the hookshot still pulls her back
  await walk(cx + .5, cz + 1.5); await t.sleep(400); await face(-1, 0); await t.ev('__w.hook()');
  ok(await until(`__w.kid.pos.x < ${R.stream.x0} && !__w.busy()`, 5000), 'from the far bank after a reload the hookshot still brings her back');
  // the beach's little islands
  await walk(H.shore[0] - .5, H.shore[1] + .5); await t.sleep(900); await t.shot('tmp-shots/cv-9-shore.png');
  ok(!(await t.ev(`__w.life.canSwimAt(43, 80)`)), 'the water between the beach and the islands is too deep to swim');
  const isle = i => `(() => { const h = __w.MAP.HOPS.isles[${i}], x = Math.floor(__w.kid.pos.x), z = Math.floor(__w.kid.pos.z); return x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1 && !__w.busy(); })()`;
  await face(-1, 0); await t.ev('__w.hook()'); ok(await until(isle(0), 5000), 'the hookshot pulls her to the first island: ' + (await pos()).map(v => v.toFixed(1)));
  await t.sleep(300); await t.shot('tmp-shots/cv-10-isle1.png');
  await face(-1, 0); await t.ev('__w.hook()'); ok(await until(isle(1), 5000), 'to the second: ' + (await pos()).map(v => v.toFixed(1)));
  const c0 = await t.ev('__w.Q.quest.coins');
  await face(-1, 0); await t.ev('__w.hook()'); ok(await until(isle(2), 5000), 'to the island with the coins: ' + (await pos()).map(v => v.toFixed(1)));
  await t.sleep(600); await t.shot('tmp-shots/cv-11-coins.png');
  const spots = (await J('__w.hops.info()')).spots;
  for (const [x, z] of spots) { await t.ev(`__w.walkTo(${Math.floor(x)}, ${Math.floor(z)})`); await until(`Math.hypot(__w.kid.pos.x - ${Math.floor(x) + .5}, __w.kid.pos.z - ${Math.floor(z) + .5}) < .4`, 4000); }
  ok(await until(`__w.hops.info().coins === 0 && __w.Q.quest.coins === ${c0 + spots.length}`, 3000), 'she picks up the coins: ' + (await t.ev('__w.Q.quest.coins')) + ' (' + c0 + ' before)');
  await walk(H.isles[2].post[0] - .5, H.isles[2].post[1] + .5); await t.sleep(200);
  await face(1, 0); await t.ev('__w.hook()'); ok(await until(isle(1), 5000), 'and back, island by island');
  await face(1, 0); await t.ev('__w.hook()'); ok(await until(isle(0), 5000), '...');
  await face(1, 0); await t.ev('__w.hook()'); ok(await until(`__w.kid.pos.x > 45 && !__w.busy()`, 5000), 'to the beach');
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l) && !/favicon/.test(l)).slice(0, 8)) console.log('  log', l);
}
