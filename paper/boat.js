// The boat to the rainbow island (Oscar: "in pixel art we had the boat to get to the island where we eat the fruit ...
// bring that back"). The bridge from the beach is gone; a short jetty stands on each side, and a little blue rowing boat
// lies at one of them.
//   the boat     a tap (or ✕ near it): she walks out on the jetty and climbs in, her unicorn hops in behind, and across
//                they row in a gentle curve, the oars going, the camera wide; on the other side she steps out on the jetty
//   far side     if she stands on a jetty and the boat lies at the other one, it rows itself over to fetch her
// The boat belongs to no island (S.world): it is on the water between them, and never put away with one.
import { THREE, paper, WATER_Y } from './kit.js';

const m3 = (geo, col) => { const m = new THREE.Mesh(geo, paper(col)); m.castShadow = m.receiveShadow = true; return m; };

/** `ends`: the two jetties in the world's measure, each { stand: [x, z] where she gets in and out, moor: [x, z] where the boat lies } */
export function ferry(S, ends) {
  const { girl, uni, sfx } = S, g = new THREE.Group(); S.world(g);
  const hull = [[-1.0, 0], [-.7, .34], [.55, .36], [1.05, 0], [.55, -.36], [-.7, -.34]].map(([px, pz]) => new THREE.Vector2(px, pz)), sh = new THREE.Shape(hull), inner = new THREE.Shape(hull.map(v => v.clone().multiplyScalar(.82)));
  const body = m3(new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false }), '#8fc3e0'); body.rotation.x = -Math.PI / 2; g.add(body);
  const rim = m3(new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: false }), '#fbf5ea'); rim.rotation.x = -Math.PI / 2; rim.position.y = .3; rim.scale.set(1.03, 1.03, 1); g.add(rim);
  const deck = m3(new THREE.ShapeGeometry(inner), '#e8d5b0'); deck.rotation.x = -Math.PI / 2; deck.position.y = .345; g.add(deck);
  for (const px of [-.3, .35]) { const seat = m3(new THREE.BoxGeometry(.16, .04, .6), '#c79a66'); seat.position.set(px, .37, 0); g.add(seat); }
  const oars = [-1, 1].map(s => { const o = new THREE.Group(); o.position.set(.05, .42, s * .3); g.add(o); const shaft = m3(new THREE.BoxGeometry(1.2, .035, .05), '#c79a66'); shaft.position.x = 0; o.add(shaft); const bl = m3(new THREE.BoxGeometry(.3, .03, .14), '#e98f8f'); bl.position.set(-.62, 0, 0); o.add(bl); return { o, s }; });
  let at = 0, mode = null, t = 0, from = null, to = null, crossings = 0, empty = false, wait = 0;
  const dock = i => { const [mx, mz] = ends[i].moor, [ox, oz] = ends[1 - i].moor; return { x: mx, z: mz, a: Math.atan2(-(oz - mz), ox - mx) }; };
  const place = (p, a, bob) => { g.position.set(p.x, WATER_Y + bob, p.z); g.rotation.set(0, a, Math.sin(bob * 9) * .05); };
  { const d = dock(0); place(d, d.a, 0); }
  const path = (k, A, B) => { const x = A.x + (B.x - A.x) * k, z = A.z + (B.z - A.z) * k + Math.sin(k * Math.PI) * 1.6; return { x, z }; };   // across in a gentle curve
  const toy = { look: [0, 0], shot: { span: 16, tall: 10, rise: .45, riseTall: .6, dof: .4, range: 3, fx: 1, fz: 1, lag: 1 }, rate: 1.4, step(dt) {
    t += dt;
    if (mode === 'in') {   // she climbs in from the jetty, her unicorn hops in behind
      const k = Math.min(1, t / .5), [sx, sz] = ends[at].stand; girl.x = sx + (g.position.x - sx) * k; girl.z = sz + (g.position.z + .05 - sz) * k; girl.lift = Math.sin(k * Math.PI) * .4 + (WATER_Y + .4 - girl.y) * k; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side';
      if (!uni.away) { uni.busy = true; uni.x = girl.x - .5; uni.z = girl.z - .02; uni.lift = Math.sin(k * Math.PI) * .5 + (WATER_Y + .36 - uni.y) * k; }
      if (k >= 1) { mode = 'row'; t = 0; from = dock(at); to = dock(1 - at); sfx.splash(); } return; }
    if (mode === 'row') {   // across, the oars going round
      const T = 6.5, k = Math.min(1, t / T), e = k * k * (3 - 2 * k), p = path(e, from, to), q = path(Math.min(1, e + .01), from, to), a = Math.atan2(-(q.z - p.z), q.x - p.x);
      place(p, a, Math.sin(t * 3) * .03); for (const { o, s } of oars) { o.rotation.y = s * (.2 + Math.sin(t * 4.4) * .45); o.rotation.z = Math.cos(t * 4.4) * .12; }
      if (Math.floor(t * 4.4 / 6.283) !== Math.floor((t - dt) * 4.4 / 6.283)) { sfx.swish(1); S.confetti(p.x, WATER_Y + .2, p.z + .3, ['#cfeaf0', '#f6efe2'], 4, undefined, 1.2); }
      girl.x = p.x; girl.z = p.z + .05; girl.lift = WATER_Y + .4 - girl.y; girl.poseName = 'sit'; girl.view = 'side'; girl.face = Math.sign(to.x - from.x) || 1;
      if (!uni.away) { uni.x = p.x - girl.face * .5; uni.z = p.z; uni.lift = WATER_Y + .36 - uni.y; uni.face = girl.face; }
      toy.look = [p.x, p.z];
      if (k >= 1) { at = 1 - at; mode = 'out'; t = 0; crossings++; } return; }
    if (mode === 'out') {   // out onto the other jetty
      const k = Math.min(1, t / .5), [sx, sz] = ends[at].stand; girl.x = g.position.x + (sx - g.position.x) * k; girl.z = g.position.z + (sz - g.position.z) * k; girl.lift = (WATER_Y + .4 - girl.y) * (1 - k) + Math.sin(k * Math.PI) * .4; girl.poseName = null;
      if (!uni.away) { uni.x = girl.x - .8; uni.z = girl.z + .2; uni.lift = (WATER_Y + .36 - uni.y) * (1 - k) + Math.sin(k * Math.PI) * .5; }
      if (k >= 1) { mode = null; girl.lift = 0; uni.lift = 0; S.stopPlay(); sfx.hop(); } }
  } };
  const board = () => { if (S.playing() || mode) return; const [sx, sz] = ends[at].stand; S.walkThen(sx, sz, () => { if (S.playing() || mode) return; mode = 'in'; t = 0; toy.look = [g.position.x, g.position.z]; S.play(toy); sfx.hop(); }, .9); };
  S.tap(g, () => { if (!mode && !empty && Math.hypot(girl.x - ends[at].stand[0], girl.z - ends[at].stand[1]) < 10) board(); }, 'boot');
  return { state: () => ({ at, mode, crossings, empty, stands: ends.map(e => e.stand) }), step({ dt, time }) {
    if (!mode && !empty) { const d = dock(at); place(d, d.a, Math.sin(time * 1.6) * .025);
      // she waits on the other jetty: the boat comes over to fetch her
      const there = Math.hypot(girl.x - ends[1 - at].stand[0], girl.z - ends[1 - at].stand[1]) < 1.2 && !S.playing(); wait = there ? wait + dt : 0;
      if (wait > .8) { empty = true; t = 0; from = dock(at); to = dock(1 - at); sfx.swish(1); } }
    else if (empty) { t += dt; const k = Math.min(1, t / 5), e = k * k * (3 - 2 * k), p = path(e, from, to), q = path(Math.min(1, e + .01), from, to); place(p, Math.atan2(-(q.z - p.z), q.x - p.x), Math.sin(t * 3) * .03); for (const { o, s } of oars) o.rotation.y = s * (.2 + Math.sin(t * 4.4) * .45); if (k >= 1) { at = 1 - at; empty = false; } }
  } };
}
