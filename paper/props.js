// Things that stand on more than one set, built from the kit. Each takes the set's toolbox S and where to stand.
import { THREE, lerp, paper, sheetOf, slab, card, edgeMat, grassMap, grassBump, sandMap, sandBump } from './kit.js';
import { THINGS } from './things.js';
import { drawWearIcon } from './kids.js';
import { E, U, S as S2, piece, ink } from './cut.js';

/** the printed papers the ground is cut from */
export const GROUND = {
  sand: paper('#ecd3a0', { map: sandMap, bump: sandBump }), grass: paper('#a3bf76', { map: grassMap, bump: grassBump }),
  high: paper('#bccb84', { map: grassMap, bump: grassBump }), wood: paper('#8fb06c', { map: grassMap, bump: grassBump }), dark: paper('#8f8a80'),
};
const PETALS = (() => { const p = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; for (let j = 0; j <= 6; j++) { const b = a - .5 + j / 6; p.push([Math.cos(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI)), Math.sin(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI))]); } } return p; })();
const TUFT = [[-.16, 0], [-.12, .2], [-.06, .05], [0, .26], [.05, .05], [.12, .22], [.16, 0]];
const rnd = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
/** The flower she has picked. One at a time (Oscar: not a bunch), and it is the very flower she picked: the same kind, the
 *  same colour. She holds it by its stem in front of her. Whoever she taps next is given it. If she picks another while she
 *  holds one, the first goes into her hair, and stays there until a third takes its place. One of these per set */
export function bouquet(S) {
  const { girl, sfx } = S, origin = S.at([0, 0]); let hand = null, hair = null, picks = 0, gifts = 0;
  const make = (o, big) => { const b = bloom(o.kind, rnd(o.seed), o.big * big, o.col); b.userData.live = true; S.root.add(b); S.glue(b); return b; };
  const drop = b => { if (!b) return; S.root.remove(b.g); b.g.traverse(q => { if (q.geometry) q.geometry.dispose(); }); };
  const me = {}, toHair = o => { drop(hair); hair = { o, g: make(o, .62) }; };
  S.offer(who => { if (!hand) return false; drop(hand); hand = null; S.hands.free(me); gifts++; who.hopV = 2.8; sfx.chime(); S.confetti(who.x, (who.y || 0) + .8, who.z, ['#f4a6c4', '#f8dde4', '#e98f8f', '#f2c65c'], 14, undefined, 2.4); girl.poseName = null; return 'bloem'; });
  return {
    /** she picks the flower `o` ({ kind, seed, big, col }) that stood at x, y, z */
    add(x, y, z, o) {
      if (S.hands.busy(me)) toHair(o);   // her hands are full (the can, the kite): the flower goes straight into her hair
      else { if (hand) { toHair(hand.o); drop(hand); } hand = { o, g: make(o, 1.15) }; S.hands.take(me, () => { if (hand) { toHair(hand.o); drop(hand); hand = null; girl.poseName = null; } }); }
      picks++; sfx.hop(); S.confetti(x, y + .45, z, ['#f4a6c4', '#f2c65c', '#f2efe6'], 6, undefined, 1.6); },
    state: () => ({ held: hand ? 1 : 0, kind: hand ? hand.o.kind : null, hair: hair ? hair.o.kind : null, picks, gifts }),
    step() {
      if (hand) { hand.g.visible = !S.playing(); if (hand.g.visible) { girl.poseName = 'hold'; const h = S.hand(); hand.g.position.set(h.x - origin[0] + girl.face * .05, h.y - hand.g.userData.h * .45, h.z - origin[1] + .05); hand.g.rotation.z = -girl.face * .22; } }   // her hands round the middle of the stem, the flower leaning forward a little
      if (hair) { const t = S.head(); hair.g.position.set(t.x - origin[0] + girl.face * .13, t.y - .1 - hair.g.userData.h, t.z - origin[1] + .03); hair.g.rotation.z = -girl.face * .3; }
    },
  };
}
/** what grows in grass: tufts of two greens and, now and then, a paper flower. `pick(R)` gives a spot [x, y, z] or null (the
 *  set knows where grass is and what lies on it); `n` things, `flowers` of every ten are flowers. The tufts are glued with
 *  the rest of the set. The flowers are one piece of their own, and each can be picked (given a `bunch`, see bouquet): a tap
 *  on one, she walks over, it is in her hand, and it grows back after a while. Gives back step() */
export function meadow(S, n, pick, seed, flowers = 2.5, greens = ['#86a466', '#9bb877', '#7f9d5e'], bunch = null) {
  const R = rnd(seed), tuft = card(TUFT, .02, paper(greens[0])).geometry, blooms = [];
  for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
    const at = pick(R); if (!at) continue; k++; const [x, y, z, want] = at;   // (`want`: the set says what grows here; without it, chance does)
    if (want ? !!want.tuft : R() * 10 >= flowers) {
      const g = paper(greens[Math.floor(R() * greens.length)]), t = new THREE.Mesh(tuft, [g, g]); t.castShadow = t.receiveShadow = true; t.position.set(x, y, z); t.rotation.y = R() * .6 - .3; t.scale.setScalar(.8 + R() * .7); S.root.add(t);
      if (R() < .5) { const t2 = new THREE.Mesh(tuft, [g, g]); t2.castShadow = true; t2.position.set(x + .16 + R() * .1, y, z + R() * .12 - .06); t2.rotation.y = R() * .8 - .4; t2.scale.setScalar(.6 + R() * .4); S.root.add(t2); }   // tufts grow in twos and threes
    } else { const o = { kind: (want && want.kind) || ['daisy', 'daisy', 'tulip', 'rose', 'spike'][Math.floor(R() * 5)], seed: Math.floor(R() * 1e9) + 1, big: (want && want.big) || 1.05, col: (want && want.col) || null }, f = bloom(o.kind, rnd(o.seed), o.big, o.col); f.position.set(x, y, z); f.rotation.y = R() * .5 - .25; blooms.push({ f, o, x, y, z, back: 0 }); }
  }
  if (!blooms.length) return { step() {}, state: () => ({ flowers: 0 }) };
  // all the flowers as one piece: every corner keeps its colour, and each flower remembers which corners are its own
  const pos = [], nor = [], uv = [], col = [], v = new THREE.Vector3(), nm = new THREE.Matrix3(); let sheet = null;
  for (const b of blooms) { b.from = pos.length / 3; b.f.updateMatrixWorld(true);
    b.f.traverse(o => { if (!o.isMesh) return; const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, mats = Array.isArray(o.material) ? o.material : [o.material], groups = Array.isArray(o.material) && geo.groups.length ? geo.groups : [{ start: 0, count: P.count, materialIndex: 0 }];
      nm.getNormalMatrix(o.matrixWorld);
      for (const gr of groups) { const m = mats[gr.materialIndex] || mats[0]; sheet = sheet || sheetOf(m); for (let i = gr.start, e = Math.min(P.count, gr.start + gr.count); i < e; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); uv.push(U.getX(i), U.getY(i)); col.push(m.color.r, m.color.g, m.color.b); } }
      o.geometry.dispose(); if (geo !== o.geometry) geo.dispose(); });
    b.to = pos.length / 3; }
  const geo = new THREE.BufferGeometry(), keep = Float32Array.from(pos);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const field = new THREE.Mesh(geo, sheet); field.castShadow = field.receiveShadow = true; field.userData.live = true; field.frustumCulled = false; S.root.add(field);
  const origin = S.at([0, 0]), P = geo.attributes.position;
  const show = (b, on) => { for (let i = b.from; i < b.to; i++) P.setY(i, on ? keep[i * 3 + 1] : -60); P.needsUpdate = true; b.gone = !on; };
  let picked = 0;
  if (bunch) S.tap(field, hit => { if (!hit || S.playing()) return; const hx = hit.point.x - origin[0], hz = hit.point.z - origin[1]; let best = null, bd = .45;
    for (const b of blooms) { const d = Math.hypot(b.x - hx, b.z - hz); if (!b.gone && d < bd) { bd = d; best = b; } }
    if (best) S.walkThen(best.x + origin[0], best.z + origin[1] + .45, () => { if (best.gone) return; show(best, false); best.back = 50 + Math.random() * 30; picked++; bunch.add(best.x + origin[0], best.y, best.z + origin[1], best.o); }, 1.0); });
  return { state: () => ({ flowers: blooms.length, picked, first: [blooms[0].x + origin[0], blooms[0].z + origin[1]] }), step({ dt }) { for (const b of blooms) if (b.back > 0) { b.back -= dt; if (b.back <= 0) show(b, true); } } };
}
const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const disc = (r, col, n = 14) => { const pts = []; for (let i = 0; i < n; i++) pts.push([Math.cos(i / n * 6.283) * r, Math.sin(i / n * 6.283) * r]); return card(pts, .02, paper(col)); };
const LEAFY = [[0, 0], [.07, .04], [.16, .02], [.2, .1], [.12, .12], [.04, .09]];
/** one paper flower of a kind, standing at the group's foot. Kinds: daisy, tulip, sun (tall, big), rose, spike (a stalk of little bells) */
const KINDS = ['daisy', 'tulip', 'sun', 'rose', 'spike', 'daisy', 'tulip'];
function bloom(kind, R, big = 1, col = null) {
  const g = new THREE.Group(), pick = a => col && a.includes(col) ? col : a[Math.floor(R() * a.length)], stemMat = paper('#6f8f55');
  const h = (kind === 'sun' ? .5 : kind === 'spike' ? .34 : .24) * (.85 + R() * .4) * big, sc = (.9 + R() * .45) * big;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, h, 4), stemMat); stem.position.y = h / 2; stem.castShadow = stem.receiveShadow = true; g.add(stem);
  const leaf = card(LEAFY, .015, paper(pick(['#86a466', '#7f9d5e']))); leaf.position.y = h * .35; leaf.scale.setScalar(sc * .9); if (R() < .5) leaf.scale.x *= -1; g.add(leaf);
  const head = new THREE.Group(); head.position.y = h + .02; head.scale.setScalar(sc); g.add(head); g.userData.h = h + .02;
  if (kind === 'daisy') { head.add(card(PETALS, .02, paper(pick(['#f2efe6', '#f4a6c4', '#f2c65c', '#b9a3e0'])))); const c = disc(.04, '#e2a13c'); c.position.z = .012; head.add(c); }
  else if (kind === 'tulip') head.add(card([[-.06, 0], [-.09, .13], [-.04, .09], [0, .16], [.04, .09], [.09, .13], [.06, 0], [0, -.03]], .03, paper(pick(['#e98f8f', '#d9706c', '#f4a6c4', '#bba6ea', '#f2c65c']))));
  else if (kind === 'sun') { const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, r = i % 2 ? .1 : .17; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } head.add(card(pts, .02, paper(pick(['#f2c65c', '#e6b748', '#f6dfa6'])))); const c = disc(.075, '#8d6a48'); c.position.z = .012; head.add(c); }
  else if (kind === 'rose') { const cols = pick([['#d9706c', '#e98f8f', '#f8dde4'], ['#bba6ea', '#d3c6f2', '#f2efe6'], ['#f4a6c4', '#f8dde4', '#fcf8f1']]); [.1, .068, .036].forEach((r, k) => { const d = disc(r, cols[k]); d.position.set(k * .012, k * .01, k * .012); head.add(d); }); }
  else { const col = pick(['#bba6ea', '#9ed9cf', '#f4a6c4']); for (let k = 0; k < 5; k++) { const d = disc(.04 - k * .004, col, 8); d.scale.y = 1.4; d.position.set((k % 2 ? .035 : -.035), -k * .055 + .04, k * .004); head.add(d); } }
  return g;
}
/** A flower garden laid out as somebody would plant it: a bed with an edge of white pebbles, tall sunflowers standing along
 *  the back, a row of tulips in two colours taking turns through the middle with a stalk of bells at each end, and small
 *  daisies along the front. Flowers only: no bare soil, no grass tufts. The tulips can be picked (into the set's bunch) and
 *  grow back. `w`, `d`: how wide and deep the bed is; `tints`: the tulips' two colours */
export function flowerBed(S, cx, y, cz, seed, bunch, w = 3.6, d = 2.0, tints = ['#e98f8f', '#f2c65c']) {
  const R = rnd(seed), bed = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; bed.push([cx + Math.cos(a) * w / 2 * (1 + .05 * Math.cos(2 * a)), cz + Math.sin(a) * d / 2]); }
  S.root.add(slab(bed, y + .012, .012, paper('#c6d795', { map: grassMap, bump: grassBump }), paper('#a9bf7c')));
  const stone = new THREE.SphereGeometry(.075, 7, 5); for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283, p = new THREE.Mesh(stone, paper(i % 2 ? '#f4ecdc' : '#e6dccb')); p.scale.set(1.2, .55, 1); p.position.set(cx + Math.cos(a) * (w / 2 + .06), y + .03, cz + Math.sin(a) * (d / 2 + .06)); p.castShadow = p.receiveShadow = true; S.root.add(p); }
  const plant = (kind, x, z, big, col) => { const f = bloom(kind, R, big, col); f.position.set(x, y + .012, z); S.root.add(f); return f; };
  // Posies, not rows (Oscar, 2026-11-27: "groups with different combinations of flowers"): five groups in the bed, three at the
  // back and two in front, each a few tall flowers of one kind in the middle with a ring of small ones of another kind round
  // them. The two beds beside her house are planted differently (`tints` says which). The tulips, in the two front posies, can be picked.
  const A = tints[0] === '#e98f8f', sx = w / 3.6, sz = d / 2.0, tulips = [];
  const ring = (gx, gz, kind, col, m, r = .31, big = .82) => { for (let i = 0; i < m; i++) { const a = i / m * 6.283 + gx; plant(kind, cx + gx + Math.cos(a) * r, cz + gz + Math.sin(a) * r * .72, big, col); } };
  const middle = (gx, gz, kind, col, pts, big = 1.25) => pts.forEach(([dx, dz]) => plant(kind, cx + gx + dx, cz + gz + dz, big, col));
  const TRIO = [[0, -.1], [-.13, .07], [.13, .07]], PAIR = [[-.14, 0], [.14, 0]], ONE = [[0, 0]];
  const back = A ? [['sun', null, ONE, 'daisy', '#f2efe6'], ['sun', null, PAIR, 'spike', '#bba6ea'], ['rose', null, TRIO, 'daisy', '#f4a6c4']]
                 : [['rose', null, TRIO, 'daisy', '#f2c65c'], ['spike', '#9ed9cf', TRIO, 'daisy', '#f2efe6'], ['sun', null, ONE, 'spike', '#f4a6c4']];
  back.forEach(([kind, col, pts, rk, rc], k) => { const gx = (k - 1) * 1.08 * sx, gz = (-.48 - (k === 1 ? .08 : 0)) * sz; ring(gx, gz, rk, rc, rk === 'spike' ? 4 : 5); middle(gx, gz, kind, col, pts, kind === 'sun' ? 1.25 : 1.15); });
  [[-.58, tints[0], A ? '#f2c65c' : '#f2efe6'], [.58, tints[1], A ? '#f2efe6' : '#b9a3e0']].forEach(([gx0, tcol, rc], g) => {
    const gx = gx0 * sx, gz = .42 * sz; ring(gx, gz, 'daisy', rc, 5, .3, .78);
    TRIO.forEach(([dx, dz], i) => { const x = cx + gx + dx * 1.15, z = cz + gz + dz, what = { kind: 'tulip', seed: seed * 31 + g * 3 + i + 1, big: 1.35, col: tcol }, f = bloom(what.kind, rnd(what.seed), what.big, what.col); f.position.set(x, y + .012, z); S.root.add(f); f.userData.live = true; S.glue(f);
      const o = { f, at: S.at([x, z]), back: 0 }; tulips.push(o);
      S.tap(f, () => { if (S.playing() || !f.visible) return; S.walkThen(o.at[0], o.at[1] + .75, () => { if (!f.visible) return; f.visible = false; o.back = 40 + R() * 20; bunch.add(o.at[0], y, o.at[1], what); }, 1.3); }); });
  });
  return { state: () => ({ tulips: tulips.map(o => ({ at: o.at, there: o.f.visible })) }), step({ dt }) { for (const o of tulips) if (o.back > 0) { o.back -= dt; if (o.back <= 0) o.f.visible = true; } } };
}
/** The fountain: a round basin of pale stone, a pillar, a bowl on top, and water that leaps in paper drops (three cut-outs of
 *  drops shown one after the other, as in stop motion). A tap: a big splash */
export function fountain(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const add = (m, px, py, pz) => { m.position.set(px, py, pz); g.add(m); return m; };
  add(m3(new THREE.CylinderGeometry(.74, .8, .36, 22), '#c9c3d4'), 0, .18, 0); add(m3(new THREE.CylinderGeometry(.62, .62, .03, 22), '#7fbcc0'), 0, .36, 0);
  add(m3(new THREE.CylinderGeometry(.1, .14, .7, 10), '#bdb6c9'), 0, .7, 0); add(m3(new THREE.CylinderGeometry(.34, .16, .14, 16), '#c9c3d4'), 0, 1.08, 0); add(m3(new THREE.CylinderGeometry(.29, .29, .02, 16), '#8fd0e0'), 0, 1.15, 0);
  const dropG = new THREE.CircleGeometry(.038, 8), phases = [0, 1, 2].map(ph => {
    const pg = new THREE.Group(); pg.userData.live = true; pg.visible = ph === 0; g.add(pg);
    for (let a = 0; a < 7; a++) for (let j = 0; j < 3; j++) {
      const u = (j + ph / 3) / 3 + .04, ang = a / 7 * 6.283 + .3, r = .3 + .36 * u, d = new THREE.Mesh(dropG, paper(j % 2 ? '#f6efe2' : '#8fd0e0', { side: THREE.DoubleSide }));
      d.position.set(Math.cos(ang) * r, 1.18 + 1.15 * u - 1.95 * u * u, Math.sin(ang) * r); d.scale.set(.8 + u * .5, 1.2 + u * .5, 1); d.castShadow = true; pg.add(d);
    }
    S.glue(pg); return pg;
  });
  S.solid({ x, z, r: .78 });
  const [wx, wz] = S.at([x, z]); let splashes = 0;
  const api = { tapped: null, state: () => ({ splashes }), step({ tick, stepped }) { if (stepped) { const on = Math.floor(tick / 2) % 3; phases.forEach((p, i) => { p.visible = i === on; }); } } };
  S.tap(g, () => { splashes++; S.sfx.splash(); S.confetti(wx, y + 1.2, wz, ['#8fd0e0', '#f6efe2', '#7fbcc0'], 18, undefined, 3); if (api.tapped) api.tapped(); });
  return api;
}
/** a bench of painted wood. A tap: she walks round to the front, hops on and sits; any push on the stick, or a touch, and she is up */
export function bench(S, x, y, z, seat = 0) {   // (`seat`: where on it she sits, off the middle: somebody may have the other half)
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const add = (w, h, d, col, px, py, pz, rx = 0) => { const m = m3(new THREE.BoxGeometry(w, h, d), col); m.position.set(px, py, pz); m.rotation.x = rx; g.add(m); return m; };
  for (const k of [-1, 0, 1]) add(1.1, .04, .12, '#d9a066', 0, .4, k * .13);                       // the seat's slats
  for (const k of [0, 1]) add(1.1, .11, .035, '#d9a066', 0, .62 + k * .16, -.24, -.12);            // the back
  for (const s of [-1, 1]) { add(.06, .4, .06, '#5f9fae', s * .46, .2, .16); add(.06, .86, .06, '#5f9fae', s * .46, .43, -.22); add(.06, .05, .46, '#5f9fae', s * .46, .52, -.03); }
  S.wall(x, z - .06, .62, .3);
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]); let mode = null, t = 0, sits = 0;
  const toy = { rest: true, look: [wx, wz + .6], step(dt, inp) {
    t += dt;
    if (mode === 'on') { const k = Math.min(1, t / .3); girl.x = wx + seat; girl.z = wz + .1 + (1 - k) * .7; girl.lift = .44 * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = 1; if (k >= 1) { mode = 'sit'; sits++; sfx.hop(); } return; }
    if (mode === 'sit') { girl.lift = .44; girl.poseName = 'sit'; if (inp.act || inp.x) { mode = 'off'; t = 0; } return; }
    const k = Math.min(1, t / .28); girl.z = wz + .1 + k * .75; girl.lift = .44 * (1 - k) + Math.sin(k * Math.PI) * .22; girl.poseName = null; if (k >= 1) { girl.lift = 0; mode = null; S.stopPlay(); }
  } };
  const sit = () => { if (S.playing()) return; mode = 'on'; t = 0; S.play(toy); };
  S.tap(g, () => { if (S.playing()) return; S.walkThen(wx + seat, wz + .8, sit, 1.1); });
  let bump = 0;
  return { toy, state: () => ({ mode, sits }),
    /** walking into the bench from the front sits her down as well: one rule for the finger and the stick */
    step({ dt }) { const p = S.pushing(), at = !S.playing() && Math.abs(girl.x - wx) < .6 && girl.z > wz && girl.z - wz < .75 && p[1] < -.6; bump = at ? bump + dt : 0; if (bump > .22) { bump = 0; sit(); } } };
}
/** a lantern: a post with a paper lamp on it. A tap lights it, a tap puts it out. Lit, it glows, and near her it gives real light */
const lanternMats = [];
export function lantern(S, x, y, z, n) {
  const mat = lanternMats[n] || (lanternMats[n] = new THREE.MeshStandardMaterial({ color: '#f6efe2', emissive: '#ffcf86', emissiveIntensity: 0, roughness: .9, side: THREE.DoubleSide })); mat.emissiveIntensity = 0;
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const post = m3(new THREE.CylinderGeometry(.035, .045, 1.25, 8), '#4b4450'); post.position.y = .625; g.add(post);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .26, 10, 1, true), mat); lamp.position.y = 1.4; g.add(lamp);
  const cap = m3(new THREE.ConeGeometry(.2, .14, 10), '#4b4450'); cap.position.y = 1.6; g.add(cap); const foot = m3(new THREE.CylinderGeometry(.11, .11, .03, 10), '#4b4450'); foot.position.y = 1.26; g.add(foot);
  S.solid({ x, z, r: .08 });
  const light = S.lamp(10 + n, '#ffc98a', 6, 1.5); light.position.set(x, y + 1.4, z); let lit = false, night = false;
  S.tap(g, () => { lit = !lit; S.sfx.click(); });
  return { state: () => ({ lit }), step({ dt, eve }) {
    if (eve > .5 && !night) { night = true; lit = true; } else if (eve < .5 && night) { night = false; lit = false; }   // on by themselves when evening falls, off in the morning; a tap still does either
    const want = lit ? 1 : 0; mat.emissiveIntensity += (want * 1.6 - mat.emissiveIntensity) * Math.min(1, dt * 8); light.intensity = want * (1.0 + 1.6 * eve); } };
}
/** a cabin of logs: round logs laid on each other, crossing at the corners, a plank door, a round window, a roof of green
 *  card and a stone chimney. (A tap knocks on the door; what is inside comes later) */
export function cabin(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const W = 2.6, D = 2.0, r = .13, rows = 6, cols = ['#b9875a', '#a97a4e', '#c1905f'];
  const log = (len, px, py, pz, alongZ, k) => { const m = m3(new THREE.CylinderGeometry(r, r, len, 8), cols[k % 3]); m.rotation[alongZ ? 'x' : 'z'] = Math.PI / 2; m.position.set(px, py, pz); g.add(m); };
  for (let k = 0; k < rows; k++) {
    const py = r + k * r * 1.9;
    log(W + .5, 0, py, -D / 2, false, k);                                                    // the back
    if (py > 1.25) log(W + .5, 0, py, D / 2, false, k + 1); else for (const s of [-1, 1]) log(W / 2 - .12, s * (W / 4 + .31), py, D / 2, false, k + 1);   // the front, with room for the door
    for (const s of [-1, 1]) log(D + .5, s * W / 2, py + r * .95, 0, true, k + 2);          // the sides, half a log higher, so they cross
  }
  const top = r + rows * r * 1.9;
  for (const s of [-1, 1]) { const gable = card([[-W / 2 - .1, 0], [W / 2 + .1, 0], [0, .95]], .08, paper('#a97a4e')); gable.position.set(0, top, s * D / 2); g.add(gable); }
  const slope = Math.hypot(W / 2 + .35, .95 + .1);
  for (const s of [-1, 1]) { const roof = m3(new THREE.BoxGeometry(slope, .07, D + .7), '#5f8665'); roof.position.set(s * (W / 4 + .09), top + .95 / 2 + .06, 0); roof.rotation.z = -s * Math.atan2(1.05, W / 2 + .35); g.add(roof); }
  const door = card([[-.3, 0], [.3, 0], [.3, 1.05], [0, 1.2], [-.3, 1.05]], .05, paper('#8d5a4a')); door.position.set(0, .02, D / 2 - .04); g.add(door);
  const knob = m3(new THREE.SphereGeometry(.035, 8, 6), '#e2b04a'); knob.position.set(.18, .55, D / 2 + .02); g.add(knob);
  const win = m3(new THREE.CylinderGeometry(.2, .2, .04, 14), '#f6dfa6', { extra: { emissive: '#f2b866', emissiveIntensity: .25 } }); win.rotation.x = Math.PI / 2; win.position.set(-.82, 1.0, D / 2 + .13); g.add(win);
  const chim = m3(new THREE.BoxGeometry(.36, 1.0, .36), '#bdb6c9'); chim.position.set(.75, top + .7, -.4); g.add(chim);
  S.wall(x, z, W / 2 + .3, D / 2 + .25);
  const [wx, wz] = S.at([x, z]); let knocks = 0;
  S.tap(g, () => { knocks++; S.sfx.thud(); setTimeout(() => S.sfx.thud(), 160); S.confetti(wx + .75, y + top + 1.5, wz - .4, ['#efe8dc', '#d9d2c4', '#f7f1e6'], 7, undefined, 1.2); });   // a knock, and a puff from the chimney
  return { state: () => ({ knocks }) };
}
/** a toy windmill on a stick: four paper sails in two colours. A tap sets it spinning, and only a tap (Oscar: not by
 *  itself, not from her running past, not from the wind); it turns in stop-motion steps and slows down by itself. Gives back step() for the set to call every frame */
export function pinwheel(S, x, y, z, a = '#f4a6c4', b = '#f2c65c', h = .8) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, h, 5), paper('#f4ecdc')); stick.position.y = h / 2; stick.castShadow = true; g.add(stick);
  const rotor = new THREE.Group(); rotor.position.set(0, h, .04); rotor.userData.live = true; g.add(rotor);
  for (let i = 0; i < 4; i++) { const sail = card([[0, 0], [.27, .03], [.2, .2], [.04, .12]], .012, paper(i % 2 ? a : b, { side: THREE.DoubleSide })); sail.rotation.z = i * Math.PI / 2; sail.position.z = i * .004; rotor.add(sail); }
  const pin = new THREE.Mesh(new THREE.CircleGeometry(.035, 10), paper('#f6efe2', { side: THREE.DoubleSide })); pin.position.z = .03; pin.castShadow = pin.receiveShadow = true; rotor.add(pin); S.glue(rotor);
  const [wx, wz] = S.at([x, z]); let om = 0, spins = 0;
  const blow = (v = 16) => { if (om < v * .5) { S.sfx.whirr(); spins++; } om = Math.max(om, v); };
  S.tap(g, () => blow());
  return { blow, at: [wx, wz], state: () => ({ om, spins }), step({ dt, stepped }) {
    om *= Math.exp(-.75 * dt); if (om < .25) om = 0;
    if (stepped && om) rotor.rotation.z -= om / 12;
  } };
}
/** a set's land: the given outlines as slabs of card, and darker cards under them. `tops` is [[outline, height, depth, paper], ...] */
export function shore(S, tops, under = []) {
  for (const [pts, h, d, p] of tops) S.root.add(slab(pts, h, d, p, edgeMat));
  for (const pts of under) S.root.add(slab(pts, -.82, .5, GROUND.dark, edgeMat));
}

// window panes glow when the lamp inside is on: one material, made once and kept
const paneMat = new THREE.MeshStandardMaterial({ color: '#3b3a45', emissive: '#ffbf6e', emissiveIntensity: 0, roughness: .6 });

/** her house: folded card, a door that opens, a lamp inside (it uses the set's second lamp). A tap opens or shuts the door
 *  and puts the light on or off. Gives back its size, toggle(), open (0 or 1) and step() for the set to call every frame.
 *  With `doorName` (see S.door) it can be walked into: the door opens by itself when she comes close, walking
 *  into it is a cut to the door of that name on another set, and a tap on the house sends her in. The lamp is then on in
 *  the evening and while the door stands open. */
export function cottage(S, x, y, z, doorName = null, tint = {}) {
  const HOUSE = { x, z, w: 2.4, d: 1.8, h: 1.8 };
  const house = new THREE.Group(); house.position.set(x, y, z); S.root.add(house);
  const inLight = S.lamp(1, '#ffb866', 4, 1.4); inLight.position.set(x, y + 1.0, z);
  let door, doorOpen = 0, doorTarget = 0, lightOn = false;
  {
    const { w, d, h } = HOUSE, T = .07;
    const wallMat = paper(tint.wall || '#e4a596', { side: THREE.DoubleSide }), roofMat = paper(tint.roof || '#4f8f8c'), trimMat = paper('#f4ecdc');
    const win = (cx, cy, ww = .42, hh = .46) => [[cx - ww / 2, cy - hh / 2], [cx + ww / 2, cy - hh / 2], [cx + ww / 2, cy + hh / 2], [cx - ww / 2, cy + hh / 2]];
    const frame = (wall, cx, cy, ww = .42, hh = .46, z = T / 2 + .005) => {
      // a white card frame with a cross, and a dark pane behind it that glows when the lamp is on
      const outer = win(cx, cy, ww + .14, hh + .14), inner = win(cx, cy, ww, hh);
      const f = card(outer, .025, trimMat, trimMat, [inner.slice().reverse()]); f.position.z = z; wall.add(f);
      const bar1 = card(win(cx, cy, ww, .045), .02, trimMat); bar1.position.z = z; wall.add(bar1);
      const bar2 = card(win(cx, cy, .045, hh), .02, trimMat); bar2.position.z = z; wall.add(bar2);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), paneMat); pane.position.set(cx, cy, -T / 2 - .01); wall.add(pane);
    };
    // front: a door and two windows; the gable is part of the same sheet
    const front = new THREE.Group(); front.position.z = d / 2; house.add(front);
    const frontPts = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + .75], [-w / 2, h]];
    const doorHole = [[-.27, .02], [.27, .02], [.27, 1.25], [-.27, 1.25]];
    front.add(card(frontPts, T, wallMat, edgeMat, [doorHole.slice().reverse(), win(-.78, 1.05).reverse(), win(.78, 1.05).reverse()]));
    frame(front, -.78, 1.05); frame(front, .78, 1.05);
    const dGroup = new THREE.Group(); dGroup.position.set(-.27, 0, .02); dGroup.userData.live = true; front.add(dGroup);
    door = card([[0, .02], [.54, .02], [.54, 1.23], [0, 1.23]], .05, paper(tint.door || '#3f6f77'), edgeMat); dGroup.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), paper('#e2b04a')); knob.position.set(.45, .62, .04); dGroup.add(knob);
    door = dGroup;
    const back = card(frontPts, T, wallMat, edgeMat, [win(-.5, .95).reverse()]); back.position.z = -d / 2; house.add(back);
    const sidePts = [[-d / 2, 0], [d / 2, 0], [d / 2, h], [-d / 2, h]];
    for (const s of [-1, 1]) {
      const side = new THREE.Group(); side.position.x = s * w / 2; side.rotation.y = s * Math.PI / 2; house.add(side);
      side.add(card(sidePts, T, wallMat, edgeMat, [win(0, 1.05, .5, .46).reverse()])); frame(side, 0, 1.05, .5, .46);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - .1, d - .1), paper('#c9a77c')); floor.rotation.x = -Math.PI / 2; floor.position.y = .01; floor.receiveShadow = true; house.add(floor);
    // the roof: two sheets folded over the ridge, with an overhang
    const slope = Math.hypot(w / 2 + .18, .75 + .1);
    for (const s of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(slope, .07, d + .4), [edgeMat, edgeMat, roofMat, roofMat, edgeMat, edgeMat]);
      r.position.set(s * (w / 4 + .04), h + .75 / 2 + .02, 0); r.rotation.z = -s * Math.atan2(.75 + .1, w / 2 + .18); r.castShadow = r.receiveShadow = true; house.add(r);
      // scalloped tiles: strips of slightly darker card along the roof
      for (let i = 0; i < 3; i++) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(.03, .02, d + .38), paper('#437e7b'));
        strip.position.set(s * (w / 4 + .04) + s * (-.35 + i * .35) * Math.cos(Math.atan2(.85, w / 2 + .18)), h + .75 / 2 + .06 - (i - 1) * .35 * Math.sin(Math.atan2(.85, w / 2 + .18)), 0);
        strip.rotation.z = r.rotation.z; house.add(strip);
      }
    }
    const chim = new THREE.Mesh(new THREE.BoxGeometry(.3, .6, .3), [edgeMat, edgeMat, paper('#b9675a'), paper('#b9675a'), paper('#c9776a'), paper('#c9776a')]);
    chim.position.set(.6, h + .75, -.3); chim.castShadow = true; house.add(chim);
    // flower boxes under the front windows, with paper flowers
    for (const cx of [-.78, .78]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(.6, .14, .14), [edgeMat, edgeMat, paper('#7a5a3e'), edgeMat, paper('#8d6a48'), edgeMat]);
      box.position.set(cx, .72, d / 2 + .1); box.castShadow = true; house.add(box);
      for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.065, 10), paper(['#e98f8f', '#f2efe6', '#f2c65c', '#b9a3e0'][(i + (cx > 0 ? 2 : 0)) % 4])); f.position.set(cx - .22 + i * .15, .86 + (i % 2) * .04, d / 2 + .13); house.add(f); }
    }
    // curtains: two little triangles of patterned paper behind each front window
    const curtain = paper('#f3e3c8', { side: THREE.DoubleSide });
    for (const cx of [-.78, .78]) for (const sd of [-1, 1]) {
      const c = card([[0, 0], [sd * .2, 0], [0, -.42]], .01, curtain); c.position.set(cx - sd * .21, 1.27, d / 2 - T / 2 - .03); house.add(c);
    }
    // a little doorstep and a flower box
    const step = slab([[-.4, d / 2], [.4, d / 2], [.4, d / 2 + .28], [-.4, d / 2 + .28]], .08, .08, paper('#d9c6a2'), edgeMat); house.add(step);
  }
  const step0 = [x, z + HOUSE.d / 2 + .26], [sx, sz] = S.at(step0);   // the doorstep
  const toggle = doorName ? () => S.walkThen(sx, sz, () => S.through(doorName), .6) : () => { doorTarget = doorTarget ? 0 : 1; lightOn = !!doorTarget; S.sfx.door(doorTarget); };
  if (doorName) S.door(doorName, [x - .3, z + HOUSE.d / 2 + .12, x + .3, z + HOUSE.d / 2 + .4], [x, z + HOUSE.d / 2 + .85], [0, -1]);
  S.tap(house, toggle);
  S.wall(x, z, HOUSE.w / 2 + .15, HOUSE.d / 2 + .12);
  return { ...HOUSE, toggle, get open() { return doorTarget; },
    step({ dt, eve }) {
      if (doorName) { const near = Math.hypot(S.girl.x - sx, S.girl.z - sz) < 1.25 ? 1 : 0; if (near !== doorTarget) { doorTarget = near; S.sfx.door(near); } lightOn = eve > .4 || !!doorTarget; }
      doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 6); door.rotation.y = -doorOpen * 1.7;
      inLight.intensity = lerp(inLight.intensity, (lightOn ? 1 : 0) * lerp(1.6, 2.6, eve), Math.min(1, dt * 5));
      paneMat.emissiveIntensity = lerp(.08, .3, eve) + inLight.intensity / 2.2;
    } };
}

/** a thorny cut-out: a lumpy blob with spikes all round */
function thorny(r, seed, col, spikes = 13) {
  const R = rnd(seed), pts = []; for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * 6.283, rr = r * (i % 2 ? .62 + R() * .12 : 1 + R() * .18); pts.push([Math.cos(a) * rr * 1.15, r * .95 + Math.sin(a) * rr]); }
  return card(pts, .03, paper(col, { side: THREE.DoubleSide }));
}
/** Brambles that shut a bridge: a dry, thorny tangle right across it. They are opened with water: a tap while she carries
 *  a full watering can, she walks up and pours, and they turn green, bud, and bloom into roses that curl aside for good.
 *  Without water a tap only shows what is wanted: a little card of the can pops up above them. Nothing is cut (Oscar: no
 *  sword). `can` is the farm's can (farm.js: holding, full, pourThen, hint); the bridge runs east and west, `span` wide */
export function bramble(S, x, y, z, span, can, wishFor = THINGS.gieter, wishFrame = 1) {   // (`can`: whatever makes them bloom, with holding(), full(), pourThen(done), hint(); `wishFor`: the card they show when they want it)
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const clump = (parent, cz, r, seed, cols, roses) => { const c = new THREE.Group(); c.position.z = cz; parent.add(c);
    [0, 1.05, 2.1].forEach((ry, k) => { const t = thorny(r * (1 - k * .08), seed + k, cols[k % cols.length]); t.rotation.y = ry; c.add(t); });
    for (let k = 0; k < roses; k++) { const a = k * 2.4 + seed, rose = new THREE.Group(); rose.position.set(Math.cos(a) * r * .55, r * (.7 + .5 * Math.sin(k * 1.7 + seed)), .08 + Math.sin(a) * r * .5); [.11, .075, .04].forEach((rr, q) => { const d = disc(rr, ['#d9706c', '#e98f8f', '#f8dde4'][q]); d.position.z = q * .012; rose.add(d); }); c.add(rose); } };
  const stage = [0, 1, 2].map(() => { const sg = new THREE.Group(); sg.userData.live = true; g.add(sg); return sg; });
  for (const [cz, r, sd] of [[-span * .32, .62, 1], [0, .72, 5], [span * .32, .6, 9]]) { clump(stage[0], cz, r, sd, ['#6b5a4a', '#7d6a55', '#5c4d40'], 0); clump(stage[1], cz, r, sd, ['#6f9057', '#86a466', '#7f9d5e'], 1); }
  clump(stage[2], -(span / 2 + .6), .6, 19, ['#6f9057', '#86a466', '#7f9d5e'], 5); clump(stage[2], span / 2 + .42, .32, 21, ['#6f9057', '#86a466', '#7f9d5e'], 3);   // curled aside: the big one behind the deck, a small one in front (it must not hide her)
  stage.forEach(sg => S.glue(sg));
  const wall = S.wall(x, z, .5, span / 2 + .15), [wx, wz] = S.at([x, z]), { girl, sfx } = S;
  const wish = S.figure('wens', wishFor); wish.g.visible = false; wish.x = wx; wish.z = wz + .1; wish.act = () => wish.setFrame(wishFrame);
  let at = 0, t = 0, show = 0, wob = 0; const set = n => { at = n; stage.forEach((sg, i) => { sg.visible = i === n; }); }; set(0);
  S.tap(g, () => {
    if (S.playing()) return;
    if (at === 2) { wob = 1; sfx.rustle(); S.confetti(wx, y + .8, wz, ['#e98f8f', '#f8dde4', '#d9706c'], 8, undefined, 1.8); return; }
    if (at === 1) return;
    if (can.holding() && can.full()) { const side = girl.x < wx ? -1 : 1; S.walkThen(wx + side * 1.05, wz, () => { if (at === 0 && can.pourThen(() => { set(1); t = 0; sfx.hop(); })) girl.face = -side; }, 1.2); return; }
    wob = 1; show = 2.4; wish.hopV = 2.2; sfx.rustle(); can.hint();   // dry and shut: it shakes, and shows what it wants
  });
  return { state: () => ({ stage: at, open: at === 2, wishing: show > 0 }), openGate() { set(2); wall[2] = 0; }, step({ dt, tick, stepped }) {
    if (at === 1) { t += dt; if (t > 1.0) { set(2); wall[2] = 0; sfx.chime(); S.confetti(wx, y + 1.0, wz, ['#e98f8f', '#f8dde4', '#d9706c', '#86a466'], 22, undefined, 2.6); } }   // green, a breath, and then roses, and the way is open
    if (show > 0) { show -= dt; wish.g.visible = show > 0; wish.floatY = wish.y = y + 1.75; }
    if (stepped) { if (wob > .03) { wob *= .78; g.rotation.x = Math.sin(tick * 2.2) * .07 * wob; } else g.rotation.x = 0; }
  } };
}
/** a dandelion clock: a tap (or a bump as she walks through) and its seeds drift off on the air; it is a bare stalk for a
 *  while, and then it is a clock again */
export function dandelion(S, x, y, z, seed = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const h = .38 + (seed % 5) * .04, stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, h, 4), paper('#7f9d5e')); stem.position.y = h / 2; stem.castShadow = true; g.add(stem);
  const leafs = card([[-.2, 0], [-.1, .07], [0, .02], [.1, .07], [.2, 0], [.1, -.03], [-.1, -.03]], .012, paper('#86a466')); leafs.rotation.x = -1.2; leafs.position.y = .03; g.add(leafs);
  const clock = new THREE.Group(); clock.userData.live = true; clock.position.y = h + .08; g.add(clock);
  { const pts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283, r = i % 2 ? .1 : .135; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } for (const ry of [0, 1.57]) { const c = card(pts, .012, paper('#fbf7ee', { side: THREE.DoubleSide })); c.rotation.y = ry; clock.add(c); } const core = disc(.05, '#efe6d4'); core.position.z = .012; clock.add(core); S.glue(clock); }
  const bud = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), paper('#c9d79a')); bud.position.y = h + .02; bud.visible = false; g.add(bud); bud.userData.live = true;
  const [wx, wz] = S.at([x, z]); let back = 0, blown = 0;
  const blow = () => { if (back > 0) return; back = 28 + (seed % 7) * 3; blown++; clock.visible = false; bud.visible = true; S.sfx.flutter(); S.confetti(wx, y + h + .1, wz, ['#fbf7ee', '#f6efe2', '#fffdf8'], 14, undefined, 1.1, true); };
  S.tap(g, blow);
  return { state: () => ({ blown, full: back <= 0 }), step({ dt }) { if (back > 0) { back -= dt; if (back <= 0) { clock.visible = true; bud.visible = false; } } else if (S.girl.walking && Math.hypot(S.girl.x - wx, S.girl.z - wz) < .3) blow(); } };
}

/** The fruit stall: a wooden counter under a striped awning, a basket of apples on it. A tap: she walks up and takes an
 *  apple. It is in her hands (one thing at a time), and whoever she taps next gets it, and munches */
export function stall(S, x, z, y) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const [wx, wz] = S.at([x, z]);
  const add = (w, h, d, col, px, py, pz, rx = 0) => { const m = m3(new THREE.BoxGeometry(w, h, d), col); m.position.set(px, py, pz); m.rotation.x = rx; g.add(m); return m; };
  add(1.5, .08, .7, '#d9a066', 0, .62, 0); add(1.4, .5, .05, '#c79a66', 0, .33, .3); for (const sx of [-.66, .66]) add(.07, .62, .6, '#b98a5a', sx, .31, 0);   // the counter
  for (const sx of [-.7, .7]) { add(.05, 1.75, .05, '#8d6a48', sx, .875, -.32); add(.05, 1.45, .05, '#8d6a48', sx, .725, .36); }                                 // four posts
  for (let i = 0; i < 6; i++) add(.26, .04, .98, i % 2 ? '#fbf5ea' : '#e98f8f', -.65 + i * .26, 1.62, .02, .3);                                                  // the awning, in stripes
  for (let i = 0; i < 6; i++) add(.26, .16, .03, i % 2 ? '#fbf5ea' : '#e98f8f', -.65 + i * .26, 1.42, .5);                                                       // and its hanging edge
  for (const [n, spec, px, pz] of [['kraamappel1', THINGS.appel, -.5, .05], ['kraamappel2', THINGS.appel, -.32, .1], ['kraampeer', THINGS.peer, -.14, .04]]) { const f = S.figure(n, spec); [f.x, f.z] = S.at([x + px, z + pz]); f.floatY = f.y = y + .66; f.thing = true; }   // fruit on the counter, cut from paper
  S.wall(x, z, .8, .42);
  const basket = S.figure('mand', THINGS.mand), apple = S.figure('appel', THINGS.appel), me = {}; basket.x = wx + .3; basket.z = wz + .1; basket.floatY = basket.y = y + .66; apple.g.visible = false;
  let held = false, taken = 0, given = 0;
  const down = () => { held = false; apple.g.visible = false; girl.poseName = null; };
  S.offer(who => { if (!held) return false; down(); S.hands.free(me); given++; who.hopV = 2.6; sfx.munch(); S.confetti(who.x, (who.y || 0) + .6, who.z, ['#e98f8f', '#f6efe2', '#d9706c'], 8, undefined, 1.6); return 'appel'; });
  const take = () => { if (S.playing() || held) { basket.hopV = 1.4; return; } S.walkThen(wx + .3, wz + 1.05, () => { if (held) return; girl.view = 'back'; S.hands.take(me, down); held = true; taken++; basket.hopV = 1.6; sfx.hop(); }, 1.2); };
  S.tap(g, take); basket.onTap = take;
  return { state: () => ({ held, taken, given }), step() {
    if (held) { apple.g.visible = !S.playing(); if (apple.g.visible) { girl.poseName = 'hold'; const h = S.hand(); apple.x = h.x + girl.face * .05; apple.z = h.z + .05; apple.floatY = apple.y = h.y - .07; } }
  } };
}

/* ---------------- the village pond, made to read as water ---------------- */
/** Dresses a pond (Oscar: "now its just like a blue patch and its not clear its water at all"): a deeper blue in the
 *  middle, a ring of round pebbles at the edge, a little group of lily pads with one pink flower, and white paper ripples
 *  that slowly spread and fade. `pts`: the pond's outline in the set's measure; (cx, cz) its middle; y its water. Gives
 *  back step(time) for the ripples */
export function pondDress(S, pts, cx, cz, y, seed = 7) {
  let s = seed; const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const g = new THREE.Group(); S.root.add(g);
  // the deeper middle: a second, darker sheet
  const inner = pts.map(([x, z]) => [cx + (x - cx) * .6, cz + (z - cz) * .6]);
  g.add(slab(inner, y + .03, .008, paper('#5f93ab'), paper('#5f93ab')));
  // pebbles all round the edge, a little outside it
  const PEB = new THREE.SphereGeometry(.12, 9, 6), COLS = ['#cfc8ba', '#bdb5a6', '#ddd6c8', '#aaa395', '#c6bfb0'];
  const n = pts.length; let per = 0; for (let i = 0; i < n; i++) { const [a, b] = [pts[i], pts[(i + 1) % n]]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  for (let d = 0, i = 0, run = 0; d < per; d += .22 + R() * .09) {
    while (i < n) { const [a, b] = [pts[i], pts[(i + 1) % n]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (run + L >= d) break; run += L; i++; }
    if (i >= n) break;
    const [a, b] = [pts[i], pts[(i + 1) % n]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, k = (d - run) / L, x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k;
    const ox = x - cx, oz = z - cz, ol = Math.hypot(ox, oz) || 1, out = .04 + R() * .07;
    const m = new THREE.Mesh(PEB, paper(COLS[Math.floor(R() * COLS.length)])); m.castShadow = m.receiveShadow = true;
    m.position.set(x + ox / ol * out, y + .02, z + oz / ol * out); m.scale.set(.85 + R() * .55, .45 + R() * .3, .7 + R() * .4); m.rotation.y = R() * 6.3; g.add(m);
  }
  // lily pads by the west edge: round, with a notch; one pink flower
  const pad = (r, notch) => { const p = []; for (let i = 0; i <= 22; i++) { const a = notch + .35 + i / 22 * (Math.PI * 2 - .7); p.push([Math.cos(a) * r, Math.sin(a) * r]); } p.push([0, 0]); return p; };
  const lx = cx - (Math.max(...pts.map(p => cx - p[0])) - .65), lz = cz - .15;
  for (const [dx, dz, r] of [[0, 0, .26], [.38, .22, .2], [.12, -.36, .17], [-.16, .34, .14]]) { const c = card(pad(r, R() * 6.3), .01, paper('#86ad6e')); c.rotation.x = -Math.PI / 2; c.position.set(lx + dx, y + .045, lz + dz); g.add(c); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, pt = card([[-.035, 0], [0, .11], [.035, 0]], .01, paper(i % 2 ? '#f4a6c4' : '#f8c6d8', { side: THREE.DoubleSide })); pt.position.set(lx + Math.cos(a) * .03, y + .06, lz + Math.sin(a) * .03); pt.rotation.set(-.5, -a + Math.PI / 2, 0); g.add(pt); }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 5), paper('#f2c65c')); heart.position.set(lx, y + .08, lz); g.add(heart);
  // ripples: thin white rings on the water that spread slowly and fade, then start again somewhere else
  const ring = (r, w) => { const o = [], h = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; o.push([Math.cos(a) * r, Math.sin(a) * r]); h.unshift([Math.cos(a) * (r - w), Math.sin(a) * (r - w)]); } return card(o, .004, null, null, [h]); };
  const spots = () => { const a = R() * 6.3, k = .15 + R() * .45, far = Math.max(...pts.map(p => Math.hypot(p[0] - cx, p[1] - cz))) * .62; return [cx + Math.cos(a) * far * k, cz + Math.sin(a) * far * k * .8]; };
  const ripples = [0, 1, 2, 3].map(i => { const m = ring(.32, .028); m.material = new THREE.MeshBasicMaterial({ color: '#f4f8f6', transparent: true, opacity: 0, depthWrite: false }); m.rotation.x = -Math.PI / 2; m.userData.live = true; m.renderOrder = 2; g.add(m); return { m, off: i / 4, at: spots(), last: 0 }; });
  return { step(time) {
    for (const r of ripples) { const p = (time * .16 + r.off) % 1; if (p < r.last) r.at = spots(); r.last = p;
      r.m.position.set(r.at[0], y + .05, r.at[1]); r.m.scale.setScalar(.35 + p * 1.3); r.m.material.opacity = .6 * Math.min(1, p * 6) * (1 - p); }
  } };
}

/* ---------------- the witch's house ---------------- */
/** The witch's own little house, in a corner of the forest (Oscar: "she needs her own little house"): lilac walls under a
 *  tall crooked roof of dark plum paper, a round-topped green door, a round window that glows in the evening, a crooked
 *  chimney that puffs little paper clouds, and pumpkins by the door (they grow nowhere else). (x, z): the middle of the
 *  house; its front looks south, to the camera. Gives back step({ dt, eve }) */
export function witchHouse(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const add = (m, px, py, pz, to = g) => { m.position.set(px, py, pz); to.add(m); return m; };
  const W = 1.7, D = 1.4, H = 1.25;
  add(m3(new THREE.BoxGeometry(W, H, D), '#b9a3d6'), 0, H / 2, 0);                                               // the walls
  add(m3(new THREE.BoxGeometry(W + .12, .12, D + .12), '#8f7aa8'), 0, .06, 0);                                    // a sill of darker paper at the foot
  { const roof = m3(new THREE.ConeGeometry(1.35, 1.75, 4, 1), '#5f4778'); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, .92); const tilt = new THREE.Group(); tilt.position.set(0, H, 0); tilt.rotation.z = -.07; g.add(tilt); add(roof, .04, .86, 0, tilt);
    const tip = m3(new THREE.ConeGeometry(.12, .5, 6), '#5f4778'); tip.rotation.z = -.55; add(tip, .17, 1.8, 0, tilt);                     // its tip bends over
    const star = card([[0, .1], [.03, .03], [.1, .03], [.045, -.015], [.065, -.09], [0, -.045], [-.065, -.09], [-.045, -.015], [-.1, .03], [-.03, .03]], .015, paper('#f2c65c')); star.position.set(.33, 2.0, .05); star.rotation.z = -.4; tilt.add(star); }
  // the door: rounded at the top, green, with a little gold knob, on two steps
  { const arch = [[-.27, 0], [.27, 0], [.27, .5]]; for (let i = 1; i < 12; i++) arch.push([Math.cos(i / 12 * Math.PI) * .27, .5 + Math.sin(i / 12 * Math.PI) * .27]); arch.push([-.27, .5]);
    add(card(arch, .04, paper('#5f8f6e')), -.25, .12, D / 2 + .02); add(m3(new THREE.SphereGeometry(.035, 8, 6), '#f2c65c'), -.08, .48, D / 2 + .06);
    add(m3(new THREE.BoxGeometry(.7, .1, .3), '#a39e94'), -.25, .05, D / 2 + .15); }
  // the round window: warm light in the evening
  const glow = new THREE.MeshStandardMaterial({ color: '#3d3452', emissive: '#ffcf86', emissiveIntensity: 0, roughness: .8 });
  { const win = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), glow); win.userData.live = true; add(win, .45, .78, D / 2 + .025);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.21, .035, 6, 20), paper('#7a5a3e')); add(ring, .45, .78, D / 2 + .03);
    add(m3(new THREE.BoxGeometry(.02, .4, .02), '#7a5a3e'), .45, .78, D / 2 + .04); add(m3(new THREE.BoxGeometry(.4, .02, .02), '#7a5a3e'), .45, .78, D / 2 + .04); }
  // the crooked chimney, and its puffs
  { const ch = m3(new THREE.BoxGeometry(.24, .7, .24), '#8f7aa8'); ch.rotation.z = .12; add(ch, .5, H + .75, -.25); }
  const puffs = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 7), paper('#efe9f2')); m.userData.live = true; m.castShadow = false; g.add(m); return { m, off: i / 3 }; });
  // pumpkins by the door
  for (const [px, pz, s] of [[.95, D / 2 + .35, 1], [1.25, D / 2 + .05, .75], [.62, D / 2 + .5, .6]]) { const p = m3(new THREE.SphereGeometry(.2 * s, 12, 8), '#e8893a'); p.scale.y = .72; add(p, px, .14 * s, pz); add(m3(new THREE.CylinderGeometry(.025, .03, .1, 5), '#6f9057'), px, .3 * s, pz); }
  S.solid({ x, z, r: 1.05 }); S.solid({ x: x + .95, z: z + D / 2 + .35, r: .25 }); S.solid({ x: x + 1.25, z: z + D / 2 + .05, r: .2 });
  let t = 0;
  return { g, step({ dt, eve = 0 }) {
    t += dt; glow.emissiveIntensity += ((eve > .5 ? 1.5 : .05) - glow.emissiveIntensity) * Math.min(1, dt * 3);
    for (const p of puffs) { const k = (t * .3 + p.off) % 1; p.m.position.set(.55 + k * .35 + Math.sin(k * 6) * .06, H + 1.15 + k * 1.1, -.25); p.m.scale.setScalar(.5 + k * .9); p.m.visible = k < .92; }
  } };
}

/* ---------------- the clothes shop on the village square ---------------- */
/** (Oscar: "the starting area should have the shop where we can buy outfits") A wooden rack with two rails and a garland of
 *  little flags; on it hang the eleven things to wear, each a paper card with its price under it in coins (no numbers).
 *  A tap on one: she walks over; if she has the coins they fly from her row to the card, and she has it on at once.
 *  Hers already: a tap puts it on, or takes it off. Too few coins: the card gives a little wobble. A pink ribbon on a
 *  card says it is hers; a heart says she has it on. (x, z): the rack's middle, its front to the south */
export const PRICES = { strik: 2, krans: 3, hoed: 3, kroon: 6, ketting: 3, knuffel: 3, ballon: 2, jurkgeel: 4, jurkblauw: 4, jurkregenboog: 8, vleugels: 6 };
export function shop(S, x, z, y = 0) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const RW = 3.6, add = (w, h, d, col, px, py, pz) => { const m = m3(new THREE.BoxGeometry(w, h, d), col); m.position.set(px, py, pz); g.add(m); return m; };
  for (const s of [-1, 1]) { add(.09, 1.95, .09, '#a97a4e', s * RW / 2, .975, 0); add(.5, .06, .3, '#8d6a48', s * RW / 2, .03, 0); }
  const RAILS = [1.78, 1.08]; for (const ry of RAILS) { const r = m3(new THREE.CylinderGeometry(.025, .025, RW, 8), '#c79a66'); r.rotation.z = Math.PI / 2; r.position.set(0, ry, 0); g.add(r); }
  for (let i = 0; i < 13; i++) { const fl = card([[-.07, 0], [.07, 0], [0, -.13]], .01, paper(['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'][i % 4], { side: THREE.DoubleSide })); fl.position.set(-RW / 2 + .15 + i * (RW - .3) / 12, 1.98 - Math.sin(i / 12 * Math.PI) * .12, .02); g.add(fl); }
  S.wall(x, z, RW / 2 + .1, .2);
  const ROWS = [['strik', 'krans', 'hoed', 'kroon', 'ketting', 'knuffel', 'ballon'], ['jurkgeel', 'jurkblauw', 'jurkregenboog', 'vleugels']];
  const cards = [];
  ROWS.forEach((row, ri) => row.forEach((id, i) => {
    const n = PRICES[id], spec = { w: 120, h: 160, frames: 3, size: .6, thing: true, draw(c, fr) {
      drawWearIcon(c, id);
      if (fr === 0) for (let k = 0; k < n; k++) { const cx = 60 + (k - (n - 1) / 2) * 13, cy = 140; piece(c, '#E0A93A', E(cx, cy, 6.5, 6.5), .3); ink(c, '#F2C65C', E(cx, cy, 4.4, 4.4)); }
      else if (fr === 1) { piece(c, '#F4A6C4', U(E(48, 140, 11, 7, .4), E(72, 140, 11, 7, -.4)), .4); piece(c, '#E98F8F', E(60, 140, 5, 5)); }
      else piece(c, '#E98F8F', S2([[60, 152], [44, 136], [46, 126], [54, 124], [60, 131], [66, 124], [74, 126], [76, 136]]), .5);
    } };
    const f = S.figure('kleren-' + id, spec), px = -RW / 2 + .4 + i * (RW - .8) / Math.max(1, row.length - 1), [wx, wz] = S.at([x + px, z + .06]);
    f.x = wx; f.z = wz; f.floatY = f.y = y + RAILS[ri] - f.H - .02;
    const hook = m3(new THREE.TorusGeometry(.05, .008, 4, 10, Math.PI), '#7a5a3e'); hook.position.set(px, RAILS[ri] - .015, .03); g.add(hook);
    f.act = () => f.setFrame(S.closet.wearing(id) ? 2 : S.closet.owns(id) ? 1 : 0);
    f.onTap = () => { if (S.playing()) return; S.walkThen(wx, wz + .95, () => {
      girl.view = 'back';
      if (S.closet.owns(id)) { S.closet.put(id); f.hopV = 1.6; return; }
      if (!S.coins.spend(n, f.x, f.y + f.H * .6, f.z, () => { S.closet.buy(id); f.hopV = 2; })) { f.hopV = 1.4; f.wob = 1; sfx.peep(); }
    }, 1.0); };
    cards.push({ id, f });
  }));
  return { state: () => ({ coins: S.coins.have(), own: cards.filter(c => S.closet.owns(c.id)).map(c => c.id), wearing: cards.filter(c => S.closet.wearing(c.id)).map(c => c.id) }), places: { front: S.at([x, z + 1.1]) } };
}
