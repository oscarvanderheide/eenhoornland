// The boat to the rainbow island (Oscar: "in pixel art we had the boat to get to the island where we eat the fruit ...
// bring that back"). A short jetty stands on the beach and one on the rainbow island far out at sea; a little blue rowing
// boat lies at one of them. She sails it herself (Oscar: "we should also be able to control the boat we need to get to
// candy island initially ourselves ... we need to travel further over sea and encounter things"):
//   the boat     a tap (or ✕ near it): she walks out on the jetty and climbs in, her unicorn hops in behind
//   sailing      the stick or the arrows steer as when she walks; a tap on the water rows there, a finger held down on the
//                water steers towards it. The oars go as fast as the boat. Land and jetties stop it (it bumps, gently)
//   arriving     near either jetty the boat glides in by itself and she steps out on the jetty
//   far side     if she stands on a jetty and the boat lies at the other one, it rows itself over to fetch her
// The boat belongs to no island (S.world): it is on the water between them, and never put away with one.
import { THREE, paper, WATER_Y } from './kit.js';

const m3 = (geo, col) => { const m = new THREE.Mesh(geo, paper(col)); m.castShadow = m.receiveShadow = true; return m; };
const SPEED = 3.4, TURN = 2.4, DOCK = 2.8;

/** `ends`: the two jetties in the world's measure, each { stand: [x, z] where she gets in and out, moor: [x, z] where the boat lies } */
export function ferry(S, ends) {
  const { girl, uni, sfx } = S, g = new THREE.Group(); S.world(g);
  const hull = [[-1.0, 0], [-.7, .34], [.55, .36], [1.05, 0], [.55, -.36], [-.7, -.34]].map(([px, pz]) => new THREE.Vector2(px, pz)), sh = new THREE.Shape(hull), inner = new THREE.Shape(hull.map(v => v.clone().multiplyScalar(.82)));
  const body = m3(new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false }), '#8fc3e0'); body.rotation.x = -Math.PI / 2; g.add(body);
  const rim = m3(new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: false }), '#fbf5ea'); rim.rotation.x = -Math.PI / 2; rim.position.y = .3; rim.scale.set(1.03, 1.03, 1); g.add(rim);
  const deck = m3(new THREE.ShapeGeometry(inner), '#e8d5b0'); deck.rotation.x = -Math.PI / 2; deck.position.y = .345; g.add(deck);
  for (const px of [-.3, .35]) { const seat = m3(new THREE.BoxGeometry(.16, .04, .6), '#c79a66'); seat.position.set(px, .37, 0); g.add(seat); }
  const oars = [-1, 1].map(s => { const o = new THREE.Group(); o.position.set(.05, .42, s * .3); g.add(o); const shaft = m3(new THREE.BoxGeometry(1.2, .035, .05), '#c79a66'); o.add(shaft); const bl = m3(new THREE.BoxGeometry(.3, .03, .14), '#e98f8f'); bl.position.set(-.62, 0, 0); o.add(bl); return { o, s }; });
  // a little pennant on a stick at the bow, so she can see which way it points
  { const st = m3(new THREE.CylinderGeometry(.012, .012, .7, 5), '#8d6a48'); st.position.set(.85, .65, 0); g.add(st);
    const fl = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-.32, -.08), new THREE.Vector2(0, -.16)])), paper('#f4a6c4', { side: THREE.DoubleSide })); fl.position.set(.85, .98, 0); fl.userData.live = true; g.add(fl); g.userData.flag = fl; }
  let at = 0, mode = null, t = 0, from = null, to = null, crossings = 0, empty = false, wait = 0, left = false, bumps = 0;
  const boat = { x: 0, z: 0, a: 0, v: 0 };   // where the boat is and which way it points (a: as atan2(-dz, dx), so rotation.y = a)
  const dock = i => { const [mx, mz] = ends[i].moor, [sx, sz] = ends[i].stand; return { x: mx, z: mz, a: Math.atan2(-(sz - mz), sx - mx) }; };   // moored: its bow to the jetty
  const place = (x, z, a, bob) => { boat.x = x; boat.z = z; boat.a = a; g.position.set(x, WATER_Y + bob, z); g.rotation.set(0, a, Math.sin(bob * 9) * .05); };
  { const d = dock(0); place(d.x, d.z, d.a, 0); }
  const path = (k, A, B) => { const x = A.x + (B.x - A.x) * k, z = A.z + (B.z - A.z) * k + Math.sin(k * Math.PI) * 3; return { x, z }; };   // (fetching her: across in a gentle curve)
  const oarsGo = (k, time) => { for (const { o, s } of oars) { o.rotation.y = s * (.2 + Math.sin(time * 4.4) * .45 * k); o.rotation.z = Math.cos(time * 4.4) * .12 * k; } };
  const seat = () => {   // she sits in the middle, her unicorn behind her
    const fx = Math.cos(boat.a), fz = -Math.sin(boat.a);
    girl.x = boat.x + fx * .05; girl.z = boat.z + fz * .05 + .05; girl.lift = WATER_Y + .4 - girl.y; girl.poseName = 'sit'; girl.view = 'side'; if (Math.abs(fx) > .2) girl.face = Math.sign(fx);
    if (!uni.away) { uni.busy = true; uni.x = boat.x - fx * .55; uni.z = boat.z - fz * .55; uni.lift = WATER_Y + .36 - uni.y; uni.face = girl.face; }
  };
  const SAIL = { span: 19, tall: 12, rise: .46, riseTall: .62, dof: .35, range: 4, fx: 1, fz: 1, lag: 1 }, LOW = { span: 9.5, tall: 6.5, rise: .1, riseTall: .16, ly: .5, yaw: -.85, dof: .5, range: 3, fx: 1, fz: 1, lag: 1 };   // (yaw: from the south-west, so the island stands before her)
  let cine = null;   // (the voyage may take the camera for a while: { look, shot, rate })
  const toy = { look: [0, 0], shot: SAIL, rate: 1.2, steer: true, at: () => [boat.x, boat.z], step(dt, inp) {
    t += dt;
    if (mode === 'in') {   // she climbs in from the jetty, her unicorn hops in behind
      const k = Math.min(1, t / .5), [sx, sz] = ends[at].stand; girl.x = sx + (boat.x - sx) * k; girl.z = sz + (boat.z + .05 - sz) * k; girl.lift = Math.sin(k * Math.PI) * .4 + (WATER_Y + .4 - girl.y) * k; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side';
      if (!uni.away) { uni.busy = true; uni.x = girl.x - .5; uni.z = girl.z - .02; uni.lift = Math.sin(k * Math.PI) * .5 + (WATER_Y + .36 - uni.y) * k; }
      if (k >= 1) { mode = 'sail'; t = 0; left = false; boat.v = 0; sfx.splash(); } return; }
    if (mode === 'sail') {
      // steering: turn towards where she wants to go, row faster the straighter the boat points there; let go and it drifts to a stop
      const m = inp.move;
      if (m) { const want = Math.atan2(-m[1], m[0]); let d = want - boat.a; d = Math.atan2(Math.sin(d), Math.cos(d)); boat.a += Math.sign(d) * Math.min(Math.abs(d), TURN * dt); boat.v += (SPEED * Math.max(.25, Math.cos(d)) - boat.v) * Math.min(1, dt * 1.6); }
      else boat.v *= Math.exp(-dt * 1.1);
      const fx = Math.cos(boat.a), fz = -Math.sin(boat.a), nx = boat.x + fx * boat.v * dt, nz = boat.z + fz * boat.v * dt;
      // land ahead (the bow and both sides of it): it bumps and stops
      if (boat.v > .05 && [0, .45, -.45].some(o => S.dry(nx + fx * 1.15 - fz * o, nz + fz * 1.15 + fx * o))) { if (boat.v > .8) { sfx.thud(); bumps++; S.confetti(nx + fx * 1.1, WATER_Y + .2, nz + fz * 1.1, ['#cfeaf0', '#f6efe2'], 8, undefined, 1.6); } boat.v = 0; }
      else place(nx, nz, boat.a, Math.sin(t * 3) * .03);
      if (Math.hypot(boat.x - ends[at].moor[0], boat.z - ends[at].moor[1]) > DOCK + 2) left = true;
      oarsGo(Math.min(1, boat.v / SPEED), t * (.6 + boat.v / SPEED));
      if (boat.v > .8 && Math.floor(t * 1.6) !== Math.floor((t - dt) * 1.6)) { sfx.swish(1); S.confetti(boat.x - fx * 1.0, WATER_Y + .15, boat.z - fz * 1.0 + .2, ['#cfeaf0', '#f6efe2'], 4, undefined, 1.1); }
      seat(); toy.look = [boat.x + fx * 2.5, boat.z + fz * 1.5];
      // the camera: as the voyage asks (the island rising: far back), or low over the water as she comes in to a jetty far out,
      // so the island stands tall over her (Oscar: "when we get close to the part where we can park our boat we can get the
      // camera low again for a different sensation of scale")
      const far = ends.findIndex(e => e.low && Math.hypot(boat.x - e.moor[0], boat.z - e.moor[1]) < 13 && (!e.open || e.open()));
      if (cine) { toy.look = cine.look; toy.shot = cine.shot; toy.rate = cine.rate || .5; }
      else if (far >= 0) { const [jx, jz] = ends[far].moor; toy.look = [boat.x * .4 + jx * .6, boat.z * .4 + jz * .6]; toy.shot = LOW; toy.rate = .8; }
      else { toy.shot = SAIL; toy.rate = 1.2; }
      // near a jetty (the other one, or back at her own once she has been out): in it glides by itself
      for (const i of [0, 1]) { if (i === at && !left) continue; if (ends[i].open && !ends[i].open()) continue; if (Math.hypot(boat.x - ends[i].moor[0], boat.z - ends[i].moor[1]) < DOCK) { mode = 'dock'; t = 0; from = { ...boat }; to = dock(i); at = i; sfx.chime(); } }
      return; }
    if (mode === 'dock') {   // gliding in, bow to the jetty
      const k = Math.min(1, t / 1.1), e = k * k * (3 - 2 * k); let d = to.a - from.a; d = Math.atan2(Math.sin(d), Math.cos(d));
      place(from.x + (to.x - from.x) * e, from.z + (to.z - from.z) * e, from.a + d * e, Math.sin(t * 3) * .02); oarsGo(1 - k, t); seat(); toy.look = [boat.x, boat.z];
      if (k >= 1) { mode = 'out'; t = 0; crossings++; } return; }
    if (mode === 'out') {   // out onto the jetty
      const k = Math.min(1, t / .5), [sx, sz] = ends[at].stand; girl.x = boat.x + (sx - boat.x) * k; girl.z = boat.z + (sz - boat.z) * k; girl.lift = (WATER_Y + .4 - girl.y) * (1 - k) + Math.sin(k * Math.PI) * .4; girl.poseName = null;
      if (!uni.away) { uni.x = girl.x - .8; uni.z = girl.z + .2; uni.lift = (WATER_Y + .36 - uni.y) * (1 - k) + Math.sin(k * Math.PI) * .5; }
      if (k >= 1) { mode = null; girl.lift = 0; uni.lift = 0; S.stopPlay(); sfx.hop(); } }
  } };
  const board = () => { if (S.playing() || mode || empty) return; const [sx, sz] = ends[at].stand; S.walkThen(sx, sz, () => { if (S.playing() || mode) return; mode = 'in'; t = 0; toy.look = [boat.x, boat.z]; S.play(toy); sfx.hop(); }, .9); };
  S.tap(g, () => { if (!mode && !empty && Math.hypot(girl.x - ends[at].stand[0], girl.z - ends[at].stand[1]) < 10) board(); }, 'boot');
  return { toy, cine: o => { cine = o; }, state: () => ({ at, mode, crossings, empty, bumps, cine: !!cine, stands: ends.map(e => e.stand), moors: ends.map(e => e.moor), boat: [boat.x, boat.z], v: boat.v }), boat, step({ dt, time }) {
    if (!mode && !empty) { const d = dock(at); place(d.x, d.z, d.a, Math.sin(time * 1.6) * .025);
      // she waits on the other jetty: the boat comes over to fetch her
      const there = Math.hypot(girl.x - ends[1 - at].stand[0], girl.z - ends[1 - at].stand[1]) < 1.2 && !S.playing(); wait = there ? wait + dt : 0;
      if (wait > .8) { empty = true; t = 0; from = dock(at); to = dock(1 - at); sfx.swish(1); } }
    else if (empty) { t += dt; const T = Math.hypot(to.x - from.x, to.z - from.z) / 4.5, k = Math.min(1, t / T), e = k * k * (3 - 2 * k), p = path(e, from, to), q = path(Math.min(1, e + .01), from, to); place(p.x, p.z, Math.atan2(-(q.z - p.z), q.x - p.x), Math.sin(t * 3) * .03); oarsGo(1, t); if (k >= 1) { at = 1 - at; empty = false; } }
    const fl = g.userData.flag; fl.rotation.y = Math.sin(time * 3) * .4 + (mode === 'sail' ? Math.PI * .1 * Math.min(1, boat.v) : 0);
  } };
}
