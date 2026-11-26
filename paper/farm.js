// The farm: a loop of small real actions, each a tap away.
//   the can      a tap and she walks over and picks it up (she carries it in front of her); a tap on it again puts it down
//   the well     with the can: the bucket goes down and comes up full, and the can is full. Good for two rows
//   a row        seedlings. With a full can: she pours, and the carrots grow, in two steps you can watch
//   grown        a tap pulls one out, and it flies to whoever is hungry nearest by: the pig, or her unicorn
//   the row      empty, it is seedlings again after a while
// When something is missing (no can, an empty can) the thing she needs gives a little hop: there is no wrong.
// Also here: the scarecrow, with three birds that fly up when she comes close and settle again when she has gone.
import { THREE, paper, card, slab, blob } from './kit.js';

const mesh = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const box = (w, h, d, col) => mesh(new THREE.BoxGeometry(w, h, d), col), cyl = (r0, r1, h, col, n = 12) => mesh(new THREE.CylinderGeometry(r0, r1, h, n), col);
const LEAF = [[-.1, 0], [-.07, .16], [-.02, .05], [.02, .22], [.06, .06], [.1, .15], [.1, 0]];

/** the well: a ring of pale stone, two posts, a little roof, and a bucket on a rope that goes down and comes up */
export function well(S, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const ring = cyl(.62, .66, .52, '#c5bfd0', 18); ring.position.y = .26; g.add(ring);
  const water = cyl(.5, .5, .02, '#4f8ea2', 18); water.position.y = .5; water.castShadow = false; g.add(water);
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

export function farm(S, { can: canAt, well: theWell, rows: rowsAt, y = 0, eaters = [] }) {
  const { girl, sfx } = S;
  /* ---------------- the watering can ---------------- */
  const can = new THREE.Group(); can.userData.live = true; S.root.add(can);
  { const body = cyl(.14, .16, .26, '#6fb0b8', 12); body.position.y = .13; can.add(body);
    const spout = cyl(.03, .045, .3, '#6fb0b8', 6); spout.position.set(.22, .2, 0); spout.rotation.z = -.9; can.add(spout);
    const rose = cyl(.06, .03, .05, '#5f9fae', 8); rose.position.set(.34, .3, 0); rose.rotation.z = -.9; can.add(rose);
    const handle = mesh(new THREE.TorusGeometry(.1, .018, 5, 10, Math.PI), '#5f9fae'); handle.position.set(-.15, .16, 0); handle.rotation.z = Math.PI / 2; can.add(handle); }
  const water = cyl(.115, .115, .015, '#8fd0e0', 12); water.position.y = .25; water.castShadow = false; water.visible = false; can.add(water);
  const C = { at: S.at(canAt), held: false, full: 0, tilt: 0, hop: 0 };
  const origin = S.at([0, 0]);
  S.tap(can, () => { if (S.playing()) return; if (C.held) { C.held = false; girl.poseName = null; C.at = [girl.x + girl.face * .5, girl.z + .15]; sfx.thud(); } else S.walkThen(C.at[0] - .35, C.at[1] + .1, () => { C.held = true; sfx.hop(); }, .9); });

  /* ---------------- the rows of carrots ---------------- */
  const rows = rowsAt.map(([rx, rz], n) => {
    const g = new THREE.Group(); g.position.set(rx, y, rz); S.root.add(g);
    const stages = [0, 1, 2].map(st => { const sg = new THREE.Group(); sg.userData.live = true; g.add(sg); return sg; });
    const xs = [-.8, -.4, 0, .4, .8];
    for (const px of xs) { const a = card(LEAF, .02, paper('#86a466')); a.position.set(px, 0, 0); a.scale.setScalar(.6); stages[0].add(a); }
    for (const px of xs) { const a = card(LEAF, .02, paper('#7f9d5e')); a.position.set(px, 0, 0); a.scale.setScalar(1.15); stages[1].add(a); const b = card(LEAF, .02, paper('#9bb877')); b.position.set(px + .05, 0, .03); b.rotation.y = .7; stages[1].add(b); }
    S.glue(stages[0]); S.glue(stages[1]);
    const plants = xs.map(px => { const p = new THREE.Group(); p.userData.live = true; p.position.x = px; stages[2].add(p);
      const a = card(LEAF, .02, paper('#6f9057')); a.scale.setScalar(1.6); a.position.y = .07; p.add(a); const b = card(LEAF, .02, paper('#86a466')); b.scale.setScalar(1.4); b.position.set(.04, .07, .03); b.rotation.y = .8; p.add(b);
      const top = mesh(new THREE.SphereGeometry(.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e8893a'); top.position.y = .01; p.add(top); S.glue(p); return p; });
    const row = { g, stages, plants, stage: 0, grow: 0, left: 5, back: 0, at: S.at([rx, rz + .55]), mid: S.at([rx, rz]), n };
    const show = () => { stages.forEach((sg, i) => { sg.visible = i === row.stage; }); plants.forEach((p, i) => { p.visible = i < row.left; }); };
    row.show = show; show();
    S.tap(g, () => tapRow(row));
    // a strip of soil under the row: also what a finger finds
    const soil = slab(blob(rx, rz, 1.2, .3, 500 + n, 20, .06), y + .02, .02, paper('#a98f6f'), paper('#8d7557')); S.root.add(soil); S.tap(soil, () => tapRow(row));
    return row;
  });
  let pour = null, flying = null, pulled = 0, watered = 0;
  function tapRow(row) {
    if (S.playing() || pour) return;
    if (row.stage === 2 && row.left > 0) { S.walkThen(row.at[0], row.at[1], () => pull(row), 1.1); return; }
    if (row.stage !== 0 || row.grow) return;
    if (!C.held) { C.hop = 1; sfx.peep(); return; }                                  // no can: the can gives a hop
    if (!C.full) { theWell.g.userData.hop = 1; C.hop = 1; sfx.peep(); return; }      // an empty can: she needs the well
    S.walkThen(row.at[0], row.at[1], () => { pour = { row, t: 0 }; C.full--; sfx.swish(3); }, 1.1);
  }
  function pull(row) {
    if (row.left <= 0 || flying) return; row.left--; row.show(); pulled++; sfx.boing();
    const i = row.left, from = new THREE.Vector3(row.mid[0] + [-.8, -.4, 0, .4, .8][i], y + .1, row.mid[1]);
    const who = eaters.map(e => e()).filter(Boolean).sort((a, b) => Math.hypot(a.x - from.x, a.z - from.z) - Math.hypot(b.x - from.x, b.z - from.z))[0] || S.uni;
    const m = mesh(new THREE.ConeGeometry(.08, .34, 8), '#e8893a'); m.rotation.x = Math.PI; const top = card(LEAF, .02, paper('#6f9057')); top.scale.setScalar(1.2); top.position.y = -.17; top.rotation.x = Math.PI; m.add(top);
    m.position.copy(from).sub(new THREE.Vector3(origin[0], 0, origin[1])); S.root.add(m); flying = { m, from, who, t: 0 };
    if (row.left === 0) row.back = 45;
  }
  S.tap(theWell.g, () => { if (S.playing() || theWell.busy()) return; S.walkThen(theWell.at[0], theWell.at[1], () => { if (theWell.draw() && C.held) setTimeout(() => { C.full = 2; sfx.chime(); }, 600); }, 1.2); });

  return {
    state: () => ({ held: C.held, full: C.full, rows: rows.map(r => ({ stage: r.stage, left: r.left })), pulled, watered, can: C.at }),
    places: { can: [C.at[0] - .35, C.at[1] + .1], well: theWell.at, row: rows[0].at },
    step({ dt, stepped }) {
      theWell.step(dt);
      // the can: in her hands, or where she left it
      if (C.held && !S.playing()) { girl.poseName = 'hold'; const h = S.hand(); can.position.set(h.x - origin[0], h.y - .1, h.z - origin[1] + .04); can.rotation.y = girl.face > 0 ? 0 : Math.PI; }
      else if (C.held) { can.position.set(girl.x - origin[0] + .5, y, girl.z - origin[1] + .3); can.rotation.y = 0; }   // she is on a toy: the can waits beside it
      else { can.position.set(C.at[0] - origin[0], y + (C.hop > 0 ? Math.sin(C.hop * Math.PI) * .25 : 0), C.at[1] - origin[1]); can.rotation.y = 0; }
      if (C.hop > 0) C.hop = Math.max(0, C.hop - dt * 2.4);
      can.rotation.z = pour ? -.75 * Math.min(1, pour.t / .25) : 0; water.visible = C.full > 0;
      if (pour) { pour.t += dt; if (stepped) S.confetti(can.position.x + origin[0] + girl.face * .35, y + .45, can.position.z + origin[1], ['#8fd0e0', '#f6efe2'], 2, undefined, .4); if (pour.t > 1.0) { pour.row.grow = .01; watered++; pour = null; } }
      for (const r of rows) {
        if (r.grow) { r.grow += dt; const st = r.grow > 1.7 ? 2 : r.grow > .7 ? 1 : 0; if (st !== r.stage) { r.stage = st; r.left = 5; r.show(); sfx.hop(); } if (r.grow > 1.7) r.grow = 0; }
        if (r.back > 0) { r.back -= dt; if (r.back <= 0) { r.stage = 0; r.left = 5; r.show(); } }
      }
      if (flying) {   // a pulled carrot: up, over, and into a hungry mouth
        flying.t += dt; const k = Math.min(1, flying.t / .7), w = flying.who, tx = w.x, tz = w.z, ty = (w.y || 0) + .35;
        flying.m.position.set(flying.from.x + (tx - flying.from.x) * k - origin[0], flying.from.y + (ty - flying.from.y) * k + Math.sin(k * Math.PI) * 1.1, flying.from.z + (tz - flying.from.z) * k - origin[1]); flying.m.rotation.z = k * 6;
        if (k >= 1) { S.root.remove(flying.m); w.hopV = 2.6; sfx.munch(); S.confetti(tx, ty + .3, tz, ['#f4a6c4', '#f8dde4', '#e8893a'], 8, undefined, 2); flying = null; }
      }
    },
  };
}

/** the scarecrow: a tap and it shakes its straw arms; its three birds fly up when she comes close, and settle again when she has gone */
export function scarecrow(S, x, y, z) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]);
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const sway = new THREE.Group(); sway.userData.live = true; g.add(sway);
  const post = cyl(.04, .05, 1.7, '#8d6a48', 6); post.position.y = .85; sway.add(post);
  const arms = cyl(.035, .035, 1.5, '#8d6a48', 6); arms.rotation.z = Math.PI / 2; arms.position.y = 1.2; sway.add(arms);
  const shirt = card([[-.42, 0], [.42, 0], [.3, .62], [.62, .62], [.62, .8], [-.62, .8], [-.62, .62], [-.3, .62]], .04, paper('#d9706c')); shirt.position.set(0, .62, .04); sway.add(shirt);
  const head = mesh(new THREE.SphereGeometry(.2, 12, 10), '#ecd3a0'); head.position.y = 1.62; sway.add(head);
  const hat = cyl(0, .26, .3, '#7a5a3e', 12); hat.position.y = 1.9; sway.add(hat); const brim = cyl(.34, .34, .03, '#7a5a3e', 14); brim.position.y = 1.76; sway.add(brim);
  for (const s of [-1, 1]) { const straw = card(LEAF, .02, paper('#e6b748')); straw.scale.setScalar(1.1); straw.rotation.z = -s * Math.PI / 2; straw.position.set(s * .74, 1.2, 0); sway.add(straw); }
  for (const s of [-1, 1]) { const eye = mesh(new THREE.SphereGeometry(.025, 6, 5), '#33262e'); eye.position.set(s * .07, 1.65, .19); sway.add(eye); }
  S.glue(sway); S.solid({ x, z, r: .12 });
  const birds = [-.5, .15, .55].map((bx, i) => {
    const b = new THREE.Group(); b.userData.live = true; g.add(b);
    const body = mesh(new THREE.SphereGeometry(.07, 8, 6), ['#4b3d3d', '#6f625c', '#4b3d3d'][i]); body.scale.set(1.5, 1, 1); b.add(body);
    const beak = cyl(0, .025, .07, '#e2803e', 5); beak.rotation.z = -Math.PI / 2; beak.position.x = .13; b.add(beak);
    const wings = [-1, 1].map(s => { const w = card([[0, 0], [.2, .04], [.14, .14], [0, .08]], .01, paper('#33262e', { side: THREE.DoubleSide })); w.position.set(-.02, .03, s * .03); w.rotation.x = s * .3; b.add(w); return w; });
    return { b, wings, perch: [bx, 1.29, 0], a: i * 2.1, r: 1.3 + i * .35, h: 2.3 + i * .25 };
  });
  let wob = 0, up = 0, calm = 0, flights = 0;
  S.tap(g, () => { wob = 1; sfx.rustle(); });
  return { state: () => ({ up: up > .5, flights, wob }), step({ dt, tick, stepped }) {
    const d = Math.hypot(girl.x - wx, girl.z - wz);
    if (d < 2.8) { if (up === 0) { flights++; sfx.flutter(); } calm = 3.5; } else calm = Math.max(0, calm - dt);
    up += ((calm > 0 ? 1 : 0) - up) * Math.min(1, dt * 2.2); if (up < .01) up = 0;
    for (const o of birds) {
      o.a += dt * (1.4 + o.r * .2); const fx = Math.cos(o.a) * o.r, fz = Math.sin(o.a) * o.r * .6;
      o.b.position.set(o.perch[0] + (fx - o.perch[0]) * up, o.perch[1] + (o.h - o.perch[1]) * up + (up > 0 ? Math.sin(o.a * 3) * .08 * up : 0), o.perch[2] + fz * up); o.b.rotation.y = up > .1 ? -o.a - Math.PI / 2 : 0;
      if (stepped) for (const [i, w] of o.wings.entries()) w.rotation.x = (i ? 1 : -1) * (up > .1 ? (tick % 2 ? 1.1 : -.2) : .3);
    }
    if (stepped) { if (wob > .02) { wob *= .8; sway.rotation.z = Math.sin(tick * 2.1) * .16 * wob; } else sway.rotation.z = 0; }
  } };
}
