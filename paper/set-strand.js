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
import { befriend } from './companion.js';
import { strandLand, regenboogLand, ORIGIN, BACK } from './lands.js';
import { voyage } from './voyage.js';
import { ferry } from './boat.js';
import { jetty, swimmer } from './swim.js';
import { findSpots, inOval, plantAt, beachGrass, starfish, driftwood, rowboat } from './flora.js';
import { hookGap } from './gear.js';
import { frisbee, kite } from './toys.js';
import { digging, sealBall, iceCream, lifeguard, sunbather } from './beach2.js';
import { CARDS3 } from './cards3.js';
import { lagoon } from './lagoon.js';
import { musician } from './folk.js';
import { PEOPLE2, PROPS2 } from './people2.js';

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
    // (the bridge has a gap in the middle: the planks are gone. The hookshot pulls her over, gear.js)
    const GAP = [-16.6, -13.4], spare = new THREE.Group(); spare.visible = false; spare.userData.live = true; root.add(spare);
    for (let z = BR.z0; z < BR.z1; z += .32) { const pl = slab(rect(BR.x0 - .05, z, BR.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat); if (z > GAP[0] - .1 && z < GAP[1] - .2) spare.add(pl); else root.add(pl); }
    for (let z = BR.z1 - 1.2; z > BR.z0 + .6; z -= 1.7) if (z < GAP[0] - .4 || z > GAP[1] + .4) for (const x of [BR.x0, BR.x1]) post(x, z);
    const gap = hookGap(S, 0, GAP[0], GAP[1], DECK, spare);
    { const st = new THREE.Mesh(new THREE.CylinderGeometry(.27, .3, .3, 9), P('#d9cfc2')); st.position.set(8.1 - .24, H_SAND + .15, 1.55); st.castShadow = true; root.add(st); }
    const guitar = musician(S, 'gitarist', PEOPLE2.gitarist, PROPS2.noot2, 8.1, 1.6, { sound: () => S.sfx.song('oldmac', 'guitar'), play: [0, 1], rest: 2, end: 3, from: [-.05, .6], loop: 4.6, guests: () => [live.krab, live.schildpad] });   // she plays the guitar under the parasol (folk.js)
    const disc = frisbee(S, -1.0, H_SAND, 5.5);   // a frisbee on the sand: she throws, the unicorn fetches (toys.js)
    for (let z = PIER.z0; z < HEAD.z0; z += .32) root.add(slab(rect(PIER.x0 - .05, z, PIER.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat));
    for (let z = HEAD.z0; z < HEAD.z1; z += .32) root.add(slab(rect(HEAD.x0 - .05, z, HEAD.x1 + .05, z + .28), DECK, .06, P('plank'), edgeMat));
    for (let z = PIER.z0 + 1.6; z < HEAD.z0; z += 1.7) for (const x of [PIER.x0, PIER.x1]) post(x, z);
    const perch = [[HEAD.x0, HEAD.z1 - .1], [HEAD.x1, HEAD.z1 - .1], [HEAD.x0, HEAD.z0 + .1]]; for (const [x, z] of perch) post(x, z, 2.4, DECK + .9);   // the tall posts at the pier's head: the gull's
    post(HEAD.x1, HEAD.z0 + .1);

    S.sea({ land: [SAND, SEALROCK], x0: -40, x1: 40, z0: -26, z1: 30, deep: [230, 180, 0, 0], fine: 1.8 });
    const pool = lagoon(S, { y: H_SAND, cx: 5.9, cz: 6.1, rx: 3.05, rz: 1.42 });   // the bathing lagoon in the south-east, between the pier and the lifeguard: anybody swims there (lagoon.js; its water before the sand's floor)

    S.floorBox(DECK, BR.x0, BR.z0, BR.x1, BR.z1); S.floorBox(DECK, PIER.x0, PIER.z0, PIER.x1, HEAD.z0 + .1); S.floorBox(DECK, HEAD.x0, HEAD.z0, HEAD.x1, HEAD.z1);
    S.floor(H_ROCK, ROCK); S.floor(H_DUNE, DUNE); S.floor(H_SAND, SAND, .22);

    /* ---------------- paths: boards laid on the sand ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_SAND) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_SAND + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    lay(ribbon([[0, BR.z1 - .2], [.3, -6.2], [-.4, -3.6], [.2, -1.2], [1.2, 1.6], [1.9, 4.6], [2.0, PIER.z0 + .3]], .85, 531), 'path');     // from the bridge down to the pier
    stepping([[1.6, -2.6], [2.9, -2.9], [4.2, -3.1], [5.5, -3.2], [6.8, -3.3], [8.1, -3.35]], 540);                                       // east, to the lighthouse
    stepping([[-.9, -4.4], [-1.9, -4.2], [-2.9, -3.9]], 550);                                                                             // west, up onto the dune
    stepping([[.4, 1.6], [-.6, 2.2], [-1.6, 2.7]], 555);
    stepping([[3.4, .7], [4.8, .5], [6.2, .2], [8.6, .1], [10.0, .0], [11.4, -.05], [12.8, -.05], [14.0, 0]], 557);                                                   // east, to the bridge to the rainbow island (set-regenboog.js)                                                                                  // to the sandcastle

    /* ---------------- things ---------------- */
    const light = lighthouse(S, 11.5, H_ROCK, -3.6), castle = sandcastle(S, -3.4, H_SAND, 3.2), bunch = bouquet(S);
    const palms = [[-12.2, -1.2, 1], [-10.6, 2.4, 2], [-4.2, -6.6, 3], [5.6, -6.6, 4], [8.6, -6.9, 5], [7.0, -7.3, 6], [-1.9, -7.7, 7]].map(([x, z, n]) => palm(S, x, inPoly(DUNE, x, z) ? H_DUNE : H_SAND, z, 560 + n, 2.3 + (n % 3) * .3));
    parasol(S, -7.6, H_SAND, 3.3); parasol(S, 7.4, H_SAND, 1.2, '#9ed9cf', '#fbf5ea');
    const benches = [bench(S, -8.6, H_SAND, 3.5)];
    const lamps = [];   // (the lighthouse is the beach's light)
    driftwood(S, -11.2, H_SAND, 5.4, .4);   // (the little blue boat is the real one now, at its jetty: boat.js)
    driftwood(S, 4.4, H_SAND, -5.6, -.3, 1.1); driftwood(S, -1.6, H_SAND, 7.4, 1.1, .9);
    const mills = [];
    for (const [cx, cz] of [[-7.6, -2.0], [9.4, -.8], [2.4, 15.4], [-5.0, 7.8]]) S.coinAt(cx, cz);   // coins lying about: on the dune, by the lighthouse, at the end of the pier, by the turtle
    const live = {
      krab: befriend(S, crab(S, 5.2, 3.6, [[5.2, 3.6], [8.2, 5.0], [3.9, 1.2]]), { speed: 2.4, hop: .8, gap: 1.0, hello: () => S.sfx.click() }),   // the beach's companion: it scuttles after her (companion.js)
      schildpad: turtle(S, -6.2, 6.4, [[-6.2, 6.4], [-2.6, 7.2], [-10.2, 5.2]]),
      meeuw: gull(S, [[perch[0][0], perch[0][1], DECK + .9], [perch[1][0], perch[1][1], DECK + .9], [perch[2][0], perch[2][1], DECK + .9]]),
      zeehond: seal(S, 5.4, 14.45, -.3),
    };
    S.featherFrom(live.meeuw.f, 'meeuw'); pool.wade(live.krab.f);   // (the crab, following her into the lagoon, is in it up to its middle)
    // more to do, and more people (beach2.js): the spade and the treasure, the seal's ball, the fish kite, the ice cream man, the lifeguard, the sunbather
    const digOk = (x, z) => inPoly(SAND, x, z) && edgeDist(SAND, x, z) > .7 && !inPoly(DUNE, x, z) && edgeDist(DUNE, x, z) > .3 && !inPoly(ROCK, x, z) && !laid.some(o => inPoly(o, x, z)) && !(x > PIER.x0 - .4 && x < PIER.x1 + .4 && z > PIER.z0 - .4) && !pool.has(x, z);
    const spade = digging(S, -1.6, 4.0, H_SAND, [-8.8, 5.6], digOk), sealToy = sealBall(S, live.zeehond, [1.2, 14.7], DECK);
    const fishKite = kite(S, -9.6, H_DUNE, -3.2, () => true, CARDS3.viskite, 'viskite');   // (the whole beach is windy)
    const people = { ijsverkoper: iceCream(S, -5.6, .3), badmeester: lifeguard(S, 9.75, 6.25), zonnebader: sunbather(S, 11.9, 3.3) }; people.badmeester.f.face = -1;   // (the lifeguard on her chair at the lagoon's east end, looking out over it)   // the gull's feather for the wings (paper.js)
    // the boat to the rainbow island, at a short jetty where the bridge used to start (boat.js): the rainbow island's end of it is its jetty (set-regenboog.js)
    const RB = { z0: -.6, z1: .6 }, JX = 14.3, JE = JX + 2.2, RBJ = regenboogLand().bridge, rb = [ORIGIN.regenboog[0] - ORIGIN.strand[0], ORIGIN.regenboog[1] - ORIGIN.strand[1]];   // (the beach's jetty, out east where the old bridge began; the island's, far out at sea)
    for (let x = JX; x < JE; x += .32) root.add(slab([[x, RB.z0 - .05], [x + .28, RB.z0 - .05], [x + .28, RB.z1 + .05], [x, RB.z1 + .05]], -.12, .06, paper('#c9a878'), edgeMat));
    for (const x of [JX + 1.1, JE - .15]) for (const z of [RB.z0, RB.z1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), paper('#8d6a48')); m.castShadow = true; m.position.set(x, -.72, z); root.add(m); }
    S.floorBox(-.12, JX, RB.z0, JE, RB.z1);
    const theBoat = ferry(S, [{ stand: S.at([JE - .3, 0]), moor: S.at([JE + 1.2, 0]) }, { stand: S.at([rb[0] + RBJ.x1 - 1.9, rb[1]]), moor: S.at([rb[0] + RBJ.x1 - 3.4, rb[1]]), low: true, open: () => !S.shared.island || S.shared.island.risen() }]);
    jetty(S, 'strand', [JX, 0], [1, 0], -.12, JE - JX, false);   // (the swim ring at the boat's jetty: swim.js)
    const theSwim = S.shared.swim = swimmer(S);   // her grown unicorn swims her from jetty to jetty (swim.js)
    const theVoyage = voyage(S, theBoat, { x: ORIGIN.regenboog[0] - 13.5, z: ORIGIN.regenboog[1] + .6 });   // (the last ring waits over the sunk island, west of its rainbow)   // what she meets on the way (voyage.js)
    // beach grass on the dune (with flowers to pick), and shells and pebbles on the sand
    const grass = meadow(S, 0, R2 => { const x = -13.5 + R2() * 12.5, z = -7.2 + R2() * 7.2; if (!inPoly(DUNE, x, z) || edgeDist(DUNE, x, z) < .3 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5)) return null; return [x, H_DUNE, z]; }, 562, 10, ['#a8bd7c', '#b9c98a', '#93ad6a'], bunch);
    // planted, not scattered (PLAN.md): beach grass in clumps round the dune, the shells where the sea left them (a line along
    // the south shore, and two heaps), starfish in threes by the water
    { const BR2 = rng(563), duneOk = (x, z) => inPoly(DUNE, x, z) && edgeDist(DUNE, x, z) > .22 && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .25) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5);
      const sandOk = (x, z) => inPoly(SAND, x, z) && edgeDist(SAND, x, z) > .5 && !inPoly(DUNE, x, z) && edgeDist(DUNE, x, z) > .3 && !inPoly(ROCK, x, z) && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .25) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .7) && !(x > PIER.x0 - .6 && x < PIER.x1 + .6 && z > PIER.z0 - 1.5) && !pool.has(x, z);
      plantAt(S, findSpots(BR2, 13, 1.6, R2 => [-13.5 + R2() * 12.5, -7.2 + R2() * 7.2], duneOk).flatMap(([cx, cz]) => inOval(BR2, cx, cz, .5, .34, 5, .16, duneOk).map(([x, z]) => [x, H_DUNE, z])), 563, beachGrass);
      const shore = x => { for (let z = 9.6; z > 0; z -= .05) if (inPoly(SAND, x, z) && edgeDist(SAND, x, z) > 1.0) return z; return null; }, cols = ['#fbf5ea', '#f4c6b8', '#e8d5b0', '#cbc5d6', '#f6dfa6'], shells = [];
      for (let x = -12.4; x < 12.6; x += .2 + BR2() * .3) { const z0 = shore(x); if (z0 === null) continue; const z = z0 - .15 + Math.sin(x * 1.3) * .22 + (BR2() - .5) * .2; if (sandOk(x, z)) shells.push([x, z]); }
      for (const [hx, hz] of [[-5.6, 1.2], [6.6, -1.4]]) for (const [x, z] of inOval(BR2, hx, hz, .5, .34, 9, .13, sandOk)) shells.push([x, z]);
      shells.forEach(([x, z], k) => { const st = slab(circlePts(.05 + BR2() * .06, 580 + k, 9).map(([px, pz]) => [px * (1 + BR2() * .5), pz]), H_SAND + .03, .03, paper(cols[k % cols.length]), whiteEdge); st.position.set(x, 0, z); st.rotation.y = BR2() * 3; root.add(st); });
      plantAt(S, [[-9.6, 6.0], [4.0, 8.15], [12.2, 2.2]].flatMap(([cx, cz]) => inOval(BR2, cx, cz, .5, .36, 3, .28, sandOk).map(([x, z]) => [x, H_SAND, z])), 564, starfish); }

    return {
      start: [0, -7.4], uni: [-.8, -7.0],
      shadow: { follow: 20 }, back: BACK, sky: 2.6,
      step(e) {
        theBoat.step(e); theVoyage.step(e); theSwim.step(e); spade.step(e); sealToy.step(e); fishKite.step(e); for (const q of Object.values(people)) q.step(e);
        light.step(e); castle.step(e); bunch.step(e); grass.step(e); gap.step(e); disc.step(e); guitar.step(e); pool.step(e);
        for (const q of [...palms, ...benches, ...lamps, ...mills, ...Object.values(live)]) q.step(e);
      },
      toys: { ...live, ...people, ...pool.toys, schep: spade, zeehondbal: sealToy, viskite: fishKite, boot: theBoat, voyage: theVoyage, zwemmen: theSwim, gitarist: guitar, frisbee: disc, kloof: gap, vuurtoren: light, zandkasteel: castle, palm: palms[2], bos: bunch, gras: grass, bank: benches[0] },
      shots: [
        { name: 'brug-zuid', zone: [-1.1, BR.z0 + .9, 1.1, BR.z1 - .2], span: 24, tall: 13, rise: .55, dof: .7, range: 2.2, play: false },   // the bridge from the meadow: far back and high
        { name: 'pier', zone: [.2, 9.4, 3.8, 16.2], span: 13, tall: 8, rise: .5 },                                                           // out on the pier: looking down on the water, the gull and the seal
        { name: 'vuurtoren', zone: [8.2, -5.8, 14.2, -1.2], span: 16, tall: 10, rise: .34 },                                                 // by the lighthouse: back far enough to see its lamp
        pool.shot,                                                                                                                            // by the bathing lagoon: a little lower and closer (lagoon.js)
        { name: 'strand', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { paal: [.82, DECK + .6, GAP[1] + .3], paalnoord: [.82, DECK + .6, GAP[0] - .3], zandkasteel: [-3.6, .08, 3.75], vuurtoren: [11.5, 1.6, -3.6], palm: [-4.2, 1.6, -6.6], bank: [-8.6, .1, 3.63] },
      places: { start: [0, -7.4], castle: [-3.5, 4.3], light: [10.6, -1.9], pier: [2.0, 15.0], dune: [-6.6, -2.8], crab: [5.2, 4.6], turtle: [-6.2, 7.0], spade: [-1.2, 4.4], cross: [-8.8, 6.3], icecream: [-4.2, 1.2], lifeguard: [9.0, 7.0], sunbather: [11.6, 4.4], ...pool.places, kite: [-9.2, -2.8], north: [0, BR.z0 + 2], lip: [0, GAP[1] + 1.2] },
    };
  },
};
