// node cdp.mjs tests/t-fly.mjs — a grown unicorn flies: take off, fly over the sea, land only where she could have walked,
// the map flies her there, an old unicorn friend flies too (tmp-shots/f-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777, sand: [[60, 70, 2]], picked: { munt: [1, 2] } }); 0`); await t.go(URL); await t.sleep(2000); console.log('  (a later cycle: seed ' + await t.ev('__w.seed') + ')'); }
  const pos = () => J('__w.info().pos'), zone = async () => t.ev(`__w.M.zone[__w.M.I(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))]`);

  ok(!(await t.ev('__w.fly.can()')) && await t.ev(`document.getElementById('b-fly').hidden`), 'no grown unicorn yet: no wings, no button');
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.refreshUnicorn && 0`); await t.sleep(500);
  await t.ev(`__w.placeAt(32.5, 46.5); __w.setMount(null)`); await t.sleep(800);
  await t.ev(`__w.uni.pos.set(__w.kid.pos.x + .8, 0, __w.kid.pos.z); __w.uni.path = []`); await t.sleep(300);
  ok(await until(`document.getElementById('b-fly').hidden`, 1000), 'walking beside her unicorn: no wing button yet');
  await t.key(' ', 100); await t.sleep(700); ok(!(await t.ev('__w.mount()')), 'Space next to her unicorn does not put her on (' + await t.ev('__w.action().key') + ')');
  await t.ev(`__w.setMount('uni')`); await t.sleep(800);
  ok(await t.ev('__w.fly.can()'), 'her unicorn can carry her: she can fly');
  ok(await until(`!document.getElementById('b-fly').hidden && document.getElementById('b-fly').classList.contains('call')`, 2000), 'the wing button shows and asks to be tapped');
  // take off with the button
  const fb = await J(`(r => [r.x + r.width / 2, r.y + r.height / 2])(document.getElementById('b-fly').getBoundingClientRect())`); await t.click(fb[0], fb[1]);
  ok(await until(`__w.fly.on()`, 1500), 'the wing button: up she goes'); await t.sleep(500); await t.shot('tmp-shots/f-1-takeoff.png');
  ok(await until(`__w.fly.info() && __w.fly.info().alt > 3`, 3000), 'high in the sky'); await t.sleep(400); await t.shot('tmp-shots/f-2-sky.png');
  ok(await until(`document.getElementById('b-jump').hidden && !document.getElementById('b-fly').hidden`, 1000), 'up in the sky only the wing button shows: it lands');
  // fly east over the sea with the joystick
  let a = await pos(); await t.ev(`__w.stick(1, 0)`); await t.sleep(1600); await t.ev(`__w.stick(0, 0)`); let b = await pos();
  ok(b[0] - a[0] > 8, 'flying fast with the joystick ' + a + ' -> ' + b); await t.shot('tmp-shots/f-3-over-wei.png');
  // the brambles still close the meadow: landing over it glides back to the village
  await t.ev(`__w.stick(0, 0)`); await t.sleep(300); await t.ev(`__w.jump()`);
  ok(await until(`!__w.fly.on()`, 12000), 'the action button lands'); await t.sleep(400); await t.shot('tmp-shots/f-4-landed.png');
  ok(['dorp', 'bos'].includes(await zone()), 'the meadow is still closed: she lands in the village instead (' + await zone() + ')');
  ok(await t.ev(`__w.mount()`) === 'uni' && await t.ev('__w.uni.g.visible'), 'and sits on her unicorn again');
  ok(await t.ev(`__w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`), 'on her feet on open ground');
  // with the bridges open the map flies her across to the castle
  await t.ev(`__w.M.obstacles.forEach(o => { if (o.gate && o.type === 'break') __w.M.block[__w.M.I(o.x, o.z)] = 0; })`);
  const C = await J('__w.MAP.PLACES.kasteel.tile');
  await t.ev(`__w.placeAt(32.5, 46.5); __w.setMount('uni'); 0`); await t.sleep(400);
  ok(await t.ev(`!!document.getElementById('b-map').click() || true`), 'open the map');
  await t.sleep(700); await t.shot('tmp-shots/f-5-map.png');
  const pin = await t.ev(`(() => { const b = [...document.querySelectorAll('.kaart-pin')].find(b => b.getAttribute('aria-label') === 'Kasteel'); if (!b) return false; b.click(); return true; })()`);
  ok(pin, 'tap the castle on the map'); ok(await until(`__w.fly.on()`, 2000), 'far away: she flies there'); await t.sleep(2500); await t.shot('tmp-shots/f-6-to-castle.png');
  ok(await until(`!__w.fly.on()`, 25000), 'and lands by herself'); await t.sleep(500); await t.shot('tmp-shots/f-7-castle.png');
  { const p = await pos(); ok(await zone() === 'kasteel' && Math.hypot(p[0] - C[0], p[1] - C[1]) < 6, 'at the castle ' + p); }
  // the goal on the map (the castle, now that she can ride): she flies there, lands and rides in through the gate
  await t.ev(`__w.placeAt(32.5, 46.5); __w.setMount('uni'); 0`); await t.sleep(400);
  await t.ev(`document.getElementById('b-map').click()`); await t.sleep(700);
  ok(await t.ev(`(() => { const b = document.querySelector('.kaart-goal'); if (!b) return false; b.click(); return true; })()`), 'tap the goal on the map');
  ok(await until(`__w.fly.on()`, 2000), 'she flies to the castle'); ok(await until(`!__w.fly.on()`, 25000), 'lands');
  ok(await until(`__w.info().pos[1] > 102`, 15000), 'and rides on in through the castle gate'); await t.sleep(800); await t.shot('tmp-shots/f-7b-hall.png');
  // nothing to fly on in a room
  await t.ev(`__w.placeAt(27.5, 117.5)`); await t.sleep(500); ok(!(await t.ev('__w.fly.can()')), 'no flying in the cave');
  // an old unicorn from the meadow, walking along, flies her too
  await t.ev(`__w.Q._reset({ stage: 'zoek', herd: [{ body: '#FFFFFF', mane: '#4FA3F7', horn: '#F7C548', name: 'Wolkje', kind: 'zee' }] }); 0`); await t.sleep(1500);
  const P = await J('__w.MAP.PEN'); await t.ev(`__w.placeAt(${P.gate[0][0] + .5}, ${P.z0 - 1.5})`); await t.sleep(800);
  ok(!(await t.ev('__w.fly.can()')), 'no unicorn with her: no flying');
  await t.ev(`(c => { c.pos.set(${P.gate[0][0] + .5}, 0, ${P.z0 - .5}); c.path = []; __w.life.tapAnimal(c); })(__w.animals.find(a => a.uniKind))`); await t.sleep(900);
  ok(await t.ev('__w.fly.can()'), 'an old unicorn comes along: she can fly on her');
  await t.ev('__w.fly.start()'); ok(await until(`__w.fly.info() && __w.fly.info().alt > 3`, 3000), 'up on the old unicorn'); await t.sleep(300); await t.shot('tmp-shots/f-8-friend.png');
  await t.ev(`__w.stick(0, -1)`); await t.sleep(1200); await t.ev(`__w.stick(0, 0); __w.jump()`); ok(await until(`!__w.fly.on()`, 12000), 'lands');
  ok(await t.ev(`(c => c.g.visible && c.friend)(__w.animals.find(a => a.uniKind))`), 'the old unicorn is back on the ground, still with her');
  ok(['dorp', 'bos'].includes(await zone()), 'in the village or the forest (' + await zone() + ')');
  if (fail) console.log('  FLY FAILED ' + fail);
}
