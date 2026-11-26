// The beach: a wide island of sand south of the meadow, over a long bridge. Made for paper, not a port.
//   the sandcastle   every tap she builds a piece more; it stays; a tap on the finished castle and she jumps on it
//   the lighthouse   on its rock in the east: a tap lights it and its beams turn (at night it is on by itself)
//   the pier         out into the sea in the south; the gull on its posts, the seal on a rock beside its end
//   who lives here   the crab (dances, digs in), the turtle (tucks in, walks on), the gull, the seal
//   palms to shake (a coconut drops), a parasol and a bench to sit and look at the sea, a green dune with a lantern
// Everything tall stands in the north or at the sides: nothing between her and the camera where she plays.
import { THREE, rng, paper, slab, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { shore, meadow, bouquet, pinwheel, bench, lantern, GROUND } from './props.js';
import { palm, parasol, lighthouse, sandcastle } from './beach.js';
import { crab, gull, turtle, seal } from './critters2.js';
import { strandLand, BACK } from './lands.js';

const H_SAND = -.32, H_DUNE = 0, H_ROCK = -.02, DECK = -.12;
const COL = { plank: '#c9a878', post: '#8d6a48', rock: '#bdb6c9', rock2: '#cbc5d6', path: '#f3e6c4' };

export default {
  name: 'strand',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c);
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const put = (m, x, y, z) => { m.position.set(x, y, z); root.add(m); return m; };
    const post = (x, z, h = 1.6, top = DECK + .2) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, h, 8), P('post')); m.castShadow = true; return put(m, x, top - h / 2, z); };
    const { SAND, DUNE, ROCK, SEALROCK, bridge: BR } = strandLand();

    /* ---------------- the land ---------------- */
    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [DUNE, H_DUNE, .32, GROUND.grass]]);
    root.add(slab(ROCK, H_ROCK, .32, P('rock2'), P('rock'))); root.add(slab(SEALROCK, -.3, .5, P('rock2'), P('rock')));
    // the bridge from the meadow (this set's, all the way), and the pier
    const PIER = { x0: 1.4, x1: 2.6, z0: 7.6, z1: 15.6 }, HEAD = { x0: .5, x1: 3.5, z0: 14.2, z1: 15.8 };
    for (let z = BR.z0; z < BR.z1; z += .32) root.add(slab(rect(BR.x0 - .05, z, BR.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat));
    for (let z = BR.z1 - 1.2; z > BR.z0 + .6; z -= 1.7) for (const x of [BR.x0, BR.x1]) post(x, z);
    for (let z = PIER.z0; z < HEAD.z0; z += .32) root.add(slab(rect(PIER.x0 - .05, z, PIER.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat));
    for (let z = HEAD.z0; z < HEAD.z1; z += .32) root.add(slab(rect(HEAD.x0 - .05, z, HEAD.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat));
    for (let z = PIER.z0 + 1.6; z < HEAD.z0; z += 1.7) for (const x of [PIER.x0, PIER.x1]) post(x, z);
    const perch = [[HEAD.x0, HEAD.z1 - .1], [HEAD.x1, HEAD.z1 - .1], [HEAD.x0, HEAD.z0 + .1]]; for (const [x, z] of perch) post(x, z, 2.4, DECK + .9);   // the tall posts at the pier's head: the gull's
    post(HEAD.x1, HEAD.z0 + .1);

    S.sea({ land: [SAND, SEALROCK], x0: -40, x1: 40, z0: -26, z1: 30, deep: [230, 180, 0, 0], fine: 1.8 });

    S.floorBox(DECK, BR.x0, BR.z0, BR.x1, BR.z1); S.floorBox(DECK, PIER.x0, PIER.z0, PIER.x1, HEAD.z0 + .1); S.floorBox(DECK, HEAD.x0, HEAD.z0, HEAD.x1, HEAD.z1);
    S.floor(H_ROCK, ROCK); S.floor(H_DUNE, DUNE); S.floor(H_SAND, SAND, .22);

    /* ---------------- paths: boards laid on the sand ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_SAND) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_SAND + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    lay(ribbon([[0, BR.z1 - .2], [.3, -6.2], [-.4, -3.6], [.2, -1.2], [1.2, 1.6], [1.9, 4.6], [2.0, PIER.z0 + .3]], .85, 531), 'path');     // from the bridge down to the pier
    stepping([[1.6, -2.6], [2.9, -2.9], [4.2, -3.1], [5.5, -3.2], [6.8, -3.3], [8.1, -3.35]], 540);                                       // east, to the lighthouse
    stepping([[-.9, -4.4], [-1.9, -4.2], [-2.9, -3.9]], 550);                                                                             // west, up onto the dune
    stepping([[.4, 1.6], [-.6, 2.2], [-1.6, 2.7]], 555);                                                                                  // to the sandcastle

    /* ---------------- things ---------------- */
    const light = lighthouse(S, 11.5, H_ROCK, -3.6), castle = sandcastle(S, -3.4, H_SAND, 3.2), bunch = bouquet(S);
    const palms = [[-12.2, -1.2, 1], [-10.6, 2.4, 2], [-4.2, -6.6, 3], [5.6, -6.6, 4], [8.6, -6.9, 5], [7.0, -7.3, 6], [-1.9, -7.7, 7]].map(([x, z, n]) => palm(S, x, inPoly(DUNE, x, z) ? H_DUNE : H_SAND, z, 560 + n, 2.3 + (n % 3) * .3));
    parasol(S, -7.6, H_SAND, 3.3); parasol(S, 7.4, H_SAND, 1.2, '#9ed9cf', '#fbf5ea');
    const benches = [bench(S, -8.6, H_SAND, 3.5), bench(S, -7.4, H_DUNE, -3.9)];
    const lamps = [[1.3, -7.2], [-5.6, -2.6], [3.2, 6.6], [9.3, -2.0]].map(([x, z], n) => lantern(S, x, inPoly(DUNE, x, z) ? H_DUNE : H_SAND, z, n));
    const mills = [pinwheel(S, -1.9, H_SAND, 4.3, '#f2c65c', '#e98f8f'), pinwheel(S, -9.6, H_DUNE, -3.0, '#9ed9cf', '#f6efe2')];
    const live = {
      krab: crab(S, 5.2, 3.6, [[5.2, 3.6], [8.2, 5.0], [3.9, 1.2]]),
      schildpad: turtle(S, -6.2, 6.4, [[-6.2, 6.4], [-2.6, 7.2], [-10.2, 5.2]]),
      meeuw: gull(S, [[perch[0][0], perch[0][1], DECK + .9], [perch[1][0], perch[1][1], DECK + .9], [perch[2][0], perch[2][1], DECK + .9]]),
      zeehond: seal(S, 5.4, 14.45, -.3),
    };
    // beach grass on the dune (with flowers to pick), and shells and pebbles on the sand
    const grass = meadow(S, 90, R2 => { const x = -13.5 + R2() * 12.5, z = -7.2 + R2() * 7.2; if (!inPoly(DUNE, x, z) || edgeDist(DUNE, x, z) < .3 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5)) return null; return [x, H_DUNE, z]; }, 562, 3, ['#a8bd7c', '#b9c98a', '#93ad6a'], bunch);
    { const R = rng(571), cols = ['#fbf5ea', '#f4c6b8', '#e8d5b0', '#cbc5d6', '#f6dfa6'];
      for (let i = 0, n = 0; i < 900 && n < 60; i++) { const x = -15 + R() * 30, z = -9 + R() * 18; if (!inPoly(SAND, x, z) || edgeDist(SAND, x, z) < .5 || inPoly(DUNE, x, z) || inPoly(ROCK, x, z) || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .2) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .7)) continue;
        const st = slab(circlePts(.05 + R() * .06, 580 + n, 9).map(([px, pz]) => [px * (1 + R() * .5), pz]), H_SAND + .03, .03, paper(cols[n % cols.length]), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R() * 3; root.add(st); n++; } }

    return {
      start: [0, -7.4], uni: [-.8, -7.0],
      shadow: { follow: 20 }, back: BACK, sky: 2.6,
      step(e) {
        light.step(e); castle.step(e); bunch.step(e); grass.step(e);
        for (const q of [...palms, ...benches, ...lamps, ...mills, ...Object.values(live)]) q.step(e);
      },
      toys: { ...live, vuurtoren: light, zandkasteel: castle, palm: palms[2], bos: bunch, gras: grass, bank: benches[0] },
      shots: [
        { name: 'brug-zuid', zone: [-1.1, BR.z0 + .9, 1.1, BR.z1 - .2], span: 24, tall: 13, rise: .55, dof: .7, range: 2.2, play: false },   // the bridge from the meadow: far back and high
        { name: 'pier', zone: [.2, 9.4, 3.8, 16.2], span: 13, tall: 8, rise: .5 },                                                           // out on the pier: looking down on the water, the gull and the seal
        { name: 'vuurtoren', zone: [8.2, -5.8, 14.2, -1.2], span: 16, tall: 10, rise: .34 },                                                 // by the lighthouse: back far enough to see its lamp
        { name: 'strand', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { zandkasteel: [-3.6, .08, 3.75], vuurtoren: [11.5, 1.6, -3.6], palm: [-4.2, 1.6, -6.6], bank: [-8.6, .1, 3.63] },
      places: { start: [0, -7.4], castle: [-3.5, 4.3], light: [10.6, -1.9], pier: [2.0, 15.0], dune: [-6.6, -2.8], crab: [5.2, 4.6], turtle: [-6.2, 7.0], north: [0, BR.z0 + 2] },
    };
  },
};
