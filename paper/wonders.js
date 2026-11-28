// What stands on the rainbow island (set-regenboog.js).
//   rainbow    a real arch of six bands of card, big enough to walk under. A tap: she hops up the little clouds resting on
//              its left half to the very top, sits, and slides down the other side, faster and faster. And once she comes
//              down onto its top out of the sky (voyage.js: the island rising under her boat)
//   paint      puddles of paint on the ground. Walking through one colours her feet: her next steps leave prints of that
//              colour, and the prints stay
//   mushroom   big and springy. Walking onto one bounces her; the bigger the mushroom, the higher. A tap: it wobbles
import { THREE, paper, circlePts, slab, whiteEdge } from './kit.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
export const BANDS = ['#e98f8f', '#f2b56b', '#f2d86b', '#9ed9a0', '#8fc3e0', '#bba6ea'];

export function rainbow(S, x, y, z, R = 4.4) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const W = .3, [wx, wz] = S.at([x, z]);
  BANDS.forEach((c, i) => { const m = mesh(new THREE.RingGeometry(R - (i + 1) * W, R - i * W, 44, 1, 0, Math.PI), c, { side: THREE.DoubleSide }); m.position.z = i * .012; m.receiveShadow = false; g.add(m); });
  for (const s of [-1, 1]) for (const [dx, dy, dz, r] of [[0, .28, .2, .5], [.42, .2, .3, .36], [-.4, .22, .28, .38], [.1, .5, .1, .34]]) { const c = mesh(new THREE.SphereGeometry(r, 10, 8), '#fbf7ee'); c.scale.y = .72; c.position.set(s * (R - W * 3) + dx, dy, dz); g.add(c); }
  for (const s of [-1, 1]) S.solid({ x: x + s * (R - W * 3), z: z + .1, r: .55 });
  const RR = R + .02, G = 6.5, S0 = .2, S1 = Math.PI - .2;
  // little clouds resting on the left half of the arch: the steps she hops up by (Oscar: going up the slide "feels a bit weird")
  const STEPS = [.55, .9, 1.22];
  for (const s of STEPS) { const cg = new THREE.Group(); cg.position.set(-RR * Math.cos(s), RR * Math.sin(s) - .12, .2); g.add(cg); for (const [dx, dy, r] of [[0, 0, .26], [-.22, -.04, .18], [.22, -.03, .19], [.06, .1, .17]]) { const c = mesh(new THREE.SphereGeometry(r, 10, 8), '#fbf7ee'); c.scale.set(1.1, .7, .8); c.position.set(dx, dy, 0); cg.add(c); } }
  let mode = null, t = 0, s = S0, w = 0, rides = 0, spark = 0, hop = 0, landed = 0;
  const cloudAt = i => i < 0 ? [wx - RR * Math.cos(S0) - 1.0, 0, wz + .66] : i >= STEPS.length ? [wx, RR, wz + .06] : [wx - RR * Math.cos(STEPS[i]), RR * Math.sin(STEPS[i]) + .05, wz + .26];
  const toy = { look: [wx, wz], shot: null, step(dt, inp) {
    t += dt;
    if (mode === 'climb') {   // up the clouds, hop by hop, and onto the very top
      const k = Math.min(1, t / .42), a = cloudAt(hop - 1), b = cloudAt(hop), e = k * k * (3 - 2 * k);
      girl.x = a[0] + (b[0] - a[0]) * e; girl.z = a[2] + (b[2] - a[2]) * e; girl.lift = a[1] + (b[1] - a[1]) * e + Math.sin(k * Math.PI) * .45; girl.view = 'side'; girl.face = 1; girl.poseName = k < .8 ? 'up' : null; girl.lean = 0;
      if (k >= 1) { t = 0; hop++; sfx.hop(); S.confetti(girl.x, y + girl.lift + .1, girl.z, ['#fbf7ee', '#e2d8f4'], 4, undefined, 1.2);
        if (hop > STEPS.length) { mode = 'ride'; s = Math.PI / 2 + .02; w = .2; rides++; sfx.chime(); } }
      return; }
    if (mode === 'ride') {   // down the other side, faster and faster
      w += -(G / RR) * Math.cos(s) * dt; w = Math.max(w, .25); s += w * dt;
      girl.x = wx - RR * Math.cos(s); girl.z = wz + .06; girl.lift = RR * Math.sin(s); girl.lean = (s - Math.PI / 2) * -.75; girl.poseName = s > 1.9 ? 'up' : 'sit'; girl.face = 1; girl.view = 'side';
      spark -= dt; if (spark <= 0) { spark = .14; S.confetti(girl.x - .2, y + girl.lift + .3, girl.z, BANDS, 2, S.starGeo, .8); }
      if (s >= S1) { mode = 'off'; t = 0; toy.shot = null; sfx.thud(); }
      return;
    }
    const k = Math.min(1, t / .4); girl.x = wx - RR * Math.cos(S1) + k * 1.1; girl.z = wz + .06 + k * .6; girl.lift = RR * Math.sin(S1) * (1 - k) + Math.sin(k * Math.PI) * .45; girl.lean = 0; girl.poseName = null;
    if (k >= 1) { girl.lift = 0; mode = null; girl.hopV = 2.2; S.confetti(girl.x, y + .5, girl.z, BANDS, 14, S.starGeo, 2.4); S.stopPlay(); }
  } };
  S.tap(g, () => { if (S.playing()) return; S.walkThen(wx - RR * Math.cos(S0) - 1.0, wz + .66, () => { if (S.playing()) return; mode = 'climb'; hop = 0; t = 0; S.play(toy); sfx.hop(); }, 1.2); });
  /** she comes down out of the sky onto the top of the arch (the boat thrown up by the rising island, voyage.js): and slides down */
  const land = () => { mode = 'ride'; s = Math.PI / 2 + .02; w = .25; t = 0; rides++; landed++; toy.shot = null; S.play(toy); sfx.thud(); sfx.chime(); S.confetti(wx, y + RR + .3, wz, BANDS, 18, S.starGeo, 2.6); };
  return { toy, land, top: [wx, y + RR, wz + .06], foot: [wx + RR + .9, wz + .9], state: () => ({ mode, s, rides, landed, hop, high: girl.lift || 0 }), step() { } };
}

/** `puddles`: [{ x, z, r, col }] in the set's measure, on ground of height y */
export function paint(S, puddles, y) {
  const { girl, sfx } = S, origin = S.at([0, 0]), N = 140;
  for (const p of puddles) { const m = slab(circlePts(p.r, Math.round(p.x * 7 + p.z * 13) + 50, 22).map(([a, b]) => [a * 1.25, b]), y + .02, .02, paper(p.col), whiteEdge); m.position.set(p.x, 0, p.z); S.root.add(m); [p.wx, p.wz] = S.at([p.x, p.z]); }
  const geo = new THREE.CircleGeometry(.075, 9); geo.rotateX(-Math.PI / 2); geo.scale(1, 1, 1.6);
  const prints = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: .9 }), N); prints.userData.live = true; prints.frustumCulled = false; prints.count = 0; prints.receiveShadow = true; S.root.add(prints);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), C = new THREE.Color();
  let wet = null, n = 0, made = 0, lx = girl.x, lz = girl.z, gone = 0, side = 1, dips = 0, inside = null;
  return { state: () => ({ wet: wet ? wet.col : null, left: wet ? wet.n : 0, prints: made, dips }), step() {
    const now = puddles.find(p => Math.hypot((girl.x - p.wx) / 1.25, girl.z - p.wz) < p.r * .85) || null;
    if (now && now !== inside && !S.playing()) { wet = { col: now.col, n: 34 }; dips++; sfx.splash(); S.confetti(girl.x, y + .15, girl.z, [now.col, '#fbf7ee'], 9, undefined, 1.8); }
    inside = now;
    const d = Math.hypot(girl.x - lx, girl.z - lz); if (d > 1.5) { lx = girl.x; lz = girl.z; gone = 0; return; }   // (a door or a ride moved her: no prints across the gap)
    gone += d; const dx = girl.x - lx, dz = girl.z - lz; lx = girl.x; lz = girl.z;
    if (wet && !now && !S.playing() && !(girl.lift > .05) && gone > .3 && d > 0) {
      gone = 0; side = -side; const a = Math.atan2(dx, dz), i = n % N; n++; made++;
      Q.setFromAxisAngle(UP, a); M.compose(new THREE.Vector3(girl.x - origin[0] + Math.cos(a) * .08 * side, (S.heightAt(girl.x, girl.z) ?? y) + .022 + (i % 7) * .0006, girl.z - origin[1] - Math.sin(a) * .08 * side), Q, ONE);
      prints.setMatrixAt(i, M); prints.setColorAt(i, C.set(wet.col)); prints.count = Math.min(N, n); prints.instanceMatrix.needsUpdate = true; if (prints.instanceColor) prints.instanceColor.needsUpdate = true;
      if (--wet.n <= 0) wet = null;
    }
  } };
}

export function mushroom(S, x, y, z, r = .5, col = '#e98f8f', power = 1) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const h = r * .9, [wx, wz] = S.at([x, z]);
  const stem = mesh(new THREE.CylinderGeometry(r * .3, r * .38, h, 10), '#fbf5ea'); stem.position.y = h / 2; g.add(stem);
  const cap = new THREE.Group(); cap.position.y = h; cap.userData.live = true; g.add(cap);
  const dome = mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), col); dome.scale.y = .62; cap.add(dome);
  const under = mesh(new THREE.CircleGeometry(r, 14), '#f6e7c8', { side: THREE.DoubleSide }); under.rotation.x = Math.PI / 2; cap.add(under);
  for (const [a, e, q] of [[.4, .5, .16], [2.2, .7, .12], [3.9, .45, .14], [5.3, .8, .1], [1.2, 1.15, .11]]) { const d = mesh(new THREE.SphereGeometry(r * q, 8, 6), '#fbf7ee'); d.scale.y = .35; d.position.set(Math.cos(a) * Math.sin(e) * r * .92, Math.cos(e) * r * .62, Math.sin(a) * Math.sin(e) * r * .92); cap.add(d); }
  S.glue(cap);
  let squash = 0, cool = 0, bounces = 0, t = 0;
  const boing = () => { squash = 1; t = 0; sfx.boing(); };
  S.tap(g, boing);
  return { state: () => ({ bounces }), step({ dt }) {
    cool -= dt;
    if (cool <= 0 && !S.playing() && Math.hypot(girl.x - wx, girl.z - wz) < r * .8) { cool = .55; bounces++; girl.hopV = 3.6 + power * 1.6; boing(); S.confetti(wx, y + h + .2, wz, [col, '#fbf7ee'], 6, undefined, 1.6); }
    if (squash > .01) { t += dt; squash *= Math.exp(-dt * 5); const k = Math.sin(t * 22) * squash; cap.scale.set(1 + k * .18, 1 - k * .3, 1 + k * .18); } else cap.scale.set(1, 1, 1);
  } };
}

/* ---------------- the rainbow tree ---------------- */
/** The tree in the middle of the rainbow island: a pale trunk, a big round crown of cloud-white paper, and fruit in
 *  every colour of the rainbow hanging from it. A tap shakes it, and a rainbow fruit falls (one at a time: while one lies
 *  about, the tree only rustles). Given to the baby unicorn, the fruit makes her grow (paper.js growUni) */
export function rainbowTree(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const mesh = (geo, col) => { const m = new THREE.Mesh(geo, paper(col)); m.castShadow = m.receiveShadow = true; return m; };
  const trunk = mesh(new THREE.CylinderGeometry(.16, .26, 2.0, 10), '#e8d9c4'); trunk.position.y = 1.0; g.add(trunk);
  const crown = new THREE.Group(); crown.userData.live = true; crown.position.y = 2.0; g.add(crown);
  const PASTEL = ['#f8d3d8', '#fbe0c4', '#fbf0bc', '#d5efd2', '#cfe6f4', '#e2d8f4'];   // the crown in the rainbow's colours, pale
  [[0, .55, 0, .95], [-.8, .25, .1, .7], [.82, .28, .05, .72], [-.35, .95, -.1, .62], [.4, .98, -.05, .64], [0, .2, .45, .6]].forEach(([dx, dy, dz, r], i) => { const c = mesh(new THREE.SphereGeometry(r, 14, 10), PASTEL[i]); c.scale.y = .82; c.position.set(dx, dy, dz); crown.add(c); });
  // the fruit hangs under the crown's edge, on little stalks, where it shows
  BANDS.forEach((c, i) => { const a = (i + .5) / BANDS.length * Math.PI, px = Math.cos(a) * 1.0, pz = .25 + Math.sin(a) * .45, fr = mesh(new THREE.SphereGeometry(.12, 10, 8), c); fr.position.set(px, -.22 - (i % 2) * .12, pz); crown.add(fr); const st = mesh(new THREE.CylinderGeometry(.012, .012, .22, 4), '#7a5a3e'); st.position.set(px, -.06 - (i % 2) * .06, pz); crown.add(st); });
  S.glue(crown); S.solid({ x, z, r: .35 });
  let wob = 0, shakes = 0;
  S.tap(g, () => { wob = 1; shakes++; S.sfx.rustle(); if (S.lying('regenboog') === 0) S.dropFrom('regenboog', x + .7, z + .6, y + 2.2); }, 'regenboogboom');
  return { state: () => ({ shakes, fruit: S.lying('regenboog') }), step({ dt, time }) { if (wob > 0) { wob = Math.max(0, wob - dt * 1.6); crown.rotation.z = Math.sin(time * 22) * .06 * wob; } } };
}
