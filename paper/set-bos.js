// The forest, as a blockout: real ground, real trees (as many as a forest has: this is the heaviest set for the phone), the
// cave's rock and the rest in grey card. Reached from the village over the north bridge, through the gate (paper.js).
// Places come from the pixel game's map (js/map.js) by T() below; shapes are cut by hand. Numbers copied, never imported.
import { THREE, rng, paper, slab, card, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { shore, GROUND } from './props.js';
import { bosLand, BACK } from './lands.js';

/** a tile of the pixel game's map -> a place on this set (0.6 of a step per tile, the middle of the forest is 0, 0) */
const T = (x, z) => [(x - 33) * .6, (z - 14) * .6];
const GREY = { path: '#e6e1d6', thing: '#b4afa4', dark: '#8f8a80', rock: '#bdb6c9', rock2: '#cbc5d6', mouth: '#4a4458', bush: '#a9b59c' };
const H_SAND = -.32, H_GRASS = 0;

export default {
  name: 'bos',
  build(S) {
    const root = S.root, P = c => paper(GREY[c]);
    const put = (m, x, y, z) => { m.position.set(x, y, z); root.add(m); return m; };
    const box = (w, h, d, c = 'thing') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const cyl = (r, h, c = 'thing', n = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), P(c)); m.castShadow = m.receiveShadow = true; return m; };
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

    /* ---------------- the land ---------------- */
    const { SAND, GRASS, SAND_E, GRASS_E, under, bridge: BR } = bosLand();
    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [SAND_E, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, GROUND.wood], [GRASS_E, H_GRASS, .32, GROUND.wood]], under);
    // the bridge from the village is the village's (set-dorp.js): it lands on this shore at bosLand().bridge

    S.sea({ land: [SAND, SAND_E], x0: -40, x1: 40, z0: -13, z1: 12, deep: [170, 120, 0, 0] });

    /* ---------------- the cave's rock: three slabs of pale stone and a dark mouth ---------------- */
    const [rx, rz] = T(36, 6.3), ROCK = blob(rx, rz, 2.7, 1.15, 221, 40, .06);
    root.add(slab(ROCK, 1.1, 1.1, P('rock'), P('rock2'))); root.add(slab(blob(rx - .15, rz - .1, 2.05, .85, 222, 36, .06), 1.85, .75, P('rock2'), P('rock'))); root.add(slab(blob(rx + .2, rz - .2, 1.3, .58, 223, 30, .06), 2.45, .6, P('rock'), P('rock2')));
    const mouthZ = (() => { let z = rz; for (let v = rz; v < rz + 2; v += .01) if (inPoly(ROCK, rx, v)) z = v; return z; })();
    { const arch = [[-.5, 0], [.5, 0], [.5, .55]]; for (let i = 1; i < 12; i++) arch.push([Math.cos(i / 12 * Math.PI) * .5, .55 + Math.sin(i / 12 * Math.PI) * .42]); arch.push([-.5, .55]);
      const m = put(card(arch, .04, P('mouth')), rx, 0, mouthZ + .03); m.castShadow = false; }

    // where she can stand
    S.floor(null, ROCK);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_E);
    S.floor(H_SAND, SAND, .22); S.floor(H_SAND, SAND_E, .22);

    /* ---------------- clearings and paths, cut by hand ---------------- */
    const laid = [];
    const lay = (pts, c, y = H_GRASS) => { root.add(slab(pts, y + .015, .015, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stones = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    const [cx, cz] = T(30, 12.5), [ox, oz] = T(45, 12), [nx, nz] = T(16.5, 16.5), [ax, az] = T(23.5, 8);
    lay(blob(cx, cz, 2.6, 1.85, 231, 44, .06), GROUND.grass);                          // the clearing
    lay(blob(ox, oz, 2.1, 1.8, 232, 40, .06), GROUND.grass);                           // the orchard
    lay(blob(nx, nz, 1.5, 1.35, 233, 36, .06), GROUND.grass);                          // the nook
    lay(ribbon([[BR[0], BR[1] - .3], [4.4, 3.7], [3.1, 2.3], [1.3, 1.1], [-.6, -.1], [-1.5, -.7]], .85, 234), 'path');     // from the bridge into the clearing
    lay(ribbon([[-.5, -1.5], [.7, -2.2], [1.5, -2.9], [rx, mouthZ + .35]], .8, 235), 'path');                        // on to the mouth of the cave
    stones([[-3.6, -1.6], [-4.2, -2.0], [-4.8, -2.3], [-5.3, -2.5]], 240);                                           // to the atelier
    stones([[4.3, 1.7], [5.0, 1.1], [5.7, .5], [6.3, -.1]], 250);                                                    // to the orchard

    /* ---------------- things, in grey: the atelier, the bushes somebody hides in, the big oak with the treehouse ---------------- */
    put(box(2.4, 1.8, 1.8, 'path'), ax, .9, az); put(card([[-1.38, 0], [1.38, 0], [0, .85]], 2.2, P('dark'), edgeMat), ax, 1.8, az); S.wall(ax, az, 1.35, 1.02);
    const bushes = [[28, 15], [33, 11], [27, 11], [43, 13], [47, 12], [21, 12], [32, 15]].map(([tx, tz]) => T(tx + .5, tz + .5));
    for (const [x, z] of bushes) { put(new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 8), P('bush')), x, .28, z).castShadow = true; S.solid({ x, z, r: .36 }); }
    const [tx, tz] = T(56.5, 13); put(cyl(.45, 3.2, 'dark', 12), tx, 1.6, tz); put(box(2.2, .12, 1.8), tx, 2.6, tz); put(box(1.8, 1.0, 1.4, 'path'), tx, 3.15, tz); S.solid({ x: tx, z: tz, r: .55 });
    for (const [x, z] of [[tx - 1.3, tz - .9], [tx + 1.2, tz - .6], [tx + .2, tz - 1.5]]) S.lollipop(x, z, 3.3, 1.05, '#7fa676', '#a3c08c', 260 + Math.round(x), .5);

    /* ---------------- trees: a forest's worth ---------------- */
    const greens = [['#7fa676', '#a3c08c'], ['#93b071', '#b3c98d'], ['#6f9670', '#8fb089']], R = rng(271); let n = 0;
    for (let i = 0; i < 1600 && n < 46; i++) {
      const x = -13 + R() * 30, z = -6 + R() * 12, pineTree = R() < .62, c = greens[Math.floor(R() * greens.length)];
      const on = inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null;
      if (!on || edgeDist(on, x, z) < .5 || inPoly(ROCK, x, z) || edgeDist(ROCK, x, z) < .7 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .55)) continue;
      if (Math.abs(x - ax) < 1.9 && Math.abs(z - az) < 1.9 || Math.abs(x - BR[0]) < 1.1 && z > 3.2 || Math.abs(x - rx) < 2.6 && z > rz) continue;   // nothing between the cave's mouth and the camera: the shot there is close and low, and a tree in front would hide her
      if (S.solids.some(s => Math.hypot(s.x - x, s.z - z) < 1.15)) continue;
      if (pineTree) S.pine(x, z, H_GRASS, 1.4 + R() * .8, ['#5f8665', '#6f9670', '#547a5c', '#7fa676'][n % 4]); else S.lollipop(x, z, H_GRASS, .45 + R() * .3, c[0], c[1], 400 + n, 1 + R() * .6);
      n++;
    }

    return {
      start: [4.6, 3.7], uni: [5.2, 4.3],
      shadow: { follow: 20 }, back: BACK, sky: 1.4,
      shots: [
        { name: 'grot', zone: [rx - 1.9, mouthZ - .2, rx + 1.9, mouthZ + 1.9], span: 8.5, tall: 6, rise: .22 },          // at the cave's mouth the camera comes close and low
        { name: 'bos', span: 13, rise: .3 },
      ],
      spots: { grot: [rx, .6, mouthZ] },
      places: { start: [4.6, 3.7], clearing: [cx, cz + .4], grot: [rx, mouthZ + .5], atelier: [ax, az + 1.5], orchard: [ox, oz], nook: [nx, nz], oak: [tx, tz + 1.1] },
    };
  },
};
