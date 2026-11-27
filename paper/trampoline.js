// The trampoline on the meadow (Oscar: "a trampoline in the meadow would be nice. with some nice physics where they cannot
// just jump up and down but also a bit to the sides"). A round paper trampoline: a padded ring in candy colours, a mat
// that really gives where she lands, six legs.
//   on           a tap: she climbs on and starts bouncing, small
//   higher       a push (any: the stick, a key, a touch) just as she lands and the mat throws her higher; let it be and
//                every bounce is a little lower. High enough and she does a somersault
//   sideways     steer while she is in the air (the stick, or a finger on where she should go): she drifts that way. The
//                mat is a bowl: landing off the middle it throws her back towards it, and the further out, the harder
//   off          bounce too far out and she flies off over the edge, onto the grass with a tumble. Or a tap on her: at
//                the next landing she climbs off
import { THREE, paper } from './kit.js';

const m3 = (geo, col, o) => { const m = new THREE.Mesh(geo, paper(col, o)); m.castShadow = m.receiveShadow = true; return m; };
const R = 1.25, TOP = .5, G = 14;   // (radius of the mat, its height, gravity as everywhere in the game)

export function trampoline(S, x, y, z) {
  const { girl, sfx } = S, g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g); const [wx, wz] = S.at([x, z]);
  // the mat: a disc whose middle gives (its points are moved every frame), the pad round it, the legs
  const matGeo = new THREE.CircleGeometry(R, 40, 0, Math.PI * 2); matGeo.rotateX(-Math.PI / 2);
  const mat = new THREE.Mesh(matGeo, paper('#5f6f9a', { side: THREE.DoubleSide })); mat.position.y = TOP; mat.receiveShadow = true; mat.userData.live = true; g.add(mat);
  const base = matGeo.attributes.position.array.slice();
  const COLS = ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea', '#f2b56b', '#9ed9a0'];
  for (let i = 0; i < 12; i++) { const p = m3(new THREE.TorusGeometry(R + .1, .09, 8, 10, Math.PI * 2 / 12 + .01), COLS[i % COLS.length]); p.rotation.x = Math.PI / 2; p.rotation.z = i * Math.PI * 2 / 12; p.position.y = TOP + .02; g.add(p); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, l = m3(new THREE.CylinderGeometry(.035, .04, TOP, 6), '#7a7f9a'); l.position.set(Math.cos(a) * (R + .05), TOP / 2, Math.sin(a) * (R + .05)); g.add(l); }
  // a little step to climb on by, at the front
  { const st = m3(new THREE.BoxGeometry(.4, .22, .26), '#c79a66'); st.position.set(0, .11, R + .32); g.add(st); }
  S.solid({ x, z, r: R + .1 });

  let flipDur = 1, mode = null, t = 0, px = 0, pz = 0, vx = 0, vz = 0, h = 0, vy = 0, want = .7, press = -9, flip = 0, bounces = 0, best = 0, flips = 0, offs = 0, dip = 0, leave = false;
  const bend = (cx, cz, d) => { const p = matGeo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const dx = base[i] - cx, dz = base[i + 2] - cz, edge = 1 - Math.min(1, Math.hypot(base[i], base[i + 2]) / R); p[i + 1] = -d * Math.exp(-(dx * dx + dz * dz) / .35) * Math.min(1, edge * 2.2); } matGeo.attributes.position.needsUpdate = true; };
  const toy = { look: [wx, wz], steer: true, rate: 1.1, shot: { span: 10, tall: 7.5, rise: .26, riseTall: .4, ly: 0, dof: .6, range: 2.5, fx: 1, fz: 1, lag: 1 }, at: () => [wx + px, wz + pz], step(dt, inp) {
    t += dt; const pushed = !!(inp.x || inp.y || inp.act || inp.move);
    if (pushed) press = t;
    if (inp.act) leave = true;
    if (mode === 'on') {   // up the step and onto the mat
      const k = Math.min(1, t / .45); px = 0; pz = (R + .35) * (1 - k); h = TOP + Math.sin(k * Math.PI) * .45 + (TOP * 0) * k; girl.poseName = null; girl.view = 'back';
      if (k >= 1) { mode = 'air'; vy = Math.sqrt(2 * G * want); h = TOP; t = 0; sfx.boing(); } }
    else if (mode === 'air') {
      // in the air: gravity, and a little steering
      if (inp.move) { vx += inp.move[0] * 3.2 * dt; vz += inp.move[1] * 3.2 * dt; } const sp = Math.hypot(vx, vz); if (sp > 2.4) { vx *= 2.4 / sp; vz *= 2.4 / sp; }
      vy -= G * dt; h += vy * dt; px += vx * dt; pz += vz * dt;
      best = Math.max(best, h - TOP); if (flip > 0) flip = Math.min(1, flip + dt / flipDur);
      const out = Math.hypot(px, pz);
      if (out > R + .15 && h < TOP + .4) { mode = 'fall'; t = 0; return toy.step(0, inp); }   // over the edge
      if (h <= TOP && vy < 0) {   // she lands: the mat gives under her
        mode = 'mat'; t = 0; dip = 0; h = TOP; bounces++; sfx.thud(); flip = 0;
        // the mat is a bowl: off the middle it throws her back in, harder the further out; her own drift is damped
        vx = vx * .7 - px * 2.0; vz = vz * .7 - pz * 2.0; } }
    else if (mode === 'mat') {   // down into the mat and out again
      const k = Math.min(1, t / .2); dip = Math.sin(k * Math.PI) * (.12 + want * .06); h = TOP - dip;
      if (k >= 1) {
        const timed = t - press < .32;   // pushed just as she landed: higher; not: a little lower
        want = Math.max(.45, Math.min(3.4, timed ? want * 1.08 + .45 : want * .82));
        if (leave) { mode = 'off'; t = 0; leave = false; want = .7; return; }
        vy = Math.sqrt(2 * G * want); mode = 'air'; t = 0; sfx.boing(); if (want > 1.8) S.confetti(wx + px, y + TOP, wz + pz, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 4, S.starGeo, 1.4);
        if (want > 2.4) { flip = .001; flipDur = 2 * vy / G * .85; flips++; if (want >= 3.3) S.coins.reward('trampoline', wx + px, y + h + 2, wz + pz); } } }
    else if (mode === 'off') {   // she climbs off at the front
      const k = Math.min(1, t / .5), sx = px, sz = pz; px = sx + (0 - sx) * k; pz = sz + (R + .5 - sz) * k; h = TOP * (1 - k) + Math.sin(k * Math.PI) * .4;
      if (k >= 1) { mode = null; girl.lift = 0; girl.lean = 0; S.stopPlay(); girl.x = wx; girl.z = wz + R + .55; return; } }
    else if (mode === 'fall') {   // over the edge, down onto the grass, a tumble
      if (!toy.fall) { offs++; const d = Math.hypot(px, pz) || 1; toy.fall = { vx: px / d * 2.2, vz: pz / d * 2.2, vy: 2.5 }; sfx.whoosh(); }
      const f = toy.fall; f.vy -= G * dt; h += f.vy * dt; px += f.vx * dt; pz += f.vz * dt; flip = Math.min(1, flip + dt * 2);
      if (h <= 0) { toy.fall = null; mode = null; flip = 0; girl.lift = 0; girl.lean = 0; S.stopPlay(); girl.x = wx + px; girl.z = wz + pz; girl.hopV = 2.6; sfx.thud(); S.confetti(girl.x, y + .2, girl.z, ['#9ed9a0', '#c6ead8'], 8, undefined, 1.6); return; } }
    girl.x = wx + px; girl.z = wz + pz; girl.lift = h; girl.view = mode === 'air' && Math.abs(vx) > .4 ? 'side' : 'front'; if (Math.abs(vx) > .2) girl.face = Math.sign(vx);
    girl.poseName = mode === 'air' ? (vy > 0 ? 'up' : null) : null; girl.lean = flip > 0 ? flip * Math.PI * 2 * (girl.face || 1) : 0;
    bend(px, pz, mode === 'mat' ? dip : 0);
    toy.look = [wx + px * .5, wz + pz * .5]; toy.shot.ly = Math.max(0, (h - TOP) * .45);
  } };
  let rest = false;
  const climb = () => { if (S.playing() || mode) return; S.walkThen(wx, wz + R + .55, () => { if (S.playing()) return; mode = 'on'; t = 0; want = .7; leave = false; flip = 0; S.play(toy); sfx.hop(); }, .7); };
  S.tap(g, climb, 'trampoline');
  return { toy, state: () => ({ mode, bounces, best: +best.toFixed(2), want: +want.toFixed(2), flips, offs, at: [px, pz] }), step({ dt }) {
    if (!mode && !rest) { bend(0, 0, 0); rest = true; } else if (mode) rest = false;
  } };
}
