// The rainbow island: east of the beach over a long bridge. Everything here has a colour of its own. Made for paper.
//   the rainbow     a real arch at the back of the island: a tap and she rides up one side, over the top and down the other
//   paint puddles   three of them: walk through one and her feet leave prints of that colour, which stay
//   mushrooms       four springy ones in a ring: walking onto one bounces her, the big one highest
//   who lives here  two flamingos in a pink pond (one does as the other does), the parrot on its perch, the rabbit and its holes
// The rainbow stands in the north, behind everything: nothing tall between her and the camera.
import { THREE, rng, paper, slab, card, blob, ribbon, circlePts, inPoly, edgeDist, edgeMat, whiteEdge, grassMap, grassBump } from './kit.js';
import { shore, meadow, bouquet, pinwheel, bench, lantern, GROUND } from './props.js';
import { rainbow, paint, mushroom, rainbowTree, BANDS } from './wonders.js';
import { flamingo, parrot, rabbit } from './critters2.js';
import { candyFloss, alpaca, monkey, children } from './candy.js';
import { regenboogLand, BACK } from './lands.js';
import { gameHouse } from './games.js';
import { jetty } from './swim.js';
import { findSpots, inOval, plantAt, cottonTree, pompom, sprinkle } from './flora.js';

const H_SAND = -.32, H_GRASS = 0, DECK = -.12;
const COL = { plank: '#c9a878', post: '#8d6a48', path: '#f6ead8', pond: '#f4c6d4', hole: '#6f5a48' };

export default {
  name: 'regenboog',
  build(S) {
    const root = S.root, P = c => paper(COL[c] || c);
    const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    const { SAND, GRASS, POND, bridge: BR } = regenboogLand();

    // the rainbow island's own look (Oscar: the islands felt alike): 'candy land', ground of candy-floss pink, a striped path, clouds resting on the ground, giant sweets
    const CANDY = paper('#f4d2de', { map: grassMap, bump: grassBump }), MINT = paper('#c6ead8', { map: grassMap, bump: grassBump });
    shore(S, [[SAND, H_SAND, .55, GROUND.sand], [GRASS, H_GRASS, .32, CANDY]]);
    root.add(slab(POND, H_GRASS + .02, .02, P('pond'), whiteEdge));
    // no bridge from the beach any more (Oscar: the boat, as in the pixel game): a short jetty where the boat comes in (boat.js, set-strand.js)
    const J0 = BR.x1 - 2.2; for (let x = J0; x < BR.x1; x += .32) root.add(slab(rect(x, BR.z0 - .05, x + .28, BR.z1 + .05), DECK, .06, P('plank'), edgeMat));
    for (const x of [J0 + .15, BR.x1 - 1.1]) for (const z of [BR.z0, BR.z1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), P('post')); m.castShadow = true; m.position.set(x, DECK - .6, z); root.add(m); }

    S.sea({ land: [SAND], x0: -48, x1: 40, z0: -30, z1: 32, deep: [230, 180, 0, 0], fine: 1.8 });
    // under the sea until she has rowed through all seven rings (voyage.js); then it rises (Oscar: "it would be awesome if we
    // could have candy island raise from out of the sea once we travelled with the boat through the seven rings")
    const SUNK = -5.2; S.sink('down'); S.raise(SUNK); S.seaLand(false, false);
    let rising = -1, risen = false, first = true, rises = 0, riseT = 6.5;
    const [mx, mz] = S.at([0, 0]), shoreAt = i => { const [x, z] = SAND[Math.floor(i) % SAND.length]; return S.at([x, z]); };
    const riseNow = () => { risen = true; rising = -1; S.sink(false); S.raise(0); S.seaLand(true); S.gear.island = true; for (const f of S.myFigures()) { f.g.visible = true; } };
    S.shared.island = { risen: () => risen, middle: [mx, mz], now: () => { if (!risen) riseNow(); },
      rise: (fast = false) => { if (risen || rising >= 0) return false; rising = 0; riseT = fast ? 2.2 : 6.5; rises++; S.sink('rising'); S.sfx.whoosh(); return true; } };   // (fast: under her boat, which it throws up into the sky: voyage.js)
    S.floorBox(DECK, J0, BR.z0, BR.x1, BR.z1);
    jetty(S, 'regenboog', [BR.x1, 0], [-1, 0], DECK, BR.x1 - J0, false, () => risen);   // (the swim ring at its jetty: swim.js)
    S.water(H_GRASS, POND); S.floor(H_GRASS, GRASS); S.floor(H_SAND, SAND, .22);

    /* ---------------- paths ---------------- */
    const laid = []; let layer = 0;
    const lay = (pts, c, y = H_GRASS) => { const up = .015 + (layer++) * .003; root.add(slab(pts, y + up, up, typeof c === 'string' ? P(c) : c, whiteEdge)); laid.push(pts); return pts; };
    const stepping = (line, seed, cols = ['path']) => { const R2 = rng(seed); line.forEach(([x, z], i) => { const st = slab(circlePts(.2 + R2() * .06, seed + i, 14).map(([px, pz]) => [px * 1.25, pz]), H_GRASS + .025, .025, paper(cols[i % cols.length]), whiteEdge); st.position.set(x, 0, z); st.rotation.y = R2() * 3; root.add(st); laid.push(blob(x, z, .3, .3, 1, 8, 0)); }); };
    { const way = [[BR.x1 - .3, 0], [-12.04, 0.42], [-8.68, -0.42], [-5.04, 0.28], [-1.96, 0.84]]; lay(ribbon(way, .95, 631), 'path'); lay(ribbon(way, .62, 631), '#cbb9f0'); lay(ribbon(way, .3, 631), '#bfe8d8'); }   // from the bridge to the middle: a path in stripes
    lay(blob(-.28, 1.26, 2.6, 1.9, 632, 36, .06), 'path');                                                                      // the round place in the middle
    stepping([[-0.42, -1.12], [-0.28, -2.24], [-0.14, -3.36]], 640, BANDS);                                                             // up to the rainbow: stones in its colours
    stepping([[2.66, 1.82], [4.06, 2.38], [5.46, 2.94]], 646, BANDS);                                                               // to the pond

    /* ---------------- things ---------------- */
    const bow = rainbow(S, 0, H_GRASS, -5.04), bunch = bouquet(S); S.shared.rainbow = bow;   // (the voyage throws her onto its top: voyage.js, boat.js)
    const fruitTree = rainbowTree(S, 2.52, H_GRASS, 2.24);   // the rainbow tree, in the island's open middle: its fruit makes the baby unicorn grow (wonders.js)
    const pots = paint(S, [{ x: -6.44, z: 4.76, r: .62, col: '#e98f8f' }, { x: -3.08, z: 6.44, r: .56, col: '#8fc3e0' }, { x: 0.84, z: 5.88, r: .6, col: '#f2d86b' }], H_GRASS);
    const shrooms = [mushroom(S, -9.8, H_GRASS, -4.48, .42, '#e98f8f', .6), mushroom(S, -8.4, H_GRASS, -3.22, .5, '#f2b56b', 1), mushroom(S, -10.08, H_GRASS, -2.1, .62, '#bba6ea', 1.6), mushroom(S, -11.48, H_GRASS, -3.5, .36, '#9ed9a0', .3)];
    const live = { flamingo: flamingo(S, 8.68, 3.5), flamingo2: flamingo(S, 10.22, 4.06, 'flamingo2'), papegaai: parrot(S, 6.16, -3.08, 1.25), konijn: rabbit(S, [[4.48, 6.44], [7.56, 7.28], [2.66, 7.84]]) };
    S.featherFrom(live.papegaai.f, 'papegaai', -.4);   // the parrot's feather for the wings (paper.js): red, a yellow band, a blue tip
    live.flamingo.pair(live.flamingo2); live.flamingo2.pair(live.flamingo); live.flamingo2.f.face = -1; for (const q of [live.flamingo, live.flamingo2]) q.f.floatY = q.f.y = H_GRASS + .02;
    // the parrot's perch, and the rabbit's holes
    { const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, 1.25, 6), P('post')); p.position.set(6.16, .625, -3.08); p.castShadow = true; root.add(p); const bar = new THREE.Mesh(new THREE.BoxGeometry(.6, .05, .05), P('post')); bar.position.set(6.16, 1.23, -3.08); root.add(bar); S.solid({ x: 6.16, z: -3.08, r: .1 }); }
    for (const [x, z] of [[4.48, 6.44], [7.56, 7.28], [2.66, 7.84]]) { const h = slab(circlePts(.3, 660 + Math.round(x * 10), 14).map(([a, b]) => [a * 1.3, b * .8]), H_GRASS + .03, .03, P('hole'), paper('#c9a878')); h.position.set(x, 0, z); root.add(h); laid.push(blob(x, z, .5, .4, 1, 8, 0)); }
    // and more of the island's own (candy.js): the candy floss lady, two alpacas, two children playing tag (the monkey sits on a lollipop, below)
    const folk = { suikerspin: candyFloss(S, -11.5, 3.0), alpaca: alpaca(S, [[-13, 6.5], [-11, 8.4], [-14.4, 8.6], [-12.2, 9.4]]), alpaca2: alpaca(S, [[-11.6, 9.2], [-14, 7.2], [-12.6, 6.4]], 'alpaca2'), kinderen: children(S, 12.8, 7.6, 2.0, 1.2) };
    const benches = [], lamps = [], mills = [];   // (benches, lanterns and windmills belong to the village)
    // the game houses (games.js; Oscar: "in pixel art game we had houses with games"): memory in the west, stamps in the east, the xylophone at the back
    const HOUSES = [['memory', -16.2, -5.0], ['stamps', 15.7, -3.6], ['xylophone', 7.8, -10.6]];
    const games = Object.fromEntries(HOUSES.map(([kind, hx, hz]) => [kind, gameHouse(S, hx, hz, H_GRASS, kind)]));
    for (const [, hx, hz] of HOUSES) { lay(blob(hx, hz + 1.55, .75, .45, 700 + Math.round(hx), 18, .06), 'path'); }   // a little paved spot at each door

    /* ---------------- trees in six colours, at the back and the sides; flowers everywhere ---------------- */
    const keepOff = [[-16, 5, -9.5, 10.5], [10.4, 5.6, 15.4, 9.6], [-13.4, 1.6, -8.6, 4.6], [10.8, -2.2, 13.6, .8], [-7.56, -7.28, 7.56, 10.64], [-13.72, -6.44, -6.44, 4.76], [BR.x1 - 1, -2.2, -7.6, 2.2], [3.64, 0.84, 13.16, 10.36], [-8.96, 2.8, 3.08, 10.36], ...HOUSES.map(([, hx, hz]) => [hx - 2.2, hz - 1.8, hx + 2.2, hz + 3.0])];
    // planted, not scattered (PLAN.md): groves of candy-floss trees of one colour, at the back and the sides
    const R = rng(661), feet = [], treeOk = (x, z) => inPoly(GRASS, x, z) && edgeDist(GRASS, x, z) > .7 && !inPoly(POND, x, z) && edgeDist(POND, x, z) > 1 && !keepOff.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1) && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .7) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < 1.3); let n = 0;
    findSpots(R, 10, 3.6, R2 => [-15.4 + R2() * 30.8, -10.6 + R2() * 21], treeOk).forEach(([gx, gz], k) => { const a0 = R() * 6.283, many = 2 + (k % 2), mine = [];
      for (let i = 0; i < many; i++) { const a = a0 + i / many * 6.283, x = gx + Math.cos(a) * (.75 + R() * .3), z = gz + Math.sin(a) * (.5 + R() * .25); if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .6 || mine.some(([px, pz]) => Math.hypot(px - x, pz - z) < .9)) continue; mine.push([x, z]); cottonTree(S, x, H_GRASS, z, 670 + n, [BANDS[k % BANDS.length], '#fbf7ee']); feet.push([x, z]); n++; } });
    const sweetSpot = R2 => {
      const x = -15.4 + R2() * 30.8, z = -10.6 + R2() * 21.2;
      if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .3 || inPoly(POND, x, z) || edgeDist(POND, x, z) < .3 || laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < .22) || S.solids.some(q => Math.hypot(q.x - x, q.z - z) < .5)) return null;
      if ([[-7.84, 3.64, 2.52, 7.84], [-12.32, -5.46, -7.28, -1.12], ...HOUSES.map(([, hx, hz]) => [hx - 1.8, hz - 1.4, hx + 1.8, hz + 2.6])].some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return null;   // (clear ground round the paint and the mushrooms)
      return [x, H_GRASS, z];
    };
    // pompom flowers in plots of one colour each, on a cut of greener grass; sprinkles in a ring round every tree and round the middle
    { const spotAt = (x, z) => { const v = [(x + 15.4) / 30.8, (z + 10.6) / 21.2]; let i = 0; return sweetSpot(() => v[i++]); }, okAt = (x, z) => !!spotAt(x, z), roomy = (x, z) => okAt(x, z) && okAt(x + 1.2, z) && okAt(x - 1.2, z) && okAt(x, z + .7) && okAt(x, z - .7);
      findSpots(R, 14, 3.9, R2 => [-15.4 + R2() * 30.8, -10.6 + R2() * 21.2], roomy).forEach(([cx, cz], k) => { const col = BANDS[k % BANDS.length], up = .012 + (layer++) * .003; root.add(slab(blob(cx, cz, 1.6, 1.0, 680 + k, 24, .09), H_GRASS + up, up, MINT, MINT));
        plantAt(S, inOval(R, cx, cz, 1.25, .75, 14, .2, okAt).map(([x, z]) => [x, H_GRASS + up, z]), 690 + k, R3 => pompom(R3, col)); });
      const ring = (cx, cz, rx, rz, m) => { const out = []; for (let i = 0; i < m; i++) { const a = i / m * 6.283 + R() * .3, x = cx + Math.cos(a) * rx * (.9 + R() * .25), z = cz + Math.sin(a) * rz * (.9 + R() * .25); if (inPoly(GRASS, x, z) && edgeDist(GRASS, x, z) > .3 && !laid.some(o => inPoly(o, x, z))) out.push([x, H_GRASS, z]); } return out; };
      plantAt(S, [...feet.flatMap(([x, z]) => ring(x, z, .75, .55, 11)), ...ring(-.28, 1.26, 2.95, 2.2, 40)], 664, sprinkle); }
    // little clouds resting on the ground, and giant sweets: swirl lollipops and striped candy canes, in groups at the back and the sides
    const sweetTex = (draw, w = 128, h = 128) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const swirl = (a, b) => sweetTex((g, w) => { g.fillStyle = a; g.fillRect(0, 0, w, w); g.strokeStyle = b; g.lineWidth = 9; g.beginPath(); for (let i = 0; i < 160; i++) { const t = i / 160 * 6.283 * 3.2, r = 4 + i / 160 * 58; g.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); } g.stroke(); });
    const stripes = (a, b) => { const t = sweetTex((g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let y = -h; y < h * 2; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 24); g.lineTo(w, y + 40); g.lineTo(0, y + 16); g.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t; };
    const SWIRLS = [['#f4a6c4', '#fbf5ea'], ['#bba6ea', '#fbf5ea'], ['#9ed9cf', '#fbf5ea'], ['#f2d86b', '#e98f8f']].map(([a, b]) => new THREE.MeshStandardMaterial({ map: swirl(a, b), roughness: .9, side: THREE.DoubleSide }));
    const CANE = new THREE.MeshStandardMaterial({ map: stripes('#fbf5ea', '#e9636f'), roughness: .9 });
    const lolly = (x, z, r, k) => { const g = new THREE.Group(); g.position.set(x, H_GRASS, z); root.add(g); const st = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.3, 8), paper('#fbf5ea')); st.position.y = .65; st.castShadow = true; g.add(st);
      const back = card(circlePts(r + .05, 900 + k, 28), .04, whiteEdge); back.position.set(0, 1.3 + r * .85, -.03); back.castShadow = true; g.add(back);
      const face = new THREE.Mesh(new THREE.CircleGeometry(r, 32), SWIRLS[k % SWIRLS.length]); face.position.set(0, 1.3 + r * .85, .005); g.add(face); S.solid({ x, z, r: .2 }); };
    const cane = (x, z, k) => { const g = new THREE.Group(); g.position.set(x, H_GRASS, z); g.rotation.y = k % 2 ? .4 : -.3; root.add(g); const st = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.5, 12), CANE); st.position.y = .75; st.castShadow = true; g.add(st);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(.26, .08, 10, 16, Math.PI), CANE); hook.position.set(.26, 1.5, 0); hook.castShadow = true; g.add(hook); S.solid({ x, z, r: .18 }); };
    const cloud = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, H_GRASS, z); root.add(g); for (const [dx, dy, dz, r] of [[0, .22, 0, .5], [-.5, .14, .05, .36], [.48, .16, 0, .38], [.1, .4, -.05, .34]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 14, 10), paper('#fdfaf4')); m.scale.y = .62; m.position.set(dx * s, dy * s, dz * s); m.castShadow = m.receiveShadow = true; g.add(m); } S.solid({ x, z, r: .55 * s }); };
    const free = (x, z, r = .8) => inPoly(GRASS, x, z) && edgeDist(GRASS, x, z) > r && !inPoly(POND, x, z) && edgeDist(POND, x, z) > .8 && !laid.some(o => inPoly(o, x, z) || edgeDist(o, x, z) < r) && !S.solids.some(q => Math.hypot(q.x - x, q.z - z) < r + .3);
    let k = 0;
    for (const [x, z, s] of [[-14.28, -5.04, 1.1], [13.44, -7.28, 1.2], [-14.56, 7.56, 1.0], [13.86, 8.54, .9], [-3.64, -9.24, .8], [9.52, -8.96, .7]]) if (free(x, z, .9)) cloud(x, z, s);
    for (const [x, z, r] of [[-12.04, -7.84, .42], [-10.64, -8.68, .32], [11.2, -5.88, .46], [12.46, -4.76, .34], [-13.16, 5.32, .38], [10.92, 7.28, .4]]) if (free(x, z, .5)) lolly(x, z, r, k++);
    for (const [x, z] of [[-9.24, -8.96], [14.56, -5.04], [-11.48, 8.82], [12.04, 9.24]]) if (free(x, z, .5)) cane(x, z, k++);
    const grass = meadow(S, 0, sweetSpot, 662, 0, undefined, bunch);
    // the giant lollipop the monkey sits on
    { const g = new THREE.Group(); g.position.set(12.2, H_GRASS, -.6); root.add(g); const st = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 1.7, 8), paper('#fbf5ea')); st.position.y = .85; st.castShadow = true; g.add(st);
      const back = card(circlePts(.62, 990, 28), .05, whiteEdge); back.position.set(0, 2.2, -.03); back.castShadow = true; g.add(back);
      const face = new THREE.Mesh(new THREE.CircleGeometry(.57, 32), SWIRLS[2]); face.position.set(0, 2.2, .005); g.add(face); S.solid({ x: 12.2, z: -.6, r: .22 }); }
    folk.aapje = monkey(S, 12.2, -.5, H_GRASS + 2.62);

    return {
      start: [BR.x1 + 1.2, 0], uni: [BR.x1 + .4, .6],
      shadow: { follow: 20 }, back: BACK, sky: 3,
      step(e) {
        if (first) { first = false; if (S.gear.island || S.where() === 'regenboog') riseNow(); }   // (risen already in this save, or the game starts here)
        if (risen && !S.gear.island && S.where() !== 'regenboog') { risen = false; rising = -1; S.sink('down'); S.raise(SUNK); S.seaLand(false); }   // (a new story round, paper.js goHome: down under the sea again, to rise under her boat once more)
        if (rising >= 0) { const was = rising; rising += e.dt; const k = Math.min(1, rising / riseT), ease = 1 - Math.pow(1 - k, 3);
          S.raise(SUNK * (1 - ease) + Math.sin(rising * 5) * .05 * (1 - k));
          if (Math.floor(was / .35) !== Math.floor(rising / .35)) { for (let i = 0; i < 3; i++) { const [x, z] = shoreAt(Math.random() * SAND.length); S.confetti(x, -.6, z, ['#cfeaf0', '#ffffff', '#9fd3e0'], 10, undefined, 3.2); } S.sfx.splash(); }
          if (k >= 1) { riseNow(); S.sfx.chime(); S.coins.reward('eiland', mx, 2, mz); for (const f of S.myFigures()) S.confetti(f.x, (f.y || 0) + .6, f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 6, S.starGeo, 1.6); } }
        if (!risen && rising < 0) return;
        bow.step(e); pots.step(e); bunch.step(e); grass.step(e); fruitTree.step(e);
        for (const q of [...shrooms, ...benches, ...lamps, ...mills, ...Object.values(live), ...Object.values(folk)]) q.step(e);
      },
      toys: { opkomst: { state: () => ({ risen, rising: rising >= 0, rises }), rise: () => S.shared.island.rise() }, ...live, ...folk, boom: fruitTree, regenboog: bow, verf: pots, paddenstoel: shrooms[2], bos: bunch, gras: grass, ...Object.fromEntries(Object.entries(games).map(([k, h]) => ['huisje-' + k, h])) },
      shots: [
        { name: 'brug-regenboog', zone: [BR.x0 + .9, -1.5, BR.x1 - .2, 1.5], span: 26, tall: 13, rise: .42, dof: .7, range: 2.2, play: false },
        { name: 'boog', zone: [-6.72, -7.56, 6.72, -1.68], span: 17, tall: 10, rise: .3 },   // by the rainbow: far enough back to see the whole arch
        { name: 'regenboog', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { regenboog: [2.55, 2.55, -5.04], paddenstoel: [-10.08, .6, -2.1] },
      places: { start: [BR.x1 + 1.2, 0], middle: [-0.28, 1.68], tree: [2.52, 4.2], bow: [-0.14, -3.08], paint: [-6.44, 6.44], pond: [7.28, 5.04], shrooms: [-7.84, -1.68], rabbit: [4.76, 8.26], west: [BR.x0 + 2, 0], memory: [-16.2, -2.8], candyfloss: [-10.1, 3.9], alpacas: [-12.5, 5.2], children: [12.8, 5.8], monkey: [12.2, .6], stamps: [15.7, -1.4], xylophone: [7.8, -8.4] },
    };
  },
};
