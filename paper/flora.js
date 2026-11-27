// What grows and lies about on each island: every island has plants and small things of its own, so that arriving
// somewhere new looks new (Oscar, 2026-11-27: "all the areas need to feel unique ... the same flowers and mills and grass
// tufts everywhere doesn't make it feel like exploring a new area"). The village keeps the tufts, the garden flowers and
// the toy windmills. Nothing in this file is used on two islands.
//   forest    ferns, toadstools, fallen leaves
//   meadow    golden grass in seed (beside its flowers and dandelions)
//   beach     beach grass on the dune, starfish, driftwood, a rowing boat pulled up on the sand
//   rainbow   candy-floss trees, pompom flowers, sprinkles on the ground
//   castle    cypresses, clipped bushes in pots, rose hedges, pennants, a golden ball on a pedestal
// scatter(S, n, pick, seed, make) plants n of something: `pick(R)` gives a spot [x, y, z] or null, `make(R, k)` the thing.
import { THREE, rng, paper, card, sunPts } from './kit.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const pickOf = (R, list) => list[Math.floor(R() * list.length)];
export function scatter(S, n, pick, seed, make) { const R = rng(seed); let k = 0; for (let tries = 0; k < n && tries < n * 40; tries++) { const at = pick(R); if (!at) continue; const o = make(R, k++); o.position.set(at[0], at[1], at[2]); S.root.add(o); } return k; }

/* ---------------- the forest ---------------- */
const FERN = [[0, 0], [.1, .055], [.16, .03], [.24, .07], [.3, .035], [.38, .06], [.5, 0], [.38, -.035], [.3, -.015], [.24, -.045], [.16, -.015], [.1, -.035]];
const fernGeo = card(FERN, .012, paper('#5f8665')).geometry;
export function fern(R) {
  const g = new THREE.Group(), c = pickOf(R, ['#5f8665', '#6f9670', '#547a5c']), n = 5 + Math.floor(R() * 3), m = paper(c, { side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) { const hold = new THREE.Group(); hold.rotation.y = i / n * Math.PI * 2 + R() * .4; const f = new THREE.Mesh(fernGeo, [m, m]); f.castShadow = true; f.rotation.z = .45 + R() * .35; f.rotation.x = -.5; f.scale.setScalar(.8 + R() * .5); hold.add(f); g.add(hold); }
  return g;
}
export function toadstool(R) {
  const g = new THREE.Group(), r = .05 + R() * .04, h = .06 + R() * .06, stem = mesh(new THREE.CylinderGeometry(r * .32, r * .4, h, 6), '#f6efe2'); stem.position.y = h / 2; g.add(stem);
  const cap = mesh(new THREE.SphereGeometry(r, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), pickOf(R, ['#b9785a', '#c98a5e', '#a8684e', '#d9a066'])); cap.scale.y = .65; cap.position.y = h; g.add(cap);
  if (R() < .5) { const s2 = g.clone(); s2.scale.setScalar(.6); s2.position.set(.1, 0, .05); const w = new THREE.Group(); w.add(g, s2); return w; }
  return g;
}
const LEAF = [[0, 0], [.05, .035], [.11, .03], [.16, 0], [.11, -.03], [.05, -.035]], leafGeo = card(LEAF, .008, paper('#d9a066')).geometry;
export function fallenLeaf(R) { const m = paper(pickOf(R, ['#d9a066', '#c98a5e', '#e2b56b', '#b9785a'])), f = new THREE.Mesh(leafGeo, [m, m]); f.receiveShadow = true; f.rotation.x = -Math.PI / 2 + (R() - .5) * .3; f.rotation.z = R() * 6.28; f.position.y = .012; const g = new THREE.Group(); g.add(f); return g; }

/* ---------------- the meadow ---------------- */
export function goldGrass(R) {
  const g = new THREE.Group(), n = 3 + Math.floor(R() * 3), c = pickOf(R, ['#d9c27a', '#cbb86e', '#e2cf8c']);
  for (let i = 0; i < n; i++) { const h = .42 + R() * .3, lean = (R() - .5) * .5, turn = R() * 6.28, st = mesh(new THREE.CylinderGeometry(.008, .011, h, 4), '#a8b47c'); st.position.set(Math.sin(lean) * Math.cos(turn) * h / 2 + (R() - .5) * .1, h / 2, Math.sin(lean) * Math.sin(turn) * h / 2 + (R() - .5) * .1); st.rotation.z = -lean * Math.cos(turn); st.rotation.x = lean * Math.sin(turn); g.add(st);
    const ear = mesh(new THREE.SphereGeometry(.03, 6, 4), c); ear.scale.set(1, 2.6, 1); ear.position.set(st.position.x * 2, h + .04, st.position.z * 2); ear.rotation.copy(st.rotation); g.add(ear); }
  return g;
}

/* ---------------- the beach ---------------- */
const BLADE = [[-.016, 0], [.016, 0], [.004, .5]], bladeGeo = card(BLADE, .008, paper('#c9c08a')).geometry;
export function beachGrass(R) {
  const g = new THREE.Group(), n = 6 + Math.floor(R() * 4);
  for (let i = 0; i < n; i++) { const m = paper(pickOf(R, ['#c9c08a', '#b4b97c', '#d6cc98', '#a8b47c']), { side: THREE.DoubleSide }), b = new THREE.Mesh(bladeGeo, [m, m]); b.castShadow = true; const hold = new THREE.Group(); hold.rotation.y = R() * 6.28; b.rotation.z = (R() - .5) * .9; b.scale.set(1, .8 + R() * .9, 1); hold.add(b); hold.position.set((R() - .5) * .12, 0, (R() - .5) * .12); g.add(hold); }
  return g;
}
const starGeoF = card(sunPts(.13, 5).map(([x, y], i) => i % 2 ? [x * .62, y * .62] : [x, y]), .02, paper('#f2b56b')).geometry;
export function starfish(R) { const m = paper(pickOf(R, ['#f2b56b', '#e98f8f', '#f4a6c4'])), f = new THREE.Mesh(starGeoF, [m, m]); f.castShadow = true; f.rotation.x = -Math.PI / 2; f.rotation.z = R() * 6.28; f.position.y = .02; f.scale.setScalar(.8 + R() * .5); const g = new THREE.Group(); g.add(f); return g; }
export function driftwood(S, x, y, z, a = .3, l = 1.4) { const m = mesh(new THREE.CylinderGeometry(.07, .09, l, 7), '#d9cfc2'); m.rotation.z = Math.PI / 2; m.rotation.y = a; m.position.set(x, y + .08, z); S.root.add(m); const b = mesh(new THREE.CylinderGeometry(.03, .045, .35, 5), '#cfc4b6'); b.position.set(x + Math.cos(a) * .2, y + .2, z - Math.sin(a) * .2); b.rotation.z = .7; S.root.add(b); S.solid({ x, z, r: .3 }); }
/** a rowing boat pulled up on the sand, lying a little on its side */
export function rowboat(S, x, y, z, a = .4) {
  const g = new THREE.Group(); g.position.set(x, y + .02, z); g.rotation.y = a; g.rotation.z = .1; S.root.add(g);
  const hull = [[-1.0, 0], [-.7, .34], [.55, .36], [1.05, 0], [.55, -.36], [-.7, -.34]].map(([px, pz]) => new THREE.Vector2(px, pz)), sh = new THREE.Shape(hull), inner = new THREE.Shape(hull.map(v => v.clone().multiplyScalar(.82)));
  const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false }), '#8fc3e0'); body.rotation.x = -Math.PI / 2; g.add(body);
  const deck = mesh(new THREE.ShapeGeometry(inner), '#e8d5b0'); deck.rotation.x = -Math.PI / 2; deck.position.y = .305; g.add(deck);
  const rim = mesh(new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: false }), '#fbf5ea'); rim.rotation.x = -Math.PI / 2; rim.position.y = .3; rim.scale.set(1.03, 1.03, 1); g.add(rim); deck.position.y = .345;
  for (const px of [-.25, .35]) { const seat = mesh(new THREE.BoxGeometry(.16, .04, .6), '#c79a66'); seat.position.set(px, .37, 0); g.add(seat); }
  for (const s of [-1, 1]) { const oar = mesh(new THREE.BoxGeometry(1.3, .035, .05), '#c79a66'); oar.position.set(.1, .42, s * .3); oar.rotation.y = s * .25; g.add(oar); const bl = mesh(new THREE.BoxGeometry(.3, .03, .14), '#e98f8f'); bl.position.set(.82, .42, s * (.3 - .16)); bl.rotation.y = s * .25; g.add(bl); }
  S.wall(x, z, 1.0, .55);
}

/* ---------------- the rainbow island ---------------- */
const SWEET = ['#f4a6c4', '#f2b56b', '#f2d86b', '#9ed9a0', '#8fc3e0', '#bba6ea'];
export function cottonTree(S, x, y, z, seed = 1, cols = ['#f4c6d4', '#f8dde4']) {
  const R = rng(seed), g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const h = 1.0 + R() * .5;
  const st = mesh(new THREE.CylinderGeometry(.045, .06, h, 6), '#fbf5ea'); st.position.y = h / 2; g.add(st);
  for (const [dx, dy, dz, r] of [[0, .3, 0, .46], [.3, .12, .1, .32], [-.28, .16, .05, .34], [.05, .62, -.02, .3], [-.05, .2, .26, .28]]) { const p = mesh(new THREE.SphereGeometry(r, 10, 8), cols[Math.floor(R() * cols.length)]); p.position.set(dx, h + dy, dz); p.scale.y = .85; g.add(p); }
  S.solid({ x, z, r: .12 });
}
export function pompom(R) { const g = new THREE.Group(), h = .16 + R() * .2, st = mesh(new THREE.CylinderGeometry(.008, .01, h, 4), '#b9d08a'); st.position.y = h / 2; g.add(st); const b = mesh(new THREE.SphereGeometry(.05 + R() * .04, 8, 6), pickOf(R, SWEET)); b.position.y = h + .04; g.add(b); return g; }
const sprinkleGeo = new THREE.BoxGeometry(.1, .02, .032);
export function sprinkle(R) { const f = new THREE.Mesh(sprinkleGeo, paper(pickOf(R, SWEET))); f.receiveShadow = true; f.rotation.y = R() * 6.28; f.position.y = .012; const g = new THREE.Group(); g.add(f); return g; }

/* ---------------- the castle ---------------- */
export function cypress(S, x, y, z, h = 2.4, col = '#5f8665') { const t = mesh(new THREE.CylinderGeometry(.05, .06, .3, 6), '#8d6a48'); t.position.set(x, y + .15, z); S.root.add(t); const c = mesh(new THREE.ConeGeometry(.34, h, 9), col); c.position.set(x, y + .25 + h / 2, z); S.root.add(c); S.solid({ x, z, r: .2 }); }
/** a clipped bush in a pot: 'ball', 'two' (a ball on a ball) or 'cone' */
export function topiary(S, x, y, z, kind = 'ball') {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const G = '#6f9670';
  const pot = mesh(new THREE.CylinderGeometry(.17, .13, .22, 10), '#c98a5e'); pot.position.y = .11; g.add(pot); const st = mesh(new THREE.CylinderGeometry(.025, .025, .4, 5), '#8d6a48'); st.position.y = .4; g.add(st);
  if (kind === 'cone') { const c = mesh(new THREE.ConeGeometry(.26, .8, 10), G); c.position.y = .78; g.add(c); }
  else { const b = mesh(new THREE.SphereGeometry(.27, 10, 8), G); b.position.y = .78; g.add(b); if (kind === 'two') { const b2 = mesh(new THREE.SphereGeometry(.17, 10, 8), G); b2.position.y = 1.16; g.add(b2); } }
  S.solid({ x, z, r: .2 });
}
/** a low hedge with roses, from (x0, z0) to (x1, z1) along x or along z */
export function roseHedge(S, x0, z0, x1, z1, y, seed = 1) {
  const R = rng(seed), w = Math.abs(x1 - x0) + .34, d = Math.abs(z1 - z0) + .34, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const b = mesh(new THREE.BoxGeometry(w, .36, d), '#5f8665'); b.position.set(cx, y + .18, cz); S.root.add(b);
  const n = Math.round((w + d) * 3); for (let i = 0; i < n; i++) { const r = mesh(new THREE.SphereGeometry(.045, 6, 5), pickOf(R, ['#e98f8f', '#d9706c', '#f4a6c4', '#f8dde4'])); r.position.set(cx + (R() - .5) * (w - .1), y + .37, cz + (R() - .5) * (d - .1)); S.root.add(r); }
  S.wall(cx, cz, w / 2, d / 2);
}
export function pennant(S, x, y, z, col = '#e98f8f') { const p = mesh(new THREE.CylinderGeometry(.025, .03, 1.9, 6), '#8d6a48'); p.position.set(x, y + .95, z); S.root.add(p); const f = card([[0, 0], [.5, -.14], [0, -.28]], .014, paper(col, { side: THREE.DoubleSide })); f.position.set(x + .02, y + 1.88, z); S.root.add(f); const k = mesh(new THREE.SphereGeometry(.045, 8, 6), '#f2c65c'); k.position.set(x, y + 1.93, z); S.root.add(k); S.solid({ x, z, r: .08 }); }
/** a golden ball on a stone pedestal in the middle of the court. A tap: it spins, and glitters */
export function goldBall(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  for (const [r, h, py] of [[.62, .14, .07], [.42, .5, .39], [.5, .1, .69]]) { const m = mesh(new THREE.CylinderGeometry(r * .92, r, h, 12), '#d9cfc2'); m.position.y = py; g.add(m); }
  const spin = new THREE.Group(); spin.position.y = 1.08; spin.userData.live = true; g.add(spin);
  const ball = mesh(new THREE.SphereGeometry(.34, 14, 10), '#f2c65c'); spin.add(ball); for (let i = 0; i < 3; i++) { const band = mesh(new THREE.TorusGeometry(.345, .018, 4, 16), '#e2a94a'); band.rotation.y = i * Math.PI / 3; spin.add(band); }
  S.glue(spin); S.solid({ x, z, r: .62 });
  const [wx, wz] = S.at([x, z]); let w = 0, spins = 0;
  S.tap(g, () => { w = 9; spins++; S.sfx.hop(); S.confetti(wx, y + 1.5, wz, ['#f2c65c', '#f6dfa6', '#fbf5ea'], 12, S.starGeo, 2.2); });
  return { state: () => ({ spins }), step({ dt }) { if (w > .05) { spin.rotation.y += w * dt; w *= Math.exp(-dt * 1.1); } } };
}
