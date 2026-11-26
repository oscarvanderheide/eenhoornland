// Toys: things that take her over for a while. Each is built from the kit at a place on a set and handed to the stage
// with S.play(toy) when she gets on; while she plays the stage gives the toy her input every frame (toy.step(dt, inp)):
//   inp.x    -1, 0 or 1: the stick, or a finger held left or right of her
//   inp.act  she was touched, or the jump key went down: for getting off
// One rule for every input: sideways pushes, touching her gets off. The toy moves her (S.girl: x, z, lift, lean, poseName,
// face) and calls S.stopPlay() when she is off. toy.look is where the camera looks meanwhile, so the picture holds still.
import { THREE, paper } from './kit.js';

const COL = { post: '#5f9fae', bar: '#e6b748', seat: '#d9706c', rope: '#efe8dc', chute: '#f2c65c', side: '#e2803e', rung: '#f4ecdc', deck: '#6fb0b8' };
const box = (parent, w, h, d, x, y, z, col, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paper(col)); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
/** a strip of card from (x0, y0) to (x1, y1) in the x-y plane, at depth z */
const beam = (parent, x0, y0, x1, y1, z, t, col, d = t) => box(parent, Math.hypot(x1 - x0, y1 - y0), t, d, (x0 + x1) / 2, (y0 + y1) / 2, z, col, Math.atan2(y1 - y0, x1 - x0));

/** The swing: a real pendulum, swinging left and right. A push in the direction she is already going, as she comes through
 *  the bottom, adds a little; a push against it brakes. So holding one way does almost nothing and pushing in time takes her
 *  higher and higher. Touching her (or the jump key) lets go: she flies as far as the swing throws her. */
export function swing(S, x, y, z) {
  const { girl, sfx } = S, PY = 2.0, L = 1.5, K = 9.8 / L * .8, DAMP = .14, PUSH = 1.45, MAX = 1.25, THROW = 1.45;
  const [wx, wz] = S.at([x, z]);
  const frame = new THREE.Group(); frame.position.set(x, y, z); S.root.add(frame);
  for (const fz of [-.5, .5]) for (const s of [-1, 1]) beam(frame, s * 1.25, 0, 0, PY + .05, fz, .09, COL.post);   // an A in front and one behind
  box(frame, .11, .11, 1.25, 0, PY + .06, 0, COL.bar);                                                              // the bar across the top
  const pivot = new THREE.Group(); pivot.position.set(0, PY, 0); pivot.userData.live = true; frame.add(pivot);
  for (const rz of [-.17, .17]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, L, 5), paper(COL.rope)); r.position.set(0, -L / 2, rz); r.castShadow = true; pivot.add(r); }
  box(pivot, .5, .05, .42, 0, -L, 0, COL.seat);
  for (const fz of [-.5, .5]) for (const s of [-1, 1]) S.solid({ x: x + s * 1.25, z: z + fz, r: .07 });
  let th = 0, om = 0, mode = null, t = 0, fly = null, puff = 0, splashes = 0;
  const seatY = () => y + PY - L * Math.cos(th);
  const toy = {
    look: [wx, wz + .4],
    step(dt, inp) {
      t += dt;
      if (mode === 'board') {   // a hop up onto the seat
        const k = Math.min(1, t / .3); girl.x = wx; girl.z = wz + (1 - k) * .75; girl.lift = (seatY() - y) * k + Math.sin(k * Math.PI) * .35; girl.poseName = k > .6 ? 'sit' : null; girl.face = 1; girl.view = 'side';
        if (k >= 1) { mode = 'swing'; sfx.hop(); } return;
      }
      if (mode === 'swing') {
        // the push: strongest at the bottom, with her when it goes her way and against her when it does not
        const drive = inp.x * PUSH * Math.cos(th) ** 2;
        om += (-K * Math.sin(th) - DAMP * om + drive) * dt; th += om * dt;
        if (Math.abs(th) > MAX) { th = Math.sign(th) * MAX; om *= -.2; }
        girl.x = wx + L * Math.sin(th); girl.z = wz; girl.lift = seatY() - y; girl.lean = th; girl.poseName = 'sit';   // she tilts with the ropes, as the seat does girl.face = 1; girl.view = 'side';
        if (Math.abs(om) > 1.3 && Math.abs(th) < .12 && t - puff > .35) { puff = t; sfx.swish(Math.abs(om)); }   // the air at the bottom of a good swing
        if (inp.act) letGo();
        return;
      }
      if (mode === 'fly') {
        const k = Math.min(1, t / fly.T); girl.x = fly.x0 + (fly.lx - fly.x0) * k; girl.z = wz + (fly.lz - wz) * k; girl.lift = Math.max(0, fly.y0 + fly.vy * t - 4.9 * t * t); girl.lean = fly.dir * -.25 * (1 - k); girl.poseName = 'up'; girl.face = fly.dir || 1;
        if (k >= 1 && fly.back !== null) {   // she came down where nobody can stand: in the pond or the sea a splash, and a hop back out
          if (S.heightAt(fly.lx, wz) === null) { splashes++; sfx.splash(); S.confetti(girl.x, y + .1, girl.z, ['#8fc3cc', '#f6efe2', '#6fb0b8'], 16, undefined, 2.8); } else sfx.thud();
          fly = { x0: girl.x, lx: fly.back, lz: wz, dir: -fly.dir, y0: 0, vy: 2.6, T: .53, back: null, big: false }; t = 0;
        } else if (k >= 1) { girl.lift = 0; girl.lean = 0; girl.poseName = null; girl.hopV = fly.big ? 2.4 : 1.2; sfx.thud(); if (fly.big) S.confetti(girl.x, y + .15, girl.z, ['#ecd3a0', '#f7ecd0', '#e2c58a'], 12, undefined, 1.8); mode = null; S.stopPlay(); }
      }
    },
  };
  /** she lets go: thrown as the swing moves, landing only where she can stand */
  function letGo() {
    // (thrown a good bit harder than a real swing would: a fling should be worth the pushing)
    const vx = THROW * L * om * Math.cos(th), vy = Math.max(2.6, THROW * L * om * Math.sin(th) + 2.6), y0 = girl.lift, T = (vy + Math.sqrt(vy * vy + 19.6 * y0)) / 9.8, dir = Math.sign(vx) || 1;
    let lx = girl.x + vx * T, lz = wz, back = null;
    if (Math.abs(lx - wx) < 1.5) { lx = wx; lz = wz + .8; }                                // too gentle to clear the frame: a hop down in front of it
    else if (!S.free(lx, wz, y)) { back = lx; for (let k = 0; k < 80 && !S.free(back, wz, y); k++) back -= dir * .15; if (Math.abs(back - wx) < 1.5) { back = null; lx = wx; lz = wz + .8; } }   // into the pond, the sea or a bench: she lands there all the same, and hops back to where there is floor
    fly = { x0: girl.x, y0, vy, T, lx, lz, dir, back, big: Math.abs(lx - wx) > 2.4 }; mode = 'fly'; t = 0; sfx.boing(); if (fly.big) sfx.whoosh();
  }
  const board = () => { if (S.playing()) return; S.walkThen(wx, wz + .75, () => { if (S.playing()) return; mode = 'board'; t = 0; S.play(toy); }, 1.1); };
  S.tap(frame, board);
  return {
    board, toy,
    /** every frame: the empty swing swings out by itself */
    step({ dt }) {
      if (mode !== 'swing' && mode !== 'board') { om += (-K * Math.sin(th) - .9 * om) * dt; th += om * dt; }
      pivot.rotation.z = th;
    },
    state: () => ({ mode, th, om, splashes }),
  };
}

/** The slide: up the ladder, a moment at the top, whoosh down the chute, a hop off the end. */
export function slide(S, x, y, z) {
  const { girl, sfx } = S, TOP = 1.25, X0 = .9, X1 = 2.95, Y1 = .2, [wx, wz] = S.at([x, z]);
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  const chuteY = lx => lx <= X0 ? TOP : lx >= X1 ? Y1 : TOP - (TOP - Y1) * (lx - X0) / (X1 - X0);
  for (const sz of [-.24, .24]) beam(g, .0, 0, .38, TOP + .45, sz, .06, COL.post);                                       // the ladder's rails
  for (let k = 1; k <= 5; k++) { const ry = k * TOP / 5.6; box(g, .05, .05, .5, .0 + .38 * ry / (TOP + .45), ry, 0, COL.rung); }   // rungs
  box(g, .55, .07, .6, .64, TOP, 0, COL.deck);                                                                           // the platform
  for (const [lx, sz] of [[.42, -.26], [.42, .26], [.86, -.26], [.86, .26]]) box(g, .06, TOP, .06, lx, TOP / 2, sz, COL.rung);
  beam(g, X0, TOP + .02, X1, Y1 + .02, 0, .05, COL.chute, .5);                                                           // the chute
  for (const sz of [-.27, .27]) beam(g, X0, TOP + .1, X1, Y1 + .1, sz, .05, COL.side);                                   // its sides
  box(g, .45, .05, .5, X1 + .2, Y1 + .02, 0, COL.chute); box(g, .06, (TOP + Y1) / 2, .06, (X0 + X1) / 2, (TOP + Y1) / 4, 0, COL.rung);
  S.wall(x + .45, z, .5, .36); S.wall(x + (X0 + X1) / 2 + .2, z, (X1 - X0) / 2 + .25, .32);
  let mode = null, t = 0, hop = null;
  const toy = {
    look: [wx + 1.4, wz + .3],
    step(dt) {
      t += dt;
      if (mode === 'climb') {   // rung by rung, in stop-motion steps
        const k = Math.min(1, t / .95), rung = Math.floor(k * 5) / 5; girl.x = wx - .12 + .5 * rung; girl.z = wz; girl.lift = TOP * rung; girl.poseName = 'up'; girl.face = 1; girl.view = 'side';
        if (k >= 1) { mode = 'sit'; t = 0; sfx.hop(); } return;
      }
      if (mode === 'sit') { girl.x = wx + X0 - .15; girl.lift = TOP + .04; girl.poseName = 'sit'; if (t > .45) { mode = 'whoosh'; t = 0; sfx.whoosh(); } return; }
      if (mode === 'whoosh') {
        const k = Math.min(1, t / .7), lx = X0 - .15 + (X1 + .3 - X0) * k * k; girl.x = wx + lx; girl.lift = chuteY(lx) + .04; girl.lean = .22; girl.poseName = 'sit';
        if (k >= 1) { mode = 'hop'; t = 0; hop = { x0: girl.x, y0: girl.lift }; sfx.boing(); } return;
      }
      if (mode === 'hop') {   // off the end, arms up, onto the sand
        const T = .42, k = Math.min(1, t / T); girl.x = hop.x0 + .85 * k; girl.lift = Math.max(0, hop.y0 + 1.6 * t - 4.9 * t * t * 2.2); girl.lean = 0; girl.poseName = 'up';
        if (k >= 1) { girl.lift = 0; girl.poseName = null; girl.hopV = 1.4; sfx.thud(); mode = null; S.stopPlay(); }   // (if something stands where she lands, the stage steps her clear of it)
      }
    },
  };
  const start = () => { if (S.playing()) return; S.walkThen(wx - .35, wz + .05, () => { if (S.playing()) return; mode = 'climb'; t = 0; S.play(toy); }, 1.1); };
  S.tap(g, start);
  return { start, toy, state: () => ({ mode }) };
}

/* ---------------- the kite ---------------- */
import { P, C, piece, line } from './cut.js';
/** the kite's card: a red and yellow diamond, a cross of sticks, a tail of three bows that swings (frames 0, 1, 2) */
const KITE = { w: 120, h: 190, frames: 3, size: .95, draw(g, f) {
  const sw = f === 1 ? -9 : f === 2 ? 9 : 0, bow = (x, y) => { piece(g, '#f2c65c', P([[x - 10, y - 6], [x, y], [x - 10, y + 6]]), .5); piece(g, '#e98f8f', P([[x + 10, y - 6], [x, y], [x + 10, y + 6]]), .5); };
  const tail = [[60, 116], [60 + sw * .5, 140], [60 + sw, 160], [60 + sw * .6, 178]];
  for (let i = 0; i < 3; i++) piece(g, '#8d6a48', C(...tail[i], ...tail[i + 1], 1.6), 0);
  tail.slice(1).forEach(([x, y]) => bow(x, y));
  piece(g, '#d9706c', P([[60, 10], [106, 62], [60, 120], [14, 62]])); piece(g, '#f2c65c', P([[60, 10], [106, 62], [60, 62]]), .4); piece(g, '#f2c65c', P([[60, 62], [60, 120], [14, 62]]), .4);
  line(g, '#8d6a48', 2.4, [[60, 12], [60, 118]]); line(g, '#8d6a48', 2.4, [[16, 62], [104, 62]]);
} };
/** The kite: it lies in the grass until she takes it (a tap). Then it is on a string in her hand: when she runs it climbs
 *  behind her, when she stands it sinks, and up on a hill the wind holds it high even when she stands still. A tap on the
 *  kite and she winds it in and lays it down. Nothing else to it: running makes it fly */
export function kite(S, x, y, z, windy = (wx, wz) => (S.heightAt(wx, wz) ?? 0) > .4) {
  const { girl, sfx } = S, f = S.figure('vlieger', KITE), [hx, hz] = S.at([x, z]);
  let at = [hx, hz], held = false, alt = 0, px = hx, pz = hz, speed = 0, lx = girl.x, lz = girl.z, t = 0, best = 0;
  // the string: two thin strips of card (a drawn line is a hair wide and drowns in the soft focus)
  const string = new THREE.Group(); string.visible = false; S.root.add(string); const strips = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(.022, .022, 1), paper('#fbf5ea')); m.userData.live = true; string.add(m); return m; });
  const span = (m, a, b) => { m.position.copy(a).lerp(b, .5); m.position.x -= origin[0]; m.position.z -= origin[1]; m.scale.z = a.distanceTo(b); m.lookAt(b.x, b.y, b.z); };
  const origin = S.at([0, 0]);
  const me = {}, down = () => { held = false; at = [girl.x + girl.face * .7, girl.z + .2]; alt = 0; };
  f.onTap = () => { if (S.playing()) return; if (held) { down(); S.hands.free(me); sfx.thud(); } else S.walkThen(at[0] - .4, at[1] + .2, () => { S.hands.take(me, down); held = true; px = at[0]; pz = at[1]; sfx.hop(); }, 1.0); };
  f.act = tick => f.setFrame(held && alt > .5 ? 1 + (Math.floor(tick / 3) % 2) : 0);
  return { f, state: () => ({ held, alt, best, at: [px, pz] }), step({ dt, time }) {
    t += dt; const v = Math.hypot(girl.x - lx, girl.z - lz) / Math.max(dt, 1e-3); lx = girl.x; lz = girl.z; speed += (Math.min(v, 3) - speed) * Math.min(1, dt * 2.5);
    if (!held) { f.x = at[0]; f.z = at[1]; f.floatY = undefined; f.lean = 1.2; string.visible = false; return; }   // lying in the grass
    const wind = windy(girl.x, girl.z) ? 1 : 0, want = Math.min(3.6, .25 + speed * 1.15 + wind * 2.5);
    alt += (want - alt) * Math.min(1, dt * (want > alt ? 1.3 : .55)); best = Math.max(best, alt);
    // it hangs downwind of her: behind the way she runs, further back the higher it is
    const bx = girl.x - girl.dirX * (.5 + alt * .55) + Math.sin(t * 1.3) * .12 * alt, bz = girl.z - girl.dirZ * (.3 + alt * .3) - .25;
    px += (bx - px) * Math.min(1, dt * 2.2); pz += (bz - pz) * Math.min(1, dt * 2.2);
    const ground = S.heightAt(girl.x, girl.z) ?? 0; f.x = px; f.z = pz; f.floatY = f.y = ground + .15 + alt; f.lean = alt < .4 ? 1.2 - alt * 3 : Math.sin(t * 1.7) * .16; f.face = 1;
    const h = S.hand(), k = new THREE.Vector3(px, f.y + .45, pz), mid = h.clone().lerp(k, .5); mid.y -= .25 + alt * .12;
    span(strips[0], h, mid); span(strips[1], mid, k); string.visible = true;
  } };
}

/* ---------------- the balloon on a rope ---------------- */
/** A balloon with a basket, tied to a peg. A tap and she climbs in; it goes up on its rope, high, and the camera goes back
 *  and back until the islands lie below like little models. It hangs there as long as she likes (a push or a touch brings
 *  it down; so does a good while of looking), comes down, and she hops out. The one place to see how big the world is */
export function balloon(S, x, y, z) {
  const { girl, sfx } = S, [wx, wz] = S.at([x, z]), TOP = 15;
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 6), paper('#8d6a48')); peg.position.set(x + 1.1, y + .15, z + .3); peg.castShadow = true; S.root.add(peg);
  const car = new THREE.Group(); car.userData.live = true; car.position.set(x, y, z); S.root.add(car);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(.95, .5, .8), paper('#c79a66')); basket.position.y = .32; basket.castShadow = basket.receiveShadow = true; car.add(basket);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.02, .07, .87), paper('#a97a4e')); rim.position.y = .58; car.add(rim);
  for (const [sx, sz] of [[-.42, -.34], [.42, -.34], [-.42, .34], [.42, .34]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.5, 4), paper('#efe8dc')); r.position.set(sx * 1.15, 1.3, sz * 1.15); r.rotation.z = -sx * .28; r.rotation.x = sz * .28; car.add(r); }
  const gores = ['#e98f8f', '#fbf5ea', '#f2c65c', '#fbf5ea', '#9ed9cf', '#fbf5ea', '#bba6ea', '#fbf5ea'];
  gores.forEach((c, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(1.45, 5, 12, i / 8 * 6.283, 6.283 / 8), paper(c)); s.scale.y = 1.18; s.position.y = 3.35; s.castShadow = true; car.add(s); });
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.62, .46, .5, 12, 1, true), paper('#e98f8f', { side: THREE.DoubleSide })); skirt.position.y = 1.9; car.add(skirt);
  S.glue(car);
  const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + 1.1, y + .3, z + .3), new THREE.Vector3(x + .45, y + .2, z + .1)]), new THREE.LineBasicMaterial({ color: '#8d6a48' })); rope.frustumCulled = false; S.root.add(rope);
  S.wall(x, z, .62, .52);
  let mode = null, t = 0, h = 0, rides = 0;
  const ease = k => k * k * (3 - 2 * k);
  const toy = { rest: true, look: [wx, wz], shot: null, step(dt, inp) {
    t += dt;
    if (mode === 'in') { const k = Math.min(1, t / .4); girl.x = wx + (1 - k) * .9; girl.z = wz + .05 + (1 - k) * .5; girl.lift = .3 * k + Math.sin(k * Math.PI) * .45; girl.view = 'front'; girl.poseName = null; if (k >= 1) { mode = 'up'; t = 0; rides++; sfx.whoosh(); } return; }
    if (mode === 'up') { h = TOP * ease(Math.min(1, t / 7)); if (t > 1) toy.shot = { span: 78, tall: 46, rise: .95, riseTall: 1.1, dof: .15, range: 7 }; if (t >= 7) { mode = 'top'; t = 0; } }
    else if (mode === 'top') { h = TOP + Math.sin(t * .6) * .25; if (inp.act || inp.x || t > 14) { mode = 'down'; t = 0; toy.shot = null; } }
    else if (mode === 'down') { h = TOP * (1 - ease(Math.min(1, t / 5.5))); if (t >= 5.5) { h = 0; mode = 'out'; t = 0; sfx.thud(); } }
    else if (mode === 'out') { const k = Math.min(1, t / .4); girl.x = wx + k * .95; girl.z = wz + .05 + k * .55; girl.lift = .3 * (1 - k) + Math.sin(k * Math.PI) * .4; if (k >= 1) { girl.lift = 0; mode = null; S.stopPlay(); } return; }
    girl.x = wx; girl.z = wz + .05; girl.lift = h + .3; girl.poseName = mode === 'top' ? 'up' : null; girl.view = 'front';
  } };
  S.tap(car, () => { if (S.playing()) return; S.walkThen(wx + .95, wz + .6, () => { if (S.playing()) return; mode = 'in'; t = 0; S.play(toy); }, 1.3); });
  return { toy, state: () => ({ mode, h, rides }), step() { car.position.y = y + h; const pa = rope.geometry.attributes.position; pa.setXYZ(1, x + .45, y + .2 + h, z + .1); pa.needsUpdate = true; } };
}

/* ---------------- the seesaw ---------------- */
/** A plank on a stand, for two: she sits on the near end and the unicorn hops onto the other. A touch on her and she kicks
 *  off the ground: up she goes, the unicorn's end comes down with a bump (and she leaves her seat for a moment), the unicorn
 *  kicks off in its turn and down she comes. Her end hitting the ground throws the unicorn up; kick off again just as she
 *  lands and it goes higher each time, until it turns a somersault in the air. A push to the side when she is down: off.
 *  The plank is a real little sum: where it is and how fast it turns, her side a little heavier (so it rests her end down). */
export function seesaw(S, x, y, z) {
  const { girl, uni, sfx } = S, A = 1.45, P = .5, TMAX = Math.asin(P / A) * .94, G = 1.5, KICK = 3.0, GOOD = 3.7, UKICK = 2.0, [wx, wz] = S.at([x, z]);
  const g = new THREE.Group(); g.position.set(x, y, z); S.root.add(g);
  for (const fz of [-.24, .24]) for (const s of [-1, 1]) beam(g, s * .3, 0, 0, P, fz, .08, COL.post);
  box(g, .1, .1, .6, 0, P, 0, COL.bar);
  const pivot = new THREE.Group(); pivot.position.set(0, P, 0); pivot.userData.live = true; g.add(pivot);
  box(pivot, A * 2 + .3, .06, .34, 0, .07, 0, COL.chute);
  for (const s of [-1, 1]) { box(pivot, .44, .04, .37, s * (A - .05), .12, 0, COL.seat); box(pivot, .04, .26, .04, s * (A - .5), .23, 0, COL.post); box(pivot, .04, .04, .3, s * (A - .5), .36, 0, COL.post); }
  S.wall(x, z, A + .2, .26); S.solid({ x, z, r: .2 });
  let psi = 1, om = 0, mode = null, t = 0, buf = 0, land = 9, streak = 0, best = 0, air = 0, airV = 0, uair = 0, uairV = 0, uT = 0, uwait = 0, flip = 0, flips = 0, kicks = 0, from = null;
  const endY = s => P + .12 + s * A * Math.sin(psi * TMAX);   // how high an end's seat is (s -1: hers, +1: the unicorn's)
  const seat = () => { girl.x = wx - (A - .05) * Math.cos(psi * TMAX); girl.z = wz + .02; girl.lift = endY(-1) + air; girl.face = 1; girl.view = 'side'; girl.poseName = air > .06 ? 'up' : 'sit'; };
  const useat = k => { const tx = wx + (A - .05) * Math.cos(psi * TMAX), ty = endY(1) - .12 + uair; uni.busy = true; uni.walking = false; uni.face = -1; uni.x = from[0] + (tx - from[0]) * k; uni.z = from[1] + (wz + .02 - from[1]) * k; uni.lift = ty * k + Math.sin(k * Math.PI) * .5; uni.lean = flip > 0 ? (1 - flip) * Math.PI * 2 : 0; };
  const toy = { look: [wx, wz + .3], step(dt, inp) {
    t += dt; pivot.rotation.z = psi * TMAX;
    if (mode === 'on') { const k = Math.min(1, t / .35); seat(); girl.z = wz + .02 + (1 - k) * .7; girl.lift = endY(-1) * k + Math.sin(k * Math.PI) * .3; girl.poseName = k > .6 ? 'sit' : null; useat(k); if (k >= 1) { mode = 'ride'; sfx.hop(); land = 9; streak = 0; } return; }
    if (mode === 'off') { const k = Math.min(1, t / .3); girl.z = wz + .02 + k * .75; girl.lift = endY(-1) * (1 - k) + Math.sin(k * Math.PI) * .25; girl.poseName = null; uni.lift = (endY(1) - .12) * (1 - k) + Math.sin(k * Math.PI) * .4; uni.z = wz + .02 + k * .7; if (k >= 1) { mode = null; S.stopPlay(); } return; }
    // riding
    buf = Math.max(0, buf - dt); if (inp.act) buf = .28;
    if (psi >= 1) {   // her end is on the ground
      land += dt;
      if (buf > 0) { const good = land < .3; streak = good ? Math.min(4, streak + 1) : 0; best = Math.max(best, streak); om = -(good ? GOOD : KICK); psi = .999; buf = 0; kicks++; sfx.hop(); S.confetti(girl.x, y + .1, girl.z + .1, ['#ecd3a0', '#f7ecd0', '#e2c58a'], good ? 9 : 4, undefined, 1.4); }
      else if (inp.x && land > .3 && uair <= 0) { mode = 'off'; t = 0; return; }
    }
    if (psi <= -1) { uwait -= dt; if (uwait <= 0) { om = UKICK; psi = -.999; } }   // the unicorn's end is down: a beat, and it kicks off
    else if (psi < 1) {
      om += G * dt; psi += om * dt;
      if (psi <= -1) { const v = -om; psi = -1; om = 0; uwait = .16; sfx.thud(); airV = v * .5 + streak * .3; }                    // bump: she leaves her seat
      else if (psi >= 1) { const v = om; psi = 1; om = 0; land = 0; sfx.thud(); uairV = 1.2 + v * .35 + streak * .75; uT = 2 * uairV / 9.8; if (streak >= 3) { flip = 1; flips++; sfx.neigh(); S.confetti(uni.x, y + 1.6, uni.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 14, S.starGeo, 2.6); } }   // her end lands: the unicorn is thrown up
    }
    if (air > 0 || airV > 0) { air += airV * dt; airV -= 9.8 * dt; if (air <= 0) { air = 0; airV = 0; } }
    if (uair > 0 || uairV > 0) { uair += uairV * dt; uairV -= 9.8 * dt; if (uair <= 0) { uair = 0; uairV = 0; flip = 0; } else if (flip > 0) flip = Math.max(.001, flip - dt / Math.max(.3, uT)); }
    pivot.rotation.z = psi * TMAX; seat(); useat(1);
  } };
  S.tap(g, () => { if (S.playing()) return; S.walkThen(wx - A + .05, wz + .72, () => { if (S.playing()) return; mode = 'on'; t = 0; psi = 1; om = 0; air = airV = uair = uairV = 0; from = [uni.x, uni.z]; S.play(toy); }, 1.1); });
  return { toy, state: () => ({ mode, psi, streak, best, kicks, flips, air, uair }), step() { if (!mode) pivot.rotation.z = psi * TMAX; } };
}

/* ---------------- the paper aeroplane ---------------- */
const PLANE = { w: 128, h: 88, frames: 1, size: .34, draw(g) {
  piece(g, '#7fbcc0', P([[118, 46], [34, 48], [22, 74]]), .5); piece(g, '#9ed9cf', P([[118, 46], [8, 18], [34, 48]])); piece(g, '#f6efe2', P([[118, 46], [8, 18], [20, 30]]), .4);
  line(g, '#e98f8f', 3, [[104, 44.5], [40, 40]]);
} };
/** A paper aeroplane (Oscar: "little paper airplanes can also be nice details in our new paper style game"). It lies where
 *  it landed. A tap: she picks it up. A tap on it in her hands: she throws it the way she faces, and it glides for real:
 *  how fast it goes and which way its nose points, lift that grows with speed, so it swoops, climbs, slows and swoops
 *  again. A tap on it in the air gives it a push: a loop. It stays where it comes down; from the sea, a tree top or
 *  anywhere she cannot walk it comes back to its first spot. */
export function plane(S, x, y, z) {
  const { girl, sfx } = S, f = S.figure('vliegtuig', PLANE), [hx, hz] = S.at([x, z]), me = {};
  const G = 5, V0 = 3.5, LIFT = G / (V0 * V0), DRAG = .05;
  let at = [hx, hz], held = false, fly = null, throws = 0, loops = 0, far = 0, back = 0;
  const down = () => { held = false; girl.poseName = null; at = [girl.x + girl.face * .5, girl.z + .2]; };
  const home = () => { at = [hx, hz]; f.hopV = 2.2; sfx.flutter(); };
  f.onTap = () => {
    if (fly) { if (fly.t > .15) { fly.v += 2.2; fly.a += .9; loops++; sfx.swish(3); } return; }   // in the air: a push, and round it goes
    if (S.playing()) return;
    if (held) { held = false; S.hands.free(me); girl.poseName = null; throws++; const d = girl.face || 1; fly = { x: girl.x + d * .3, y: (S.hand().y), z: girl.z + .1, v: 4.9, a: .22, d, t: 0, x0: girl.x }; sfx.swish(3); return; }
    S.walkThen(at[0] - .35, at[1] + .15, () => { S.hands.take(me, down); held = true; sfx.hop(); }, 1.0);
  };
  f.act = () => { f.tilt = fly ? fly.a : held ? .1 : 0; };
  return { f, state: () => ({ held, flying: !!fly, throws, loops, far, at, y: f.y }), step({ dt }) {
    if (back > 0) { back -= dt; if (back <= 0) home(); }
    if (fly) {
      const q = fly; q.t += dt;
      q.v += (-G * Math.sin(q.a) - DRAG * q.v * q.v) * dt; q.a += (LIFT * q.v * q.v - G * Math.cos(q.a)) / Math.max(q.v, .6) * dt;
      q.x += q.d * q.v * Math.cos(q.a) * dt; q.y += q.v * Math.sin(q.a) * dt; q.z += .35 * dt;
      f.x = q.x; f.z = q.z; f.floatY = f.y = q.y - f.H / 2; f.face = q.d; f.lean = 0;
      const h = S.heightAt(q.x, q.z), floor = h === null ? -.6 : h;
      if (q.y <= floor + .12 || q.t > 14) {   // down
        far = Math.abs(q.x - q.x0); fly = null;
        if (h === null) { sfx.splash(); S.confetti(q.x, -.3, q.z, ['#8fc3cc', '#f6efe2', '#7fbcc0'], 12, undefined, 2.4); f.g.visible = false; back = 1.4; }
        else if (!S.free(q.x, q.z, h)) { back = .9; at = [q.x, q.z]; sfx.thud(); }
        else { at = [q.x, q.z]; sfx.thud(); S.confetti(q.x, h + .1, q.z, ['#9ed9cf', '#f6efe2'], 5, undefined, 1.2); }
      }
      return;
    }
    f.g.visible = true;
    if (held) { if (S.playing()) { f.g.visible = false; return; } girl.poseName = 'hold'; const h = S.hand(); f.x = h.x + girl.face * .12; f.z = h.z + .05; f.floatY = f.y = h.y - .1; f.face = girl.face; f.lean = 0; }
    else { f.x = at[0]; f.z = at[1]; f.floatY = undefined; f.lean = 0; f.face = 1; }
  } };
}
