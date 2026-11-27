// The forest, as a blockout: real ground, real trees (as many as a forest has: this is the heaviest set for the phone), the
// cave's rock and the rest in grey card. Reached from the village over the north bridge, through the gate (paper.js).
// Places come from the pixel game's map (js/map.js) by T() below; shapes are cut by hand. Numbers copied, never imported.
import { THREE, rng, paper, slab, card, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge } from './kit.js';
import { shore, meadow, bouquet, pinwheel, cabin, witchHouse, GROUND } from './props.js';
import { findSpots, inOval, plantAt, fern, toadstool, fallenLeaf } from './flora.js';
import { musician, witch } from './folk.js';
import { PEOPLE2, PROPS2 } from './people2.js';
import { hedgehog, owl, squirrel, butterfly, deer, boars } from './critters.js';
import { befriend } from './companion.js';
import { picnic } from './picnic.js';
import { treehouse } from './treehouse.js';
import { bosLand, BACK, SPREAD } from './lands.js';

/** a tile of the pixel game's map -> a place on this set (0.6 of a step per tile, the middle of the forest is 0, 0) */
const K = SPREAD, T = (x, z) => [(x - 33) * .6 * K, (z - 14) * .6 * K], kk = pts => pts.map(([x, z]) => [x * K, z * K]);
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
    const { SAND, GRASS, SAND_E, GRASS_E, bridge: BR } = bosLand();
    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [SAND_E, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, GROUND.wood], [GRASS_E, H_GRASS, .32, GROUND.wood]]);
    // the bridge from the village is the village's (set-dorp.js): it lands on this shore at bosLand().bridge

    S.sea({ land: [SAND, SAND_E], x0: -58, x1: 62, z0: -25, z1: 19, deep: [230, 180, 0, 0], fine: 1.8 });

    /* ---------------- the cave's rock: three slabs of pale stone and a dark mouth ---------------- */
    const [rx, rz] = T(36, 6.3), ROCK = blob(rx, rz, 2.7, 1.15, 221, 40, .06);
    root.add(slab(ROCK, 1.1, 1.1, P('rock'), P('rock2'))); root.add(slab(blob(rx - .15, rz - .1, 2.05, .85, 222, 36, .06), 1.85, .75, P('rock2'), P('rock'))); root.add(slab(blob(rx + .2, rz - .2, 1.3, .58, 223, 30, .06), 2.45, .6, P('rock'), P('rock2')));
    const mouthZ = (() => { let z = rz; for (let v = rz; v < rz + 2; v += .01) if (inPoly(ROCK, rx, v)) z = v; return z; })();
    { const arch = [[-.5, 0], [.5, 0], [.5, .55]]; for (let i = 1; i < 12; i++) arch.push([Math.cos(i / 12 * Math.PI) * .5, .55 + Math.sin(i / 12 * Math.PI) * .42]); arch.push([-.5, .55]);
      const m = put(card(arch, .04, P('mouth')), rx, 0, mouthZ + .03); m.castShadow = false; }

    S.door('eihol', [rx - .6, mouthZ - .15, rx + .6, mouthZ + .45], [rx, mouthZ + 1.0], [0, -1]);   // the dark mouth: the way into the egg's cave (set-hol.js)
    // where she can stand
    S.floor(null, ROCK);
    S.floor(H_GRASS, GRASS); S.floor(H_GRASS, GRASS_E);
    S.floor(H_SAND, SAND, .22); S.floor(H_SAND, SAND_E, .22);

    /* ---------------- clearings and paths, cut by hand ---------------- */
    const laid = [];
    // (each piece lies a hair higher than the one before: two flat cards at exactly the same height flicker where they overlap)
    let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stones = (line, seed) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.19 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, P('path'), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    const [cx, cz] = T(30, 12.5), [ox, oz] = T(45, 12), [nx, nz] = T(16.5, 16.5), [ax, az] = T(23.5, 8);
    lay(blob(cx, cz, 3.2, 2.3, 231, 44, .06), GROUND.grass);                          // the clearing
    lay(blob(ox, oz, 2.6, 2.2, 232, 40, .06), GROUND.grass);                           // the orchard
    lay(blob(nx, nz, 1.9, 1.7, 233, 36, .06), GROUND.grass);                          // the nook
    lay(ribbon([[BR[0], BR[1] - .3], ...kk([[4.4, 3.7], [3.1, 2.3], [1.3, 1.1], [-.6, -.1], [-1.4, -.6]])], .85, 234), 'path');     // from the bridge into the clearing
    lay(ribbon([...kk([[-.5, -1.6], [.7, -2.2], [1.5, -2.7]]), [rx, mouthZ + .35]], .8, 235), 'path');                        // on to the mouth of the cave
    stones(kk([[-3.5, -1.5], [-3.9, -1.75], [-4.3, -2.0], [-4.7, -2.2], [-5.1, -2.4], [-5.4, -2.55]]), 240);                                           // to the atelier
    stones(kk([[4.3, 1.7], [4.75, 1.3], [5.2, .9], [5.65, .5], [6.1, .1]]), 250);                                                    // to the orchard
    { const [tx0, tz0] = T(56.5, 13); lay(blob(tx0 - .2, tz0 + 2.0, 3.0, 1.9, 236, 40, .06), GROUND.grass); stones(kk([[8.9, -1.0], [9.4, -.8], [9.9, -.55], [10.4, -.3], [10.9, -.05], [11.4, .25], [11.9, .5]]), 255); }   // the glade under the big oak, and the way to it

    // the picnic's glade: off every path, in the trees south-west of the clearing, a ring of pines round it and open to the south
    // (Oscar, 2026-11-27: "it should be more like within the forest in some area surrounded by trees not with paths")
    const [gx, gz] = [-9.2, 3.5]; lay(blob(gx, gz, 2.5, 1.8, 237, 40, .06), GROUND.grass);
    for (let i = 0; i < 10; i++) { const a = (-172 + i * 18.2) / 180 * Math.PI, x = gx + Math.cos(a) * (3.35 + (i % 2) * .5), z = gz + Math.sin(a) * (2.5 + (i % 3) * .35); S.pine(x, z, H_GRASS, 1.9 + (i % 3) * .5, ['#5f8665', '#6f9670', '#547a5c'][i % 3]); }
    // the harp's glade: hidden far in the east of the forest, off every path, pines all round it but for a gap in front
    const [hx, hz] = [17.8, 4.9]; lay(blob(hx, hz, 2.1, 1.5, 238, 36, .06), GROUND.grass);
    for (let i = 0; i < 12; i++) { const a = (-200 + i * 20) / 180 * Math.PI, x = hx + Math.cos(a) * (2.9 + (i % 2) * .45), z = hz + Math.sin(a) * (2.1 + (i % 3) * .3); S.pine(x, z, H_GRASS, 2.0 + (i % 3) * .55, ['#547a5c', '#5f8665', '#6f9670'][i % 3]); }

    /* ---------------- things, in grey: the atelier, the bushes somebody hides in, the big oak with the treehouse ---------------- */
    const theCabin = cabin(S, ax, H_GRASS, az);   // a cabin of logs where the pixel game had the atelier (Oscar: a log cabin, not a normal house)
    const bushes = [[28, 15], [33, 11], [27, 11], [43, 13], [47, 12], [21, 12], [32, 15]].map(([tx, tz]) => T(tx + .5, tz + .5));
    for (const [x, z] of bushes) { put(new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 8), P('bush')), x, .28, z).castShadow = true; S.solid({ x, z, r: .36 }); }
    const [tx, tz] = T(56.5, 13), theTree = treehouse(S, tx, tz, () => ['dorp', 'wei', 'strand', 'kasteel'].map(n => S.middle(n)).filter(Boolean));   // the big oak and its treehouse (treehouse.js)

    /* ---------------- trees: a forest's worth ---------------- */
    const sights = [[ox - .4, oz + .2], [ox + 2.6, oz - 2.4], [ox - 3.4, oz - 2.2], [nx + 5.2, nz + 2.6], [nx + .3, nz + .2], [gx, gz], [hx, hz], [cx - .2, cz - .25], [cx - 2.1, cz - .25], [cx + 1.7, cz - .25], [ax, az + 1.2], [tx - .6, tz + .8], [cx - 5.2, cz - 3.4], [ox + 4.6, oz + 2.8]];
    const greens = [['#7fa676', '#a3c08c'], ['#93b071', '#b3c98d'], ['#6f9670', '#8fb089']], R = rng(271); let n = 0;
    for (let i = 0; i < 3600 && n < 84; i++) {
      const x = (-15 + R() * 35) * K, z = (-7.6 + R() * 15.2) * K, pineTree = R() < .62, c = greens[Math.floor(R() * greens.length)];
      const on = inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null;
      if (!on || edgeDist(on, x, z) < .5 || inPoly(ROCK, x, z) || edgeDist(ROCK, x, z) < .7 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .55)) continue;
      if (Math.abs(x - ax) < 1.9 && Math.abs(z - az) < 1.9 || Math.abs(x - BR[0]) < 1.3 && z > BR[1] - 3.4 || Math.abs(x - rx) < 2.6 && z > rz) continue;   // nothing between the cave's mouth and the camera: the shot there is close and low, and a tree in front would hide her
      if (sights.some(([px, pz]) => Math.abs(x - px) < 1.9 && z > pz - .4 && z < pz + 5.5)) continue;   // a clear view from the camera (in the south) to each place where something lives: no trees folding away here (Oscar), so none are planted in the way
      if (S.solids.some(s => Math.hypot(s.x - x, s.z - z) < 1.15)) continue;
      S.pine(x, z, H_GRASS, pineTree ? 1.4 + R() * .8 : 2.1 + R() * .9, ['#5f8665', '#6f9670', '#547a5c', '#7fa676'][n % 4]);   // a forest of pines, small and tall (the round trees are the village's)
      n++;
    }

    // the forest floor: tufts (darker than the village's) and a few flowers, thicker in the clearings
    const floorSpot = R2 => {
      const x = (-15 + R2() * 35) * K, z = (-7.6 + R2() * 15.2) * K, on = inPoly(GRASS, x, z) ? GRASS : inPoly(GRASS_E, x, z) ? GRASS_E : null;
      if (!on || edgeDist(on, x, z) < .3 || inPoly(ROCK, x, z) || edgeDist(ROCK, x, z) < .25 || Math.abs(x - ax) < 1.5 && Math.abs(z - az) < 1.2 || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .45)) return null;
      return [x, H_GRASS + (laid.some(o => inPoly(o, x, z)) ? .018 : 0), z];
    };
    // the forest's own floor (flora.js): ferns, toadstools, fallen leaves; and a few flowers to pick, no tufts
    // planted, not scattered (PLAN.md): beds of ferns, fairy rings of toadstools, carpets of fallen leaves, three plots of bluebells
    const spotAt = (x, z) => { const v = [(x / K + 15) / 35, (z / K + 7.6) / 15.2]; let i = 0; return floorSpot(() => v[i++]); }, okAt = (x, z) => !!spotAt(x, z), anywhere = R2 => [(-15 + R2() * 35) * K, (-7.6 + R2() * 15.2) * K], FR = rng(403);
    const fernBeds = findSpots(FR, 18, 3.1, anywhere, okAt), rings = findSpots(FR, 7, 4.6, anywhere, okAt, fernBeds), carpets = findSpots(FR, 12, 3.4, anywhere, okAt, rings), bells = findSpots(FR, 3, 7, anywhere, (x, z) => okAt(x, z) && okAt(x + 1.3, z) && okAt(x - 1.3, z), fernBeds);
    plantAt(S, fernBeds.flatMap(([cx, cz]) => inOval(FR, cx, cz, 1.0, .7, 8, .3, okAt).map(([x, z]) => spotAt(x, z))), 403, fern);
    plantAt(S, rings.flatMap(([cx, cz]) => [0, 1, 2, 3, 4, 5, 6].map(i => spotAt(cx + Math.cos(i / 7 * 6.283) * .55, cz + Math.sin(i / 7 * 6.283) * .42)).filter(Boolean)), 404, toadstool);
    plantAt(S, carpets.flatMap(([cx, cz]) => inOval(FR, cx, cz, 1.1, .75, 11, .16, okAt).map(([x, z]) => spotAt(x, z))), 405, fallenLeaf);
    const flowers = bells.flatMap(([cx, cz]) => inOval(FR, cx, cz, 1.2, .7, 12, .26, okAt).map(([x, z, rr]) => [...spotAt(x, z), { kind: 'spike', col: '#bba6ea', big: 1.25 - rr * .35 }])); let fi = 0;
    const bunch = bouquet(S), grass = meadow(S, flowers.length, () => flowers[fi++] || null, 402, 0, ['#7a9a5c', '#8fae6e', '#6f9057'], bunch);

    // a tree each for the two squirrels that live away from the oak
    S.lollipop(cx - 5.7, cz - 3.6, H_GRASS, .7, '#7fa676', '#a3c08c', 480, 1.5); S.lollipop(ox + 5.1, oz + 2.6, H_GRASS, .65, '#93b071', '#b3c98d', 481, 1.4);

    // who lives here (critters.js): the shy hedgehog in the nook, the owl asleep on the cave's ledge, the squirrel at the oak
    const live = { egel: hedgehog(S, nx + .3, nz + .2), uil: owl(S, rx - 2.3, rz + .45, 1.1), eekhoorn: squirrel(S, tx - .8, tz + .6, 1.4, 'eekhoorn', [tx, tz - .15, .5]),
      // more of the forest's own (Oscar: deer, boar, squirrels): a shy fawn that grazes in the orchard, a row of boar piglets rooting in the west, two more squirrels
      hert: deer(S, [[ox - .4, oz + .2], [ox + 2.6, oz - 2.4], [ox - 3.4, oz - 2.2]]), zwijn: boars(S, nx + 5.2, nz + 2.6), eekhoorn2: squirrel(S, cx - 5.2, cz - 3.4, 1.3, 'eekhoorn2', [cx - 5.7, cz - 3.6, .1]), eekhoorn3: squirrel(S, ox + 4.6, oz + 2.8, 1.2, 'eekhoorn3', [ox + 5.1, oz + 2.6, .1]) };
    S.featherFrom(live.uil.f, 'uil');   // once the unicorn has grown, a tap on the owl lets a feather drift down for the wings (paper.js)
    befriend(S, live.hert, { byTap: false, isFriend: (st => () => st().mode === 'friend')(live.hert.state), own: false, speed: 2.4, gap: 1.4 });   // the forest's companion: the fawn, once it has come to her (she waits quietly), comes along (companion.js)
    // the picnic in the clearing: she sits down and the hedgehog and the squirrel come and sit with her (picnic.js); butterflies about
    // the witch's house: her own corner of the forest, south of the picnic's glade, off every path (Oscar: "she needs her own little house")
    const [hwx, hwz] = [-10.5, 8.8]; lay(blob(hwx - .3, hwz + .6, 2.8, 1.9, 239, 40, .06), paper('#7f9e6a'));
    const house = witchHouse(S, hwx, H_GRASS, hwz);
    for (const [cx, cz] of [[hx + .6, hz - .4], [nx + .8, nz + .6], [ox + 1.4, oz - 1.2], [gx + 1.6, gz - .8]]) S.coinAt(cx, cz);   // coins lying about: in the harp's glade, the nook, the orchard, the picnic's glade
    const heks = witch(S, hwx - 2.0, hwz + 1.5);   // the witch and her pot, outside her door, left of it (folk.js)
    const harp = musician(S, 'harpist', PEOPLE2.harpist, PROPS2.noot2, hx - .2, hz - .2, { sound: () => S.sfx.harp(), play: [0, 1], rest: 0, end: 3, from: [.33, 1.0], sink: .09, solid: .5,
      listen: { seat: [hx - 1.25, hz + .75], loop: 4.6, guests: [live.egel, live.eekhoorn, live.eekhoorn2, live.eekhoorn3] } });   // she sits and listens, and the forest's animals come   // (folk.js)
    const thePicnic = picnic(S, gx - .1, H_GRASS + .02, gz + .1, [live.egel, live.eekhoorn]);
    const flies = { vlinder1: butterfly(S, cx + 1.4, cz - .6, 'v1'), vlinder2: butterfly(S, ox, oz + .3, 'v2', '#bba6ea', '#f6efe2') };

    return {
      step: e => { for (const c of Object.values(live)) c.step(e); for (const b of Object.values(flies)) b.step(e); bunch.step(e); grass.step(e); harp.step(e); heks.step(e); house.step(e); theTree.step(e); },
      toys: { ...live, ...flies, heks, harpist: harp, boomhut: theTree, picknick: thePicnic, hut: theCabin, bos: bunch, gras: grass },
      start: [BR[0] - .3, BR[1] - 2.2], uni: [BR[0] + .6, BR[1] - 1.6],
      shadow: { follow: 20 }, back: BACK, sky: 2,
      shots: [
        { name: 'grot', zone: [rx - 1.9, mouthZ - .2, rx + 1.9, mouthZ + 1.9], span: 8.5, tall: 6, rise: .22 },          // at the cave's mouth the camera comes close and low
        { name: 'eik', zone: [tx - 2.4, tz + .5, tx + 2.4, tz + 3.6], ax: tx, az: tz + 1.1, fx: .55, fz: .5, lag: 1, span: 9.5, tall: 7, min: 3, rise: -.16, riseTall: -.12, ly: 1.4, yaw: -.25, dof: 1.2, range: 1.4 },   // at the oak's foot the camera is already low on the grass, looking up at the treehouse
        { name: 'bos', span: 13, rise: .3 },
      ],
      spots: { grot: [rx, .6, mouthZ] },
      places: { start: [BR[0] - .3, BR[1] - 2.2], hert: [ox - .4, oz + 2.4], zwijn: [nx + 5.2, nz + 4.4], picnic: [gx - .2, gz + 1.3], witch: [hwx - 2.3, hwz + 2.85], harp: [hx - .9, hz + 1.2], clearing: [cx + 1.6, cz + .4], grot: [rx, mouthZ + .5], atelier: [ax, az + 1.5], orchard: [ox, oz], nook: [nx, nz], oak: [tx, tz + 1.1] },
    };
  },
};
