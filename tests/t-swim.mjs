// node cdp.mjs tests/t-swim.mjs — she swims in the shallow sea along the shore: walk in, tap in, the action button; the open
// sea stays for the boat, and she never gets out on a shore she could not have walked to (tmp-shots/s-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777, sand: [[60, 70, 2]], picked: { munt: [1, 2] } }); 0`); await t.go(URL); await t.sleep(2000); console.log('  (a later cycle: seed ' + await t.ev('__w.seed') + ')'); }
  await t.ev(`__w.placeAt(32.5, 46.5)`); await t.sleep(500);

  // every shore near the water she may swim in is one she can walk to from here (zoek: no tools yet)
  const audit = async () => J(`(() => { const w = __w, M = w.M, W = M.W, H = w.MAP.OUT_H, R = w.fly.reachable(Math.floor(w.kid.pos.x), Math.floor(w.kid.pos.z), w.Q.canRide());
    let n = 0, bad = 0, deep = 0; for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (!w.life.canSwimAt(x, z)) continue; n++;
      let land = 9; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= W || Z >= H) continue; const i = M.I(X, Z); if (w.walkable(X, Z) && !R[i]) bad++; if (M.ground[i] !== w.MAP.SE) land = Math.min(land, Math.hypot(dx, dz)); }
      if (land > 2.01) deep++; }
    return { n, bad, deep }; })()`);
  let a = await audit();
  ok(a.n > 40, 'there is shallow water to swim in from the village: ' + a.n + ' tiles');
  ok(a.bad === 0, 'no shore she could not walk to lies within reach of it (' + a.bad + ')');
  ok(a.deep === 0, 'only shallow water, close to land (' + a.deep + ' too far out)');

  // a spot on the shore with shallow water right next to it, on her own island
  const spot = await J(`(() => { const w = __w, W = w.M.W, H = w.MAP.OUT_H, R = w.fly.reachable(Math.floor(w.kid.pos.x), Math.floor(w.kid.pos.z), false), k = w.kid.pos;
    let best = null, bd = 1e9; for (let z = 3; z < H - 3; z++) for (let x = 3; x < W - 3; x++) { if (!w.walkable(x, z) || !R[w.M.I(x, z)] || w.M.deck[w.M.I(x, z)]) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.life.canSwimAt(x + dx, z + dz) && w.life.canSwimAt(x + 2 * dx, z + 2 * dz) && w.walkable(x - dx, z - dz) && [3, 5, 7, 9].every(k => w.M.ground[w.M.I(x + k * dx, z + k * dz)] === w.MAP.SE)) { const d = Math.hypot(x - k.x, z - k.z); if (d < bd) { bd = d; best = [x, z, dx, dz]; } } }
    return best; })()`);
  ok(!!spot, 'a beach to swim from: ' + spot);
  const [sx, sz, dx, dz] = spot;

  // walk into the water: in she hops
  await t.ev(`__w.placeAt(${sx + .5}, ${sz + .5}, ${-dx}, ${-dz})`); await t.sleep(600);
  await t.ev(`__w.stick(${dx}, ${dz})`); ok(await until(`__w.life.swimming() === 'zee'`, 4000), 'walking into the shallow sea: she swims'); await t.ev('__w.stick(0, 0)');
  await t.sleep(600); await t.shot('tmp-shots/s-1-in.png');
  ok((await J('__w.kid.lift')) < -.2, 'up to her middle in the water');
  // paddle along with the stick, then try for the open sea: she stays in the shallows
  await t.ev(`__w.stick(${dx}, ${dz})`); await t.sleep(2500); await t.ev('__w.stick(0, 0)'); await t.sleep(300);
  ok(await t.ev(`__w.life.swimming() === 'zee'`), 'swimming out: still in the water');
  const p = await J('__w.info().pos'); ok(await t.ev(`[[0, 0], [-.05, 0], [.05, 0], [0, -.05], [0, .05]].some(([a, b]) => __w.life.canSwimAt(${p[0]} + a, ${p[1]} + b))`), 'she stops where the deep water starts ' + p);
  await t.shot('tmp-shots/s-2-edge.png');
  // the action button splashes
  ok((await J('__w.action().key')) === 'splash', 'in the water the button splashes');
  // back to land with the stick
  await t.ev(`__w.stick(${-dx}, ${-dz})`); ok(await until(`!__w.life.swimming()`, 6000), 'swimming back to the beach: out she climbs'); await t.ev('__w.stick(0, 0)'); await t.sleep(800);
  const q = await J('__w.info().pos'); ok(await t.ev(`__w.walkable(${Math.floor(q[0])}, ${Math.floor(q[1])})`), 'standing on land again ' + q);

  // the action button at the water's edge: in she hops
  await t.ev(`__w.placeAt(${sx + .5}, ${sz + .5}, ${-dx}, ${-dz})`); await t.sleep(700);
  const key = await J('__w.action() && __w.action().key'); ok(key === 'dip', 'at the water\'s edge the button hops in (' + key + ')');
  if (key === 'dip') { await t.ev('__w.action().run()'); ok(await until(`__w.life.swimming() === 'zee'`, 3000), 'the button: in the water'); }
  // a tap on the land takes her out and walks her there
  await t.ev(`__w.walkTo(${sx - dx}, ${sz - dz})`); ok(await until(`!__w.life.swimming()`, 6000), 'walking somewhere on land: she climbs out first'); await t.sleep(1500);

  // a tap on the shallow water from the beach: in she hops, right there
  await t.ev(`__w.placeAt(${sx + .5}, ${sz + .5}, ${-dx}, ${-dz})`); await t.sleep(600);
  const tap = await J(`(() => { const v = __w.kid.pos.clone().set(${sx + .5 + dx * 1.5}, 0, ${sz + .5 + dz * 1.5}).project(__w.camera), r = __w.renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; })()`);
  await t.click(tap[0], tap[1]); ok(await until(`__w.life.swimming() === 'zee'`, 4000), 'a tap on the shallow water: in she hops'); await t.sleep(500); await t.shot('tmp-shots/s-3-tap.png');
  await t.ev(`__w.walkTo(${sx - dx}, ${sz - dz})`); await until(`!__w.life.swimming()`, 6000); await t.sleep(1200);

  // on her unicorn she does not swim: it stays dry
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); 0`); await t.sleep(400);
  await t.ev(`__w.placeAt(${sx + .5}, ${sz + .5}, ${-dx}, ${-dz}); __w.setMount('uni')`); await t.sleep(700);
  await t.ev(`__w.stick(${dx}, ${dz})`); await t.sleep(1500); await t.ev('__w.stick(0, 0)');
  ok(!(await t.ev('__w.life.swimming()')), 'riding into the sea: no swim');
  await t.ev(`__w.setMount(null)`); await t.sleep(300);
  a = await audit(); ok(a.bad === 0 && a.n > 40, 'later stage: more open, still only shores she can walk to (' + a.n + ' tiles, ' + a.bad + ')');
  if (fail) throw new Error(fail + ' failed');
}
