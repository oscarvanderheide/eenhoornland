// The farm: a loop of small real actions, each a tap away.
//   the can      a tap and she walks over and picks it up (she carries it in front of her); a tap on it again puts it down
//   the well     with the can: the bucket goes down and comes up full, and the can is full. Good for two rows
//   a row        seedlings. With a full can: she pours, and the carrots grow, in two steps you can watch
//   grown        a tap pulls one out, and it flies to whoever is hungry nearest by: the pig, or her unicorn
//   the row      empty, it is seedlings again after a while
// When something is missing (no can, an empty can) the thing she needs gives a little hop: there is no wrong.
// Also here: the scarecrow, with three birds that fly up when she comes close and settle again when she has gone.
import { THREE, paper, card, slab, blob } from './kit.js';
import { THINGS } from './things.js';

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
  /* ---------------- the watering can: a paper card like everything she holds (things.js: empty, full, pouring) ---------------- */
  const can = S.figure('gieter', THINGS.gieter), carrot = S.figure('wortel', THINGS.wortel); carrot.g.visible = false;
  const C = { at: S.at(canAt), held: false, full: 0, hop: 0 };
  const origin = S.at([0, 0]);
  can.onTap = () => { if (S.playing()) return; if (C.held) { C.held = false; girl.poseName = null; C.at = [girl.x + girl.face * .5, girl.z + .15]; sfx.thud(); } else S.walkThen(C.at[0] - .35, C.at[1] + .1, () => { C.held = true; sfx.hop(); }, .9); };
  can.act = () => can.setFrame(pour ? 2 : C.full ? 1 : 0);

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
    if (!C.held) { can.hopV = 2.6; sfx.peep(); return; }                             // no can: the can gives a hop
    if (!C.full) { can.hopV = 2.6; sfx.peep(); return; }                             // an empty can: it hops (she needs the well)
    S.walkThen(row.at[0], row.at[1], () => { pour = { row, t: 0 }; C.full--; sfx.swish(3); }, 1.1);
  }
  function pull(row) {
    if (row.left <= 0 || flying) return; row.left--; row.show(); pulled++; sfx.boing();
    const i = row.left, from = new THREE.Vector3(row.mid[0] + [-.8, -.4, 0, .4, .8][i], y + .1, row.mid[1]);
    const who = eaters.map(e => e()).filter(Boolean).sort((a, b) => Math.hypot(a.x - from.x, a.z - from.z) - Math.hypot(b.x - from.x, b.z - from.z))[0] || S.uni;
    carrot.g.visible = true; flying = { from, who, t: 0 };
    if (row.left === 0) row.back = 45;
  }
  S.tap(theWell.g, () => { if (S.playing() || theWell.busy()) return; S.walkThen(theWell.at[0], theWell.at[1], () => { if (theWell.draw() && C.held) setTimeout(() => { C.full = 2; sfx.chime(); }, 600); }, 1.2); });

  return {
    state: () => ({ held: C.held, full: C.full, rows: rows.map(r => ({ stage: r.stage, left: r.left })), pulled, watered, can: C.at }),
    places: { can: [C.at[0] - .35, C.at[1] + .1], well: theWell.at, row: rows[0].at },
    step({ dt, stepped }) {
      theWell.step(dt);
      // the can: in her hands, or where she left it
      if (C.held && !S.playing()) { girl.poseName = 'hold'; const h = S.hand(); can.x = h.x + girl.face * .08; can.z = h.z + .04; can.floatY = can.y = h.y - .2; can.face = girl.face; }
      else if (C.held) { can.x = girl.x + .5; can.z = girl.z + .3; can.floatY = undefined; can.face = 1; }   // she is on a toy: the can waits beside it
      else { can.x = C.at[0]; can.z = C.at[1]; can.floatY = undefined; can.face = 1; }
      if (pour) { pour.t += dt; if (stepped) S.confetti(can.x + girl.face * .3, can.y + .25, can.z, ['#8fd0e0', '#f6efe2'], 2, undefined, .4); if (pour.t > 1.0) { pour.row.grow = .01; watered++; pour = null; } }
      for (const r of rows) {
        if (r.grow) { r.grow += dt; const st = r.grow > 1.7 ? 2 : r.grow > .7 ? 1 : 0; if (st !== r.stage) { r.stage = st; r.left = 5; r.show(); sfx.hop(); } if (r.grow > 1.7) r.grow = 0; }
        if (r.back > 0) { r.back -= dt; if (r.back <= 0) { r.stage = 0; r.left = 5; r.show(); } }
      }
      if (flying) {   // a pulled carrot: up, over, and into a hungry mouth
        flying.t += dt; const k = Math.min(1, flying.t / .7), w = flying.who, ty = (w.y || 0) + .2;
        carrot.x = flying.from.x + (w.x - flying.from.x) * k; carrot.z = flying.from.z + (w.z - flying.from.z) * k + .05; carrot.floatY = carrot.y = flying.from.y + (ty - flying.from.y) * k + Math.sin(k * Math.PI) * 1.1; carrot.lean = k * 6;
        if (k >= 1) { carrot.g.visible = false; w.hopV = 2.6; sfx.munch(); S.confetti(w.x, ty + .4, w.z, ['#f4a6c4', '#f8dde4', '#e8893a'], 8, undefined, 2); flying = null; }
      }
    },
  };
}

/** the scarecrow: a paper card on its post. A tap and it rocks from side to side; its three birds (paper too) fly up when
 *  she comes close, and settle on its arms again when she has gone */
export function scarecrow(S, x, y, z) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]), f = S.figure('vogelverschrikker', THINGS.vogelverschrikker);
  f.x = wx; f.z = wz; S.solid({ x, z, r: .12 });
  let wob = 0, up = 0, calm = 0, flights = 0;
  f.onTap = () => { wob = 1.6; sfx.rustle(); };
  f.act = tick => f.setFrame(wob > 0 ? 1 + (Math.floor(tick / 2) % 2) : 0);
  const arm = f.H * .6, birds = [-.55, .2, .6].map((bx, i) => { const b = S.figure('vogel' + (i + 1), THINGS.vogel); b.act = tick => b.setFrame(up > .15 ? 1 + (tick % 2) : 0); return { b, bx, a: i * 2.1, r: 1.3 + i * .35, h: 2.4 + i * .25 }; });
  return { f, state: () => ({ up: up > .5, flights, wob: wob > 0 }), step({ dt }) {
    const d = Math.hypot(girl.x - wx, girl.z - wz);
    if (d < 2.8) { if (up === 0) { flights++; sfx.flutter(); } calm = 3.5; } else calm = Math.max(0, calm - dt);
    up += ((calm > 0 ? 1 : 0) - up) * Math.min(1, dt * 2.2); if (up < .01) up = 0;
    if (wob > 0) wob -= dt;
    for (const o of birds) {
      o.a += dt * (1.4 + o.r * .2); const fx = Math.cos(o.a) * o.r, fz = Math.sin(o.a) * o.r * .6, b = o.b;
      b.x = wx + o.bx + (fx - o.bx) * up; b.z = wz + .06 + fz * up; b.floatY = b.y = y + arm + (o.h - arm) * up + (up > 0 ? Math.sin(o.a * 3) * .08 * up : 0); if (up > .15) b.face = -Math.sin(o.a) > 0 ? 1 : -1;
    }
  } };
}
