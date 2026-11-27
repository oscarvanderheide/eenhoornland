// The meadow: a wide, open island of flowers east of the village, over the bridge the brambles shut. Not a copy of the
// pixel game's meadow: it keeps the waterfall with its singing stones and the kite, and is otherwise made for paper.
//   the windy hill   two steps of land in the north-west; on its top lies a kite. Run and it flies; up here the wind holds it
//   the balloon      on its rope at the back, in the north-east (so it never stands between her and the camera): up she goes, and the camera goes back until the islands lie below
//   the waterfall    in the east: a cliff, falling water, a pool crossed by five stepping stones that each sing a note
//   dandelions       a tap (or walking through one) and the seeds drift off
//   the bakery       a cream house with a blue roof (no inside yet; the baker comes with the people)
// Shapes are cut by hand; real ground, real trees and flowers; nothing here is a grey stand-in.
import { THREE, rng, paper, slab, card, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { cottage, shore, meadow, bouquet, pinwheel, bench, lantern, dandelion, GROUND } from './props.js';
import { kite, balloon } from './toys.js';
import { butterfly } from './critters.js';
import { baker, painter } from './folk.js';
import { sheep, lamb, otter } from './critters2.js';
import { gift, SNORKEL } from './gear.js';
import { weiLand, BACK } from './lands.js';

const H_SAND = -.32, H_GRASS = 0, H_HILL = .48, H_TOP = .96;
const COL = { path: '#e6e1d6', rock: '#bdb6c9', rock2: '#cbc5d6', water: '#7fbcc0', foam: '#f6efe2', fall: '#bfe3ea', stone: '#d9d2c4' };

export default {
  name: 'wei',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c), { girl, sfx } = S;
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const { SAND, GRASS, SAND_E, GRASS_E, HILL, TOP, bridge: W } = weiLand();

    /* ---------------- the land: a beach, the meadow, the hill and its top ---------------- */
    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [SAND_E, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, GROUND.grass], [GRASS_E, H_GRASS, .32, GROUND.grass], [HILL, H_HILL, .48, GROUND.high], [TOP, H_TOP, .48, GROUND.high]]);
    // stairs: three card steps up the south side of a level
    const edge = (poly, at) => { let best = -99; for (let v = -30; v <= 30; v += .01) if (inPoly(poly, at, v)) best = v; return best; };
    const stairs = [], steps = (poly, at, half, base) => { const lip = edge(poly, at); for (let i = 0; i < 3; i++) { const far = lip + .05 + (2 - i) * .42, h = base + (i + 1) * .16 - .02, b = [at - half, far - .5, at + half, far]; root.add(slab(rect(...b), h, h - base + .02, P('path'), edgeMat)); stairs.push({ b, h }); } };
    steps(HILL, -4.6, .6, H_GRASS); steps(TOP, -6.4, .55, H_HILL);

    /* ---------------- the waterfall: a cliff of pale stone, water falling in paper strips, a pool, five stones that sing ---------------- */
    const CLIFF = blob(23.5, -7.6, 5.8, 2.3, 411, 44, .06), POOL = blob(23.5, -3.1, 4.5, 2.15, 412, 44, .05);
    root.add(slab(CLIFF, 1.5, 1.5, P('rock'), P('rock2'))); root.add(slab(blob(23.3, -7.8, 4.6, 1.8, 413, 40, .06), 2.4, .9, P('rock2'), P('rock'))); root.add(slab(blob(23.6, -8.0, 3.3, 1.3, 414, 36, .06), 3.1, .7, P('rock'), P('rock2')));
    root.add(slab(POOL, H_GRASS + .02, .02, P('water'), whiteEdge));
    const fallZ = (() => { let z = -7.6; for (let v = -7.6; v < -4; v += .01) if (inPoly(CLIFF, 23.5, v)) z = v; return z; })();
    const fall = [0, 1, 2].map(ph => { const g = new THREE.Group(); g.userData.live = true; g.visible = ph === 0; g.position.set(23.5, 0, fallZ + .04); root.add(g);
      const back = card(rect(-1.15, .02, 1.15, 3.1), .03, P('fall')); g.add(back);
      for (let i = 0; i < 9; i++) { const x = -1.0 + i * .25, top = 3.05 - ((i * 7 + ph * 5) % 9) * .31, len = .5 + ((i * 3 + ph) % 4) * .22, st = card(rect(x - .05, Math.max(.05, top - len), x + .05, top), .02, P('foam')); st.position.z = .03; g.add(st); }
      for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.2 + ((i + ph) % 3) * .06, 10), P('foam')); f.rotation.x = -Math.PI / 2; f.position.set(-.9 + i * .45 + (ph - 1) * .08, .05, .35 + ((i + ph) % 2) * .22); g.add(f); }
      S.glue(g); return g; });
    const stones = [20.1, 21.8, 23.5, 25.2, 26.9].map((x, i) => { const g = new THREE.Group(); g.userData.live = true; g.position.set(x, 0, -3.0 + (i % 2 ? .18 : -.12)); root.add(g); const st = slab(circlePts(.5, 420 + i, 16), H_GRASS + .09, .09, P('stone'), P('rock')); g.add(st); S.glue(g); return { g, x, z: g.position.z, dip: 0, on: false }; });
    S.wall(23.5, -7.6, 5.6, 2.0);

    S.sea({ land: [SAND, SAND_E], x0: -34, x1: 58, z0: -24, z1: 22, deep: [230, 180, 0, 0], fine: 1.8 });

    // where she can stand: the first floor that holds the spot counts
    for (const s of stairs) S.floorBox(s.h, ...s.b);
    S.floorBox(H_GRASS + .09, 18.9, -3.4, 28.1, -2.7);   // the way over the pool: she hops from stone to stone (the hop is in step, below)
    S.floor(null, CLIFF); S.water(H_GRASS, POOL);   // the pool is light water: with the snorkel she swims in it
    S.floor(H_TOP, TOP); S.floor(H_HILL, HILL);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_E);
    S.floor(H_SAND, SAND, .22); S.floor(H_SAND, SAND_E, .22);

    /* ---------------- paths, cut by hand ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    const X = [-1.5, 2.2];   // where the paths meet
    lay(blob(X[0], X[1], 1.9, 1.4, 431, 36, .06), 'path');
    lay(ribbon([[W[0] - .3, W[1]], [-11, 2.1], [-7.5, 2.9], [-4.2, 2.0], [X[0] - 1.2, X[1]]], .9, 432), 'path');                                  // from the bridge
    lay(ribbon([[X[0] - .4, X[1] - .9], [-2.7, .3], [-4.2, -.5], [-4.6, -1.0]], .8, 433), 'path');                                                // up to the hill's stairs
    lay(ribbon([[X[0] + 1.3, X[1] + .1], [2.5, 2.7], [6.5, 1.5], [10.5, .3], [14.5, -.5], [17.6, -1.5], [19.2, -2.6]], .85, 434), 'path');        // east, to the pool
    lay(ribbon([[X[0] + .2, X[1] + 1.0], [-1.0, 4.8], [-.3, 7.4], [-.5, 9.4]], .8, 435), 'path');                                                 // south, to where the bridge to the beach will be
    lay(blob(10.6, -5.0, 2.0, 1.5, 436, 36, .06), GROUND.high);                                                                                    // where the balloon stands
    stepping([[2.5, 2.0], [2.75, 1.1], [2.95, .2], [3.1, -.7], [3.2, -1.6], [3.2, -2.5], [3.2, -3.4]], 440);                                      // up to the bakery
    stepping([[10.4, -.6], [10.3, -1.5], [10.45, -2.4], [10.6, -3.2]], 450);                                                                     // up to the balloon
    lay(blob(6.2, 5.3, 2.7, 1.8, 437, 36, .06), GROUND.high);                                                                                     // the sheep's pasture: a paler patch of grass
    stepping([[-.5, 10.0], [-.45, 10.5]], 458);                                                                                                  // over the sand to the bridge to the beach (set-strand.js)
    stepping([[28.0, -3.0], [28.7, -2.6], [29.3, -2.1], [30.0, -2.1], [30.6, -2.1]], 455);                                                                                   // on from the last stone

    /* ---------------- things ---------------- */
    const bakery = cottage(S, 3.2, H_GRASS, -5.7, null, { wall: '#f6e7c8', roof: '#5f8fb0', door: '#b9675a' });
    const theKite = kite(S, -6.4, H_TOP, -6.5), theBalloon = balloon(S, 10.6, H_GRASS + .03, -5.0), bunch = bouquet(S);
    let found = 0; const present = gift(S, 'duikbril', SNORKEL);   // how often the otter brought something up for her; the moment it is hers
    const folk = { bakker: baker(S, 4.75, -4.35), schilder: painter(S, 15.9, -3.9) };   // the baker by his door, the painter painting the waterfall (folk.js)
    const herd = { schaap: sheep(S, 5.2, 5.1), schaap2: sheep(S, 7.5, 5.9, 'schaap2'), lam: lamb(S, 6.5, 4.4), otter: otter(S, 21.6, -1.75, [[21.6, -1.75], [25.6, -1.9], [23.5, -4.45]], o => { if (!S.gear.snorkel && !S.playing()) { found++; present([o.x, .35, o.z], () => { S.gear.snorkel = true; }); } }) };   // critters2.js
    herd.schaap2.f.face = -1;
    const benches = [bench(S, -3.0, H_HILL, -4.5), bench(S, 29.6, H_GRASS, -3.6)];
    const lamps = [[-9.2, 3.3], [X[0] + 2.4, X[1] + 1.3], [8.6, .1], [17.3, -.4]].map(([x, z], n) => lantern(S, x, H_GRASS, z, n));
    const mills = [pinwheel(S, 8.2, H_GRASS, 6.1, '#9ed9cf', '#f2c65c'), pinwheel(S, -8.0, H_HILL, -4.4, '#f4a6c4', '#f6efe2')];
    const clocks = [[-9.5, 5.5], [-8.6, 6.4], [-7.4, 5.3], [1.6, 6.6], [10.2, 4.4], [11.3, 5.5], [-11.0, -1.4], [8.2, -2.7], [13.6, -2.0], [15.5, 2.4]].map(([x, z], i) => dandelion(S, x, H_GRASS, z, i + 1));
    const flies = { vlinder1: butterfly(S, -6.5, 4.6, 'w1'), vlinder2: butterfly(S, 9.5, -1.6, 'w2', '#bba6ea', '#f6efe2'), vlinder3: butterfly(S, 22.0, .6, 'w3', '#f2c65c', '#e98f8f') };

    /* ---------------- trees in blossom, and flowers everywhere: this is the flower meadow ---------------- */
    const keepOff = [[W[0] - 1, W[1] - 2.4, W[0] + 4, W[1] + 2.4], [1.2, -8, 5.4, -3.2], [3.2, 3.0, 9.2, 9.8], [8.2, -7.4, 13.2, -2.6], [18.0, -6, 29.5, 2.8], [-8.8, -8.6, -3.6, -3.6]];
    const blossom = [['#f4a6c4', '#f8dde4'], ['#f6efe2', '#fcf8f1'], ['#a3bf76', '#bccb84'], ['#f2c65c', '#f6dfa6']], R = rng(461); let n = 0;
    for (let i = 0; i < 1600 && n < 18; i++) {
      const x = -14 + R() * 44, z = -10 + R() * 20, c = blossom[Math.floor(R() * blossom.length)];
      const on = inPoly(HILL, x, z) ? HILL : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null;
      if (!on || edgeDist(on, x, z) < .6 || inPoly(TOP, x, z) || (on !== HILL && edgeDist(HILL, x, z) < .8) || inPoly(POOL, x, z) || edgeDist(POOL, x, z) < 1 || inPoly(CLIFF, x, z) || edgeDist(CLIFF, x, z) < .8) continue;
      if (keepOff.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1) || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .7) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < 1.6)) continue;
      S.lollipop(x, z, on === HILL ? H_HILL : H_GRASS, .5 + R() * .3, c[0], c[1], 470 + n, 1 + R() * .5); n++;
    }
    const grass = meadow(S, 520, R2 => {
      const x = -15 + R2() * 46, z = -11 + R2() * 22, on = inPoly(TOP, x, z) ? TOP : inPoly(HILL, x, z) ? HILL : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null;
      if (!on || edgeDist(on, x, z) < .3 || (on === GRASS && edgeDist(HILL, x, z) < .3) || (on === HILL && edgeDist(TOP, x, z) < .3) || inPoly(POOL, x, z) || edgeDist(POOL, x, z) < .3 || inPoly(CLIFF, x, z) || edgeDist(CLIFF, x, z) < .3) return null;
      if (laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || Math.abs(x - 3.2) < 1.5 && z > -6.9 && z < -3.4 || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .45)) return null;
      return [x, on === TOP ? H_TOP : on === HILL ? H_HILL : H_GRASS, z];
    }, 462, 4.6, undefined, bunch);

    const NOTES = [392, 440, 523.3, 587.3, 659.3]; let sung = 0, hopping = false;
    const [px0, pz0] = S.at([18.9, -3.4]), [px1, pz1] = S.at([28.1, -2.7]), sx = stones.map(s => S.at([s.x, s.z])[0]);
    return {
      start: [W[0] + 1.4, W[1]], uni: [W[0] + .4, W[1] + .5],
      shadow: { follow: 20 }, back: BACK, sky: 2,
      step(e) {
        const { dt, tick, stepped } = e;
        bakery.step(e); theKite.step(e); theBalloon.step(e); bunch.step(e); grass.step(e);
        for (const q of [...benches, ...lamps, ...mills, ...clocks, ...Object.values(flies), ...Object.values(folk), ...Object.values(herd)]) q.step(e);
        if (stepped) { const on = Math.floor(tick / 2) % 3; fall.forEach((g, i) => { g.visible = i === on; }); }
        // the stones: stepping onto one makes it dip and sing its note (hers to play, like keys)
        // between two stones she is in the air: a hop as high as the gap is wide, so where she is says how high she is
        if (!S.playing() && girl.x > px0 && girl.x < px1 && girl.z > pz0 && girl.z < pz1) { let gap = 0; const ends = [px0 + .15, ...sx.flatMap(x => [x - .46, x + .46]), px1 - .15]; for (let k = 0; k < ends.length; k += 2) if (girl.x > ends[k] && girl.x < ends[k + 1]) gap = Math.sin((girl.x - ends[k]) / (ends[k + 1] - ends[k]) * Math.PI); girl.lift = gap * .24; hopping = true; }
        else if (hopping) { hopping = false; if (!S.playing()) girl.lift = 0; }
        stones.forEach((s, i) => { const on = !S.playing() && !(girl.lift > .05) && Math.abs(girl.x - S.at([s.x, s.z])[0]) < .5 && Math.abs(girl.z - S.at([s.x, s.z])[1]) < .5; if (on && !s.on) { s.dip = 1; sung++; sfx.note(NOTES[i]); S.confetti(...S.at([s.x, s.z]).flatMap((v, k) => k ? [.12, v] : [v]), ['#bfe3ea', '#f6efe2'], 5, undefined, 1.2); } s.on = on; if (s.dip > 0) s.dip = Math.max(0, s.dip - dt * 3); s.g.position.y = -.05 * Math.sin(s.dip * Math.PI); });
      },
      toys: { ...flies, ...folk, ...herd, vlieger: theKite, ballon: theBalloon, bos: bunch, gras: grass, molen: mills[0], bank: benches[0], paardenbloem: clocks[0], stenen: { state: () => ({ sung }) }, duiken: { state: () => ({ found, snorkel: S.gear.snorkel, swimming: !!girl.swimming }) } },
      shots: [
        { name: 'heuvel', zone: [-10.6, -9.4, .6, -2.3], span: 17, tall: 9.5, rise: .4 },          // on the hill: further back, to see the meadow below and the kite above
        { name: 'waterval', zone: [18.4, -6.2, 29.2, -.5], span: 12.5, rise: .4 },                  // at the pool: looking down on the stones
        { name: 'wei', span: 15, tall: 8.5, rise: .3 },
      ],
      spots: { ballon: [10.6, 3.3, -5.0], vlieger: [-6.4, H_TOP + .3, -6.5] },
      places: { start: [W[0] + 1.4, W[1]], cross: [X[0], X[1]], hill: [-4.6, -3.4], top: [-6.4, -5.6], balloon: [11.6, -4.3], bakery: [3.2, -4.3], pool: [19.4, -2.2], far: [28.4, -2.6], south: [-.5, 9.1], sheep: [6.3, 6.4] },
    };
  },
};
