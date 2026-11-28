// Over the sea on her grown unicorn (Oscar: "and then our boat gets destroyed. but with the unicorn grown it can be our boat?
// and then all other islands (except the castle of course and maybe the snow island) should be reachable too so we need add
// the wooden structures to enter land or depart to see with the unicorn").
//   jetties      each island has one of its own: the village a white one with blue posts and a lantern, the meadow a rustic
//                one with a box of flowers, the forest one of round logs with moss on its posts; the beach and the rainbow
//                island have theirs already. A red and white swim ring hangs at the end of each
//   the ring     a tap: she walks out to the end, climbs on her unicorn's back and in they go with a splash; it swims with
//                its head up and her on its back. Not grown yet: the little unicorn looks at the water and shakes its head
//   swimming     steered as the boat is (the stick, the arrows, a tap on the water, a finger held down); land stops it
//   arriving     near any jetty (another one, or her own once she has been out) it swims in by itself and she steps out
// The swimmer belongs to no island: it is made with the beach (set-strand.js) and finds the jetties in S.shared.jetties.
import { THREE, paper, slab, WATER_Y, edgeMat } from './kit.js';

const SPEED = 3.0, TURN = 2.2, DOCK = 2.6, BACK = .8, SINK = .62;
const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };

/** a jetty on this set's shore (the set's own measure): from `at` on the shore out along `dir` for `len`, its deck at `h`.
 *  `kind`: 'dorp' | 'wei' | 'bos' for its look; `deck: false` only adds the swim ring to a jetty that is there already; `open`: whether it can be reached now */
export function jetty(S, kind, at, dir, h = -.12, len = 3.2, deck = true, open = null) {
  const [x, z] = at, l = Math.hypot(dir[0], dir[1]), ux = dir[0] / l, uz = dir[1] / l, nx = -uz, nz = ux, W = .6;
  const p = (a, s) => [x + ux * a + nx * s, z + uz * a + nz * s], root = S.root, rot = Math.atan2(-uz, ux);
  const LOOK = { dorp: { plank: '#f3ece0', post: '#5f86b0' }, wei: { plank: '#c9a878', post: '#8d6a48' }, bos: { plank: '#a97a4e', post: '#6f5a48' } }[kind] || { plank: '#c9a878', post: '#8d6a48' };
  if (deck) {
    S.floor(h, [p(-.9, -W), p(len, -W), p(len, W), p(-.9, W)]);
    if (kind === 'bos') for (let a = -.7; a < len; a += .3) { const lg = m3(new THREE.CylinderGeometry(.14, .14, 2 * W + .1, 8), a % .6 < .3 ? LOOK.plank : '#b9875a'); const [cx, cz] = p(a + .14, 0); lg.rotateY(rot); lg.rotateX(Math.PI / 2); lg.position.set(cx, h - .1, cz); root.add(lg); }   // (round logs side by side, across the way)
    else for (let a = -.7; a < len; a += .32) root.add(slab([p(a, -W - .05), p(a + .28, -W - .05), p(a + .28, W + .05), p(a, W + .05)], h, .06, paper(LOOK.plank), edgeMat));
    for (const a of [.9, len - .15]) for (const s of [-W, W]) { const [px, pz] = p(a, s), m = m3(new THREE.CylinderGeometry(.07, .07, 1.8, 8), LOOK.post); m.position.set(px, h - .55, pz); root.add(m);
      if (kind === 'bos') { const moss = m3(new THREE.CylinderGeometry(.09, .09, .1, 8), '#8fb36a'); moss.position.set(px, h + .3, pz); root.add(moss); } }
    if (kind === 'dorp') { const [px, pz] = p(len - .15, W), pole = m3(new THREE.CylinderGeometry(.035, .035, 1.2, 6), '#5f86b0'); pole.position.set(px, h + .6, pz); root.add(pole);   // a little lantern on the end post
      const lamp = m3(new THREE.BoxGeometry(.18, .24, .18), '#fbf5ea'); lamp.position.set(px, h + 1.3, pz); root.add(lamp); const cap = m3(new THREE.ConeGeometry(.16, .14, 4), '#5f86b0'); cap.position.set(px, h + 1.49, pz); cap.rotation.y = Math.PI / 4; root.add(cap); }
    if (kind === 'wei') { const [bx, bz] = p(.4, -W + .12), bx2 = m3(new THREE.BoxGeometry(.5, .2, .22), '#b9875a'); bx2.position.set(bx, h + .1, bz); bx2.rotation.y = rot; root.add(bx2);   // a box of flowers by the start
      ['#f4a6c4', '#f2d86b', '#bba6ea', '#fbf5ea'].forEach((c, i) => { const f = m3(new THREE.SphereGeometry(.07, 8, 6), c); const [fx, fz] = p(.25 + i * .1, -W + .12); f.position.set(fx, h + .27, fz); root.add(f); }); }
  }
  // the swim ring, hanging on a post at the end
  const ring = new THREE.Group(), [rx, rz] = p(len - .25, -W - .12); ring.position.set(rx, h, rz); ring.userData.live = true; root.add(ring);
  { const post = m3(new THREE.CylinderGeometry(.05, .05, 1.0, 6), LOOK.post); post.position.y = .3; ring.add(post);
    for (let i = 0; i < 8; i++) { const seg = m3(new THREE.TorusGeometry(.24, .075, 8, 6, Math.PI / 4 + .02), i % 2 ? '#fbf5ea' : '#e8505b'); seg.rotation.z = i * Math.PI / 4; seg.position.set(0, .62, .07); seg.rotation.y = 0; ring.add(seg); }
    ring.rotation.y = rot + Math.PI / 2; }
  const entry = { name: kind, stand: S.at(p(len - .45, 0)), moor: S.at(deck ? p(len + 1.35, 0) : p(len - .4, 1.75)), ring, open };   // (by a jetty that has the boat at its end, the unicorn comes in beside it)
  (S.shared.jetties = S.shared.jetties || []).push(entry);
  S.tap(ring, () => { if (S.shared.swim) S.shared.swim.start(entry); }, 'zwemring-' + kind);
  return entry;
}

/** the swimming unicorn: made once (set-strand.js) */
export function swimmer(S) {
  const { girl, uni, sfx, FIGS } = S;
  let mode = null, t = 0, at = null, left = false, from = null, to = null, swims = 0, arrivals = 0, bumps = 0, face = 1, no = 0;
  const pos = { x: 0, z: 0, a: 0, v: 0 };
  const list = () => (S.shared.jetties || []).filter(j => !j.open || j.open());
  const dockOf = j => { const [mx, mz] = j.moor, [sx, sz] = j.stand; return { x: mx, z: mz, a: Math.atan2(-(sz - mz), sx - mx) }; };
  const figure = ride => uni.become(FIGS[(S.gear.wings ? 'grown' : 'groot') + (ride ? 'Ride' : '')] || FIGS[S.gear.wings ? 'grown' : 'groot']);
  const onBack = () => {   // the unicorn swims low in the water, its head up; she sits on its back
    const fx = Math.cos(pos.a); if (Math.abs(fx) > .25) face = fx > 0 ? 1 : -1;
    uni.busy = true; uni.x = pos.x; uni.z = pos.z; uni.floatY = WATER_Y - SINK; uni.lift = 0; uni.view = 'side'; uni.face = face; uni.walking = pos.v > .4; uni.lean = Math.sin(t * 5) * .03;
    girl.x = pos.x + face * .08; girl.z = pos.z - .06; girl.lift = WATER_Y - SINK + BACK - girl.y + Math.sin(t * 5) * .03; girl.poseName = 'sit'; girl.view = 'side'; girl.face = face;
  };
  const SAIL = { span: 19, tall: 12, rise: .46, riseTall: .62, dof: .35, range: 4, fx: 1, fz: 1, lag: 1 };
  const toy = { look: [0, 0], shot: SAIL, rate: 1.2, steer: true, at: () => [pos.x, pos.z], step(dt, inp) {
    t += dt;
    if (mode === 'in') {   // she climbs on its back at the jetty's end, and in they go
      const k = Math.min(1, t / .7), [sx, sz] = at.stand, e = k * k * (3 - 2 * k);
      pos.x = sx + (at.moor[0] - sx) * e; pos.z = sz + (at.moor[1] - sz) * e;
      uni.busy = true; uni.x = pos.x; uni.z = pos.z; uni.floatY = undefined; uni.lift = Math.sin(k * Math.PI) * .7 + (WATER_Y - SINK - uni.y) * e; uni.view = 'side';
      girl.x = pos.x + face * .08; girl.z = pos.z - .06; girl.lift = (uni.lift + BACK) * Math.min(1, k * 2); girl.poseName = 'sit'; girl.view = 'side';
      if (k >= 1) { mode = 'swim'; t = 0; left = false; pos.v = 0; pos.a = dockOf(at).a + Math.PI; sfx.splash(); S.confetti(pos.x, WATER_Y + .2, pos.z, ['#cfeaf0', '#ffffff', '#9fd3e0'], 22, undefined, 3); sfx.neigh(); }
      toy.look = [pos.x, pos.z]; return; }
    if (mode === 'swim') {
      const m = inp.move;
      if (m) { const want = Math.atan2(-m[1], m[0]); let d = want - pos.a; d = Math.atan2(Math.sin(d), Math.cos(d)); pos.a += Math.sign(d) * Math.min(Math.abs(d), TURN * dt); pos.v += (SPEED * Math.max(.25, Math.cos(d)) - pos.v) * Math.min(1, dt * 1.6); }
      else pos.v *= Math.exp(-dt * 1.2);
      const fx = Math.cos(pos.a), fz = -Math.sin(pos.a), nx = pos.x + fx * pos.v * dt, nz = pos.z + fz * pos.v * dt;
      if (pos.v > .05 && [0, .4, -.4].some(o => S.dry(nx + fx * .9 - fz * o, nz + fz * .9 + fx * o))) { if (pos.v > .8) { sfx.thud(); bumps++; uni.hopV = 1.5; } pos.v = 0; }   // (land ahead: it stops)
      else { pos.x = nx; pos.z = nz; }
      onBack();
      if (pos.v > .6 && Math.floor(t * 2.2) !== Math.floor((t - dt) * 2.2)) { sfx.swish(1); S.confetti(pos.x - fx * .9, WATER_Y + .12, pos.z - fz * .9 + .15, ['#cfeaf0', '#f6efe2'], 4, undefined, 1.1); }   // (a little wake)
      if (Math.hypot(pos.x - at.moor[0], pos.z - at.moor[1]) > DOCK + 2) left = true;
      toy.look = [pos.x + fx * 2.2, pos.z + fz * 1.4];
      for (const j of list()) { if (j === at && !left) continue; if (Math.hypot(pos.x - j.moor[0], pos.z - j.moor[1]) < DOCK) { mode = 'dock'; t = 0; from = { ...pos }; to = dockOf(j); at = j; sfx.chime(); break; } }
      return; }
    if (mode === 'dock') {   // swimming in, to the jetty's end
      const k = Math.min(1, t / 1.1), e = k * k * (3 - 2 * k); pos.x = from.x + (to.x - from.x) * e; pos.z = from.z + (to.z - from.z) * e; pos.v = 0; onBack(); toy.look = [pos.x, pos.z];
      if (k >= 1) { mode = 'out'; t = 0; arrivals++; } return; }
    if (mode === 'out') {   // up onto the jetty, both of them
      const k = Math.min(1, t / .6), [sx, sz] = at.stand, e = k * k * (3 - 2 * k);
      girl.x = pos.x + (sx - pos.x) * e; girl.z = pos.z + (sz - pos.z) * e; girl.lift = (WATER_Y - SINK + BACK - girl.y) * (1 - e) + Math.sin(k * Math.PI) * .5; girl.poseName = k < .7 ? 'sit' : null;
      const dl = Math.hypot(sx - at.moor[0], sz - at.moor[1]) || 1, ux = sx + (sx - at.moor[0]) / dl * .95, uz = sz + (sz - at.moor[1]) / dl * .95, deck = S.heightAt(ux, uz) ?? girl.y;   // (it climbs onto the jetty just behind her, further in)
      uni.floatY = WATER_Y - SINK + (deck - WATER_Y + SINK) * e; uni.x = pos.x + (ux - pos.x) * e; uni.z = pos.z + (uz - pos.z) * e; uni.lift = Math.sin(k * Math.PI) * .7;
      if (k >= 1) { mode = null; girl.lift = 0; uni.lift = 0; uni.floatY = undefined; uni.y = deck; uni.busy = false; figure(false); S.stopPlay(); sfx.hop(); S.confetti(uni.x, uni.y + .4, uni.z, ['#cfeaf0', '#ffffff'], 10, undefined, 2); } }
  } };
  const start = j => {
    if (S.playing() || mode) return false;
    if (!S.gear.grown || uni.away) { j.ring.userData.wob = 1; sfx.peep(); if (!uni.away) { uni.hopV = 1.6; no = 1.2; } return false; }   // (too little yet: the unicorn shakes its head at the water)
    S.walkThen(...j.stand, () => { if (S.playing() || mode) return; at = j; mode = 'in'; t = 0; swims++; face = Math.cos(dockOf(j).a + Math.PI) >= 0 ? 1 : -1; figure(true); toy.look = [j.stand[0], j.stand[1]]; S.play(toy); sfx.hop(); }, .6);
    return true; };
  return { toy, start, goTo: (x, z) => { pos.x = x; pos.z = z; }, state: () => ({ mode, swims, arrivals, bumps, at: at ? at.name : null, pos: [+pos.x.toFixed(2), +pos.z.toFixed(2)], jetties: list().map(j => j.name) }),
    step({ dt, time }) {
      for (const j of S.shared.jetties || []) { const w = j.ring.userData.wob || 0; if (w > 0) { j.ring.userData.wob = Math.max(0, w - dt * 1.8); j.ring.rotation.z = Math.sin(w * 18) * w * .3; } }
      if (no > 0) { no = Math.max(0, no - dt); uni.face = Math.floor(no * 8) % 2 ? 1 : -1; }   // (shaking its head: no, not yet)
    } };
}
