// More to do on the beach (Oscar: "theres nothing to do on the beach. let us dig holes. use a vlieger. there should be more
// people"; "with the sea lion ... let us kick a ball towards him and he kicks it back to us"):
//   the spade        a tap: she picks it up. With it in her hands, wherever she stops on the sand she digs a hole: a heap of
//                    sand beside it, and now and then something in it (a shell, a starfish). Where the red cross is drawn
//                    in the sand there is a treasure chest, once, full of coins. A tap on her puts the spade down
//   the seal's ball  a beach ball on the pier's head. Kicked towards the seal on its rock, it flies to him: he catches it on
//                    his nose, balances it, and heads it back to her
//   the ice cream    the ice cream man at his cart: a tap and he scoops her a cone. A tap on her and she eats it; a tap on
//                    her unicorn and it gets it
//   the lifeguard    on her tall chair: a tap and she looks out through her binoculars, then waves and blows her whistle
//   the sunbather    on her towel with a book: a tap and she peeks over it; another while she peeks and she sits up and waves
import { THREE, paper, slab, circlePts, whiteEdge } from './kit.js';
import { CARDS3 } from './cards3.js';
import { ball } from './dog.js';

const SAND_D = '#c9a46a', SAND_H = '#ecd3a0';

/** the spade, the holes, and the treasure under the cross. `sandOk(x, z)`: open sand where a hole may be (the set's measure); `y`: the sand's height */
export function digging(S, x, z, y, cross, sandOk) {
  const { girl, sfx } = S, me = {}, spade = S.figure('schep', CARDS3.schep); spade.thing = true;
  let at = S.at([x, z]), held = false, still = 0, last = null, digs = 0, found = [], dig = -1, treasure = false;
  const holes = [];
  // the cross: two strips of red paper laid in the sand
  const X = new THREE.Group(); { const [cx, cz] = S.at(cross); X.position.set(cross[0], y + .02, cross[1]); X.userData.live = true; S.root.add(X);
    for (const a of [.75, -.75]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .02, .16), paper('#d9534f')); m.rotation.y = a; m.receiveShadow = true; X.add(m); } X.userData.at = [cx, cz]; }
  const down = () => { held = false; girl.poseName = null; at = [girl.x + girl.face * .45, girl.z + .15]; };
  spade.onTap = () => { if (S.playing()) return; if (held) { down(); S.hands.free(me); sfx.thud(); return; } S.walkThen(at[0] - .3, at[1] + .1, () => { S.hands.take(me, down); held = true; last = [girl.x, girl.z]; sfx.hop(); }, .9); };
  const hole = (wx, wz) => {
    const g = new THREE.Group(); g.position.set(wx - S.at([0, 0])[0], y, wz - S.at([0, 0])[1]); S.root.add(g);
    g.add(slab(circlePts(.34, 900 + digs, 16).map(([a, b]) => [a * 1.2, b * .8]), .012, .012, paper(SAND_D), whiteEdge));
    const pit = slab(circlePts(.22, 950 + digs, 14).map(([a, b]) => [a * 1.2, b * .8]), .02, .008, paper('#a9844f'), paper('#a9844f')); g.add(pit);
    const heap = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), paper(SAND_H)); heap.scale.set(1.2, .55, .8); heap.position.set(.55, 0, -.05); heap.castShadow = heap.receiveShadow = true; g.add(heap);
    holes.push({ g, x: wx, z: wz, t: 0 }); if (holes.length > 9) { const o = holes.shift(); S.root.remove(o.g); }
  };
  const finish = () => {
    const [cx, cz] = X.userData.at, here = [girl.x + girl.face * .4, girl.z + .05];
    hole(...here); digs++; sfx.thud(); S.confetti(here[0], y + .3, here[1], [SAND_H, '#f7ecd0', '#e2c58a'], 12, undefined, 2);
    if (!treasure && Math.hypot(here[0] - cx, here[1] - cz) < 1.0) { treasure = true; X.visible = false; found.push('schat'); S.coins.had('schat', true); chest(here); return; }   // (once in a save)
    const r = Math.random(); if (r < .35) { found.push('schelp'); S.confetti(here[0], y + .5, here[1], ['#fbf5ea', '#f4c6b8', '#f6dfa6'], 8, S.starGeo, 2.2); sfx.peep(); }
    else if (r < .5) { found.push('zeester'); S.confetti(here[0], y + .5, here[1], ['#f2b56b', '#e98f8f'], 8, S.starGeo, 2.4); sfx.chime(); }
  };
  // the treasure: a little chest pops up out of the hole and opens, and five coins fly to her
  const chest = ([wx, wz]) => {
    const g = new THREE.Group(); g.position.set(wx - S.at([0, 0])[0], y, wz - S.at([0, 0])[1]); g.userData.live = true; S.root.add(g);
    const box = (w, h, d, c, px, py, pz, to = g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paper(c)); m.position.set(px, py, pz); m.castShadow = true; to.add(m); return m; };
    box(.5, .26, .32, '#b9875a', 0, .13, 0); for (const sx of [-.18, .18]) box(.05, .28, .34, '#f2c65c', sx, .14, 0);
    const lid = new THREE.Group(); lid.position.set(0, .26, -.16); g.add(lid); box(.52, .1, .34, '#9a6e47', 0, .05, .16, lid);
    let t = 0; const up = () => { t += 1 / 60; g.position.y = y - .3 + Math.min(1, t / .5) * .3; lid.rotation.x = -Math.min(1, Math.max(0, (t - .6) / .4)) * 1.8; if (t < 1.2) requestAnimationFrame(up); };
    up(); sfx.hello(); setTimeout(() => { S.coins.earn(wx, y + .6, wz, 5); S.confetti(wx, y + .8, wz, ['#f2c65c', '#fbf5ea', '#e0a93a'], 24, S.starGeo, 3); }, 900);
  };
  return { state: () => ({ held, digs, found, treasure, holes: holes.length, at: S.at([0, 0]) && at, cross: X.userData.at }), step({ dt }) {
    if (!treasure && S.coins.had('schat')) { treasure = true; X.visible = false; }   // (dug up already in this save: no cross)
    if (held && !S.playing()) {
      const h = S.hand(); if (dig < 0) girl.poseName = 'hold'; spade.x = h.x + girl.face * .1; spade.z = h.z + .04; spade.floatY = spade.y = h.y - .3; spade.face = girl.face; spade.lean = 0;
      // stopped somewhere new on open sand: she digs
      if (dig < 0) { if (girl.walking) still = 0; else still += dt;
        const moved = !last || Math.hypot(girl.x - last[0], girl.z - last[1]) > .7, [lx, lz] = [girl.x - S.at([0, 0])[0], girl.z - S.at([0, 0])[1]];
        if (still > .35 && moved && sandOk(lx + girl.face * .4, lz) && !holes.some(o => Math.hypot(o.x - girl.x, o.z - girl.z) < .7)) { dig = 0; last = [girl.x, girl.z]; } }
      else { dig += dt; girl.poseName = Math.floor(dig / .22) % 2 ? 'up' : 'hold'; spade.lean = Math.sin(dig * 14) * .5 * girl.face; if (Math.floor(dig / .22) !== Math.floor((dig - dt) / .22)) S.confetti(girl.x + girl.face * .4, y + .15, girl.z + .05, [SAND_H, '#e2c58a'], 3, undefined, 1.4);
        if (dig > .9) { dig = -1; girl.poseName = 'hold'; finish(); } }
    } else if (held) { spade.x = girl.x + .5; spade.z = girl.z + .3; spade.floatY = undefined; }
    else { spade.x = at[0]; spade.z = at[1]; spade.floatY = undefined; spade.lean = 1.25; spade.face = 1; }
  } };
}

/** the seal's ball: a beach ball at `ballAt` (the set's measure, height `y`), and the seal it is kicked to */
export function sealBall(S, theSeal, ballAt, y) {
  const { girl, sfx } = S, b = ball(S, ballAt[0], y, ballAt[1], undefined, 'strandbal'), sf = theSeal.f;
  let kicks = b.kicks, mode = null, t = 0, from = null, to = null, catches = 0, H0 = y;
  const own = sf.act; sf.act = tick => { if (mode === 'fly' || mode === 'hold') sf.setFrame(mode === 'hold' ? 2 : 0); else if (mode === 'back') sf.setFrame(1); else own(tick); };
  const nose = () => [sf.x + sf.face * sf.W * .3, sf.z + .05, (sf.y || 0) + sf.H * .95];
  return { ball: b, state: () => ({ mode, catches, kicks: b.kicks, at: [b.x, b.z] }), step({ dt }) {
    if (!mode) {
      b.step(dt);
      if (b.kicks !== kicks) { kicks = b.kicks; const [nx, nz] = nose(), dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz), v = Math.hypot(b.vx, b.vz) || 1;
        if (d < 7 && (b.vx * dx + b.vz * dz) / (v * d) > .55) { mode = 'fly'; t = 0; from = [b.x, b.z, b.lift + H0]; sfx.boing(); } }   // towards him: it flies to his nose
      return; }
    t += dt; const f = b.f;
    if (mode === 'fly' || mode === 'back') {
      const T = mode === 'fly' ? .9 : 1.1, k = Math.min(1, t / T), [nx, nz, ny] = nose();
      if (mode === 'fly') to = [nx, nz, ny];
      const x = from[0] + (to[0] - from[0]) * k, z = from[1] + (to[1] - from[1]) * k, hy = from[2] + (to[2] - from[2]) * k + Math.sin(k * Math.PI) * 1.4;
      f.x = b.x = x; f.z = b.z = z; f.floatY = H0; f.lift = b.lift = hy - H0; f.tilt = (b.roll -= dt * 9); f.g.visible = true;
      if (k >= 1) { if (mode === 'fly') { mode = 'hold'; t = 0; catches++; sfx.bark(); S.coins.reward('zeehondbal', nx, ny + .6, nz); }
        else { mode = null; f.floatY = undefined; b.lift = .05; b.vx = b.vy = b.vz = 0; sfx.thud(); } }
      return; }
    if (mode === 'hold') { f.g.visible = false; sf.hopV = t < .1 ? 1.2 : 0;   // (his own drawing has the ball on his nose)
      if (t > 1.5) { mode = 'back'; t = 0; f.g.visible = true; const [nx, nz, ny] = nose(); from = [nx, nz, ny]; to = [girl.x + Math.sign(nx - girl.x) * .6, girl.z + .1, H0]; sfx.boing(); sfx.bark(); } }
  } };
}

/** somebody at a cart who gives her something to hold (the ice cream man on the beach, the candy floss lady on the rainbow
 *  island): a tap and she walks up, they make it and hold it out, and it is in her hands. A tap on her and she eats it; a tap
 *  on her unicorn and it gets it. `fr`: their frames { rest, make, give, wave } */
export function vendor(S, who, item, x, z, fr) {
  const { girl, sfx, uni } = S, f = S.figure(who, CARDS3[who]), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; f.face = 1; S.solid({ x: x + .5, z, r: .7 });
  const it = S.figure(item, CARDS3[item]); it.thing = true; it.g.visible = false;
  const me = {}; let mode = null, t = 0, held = false, given = 0, eaten = 0;
  const eat = () => { held = false; it.g.visible = false; eaten++; girl.poseName = null; girl.hopV = 2; sfx.chime(); S.confetti(girl.x, girl.y + 1.1, girl.z, ['#f4a6c4', '#9ed9cf', '#fbf5ea'], 12, S.starGeo, 2); };
  S.offer(to => { if (!held || to !== uni) return null; held = false; it.g.visible = false; S.hands.free(me); girl.poseName = null; uni.hopV = 3; sfx.neigh(); S.confetti(uni.x, (uni.y || 0) + 1, uni.z, ['#f4a6c4', '#9ed9cf', '#f8dde4'], 12, undefined, 2.2); return item; });
  f.onTap = () => { if (S.playing() || mode || held) return; S.walkThen(wx + 1.4, wz + .9, () => { girl.face = -1; girl.view = 'side'; mode = 'make'; t = 0; sfx.click(); }, .8); };
  f.act = () => f.setFrame(fr[mode || 'rest']);
  return { f, state: () => ({ mode, held, given, eaten, frame: f.frame }), step({ dt }) {
    if (mode) { t += dt;
      if (mode === 'make' && t > 1.1) { mode = 'give'; t = 0; sfx.peep(); }
      else if (mode === 'give' && t > .6) { mode = 'wave'; t = 0; held = true; given++; S.hands.take(me, eat); sfx.hop(); }
      else if (mode === 'wave' && t > 1.4) mode = null; }
    if (held) { if (!S.playing()) { girl.poseName = 'hold'; const h = S.hand(); it.x = h.x + girl.face * .04; it.z = h.z + .05; it.floatY = it.y = h.y - .15; it.face = girl.face; it.g.visible = true; } else it.g.visible = false; }
  } };
}
/** the ice cream man at his cart (`x`, `z`: where he stands, the set's measure) */
export const iceCream = (S, x, z) => vendor(S, 'ijsverkoper', 'ijsje', x, z, { rest: 0, make: 1, give: 2, wave: 3 });

/** the lifeguard on her tall chair, looking out to sea */
export function lifeguard(S, x, z) {
  const { sfx } = S, f = S.figure('badmeester', CARDS3.badmeester), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; f.face = 1; S.solid({ x, z, r: .5 });
  let t = -1, looks = 0;
  f.onTap = () => { if (t >= 0) return; t = 0; looks++; };
  f.act = () => f.setFrame(t < 0 ? 0 : t < 1.8 ? 1 : 2);
  return { f, state: () => ({ looks, frame: f.frame }), step({ dt }) { if (t < 0) return; const was = t; t += dt;
    if (was < 1.8 && t >= 1.8) { sfx.note(1568); setTimeout(() => sfx.note(1568), 180); f.hopV = 1.2; } if (t > 3.4) t = -1; } };
}

/** the sunbather on her towel with her book */
export function sunbather(S, x, z) {
  const { sfx } = S, f = S.figure('zonnebader', CARDS3.zonnebader), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; f.face = -1; S.solid({ x, z, r: .55 });
  let mode = null, t = 0, peeks = 0, waves = 0;
  f.onTap = () => { if (mode === 'peek' && t > .3) { mode = 'wave'; t = 0; waves++; sfx.hello(); } else if (!mode) { mode = 'peek'; t = 0; peeks++; sfx.peep(); } };
  f.act = () => f.setFrame(mode === 'peek' ? 1 : mode === 'wave' ? 2 : 0);
  return { f, state: () => ({ mode, peeks, waves, frame: f.frame }), step({ dt }) { if (!mode) return; t += dt; if (mode === 'peek' && t > 2.2) mode = null; if (mode === 'wave' && t > 2.4) mode = null; } };
}
