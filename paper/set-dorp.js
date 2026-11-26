// The village, as a blockout: grey card stand-ins on real ground, with her real house. Nothing else here is drawn yet. It exists to answer three questions before any
// drawing is done: does a set of this size run on the phone, do the camera's shots work with the controls, and how small
// does she get. Everything stands where the pixel game's map (js/map.js) has it, scaled down: T() below turns a tile of
// that map into a place on this set, so the old map's spots keep their meaning. The numbers are copied, never imported
// (the site takes only paper/ from this branch). Trees, sea and shadows are the real thing, at the real count: they are
// what the phone pays for.
import { THREE, rng, paper, slab, blob, inPoly, edgeDist, edgeMat, whiteEdge, grassMap, grassBump, sandMap, sandBump } from './kit.js';
import { cottage } from './props.js';

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
    /** a flat card on the ground between two tiles of the old map (a path, a square, a patch) */
    const patch = (tx0, tz0, tx1, tz1, c, y = H_GRASS) => { const [x0, z0] = T(tx0, tz0), [x1, z1] = T(tx1 + 1, tz1 + 1); root.add(slab(rect(x0, z0, x1, z1), y + .015, .015, P(c), whiteEdge)); return [x0, z0, x1, z1]; };

    /* ---------------- the land: a beach, the green, and a terrace in the north where her house stands ---------------- */
    const SAND = blob(0, 0, 10.4, 8.5, 71, 80, .04), GRASS = blob(0, -.1, 9.5, 7.7, 72, 80, .04);
    const SAND_S = blob(-1.2, 9.7, 6.3, 3.0, 73, 56, .05);                                              // the south: the pig's mud
    const SAND_W = blob(-10.4, .3, 5.0, 4.0, 74, 56, .05), GRASS_W = blob(-10.3, .3, 4.3, 3.4, 75, 56, .05);   // the west: the duck pond
    // the terrace: a card with round corners (a blob would leave the street no room along its front)
    const HIGH = (() => { const R = rng(76), cx = -.1, cz = -5.05, hx = 4.5, hz = 2.15, r = 1.6, out = [];
      for (const [qx, qz, a0] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let i = 0; i <= 10; i++) { const a = (a0 + i / 10) * Math.PI / 2, j = (R() - .5) * .03; out.push([cx + qx * (hx - r) + Math.cos(a) * (r + j), cz + qz * (hz - r) + Math.sin(a) * (r + j)]); }
      return out; })();
    const BOS = blob(5.6, -14.6, 6, 3.4, 77, 48, .05), WEI = blob(19.6, 2.2, 4.2, 5, 78, 48, .05);        // the near shores of the forest and the meadow, across the bridges
    // the ground is the island's real printed paper (it costs what it will cost); what stands on it is still grey
    const sandP = paper('#ecd3a0', { map: sandMap, bump: sandBump }), grassP = paper('#a3bf76', { map: grassMap, bump: grassBump }), highP = paper('#bccb84', { map: grassMap, bump: grassBump });
    for (const s of [SAND, SAND_S, SAND_W]) root.add(slab(s, H_SAND, .55, sandP, edgeMat));
    for (const g of [GRASS, GRASS_W]) root.add(slab(g, H_GRASS, .32, grassP, edgeMat));
    root.add(slab(HIGH, H_HIGH, .48, highP, edgeMat));
    for (const s of [BOS, WEI]) root.add(slab(s, H_GRASS, .87, grassP, edgeMat));
    for (const [cx, cz, rx, rz, seed] of [[0, .1, 10.8, 8.8, 81], [-1.2, 9.8, 6.6, 3.3, 82], [-10.4, .4, 5.3, 4.3, 83], [5.6, -14.5, 6.3, 3.7, 84], [19.6, 2.3, 4.5, 5.3, 85]])
      root.add(slab(blob(cx, cz, rx, rz, seed, 56, .04), H_SAND - .5, .5, P('dark'), edgeMat));

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

    // the bridges: planks on posts. North to the forest, east to the meadow
    const NORTH = { x0: 5.4, x1: 6.6, z0: -11.8, z1: -5.5 }, EAST = { x0: 8.3, x1: 16.2, z0: 1.8, z1: 3.0 }, DECK = -.12;
    for (let z = NORTH.z0; z < NORTH.z1; z += .32) root.add(slab(rect(NORTH.x0 - .05, z, NORTH.x1 + .05, z + .28), DECK, .06, P('thing'), edgeMat));
    for (let x = EAST.x0; x < EAST.x1; x += .32) root.add(slab(rect(x, EAST.z0 - .05, x + .28, EAST.z1 + .05), DECK, .06, P('thing'), edgeMat));
    for (const z of [-10.6, -9, -7.4]) for (const x of [NORTH.x0, NORTH.x1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);
    for (const x of [10.4, 12, 13.6, 15.2]) for (const z of [EAST.z0, EAST.z1]) put(cyl(.06, 1.6, 'dark', 8), x, DECK - .6, z);

    // the pond: a sheet of water lying in the green; nobody walks on it
    const [pcx, pcz] = T(14.5, 42.5), POND = blob(pcx, pcz, 1.44, 1.2, 86, 40, .05);
    root.add(slab(POND, H_GRASS + .02, .02, P('water'), whiteEdge));

    S.sea({ land: [SAND, SAND_S, SAND_W, BOS, WEI], x0: -40, x1: 40, z0: -19.5, z1: 21, deep: [170, 120, 0, 0] });

    // where she can stand: the first floor that holds the spot counts
    for (const s of stairs) S.floorBox(s.h, ...s.b);
    S.floor(null, POND);
    S.floor(H_HIGH, HIGH);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_W); S.floor(H_GRASS, BOS); S.floor(H_GRASS, WEI);
    S.floorBox(DECK, NORTH.x0, NORTH.z0, NORTH.x1, NORTH.z1); S.floorBox(DECK, EAST.x0, EAST.z0, EAST.x1, EAST.z1);
    for (const s of [SAND, SAND_S, SAND_W]) S.floor(H_SAND, s, .22);

    /* ---------------- streets and squares (flat cards) ---------------- */
    patch(26, 36, 35, 37, 'path', H_HIGH);                    // the street in front of her house (on the terrace, and on past it)
    patch(20, 36, 22, 37, 'path'); patch(39, 36, 43, 37, 'path');
    patch(31, 38, 32, 50, 'path'); patch(20, 45, 46, 46, 'path'); patch(40, 31, 41, 35, 'path'); patch(28, 49, 30, 50, 'path');
    patch(29, 39, 34, 43, 'high');                            // the fountain square
    { const [x0, z0] = T(18, 40), [x1, z1] = T(27, 45); root.add(slab(rect(x0, z0, x1, z1), H_GRASS + .015, .015, sandP, whiteEdge)); }   // the playground's sand
    patch(21, 48, 27, 51, 'soil');                            // the carrot patch

    /* ---------------- her house, on the terrace ---------------- */
    const HOUSE = cottage(S, .3, H_HIGH, -5.5);                 // the real one (props.js): the only drawn thing here
    for (const tx of [29.5, 30.45, 32.55, 33.5]) { const [x, z] = T(tx, 35.45); put(cyl(.11, .2, 'dark'), x, H_HIGH + .1, z); S.solid({ x, z, r: .1 }); }   // the flower pots
    { const [x, z] = T(28.4, 35.6); put(cyl(.09, .22, 'thing'), x, H_HIGH + .11, z); }                                                                    // the watering can

    /* ---------------- the square: fountain, stall, benches, lanterns ---------------- */
    { const [x, z] = T(32, 41); put(cyl(.66, .32, 'thing', 20), x, .16, z); put(cyl(.5, .05, 'water', 20), x, .33, z); put(cyl(.1, .9, 'dark'), x, .45, z); put(cyl(.26, .08, 'thing', 14), x, .9, z); S.solid({ x, z, r: .66 }); }
    { const [x, z] = T(37, 40.5); put(box(1.2, .8, .55), x, .4, z); put(box(1.4, .06, .8, 'roof'), x, 1.35, z); for (const sx of [-.62, .62]) put(cyl(.03, 1.35, 'dark', 6), x + sx, .68, z + .3); S.wall(x, z, .72, .4); }
    for (const [tx, tz] of [[13, 39.5], [17, 39.5], [28, 39.5]]) { const [x, z] = T(tx, tz); put(box(.95, .1, .32), x, .3, z); put(box(.95, .34, .06), x, .5, z - .14); for (const sx of [-.4, .4]) put(box(.06, .28, .28, 'dark'), x + sx, .14, z); S.wall(x, z, .58, .26); }
    for (const [tx, tz] of [[19, 38], [28, 38], [35, 38], [44, 38], [28, 44], [35, 44], [26, 47], [44, 43]]) {
      const [x, z] = T(tx + .5, tz + .5), y = inPoly(HIGH, x, z) ? H_HIGH : H_GRASS;
      put(cyl(.035, 1.4, 'dark', 8), x, y + .7, z); put(new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), P('path')), x, y + 1.42, z); S.solid({ x, z, r: .08 });
    }

    /* ---------------- the playground: a swing and a slide ---------------- */
    { const [x, z] = T(20.5, 41.5);
      for (const sx of [-.95, .95]) for (const sz of [-.3, .3]) { const leg = put(cyl(.04, 1.75, 'dark', 6), x + sx, .82, z + sz * .5); leg.rotation.x = -sz * .55; }
      const beam = put(cyl(.04, 2, 'dark', 6), x, 1.62, z); beam.rotation.z = Math.PI / 2;
      for (const sx of [-.22, .22]) put(cyl(.012, 1.15, 'thing', 4), x + sx, 1.04, z); put(box(.52, .05, .2), x, .46, z);
      S.wall(x - .95, z, .12, .3); S.wall(x + .95, z, .12, .3); }
    { const [x, z] = T(24.5, 43.5); const ramp = put(box(1.5, .06, .5), x + .15, .52, z); ramp.rotation.z = -.52; put(box(.5, 1.0, .5, 'dark'), x - .62, .5, z); S.wall(x, z, .95, .32); }
    { const [x, z] = T(24.5, 41.5); put(new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), P('path')), x, .16, z).castShadow = true; }   // the ball

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
    const busy = [[-1.6, -7, 2.2, -2.2], [-1.4, -2.2, 2.7, 1.5], [-8.1, -1.5, -2.1, 2.1], [-6.3, 3.3, -1.5, 5.7], [.9, 2.7, 7.6, 6.4], [-.3, -4.4, 1.5, 6], [-7, 1.5, 9.9, 3.3], [5.1, -7, 6.9, -2.7], [-7, -4.1, 8.1, -2.7], [-12, -1.2, -7.8, 1.8], [7.5, 2.5, 9.5, 5]];
    const cols = [['#93b071', '#b3c98d'], ['#d8b35a', '#e8cd85'], ['#d9806c', '#e9a48f'], ['#7fa676', '#a3c08c']];
    const R = rng(91); let n = 0;
    for (let i = 0; i < 900 && n < 26; i++) {
      const x = -14 + R() * 24, z = -8 + R() * 16, r = .42 + R() * .3, c = cols[Math.floor(R() * cols.length)], pineTree = R() < .3;
      const on = inPoly(HIGH, x, z) ? HIGH : inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_W, x, z) ? GRASS_W : null;
      if (!on || edgeDist(on, x, z) < .5 || (on !== HIGH && inPoly(HIGH, x, z)) || (on !== HIGH && edgeDist(HIGH, x, z) < .7) || inPoly(POND, x, z) || edgeDist(POND, x, z) < .5) continue;
      if (busy.some(([x0, z0, x1, z1]) => x > x0 - .35 && x < x1 + .35 && z > z0 - .35 && z < z1 + .35)) continue;
      if (S.solids.some(s => Math.hypot(s.x - x, s.z - z) < 1.3)) continue;
      const y = on === HIGH ? H_HIGH : H_GRASS;
      if (pineTree) S.pine(x, z, y, 1.3 + R() * .6, ['#6f9670', '#7fa676', '#5f8665'][n % 3]); else S.lollipop(x, z, y, r, c[0], c[1], 100 + n, .9 + R() * .55);
      n++;
    }
    for (const [x, z] of [[4.2, -14.6], [7.6, -15.2], [20.5, .2], [21, 4.4]]) S.lollipop(x, z, H_GRASS, .6, cols[0][0], cols[0][1], 140 + Math.round(x));   // on the far shores

    const [sx, sz] = T(31.5, 36.6);
    return {
      start: [sx, sz], uni: [sx - 1.1, sz + .1],
      shadow: 22,
      step: e => HOUSE.step(e),
      names: { house: HOUSE.toggle },
      info: () => ({ door: HOUSE.open }),
      shots: [{ name: 'dorp', fx: 1, fy: .5, fz: 1, lag: 1, span: 14, tall: 8 }],
      spots: { door: [HOUSE.x, H_HIGH + .6, HOUSE.z + HOUSE.d / 2], fountain: [T(32, 41)[0], .5, T(32, 41)[1]] },
      /** named places of the old map, for tests and for the plan: where they are on this set */
      places: { start: [sx, sz], fountain: T(32, 43.2), stall: T(37, 41.8), swing: T(20.5, 42.6), slide: T(22.5, 43.6), pond: T(14.5, 45.4), bench: T(28, 40.6), garden: T(24.5, 49.5), pen: T(38, 49.5), arch: T(44.5, 46.6), sword: T(24.5, 48.6), pole: T(43.5, 35.5), mud: T(27.5, 57.6), north: [6, -9], east: [10.2, 2.4], bos: [5.6, -13.4] },
    };
  },
};
