// The castle's island: east of the meadow's waterfall over a long bridge. Made for paper; a first pass (no inside yet).
//   the castle      at the back: three windows with shutters, and somebody behind each (a tap opens one)
//   the carousel    she and the unicorn ride it; pushing turns it, and it keeps turning
//   who lives here  the peacock on the lawn (its tail opens into a fan), the baby dragon asleep by its rock (smoke rings, then fireworks)
//   a fountain in the court, two flower beds planted in rows, lanterns, benches
// The castle stands in the north, behind everything.
import { THREE, rng, paper, slab, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { shore, meadow, bouquet, flowerBed, pinwheel, fountain, bench, lantern, GROUND } from './props.js';
import { castle, carousel } from './castle.js';
import { peacock, dragon } from './critters2.js';
import { kasteelLand, BACK } from './lands.js';
import { cypress, topiary, roseHedge, pennant, goldBall } from './flora.js';

const H_SAND = -.32, H_GRASS = 0, DECK = -.12;
const COL = { plank: '#c9a878', post: '#8d6a48', path: '#efe6dc', court: '#e6ddd2', rock: '#bdb6c9', rock2: '#cbc5d6' };

export default {
  name: 'kasteel',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c);
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const { SAND, GRASS, bridge: BR } = kasteelLand();

    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, GROUND.grass]]);
    for (let x = BR.x0; x < BR.x1; x += .32) root.add(slab(rect(x, BR.z0 - .05, x + .28, BR.z1 + .05), DECK, .06, P('plank'), edgeMat));
    for (let x = BR.x0 + 1.2; x < BR.x1 - .6; x += 1.7) for (const z of [BR.z0, BR.z1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), P('post')); m.castShadow = true; m.position.set(x, DECK - .6, z); root.add(m); }
    S.sea({ land: [SAND], x0: -40, x1: 32, z0: -24, z1: 26, deep: [230, 180, 0, 0], fine: 1.8 });
    S.floorBox(DECK, BR.x0, BR.z0, BR.x1, BR.z1);
    S.floor(H_GRASS, GRASS); S.floor(H_SAND, SAND, .22);

    /* ---------------- paths and the court ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.2 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    lay(blob(0, .3, 3.2, 2.1, 731, 44, .05), 'court');                                                       // the court in front of the gate
    lay(ribbon([[BR.x1 - .3, 0], [-8.2, .25], [-5.6, -.2], [-2.6, .2]], .9, 732), 'path');                   // from the bridge
    lay(ribbon([[0, -1.4], [.05, -2.6], [0, -3.75]], 1.1, 733, .03), 'path');                                // up to the gate
    stepping([[2.9, 1.2], [3.8, 1.7], [4.6, 2.2]], 740);                                                     // to the carousel
    stepping([[-2.6, 1.7], [-3.4, 2.4], [-4.1, 3.0]], 745);                                                  // to the peacock's lawn

    /* ---------------- things ---------------- */
    const burg = castle(S, 0, H_GRASS, -4.9), turn = carousel(S, 6.4, H_GRASS, 3.0), well = goldBall(S, 0, H_GRASS + .015, .5), bunch = bouquet(S);   // (a fountain stands on the village square; the court has a golden ball)
    const beds = [];   // (flower beds are her garden's; here: rose hedges and clipped bushes, flora.js)
    for (const s of [-1, 1]) { roseHedge(S, s * 1.3, -2.9, s * 3.9, -2.9, H_GRASS, 760 + s); roseHedge(S, s * 3.9, -2.9, s * 3.9, -1.5, H_GRASS, 764 + s); }
    for (const [x, z, k] of [[-1.25, -1.9, 'two'], [1.25, -1.9, 'two'], [-4.7, .2, 'cone'], [4.7, .2, 'cone'], [-2.9, 2.6, 'ball'], [2.2, 3.0, 'ball'], [-7.6, 1.2, 'cone'], [-7.6, -1.2, 'cone']]) topiary(S, x, H_GRASS, z, k);
    root.add(slab(blob(-7.0, -2.6, 1.3, .9, 735, 20, .08), .34, .34, P('rock2'), P('rock'))); S.solid({ x: -7.0, z: -2.6, r: 1.0 });   // the dragon's rock
    const live = { pauw: peacock(S, -4.8, 3.6), draakje: dragon(S, -5.9, -1.5) };
    const benches = [], lamps = [], mills = [];
    for (const [x, z, c] of [[-9.0, 1.3, '#e98f8f'], [-9.0, -1.3, '#bba6ea'], [-1.25, -3.7, '#f2c65c'], [1.25, -3.7, '#f2c65c'], [3.6, 4.6, '#8fc3e0']]) pennant(S, x, H_GRASS, z, c);

    /* ---------------- trees at the back and the sides; flowers ---------------- */
    const keepOff = [[-5.2, -6.6, 5.2, 7.8], [3.4, -.2, 9.6, 7.6], [-9.2, -4.4, -4.2, 7.4], [BR.x1 - 1, -2.2, -7.6, 2.2]];
    // cypresses stand in rows, as in a castle's garden: three stepping up on each side of the castle, a pair by the east shore
    [[-5.7, -5.7, 3.0], [-6.9, -5.1, 2.6], [-8.1, -4.3, 2.2], [5.7, -5.7, 3.0], [6.9, -5.1, 2.6], [8.1, -4.3, 2.2], [9.5, -2.0, 2.4], [9.7, -.5, 2.1]].forEach(([x, z, h], k) => cypress(S, x, H_GRASS, z, h, k % 2 ? '#5f8665' : '#6f9670'));
    const grass = meadow(S, 0, R2 => {
      const x = -10.6 + R2() * 21.2, z = -7.8 + R2() * 15.6;
      if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .3 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5)) return null;
      if (Math.abs(x) < 4.2 && z < -1.6 || Math.hypot(x - 6.4, z - 3.0) < 2.7) return null;   // (clear ground before the castle and round the carousel)
      return [x, H_GRASS, z];
    }, 762, 3, undefined, bunch);

    return {
      start: [BR.x1 + 1.2, 0], uni: [BR.x1 + .4, .6],
      shadow: { follow: 20 }, back: BACK, sky: 3,
      step(e) {
        burg.step(e); turn.step(e); well.step(e); bunch.step(e); grass.step(e);
        for (const q of [...beds, ...benches, ...lamps, ...mills, ...Object.values(live)]) q.step(e);
      },
      toys: { ...live, kasteel: burg, draaimolen: turn, bal: well, bos: bunch, gras: grass },
      shots: [
        { name: 'brug-kasteel', zone: [BR.x0 + .9, -1.5, BR.x1 - .2, 1.5], span: 26, tall: 13, rise: .42, dof: .7, range: 2.2, play: false },
        { name: 'poort', zone: [-4.6, -4.2, 4.6, -.9], span: 17, tall: 11, rise: .26 },   // before the castle: low and far enough back to see its roofs
        { name: 'kasteel', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { draaimolen: [6.4, 1.4, 3.0], raam0: [-1.95, 1.56, -4.33], raam1: [1.95, 1.56, -4.33], raam2: [0, 2.86, -4.38] },
      places: { start: [BR.x1 + 1.2, 0], court: [0, 1.9], gate: [0, -3.4], carousel: [6.4, 5.6], peacock: [-4.0, 4.6], dragon: [-5.0, -.4], west: [BR.x0 + 2, 0] },
    };
  },
};
