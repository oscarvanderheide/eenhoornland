// The village playground (MAP.PLAY), west of the fountain square: a swing and a slide.
//   The swing swings left and right across the screen and is a real pendulum. Pushing (keys, stick, d-pad, or a tap on
//   the left or right of her) in the direction she is already moving, while she comes down through the bottom, adds a
//   little; pushing against the swing brakes. So holding one way does little and pushing in time takes her higher and
//   higher. The action button (or down) jumps her off, flying as far as the swing throws her.
//   The slide: she climbs the ladder, sits at the top for a moment, whooshes down the chute and hops off at the end.
// Getting on works the same from every input: a tap on the thing, the action button in front of it, or walking into it.
// While she plays world.js hands its input to drive(); a teleport, the map or the ride button simply ends the game.
import * as MAP from './map.js';
import * as PX from './pixel.js';
import { sfx } from './audio.js';

export const swingIcon = () => PX.sprite([
  'yyyyyyyyyy', 'b.y....y.b', 'b.y....y.b', 'b.y....y.b', 'b.y....y.b', 'b.rrrrrr.b', 'b........b', 'b........b',
], { y: '#FFD43B', b: '#4DABF7', r: '#E8484A' }, { key: 'schommelicoon' });
export const slideIcon = () => PX.sprite([
  'bb........', 'bbyy......', 'b.oyy.....', 'bb.oyy....', 'b...oyy...', 'bb...oyy..', 'b.....oyy.', 'bb......oy',
], { y: '#FFD43B', o: '#FF9F43', b: '#4DABF7' }, { key: 'glijbaanicoon' });

export function createSpeeltuin(ctx) {
  const { THREE, scene, pick, kid, burst } = ctx;
  const SW = MAP.SWING, SL = MAP.SLIDE;
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const blue = lam('#4DABF7'), yellow = lam('#FFD43B'), red = lam('#E8484A'), orange = lam('#FF9F43'), white = lam('#F4EDE4'), rope = lam('#E6DDCF');
  const box = (parent, w, h, d, x, y, z, mat, onTap, icon, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = m.receiveShadow = true; parent.add(m);
    if (onTap) { m.userData.tap = onTap; m.userData.icon = icon; pick.push(m); } return m;
  };
  /** a stick from (x0, y0) to (x1, y1) in the x-y plane, at depth z */
  const beam = (parent, x0, y0, x1, y1, z, t, mat, onTap, icon) => box(parent, Math.hypot(x1 - x0, y1 - y0), t, t, (x0 + x1) / 2, (y0 + y1) / 2, z, mat, onTap, icon, Math.atan2(y1 - y0, x1 - x0));

  /* ---------------- the swing ---------------- */
  const PX0 = SW.x + .5, PZ = SW.z + .5, PY = 2.05, L = 1.6, swIcon = swingIcon();
  const frame = new THREE.Group(); frame.position.set(PX0, 0, PZ); scene.add(frame);
  const tapSwing = () => boardSwing();
  for (const z of [-.55, .55]) for (const s of [-1, 1]) beam(frame, s * 1.3, 0, 0, PY + .04, z, .1, blue, tapSwing, swIcon);   // two A-frames
  box(frame, .12, .12, 1.3, 0, PY + .04, 0, yellow, tapSwing, swIcon);                                                         // the bar on top
  const pivot = new THREE.Group(); pivot.position.set(0, PY, 0); frame.add(pivot);
  for (const z of [-.08, -.2]) box(pivot, .035, L, .035, 0, -L / 2, z, rope);                                                  // the ropes (behind her)
  box(pivot, .5, .06, .34, 0, -L + .02, -.06, red, tapSwing, swIcon);
  let th = 0, om = 0, push = 0, kick = 0, tapU = 0, tapT = 0, whoosh = 0;
  const K = 5.2, C = .1, P = 1.5;

  /* ---------------- the slide ---------------- */
  const slide = new THREE.Group(); slide.position.set(SL.x, 0, SL.z); scene.add(slide); const slIcon = slideIcon(), tapSlide = () => startSlide();
  const TOP = 1.32, X0 = .85, X1 = 3.05, Y1 = .22, chuteY = x => x <= X0 ? TOP : x >= X1 ? Y1 : TOP - (TOP - Y1) * (x - X0) / (X1 - X0);
  for (const z of [.22, .78]) { beam(slide, .02, 0, .42, TOP + .5, z, .07, blue, tapSlide, slIcon); }                      // the ladder's rails
  for (let k = 1; k <= 5; k++) { const y = k * TOP / 5.6, x = .02 + .4 * y / (TOP + .5); box(slide, .05, .05, .56, x, y, .5, white, tapSlide, slIcon); }   // rungs
  box(slide, .55, .08, .64, .62, TOP, .5, blue, tapSlide, slIcon);                                                            // the platform at the top
  for (const [x, z] of [[.4, .2], [.4, .8], [.85, .2], [.85, .8]]) box(slide, .06, TOP, .06, x, TOP / 2, z, white);           // its legs
  beam(slide, X0, TOP + .02, X1, Y1 + .02, .5, .06, yellow, tapSlide, slIcon).scale.z = .55 / .06;                          // the chute
  for (const z of [.22, .78]) beam(slide, X0, TOP + .1, X1, Y1 + .1, z, .06, orange, tapSlide, slIcon);                      // its sides
  box(slide, .4, .05, .55, X1 + .18, Y1 + .02, .5, yellow, tapSlide, slIcon);                                                 // the flat bit at the bottom
  box(slide, .06, (TOP + Y1) / 2, .06, (X0 + X1) / 2, (TOP + Y1) / 4, .5, white);                                             // a leg under the middle

  /* ---------------- playing ---------------- */
  let mode = null, t = 0, from = null, fly = null, lastAt = new THREE.Vector3();
  const near = (x, z, r) => Math.hypot(kid.pos.x - x, kid.pos.z - z) < r;
  const free = () => !mode && !ctx.mount() && !ctx.fly.on() && !ctx.life.swimming() && ctx.seated() < 0 && !ctx.toys.carrying() && !ctx.life.carrying();
  function begin(m) { mode = m; t = 0; from = kid.pos.clone(); from.lift = kid.lift || 0; kid.path = []; ctx.clearWalk(); }
  function end() { mode = null; fly = null; kid.lift = 0; kid.mesh.rotation.z = 0; kid.squash = .6; }
  function boardSwing() {
    if (mode === 'swing') return;
    if (!free()) return;
    if (near(SW.on[0] + .5, SW.on[1] + .5, 1.4)) { begin('board'); sfx.pop(); return; }
    ctx.walkThen(SW.on[0], SW.on[1], () => { if (free()) { begin('board'); sfx.pop(); } });
  }
  function startSlide() {
    if (!free()) return;
    if (near(SL.on[0] + .5, SL.on[1] + .5, 1.4)) { begin('climb'); return; }
    ctx.walkThen(SL.on[0], SL.on[1], () => { if (free()) begin('climb'); });
  }
  /** off the swing: she flies as the swing throws her. Too slow to clear the frame: a hop down to the front */
  function jumpOff() {
    if (mode !== 'swing') return false;
    const vx = L * om * Math.cos(th), vy0 = Math.max(2.2, L * om * Math.sin(th) + 2.2), y0 = kid.lift, g = 9;
    const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * y0)) / g;
    let lx = kid.pos.x + vx * T, lz = kid.pos.z;
    lx = Math.max(PX0 - 4.2, Math.min(PX0 + 4.2, lx));
    const clear = Math.abs(lx - PX0) > 1.55 && ctx.walkable(Math.floor(lx), Math.floor(lz));
    if (!clear) { lx = Math.max(PX0 - 1.1, Math.min(PX0 + 1.1, lx)); lz = SW.on[1] + .55; }
    else for (let k = 0; k < 20 && !ctx.walkable(Math.floor(lx), Math.floor(lz)); k++) lx -= Math.sign(lx - PX0) * .2;
    fly = { x0: kid.pos.x, z0: kid.pos.z, y0, vy0, T, lx, lz, big: Math.abs(lx - PX0) > 2.6 };
    mode = 'fly'; t = 0; sfx.boing(); if (fly.big) sfx.whoosh(); return true;
  }
  ctx.addUse(() => {
    if (!free()) return null;
    if (kid.pos.z > SW.z + .9 && kid.pos.z < SW.z + 2.1 && Math.abs(kid.pos.x - PX0) < 1.2) return { key: 'schommel', art: swIcon, run: boardSwing };
    if (near(SL.on[0] + .5, SL.on[1] + .5, 1.2)) return { key: 'glijbaan', art: slIcon, run: startSlide };
    return null;
  });
  const ease = k => k * k * (3 - 2 * k);
  return {
    swingIcon: swIcon, slideIcon: slIcon,
    on: () => !!mode, mode: () => mode, info: () => ({ mode, th: +th.toFixed(3), om: +om.toFixed(3), amp: +Math.max(Math.abs(th), Math.sqrt(th * th + om * om / K)).toFixed(3) }),
    boardSwing, startSlide, jumpOff,
    /** what the action button does while she plays: on the swing it jumps her off, on the slide nothing */
    action: () => mode === 'swing' ? jumpOff : () => { },
    /** a tap while she swings pushes towards that side (dx: the tap's screen x minus hers, in -1..1 units) */
    tap(dx) { if (mode === 'swing') { tapU = Math.sign(dx) || 1; tapT = .4; } },
    /** walking into the swing from the front or into the ladder from the left: on she gets */
    bumpAt(x, z, ix, iz) {
      if (z === SW.z && x >= SW.x - 1 && x <= SW.x + 1 && iz < 0) { boardSwing(); return true; }
      if (z === SL.z && x === SL.x && ix > 0) { startSlide(); return true; }
      return false;
    },
    /** the girl's pose while she plays (world.js draws it), or null */
    pose() {
      if (mode === 'swing') return kick > 0 ? 'sit2' : 'sit';
      if (mode === 'board' || mode === 'top' || mode === 'slide') return 'sit';
      if (mode === 'climb') return Math.floor(t * 6) % 2 ? 'w1' : 'w2';
      if (mode === 'fly' || mode === 'off') return 'jump';
      return null;
    },
    /** called by world.js every frame while she plays, with the keys / stick */
    drive(kx, kz, dt) {
      if (ctx.mount() || ctx.fly.on() || kid.pos.distanceTo(lastAt) > .5 && mode !== 'board' && mode !== 'climb') { end(); return; }   // the ride button, the map, a teleport: the game is over
      t += dt;
      if (mode === 'board') {                                     // up onto the seat; the swing comes to rest under her
        const k = Math.min(1, t / .35); th *= Math.exp(-10 * dt); om *= Math.exp(-10 * dt);
        kid.pos.set(from.x + (PX0 + L * Math.sin(th) - from.x) * ease(k), 0, from.z + (PZ + .12 - from.z) * ease(k)); kid.lift = (PY - L * Math.cos(th) - .08) * k + Math.sin(k * Math.PI) * .3;
        if (k >= 1) { mode = 'swing'; th = 0; om = 0; kid.squash = .5; }
      } else if (mode === 'swing') {
        if (kz > .6 && Math.abs(kx) < .5) { jumpOff(); return; }    // down: off she jumps
        if (tapT > 0) tapT -= dt; const u = Math.max(-1, Math.min(1, kx + (tapT > 0 ? tapU : 0)));
        let a = -K * Math.sin(th) - C * om;
        if (Math.abs(u) > .2) {
          const withIt = Math.sign(u) === Math.sign(om) || Math.abs(om) < .3, w = Math.cos(th) ** 4;   // only through the bottom of the swing does a push really count
          a += P * Math.abs(u) * Math.sign(withIt ? u : -om) * w;   // against the swing it brakes just as hard: holding one way gets nowhere
          if (withIt) { kick = .25; if (push <= 0 && Math.abs(om) > .4) { sfx.whoosh(); push = .6; } }
        }
        if (Math.abs(th) > 1.15) a -= 3 * om;                     // never over the top
        om += a * dt; th += om * dt; th = Math.max(-1.35, Math.min(1.35, th));
        kick -= dt; push -= dt; whoosh -= dt;
        if (Math.abs(om) > 2.6 && Math.abs(th) < .1 && whoosh <= 0) { whoosh = .5; burst(new THREE.Vector3(kid.pos.x, .3, kid.pos.z), 2, true); }   // high: a little sparkle as she flies through
        if (Math.abs(om) > .2) kid.face = Math.sign(om);
        kid.pos.set(PX0 + L * Math.sin(th), 0, PZ + .12); kid.lift = PY - L * Math.cos(th) - .08; kid.mesh.rotation.z = th * .8;
      } else if (mode === 'fly') {
        const f = fly, k = Math.min(1, t / f.T);
        kid.pos.set(f.x0 + (f.lx - f.x0) * k, 0, f.z0 + (f.lz - f.z0) * k); kid.lift = Math.max(0, f.y0 + f.vy0 * t - 4.5 * t * t); kid.mesh.rotation.z *= Math.exp(-8 * dt);
        if (k >= 1) { end(); sfx.pop(); burst(kid.pos, f.big ? 10 : 4, f.big); if (f.big) kid.hop = .4; }
      } else if (mode === 'climb') {                              // up the ladder, rung by rung
        const k = Math.min(1, t / 1.0); kid.face = 1;
        kid.pos.set(from.x + (SL.x + .42 - from.x) * Math.min(1, k * 2.5), 0, SL.z + .62); kid.lift = (TOP + .04) * ease(k);
        if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) sfx.step();
        if (k >= 1) begin('top');
      } else if (mode === 'top') {                                // a moment at the top
        const k = Math.min(1, t / .35); kid.pos.set(SL.x + .42 + .4 * ease(k), 0, SL.z + .62); kid.lift = TOP + .04;
        if (k >= 1) { begin('slide'); sfx.whoosh(); }
      } else if (mode === 'slide') {                              // whoosh: faster and faster down the chute, then along the flat bit
        const D = .8, k = Math.min(1, t / D), s = k * k * .7 + k * .3, x = X0 + (X1 + .3 - X0) * s;
        kid.pos.set(SL.x + x, 0, SL.z + .62); kid.lift = chuteY(x) + .04; kid.mesh.rotation.z = k < .9 ? .3 : 0;
        if (k >= 1) { begin('off'); kid.mesh.rotation.z = 0; }
      } else if (mode === 'off') {                                // a hop off the end onto the sand
        const k = Math.min(1, t / .3), x0 = SL.x + X1 + .3, x1 = SL.off[0] + .5;
        kid.pos.set(x0 + (x1 - x0) * k, 0, SL.z + .62 + (SL.off[1] + .55 - SL.z - .62) * k); kid.lift = (Y1 + .04) * (1 - k) + Math.sin(k * Math.PI) * .35;
        if (k >= 1) { end(); sfx.boing(); burst(kid.pos, 6, true); }
      }
      lastAt.copy(kid.pos);
    },
    update(dt) {
      if (mode !== 'swing' && mode !== 'board') { const a = -K * Math.sin(th) - .35 * om; om += a * dt; th += om * dt; }   // an empty swing swings on for a while
      pivot.rotation.z = th;
      if (mode === null) { lastAt.copy(kid.pos); }
    },
  };
}
