// The snow island: a bonus far in the north (Oscar: "a bonus area like a snow area with a santa and iglo's, penguins,
// reindeer, christmas trees, sleigh, snowball throwing"). Only the flying unicorn gets here; Santa's sleigh flies her home.
// A little winter wonderland, its own snow, ice, firs, holly and lights (snow.js has what lives and plays here):
//   the big tree      in the middle, on a round of packed snow: a tap and its lights twinkle to a tune
//   Santa             at the door of his red workshop in the north-west; his sleigh and three reindeer beside it
//   the igloos        three, in the north-east; penguins waddle round them and slide across the frozen pond below
//   the snowball yard in the south-west: a heap of snow to make snowballs from, and the snowman she builds
//   the ice           the frozen pond: she glides on it
// The camera looks from the south: tall things stand at the back and the sides, the south is open.
import { THREE, rng, paper, slab, card, blob, ribbon, inPoly, edgeDist, whiteEdge } from './kit.js';
import { sneeuwLand } from './lands.js';
import { fir, igloo, iglooGlow, workshop, iceLantern, lanternsLit, christmasTree, snowman, snowballs, santa, penguins, reindeer, sleigh, flakes, iceGlide, snowMap, iceMap, PUFF } from './snow.js';

const H = 0, SHORE = -.32;

export default {
  name: 'sneeuw',
  build(S) {
    const root = S.root, { SNOW: RIM, ICE: LAND } = sneeuwLand();   // (lands.js: the outer outline is the icy shore, the inner one the snow on top)
    const POND = blob(9.6, 1.0, 3.5, 2.0, 911, 40, .05);

    /* ---------------- the land: an icy rim, thick snow on top, the frozen pond ---------------- */
    const SNOWP = paper('#eef3f8', { map: snowMap }), RIMP = paper('#d3e4ee', { map: snowMap }), SIDE = paper('#e3ecf3'), ICEP = paper('#c4e1ec', { map: iceMap });
    root.add(slab(RIM, SHORE, .55, RIMP, SIDE)); root.add(slab(LAND, H, .32, SNOWP, SIDE));
    root.add(slab(POND, H + .025, .025, ICEP, paper('#e9f3f8')));
    S.sea({ land: [RIM], x0: -40, x1: 40, z0: -30, z1: 30, deep: [230, 180, 0, 0], fine: 1.8 });
    S.floor(H, POND); S.floor(H, LAND); S.floor(SHORE, RIM, .22);   // (the pond is ice, not water: she stands on it, and glides)

    /* ---------------- paths of packed snow ---------------- */
    const laid = [POND]; let layer = 0;
    const lay = (pts, c = '#dbe5ee') => { const up = .015 + (layer++) * .003; root.add(slab(pts, H + up, up, paper(c, { map: snowMap }), whiteEdge)); laid.push(pts); return pts; };
    lay(blob(0, -.2, 3.3, 2.4, 912, 40, .06));                                                    // the round place round the tree
    lay(ribbon([[.2, 11.4], [.4, 8.0], [-.3, 5.0], [0, 2.0]], .95, 913));                          // from the south up to the tree
    lay(ribbon([[-2.6, -1.0], [-5.2, -2.6], [-7.6, -4.2], [-8.6, -5.3]], .9, 914));                 // west, to Santa's door
    lay(blob(-9.4, -4.7, 2.6, 1.3, 915, 30, .06));                                                  // the snow trodden flat before the workshop and the sleigh
    lay(ribbon([[2.8, -1.0], [5.2, -2.8], [7.8, -4.2], [9.4, -4.6]], .9, 916));                     // east, to the igloos
    lay(blob(10.4, -4.4, 3.2, 1.4, 917, 30, .06));
    lay(ribbon([[-1.8, 1.6], [-4.2, 3.2], [-6.4, 4.6]], .85, 918));                                 // south-west, to the snowball yard
    lay(blob(-8.8, 4.6, 3.4, 1.9, 919, 34, .06), '#e3ebf2');

    /* ---------------- the things ---------------- */
    const tree = christmasTree(S, 0, H, -1.3);
    const shop = workshop(S, -9.6, H, -8.1);
    const igloos = [igloo(S, 10.2, H, -7.4, 1.55), igloo(S, 13.7, H, -4.9, 1.0), igloo(S, 6.6, H, -8.6, 1.05)];
    for (const [x, z] of [[-3.9, -2.0], [-6.6, -3.4], [1.3, 5.4], [-1.3, 7.8], [4.2, -2.2], [6.9, -3.6]]) iceLantern(S, x, H, z);
    const man = snowman(S, -11.6, H, 3.3);
    const santaMan = santa(S, -7.7, -5.4);
    const deer = [reindeer(S, [[-12.4, -2.0], [-10.6, -1.6], [-11.6, -2.9]], 'rendier'), reindeer(S, [[-13.6, -1.0], [-12.0, -.6], [-14.0, -2.2]], 'rendier2'), reindeer(S, [[-10.0, -2.6], [-11.0, -.9], [-9.4, -1.5]], 'rendier3')];
    deer[1].f.face = -1;
    const VILLAGE = [1.0, 3.4];   // where the sleigh puts her down: on the open square south of the fountain (the world's measure: the village lies at 0, 0)
    const sled = sleigh(S, -13.2, -4.4, santaMan, deer, () => { for (let r = 0; r < 6; r += .4) for (let a = 0; a < 12; a++) { const x = VILLAGE[0] + Math.cos(a * .52) * r, z = VILLAGE[1] + Math.sin(a * .52) * r, h = S.heightAt(x, z); if (h !== null && [-2.2, -1.2, 0, .9, 2, 3.4, 4.8, 5.6].every(d => S.free(x + d, z, h) && S.free(x + d, z - .4, h)) && S.free(x - .9, z + .3, h)) return [x, z]; } return VILLAGE; });
    const flock = penguins(S, [7.6, -5.2, 13.6, -3.0], POND.map(p => S.at(p)), [10.2, -5.0], [[8.2, -1.6], [9.6, -1.8], [11.0, -1.4]]);
    const balls = snowballs(S, -7.6, H, 5.4, () => [
      ...man.spheres().map(([x, y, z, r]) => ({ at: () => [x, y, z], r, hit: yy => man.hit(yy) })),
      ...flock.targets(),
      ...deer.map(d => ({ f: d.f, at: () => [d.f.x, (d.f.y || 0) + .75, d.f.z], r: .55, hit: () => d.f.onTap() })),
      ...(santaMan.f.g.visible ? [{ f: santaMan.f, at: () => [santaMan.f.x, (santaMan.f.y || 0) + 1.0, santaMan.f.z], r: .6, hit: () => santaMan.hit() }] : []),
      { f: S.uni, at: () => [S.uni.x, (S.uni.y || 0) + .8, S.uni.z], r: .55, hit: () => { S.uni.hopV = 3; S.sfx.neigh(); S.confetti(S.uni.x, (S.uni.y || 0) + 1, S.uni.z, PUFF, 10, undefined, 1.8); } },
    ], [-18, -13, 18, 13]);
    const snowfall = flakes(S), ice = iceGlide(S, POND.map(p => S.at(p)));

    /* ---------------- planting: firs in groves at the back and the sides, holly, snowdrops, reeds by the ice ---------------- */
    const firs = []; let seed = 1;
    const grove = list => { for (const [x, z, s] of list) firs.push(fir(S, x, H, z, s, seed++)); };
    grove([[-14.2, -6.6, 1.15], [-12.6, -9.0, 1.0], [-15.0, -4.4, .85]]);                    // behind Santa's workshop
    grove([[-4.6, -9.4, 1.2], [-2.8, -10.2, .95], [-5.9, -8.0, .8]]);                        // the north, left of the tree
    grove([[3.0, -9.9, 1.05], [4.6, -9.0, .85]]);                                             // the north, right of the tree
    grove([[15.3, -1.4, 1.0], [14.6, 1.6, .85], [15.6, 3.6, .75]]);                            // the east
    grove([[-15.4, 1.0, .95], [-15.0, 3.2, .8]]);                                              // the west
    grove([[12.6, 7.6, 1.0], [14.2, 6.0, .8]]);                                                // the far south-east corner
    grove([[-13.8, 7.6, .8]]);
    // soft drifts of snow, in twos and threes along the edges (solid: she walks round them)
    const drift = (x, z, rx, rz, h) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), SNOWP); m.scale.set(rx, h, rz); m.position.set(x, H, z); m.castShadow = m.receiveShadow = true; root.add(m); S.solid({ x, z, r: Math.min(rx, rz) * .9 }); };
    for (const [x, z, rx, rz, h] of [[-8.2, -10.0, 1.4, .8, .5], [-6.6, -10.6, .9, .6, .35], [.4, -10.9, 1.5, .7, .45], [1.9, -10.4, .8, .5, .3], [12.8, -9.2, 1.3, .8, .5], [8.6, -10.0, .9, .6, .35], [-16.0, -1.4, .7, 1.1, .4], [16.2, -3.6, .7, 1.2, .45], [4.8, 10.0, 1.0, .5, .3], [-4.2, 10.4, .9, .45, .28], [-.2, -5.4, 1.7, .9, .55], [1.9, -6.5, .9, .6, .35], [-1.9, -6.6, .8, .55, .3]]) drift(x, z, rx, rz, h);   // (the last three behind the big tree: no room there to be hidden by it)
    // holly by Santa's door: dark leaves in round bushes, red berries
    const holly = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, H, z); root.add(g); const R = rng(Math.round(x * 31 + z * 7));
      for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.22 * s, 0), paper(i % 2 ? '#3d6b52' : '#4a7a5e')); b.position.set((R() - .5) * .4 * s, .2 * s + R() * .15 * s, (R() - .5) * .3 * s); b.rotation.set(R() * 3, R() * 3, 0); b.castShadow = true; g.add(b); }
      for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), paper('#d9443f')); const a = R() * 6.28; b.position.set(Math.cos(a) * .26 * s, .3 * s + R() * .2 * s, Math.sin(a) * .2 * s + .08); g.add(b); }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.2 * s, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), paper('#f3f6f9')); cap.scale.y = .45; cap.position.y = .42 * s; g.add(cap);
      S.solid({ x, z, r: .3 * s }); };
    for (const [x, z, s] of [[-6.6, -6.9, 1.0], [-6.0, -7.5, .8], [-12.3, -6.8, .9], [-11.6, -7.1, .7]]) holly(x, z, s);
    // snowdrops in two patches by the ice, white bells on bent green stems
    const snowdrop = R => { const g = new THREE.Group(), h = .16 + R() * .1, st = new THREE.Mesh(new THREE.CylinderGeometry(.008, .01, h, 4), paper('#7fa56b')); st.position.y = h / 2; g.add(st);
      const bell = new THREE.Mesh(new THREE.ConeGeometry(.04, .07, 6), paper('#fbfdff')); bell.position.set(.02, h - .02, 0); bell.rotation.z = .5; g.add(bell); return g; };
    { const R = rng(971); for (const [cx, cz] of [[5.2, 2.6], [6.0, 3.6], [13.9, 1.6]]) for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * .55, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * .7; if (inPoly(POND, x, z) || edgeDist(POND, x, z) < .25) continue; const o = snowdrop(R); o.position.set(x, H, z); root.add(o); } }
    // frosted reeds at the pond's south rim
    { const R = rng(972); for (let i = 0; i < 26; i++) { const a = .3 + R() * 2.4, x = 9.6 + Math.cos(a) * 3.75, z = 1.0 + Math.sin(a) * 2.2 + .15; if (!inPoly(LAND, x, z) || edgeDist(LAND, x, z) < .4) continue; const h = .35 + R() * .3, m = new THREE.Mesh(new THREE.CylinderGeometry(.012, .018, h, 4), paper('#9fb6a0')); m.position.set(x, H + h / 2, z); m.rotation.z = (R() - .5) * .25; m.castShadow = true; root.add(m); if (i % 3 === 0) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .12, 6), paper('#8d6a48')); t.position.set(x, H + h - .02, z); root.add(t); const sn = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), paper('#f6f9fb')); sn.position.set(x, H + h + .05, z); root.add(sn); } } }
    // a low wall of snow blocks by the yard: a fort to throw from
    for (let i = 0; i < 6; i++) { const a = -.9 + i * .32, x = -7.6 + Math.cos(a) * 1.9, z = 5.4 + Math.sin(a) * 1.4 + .9; const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .3), paper('#eaf1f7', { map: snowMap })); b.position.set(x, H + .16, z); b.rotation.y = -a - Math.PI / 2; b.castShadow = b.receiveShadow = true; root.add(b); S.solid({ x, z, r: .2 }); }

    /* ---------------- far out on the sea: icebergs, so the north never ends in nothing ---------------- */
    for (const [x, z, s, seedB] of [[-24, -17, 1.3, 1], [-9, -22, 1.8, 2], [10, -21, 1.5, 3], [25, -15, 1.1, 4], [27, 6, .8, 5], [-26, 4, .9, 6]]) {
      const R = rng(980 + seedB), pts = [[-1.6, 0]]; let px = -1.6; while (px < 1.5) { px += .35 + R() * .5; pts.push([Math.min(1.6, px), .5 + R() * 1.4 * (1 - Math.abs(px) / 2)]); } pts.push([1.6, 0]);
      const g = card(pts.map(([a, b]) => [a * s, b * s]), .4 * s, paper('#eef5f9'), paper('#bcd8e6')); g.position.set(x, -1.05, z); g.rotation.y = (R() - .5) * .6; root.add(g);
      const g2 = card(pts.map(([a, b]) => [a * s * .7, b * s * .8]), .3 * s, paper('#d4e7f0'), paper('#b2cfde')); g2.position.set(x + .6 * s, -1.06, z + .5 * s); g2.rotation.y = g.rotation.y + .4; root.add(g2); }

    const live = { santa: santaMan, sleigh: sled, ...Object.fromEntries(deer.map(d => [d.f.name, d])), penguins: flock };
    return {
      start: [0, 8.6], uni: [-1.1, 9.0],
      shadow: { follow: 20 }, sky: 2.6,
      step(e) {
        tree.step(e); shop.step(e); man.step(e); balls.step(e); santaMan.step(e); flock.step(e); sled.step(e); snowfall.step(e); ice.step(e);
        if (!sled.busy()) for (const d of deer) d.step(e);
        for (const t of firs) t.step(e);
        iglooGlow(e.eve); lanternsLit(e.eve, e.dt);
      },
      toys: { kerstboom: tree, sneeuwpop: man, sneeuwballen: balls, kerstman: santaMan, slee: sled, pinguins: flock, ijs: ice, ...Object.fromEntries(deer.map(d => [d.f.name, d])) },
      shots: [
        { name: 'iglo', zone: [5.4, -10.6, 16.6, -2.4], span: 11, tall: 7, rise: .2, riseTall: .34, dof: 1.2 },   // at the igloos: lower and closer, among the penguins
        { name: 'werkplaats', zone: [-16.6, -10.6, -5.4, -.6], span: 12.5, tall: 8, rise: .26, yaw: .22 },      // at Santa's: a little from the side, the workshop, Santa and the sleigh together
        { name: 'achter', zone: [-4.6, -11.4, 4.6, -4.4], span: 13, tall: 8.5, rise: .75, riseTall: .9 },   // behind the big tree: from high up, looking down past it
        { name: 'kerstboom', zone: [-3.6, -4.4, 3.6, 2.0], span: 15.5, tall: 10, rise: .26, ly: 1.1 },          // by the tree: further back and looking up, to see it to its star
        { name: 'ijsbaan', zone: [5.4, -2.4, 14.6, 4.4], span: 12.5, tall: 8, rise: .44 },                      // on the ice: looking down on it
        { name: 'sneeuw', span: 15, tall: 8.5, rise: .32 },
      ],
      spots: { kerstboom: [0, 2.5, -1.3], sneeuwpop: [-11.6, .8, 3.3], sneeuwhoop: [-7.6, .4, 5.4] },
      places: { start: [0, 8.6], tree: [0, 1.4], santa: [-6.3, -4.8], sleigh: [-13.6, -3.4], reindeer: [-11.4, -1.0], igloos: [10.2, -4.4], penguins: [11.6, -3.2], pond: [9.6, 1.0], heap: [-6.6, 6.0], snowman: [-10.5, 3.8], west: [-14.4, .6], east: [13.4, 2.6], north: [-1.0, -9.0] },
    };
  },
};
