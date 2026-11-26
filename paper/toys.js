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
  f.onTap = () => { if (S.playing()) return; if (held) { held = false; at = [girl.x + girl.face * .7, girl.z + .2]; alt = 0; sfx.thud(); } else S.walkThen(at[0] - .4, at[1] + .2, () => { held = true; px = at[0]; pz = at[1]; sfx.hop(); }, 1.0); };
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
