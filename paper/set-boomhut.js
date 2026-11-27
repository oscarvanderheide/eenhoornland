// Up in the treehouse: a room of its own far beside the world (Oscar: "i want to go inside a room when entering the
// treehouse, like when entering a house. not just be in the outside world in a treehouse"). She comes in at the top of the
// rope ladder (treehouse.js). Plank walls, a window full of leaves, a paper lantern.
//   the telescope    a tap: she walks over and looks through it, and the picture is far out over another island, a
//                    different one each time; a moment later (or a touch) she is back
//   the hammock      a tap: she climbs in and it rocks; any push or a touch and she is out again
//   the lantern      a tap: on or off
//   the zipline door in the back wall stands open: the cable goes past outside and its red bar hangs in the doorway.
//                    Walking through it she takes hold of the bar and whizzes down to the village (treehouse.js)
//   the hatch        at the front: walking down over it she is on the ladder again, and climbs down
import { THREE, paper, slab, card, blob, whiteEdge } from './kit.js';
import { roomShell, roomShot } from './rooms.js';

const W = 5.0, D = 3.2, H = 2.6, ZX = 1.5;   // (ZX: where the zipline doorway is in the back wall)
const LEAF = ['#6f9a5e', '#7fa676', '#86ad6e', '#5f8a55'];

export default {
  name: 'boomhut',
  build(S) {
    const { girl, sfx } = S, root = S.root;
    const { put, box, rect, P } = roomShell(S, { W, D, H, floor: '#d2a774', boards: '#b98a5a', wall: '#c99a68', side: '#b98a5a', dark: '#3d3430', windows: [[-.5, 1.55, .95, .8]], openings: [[ZX, .9, 1.8]], sky: '#bfe3ea', frame: '#8d6a48', door: 'boomhut' });
    // the planks of the back wall, and leaves crowding round outside the window and the doorway
    for (let i = 0; i < 11; i++) { const x = -W / 2 + .45 * (i + 1); if (Math.abs(x - ZX) < .5 || (Math.abs(x + .5) < .55)) continue; put(box(.025, H - .05, .01, '#a97a4e'), x, H / 2, -D / 2 + .045); }
    put(box(.025, .7, .01, '#a97a4e'), -.5, 2.3, -D / 2 + .045); put(box(.025, .9, .01, '#a97a4e'), -.5, .55, -D / 2 + .045);
    for (const [x, y, r, k] of [[-.95, 1.2, .38, 0], [-.05, 1.95, .42, 1], [-.25, 1.15, .3, 2], [-.8, 2.0, .3, 3], [ZX - .55, 1.6, .45, 2], [ZX + .5, 1.3, .5, 0], [ZX + .2, 2.0, .5, 1], [ZX - .3, .5, .4, 3], [ZX + .45, .4, .35, 1]]) {
      const c = new THREE.Mesh(new THREE.CircleGeometry(r, 16), P(LEAF[k])); put(c, x, y, -D / 2 - .4 - k * .05); }
    // outside the doorway: a bit of the deck, the cable going down past it, and the bar hanging in the doorway. A tap on any of
    // it (or walking into the doorway) and she is out on the bar
    const out = new THREE.Group(); root.add(out);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), P('#bfe3ea')), ZX, 1.1, -D / 2 - .9, out);
    for (let i = 0; i < 3; i++) put(box(1.1, .05, .2, i % 2 ? '#c79a66' : '#d2a774'), ZX, .03, -D / 2 - .15 - i * .22, out);
    { const cab = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, 3, 5), P('#5a4e66')); cab.rotation.z = Math.PI / 2 - .35; put(cab, ZX + .3, 2.0, -D / 2 - .3, out); }
    const bar = new THREE.Group(); bar.position.set(ZX - .05, 2.0 - .02, -D / 2 - .3); bar.userData.live = true; out.add(bar);
    { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .05, 12), P('#e0b453')); wheel.rotation.x = Math.PI / 2; bar.add(wheel);
      for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .62, 4), P('#d8c9a8')); r.position.set(s * .2, -.33, 0); r.rotation.z = -s * .3; bar.add(r); }
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .55, 8), P('#d9706c')); grip.rotation.z = Math.PI / 2; grip.position.y = -.62; grip.castShadow = true; bar.add(grip); }
    S.door('tokkel', [ZX - .45, -D / 2 + .02, ZX + .45, -D / 2 + .4], [ZX, -D / 2 + 1.0], [0, -1]);   // through the doorway: onto the bar outside (treehouse.js)
    const [zx, zz] = S.at([ZX, -D / 2 + .5]);
    S.tap(out, () => { if (S.playing()) return; S.walkThen(zx, zz, () => S.through('tokkel'), .4); }, 'deur-tokkel');
    // the hatch at the front: a square hole with the ladder's top rungs in it
    root.add(slab(rect(-.42, D / 2 - .62, .42, D / 2 - .06), .012, .012, P('#4a3a30'), P('#4a3a30')));
    for (const z of [D / 2 - .45, D / 2 - .22]) put(box(.5, .03, .05, '#a97a4e'), 0, .03, z);
    for (const s of [-1, 1]) put(box(.025, .02, .5, '#d8c9a8'), s * .22, .03, D / 2 - .34);

    /* ---------------- the telescope at the window ---------------- */
    const scope = new THREE.Group(); scope.position.set(-.15, 0, -D / 2 + .7); root.add(scope);
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28, l = box(.03, .95, .03, '#7a5a3e'); l.position.set(Math.cos(a) * .16, .46, Math.sin(a) * .16); l.rotation.set(Math.sin(a) * .2, 0, -Math.cos(a) * .2); scope.add(l); }
    const tube = new THREE.Group(); tube.position.y = .95; tube.rotation.set(-.35, -.25, 0); tube.userData.live = true; scope.add(tube);
    { const t1 = new THREE.Mesh(new THREE.CylinderGeometry(.06, .085, .75, 12), P('#e0b453')); t1.rotation.x = Math.PI / 2; t1.castShadow = true; tube.add(t1);
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .07, 12), P('#b98a3a')); t2.rotation.x = Math.PI / 2; t2.position.z = -.38; tube.add(t2); }
    S.solid({ x: -.15, z: -D / 2 + .7, r: .25 });
    const views = () => ['dorp', 'wei', 'strand', 'kasteel', ...(S.shared.island && S.shared.island.risen() ? ['regenboog'] : [])].map(n => S.middle(n)).filter(Boolean);   // (the rainbow island only once it has risen from the sea)
    let looks = 0, lt = -1;
    const lookToy = { look: [0, 0], shot: { span: 34, tall: 22, rise: .55, riseTall: .7, dof: .1, range: 8, fx: 1, fz: 1, lag: 1 }, rate: 1, step(dt, inp) {
      lt += dt; girl.view = 'back';
      if (lt > 3.6 || (lt > .7 && (inp.act || inp.x || inp.y))) { lt = -1; S.cut(); S.stopPlay(); } } };
    const [sx, sz] = S.at([.3, -D / 2 + 1.15]);
    const look = () => { if (S.playing()) return; S.walkThen(sx, sz, () => { const V = views(); if (!V.length) return; lookToy.look = V[looks++ % V.length]; lt = 0; S.play(lookToy); S.cut(); sfx.swish(2); tube.rotation.y = -.25 + (looks % 2 ? .12 : -.12); }, .4); };
    S.tap(scope, look, 'telescope');

    /* ---------------- the hammock: a striped cloth hung from two hooks, at the left ---------------- */
    const HX = -1.62, HZ = .55, hang = new THREE.Group(); hang.position.set(HX, 1.55, HZ); hang.userData.live = true; root.add(hang);
    { const cloth = []; for (let i = 0; i <= 16; i++) { const u = i / 16, x = (u - .5) * 1.25; cloth.push([x, -.95 + Math.sin(u * Math.PI) * -.18 + Math.abs(u - .5) * .6]); }
      const pts = [...cloth, ...cloth.slice().reverse().map(([x, y]) => [x, y + .16 + Math.sin((x / 1.25 + .5) * Math.PI) * .06])];
      const c = card(pts, .03, paper('#f2c65c', { side: THREE.DoubleSide }), paper('#e0a93a')); hang.add(c);
      const hem = card(cloth.map(([x, y]) => [x, y + .03]).concat(cloth.slice().reverse().map(([x, y]) => [x, y + .09])), .04, paper('#f4a6c4')); hang.add(hem);   // a pink stripe along it
      for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .85, 4), P('#d8c9a8')); r.position.set(s * .76, -.3, 0); r.rotation.z = s * .5; hang.add(r); } }
    for (const s of [-1, 1]) put(box(.08, 1.7, .08, '#8d6a48'), HX + s * .95, .85, HZ);
    S.wall(HX, HZ, 1.0, .18);
    let swing = 0, rock = 0, rocks = 0;
    const hamToy = { look: S.at([HX + .6, HZ]), rest: true, mode: 'on', t: 0, step(dt, inp) {
      const q = hamToy; q.t += dt; const [bx, bz] = S.at([HX, HZ]);
      if (q.mode === 'on') { const k = Math.min(1, q.t / .35); girl.x = bx; girl.z = bz + .55 * (1 - k) + .04; girl.lift = .62 * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = 1; if (k >= 1) { q.mode = 'in'; q.t = 0; rock = .22; rocks++; sfx.hop(); } return; }
      if (q.mode === 'in') { swing += dt * 2.1; rock = Math.max(.08, rock - dt * .02); const a = Math.sin(swing) * rock; hang.rotation.x = a; girl.z = bz + .04 + Math.sin(a) * .9; girl.lift = .62 - (1 - Math.cos(a)) * .9; girl.poseName = 'sit'; girl.view = 'side';
        if (q.t > .4 && (inp.act || inp.x || inp.y)) { q.mode = 'off'; q.t = 0; } return; }
      const k = Math.min(1, q.t / .3); girl.z = bz + .04 + k * .6; girl.lift = .62 * (1 - k) + Math.sin(k * Math.PI) * .25; girl.poseName = null;
      if (k >= 1) { girl.lift = 0; S.stopPlay(); } } };
    const [hx, hz] = S.at([HX, HZ + .6]);
    S.tap(hang, () => { if (S.playing()) return; S.walkThen(hx, hz, () => { if (S.playing()) return; hamToy.mode = 'on'; hamToy.t = 0; S.play(hamToy); }, .5); }, 'hangmat');

    /* ---------------- a paper lantern hanging from the roof, and a rug ---------------- */
    const lantern = new THREE.Group(); lantern.position.set(.75, 2.0, .1); root.add(lantern);
    const glow = new THREE.MeshStandardMaterial({ color: '#f6dfa6', emissive: '#f2b866', emissiveIntensity: 1.2, roughness: .9 });
    { const b = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), glow); b.scale.y = 1.15; lantern.add(b); for (const y of [-.2, .2]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .04, 10), P('#d9706c')); r.position.y = y; lantern.add(r); } const c = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .6, 4), P('#5a4e66')); c.position.y = .5; lantern.add(c); }
    const light = S.lamp(0, '#ffc98a', 7, 1.4); light.position.set(.75, 1.9, .1); let lit = true;   // (a lamp is placed in the set's own measure)
    S.tap(lantern, () => { lit = !lit; sfx.click(); }, 'lantaarn');
    root.add(slab(blob(.6, .6, 1.0, .55, 951, 32, .05), .018, .018, P('#9ed9cf'), whiteEdge));

    return {
      start: [0, D / 2 - .95], uni: [.9, D / 2 - .85],
      shadow: { follow: 20 },
      step({ dt, time }) {
        light.intensity += ((lit ? 1.9 : .15) - light.intensity) * Math.min(1, dt * 6); glow.emissiveIntensity = lit ? 1.2 : .1;
        lantern.rotation.z = Math.sin(time * 1.3) * .05; bar.rotation.z = Math.sin(time * 1.1) * .05;
        if (S.playing() !== hamToy) hang.rotation.x *= Math.exp(-dt * 2);
      },
      toys: { boomkamer: { state: () => ({ looks, looking: lt >= 0, rocks, lit, hammock: S.playing() === hamToy ? hamToy.mode : null }) } },
      shots: [roomShot('boomhut', 7.4, 5.6)],
      spots: { telescope: [-.15, 1.0, -D / 2 + .7], hammock: [HX, .9, HZ], zipline: [ZX, 1.4, -D / 2 - .3] },
      places: { start: [0, D / 2 - .95], zipline: [ZX, -D / 2 + 1.0], telescope: [.3, -D / 2 + 1.15] },
    };
  },
};
