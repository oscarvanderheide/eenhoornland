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
import { baker, painter, musician } from './folk.js';
import { PEOPLE2, PROPS2 } from './people2.js';
import { sheep, lamb, otter, star } from './critters2.js';
import { gift, SNORKEL } from './gear.js';
import { scatter, goldGrass } from './flora.js';
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
    S.door('waterval', [22.6, fallZ - .1, 24.4, fallZ + .75], [23.5, fallZ + 1.5], [0, -1], true);   // under the fall: the way into the cave behind it (set-grot.js); she has to swim there
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
    const folk = { bakker: baker(S, 4.75, -4.35), schilder: painter(S, 15.9, -3.9), fluitist: musician(S, 'fluitist', PEOPLE2.fluitist, PROPS2.noot2, -8.2, -3.5, { sound: () => S.sfx.flute(), play: [0, 1], rest: 2, end: 3, from: [.45, .98] }) };   // the baker by his door, the painter painting the waterfall (folk.js)
    const herd = { schaap: sheep(S, 5.2, 5.1), schaap2: sheep(S, 7.5, 5.9, 'schaap2'), lam: lamb(S, 6.5, 4.4), otter: otter(S, 21.6, -1.75, [[21.6, -1.75], [25.6, -1.9], [21.6, -4.3]], o => { if (!S.gear.snorkel && !S.playing()) { found++; present([o.x, .35, o.z], () => { S.gear.snorkel = true; }); } }) };   // critters2.js
    herd.schaap2.f.face = -1;
    herd.ster = star(S, [[-5.3, H_TOP + .22, -6.0], [-2.1, H_HILL + .22, -4.2], [1.5, H_GRASS + .22, 1.0]]);   // the warm star that hatches the egg: on the hill's top, then lower, then by the crossing
    const benches = [bench(S, -3.0, H_HILL, -4.5), bench(S, 29.6, H_GRASS, -3.6)];
    const lamps = [[X[0] + 2.4, X[1] + 1.3], [17.3, -.4]].map(([x, z], n) => lantern(S, x, H_GRASS, z, n));
    const mills = [];   // (the toy windmills are the village's)
    // dandelion clocks stand together, in two corners of their own
    const CLOCKS = [[-3.4, 6.2], [-2.6, 6.9], [-3.9, 7.1], [-2.9, 7.7], [-4.4, 6.4], [12.6, -1.5], [13.5, -2.1], [12.9, -2.7], [14.2, -1.4], [13.8, -2.9]];
    const clocks = CLOCKS.map(([x, z], i) => dandelion(S, x, H_GRASS, z, i + 1));
    const flies = { vlinder1: butterfly(S, -6.5, 4.6, 'w1'), vlinder2: butterfly(S, 9.5, -1.6, 'w2', '#bba6ea', '#f6efe2'), vlinder3: butterfly(S, 22.0, .6, 'w3', '#f2c65c', '#e98f8f') };

    /* ---------------- planting, composed ----------------
       Oscar, 2026-11-27: flowers and tufts scattered at random over the whole lawn looked messy, and without them it is
       empty. So, the way a garden or a model is planted (and the way the toy-like Zelda islands and Animal Crossing do it):
         1. Things grow in patches, never singly. Between the patches the lawn is bare, and that bareness is the calm.
         2. A patch is a cut of other grass with ONE kind of flower in one family of colours: thick and tall in the middle,
            thinning out, a few tufts at its rim.
         3. Tall things (golden grass, trees) stand at the back and the sides. Trees stand in groves of two or three of one
            colour, with tufts at their feet; none where it would hide her on a path.
       Every patch is placed by hand here; only the places inside a patch are left to chance. */
    const bare = (x, z) => { const on = inPoly(HILL, x, z) ? null : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null; return !!on && edgeDist(on, x, z) > .35 && edgeDist(HILL, x, z) > .35 && !inPoly(POOL, x, z) && edgeDist(POOL, x, z) > .35 && !inPoly(CLIFF, x, z) && edgeDist(CLIFF, x, z) > .35 && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .25) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5); };
    const cut = (cx, cz, rx, rz, seed, mat) => { const up = .012 + (layer++) * .003; root.add(slab(blob(cx, cz, rx, rz, seed, 28, .09), H_GRASS + up, up, mat, mat)); return H_GRASS + up; };   // a patch of other grass (not in `laid`: things grow on it)
    const DRIFTS = [   // (a flower's colour has to be one its kind knows: see bloom in props.js)
      { at: [-10.4, -.5], r: [2.3, 1.3], kind: 'tulip', cols: ['#e98f8f', '#d9706c', '#f4a6c4'], n: 24 },      // red and pink tulips, north of the way in
      { at: [-8.6, 5.7], r: [2.6, 1.4], kind: 'daisy', cols: ['#f2efe6'], n: 26 },                             // a field of white daisies in the south-west
      { at: [-4.6, 4.4], r: [1.6, .9], kind: 'daisy', cols: ['#f4a6c4'], n: 14 },                              // pink daisies south of the path
      { at: [1.7, 7.3], r: [1.9, 1.1], kind: 'spike', cols: ['#bba6ea', '#9ed9cf'], n: 19 },                   // lilac and mint spikes by the south path
      { at: [.3, -1.5], r: [1.4, .9], kind: 'rose', cols: [null], n: 14 },                                     // roses between the hill and the bakery
      { at: [9.2, 2.5], r: [1.3, .7], kind: 'spike', cols: ['#bba6ea'], n: 12 },                               // lilac spikes beside the sheep
      { at: [13.2, 4.3], r: [2.6, 1.4], kind: 'tulip', cols: ['#f2c65c'], n: 24 },                             // yellow tulips east of the sheep
      { at: [20.4, 1.7], r: [1.9, 1.0], kind: 'spike', cols: ['#f4a6c4'], n: 16 },                             // pink spikes on the pool's near bank
      { at: [6.8, -1.6], r: [1.5, .9], kind: 'daisy', cols: ['#f2c65c', '#f2efe6'], n: 14 },                   // yellow and white daisies below the balloon
      { at: [14.2, -5.3], r: [2.6, 1.3], gold: 40 }, { at: [-11.4, -4.7], r: [1.7, 1.0], gold: 24 }, { at: [25.5, 3.6], r: [2.2, 1.1], gold: 30 },   // golden grass, at the back and the far side
    ];
    const spots = [], golden = [], R = rng(461);
    DRIFTS.forEach((d, k) => {
      const [cx, cz] = d.at, [rx, rz] = d.r, y = cut(cx, cz, rx + .45, rz + .4, 480 + k, d.gold ? GROUND.high : GROUND.wood), mine = [];
      for (let i = 0, tries = 0; i < (d.gold || d.n) && tries < 600; tries++) { const a = R() * 6.283, rr = Math.pow(R(), .75), x = cx + Math.cos(a) * rx * rr, z = cz + Math.sin(a) * rz * rr; if (!bare(x, z) || mine.some(([px, pz]) => Math.hypot(px - x, pz - z) < (d.gold ? .22 : .26))) continue; mine.push([x, z]); i++;
        if (d.gold) golden.push([x, y, z]); else spots.push([x, y, z, { kind: d.kind, col: d.cols[i % d.cols.length], big: 1.3 - rr * .4 }]); }
      if (!d.gold) for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + R(), x = cx + Math.cos(a) * (rx + .15), z = cz + Math.sin(a) * (rz + .12); if (bare(x, z)) spots.push([x, y, z, { tuft: true }]); }
    });
    cut(-3.4, 6.9, 1.5, 1.1, 495, GROUND.high); cut(13.4, -2.2, 1.4, 1.1, 496, GROUND.high);   // the dandelions' two corners
    // groves: two or three trees of one colour together, at the back and the sides
    const blossom = { pink: ['#f4a6c4', '#f8dde4'], white: ['#f6efe2', '#fcf8f1'], yellow: ['#f2c65c', '#f6dfa6'] };
    const GROVES = [['pink', H_GRASS, [[-12.2, -1.6], [-13.1, -2.6]]], ['white', H_GRASS, [[.9, -7.0], [.2, -8.0]]], ['yellow', H_GRASS, [[6.4, -7.3], [7.5, -6.5], [5.7, -6.2]]], ['pink', H_GRASS, [[15.0, -6.9], [16.2, -7.5]]], ['white', H_GRASS, [[10.4, 8.0], [11.5, 7.4]]], ['yellow', H_HILL, [[-1.6, -6.4], [-2.4, -7.2]]]];
    let n = 0; for (const [c, y, trees] of GROVES) for (const [x, z] of trees) { S.lollipop(x, z, y, .52 + R() * .26, blossom[c][0], blossom[c][1], 470 + n, 1 + R() * .5); n++; for (const dx of [-.34, .3]) spots.push([x + dx, y, z + .16 + R() * .1, { tuft: true }]); }
    let si = 0; const grass = meadow(S, spots.length, () => spots[si++] || null, 462, 0, ['#7f9d5e', '#8fb06c', '#86a466'], bunch);
    { let gi = 0; scatter(S, golden.length, () => golden[gi++] || null, 463, goldGrass); }

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
      toys: { ...flies, ...folk, ...herd, vlieger: theKite, ballon: theBalloon, bos: bunch, gras: grass, bank: benches[0], paardenbloem: clocks[0], stenen: { state: () => ({ sung }) }, duiken: { state: () => ({ found, snorkel: S.gear.snorkel, swimming: !!girl.swimming }) } },
      shots: [
        { name: 'heuvel', zone: [-10.6, -9.4, .6, -2.3], span: 17, tall: 9.5, rise: .4 },          // on the hill: further back, to see the meadow below and the kite above
        { name: 'waterval', zone: [18.4, -6.2, 29.2, -.5], span: 12.5, rise: .4 },                  // at the pool: looking down on the stones
        { name: 'wei', span: 15, tall: 8.5, rise: .3 },
      ],
      spots: { ballon: [10.6, 3.3, -5.0], vlieger: [-6.4, H_TOP + .3, -6.5] },
      places: { start: [W[0] + 1.4, W[1]], cross: [X[0], X[1]], hill: [-4.6, -3.4], top: [-6.4, -5.6], balloon: [11.6, -4.3], bakery: [3.2, -4.3], pool: [19.4, -2.2], far: [28.4, -2.6], south: [-.5, 9.1], sheep: [6.3, 6.4], fall: [23.5, -4.1] },
    };
  },
};
