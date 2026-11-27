// The rainbow island: east of the beach over a long bridge. Everything here has a colour of its own. Made for paper.
//   the rainbow     a real arch at the back of the island: a tap and she rides up one side, over the top and down the other
//   paint puddles   three of them: walk through one and her feet leave prints of that colour, which stay
//   mushrooms       four springy ones in a ring: walking onto one bounces her, the big one highest
//   who lives here  two flamingos in a pink pond (one does as the other does), the parrot on its perch, the rabbit and its holes
// The rainbow stands in the north, behind everything: nothing tall between her and the camera.
import { THREE, rng, paper, slab, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { shore, meadow, bouquet, pinwheel, bench, lantern, GROUND } from './props.js';
import { rainbow, paint, mushroom, BANDS } from './wonders.js';
import { flamingo, parrot, rabbit } from './critters2.js';
import { regenboogLand, BACK } from './lands.js';

const H_SAND = -.32, H_GRASS = 0, DECK = -.12;
const COL = { plank: '#c9a878', post: '#8d6a48', path: '#f6ead8', pond: '#f4c6d4', hole: '#6f5a48' };

export default {
  name: 'regenboog',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c);
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const { SAND, GRASS, POND, bridge: BR } = regenboogLand();

    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, GROUND.high]]);
    root.add(slab(POND, H_GRASS + .02, .02, P('pond'), whiteEdge));
    for (let x = BR.x0; x < BR.x1; x += .32) root.add(slab(rect(x, BR.z0 - .05, x + .28, BR.z1 + .05), DECK, .06, P('plank'), edgeMat));
    for (let x = BR.x0 + 1.2; x < BR.x1 - .6; x += 1.7) for (const z of [BR.z0, BR.z1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), P('post')); m.castShadow = true; m.position.set(x, DECK - .6, z); root.add(m); }

    S.sea({ land: [SAND], x0: -40, x1: 32, z0: -24, z1: 26, deep: [230, 180, 0, 0], fine: 1.8 });
    S.floorBox(DECK, BR.x0, BR.z0, BR.x1, BR.z1);
    S.floor(null, POND); S.floor(H_GRASS, GRASS); S.floor(H_SAND, SAND, .22);

    /* ---------------- paths ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed, cols = ['path']) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.2 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, paper(cols[i % cols.length]), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    lay(ribbon([[BR.x1 - .3, 0], [-8.6, .3], [-6.2, -.3], [-3.6, .2], [-1.4, .6]], .85, 631), 'path');                       // from the bridge to the middle
    lay(blob(-.2, .9, 2.1, 1.5, 632, 36, .06), 'path');                                                                      // the round place in the middle
    stepping([[-.3, -.8], [-.2, -1.6], [-.1, -2.4]], 640, BANDS);                                                             // up to the rainbow: stones in its colours
    stepping([[1.9, 1.3], [2.9, 1.7], [3.9, 2.1]], 646, BANDS);                                                               // to the pond

    /* ---------------- things ---------------- */
    const bow = rainbow(S, 0, H_GRASS, -3.6), bunch = bouquet(S);
    const pots = paint(S, [{ x: -4.6, z: 3.4, r: .62, col: '#e98f8f' }, { x: -2.2, z: 4.6, r: .56, col: '#8fc3e0' }, { x: .6, z: 4.2, r: .6, col: '#f2d86b' }], H_GRASS);
    const shrooms = [mushroom(S, -7.0, H_GRASS, -3.2, .42, '#e98f8f', .6), mushroom(S, -6.0, H_GRASS, -2.3, .5, '#f2b56b', 1), mushroom(S, -7.2, H_GRASS, -1.5, .62, '#bba6ea', 1.6), mushroom(S, -8.2, H_GRASS, -2.5, .36, '#9ed9a0', .3)];
    const live = { flamingo: flamingo(S, 6.2, 2.5), flamingo2: flamingo(S, 7.3, 2.9, 'flamingo2'), papegaai: parrot(S, 4.4, -2.2, 1.25), konijn: rabbit(S, [[3.2, 4.6], [5.4, 5.2], [1.9, 5.6]]) };
    live.flamingo.pair(live.flamingo2); live.flamingo2.pair(live.flamingo); live.flamingo2.f.face = -1; for (const q of [live.flamingo, live.flamingo2]) q.f.floatY = q.f.y = H_GRASS + .02;
    // the parrot's perch, and the rabbit's holes
    { const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, 1.25, 6), P('post')); p.position.set(4.4, .625, -2.2); p.castShadow = true; root.add(p); const bar = new THREE.Mesh(new THREE.BoxGeometry(.6, .05, .05), P('post')); bar.position.set(4.4, 1.23, -2.2); root.add(bar); S.solid({ x: 4.4, z: -2.2, r: .1 }); }
    for (const [x, z] of [[3.2, 4.6], [5.4, 5.2], [1.9, 5.6]]) { const h = slab(circlePts(.3, 660 + Math.round(x * 10), 14).map(([a, b]) => [a * 1.3, b * .8]), H_GRASS + .03, .03, P('hole'), paper('#c9a878')); h.position.set(x, 0, z); root.add(h); laid.push(blob(x, z, .5, .4, 1, 8, 0)); }
    const benches = [bench(S, -3.2, H_GRASS, -1.6)];
    const lamps = [[-8.9, 1.5], [2.3, -.6]].map(([x, z], n) => lantern(S, x, H_GRASS, z, n));
    const mills = [pinwheel(S, 2.6, H_GRASS, 3.0, '#f2d86b', '#8fc3e0'), pinwheel(S, -9.4, H_GRASS, -1.2, '#bba6ea', '#f4a6c4')];

    /* ---------------- trees in six colours, at the back and the sides; flowers everywhere ---------------- */
    const keepOff = [[-5.4, -5.2, 5.4, 7.6], [-9.8, -4.6, -4.6, 3.4], [BR.x1 - 1, -2.2, -7.6, 2.2], [2.6, .6, 9.4, 7.4], [-6.4, 2.0, 2.2, 7.4]];
    const R = rng(661); let n = 0;
    for (let i = 0; i < 1500 && n < 14; i++) {
      const x = -11 + R() * 22, z = -7.6 + R() * 15, c = BANDS[n % BANDS.length];
      if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .7 || inPoly(POND, x, z) || edgeDist(POND, x, z) < 1) continue;
      if (keepOff.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1) || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .7) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < 1.6)) continue;
      S.lollipop(x, z, H_GRASS, .5 + R() * .3, c, '#fbf7ee', 670 + n, 1 + R() * .5); n++;
    }
    const grass = meadow(S, 260, R2 => {
      const x = -11 + R2() * 22, z = -7.6 + R2() * 15.2;
      if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .3 || inPoly(POND, x, z) || edgeDist(POND, x, z) < .3 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5)) return null;
      if ([[-5.6, 2.6, 1.8, 5.6], [-8.8, -3.9, -5.2, -.8]].some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return null;   // (clear ground round the paint and the mushrooms)
      return [x, H_GRASS, z];
    }, 662, 4, ['#b9d08a', '#c9d79a', '#a8c47c'], bunch);

    return {
      start: [BR.x1 + 1.2, 0], uni: [BR.x1 + .4, .6],
      shadow: { follow: 20 }, back: BACK, sky: 3,
      step(e) {
        bow.step(e); pots.step(e); bunch.step(e); grass.step(e);
        for (const q of [...shrooms, ...benches, ...lamps, ...mills, ...Object.values(live)]) q.step(e);
      },
      toys: { ...live, regenboog: bow, verf: pots, paddenstoel: shrooms[2], bos: bunch, gras: grass, bank: benches[0] },
      shots: [
        { name: 'brug-regenboog', zone: [BR.x0 + .9, -1.5, BR.x1 - .2, 1.5], span: 26, tall: 13, rise: .42, dof: .7, range: 2.2, play: false },
        { name: 'boog', zone: [-4.8, -5.4, 4.8, -1.2], span: 17, tall: 10, rise: .3 },   // by the rainbow: far enough back to see the whole arch
        { name: 'regenboog', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { regenboog: [2.55, 2.55, -3.6], paddenstoel: [-7.2, .6, -1.5] },
      places: { start: [BR.x1 + 1.2, 0], middle: [-.2, 1.2], bow: [-.1, -2.2], paint: [-4.6, 4.6], pond: [5.2, 3.6], shrooms: [-5.6, -1.2], rabbit: [3.4, 5.9], west: [BR.x0 + 2, 0] },
    };
  },
};
