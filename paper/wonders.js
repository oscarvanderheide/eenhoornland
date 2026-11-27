// What stands on the rainbow island (set-regenboog.js).
//   rainbow    a real arch of six bands of card, big enough to walk under. A tap: she is carried up one side, over the top
//              (slowly: the going up uses up her speed) and down the other, faster and faster. The camera goes back to see it
//   paint      puddles of paint on the ground. Walking through one colours her feet: her next steps leave prints of that
//              colour, and the prints stay
//   mushroom   big and springy. Walking onto one bounces her; the bigger the mushroom, the higher. A tap: it wobbles
import { THREE, paper, circlePts, slab, whiteEdge } from './kit.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
export const BANDS = ['#e98f8f', '#f2b56b', '#f2d86b', '#9ed9a0', '#8fc3e0', '#bba6ea'];

export function rainbow(S, x, y, z, R = 4.4) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const W = .3, [wx, wz] = S.at([x, z]);
  BANDS.forEach((c, i) => { const m = mesh(new THREE.RingGeometry(R - (i + 1) * W, R - i * W, 44, 1, 0, Math.PI), c, { side: THREE.DoubleSide }); m.position.z = i * .012; m.receiveShadow = false; g.add(m); });
  for (const s of [-1, 1]) for (const [dx, dy, dz, r] of [[0, .28, .2, .5], [.42, .2, .3, .36], [-.4, .22, .28, .38], [.1, .5, .1, .34]]) { const c = mesh(new THREE.SphereGeometry(r, 10, 8), '#fbf7ee'); c.scale.y = .72; c.position.set(s * (R - W * 3) + dx, dy, dz); g.add(c); }   // a cloud at each foot
  for (const s of [-1, 1]) S.solid({ x: x + s * (R - W * 3), z: z + .1, r: .55 });
  const RR = R + .02, G = 6.5, S0 = .2, S1 = Math.PI - .2, VTOP = 1.1;
  let mode = null, t = 0, s = S0, w = 0, rides = 0, spark = 0;
  const toy = { look: [wx, wz], shot: null, step(dt, inp) {
    t += dt;
    if (mode === 'on') { const k = Math.min(1, t / .45); girl.x = wx - RR * Math.cos(S0) - (1 - k) * 1.0; girl.z = wz + .06 + (1 - k) * .6; girl.lift = RR * Math.sin(S0) * k + Math.sin(k * Math.PI) * .5; girl.view = 'side'; girl.face = 1; girl.poseName = k > .6 ? 'sit' : null; if (k >= 1) { mode = 'ride'; s = S0; w = Math.sqrt(2 * G * (1 - Math.sin(S0)) / RR + (VTOP / RR) ** 2); rides++; sfx.whoosh(); toy.shot = { span: 26, tall: 16, rise: .3, riseTall: .5, dof: .4, range: 6 }; } return; }
    if (mode === 'ride') {
      w += -(G / RR) * Math.cos(s) * dt; w = Math.max(w, .25); s += w * dt;
      girl.x = wx - RR * Math.cos(s); girl.z = wz + .06; girl.lift = RR * Math.sin(s); girl.lean = (s - Math.PI / 2) * -.75; girl.poseName = s > 1.9 ? 'up' : 'sit'; girl.face = 1; girl.view = 'side';
      spark -= dt; if (spark <= 0) { spark = .14; S.confetti(girl.x - .2, y + girl.lift + .3, girl.z, BANDS, 2, S.starGeo, .8); }
      if (s >= S1) { mode = 'off'; t = 0; toy.shot = null; sfx.thud(); }
      return;
    }
    const k = Math.min(1, t / .4); girl.x = wx - RR * Math.cos(S1) + k * 1.1; girl.z = wz + .06 + k * .6; girl.lift = RR * Math.sin(S1) * (1 - k) + Math.sin(k * Math.PI) * .45; girl.lean = 0; girl.poseName = null;
    if (k >= 1) { girl.lift = 0; mode = null; girl.hopV = 2.2; S.confetti(girl.x, y + .5, girl.z, BANDS, 14, S.starGeo, 2.4); S.stopPlay(); }
  } };
  S.tap(g, () => { if (S.playing()) return; S.walkThen(wx - RR * Math.cos(S0) - 1.0, wz + .66, () => { if (S.playing()) return; mode = 'on'; t = 0; S.play(toy); }, 1.2); });
  return { toy, state: () => ({ mode, s, rides, high: girl.lift || 0 }), step() { } };
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
