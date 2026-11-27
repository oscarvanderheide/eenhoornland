// The farm: a loop of small real actions, each a tap away.
//   the can      a tap and she walks over and picks it up (she carries it in front of her); a tap on it again puts it down
//   the well     with the can: the bucket goes down and comes up full, and the can is full. Good for two rows
//   the bed      one patch of dug brown soil with a raised ridge for each row; a tap anywhere on it means the row nearest
//   the rows     four kinds of paper vegetables, a row each: carrots, tomatoes, cabbages, pumpkins (veg.js). Every plant is
//                its own: with a full can she waters one seed, it sprouts and grows, in two steps you can watch
//   grown        a tap pulls it out: it pops up into her hand, and whoever she taps next gets it (the pig, her unicorn, ...)
//   put down     a tap on her while she holds it: it lies on the ground, and the pig trots out of its mud and eats it up
//   the spot     empty, it is a seed again after a while
// When something is missing (no can, an empty can) the thing she needs gives a little hop: there is no wrong.
// Also here: the scarecrow, with three birds that fly up when she rocks it and settle again after.
import { THREE, paper, card, slab, blob, PAPER } from './kit.js';
import { THINGS } from './things.js';
import { VEG, ROWS } from './veg.js';
import { cutout } from './cut.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const box = (w, h, d, col) => mesh(new THREE.BoxGeometry(w, h, d), col), cyl = (r0, r1, h, col, n = 12) => mesh(new THREE.CylinderGeometry(r0, r1, h, n), col);
const LEAF = [[-.1, 0], [-.07, .16], [-.02, .05], [.02, .22], [.06, .06], [.1, .15], [.1, 0]];
const MOUND = new THREE.SphereGeometry(.12, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), SEED = new THREE.SphereGeometry(.03, 8, 5);

let wellTex = null;
function wellWater() {
  if (wellTex) return wellTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#9fd3dc'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#7fbcc8'; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.arc(128, 128, 112, 0, Math.PI * 2, true); g.fill();
  g.strokeStyle = '#f6fbfb'; g.lineWidth = 7; g.lineCap = 'round';
  for (const [y, x0, x1] of [[86, 60, 170], [128, 40, 200], [170, 70, 185]]) { g.beginPath(); for (let x = x0; x <= x1; x += 4) g.lineTo(x, y + Math.sin((x - x0) / 16) * 6); g.stroke(); }
  wellTex = new THREE.CanvasTexture(c); wellTex.colorSpace = THREE.SRGBColorSpace; return wellTex;
}
/** the well: a ring of pale stone, two posts, a little roof, and a bucket on a rope that goes down and comes up */
export function well(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const ring = cyl(.62, .66, .52, '#c5bfd0', 18); ring.position.y = .26; g.add(ring);
  // the water down in it: cut paper, pale blue with a few white wavy lines, as the pond's (Oscar: "the water in the well should be paper style")
  const water = new THREE.Mesh(new THREE.CircleGeometry(.52, 28), new THREE.MeshStandardMaterial({ map: wellWater(), roughness: .95 })); water.rotation.x = -Math.PI / 2; water.position.y = .5; water.receiveShadow = true; g.add(water);
  for (const s of [-1, 1]) { const p = box(.09, 1.5, .09, '#9a6e47'); p.position.set(s * .6, .75, 0); g.add(p); }
  for (const s of [-1, 1]) { const r = box(.86, .05, .9, '#d9706c'); r.position.set(s * .36, 1.68, 0); r.rotation.z = -s * .62; g.add(r); }
  const bar = cyl(.035, .035, 1.3, '#7a5a3e', 6); bar.rotation.z = Math.PI / 2; bar.position.y = 1.4; g.add(bar);
  const bucket = new THREE.Group(); bucket.userData.live = true; g.add(bucket);
  const rope = cyl(.012, .012, 1, '#efe8dc', 4); rope.castShadow = false; bucket.add(rope);
  const pail = cyl(.15, .12, .2, '#8d6a48', 10); bucket.add(pail);
  S.solid({ x, z, r: .68 });
  let dip = 0;   // 1 while the bucket is on its way down and up
  const place = () => { const d = dip > 0 ? Math.sin(Math.PI * (1 - dip)) : 0, top = 1.38, py = 1.0 - d * .62; pail.position.y = py; rope.scale.y = top - py; rope.position.y = (top + py) / 2; };
  place();
  return { g, at: S.at([x, z + 1.0]), draw() { if (dip > 0) return false; dip = 1; return true; }, busy: () => dip > 0,
    step(dt) { if (dip > 0) { const was = dip; dip = Math.max(0, dip - dt / .95); if (was > .5 && dip <= .5) { S.sfx.splash(); S.confetti(...S.at([x, z]).flatMap((v, i) => i ? [y + .6, v] : [v]), ['#8fc3cc', '#f6efe2', '#6fb0b8'], 8, undefined, 2); } place(); } } };
}

export function farm(S, { can: canAt, well: theWell, rows: rowsAt, y = 0, pig = null }) {
  const { girl, sfx } = S;
  /* ---------------- the watering can: a paper card like everything she holds (things.js: empty, full, pouring) ---------------- */
  const can = S.figure('gieter', THINGS.gieter);
  const C = { at: S.at(canAt), held: false, full: 0, hop: 0 };
  can.onTap = () => { if (S.playing()) return; const down = () => { C.held = false; girl.poseName = null; C.at = [girl.x + girl.face * .5, girl.z + .15]; }; if (C.held) { down(); S.hands.free(C); sfx.thud(); } else S.walkThen(C.at[0] - .35, C.at[1] + .1, () => { S.hands.take(C, down); C.held = true; sfx.hop(); }, .9); };
  can.act = () => can.setFrame(pour ? 2 : C.full ? 1 : 0);

  /* ---------------- the vegetables: a row of each kind, every plant on its own (Oscar: "growing the vegetables should be one at
     a time not entire row. and if we grow one, we can pick it") ---------------- */
  const cardMats = {}, cardOf = kind => {   // the grown plant: its paper drawing standing in the soil
    const sp = VEG[kind].ground; if (!cardMats[kind]) { const t = new THREE.CanvasTexture(cutout(sp.w, sp.h, sp.draw, PAPER, 1.5)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      cardMats[kind] = [new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, roughness: .95 }), new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5 })]; }
    const [mat, depth] = cardMats[kind], h = sp.size, geo = new THREE.PlaneGeometry(h * sp.w / sp.h, h); geo.translate(0, h / 2 - .03, 0);
    const m = new THREE.Mesh(geo, mat); m.customDepthMaterial = depth; m.castShadow = true; return m; };
  const XS = [-.8, -.4, 0, .4, .8], spots = [];
  const rows = rowsAt.map(([rx, rz], n) => {
    const kind = ROWS[n % ROWS.length], g = new THREE.Group(); g.position.set(rx, y, rz); S.root.add(g);
    const row = { g, kind, n, mid: S.at([rx, rz]), spots: [] };
    for (const px of XS) {
      const sg = new THREE.Group(); sg.userData.live = true; sg.position.set(px, 0, 0); g.add(sg);
      const mound = mesh(MOUND, '#8a6f50'); mound.scale.set(1, .45, .8); mound.position.y = .04; sg.add(mound);
      const seed = mesh(SEED, '#efe2c4'); seed.position.set(.02, .095, .01); sg.add(seed);
      const sprout = new THREE.Group(); sg.add(sprout); { const a = card(LEAF, .02, paper('#86a466')); a.position.y = .06; a.scale.setScalar(.75); sprout.add(a); const b = card(LEAF, .02, paper('#9bb877')); b.position.set(.04, .06, .03); b.scale.setScalar(.65); b.rotation.y = .9; sprout.add(b); }
      const grown = cardOf(kind); grown.position.z = .02; sg.add(grown);
      const [wx, wz] = S.at([rx + px, rz]);
      const sp = { row, kind, sg, seed, sprout, grown, x: wx, z: wz, stage: 0, grow: 0, back: 0 };
      sp.show = () => { seed.visible = sp.stage === 0; sprout.visible = sp.stage === 1; grown.visible = sp.stage === 2; mound.visible = sp.stage !== 2 || kind === 'wortel'; };
      sp.show(); S.tap(sg, () => tapSpot(sp)); row.spots.push(sp); spots.push(sp);
    }
    // its ridge of heaped soil, darker than the bed
    const ridge = slab(blob(rx, rz, 1.15, .2, 500 + n, 20, .04), y + .05, .03, paper('#957a5a'), paper('#7f6649')); S.root.add(ridge); S.tap(ridge, hit => tapNear(hit));
    return row;
  });
  const tapNear = hit => { const p = hit && hit.point ? [hit.point.x, hit.point.z] : [girl.x, girl.z]; tapSpot(spots.slice().sort((a, b) => Math.hypot(a.x - p[0], a.z - p[1]) - Math.hypot(b.x - p[0], b.z - p[1]))[0]); };
  // the bed: one patch of dug soil under all the rows, a little wider than they are; a tap on it means the nearest plant
  { const zs = rowsAt.map(r => r[1]), xs0 = rowsAt.map(r => r[0]), cx = (Math.min(...xs0) + Math.max(...xs0)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const bed = slab(blob(cx, cz, (Math.max(...xs0) - Math.min(...xs0)) / 2 + 1.55, (Math.max(...zs) - Math.min(...zs)) / 2 + .75, 520, 36, .05), y + .02, .02, paper('#a98f6f'), paper('#8d7557')); S.root.add(bed);
    S.tap(bed, hit => tapNear(hit)); }

  /* ---------------- what she pulls: in her hand, given to somebody, or put down (and then the pig comes for it) ---------------- */
  const inHand = Object.fromEntries(ROWS.map(k => { const f = S.figure('groente-' + k, VEG[k].held); f.thing = true; f.g.visible = false; return [k, f]; }));
  const pool = Object.fromEntries(ROWS.map(k => [k, [0, 1].map(i => { const f = S.figure('val-' + k + i, VEG[k].held); f.thing = true; f.g.visible = false; return f; })]));
  const dropped = [];   // { f, kind, x, z, eaten }
  let pour = null, flying = null, pulled = 0, watered = 0, held = null, fed = 0, eatenByPig = 0;
  const me = {}, hideHeld = () => { for (const f of Object.values(inHand)) f.g.visible = false; };
  const putDown = () => {   // she lets go of it: it lies on the ground at her feet
    const kind = held; held = null; hideHeld(); girl.poseName = null; if (!kind) return;
    const f = pool[kind].find(q => !dropped.some(d => d.f === q)) || dropped.find(d => d.kind === kind && !d.eating).f; const old = dropped.findIndex(d => d.f === f); if (old >= 0) dropped.splice(old, 1);
    const x = girl.x + girl.face * .45, z = girl.z + .2; f.x = x; f.z = z; f.floatY = f.y = (S.heightAt(x, z) ?? y) + .02; f.lean = kind === 'wortel' ? girl.face * 1.3 : 0; f.g.visible = true; sfx.thud();
    const d = { f, kind, x, z, eating: false }; dropped.push(d);
    f.onTap = () => { if (d.eating || held || S.playing()) return; S.walkThen(d.x - girl.face * .3, d.z + .05, () => { if (d.eating) return; const i = dropped.indexOf(d); if (i < 0) return; dropped.splice(i, 1); f.g.visible = false; take(d.kind); sfx.hop(); }, .9); };
  };
  const take = kind => { if (held) { S.hands.free(me); putDown(); } S.hands.take(me, putDown); held = kind; };
  S.offer(who => { if (!held) return false; const kind = held; held = null; hideHeld(); girl.poseName = null; S.hands.free(me); fed++; S.coins.reward('wortel', who.x, (who.y || 0) + 1, who.z); who.hopV = 2.6; sfx.munch(); S.confetti(who.x, (who.y || 0) + .6, who.z, ['#f4a6c4', '#f8dde4', '#e8893a'], 8, undefined, 2); return kind; });
  function tapSpot(sp) {
    if (S.playing() || pour || !sp) return;
    if (sp.stage === 2) { S.walkThen(sp.x, sp.z + .55, () => pull(sp), 1.1); return; }
    if (sp.stage === 1 || sp.grow) { sp.sg.scale.y = 1.3; return; }
    if (sp.stage !== 0) return;
    if (!C.held || !C.full) { can.hopV = 2.6; sfx.peep(); return; }   // no can, or an empty one: the can gives a hop (she needs the well)
    S.walkThen(sp.x, sp.z + .55, () => { pour = { t: 0, at: sp, done: () => { sp.grow = .01; watered++; } }; C.full--; sfx.swish(3); }, 1.1);
  }
  function pull(sp) {
    if (sp.stage !== 2 || flying) return; sp.stage = -1; sp.back = 30; sp.show(); pulled++; sfx.boing();
    if (held) { S.hands.free(me); putDown(); }
    S.hands.take(me, putDown); flying = { from: new THREE.Vector3(sp.x, y + .15, sp.z), kind: sp.kind, t: 0 }; inHand[sp.kind].g.visible = true;   // up it pops, into her hand
  }
  S.tap(theWell.g, () => { if (S.playing() || theWell.busy()) return; S.walkThen(theWell.at[0], theWell.at[1], () => { if (theWell.draw() && C.held) setTimeout(() => { C.full = 3; sfx.chime(); }, 600); }, 1.2); });

  return {
    state: () => ({ carrot: !!held, holding: held, fed, held: C.held, full: C.full, rows: rows.map(r => ({ kind: r.kind, stages: r.spots.map(sp => sp.stage) })), pulled, watered, can: C.at,
      dropped: dropped.map(d => ({ kind: d.kind, at: [d.x, d.z], eating: d.eating })), eatenByPig, spots: spots.map(sp => ({ kind: sp.kind, stage: sp.stage, at: [sp.x, sp.z] })) }),
    places: { can: [C.at[0] - .35, C.at[1] + .1], well: theWell.at, row: [spots[0].x, spots[0].z + .55] },
    // for other things that want water (the fountain fills the can too; the brambles on the bridge are watered open)
    holding: () => C.held, full: () => C.full, hint() { can.hopV = 2.6; sfx.peep(); },
    fill() { if (!C.held) return false; C.full = 3; sfx.chime(); return true; },
    pourThen(done) { if (!C.held || !C.full || pour) return false; pour = { t: 0, done }; C.full--; sfx.swish(3); return true; },
    step({ dt, stepped }) {
      theWell.step(dt);
      // the can: in her hands, or where she left it
      if (C.held && !S.playing()) { girl.poseName = 'hold'; const h = S.hand(); can.x = h.x + girl.face * .08; can.z = h.z + .04; can.floatY = can.y = h.y - .2; can.face = girl.face; }
      else if (C.held) { can.x = girl.x + .5; can.z = girl.z + .3; can.floatY = undefined; can.face = 1; }   // she is on a toy: the can waits beside it
      else { can.x = C.at[0]; can.z = C.at[1]; can.floatY = undefined; can.face = 1; }
      if (pour) { pour.t += dt; if (stepped) S.confetti(can.x + girl.face * .3, can.y + .25, can.z, ['#8fd0e0', '#f6efe2'], 2, undefined, .4); if (pour.t > 1.0) { const done = pour.done; pour = null; done(); } }
      for (const sp of spots) {
        sp.sg.scale.y += (1 - sp.sg.scale.y) * Math.min(1, dt * 8);
        if (sp.grow) { sp.grow += dt; const st = sp.grow > 1.7 ? 2 : sp.grow > .7 ? 1 : 0; if (st !== sp.stage) { sp.stage = st; sp.show(); sp.sg.scale.y = .4; sfx.hop(); if (st === 2) S.confetti(sp.x, y + .5, sp.z, ['#9ed9a0', '#f2c65c', '#fbf5ea'], 8, S.starGeo, 1.6); } if (sp.grow > 1.7) sp.grow = 0; }
        if (sp.back > 0) { sp.back -= dt; if (sp.back <= 0) { sp.stage = 0; sp.show(); } }
      }
      if (flying) {   // a pulled vegetable: up out of the soil in a little arc, and into her hand
        const f = inHand[flying.kind]; flying.t += dt; const k = Math.min(1, flying.t / .45), h = S.hand(); girl.poseName = 'hold';
        f.x = flying.from.x + (h.x - flying.from.x) * k; f.z = flying.from.z + (h.z + .05 - flying.from.z) * k; f.floatY = f.y = flying.from.y + (h.y - .1 - flying.from.y) * k + Math.sin(k * Math.PI) * .7; f.lean = (1 - k) * 6;
        if (k >= 1) { held = flying.kind; flying = null; f.lean = 0; }
      }
      if (held) { const f = inHand[held]; f.g.visible = !S.playing(); if (f.g.visible) { girl.poseName = 'hold'; const h = S.hand(); f.x = h.x + girl.face * .06; f.z = h.z + .05; f.floatY = f.y = h.y - .1; } }
      // the pig smells it: out of its mud it trots, eats it up, and back it goes
      if (pig && dropped.length && !pig.busy()) { const d = dropped[0]; d.eating = true; pig.eat(d.x, d.z, () => { d.f.g.visible = false; const i = dropped.indexOf(d); if (i >= 0) dropped.splice(i, 1); eatenByPig++; S.coins.reward('varken-eet', d.x, y + 1, d.z); }); }
    },
  };
}

/** the scarecrow: a paper card on its post. A tap and it rocks from side to side, and its three birds (paper too) fly up
 *  and circle, then settle on its arms again (Oscar: they should not go away when she comes close, only when she plays with it) */
export function scarecrow(S, x, y, z) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]), f = S.figure('vogelverschrikker', THINGS.vogelverschrikker);
  f.x = wx; f.z = wz; S.solid({ x, z, r: .12 });
  let wob = 0, up = 0, calm = 0, flights = 0;
  f.onTap = () => { wob = 1.6; sfx.rustle(); if (up < .3) { flights++; sfx.flutter(); } calm = 3.5; };
  f.act = tick => f.setFrame(wob > 0 ? 1 + (Math.floor(tick / 2) % 2) : 0);
  const arm = f.H * .6, birds = [-.55, .2, .6].map((bx, i) => { const b = S.figure('vogel' + (i + 1), THINGS.vogel); b.act = tick => b.setFrame(up > .15 ? 1 + (tick % 2) : 0); return { b, bx, a: i * 2.1, r: 1.3 + i * .35, h: 2.4 + i * .25 }; });
  return { f, state: () => ({ up: up > .5, flights, wob: wob > 0 }), step({ dt }) {
    calm = Math.max(0, calm - dt);
    up += ((calm > 0 ? 1 : 0) - up) * Math.min(1, dt * 2.2); if (up < .01) up = 0;
    if (wob > 0) wob -= dt;
    for (const o of birds) {
      o.a += dt * (1.4 + o.r * .2); const fx = Math.cos(o.a) * o.r, fz = Math.sin(o.a) * o.r * .6, b = o.b;
      b.x = wx + o.bx + (fx - o.bx) * up; b.z = wz + .06 + fz * up; b.floatY = b.y = y + arm + (o.h - arm) * up + (up > 0 ? Math.sin(o.a * 3) * .08 * up : 0); if (up > .15) b.face = -Math.sin(o.a) > 0 ? 1 : -1;
    }
  } };
}
