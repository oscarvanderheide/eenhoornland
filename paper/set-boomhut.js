// Up in the treehouse: a room of its own far beside the world (Oscar: "i want to go inside a room when entering the
// treehouse, like when entering a house. not just be in the outside world in a treehouse"). She comes in at the top of the
// rope ladder (treehouse.js). Plank walls, a window full of leaves, a paper lantern.
//   the telescope    a tap: she walks over and looks through it, and the picture is far out over another island, a
//                    different one each time; a moment later (or a touch) she is back
//   the chair        a hanging basket chair: a tap and she climbs in; it swings left and right, pushes in time swing it higher
//   the lantern      a tap: on or off
//   the zipline door in the back wall stands open: the cable goes past outside and its red bar hangs in the doorway.
//                    Walking through it she takes hold of the bar and whizzes down to the village (treehouse.js)
//   the hatch        at the front: walking down over it she is on the ladder again, and climbs down
import { THREE, paper, slab, card, blob, whiteEdge } from './kit.js';
import { roomShell, roomShot } from './rooms.js';
import { CARDS3 } from './cards3.js';
import { cutout } from './figures.js';
import { PAPER } from './kit.js';

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
    const scope = S.figure('kijker', CARDS3.kijker); scope.thing = true; [scope.x, scope.z] = S.at([-.15, -D / 2 + .7]); scope.face = 1;   // (a paper card, as everything is)
    S.solid({ x: -.15, z: -D / 2 + .7, r: .25 });
    const views = () => ['dorp', 'wei', 'strand', 'kasteel', ...(S.shared.island && S.shared.island.risen() ? ['regenboog'] : [])].map(n => S.middle(n)).filter(Boolean);   // (the rainbow island only once it has risen from the sea)
    let looks = 0, lt = -1;
    const lookToy = { look: [0, 0], shot: { span: 34, tall: 22, rise: .55, riseTall: .7, dof: .1, range: 8, fx: 1, fz: 1, lag: 1 }, rate: 1, step(dt, inp) {
      lt += dt; girl.view = 'back';
      if (lt > 3.6 || (lt > .7 && (inp.act || inp.x || inp.y))) { lt = -1; S.cut(); S.stopPlay(); } } };
    const [sx, sz] = S.at([.3, -D / 2 + 1.15]);
    const look = () => { if (S.playing()) return; S.walkThen(sx, sz, () => { const V = views(); if (!V.length) return; lookToy.look = V[looks++ % V.length]; lt = 0; S.play(lookToy); S.cut(); sfx.swish(2); scope.hopV = 1.2; }, .4); };
    scope.onTap = look;

    /* ---------------- the hanging chair: a woven basket on a rope from the roof, at the left (Oscar: the hammock was clunky) ----------------
       A tap and she climbs in. It swings left and right like a real pendulum: a push the way it is already going, as it comes
       through the bottom, swings it higher (as the playground's swing); any other touch and she climbs out */
    const HX = -1.55, HZ = .45, PY = 2.45, LS = 1.62, hang = new THREE.Group(); hang.position.set(HX, PY, HZ); hang.userData.live = true; root.add(hang);
    { const t = new THREE.CanvasTexture(cutout(CARDS3.hangstoel.w, CARDS3.hangstoel.h, c => CARDS3.hangstoel.draw(c, 0), PAPER, 1.5)); t.colorSpace = THREE.SRGBColorSpace;
      const Hc = CARDS3.hangstoel.size, Wc = Hc * CARDS3.hangstoel.w / CARDS3.hangstoel.h, m = new THREE.Mesh(new THREE.PlaneGeometry(Wc, Hc), new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: .95, side: THREE.DoubleSide }));
      m.position.y = -Hc / 2; m.castShadow = true; hang.add(m); }
    S.solid({ x: HX, z: HZ, r: .45 });
    let th = 0, om = 0, rocks = 0, best = 0;
    const K = 9.8 / LS * .8;
    const chairToy = { look: S.at([HX + .5, HZ]), rest: true, mode: 'on', t: 0, step(dt, inp) {
      const q = chairToy; q.t += dt; const [bx, bz] = S.at([HX, HZ]);
      const seat = a => [bx + Math.sin(a) * LS, PY - Math.cos(a) * LS - .14];
      if (q.mode === 'on') { const k = Math.min(1, q.t / .4), [x, y] = seat(th); girl.x = bx + (x - bx) * k; girl.z = bz + .5 * (1 - k) + .1; girl.lift = y * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = 1;
        if (k >= 1) { q.mode = 'in'; q.t = 0; rocks++; sfx.hop(); om = .9; } return; }
      if (q.mode === 'in') {
        // a pendulum: a push in time adds, against it brakes; it sways down by itself
        const px = inp.x || 0; if (px && Math.abs(th) < .35) om += px * (Math.sign(px) === Math.sign(om || px) ? 2.4 : 1.2) * dt;
        om += (-K * Math.sin(th) - .25 * om) * dt; th += om * dt; th = Math.max(-.9, Math.min(.9, th)); best = Math.max(best, Math.abs(th));
        hang.rotation.z = th; const [x, y] = seat(th); girl.x = x; girl.z = bz + .1; girl.lift = y; girl.lean = th; girl.poseName = 'sit'; girl.view = 'side'; girl.face = om >= 0 ? 1 : -1;
        if (q.t > .4 && (inp.act || inp.y)) { q.mode = 'off'; q.t = 0; } return; }
      const k = Math.min(1, q.t / .35), [x, y] = seat(th); girl.x = x; girl.z = bz + .1 + k * .55; girl.lift = y * (1 - k) + Math.sin(k * Math.PI) * .25; girl.poseName = null; girl.lean = 0;
      if (k >= 1) { girl.lift = 0; S.stopPlay(); } } };
    const [hx, hz] = S.at([HX + .1, HZ + .6]);
    S.tap(hang, () => { if (S.playing()) return; S.walkThen(hx, hz, () => { if (S.playing()) return; chairToy.mode = 'on'; chairToy.t = 0; S.play(chairToy); }, .5); }, 'hangstoel');

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
        if (S.playing() !== chairToy) { om += (-K * Math.sin(th) - .6 * om) * dt; th += om * dt; hang.rotation.z = th; }   // (empty, it sways to a stop)
      },
      toys: { boomkamer: { state: () => ({ looks, looking: lt >= 0, rocks, lit, chair: S.playing() === chairToy ? chairToy.mode : null, best: +best.toFixed(2) }) } },
      shots: [roomShot('boomhut', 7.4, 5.6)],
      spots: { telescope: [-.15, .62, -D / 2 + .7], chair: [HX, 1.0, HZ], zipline: [ZX, 1.4, -D / 2 - .3] },
      places: { start: [0, D / 2 - .95], zipline: [ZX, -D / 2 + 1.0], telescope: [.3, -D / 2 + 1.15] },
    };
  },
};
