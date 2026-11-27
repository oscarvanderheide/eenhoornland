// The village, as a blockout: grey card stand-ins on real ground, with her real house. Nothing else here is drawn yet. It exists to answer three questions before any
// drawing is done: does a set of this size run on the phone, do the camera's shots work with the controls, and how small
// does she get. Everything stands where the pixel game's map (js/map.js) has it, scaled down: T() below turns a tile of
// that map into a place on this set, so the old map's spots keep their meaning. Only places come from the map: the shape of
// every path, square and patch is cut by hand, never a row of tiles. The numbers are copied, never imported
// (the site takes only paper/ from this branch). Trees, sea and shadows are the real thing, at the real count: they are
// what the phone pays for.
import { THREE, rng, paper, slab, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { cottage, shore, flowerBed, bouquet, meadow, pinwheel, fountain, bench, lantern, bramble, stall, pondDress, GROUND } from './props.js';
import { swing, slide, seesaw, plane } from './toys.js';
import { dog, ball } from './dog.js';
import { hen, chick, pig, duck, butterfly } from './critters.js';
import { farm, well, scarecrow } from './farm.js';
import { grandma, gardener, fisher, player } from './folk.js';
import { dolphin } from './critters2.js';
import { findSpots, inOval } from './flora.js';
import { STORY } from './story.js';
import { dorpLand, bosLand, weiLand, ORIGIN, BACK, SPREAD } from './lands.js';

/** a tile of the pixel game's map -> a place on this set (the fountain square is the middle; 0.6 of a step per tile, spread out by SPREAD) */
const K = SPREAD, T = (x, z) => [(x - 31) * .6 * K, (z - 42) * .6 * K];
/** a list of places written at the old, cramped measure -> where they are now */
const kk = pts => pts.map(([x, z]) => [x * K, z * K]), kz = zone => zone.map(v => v * K);
const GREY = { sand: '#ded7c9', grass: '#c9c6b9', high: '#d5d1c5', path: '#e6e1d6', thing: '#b4afa4', dark: '#8f8a80', roof: '#a39e94', water: '#9db3b8', soil: '#b3a797', mud: '#9c8f80' };
const H_SAND = -.32, H_GRASS = 0, H_HIGH = .48;

export default {
  name: 'dorp',
  build(S) {
    const root = S.root, P = c => paper(GREY[c]);
    const put = (m, x, y, z) => { m.position.set(x, y, z); root.add(m); return m; };
    const box = (w, h, d, c = 'thing') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const cyl = (r, h, c = 'thing', n = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

    /* ---------------- the land: a beach, the green, and a terrace in the north where her house stands ---------------- */
    const { SAND, GRASS, SAND_S, GRASS_S, SAND_W, GRASS_W, HIGH } = dorpLand();
    // the ground is the island's real printed paper (it costs what it will cost); what stands on it is still grey
    const sandP = GROUND.sand, grassP = GROUND.grass, highP = GROUND.high;
    shore(S, [...[SAND, SAND_S, SAND_W].map(o => [o, H_SAND, .55, sandP]), ...[GRASS, GRASS_W, GRASS_S].map(o => [o, H_GRASS, .32, grassP]), [HIGH, H_HIGH, .48, highP]]);   // (no darker card under the land here: out in the water it showed as brown ledges between the waves)

    // stairs down from the terrace: in front of her door (south), and at its east end where the street goes on to the bridge
    const edge = (poly, at, axis) => { let best = -99; for (let v = -30; v <= 30; v += .01) if (axis === 'z' ? inPoly(poly, at, v) : inPoly(poly, v, at)) best = v; return best; };
    const stairs = [];
    const steps = (dir, at, half) => {
      const lip = edge(HIGH, at, dir === 's' ? 'z' : 'x');
      for (let i = 0; i < 3; i++) {
        const far = lip + .05 + (2 - i) * .42, h = (i + 1) * .16 - .02;
        const b = dir === 's' ? [at - half, far - .5, at + half, far] : [far - .5, at - half, far, at + half];
        root.add(slab(rect(...b), h, h + .02, P('path'), edgeMat)); stairs.push({ b, h });
      }
    };
    steps('s', .3 * K, .55); steps('e', -3.4 * K, .55);

    // the bridges: planks on posts. East to the meadow; north to the forest, which is a set of its own standing in the same
    // world (lands.js): the bridge is this set's, all the way to the forest's shore
    const NORTH = { x0: 6 * K - .6, x1: 6 * K + .6, z0: ORIGIN.bos[1] + bosLand().bridge[1] - .7, z1: -5.5 * K }, EAST = { x0: 8.3 * K, x1: ORIGIN.wei[0] + weiLand().bridge[0] + .6, z0: 2.4 * K - .6, z1: 2.4 * K + .6 }, DECK = -.12;   // (the meadow is a set of its own too: this bridge is the village's, all the way over)
    for (let z = NORTH.z0; z < NORTH.z1; z += .32) root.add(slab(rect(NORTH.x0 - .05, z, NORTH.x1 + .05, z + .28), DECK, .06, P('thing'), edgeMat));
    for (let x = EAST.x0; x < EAST.x1; x += .32) root.add(slab(rect(x, EAST.z0 - .05, x + .28, EAST.z1 + .05), DECK, .06, P('thing'), edgeMat));
    for (let z = NORTH.z1 - 1.7; z > NORTH.z0 + .6; z -= 1.7) for (const x of [NORTH.x0, NORTH.x1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);
    for (let x = EAST.x0 + 2; x < EAST.x1 - .6; x += 1.7) for (const z of [EAST.z0, EAST.z1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);

    // the pond: a sheet of water lying in the green; nobody walks on it
    // the pond lies well west of the playground, in the middle of the west lobe (Oscar: they were too close)
    const [pcx, pcz] = [-11.6 * K, .5 * K], POND = blob(pcx, pcz, 2.2, 1.75, 86, 40, .05);
    root.add(slab(POND, H_GRASS + .02, .02, P('water'), whiteEdge));
    const pondLook = pondDress(S, POND, pcx, pcz, H_GRASS, 86);   // the deeper middle, the pebbles round it, lily pads, ripples (props.js)

    S.sea({ land: [SAND, SAND_S, SAND_W], x0: -60, x1: 60, z0: -22, z1: 34, deep: [230, 170, 0, 0], fine: 1.8 });

    // where she can stand: the first floor that holds the spot counts
    for (const s of stairs) S.floorBox(s.h, ...s.b);
    S.water(H_GRASS, POND);   // light water: with the snorkel she swims among the ducks
    S.floor(H_HIGH, HIGH);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_W); S.floor(H_GRASS, GRASS_S);
    S.floorBox(DECK, NORTH.x0, NORTH.z0, NORTH.x1, NORTH.z1); S.floorBox(DECK, EAST.x0, EAST.z0, EAST.x1, EAST.z1);
    for (const s of [SAND, SAND_S, SAND_W]) S.floor(H_SAND, s, .22);

    /* ---------------- the square, the paths, the patches: all cut by hand ----------------
       The old map gives where things are, never the shape of anything: nothing here lies on a grid. A path is a ribbon of card
       that winds (kit.js ribbon), a square is a blob, a side path is a row of stepping stones. */
    const laid = [];   // every outline lying on the ground, so no tree is planted on one
    // (each piece lies a hair higher than the one before: two flat cards at exactly the same height flicker where they overlap)
    let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stones = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    // every path starts inside the square's outline, so it is joined to it; benches and lanterns stand beside paths, never on them
    const SQ = [.6 * K, -.6 * K], F = [-1.2 * K, 9.6 * K];   // the middle of the fountain square; the middle of the farm in the south
    lay(blob(SQ[0], SQ[1], 3.3, 2.5, 61, 48, .05), 'high');                                                               // the square round the fountain
    lay(ribbon(kk([[-3.5, -3.5], [-1.6, -3.36], [.3, -3.46], [2.2, -3.36], [3.85, -3.45]]), .82, 62), 'path', H_HIGH);      // along the terrace, past her door
    lay(ribbon([[.3 * K, -2.9 * K + 1.3], [.34 * K, (-2.9 * K + SQ[1]) / 2], [SQ[0] - .3, SQ[1] - 2.0]], .95, 63, .04), 'path');                                                    // from the foot of the stairs onto the square
    lay(ribbon([[SQ[0] + .1, SQ[1] + 2.0], ...kk([[.4, 2.0], [.75, 3.4], [.15, 4.8], [-.7, 5.9], [-1.15, 6.9], [-1.2, 7.7]]), [F[0] + .3, F[1] - 2.9]], .85, 64), 'path');   // south, winding down to the farm's well
    lay(ribbon([[SQ[0] + 2.8, SQ[1] + .3], ...kk([[3.9, .5], [6.0, 1.85], [7.6, 2.45], [9.3, 2.4]])], .9, 65), 'path');                        // east to the bridge
    lay(ribbon([[SQ[0] - 2.8, SQ[1] - .2], ...kk([[-2.6, -1.3], [-4.6, -2.15], [-7.0, -2.3], [-9.0, -1.5]]), [pcx + 3.3, pcz - .9]], .8, 66), 'path');  // west, round the north of the playground to the pond
    lay(ribbon(kk([[6.0, -5.75], [5.9, -4.4], [5.35, -3.3], [5.5, -1.6], [6.05, .2], [6.5, 1.75]]), .85, 67), 'path');      // from the north bridge past the terrace's east stairs
    lay(blob(-5.3 * K, .3 * K, 4.4, 2.8, 68, 44, .06), sandP);                                                                 // the playground's sand
    stones([0, 1, 2, 3, 4].map(i => [3.4 * K + .4 + (4.6 * K - 3.4 * K - .4) * (1 - i / 4) * .35, 4.3 * K - 2.0 - i * .52]), 160);                                                 // to the gate of the unicorns' meadow

    /* ---------------- her house, on the terrace ---------------- */
    const HOUSE = cottage(S, .3 * K, H_HIGH, -5.5 * K, 'voordeur');     // the real one (props.js); its front door is a cut to the room inside (set-huis.js)
    // a flower garden on both sides of the house (Oscar's idea, 2026-11-26): two beds of paper flowers
    const bunch = bouquet(S);   // the flowers she has picked, from the beds or from the grass
    const beds = [-1, 1].map(s => flowerBed(S, .3 * K + s * 3.7, H_HIGH, -5.5 * K + .15, 320 + s, bunch, 3.6, 2.0, s < 0 ? ['#e98f8f', '#f2c65c'] : ['#bba6ea', '#f4a6c4']));
    // toy windmills (his idea too): one at the outer corner of each flower bed, one by the unicorns' gate, the playground, the pond. A tap, or running past, spins them
    const mills = [pinwheel(S, .3 * K - 5.75, H_HIGH, -5.5 * K + 1.15), pinwheel(S, .3 * K + 5.75, H_HIGH, -5.5 * K + 1.15, '#9ed9cf', '#f6efe2'), pinwheel(S, 3.4 * K - 2.3, H_GRASS, 4.3 * K - 2.5, '#bba6ea', '#f2c65c', .65),
      pinwheel(S, -5.3 * K + 3.9, H_GRASS, .3 * K + 2.9, '#e98f8f', '#f6efe2'), pinwheel(S, pcx + 3.3, H_GRASS, pcz + 2.6, '#9ed9cf', '#f4a6c4')];
    for (const dx of [-1.3, -.75, .75, 1.3]) { const [x, z] = [.3 * K + dx, -5.5 * K + 1.6]; put(cyl(.11, .2, 'dark'), x, H_HIGH + .1, z); S.solid({ x, z, r: .1 }); }   // the flower pots
    { const [x, z] = [.3 * K - 1.9, -5.5 * K + 1.7]; put(cyl(.09, .22, 'thing'), x, H_HIGH + .11, z); }                                                                    // the watering can

    /* ---------------- the square: fountain, stall, benches, lanterns ---------------- */
    const theFountain = fountain(S, SQ[0], H_GRASS + .015, SQ[1]);
    const theStall = stall(S, ...T(37, 40.5), H_GRASS);   // the fruit stall: a real one now (props.js). A tap, and an apple to give away
    // two benches looking at the pond, one at the square
    const benches = [[pcx - 1.5, pcz - 2.9], [pcx + 1.6, pcz - 2.9], [SQ[0] + 2.3, SQ[1] - 3.0]].map(([x, z], i) => bench(S, x, H_GRASS, z, i === 2 ? -.3 : 0));
    // lanterns, each beside a path: a tap lights one, a tap puts it out (Oscar: "let me turn them on")
    const lamps = [[SQ[0] - 1.9, SQ[1] - 3.1], ...kk([[2.7, -2.1], [-6.4, -3.0], [4.9, -.1], [7.2, 1.5], [-.6, 3.3], [6.6, -3.0]]), [pcx + 4.4, pcz + 1.7]].map(([x, z], n) => lantern(S, x, inPoly(HIGH, x, z) ? H_HIGH : H_GRASS, z, n));

    /* ---------------- the playground: the swing and the slide (toys.js), and a ball ---------------- */
    const SW = [-6.4 * K, -.4 * K], SL = [-4.9 * K, 1.05 * K];
    const theSwing = swing(S, SW[0], H_GRASS + .015, SW[1]), theSlide = slide(S, SL[0], H_GRASS + .015, SL[1]), theSeesaw = seesaw(S, -5.3 * K - 2.4, H_GRASS + .015, .3 * K + 2.0);
    // the ball, and the dog who lives on the fountain square and fetches it (dog.js)
    const theBall = ball(S, -3.9 * K, H_GRASS + .015, -.5 * K), theDog = dog(S, SQ[0] - 1.5, SQ[1] + 1.2, theBall);   // on the square, in the open
    // who else lives here (critters.js): the hen and her chicks by the carrot patch, the pig in its mud, two ducks on the pond
    const pondSpots = [[pcx - .8, pcz - .35], [pcx + .85, pcz + .5], [pcx + .05, pcz - .85], [pcx - .55, pcz + .75]];
    /* ---------------- the farm, in the south (farm.js): the well, the can, three rows of carrots, the scarecrow, the pig's mud, the hen ---------------- */
    lay(blob(F[0] + 5.4, F[1] + .7, 1.35, .95, 87, 32, .06), 'mud');
    const theWell = well(S, F[0] + .3, H_GRASS, F[1] - 1.8), crow = scarecrow(S, F[0] - 7.6, H_GRASS, F[1] - .1);
    const live = { kip: hen(S, F[0] + 1.3, H_GRASS, F[1] + 2.0), kuiken1: chick(S, F[0] + .6, F[1] + 2.6, 'kuiken1'), kuiken2: chick(S, F[0] + 2.0, F[1] + 2.7, 'kuiken2'), varken: pig(S, F[0] + 5.4, F[1] + .7),
      eend1: duck(S, ...pondSpots[0], 'eend1', pondSpots), eend2: duck(S, ...pondSpots[1], 'eend2', [pondSpots[1], pondSpots[2], pondSpots[3], pondSpots[0]]) };

    const flies = { vlinder1: butterfly(S, .3 * K - 3.6, -5.5 * K + .3, 'v1'), vlinder2: butterfly(S, .3 * K + 3.7, -5.5 * K + .2, 'v2', '#9ed9cf', '#f6efe2'), vlinder3: butterfly(S, F[0] - 2.4, F[1] + 1.6, 'v3', '#f2c65c', '#e98f8f') };
    const theFarm = farm(S, { can: [F[0] + 1.7, F[1] - 1.3], well: theWell, rows: [0, 1, 2].map(i => [F[0] - 4.6, F[1] - .9 + i * 1.0]), y: H_GRASS });
    mills.push(pinwheel(S, F[0] - 2.6, H_GRASS, F[1] + 2.4, '#f2c65c', '#e98f8f'));

    /* ---------------- the unicorns' meadow: a fence with an open gate, and the race arch beside it ---------------- */
    const PEN = [3.4 * K - 2.6, 4.3 * K - 1.6, 3.4 * K + 3.4, 4.3 * K + 1.6];   // wholly on the green: its far corner once hung out over the sand
    { const [x0, z0, x1, z1] = PEN, g0 = (x0 + x1) / 2 - .7, g1 = (x0 + x1) / 2 + .7;
      const rail = (ax, az, bx, bz) => { const l = Math.hypot(bx - ax, bz - az), r = put(box(l, .05, .04), (ax + bx) / 2, .42, (az + bz) / 2), r2 = put(box(l, .05, .04), (ax + bx) / 2, .22, (az + bz) / 2); r.rotation.y = r2.rotation.y = -Math.atan2(bz - az, bx - ax);
        for (let i = 0; i <= Math.round(l / .9); i++) put(box(.07, .56, .07, 'dark'), ax + (bx - ax) * i / Math.round(l / .9), .28, az + (bz - az) * i / Math.round(l / .9));
        S.wall((ax + bx) / 2, (az + bz) / 2, Math.abs(bx - ax) / 2 + .12, Math.abs(bz - az) / 2 + .12); };
      rail(x0, z0, g0, z0); rail(g1, z0, x1, z0); rail(x0, z1, x1, z1); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1); }

    /* ---------------- single things: the sword's stone, the zipline's pole, the bike, the mud ---------------- */
    // the brambles that shut the bridge to the meadow: watered, they bloom into roses and curl aside (props.js). The fountain fills the can as well as the well
    // (they open for the witch's potion, not for the watering can: the can is there from the start, the potion is the story's. Oscar, 2026-11-27)
    const potion = { holding: () => S.gear.potion, full: () => S.gear.potion, hint() { }, pourThen(done) { S.sfx.swish(3); const h = S.hand(); S.confetti(h.x + S.girl.face * .5, h.y + .2, h.z, ['#f4a6c4', '#f8dde4', '#bba6ea', '#f2c65c'], 18, S.starGeo, 2.4); setTimeout(done, 650); return true; } };
    S.shared.can = theFarm;
    const thorns = bramble(S, EAST.x0 + 3.6, DECK, 2.4 * K, 1.2, potion, STORY.drankje, 0);
    // the zipline's post: where the ride from the treehouse in the forest ends (the cable and the ride are the forest's, treehouse.js)
    { const [zx, zz] = T(43.5, 35.5), zy = inPoly(HIGH, zx, zz) ? H_HIGH : H_GRASS;
      put(new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 3.0, 8), paper('#8d6a48')), zx, zy + 1.5, zz).castShadow = true; put(new THREE.Mesh(new THREE.BoxGeometry(.5, .08, .08), paper('#7a5a3e')), zx, zy + 2.85, zz).castShadow = true;
      put(new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .1, 16), paper('#9fc4c9')), zx - .5, zy + .05, zz + .6).castShadow = true;   // a soft round mat to land on
      S.solid({ x: zx, z: zz, r: .16 }); S.shared.zipEnd = { at: S.at([zx - .5, zz + .6]), top: [...S.at([zx, zz]), zy + 2.85] }; }
    // the people of the village (folk.js): grandma knitting on the square's bench, the accordion player on the square, the gardener asleep
    // in his wheelbarrow by the carrots, the fisherman at the pond
    const folk = { oma: grandma(S, SQ[0] + 2.3, SQ[1] - 3.0, benches[2]), muzikant: player(S, SQ[0] - 2.35, SQ[1] - 1.25), tuinman: gardener(S, F[0] - 4.4, F[1] - 2.9, theFarm), visser: fisher(S, pcx + 2.62, pcz - .4, -1) };
    const thePlane = plane(S, .3 * K + 4.6, H_HIGH, -5.5 * K + 2.5);   // a paper aeroplane on the terrace: thrown from up here it sails out over the village (toys.js)
    const flipper = dolphin(S, EAST);   // leaps over her once on every crossing of the long bridge (critters2.js)
    theFountain.tapped = () => { if (theFarm.holding() && !theFarm.full()) S.walkThen(SQ[0], SQ[1] + 1.45, () => theFarm.fill(), 1.6); };

    /* ---------------- trees and grass, planted (PLAN.md, "How things are planted") ----------------
       Groves of two or three trees of one kind; flower plots of one kind and colour on a paler cut of grass; tufts in
       tight clumps and at the foot of the trees. Bare lawn between. Where a grove or a plot stands is found by chance among
       the places that are free (the village is big, and full of things); never where a tree would hide her on a path. */
    const busy = [[-3.8, -7, 4.4, -2.9], [-10.6, -1.3, -2.0, .4], [-8.6, 2.0, .4, 5.6], [7.5, 2.5, 9.5, 5], [-4.2, .4, -1.6, 2.2]].map(kz).concat([[F[0] - 9.5, F[1] - 3.6, F[0] + 8.5, F[1] + 4.6], [3.4 * K - 3.2, 4.3 * K - 4.2, 3.4 * K + 4, 4.3 * K + 2.2], [.3 * K - 2.8, -2.9 * K - .3, .3 * K + 2.8, -.45 * K - 1.6], [SQ[0] - 4.6, SQ[1] - 3.6, SQ[0] + 4.6, SQ[1] + 5.2], [pcx - 4.2, pcz - 4.2, pcx + 4.6, pcz + 4.8]]);
    const groundAt = (x, z) => inPoly(HIGH, x, z) ? HIGH : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_W, x, z) ? GRASS_W : inPoly(GRASS_S, x, z) ? GRASS_S : null, yAt = (x, z) => groundAt(x, z) === HIGH ? H_HIGH : H_GRASS;
    const anywhere = R2 => [(-15.5 + R2() * 26) * K, (-8 + R2() * 21) * K];
    const treeGround = (x, z) => { const on = groundAt(x, z); if (!on || edgeDist(on, x, z) < .5 || (on !== HIGH && edgeDist(HIGH, x, z) < .7) || inPoly(POND, x, z) || edgeDist(POND, x, z) < .5) return false;
      if (busy.some(([x0, z0, x1, z1]) => x > x0 - .35 && x < x1 + .35 && z > z0 - .35 && z < z1 + .35) || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .55)) return false;
      for (let d = .8; d < 4.4; d += .6) if (laid.some(o => inPoly(o, x, z - d))) return false;   // a path close behind it: the tree would hide her there
      return true; };
    const R = rng(91), KINDS = [['#93b071', '#b3c98d'], 'pine', ['#d8b35a', '#e8cd85'], ['#7fa676', '#a3c08c'], 'pine', ['#d9806c', '#e9a48f']], feet = []; let n = 0;
    findSpots(R, 12, 4.8, anywhere, (x, z) => treeGround(x, z) && !S.solids.some(s => Math.hypot(s.x - x, s.z - z) < 1.6)).forEach(([gx, gz], k) => {
      const kind = KINDS[k % KINDS.length], many = 2 + (k % 2), a0 = R() * 6.283, mine = [];
      for (let i = 0; i < many; i++) { const a = a0 + i / many * 6.283, x = gx + Math.cos(a) * (.7 + R() * .3), z = gz + Math.sin(a) * (.5 + R() * .25); if (!treeGround(x, z) || mine.some(([px, pz]) => Math.hypot(px - x, pz - z) < .85)) continue; mine.push([x, z]); const y = yAt(x, z);
        if (kind === 'pine') S.pine(x, z, y, 1.3 + R() * .6, ['#6f9670', '#7fa676', '#5f8665'][n % 3]); else S.lollipop(x, z, y, .42 + R() * .3, kind[0], kind[1], 100 + n, .9 + R() * .55); n++; feet.push([x, y, z]); }
    });
    const grassOk = (x, z) => { const on = groundAt(x, z); return !!on && edgeDist(on, x, z) > .3 && (on === HIGH || edgeDist(HIGH, x, z) > .3) && !inPoly(POND, x, z) && edgeDist(POND, x, z) > .25 && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22)
      && !(Math.abs(x - .3 * K) < 1.5 && z > -5.5 * K - 1.1 && z < -5.5 * K + 2.2) && !(Math.abs(Math.abs(x - .3 * K) - 3.7) < 2.3 && Math.abs(z - (-5.5 * K + .15)) < 1.5) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .45); };
    const roomy = (x, z) => grassOk(x, z) && [[1.7, 0], [-1.7, 0], [0, 1.0], [0, -1.0]].every(([dx, dz]) => grassOk(x + dx, z + dz) && yAt(x + dx, z + dz) === yAt(x, z));
    const PLOTS = [['daisy', ['#f2efe6']], ['tulip', ['#e98f8f', '#d9706c']], ['daisy', ['#f4a6c4']], ['daisy', ['#f2efe6', '#f2c65c']], ['tulip', ['#f2c65c']], ['daisy', ['#b9a3e0']]], planted = [];
    const plots = findSpots(R, 10, 5.4, anywhere, roomy);
    plots.forEach(([cx, cz], k) => { const [kind, cs] = PLOTS[k % PLOTS.length], rx = 1.5 + R() * .55, rz = .85 + R() * .3, base = yAt(cx, cz), up = .012 + (layer++) * .003, mat = base === H_HIGH ? grassP : highP;
      root.add(slab(blob(cx, cz, rx + .4, rz + .35, 700 + k, 26, .09), base + up, up, mat, mat));
      inOval(R, cx, cz, rx, rz, 13, .27, grassOk).forEach(([x, z, rr], i) => planted.push([x, base + up, z, { kind, col: cs[i % cs.length], big: 1.25 - rr * .35 }]));
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + R(), x = cx + Math.cos(a) * (rx + .15), z = cz + Math.sin(a) * (rz + .12); if (grassOk(x, z)) planted.push([x, base + up, z, { tuft: true }]); } });
    findSpots(R, 9, 3.8, anywhere, grassOk, plots).forEach(([cx, cz]) => inOval(R, cx, cz, .6, .38, 5, .17, grassOk).forEach(([x, z]) => planted.push([x, yAt(x, z), z, { tuft: true }])));   // tufts in tight clumps
    for (const [x, y, z] of feet) for (const dx of [-.32, .3]) if (grassOk(x + dx, z + .18)) planted.push([x + dx, y, z + .18, { tuft: true }]);                                       // and at the foot of every tree
    for (let i = planted.length - 1; i >= 0; i--) { const [x, , z, o] = planted[i]; if (x > F[0] - 6.4 && x < F[0] - (o && o.tuft ? 1.9 : 2.8) && z > F[1] - 1.9 && z < F[1] + 2.1) planted.splice(i, 1); }   // nothing grows on the farm's dug bed (farm.js)
    let pi = 0; const grass = meadow(S, planted.length, () => planted[pi++] || null, 401, 0, undefined, bunch);

    const [sx, sz] = T(31.5, 36.6);
    return {
      start: [sx, sz], uni: [sx - 1.1, sz + .1],
      shadow: { follow: 20 }, back: BACK, sky: 2,     // the shadow sheet follows the camera; the theatre's hills stand behind the forest
      step: e => { pondLook.step(e.time); HOUSE.step(e); theSwing.step(e); theSeesaw.step(e); theBall.step(e.dt); theDog.step(e); for (const c of Object.values(live)) c.step(e); for (const m of mills) m.step(e); theFarm.step(e); crow.step(e); theFountain.step(e); for (const b of beds) b.step(e); bunch.step(e); grass.step(e); for (const l of lamps) l.step(e); for (const b of Object.values(flies)) b.step(e); for (const b of benches) b.step(e); thorns.step(e); for (const q of Object.values(folk)) q.step(e); flipper.step(e); thePlane.step(e); theStall.step(e); },
      toys: { ...live, ...flies, ...folk, dolfijn: flipper, vliegtuig: thePlane, kraam: theStall, braam: thorns, molen: mills[0], fontein: theFountain, bank: benches[2], lantaarn: lamps[0], tuin: beds[1], bos: bunch, gras: grass, boerderij: theFarm, vogelverschrikker: crow, wip: theSeesaw, swing: theSwing, slide: theSlide, dog: theDog, ball: { state: () => ({ at: [theBall.x, theBall.z], lift: theBall.lift, held: !!theBall.held, kicks: theBall.kicks, moving: theBall.moving() }) } },
      names: { house: HOUSE.toggle },
      info: () => ({ door: HOUSE.open }),
      // how the camera looks at each part (see the director in paper.js). On a bridge the camera looks straight along it:
      // turned, 'up' on the stick would walk her into the railing
      shots: [
        { name: 'thuis', zone: [.3 * K - 2.8, -5.5 * K + .9, .3 * K + 2.8, -2.9 * K - .1], span: 9.5, tall: 6.5, rise: .2 },                      // at her front door: close and low, the morning
        { name: 'speeltuin', zone: [-5.3 * K - 4.5, .3 * K - 2.9, -5.3 * K + 4.5, .3 * K + 2.9], span: 12, rise: .3, yaw: .3 },                      // the playground, seen a little from the east
        { name: 'vijver', zone: [pcx - 5, pcz - 4.6, pcx + 4.2, pcz + 4.4], span: 10.5, rise: .38, yaw: .22 },                      // the pond: closer, looking down on the water
        { name: 'wei', zone: [3.4 * K - 2.5, 4.3 * K - 1.5, 3.4 * K + 3.3, 4.3 * K + 1.5], span: 12, rise: .36 },                                       // in the unicorns' meadow
        { name: 'brug-oost', zone: [EAST.x0 + 5.2, 2.4 * K - 1.5, EAST.x1 - .2, 2.4 * K + 1.5], span: 26, tall: 13, rise: .42, dof: .7, range: 2.2, play: false },    // the bridge to the meadow: far back, she is small
        { name: 'brug-noord', zone: [6 * K - 1.1, NORTH.z0 + .2, 6 * K + 1.1, NORTH.z1 - .9], span: 24, tall: 13, rise: .55, dof: .7, range: 2.2, play: false },   // the bridge to the forest: far back and high
        { name: 'boerderij', zone: [F[0] - 9.6, F[1] - 3.7, F[0] + 9.6, F[1] + 4.8], span: 12.5, rise: .34 },              // the farm in the south
        { name: 'dorp', span: 14 },                                                                              // everywhere else
      ],
      spots: { wip: [-5.3 * K - 2.4, .6, .3 * K + 2.0], bank: [SQ[0] + 1.9, .42, SQ[1] - 2.87], swing: [SW[0], 1.9, SW[1]], slide: [SL[0] + 1.4, .85, SL[1]], door: [HOUSE.x, H_HIGH + .6, HOUSE.z + HOUSE.d / 2], fountain: [T(32, 41)[0], .5, T(32, 41)[1]] },
      /** named places of the old map, for tests and for the plan: where they are on this set */
      places: { start: [sx, sz], fountain: [SQ[0], SQ[1] + 2.0], stall: T(37, 41.8), swing: [SW[0], SW[1] + .95], slide: [SL[0] - .4, SL[1] + .15], pond: [pcx, pcz + 2.6], bench: [SQ[0] + 2.3, SQ[1] - 2.2], pen: [3.4 * K + .4, 4.3 * K], arch: T(44.5, 46.6), pole: T(43.5, 35.5), mud: [F[0] + 5.4, F[1] - .9], well: [F[0] + .3, F[1] - .8], rows: [F[0] - 4.6, F[1] - .35], crow: [F[0] - 7.6, F[1] + 1.0], north: [6 * K, NORTH.z1 - 3.5], east: [EAST.x0 + 1.9, 2.4 * K], thorns: [EAST.x0 + 2.5, 2.4 * K] },
    };
  },
};
