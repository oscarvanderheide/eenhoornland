// A room: the doll's-house box her bedroom is (set-huis.js), for the other rooms she can walk into (Oscar: the shop, the
// treehouse and the log cabin "should also be like a room we enter, not us standing in the outside world"). A dark table
// it stands on, a floor, a back wall with windows cut out of it and the sky behind them, two side walls opened a little like
// a toy theatre, and the way out: walking down off the front of the room, over the mat (S.door, a cut to the door outside).
import { THREE, paper, slab, card, edgeMat, whiteEdge } from './kit.js';

/** o: { W, D, H: the room's size; floor, boards (the gaps between floorboards, or null), wall, side, dark, skirt: colours;
 *  windows: [[cx, cy, w, h]] in the back wall; openings: [[cx, w, h]] doorways in it, down to the floor; sky: what shows through them; door: the name of the door out; mat: its colour }
 *  Gives back helpers in the set's measure: put(mesh, x, y, z), box(w, h, d, col), rect(x0, z0, x1, z1), and the back wall */
export function roomShell(S, o) {
  const { W, D, H } = o, root = S.root, P = c => paper(c);
  const put = (m, x, y, z, to = root) => { m.position.set(x, y, z); to.add(m); return m; };
  const box = (w, h, d, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.castShadow = m.receiveShadow = true; return m; };
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const table = new THREE.Mesh(new THREE.PlaneGeometry(44, 30), P(o.dark)); table.rotation.x = -Math.PI / 2; table.position.set(0, -.06, 0); table.receiveShadow = true; root.add(table);
  put(new THREE.Mesh(new THREE.PlaneGeometry(44, 18), P(o.dark)), 0, 6, -D / 2 - 1.4);
  root.add(slab(rect(-W / 2, -D / 2, W / 2, D / 2), 0, .12, P(o.floor), edgeMat));
  if (o.boards) for (let i = 1; i < 6; i++) { const z = -D / 2 + i * D / 6, l = slab(rect(-W / 2, z - .012, W / 2, z + .012), .004, .004, P(o.boards), P(o.boards)); l.castShadow = false; root.add(l); }
  const holes = (o.windows || []).map(([cx, cy, w, h]) => [[cx - w / 2, cy - h / 2], [cx - w / 2, cy + h / 2], [cx + w / 2, cy + h / 2], [cx + w / 2, cy - h / 2]]);
  for (const [cx, w, h] of o.openings || []) holes.push([[cx - w / 2, .03], [cx - w / 2, h], [cx + w / 2, h], [cx + w / 2, .03]]);   // a doorway in the back wall, down to the floor (the room's own door to somewhere else)
  const back = put(card([[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]], .08, P(o.wall), edgeMat, holes), 0, 0, -D / 2);
  if (o.skirt) put(card([[-W / 2, 0], [W / 2, 0], [W / 2, .16], [-W / 2, .16]], .03, P(o.skirt)), 0, 0, -D / 2 + .06);
  for (const [cx, cy, w, h] of o.windows || []) {
    put(new THREE.Mesh(new THREE.PlaneGeometry(w + .2, h + .2), P(o.sky || '#9fcfd8')), cx, cy, -D / 2 - .14);
    const f = .07, fr = o.frame || '#f4ecdc';
    put(card([[-w / 2 - f, -h / 2 - f], [w / 2 + f, -h / 2 - f], [w / 2 + f, h / 2 + f], [-w / 2 - f, h / 2 + f]], .03, P(fr), P(fr), [[[-w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2]]]), cx, cy, -D / 2 + .06);
  }
  for (const s of [-1, 1]) { const side = card([[-D / 2, 0], [D / 2, 0], [D / 2, H], [-D / 2, H]], .08, P(o.side || o.wall), edgeMat); side.rotation.y = s * (Math.PI / 2 - .28); put(side, s * (W / 2 + .42), 0, 0); }
  if (o.mat) root.add(slab(rect(-.5, D / 2 - .42, .5, D / 2 - .08), .02, .02, P(o.mat), whiteEdge));
  S.floor(0, rect(-W / 2 + .05, -D / 2 + .1, W / 2 - .05, D / 2 - .02));
  // walking down off the front of the room, anywhere along it, is the way out (the mat only shows it). `arrive`: what happens when she comes in
  if (o.door) S.door(o.door, [-W / 2, D / 2 - .3, W / 2, D / 2 + .1], [0, D / 2 - .95], [0, 1], false, o.arrive || null);
  return { put, box, rect, back, P };
}

/** the usual shot for a room: the whole box, from in front and a little above */
export const roomShot = (name, span = 7.6, tall = 5.8) => ({ name, ax: 0, az: -.1, fx: .3, fy: .2, fz: .25, lag: 1, span, tall, rise: .36, riseTall: .5 });
