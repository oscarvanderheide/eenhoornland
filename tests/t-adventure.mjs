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
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const place = (x, z) => t.ev(`__w.placeAt(${x},${z})`);
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 500; i++) { if (await t.ev(expr)) return true; await t.sleep(500); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL);

  // start screen → dream → outside
  ok(await t.ev(`!document.querySelector('#start').hidden && document.querySelectorAll('#start .pick').length === 2`), 'start screen asks who plays'); await shot('01-start');
  await t.ev(`document.querySelector('#start .pick[data-who="fenna"]').click()`); await settle(1800);
  ok(await t.ev(`!!document.querySelector('#dream')`), 'the dream starts'); await shot('02-dream-asleep');
  for (const n of ['03-dream-egg', '04-dream-egg2', '05-dream-unicorn', '06-dream-unicorn2', '07-dream-awake']) { await t.sleep(3300); await shot(n); }
  ok(await until(`!document.querySelector('#dream') && document.querySelector('#start').hidden`, 90000), 'the dream ends and the game begins');
  let s = await q(); const door = JSON.parse(await t.ev(`JSON.stringify(__w.BUILDINGS.find(b=>b.id==='huisje').door)`));
  ok(await t.ev('__w.who()') === 'fenna', 'the girl who was picked plays'); ok(Math.hypot(s.pos[0] - door[0] - .5, s.pos[1] - door[1] - 1.5) < .1, 'she steps out of her own front door');
  ok(s.stage === 'zoek' && !s.uni && s.w.join() === 'egg:ei' && s.chips === 2, 'the goal is the egg'); await settle(1500); await shot('08-outside');
  await t.ev(`document.querySelector('#quest .qchip').click()`); await settle(700); ok(await t.ev(`!!document.querySelector('.kaart-goal') && document.querySelectorAll('.kaart-gate').length === 3`), 'the chip opens the map with the goal and the three closed bridges'); await shot('09-map');
  await t.ev(`document.querySelector('#modal [data-close]').click()`);
  ok(await t.ev(`!__w.tools.spot('zwaard') && !__w.tools.spot('haak')`), 'no sword in the stone and no hookshot chest yet'); ok(!s.info.star && !s.info.fruit, 'no star or fruit yet');
  ok(await t.ev(`document.querySelector('#b-ride').hidden`), 'no ride button yet');
  // the world is closed: the meadow cannot be walked to
  await place(45.5, 45.5); ok(await t.ev(`__w.walkTo(64,45)`) === true, 'walking to the meadow walks up to the brambles'); await settle(5000); s = await q(); ok(s.pos[0] < 49, 'and stops there (x=' + s.pos[0] + ')'); await shot('10-brambles');

  // the egg in the forest
  ok(await t.ev(`__w.M.zone[__w.M.I(Math.floor(${s.info.egg[0]}),Math.floor(${s.info.egg[1]}))]`) === 'grot', 'the egg lies in the cave in the forest');
  await place(36.5, 10.5); await settle(1800); await shot('10b-cave-mouth'); await t.ev(`__w.walkTo(36, 6)`); ok(await until(`__w.info().pos[1] > 102`, 30000), 'the dark mouth in the rock leads into the cave'); await settle(2000); await shot('10c-cave');
  await place(s.info.egg[0] - 2.5, s.info.egg[1] + 1.5); await settle(2000); await shot('11-egg-hidden');
  await place(s.info.egg[0], s.info.egg[1] + .6); await settle(); s = await q(); ok(s.stage === 'ei' && s.uni && s.w.join() === 'tool:zwaard,star:ster', 'egg found, it follows; now the shears'); await shot('12-egg-found');
  // shears → brambles → star → hatch
  let p = JSON.parse(await t.ev(`JSON.stringify(__w.tools.spot('zwaard'))`)); ok(!!p && await t.ev(`__w.M.zone[__w.M.I(Math.floor(${p && p[0]}),Math.floor(${p && p[1]}))]`) === 'dorp', 'the sword stands in a stone in the village'); await place(p[0] - 2.5, p[1] + 1); await settle(1500); await shot('13-sword');
  await place(p[0] - .9, p[1] + .1); await t.sleep(1400); await shot('13b-tug'); ok(await until(`__w.Q.hasTool('zwaard') && !!document.getElementById('scene')`, 20000), 'at the stone the pulling scene opens');
  await t.sleep(1600); await shot('13c-pull');
  { const c = await J(`(r => [r.x + r.width / 2, r.y + r.height / 2])(document.getElementById('scene').getBoundingClientRect())`); for (let i = 0; i < 30 && await t.ev(`!!document.getElementById('scene')`); i++) { await t.click(c[0], c[1]); await t.sleep(i === 6 ? 10 : 130); if (i === 6) await shot('13d-pulling'); } }
  ok(await until(`!document.getElementById('scene')`, 8000), 'tapping pulls it out, and the scene ends'); await t.sleep(400); await shot('13e-got-it'); await settle(2500);
  await place(48.5, 45.5); await t.ev(`__w.tools.useAt(49,45)`); await t.sleep(600); ok(!(await t.ev(`__w.walkable(49,45)`)), "walking into the brambles never cuts them"); await t.ev(`__w.slash()`); await settle(1200); ok(await t.ev(`__w.walkable(49,45) && __w.walkable(49,46)`), "a slash with the sword cuts the brambles"); await shot('14-bridge-open');
  s = await q(); ok(s.info.star && s.w.join() === 'star:ster', 'the star lies in the meadow'); await place(s.info.star[0] - 3, s.info.star[1] + 1.2); await settle(2000); await shot('15-star');
  for (let k = 0; k < 2; k++) { s = await q(); const st = s.info.star; await place(st[0] - 1.5, st[1] + .3); ok(await until(`__w.extras.info().starHops === ${k + 1}`, 15000), 'it giggles and hops away (' + (k + 1) + ')'); await t.sleep(400); await shot('15' + 'ab'[k] + '-hop'); await until(`!__w.extras.info().starMoving`, 15000); }
  s = await q(); await place(s.info.star[0] - .5, s.info.star[1]); ok(await until(`!!document.querySelector('#scene')`, 15000), 'touching the star starts the hatching scene'); ok(await t.ev(`__w.Q.quest.stage`) === 'baby', 'and it is saved right away');
  const tap = () => t.ev(`document.querySelector('#scene') && document.querySelector('#scene').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})),1`);
  for (const n of ['16a-cold', '16b-warm', '16c-wobble', '16d-flash', '16e-born', '16f-friends']) { await t.sleep(3200); await shot(n); await tap(); }
  ok(await until(`!document.querySelector('#scene')`, 30000), 'the hatching scene ends'); await settle(1500); await shot('17-hatched');
  await place(76.5, 31.5); await settle(600); await t.ev(`__w.walkTo(76,25)`); await settle(5000); s = await q(); ok(s.pos[1] > 28.9 && s.mount === null, 'a baby cannot jump the broken bridge yet (z=' + s.pos[1] + ')');
  s = await q(); ok(s.uni && s.w.join() === 'tool:haak,fruit:fruit', 'a little unicorn follows; now the hookshot');
  // hookshot → the gap → boat → fruit
  p = JSON.parse(await t.ev(`JSON.stringify(__w.tools.spot('haak'))`)); ok(!!p && await t.ev(`__w.M.zone[__w.M.I(Math.floor(${p && p[0]}),Math.floor(${p && p[1]}))]`) === 'bos', 'the hookshot chest stands in the forest'); await place(p[0] + .5, p[1] + 3.5); await settle(1800); await shot('17b-chest');
  await t.ev(`(() => { const H = __w.haak.info(), st = __w.keien.stones().filter(s => s.tag === 'puzzle'); st.forEach((s, k) => __w.keien.slideTo(s, H.plates[k][0], H.plates[k][1])); })()`);
  ok(await until(`__w.Q.hasTool('haak')`, 6000), 'a stone on each button: the chest opens, the hookshot is hers'); await settle(1500); await shot('17c-hookshot');
  await place(70.5, 55.5); await settle(1500); await shot('18-gap'); await t.ev(`__w.hook()`); ok(await until(`__w.kid.pos.z > 60 && !__w.busy()`, 8000), 'the hookshot pulls her across the gap in the bridge');
  await place(88.5, 70.5); await settle(1500); await shot('19-beach'); ok(await t.ev(`__w.walkTo(134,67)`) === true, 'walking to the island walks to the pier'); ok(await until(`__w.busy()`, 40000), 'she gets into the boat'); await t.sleep(2500); await shot('20-sailing'); ok(await t.ev(`__w.sea.info().arrow`), 'a rainbow arrow by the boat points the way'); await t.ev(`__w.play.steer(126.5, 66.5)`);
  ok(await until(`!__w.busy()`, 150000), 'the boat arrives'); s = await q(); ok(s.play.side === 'eiland' && s.pos[0] > 110, 'on the rainbow island');  await settle(1500); await shot('21-island');
  ok(s.info.fruitInTree, 'the fruit hangs in the rainbow tree'); await place(s.info.fruit[0] + 1, s.info.fruit[1] + .9); await settle(2000); await shot(`22-rainbow-tree`);
  for (let k = 0; k < 2; k++) { await until(`__w.kid.hop <= 0`, 8000); await t.ev(`__w.jump()`); await t.sleep(1200); } await shot('22b-shaken'); ok(await until(`!__w.extras.info().fruitInTree`, 8000), 'two jumps shake it out of the tree'); await t.sleep(1500); s = await q();
  if (s.info.fruit) await place(s.info.fruit[0] + .3, s.info.fruit[1] + .3); ok(await until(`!!document.querySelector('#scene')`, 15000), 'catching the fruit starts the feeding scene');
  for (const n of ['23a-hungry', '23b-pick', '23c-eat', '23d-magic', '23e-strong', '23f-climb']) { await t.sleep(3200); await shot(n); await tap(); } await t.sleep(4500); await shot('23g-gallop'); await t.ev(`document.querySelector('#scene .skip') && document.querySelector('#scene .skip').click()`);
  ok(await until(`!document.querySelector('#scene')`, 30000), 'the feeding scene ends'); await settle(1500);
  s = await q(); ok(s.stage === 'vriend' && s.w.join() === 'wei:wei' && s.mount === 'uni', 'she ate the fruit, and the girl is riding her straight away'); await shot('23-fed');
  ok(await t.ev(`!document.querySelector('#b-ride').hidden`), 'the ride button appears');
  // sail back, ride, jump the broken bridge
  await place(124.5, 66.5); await settle(600); ok(await t.ev(`__w.walkTo(86,70)`) === true, 'walking back to the beach walks to the pier'); ok(await until(`__w.busy()`, 40000), 'sailing back'); await t.ev(`__w.play.steer(87.5, 70.5)`); ok(await until(`!__w.busy()`, 150000), 'back on the beach'); ok(await until(`__w.info().pos[0] < 89 && !__w.info().path`, 30000), 'and she walks on to where the tap was'); s = await q(); ok(s.play.side === 'strand' && s.pos[0] > 80, 'on the beach again');
  s = await q(); ok(s.mount === null && await t.ev(`document.querySelector('#b-ride').classList.contains('call')`), 'off the unicorn after the boat: the ride button asks to be tapped');
  await t.ev(`document.querySelector('#b-ride').click()`); await settle(1200); s = await q(); ok(s.mount === 'uni', 'the button puts her on the unicorn'); await shot('25-riding'); await t.ev(`document.querySelector('#b-ride').click()`); await settle(800);
  await place(76.5, 31.5); await settle(800); await shot('24-broken-bridge'); ok(await t.ev(`__w.walkTo(76,25)`) === true, 'on foot she walks up to the hole');
  ok(await until(`__w.info().pos[1] < 28`, 60000), 'there she climbs on by herself and jumps it'); s = await q(); ok(s.mount === 'uni', 'riding'); await settle(2500); await shot('26-jumped');
  await place(84.5, 12.5); await settle(2000); await shot('27-castle');
  // into the castle: in the garden six flowers are asleep; when they are all awake the rainbow is whole
  await t.ev(`__w.setMount('uni'); __w.walkToBuilding('kasteel')`); ok(await until(`__w.info().pos[1] > 102`, 30000), 'riding up to the castle gate goes into the hall'); await settle(2000); await shot('27b-hall'); await t.ev(`__w.walkTo(70, 107)`); ok(await until(`!!document.querySelector('.act-kasteel canvas')`, 30000), 'the golden door leads to the garden'); await settle(2800); await shot('28-castle-garden');
  const tapStage = async (x, y) => { const r = JSON.parse(await t.ev(`(()=>{const c=document.querySelector('.pstage canvas'),r=c.getBoundingClientRect();return JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height,cw:c.width/2,ch:c.height/2})})()`)); await t.click(r.l + x / r.cw * r.w, r.t + y / r.ch * r.h); };
  for (let i = 0; i < 6; i++) { await tapStage(35 + i * 30, 100); await until(`__w.Q.quest.blooms.includes(${i}) || __w.Q.quest.stage === 'feest'`, 10000); await settle(300); }
  await settle(2500); await shot('29-party'); await t.ev(`document.querySelector('#act-close').click()`); await settle(1500);
  s = await q(); ok(s.stage === 'feest' && s.bed && s.herd === 1 && !s.uni && s.mount === null, 'party: the rainbow is awake, she lives with the other unicorns, time for bed');
  ok(await t.ev(`__w.walkable(76,28) && __w.walkable(77,28)`), 'a rainbow mends the bridge'); await place(76.5, 30.5); await settle(2000); await shot('30-rainbow-bridge');
  ok(await t.ev(`document.querySelector('#quest .bed') !== null && document.querySelector('#b-ride').hidden`), 'bed button shown, ride button gone');
  // sleep → a new dream → a new egg in a new world
  await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='huisje'); __w.placeAt(b.door[0]+.5,b.door[1]+.5); __w.walkTo(b.door[0],b.door[1],b)})()`); ok(await until(`!document.querySelector('#act').hidden`, 15000), 'bedroom opens'); await settle(800); await shot('31-bed');
  await t.ev(`document.querySelector('.act-huisje .tool').click()`); await t.sleep(4200); await shot('32-dreaming');
  ok(await until(`!!document.querySelector('.act-huisje .btn')`, 40000), 'morning arrives'); await shot('33-morning'); await t.ev(`document.querySelector('.act-huisje .btn').click()`); await settle(3000);
  s = await q(); ok(s.stage === 'zoek' && s.cycle === 1 && s.seed !== 0 && s.w.join() === 'egg:ei', 'a new egg in a new world'); ok(await t.ev(`__w.Q.hasTool('zwaard') && __w.Q.hasTool('haak') && __w.tools.gates().length === 2`), 'tools are kept, the brambles and the hole are back'); await shot('34-next-day');

  // just for fun: the bike and the ball
  s = await q(); await place(s.play.bike[0] - 1, s.play.bike[1] + 1); await settle(1500); await shot('35-bike'); await t.ev(`__w.play.tapBike()`); await settle(1500); s = await q(); ok(s.mount === 'fiets', 'on the bike');
  await t.ev(`__w.walkTo(40,37)`); await settle(4000); await shot('36-cycling'); const b0 = s.play.bike; s = await q(); ok(Math.hypot(s.play.bike[0] - b0[0], s.play.bike[1] - b0[1]) > 1, 'the bike moves with her');
  await t.ev(`__w.play.tapBike()`); await settle(600); s = await q(); ok(s.mount === null, 'off the bike');
  const ball = s.play.balls[0]; await place(ball[0] - 1.2, ball[1]); await settle(1200); await shot('37-ball'); await t.ev(`__w.walkTo(${Math.floor(ball[0]) + 1},${Math.floor(ball[1])})`); await settle(5000); s = await q(); ok(Math.hypot(s.play.balls[0][0] - ball[0], s.play.balls[0][1] - ball[1]) > .5, 'the ball rolls away when she walks into it'); await shot('38-kicked');
  // the living world: scarecrow and birds, shaking a tree, throwing an animal, musical mushrooms, fish
  const sc = JSON.parse(await t.ev(`JSON.stringify(__w.M.trees.find(t=>t.kind==='scarecrow'))`.replace('JSON.stringify(', 'JSON.stringify((({x,z})=>({x,z}))(').replace(/\)$/, '))')));
  await place(sc.x + 3.5, sc.z + 2.5); await settle(1500); const sit = (await t.ev('__w.life.info().birds')); await shot('39-scarecrow');
  await t.ev(`__w.life.tapProp(__w.M.trees.find(t=>t.kind==='scarecrow'))`); await t.sleep(900); await shot('40-birds-fly'); const li = JSON.parse(await t.ev('JSON.stringify(__w.life.info())')); ok(li.flying >= 3 && li.birds < sit, 'shaking the scarecrow makes the birds fly away (' + li.flying + ' flying)');
  await t.ev(`__w.life.tapProp(__w.M.trees.find(t=>t.kind==='tree'&&__w.M.zone[__w.M.I(t.x,t.z)]==='dorp'))`); await t.sleep(300); ok(await t.ev('__w.life.info().bits') > 0, 'a tapped tree drops leaves');
  const a0 = JSON.parse(await t.ev(`JSON.stringify((a=>[a.pos.x,a.pos.z,a.name])(__w.animals[0]))`)); await place(a0[0] - 2, a0[1] + 1.5); await settle(800);
  await t.ev(`__w.life.hold(__w.animals[0])`); await t.sleep(700); await shot('41-holding'); await t.ev(`__w.life.toss(__w.animals[0], 5, -1)`); await t.sleep(600); await shot('42-thrown');
  ok(await until(`!__w.animals[0].fly`, 30000), a0[2] + ' lands'); const a1 = JSON.parse(await t.ev(`JSON.stringify((a=>[a.pos.x,a.pos.z,__w.walkable(Math.floor(a.pos.x),Math.floor(a.pos.z)),a.lift])(__w.animals[0]))`)); ok(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) > 1.5 && a1[2] && a1[3] === 0, 'somewhere else, on its feet, on walkable ground');
  await t.ev(`__w.life.hold(__w.animals[1]); __w.animals[1].pos.set(7.5, 0, 44); __w.life.toss(__w.animals[1], -2, 0)`); ok(await until(`!__w.animals[1].fly && !__w.animals[1].swim`, 60000), 'an animal thrown into the sea swims back to land'); ok(await t.ev(`(a=>__w.walkable(Math.floor(a.pos.x),Math.floor(a.pos.z)))(__w.animals[1])`), 'and stands on land');
  await t.ev(`__w.life.splash(4.5, 44.5)`); await t.sleep(200); ok(await t.ev('__w.life.info().fish') > 0, 'a tap on the sea makes a fish jump');
  await place(16.5, 18.6); await settle(1500); await shot('43-mushrooms');
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors ' + t.logs.filter(l => /EXC|Error/.test(l)).join('|'));
  console.log(fail ? 'FAILED ' + fail : 'ADVENTURE OK');
}
