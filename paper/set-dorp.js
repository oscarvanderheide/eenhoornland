// The village, as a blockout: grey card stand-ins on real ground, with her real house. Nothing else here is drawn yet. It exists to answer three questions before any
// drawing is done: does a set of this size run on the phone, do the camera's shots work with the controls, and how small
// does she get. Everything stands where the pixel game's map (js/map.js) has it, scaled down: T() below turns a tile of
// that map into a place on this set, so the old map's spots keep their meaning. Only places come from the map: the shape of
// every path, square and patch is cut by hand, never a row of tiles. The numbers are copied, never imported
// (the site takes only paper/ from this branch). Trees, sea and shadows are the real thing, at the real count: they are
// what the phone pays for.
import { THREE, rng, paper, slab, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { cottage, shore, GROUND } from './props.js';
import { swing, slide } from './toys.js';
import { dog, ball } from './dog.js';
import { hen, chick, pig, duck } from './critters.js';
import { dorpLand, bosLand, ORIGIN, BACK } from './lands.js';

/** a tile of the pixel game's map -> a place on this set (the fountain square is the middle; 0.6 of a step per tile) */
const T = (x, z) => [(x - 31) * .6, (z - 42) * .6];
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
    const { SAND, GRASS, SAND_S, SAND_W, GRASS_W, HIGH, under } = dorpLand();
    const WEI = blob(19.6, 2.2, 4.2, 5, 78, 48, .05);        // the near shore of the meadow, across the east bridge (a stand-in)
    // the ground is the island's real printed paper (it costs what it will cost); what stands on it is still grey
    const sandP = GROUND.sand, grassP = GROUND.grass, highP = GROUND.high;
    shore(S, [...[SAND, SAND_S, SAND_W].map(o => [o, H_SAND, .55, sandP]), ...[GRASS, GRASS_W].map(o => [o, H_GRASS, .32, grassP]), [HIGH, H_HIGH, .48, highP], [WEI, H_GRASS, .87, grassP]], [...under, blob(19.6, 2.3, 4.5, 5.3, 85, 56, .04)]);

    // stairs down from the terrace: in front of her door (south), and at its east end where the street goes on to the bridge
    const edge = (poly, at, axis) => { let best = -99; for (let v = -12; v <= 12; v += .01) if (axis === 'z' ? inPoly(poly, at, v) : inPoly(poly, v, at)) best = v; return best; };
    const stairs = [];
    const steps = (dir, at, half) => {
      const lip = edge(HIGH, at, dir === 's' ? 'z' : 'x');
      for (let i = 0; i < 3; i++) {
        const far = lip + .05 + (2 - i) * .42, h = (i + 1) * .16 - .02;
        const b = dir === 's' ? [at - half, far - .5, at + half, far] : [far - .5, at - half, far, at + half];
        root.add(slab(rect(...b), h, h + .02, P('path'), edgeMat)); stairs.push({ b, h });
      }
    };
    steps('s', .3, .55); steps('e', -3.4, .55);

    // the bridges: planks on posts. East to the meadow; north to the forest, which is a set of its own standing in the same
    // world (lands.js): the bridge is this set's, all the way to the forest's shore
    const NORTH = { x0: 5.4, x1: 6.6, z0: ORIGIN.bos[1] + bosLand().bridge[1] - .7, z1: -5.5 }, EAST = { x0: 8.3, x1: 16.2, z0: 1.8, z1: 3.0 }, DECK = -.12;
    for (let z = NORTH.z0; z < NORTH.z1; z += .32) root.add(slab(rect(NORTH.x0 - .05, z, NORTH.x1 + .05, z + .28), DECK, .06, P('thing'), edgeMat));
    for (let x = EAST.x0; x < EAST.x1; x += .32) root.add(slab(rect(x, EAST.z0 - .05, x + .28, EAST.z1 + .05), DECK, .06, P('thing'), edgeMat));
    for (let z = -7.2; z > NORTH.z0 + .6; z -= 1.7) for (const x of [NORTH.x0, NORTH.x1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);
    for (const x of [10.4, 12, 13.6, 15.2]) for (const z of [EAST.z0, EAST.z1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);

    // the pond: a sheet of water lying in the green; nobody walks on it
    const [pcx, pcz] = T(14.5, 42.5), POND = blob(pcx, pcz, 1.44, 1.2, 86, 40, .05);
    root.add(slab(POND, H_GRASS + .02, .02, P('water'), whiteEdge));

    S.sea({ land: [SAND, SAND_S, SAND_W, WEI], x0: -40, x1: 40, z0: -19.5, z1: 21, deep: [170, 120, 0, 0] });

    // where she can stand: the first floor that holds the spot counts
    for (const s of stairs) S.floorBox(s.h, ...s.b);
    S.floor(null, POND);
    S.floor(H_HIGH, HIGH);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_W); S.floor(H_GRASS, WEI);
    S.floorBox(DECK, NORTH.x0, NORTH.z0, NORTH.x1, NORTH.z1); S.floorBox(DECK, EAST.x0, EAST.z0, EAST.x1, EAST.z1);
    for (const s of [SAND, SAND_S, SAND_W]) S.floor(H_SAND, s, .22);

    /* ---------------- the square, the paths, the patches: all cut by hand ----------------
       The old map gives where things are, never the shape of anything: nothing here lies on a grid. A path is a ribbon of card
       that winds (kit.js ribbon), a square is a blob, a side path is a row of stepping stones. */
    const laid = [];   // every outline lying on the ground, so no tree is planted on one
    const lay = (pts, c, y = H_GRASS) => { root.add(slab(pts, y + .015, .015, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stones = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    lay(blob(.6, -.45, 2.35, 1.7, 61, 48, .05), 'high');                                                               // the square round the fountain
    lay(ribbon([[-3.5, -3.5], [-1.6, -3.36], [.3, -3.46], [2.2, -3.36], [3.85, -3.45]], .82, 62), 'path', H_HIGH);      // along the terrace, past her door
    lay(ribbon([[.35, -1.75], [.45, -1.2]], .95, 63, .03), 'path');                                                    // from the foot of the stairs onto the square
    lay(ribbon([[.7, 1.0], [.35, 2.2], [.75, 3.5], [.15, 4.8], [-.7, 5.9], [-1.3, 7.2], [-1.9, 8.6], [-2.1, 9.5]], .85, 64), 'path');   // south, winding down to the pig's mud
    lay(ribbon([[2.7, -.1], [4.3, .65], [6.0, 1.85], [7.6, 2.45], [9.3, 2.4]], .9, 65), 'path');                        // east to the bridge
    lay(ribbon([[-1.5, -.8], [-2.5, -1.85], [-4.8, -2.3], [-6.6, -2.05], [-7.5, -1.0], [-8.15, .1]], .8, 66), 'path');  // west, round the playground to the pond
    lay(ribbon([[6.0, -5.75], [5.9, -4.4], [5.35, -3.3], [5.5, -1.6], [6.05, .2], [6.5, 1.75]], .85, 67), 'path');      // from the north bridge past the terrace's east stairs
    lay(blob(-5.3, .3, 3.1, 1.9, 68, 44, .06), sandP);                                                                 // the playground's sand
    lay(blob(-3.9, 4.75, 2.1, 1.05, 69, 40, .07), 'soil');                                                              // the carrot patch
    stones([[4.75, 1.45], [4.5, 1.95], [4.3, 2.45], [4.2, 2.95]], 160);                                                 // to the gate of the unicorns' meadow
    stones([[-.25, 2.55], [-.85, 2.75], [-1.5, 2.85], [-2.15, 3.05], [-2.8, 3.15]], 170);                               // to the sword's stone and the patch

    /* ---------------- her house, on the terrace ---------------- */
    const HOUSE = cottage(S, .3, H_HIGH, -5.5, 'voordeur');     // the real one (props.js); its front door is a cut to the room inside (set-huis.js)
    for (const tx of [29.5, 30.45, 32.55, 33.5]) { const [x, z] = T(tx, 35.45); put(cyl(.11, .2, 'dark'), x, H_HIGH + .1, z); S.solid({ x, z, r: .1 }); }   // the flower pots
    { const [x, z] = T(28.4, 35.6); put(cyl(.09, .22, 'thing'), x, H_HIGH + .11, z); }                                                                    // the watering can

    /* ---------------- the square: fountain, stall, benches, lanterns ---------------- */
    { const [x, z] = T(32, 41); put(cyl(.66, .32, 'thing', 20), x, .16, z); put(cyl(.5, .05, 'water', 20), x, .33, z); put(cyl(.1, .9, 'dark'), x, .45, z); put(cyl(.26, .08, 'thing', 14), x, .9, z); S.solid({ x, z, r: .66 }); }
    { const [x, z] = T(37, 40.5); put(box(1.2, .8, .55), x, .4, z); put(box(1.4, .06, .8, 'roof'), x, 1.35, z); for (const sx of [-.62, .62]) put(cyl(.03, 1.35, 'dark', 6), x + sx, .68, z + .3); S.wall(x, z, .72, .4); }
    for (const [tx, tz] of [[13, 39.5], [17, 39.5], [28, 39.5]]) { const [x, z] = T(tx, tz); put(box(.95, .1, .32), x, .3, z); put(box(.95, .34, .06), x, .5, z - .14); for (const sx of [-.4, .4]) put(box(.06, .28, .28, 'dark'), x + sx, .14, z); S.wall(x, z, .58, .26); }
    for (const [x, z] of [[-1.5, -2.1], [2.7, -2.1], [-6.4, -2.95], [4.6, -.3], [7.2, 1.5], [-.5, 3.3], [6.6, -3.0], [-8.3, 1.5]]) {   // lanterns, each beside a path
      const y = inPoly(HIGH, x, z) ? H_HIGH : H_GRASS;
      put(cyl(.035, 1.4, 'dark', 8), x, y + .7, z); put(new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), P('path')), x, y + 1.42, z); S.solid({ x, z, r: .08 });
    }

    /* ---------------- the playground: the swing and the slide (toys.js), and a ball ---------------- */
    const theSwing = swing(S, -6.7, H_GRASS + .015, -.45), theSlide = slide(S, -5.7, H_GRASS + .015, 1.15);
    // the ball, and the dog who lives on the fountain square and fetches it (dog.js)
    const theBall = ball(S, -3.9, H_GRASS + .015, -.3), theDog = dog(S, 2.0, .95, theBall);
    // who else lives here (critters.js): the hen and her chicks by the carrot patch, the pig in its mud, two ducks on the pond
    const pondSpots = [[pcx - .45, pcz - .25], [pcx + .5, pcz + .35], [pcx + .05, pcz - .55], [pcx - .35, pcz + .5]];
    const live = { kip: hen(S, -5.5, H_GRASS, 3.9), kuiken1: chick(S, -6.0, 4.4, 'kuiken1'), kuiken2: chick(S, -5.0, 4.5, 'kuiken2'), varken: pig(S, -2.1, 10.3),
      eend1: duck(S, ...pondSpots[0], 'eend1', pondSpots), eend2: duck(S, ...pondSpots[1], 'eend2', [pondSpots[1], pondSpots[2], pondSpots[3], pondSpots[0]]) };

    /* ---------------- the unicorns' meadow: a fence with an open gate, and the race arch beside it ---------------- */
    { const [x0, z0] = T(33.5, 47.5), [x1, z1] = T(42.5, 51.5), [g0] = T(37, 47), [g1] = T(39, 47);
      const rail = (ax, az, bx, bz) => { const l = Math.hypot(bx - ax, bz - az), r = put(box(l, .05, .04), (ax + bx) / 2, .42, (az + bz) / 2), r2 = put(box(l, .05, .04), (ax + bx) / 2, .22, (az + bz) / 2); r.rotation.y = r2.rotation.y = -Math.atan2(bz - az, bx - ax);
        for (let i = 0; i <= Math.round(l / .9); i++) put(box(.07, .56, .07, 'dark'), ax + (bx - ax) * i / Math.round(l / .9), .28, az + (bz - az) * i / Math.round(l / .9));
        S.wall((ax + bx) / 2, (az + bz) / 2, Math.abs(bx - ax) / 2 + .12, Math.abs(bz - az) / 2 + .12); };
      rail(x0, z0, g0, z0); rail(g1, z0, x1, z0); rail(x0, z1, x1, z1); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1); }
    { const [x, z] = T(44.5, 47.5); for (const sz of [-.75, .75]) put(cyl(.06, 1.7, 'dark', 8), x, .85, z + sz + .9); const top = put(box(.12, .3, 1.7, 'roof'), x, 1.75, z + .9); top.castShadow = true; }

    /* ---------------- single things: the sword's stone, the zipline's pole, the bike, the mud ---------------- */
    { const [x, z] = T(24.5, 47.5); put(new THREE.Mesh(new THREE.DodecahedronGeometry(.36, 0), P('thing')), x, .2, z).castShadow = true; put(box(.05, .5, .1, 'dark'), x, .6, z); S.solid({ x, z, r: .36 }); }
    { const [x, z] = T(44.5, 34.5); put(cyl(.07, 2.3, 'dark', 8), x, 1.15, z); S.solid({ x, z, r: .1 }); }
    { const [x, z] = T(42.5, 43.5); for (const sx of [-.28, .28]) { const w = put(cyl(.2, .04, 'dark', 14), x + sx, .2, z); w.rotation.x = Math.PI / 2; } put(box(.6, .05, .05), x, .34, z); }
    { const [x, z] = T(27.5, 59.2); root.add(slab(blob(x, z, 1.15, .8, 87, 32, .06), H_SAND + .02, .02, P('mud'), whiteEdge)); }
    // the bramble that shuts the bridge to the meadow, as a block
    put(box(.5, .6, 1.2, 'dark'), 10.9, DECK + .3, 2.4); S.wall(10.9, 2.4, .35, .7);

    /* ---------------- trees: real ones, as many as a village has ---------------- */
    const busy = [[-1.6, -7, 2.2, -2.9], [-10.6, -1.3, -2.0, .4], [-8.6, 2.0, .4, 5.6], [.9, 2.7, 7.6, 6.4], [7.5, 2.5, 9.5, 5]];   // her house and its doorstep, where the swing throws her, the playground's view to the camera, the pen, the arch
    const cols = [['#93b071', '#b3c98d'], ['#d8b35a', '#e8cd85'], ['#d9806c', '#e9a48f'], ['#7fa676', '#a3c08c']];
    const R = rng(91); let n = 0;
    for (let i = 0; i < 900 && n < 26; i++) {
      const x = -14 + R() * 24, z = -8 + R() * 16, r = .42 + R() * .3, c = cols[Math.floor(R() * cols.length)], pineTree = R() < .3;
      const on = inPoly(HIGH, x, z) ? HIGH : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_W, x, z) ? GRASS_W : null;
      if (!on || edgeDist(on, x, z) < .5 || (on !== HIGH && inPoly(HIGH, x, z)) || (on !== HIGH && edgeDist(HIGH, x, z) < .7) || inPoly(POND, x, z) || edgeDist(POND, x, z) < .5) continue;
      if (busy.some(([x0, z0, x1, z1]) => x > x0 - .35 && x < x1 + .35 && z > z0 - .35 && z < z1 + .35) || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .55)) continue;
      if (S.solids.some(s => Math.hypot(s.x - x, s.z - z) < 1.3)) continue;
      const y = on === HIGH ? H_HIGH : H_GRASS;
      if (pineTree) S.pine(x, z, y, 1.3 + R() * .6, ['#6f9670', '#7fa676', '#5f8665'][n % 3]); else S.lollipop(x, z, y, r, c[0], c[1], 100 + n, .9 + R() * .55);
      n++;
    }
    for (const [x, z] of [[20.5, .2], [21, 4.4]]) S.lollipop(x, z, H_GRASS, .6, cols[0][0], cols[0][1], 140 + Math.round(x));   // on the meadow's shore

    const [sx, sz] = T(31.5, 36.6);
    return {
      start: [sx, sz], uni: [sx - 1.1, sz + .1],
      shadow: { follow: 20 }, back: BACK, sky: 1.4,     // the shadow sheet follows the camera; the theatre's hills stand behind the forest
      step: e => { HOUSE.step(e); theSwing.step(e); theBall.step(e.dt); theDog.step(e); for (const c of Object.values(live)) c.step(e); },
      toys: { ...live, swing: theSwing, slide: theSlide, dog: theDog, ball: { state: () => ({ at: [theBall.x, theBall.z], lift: theBall.lift, held: !!theBall.held, kicks: theBall.kicks, moving: theBall.moving() }) } },
      names: { house: HOUSE.toggle },
      info: () => ({ door: HOUSE.open }),
      // how the camera looks at each part (see the director in paper.js). On a bridge the camera looks straight along it:
      // turned, 'up' on the stick would walk her into the railing
      shots: [
        { name: 'thuis', zone: [-2.4, -4.7, 3.0, -2.95], span: 9.5, tall: 6.5, rise: .2 },                      // at her front door: close and low, the morning
        { name: 'speeltuin', zone: [-8.4, -1.7, -2.4, 2.3], span: 12, rise: .3, yaw: .3 },                      // the playground, seen a little from the east
        { name: 'vijver', zone: [-14, -3.2, -8.6, 3.8], span: 10.5, rise: .38, yaw: .22 },                      // the pond: closer, looking down on the water
        { name: 'wei', zone: [1.3, 3.4, 7.2, 6.3], span: 12, rise: .36 },                                       // in the unicorns' meadow
        { name: 'brug-oost', zone: [9.0, .9, 17, 3.9], span: 26, tall: 13, rise: .42, dof: .7, range: 2.2, play: false },    // the bridge to the meadow: far back, she is small
        { name: 'brug-noord', zone: [4.9, NORTH.z0 + .2, 7.1, -6.4], span: 24, tall: 13, rise: .55, dof: .7, range: 2.2, play: false },   // the bridge to the forest: far back and high
        { name: 'modder', zone: [-8, 7.6, 6, 13], span: 11, rise: .3 },                                         // the pig's corner in the south
        { name: 'dorp', span: 14 },                                                                              // everywhere else
      ],
      spots: { swing: [-6.7, 1.9, -.45], slide: [-4.3, .85, 1.15], door: [HOUSE.x, H_HIGH + .6, HOUSE.z + HOUSE.d / 2], fountain: [T(32, 41)[0], .5, T(32, 41)[1]] },
      /** named places of the old map, for tests and for the plan: where they are on this set */
      places: { start: [sx, sz], fountain: T(32, 43.2), stall: T(37, 41.8), swing: [-6.7, .5], slide: [-6.1, 1.3], pond: T(14.5, 45.4), bench: T(28, 40.6), garden: T(24.5, 49.5), pen: T(38, 49.5), arch: T(44.5, 46.6), sword: T(24.5, 48.6), pole: T(43.5, 35.5), mud: T(27.5, 57.6), north: [6, -9], east: [10.2, 2.4] },
    };
  },
};
