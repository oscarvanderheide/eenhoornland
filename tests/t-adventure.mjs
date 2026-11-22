// node cdp.mjs tests/t-adventure.mjs — plays the whole adventure in a real browser, from the start screen and the dream
// to the party and the next morning (teleporting instead of walking, because headless WebGL is slow), and checks the
// game reacts at every step. Screenshots go to tmp-shots/a-*.png: look at them.
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const q = async () => JSON.parse(await t.ev('JSON.stringify({stage:__w.Q.quest.stage,w:__w.Q.wishes().map(w=>w.t+":"+w.id),bed:__w.Q.bedtime(),herd:__w.Q.quest.herd.length,uni:__w.uni.g.visible,pos:__w.info().pos,mount:__w.mount(),busy:__w.busy(),info:__w.extras.info(),play:__w.play.info(),chips:[...document.querySelectorAll("#quest .qchip")].length,cycle:__w.Q.quest.cycle,seed:__w.seed})'));
  const settle = (ms = 1500) => t.sleep(ms);
  const shot = n => t.shot(`tmp-shots/a-${n}.png`);
  const place = (x, z) => t.ev(`__w.placeAt(${x},${z})`);
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 500; i++) { if (await t.ev(expr)) return true; await t.sleep(500); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL);

  // start screen → dream → outside
  ok(await t.ev(`!document.querySelector('#start').hidden && document.querySelectorAll('#start .pick').length === 2`), 'start screen asks who plays'); await shot('01-start');
  await t.ev(`document.querySelector('#start .pick[data-who="fenna"]').click()`); await settle(1800);
  ok(await t.ev(`!!document.querySelector('#dream')`), 'the dream starts'); await shot('02-dream-asleep');
  for (const n of ['03-dream-egg', '04-dream-egg2', '05-dream-unicorn', '06-dream-unicorn2', '07-dream-awake']) { await t.sleep(3300); await shot(n); }
  ok(await until(`!document.querySelector('#dream') && document.querySelector('#start').hidden`), 'the dream ends and the game begins');
  let s = await q(); const door = JSON.parse(await t.ev(`JSON.stringify(__w.BUILDINGS.find(b=>b.id==='huisje').door)`));
  ok(await t.ev('__w.who()') === 'fenna', 'the girl who was picked plays'); ok(Math.hypot(s.pos[0] - door[0] - .5, s.pos[1] - door[1] - 1.5) < .1, 'she steps out of her own front door');
  ok(s.stage === 'zoek' && !s.uni && s.w.join() === 'egg:ei' && s.chips === 2, 'the goal is the egg'); await settle(1500); await shot('08-outside');
  await t.ev(`document.querySelector('#quest .qchip').click()`); await settle(700); ok(await t.ev(`!!document.querySelector('.kaart-goal') && document.querySelectorAll('.kaart-gate').length === 3`), 'the chip opens the map with the goal and the three closed bridges'); await shot('09-map');
  await t.ev(`document.querySelector('#modal [data-close]').click()`);
  ok(await t.ev(`__w.tools.spot('schaar') === null && __w.tools.spot('hamer') === null`), 'no tools lie around yet'); ok(!s.info.star && !s.info.fruit, 'no star or fruit yet');
  ok(await t.ev(`document.querySelector('#b-ride').hidden`), 'no ride button yet');
  // the world is closed: the meadow cannot be walked to
  await place(45.5, 45.5); ok(await t.ev(`__w.walkTo(64,45)`) === true, 'walking to the meadow walks up to the brambles'); await settle(5000); s = await q(); ok(s.pos[0] < 49, 'and stops there (x=' + s.pos[0] + ')'); await shot('10-brambles');

  // the egg in the forest
  ok(await t.ev(`__w.M.zone[__w.M.I(Math.floor(${s.info.egg[0]}),Math.floor(${s.info.egg[1]}))]`) === 'bos', 'the egg lies in the forest');
  await place(s.info.egg[0] - 2.5, s.info.egg[1] + 1.5); await settle(2000); await shot('11-egg-hidden');
  await place(s.info.egg[0], s.info.egg[1] + .6); await settle(); s = await q(); ok(s.stage === 'ei' && s.uni && s.w.join() === 'tool:schaar,star:ster', 'egg found, it follows; now the shears'); await shot('12-egg-found');
  // shears → brambles → star → hatch
  let p = JSON.parse(await t.ev(`JSON.stringify(__w.tools.spot('schaar'))`)); ok(!!p && await t.ev(`__w.M.zone[__w.M.I(Math.floor(${p && p[0]}),Math.floor(${p && p[1]}))]`) === 'dorp', 'the shears lie in the village'); await place(p[0] - 1.5, p[1] + 1); await settle(1500); await shot('13-shears');
  await place(p[0], p[1]); await settle(); ok(await t.ev(`__w.Q.hasTool('schaar')`), 'picked up the shears');
  await place(48.5, 45.5); await t.ev(`__w.tools.useAt(49,45)`); await settle(1200); ok(await t.ev(`__w.walkable(49,45) && __w.walkable(49,46)`), 'the brambles are cut'); await shot('14-bridge-open');
  s = await q(); ok(s.info.star && s.w.join() === 'star:ster', 'the star lies in the meadow'); await place(s.info.star[0] - 2, s.info.star[1] + 1.2); await settle(2000); await shot('15-star');
  await place(s.info.star[0] - .5, s.info.star[1]); await settle(1500); await shot('16-hatching'); ok(await until(`__w.Q.quest.stage === 'baby'`, 15000), 'the star hatches the egg'); await settle(800); await shot('17-hatched');
  s = await q(); ok(s.uni && s.w.join() === 'tool:hamer,fruit:fruit', 'a little unicorn follows; now the hammer');
  // hammer → boulders → boat → fruit
  p = JSON.parse(await t.ev(`JSON.stringify(__w.tools.spot('hamer'))`)); ok(!!p && await t.ev(`__w.M.zone[__w.M.I(Math.floor(${p && p[0]}),Math.floor(${p && p[1]}))]`) === 'bos', 'the hammer lies in the forest'); await place(p[0], p[1]); await settle(); ok(await t.ev(`__w.Q.hasTool('hamer')`), 'picked up the hammer');
  await place(70.5, 56.5); await settle(1500); await shot('18-boulders'); await t.ev(`__w.tools.useAt(70,58)`); await settle(1200); ok(await t.ev(`__w.walkable(70,58) && __w.walkable(71,58)`), 'the boulders are smashed');
  await place(46.5, 70.5); await settle(1500); await shot('19-beach'); ok(await t.ev(`__w.walkTo(12,69)`) === true, 'walking to the island walks to the pier'); ok(await until(`__w.busy()`, 40000), 'the boat leaves by itself'); await t.sleep(2500); await shot('20-sailing');
  ok(await until(`!__w.busy()`, 60000), 'the boat arrives'); s = await q(); ok(s.play.side === 'eiland' && s.pos[0] < 28, 'on the rainbow island'); await settle(1500); await shot('21-island');
  await place(s.info.fruit[0] + 1.6, s.info.fruit[1] + 1.4); await settle(2000); await shot('22-rainbow-tree');
  await place(s.info.fruit[0] + .3, s.info.fruit[1] + .3); await settle(); s = await q(); ok(s.stage === 'vriend' && s.w.join() === 'wei:wei', 'she ate the fruit: now she can be ridden'); await shot('23-fed');
  ok(await t.ev(`!document.querySelector('#b-ride').hidden`), 'the ride button appears');
  // sail back, ride, jump the broken bridge
  await place(24.5, 71); await settle(600); await place(26.5, 71); ok(await until(`__w.busy()`, 10000), 'sailing back'); ok(await until(`!__w.busy()`, 60000), 'back on the beach'); s = await q(); ok(s.play.side === 'strand' && s.pos[0] > 36, 'on the beach again');
  await place(76.5, 31.5); await settle(800); ok(await t.ev(`__w.walkTo(76,25)`) === true, 'on foot she walks up to the hole'); await settle(5000); s = await q(); ok(s.pos[1] > 28.9, 'and cannot cross it on foot (z=' + s.pos[1] + ')'); await shot('24-broken-bridge');
  await t.ev(`document.querySelector('#b-ride').click()`); await settle(1200); s = await q(); ok(s.mount === 'uni', 'riding the unicorn'); await shot('25-riding');
  ok(await t.ev(`__w.walkTo(76,25)`) === true, 'riding, there is a way across'); ok(await until(`__w.info().pos[1] < 27.5`, 40000), 'she jumps the hole'); await settle(2500); await shot('26-jumped');
  await place(84.5, 13.5); await settle(2000); await shot('27-castle');
  // home to the meadow
  s = await q(); await place(s.info.gate[0] - 3, s.info.gate[1]); await settle(1500); await shot('28-meadow-gate'); await place(s.info.gate[0] - .8, s.info.gate[1]); await settle(2500);
  s = await q(); ok(s.stage === 'feest' && s.bed && s.herd === 1 && !s.uni && s.mount === null, 'party: she lives in the unicorn meadow, time for bed'); await shot('29-party');
  ok(await t.ev(`__w.walkable(76,28) && __w.walkable(77,28)`), 'a rainbow mends the bridge'); await place(76.5, 30.5); await settle(2000); await shot('30-rainbow-bridge');
  ok(await t.ev(`document.querySelector('#quest .bed') !== null && document.querySelector('#b-ride').hidden`), 'bed button shown, ride button gone');
  // sleep → a new dream → a new egg in a new world
  await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='huisje'); __w.placeAt(b.door[0]+.5,b.door[1]+.5); __w.walkTo(b.door[0],b.door[1],b)})()`); ok(await until(`!document.querySelector('#act').hidden`, 15000), 'bedroom opens'); await settle(800); await shot('31-bed');
  await t.ev(`document.querySelector('.act-huisje .tool').click()`); await t.sleep(4200); await shot('32-dreaming');
  ok(await until(`!!document.querySelector('.act-huisje .btn')`, 40000), 'morning arrives'); await shot('33-morning'); await t.ev(`document.querySelector('.act-huisje .btn').click()`); await settle(3000);
  s = await q(); ok(s.stage === 'zoek' && s.cycle === 1 && s.seed !== 0 && s.w.join() === 'egg:ei', 'a new egg in a new world'); ok(await t.ev(`__w.Q.hasTool('schaar') && __w.Q.hasTool('hamer') && __w.tools.gates().length === 3`), 'tools are kept, the bridges are closed again'); await shot('34-next-day');

  // just for fun: the bike and the ball
  s = await q(); await place(s.play.bike[0] - 1, s.play.bike[1] + 1); await settle(1500); await shot('35-bike'); await t.ev(`__w.play.tapBike()`); await settle(1500); s = await q(); ok(s.mount === 'fiets', 'on the bike');
  await t.ev(`__w.walkTo(40,37)`); await settle(4000); await shot('36-cycling'); const b0 = s.play.bike; s = await q(); ok(Math.hypot(s.play.bike[0] - b0[0], s.play.bike[1] - b0[1]) > 1, 'the bike moves with her');
  await t.ev(`__w.play.tapBike()`); await settle(600); s = await q(); ok(s.mount === null, 'off the bike');
  const ball = s.play.balls[0]; await place(ball[0] - 1.2, ball[1]); await settle(1200); await shot('37-ball'); await t.ev(`__w.walkTo(${Math.floor(ball[0]) + 1},${Math.floor(ball[1])})`); await settle(5000); s = await q(); ok(Math.hypot(s.play.balls[0][0] - ball[0], s.play.balls[0][1] - ball[1]) > .5, 'the ball rolls away when she walks into it'); await shot('38-kicked');
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors ' + t.logs.filter(l => /EXC|Error/.test(l)).join('|'));
  console.log(fail ? 'FAILED ' + fail : 'ADVENTURE OK');
}
