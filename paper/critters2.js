// More animals (drawings in animals2.js), by the same rules as critters.js: each lives in one spot, waits for her, and
// answers a tap in its own way, always the same. Every maker takes the set's toolbox and a place in the set's own measure,
// and gives back { f, step, state }.
//   the meadow   sheep (a tap puffs it up, a second tap and the wool flies: shorn, until it grows back), the lamb (leaps),
//                the otter in the pool (taps its pebble, dives, comes up somewhere else)
//   the beach    the crab (dances, digs in), the gull (flaps up, lands), the turtle (tucks in), the seal (claps, balances a ball)
import { ANIMALS2 } from './animals2.js';

const near = (f, girl, r) => Math.hypot(f.x - girl.x, f.z - girl.z) < r;
const look = (f, girl) => { f.face = girl.x < f.x ? -1 : 1; };
const make = (S, kind, x, z, name = kind) => { const f = S.figure(name, ANIMALS2[kind]), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; return f; };
const WOOL = ['#fbf7ee', '#f6efe2', '#fffdf8'], WATER = ['#8fc3cc', '#f6efe2', '#7fbcc0'];

/** a sheep: a tap and it puffs up; a tap on the puffed sheep and the wool flies off in a cloud. Shorn, it only bleats, until the wool is back */
export function sheep(S, x, z, name = 'schaap') {
  const { girl, sfx } = S, f = make(S, 'schaap', x, z, name); let st = 0, t = 0, poofs = 0;   // 0 woolly, 1 puffed, 2 shorn
  f.onTap = () => {
    if (st === 0) { st = 1; t = 0; f.hopV = 2.2; sfx.bleat(); }
    else if (st === 1) { st = 2; t = 0; poofs++; f.hopV = 3; sfx.flutter(); S.confetti(f.x, f.y + .5, f.z, WOOL, 28, undefined, 1.7, true); }
    else { f.hopV = 1.8; sfx.bleat(); }
  };
  f.act = () => f.setFrame(st === 1 ? 3 : st === 2 ? 4 : 0);
  return { f, state: () => ({ frame: f.frame, st, poofs }), step({ dt }) {
    if (near(f, girl, 2.4)) look(f, girl);
    if (st) { t += dt; if (st === 1 && t > 7) st = 0; else if (st === 2 && t > 16) { st = 0; f.hopV = 1.6; } }
  } };
}
/** the lamb: a tap, or her running close by, and it leaps twice */
export function lamb(S, x, z, name = 'lam') {
  const { girl, sfx } = S, f = make(S, 'lam', x, z, name); let leaps = 0, more = 0, wait = 0, was = false;
  const leap = () => { if (f.hop > 0 || more) return; f.hopV = 3.4; more = 1; wait = 0; leaps++; sfx.peep(); };
  f.onTap = leap;
  f.act = () => f.setFrame(f.hop > 0 ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, leaps }), step({ dt }) {
    const close = near(f, girl, 1.3) && girl.walking; if (close && !was) leap(); was = close;
    if (near(f, girl, 2.4)) look(f, girl);
    if (more && !(f.hop > 0)) { wait += dt; if (wait > .12) { more = 0; f.hopV = 2.6; } }
  } };
}
/** the otter floats on its back in the pool. A tap: it knocks its pebble on its shell three times, dives, and comes up at its next spot */
export function otter(S, x, z, spots) {
  const { sfx } = S, f = make(S, 'otter', x, z); let mode = null, t = 0, at = 0, to = null, dives = 0, knocks = 0;
  f.floatY = f.y = .03;
  f.onTap = () => { if (mode) return; mode = 'knock'; t = 0; knocks = 0; };
  f.act = tick => { f.setFrame(mode === 'knock' ? (Math.floor(t / .2) % 2 ? 0 : 1) : mode === 'dive' ? 2 : 0); f.tilt = mode ? 0 : Math.sin(tick * .35 + x) * .05; };
  return { f, state: () => ({ frame: f.frame, mode, dives, at: [f.x, f.z] }), step({ dt }) {
    if (mode === 'knock') { t += dt; if (Math.floor(t / .4) >= knocks && knocks < 3) { knocks++; sfx.click(); } if (t > 1.3) { mode = 'dive'; t = 0; dives++; sfx.splash(); S.confetti(f.x, .2, f.z + .1, WATER, 10, undefined, 2.4); at = (at + 1) % spots.length; to = S.at(spots[at]); } return; }
    if (mode === 'dive') { t += dt; if (to) { const dx = to[0] - f.x, dz = to[1] - f.z, d = Math.hypot(dx, dz); if (d > .05) { f.x += dx / d * Math.min(d, 2.4 * dt); f.z += dz / d * Math.min(d, 2.4 * dt); if (Math.abs(dx) > .05) f.face = Math.sign(dx); } else to = null; } if (t > .8 && !to) { mode = null; S.confetti(f.x, .15, f.z + .1, WATER, 6, undefined, 1.6); } }
  } };
}

/** The dolphin of a bridge (Oscar: "when walking the bridge it would be cool to have a dolphin jumping over us"). `B`: the
 *  bridge { x0, x1, z0, z1 } in the set's measure, running east-west. Once on every crossing, when she is well out over
 *  the water and walking, it comes up out of the sea behind the bridge, sails over the deck just ahead of her and dives in
 *  on the near side. A tap on it in the air: it turns a flip. One body turned about one point of the card (see animals2.js) */
export function dolphin(S, B, water = -.55) {
  const { girl, sfx } = S, f = make(S, 'dolfijn', B.x0, B.z0), [ax, az] = S.at([B.x0, B.z0]), [bx, bz] = S.at([B.x1, B.z1]); f.g.visible = false;
  const PIV = (1 - 112 / 240) * f.H, DUR = 1.6, PEAK = 3.5; let t = -1, way = null, leaps = 0, done = false, flip = 0, flips = 0, lx = girl.x, vx = 0;
  const splash = (x, z) => { sfx.splash(); S.confetti(x, water + .3, z, WATER, 16, undefined, 3); };
  f.onTap = () => { if (t >= 0 && !flip) { flip = 1; flips++; sfx.hop(); } };
  f.act = () => { const k = t / DUR; f.setFrame(k < .34 ? 0 : k < .66 ? 1 : 2); f.tilt = flip > 0 ? (1 - flip) * Math.PI * 2 : 0; };
  return { f, state: () => ({ leaps, flips, up: t >= 0, at: [f.x, f.y, f.z] }), step({ dt }) {
    if (Math.abs(girl.x - lx) > .6) vx = 0; else vx += ((girl.x - lx) / Math.max(dt, 1e-3) - vx) * Math.min(1, dt * 8); lx = girl.x;   // which way she is really going, and how fast
    const over = girl.x > ax + 5 && girl.x < bx - 5 && girl.z > az - .3 && girl.z < bz + .3;
    if (!(girl.x > ax - 1 && girl.x < bx + 1 && girl.z > az - 1 && girl.z < bz + 1)) done = false;   // off the bridge: the next crossing has a dolphin of its own
    if (over && !done && t < 0 && Math.abs(vx) > 1) { done = true; t = 0; leaps++; flip = 0; const mx = girl.x + Math.sign(vx) * 3.1;   // (her walk covers about that in half a leap: it is over the deck when she gets there)
      way = [mx - 1.3, az - 2.6, mx + 1.3, bz + 2.6]; f.g.visible = true; f.face = 1; splash(way[0], way[1]); }
    if (t < 0) return;
    t += dt; const k = Math.min(1, t / DUR);
    f.x = way[0] + (way[2] - way[0]) * k; f.z = way[1] + (way[3] - way[1]) * k; f.floatY = f.y = water - .5 + 4 * PEAK * k * (1 - k) - PIV;
    if (flip) flip = Math.max(0, flip - dt * 1.6);
    if (k >= 1) { t = -1; f.g.visible = false; f.tilt = 0; splash(way[2], way[3]); }
  } };
}

/* ---------------- the beach ---------------- */
const SANDY = ['#ecd3a0', '#f7ecd0', '#e2c58a'];
/** the crab: a tap and it dances, claws up one after the other. A tap on the dancing crab, or her running straight at it:
 *  it digs itself in, and a little later it is up again at its next spot */
export function crab(S, x, z, spots) {
  const { girl, sfx } = S, f = make(S, 'krab', x, z); let mode = null, t = 0, at = 0, dances = 0, digs = 0, last = -1;
  const dig = () => { mode = 'dug'; t = 0; digs++; sfx.rustle(); S.confetti(f.x, f.y + .15, f.z + .1, SANDY, 9, undefined, 1.6); };
  f.onTap = () => { if (mode === 'dance') dig(); else if (!mode) { mode = 'dance'; t = 0; dances++; last = -1; f.hopV = 1.6; } };
  f.act = () => f.setFrame(mode === 'dance' ? 1 + (Math.floor(t / .22) % 2) : mode === 'dug' ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, mode, dances, digs, at: [f.x, f.z] }), step({ dt }) {
    if (!mode) { if (near(f, girl, .75) && girl.walking) dig(); return; }
    t += dt;
    if (mode === 'dance') { const beat = Math.floor(t / .22); if (beat !== last) { last = beat; sfx.click(); } if (t > 1.9) mode = null; }
    else if (t > 2.6) { at = (at + 1) % spots.length; [f.x, f.z] = S.at(spots[at]); mode = null; f.hopV = 1.8; S.confetti(f.x, f.y + .15, f.z + .1, SANDY, 7, undefined, 1.4); }
  } };
}
/** the gull sits on a post. A tap: it flaps up and over to its next perch (`perches`: [x, z, height] in the set's measure).
 *  Every other time it lands with a little fish in its beak; a tap then and it gulps it down */
export function gull(S, perches) {
  const { sfx } = S, f = make(S, 'meeuw', perches[0][0], perches[0][1]), P = perches.map(([x, z, h]) => [...S.at([x, z]), h]); let at = 0, t = -1, from = null, flights = 0, fish = false;
  f.floatY = f.y = P[0][2];
  f.onTap = () => { if (t >= 0) return; if (fish) { fish = false; f.hopV = 1.6; sfx.munch(); return; } from = P[at]; at = (at + 1) % P.length; t = 0; flights++; sfx.flutter(); };
  f.act = tick => f.setFrame(t >= 0 ? 1 + (Math.floor(tick / 2) % 2) : fish ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, flights, fish, flying: t >= 0, at }), step({ dt }) {
    if (t < 0) return; t += dt; const to = P[at], k = Math.min(1, t / 1.7), e = k * k * (3 - 2 * k);
    f.x = from[0] + (to[0] - from[0]) * e; f.z = from[1] + (to[1] - from[1]) * e; f.floatY = f.y = from[2] + (to[2] - from[2]) * e + Math.sin(k * Math.PI) * 1.5; if (Math.abs(to[0] - from[0]) > .1) f.face = Math.sign(to[0] - from[0]);
    if (k >= 1) { t = -1; fish = flights % 2 === 0; f.hopV = .8; }
  } };
}
/** the turtle: a tap and it pulls in its head and legs; then it comes out again and walks, slowly, to its next spot */
export function turtle(S, x, z, spots) {
  const { sfx } = S, f = make(S, 'schildpad', x, z); let mode = null, t = 0, at = 0, to = null, tucks = 0;
  f.onTap = () => { if (mode === 'tuck') return; mode = 'tuck'; t = 0; tucks++; sfx.peep(); };
  f.act = tick => f.setFrame(mode === 'tuck' ? 3 : mode === 'walk' ? 1 + (Math.floor(tick / 4) % 2) : 0);
  return { f, state: () => ({ frame: f.frame, mode, tucks, at: [f.x, f.z] }), step({ dt }) {
    if (mode === 'tuck') { t += dt; if (t > 1.8) { mode = 'walk'; at = (at + 1) % spots.length; to = S.at(spots[at]); } }
    else if (mode === 'walk') { const dx = to[0] - f.x, dz = to[1] - f.z, d = Math.hypot(dx, dz); if (d < .05) mode = null; else { f.x += dx / d * Math.min(d, .45 * dt); f.z += dz / d * Math.min(d, .45 * dt); if (Math.abs(dx) > .05) f.face = Math.sign(dx); } }
  } };
}
/** the seal on its rock (`y`: the top of the rock). A tap: it claps its flippers. A tap on the clapping seal: a ball on its nose */
export function seal(S, x, z, y) {
  const { sfx } = S, f = make(S, 'zeehond', x, z); let mode = null, t = 0, claps = 0, balls = 0, last = -1; f.floatY = f.y = y; f.face = -1;
  f.onTap = () => { if (mode === 'clap') { mode = 'ball'; t = 0; balls++; f.hopV = 2; sfx.boing(); } else if (!mode) { mode = 'clap'; t = 0; claps++; last = -1; sfx.bark(); } };
  f.act = () => f.setFrame(mode === 'clap' ? (Math.floor(t / .2) % 2 ? 0 : 1) : mode === 'ball' ? 2 : 0);
  return { f, state: () => ({ frame: f.frame, mode, claps, balls }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'clap') { const beat = Math.floor(t / .4); if (beat !== last) { last = beat; sfx.thud(); } if (t > 2.0) mode = null; }
    else if (t > 3.2) mode = null;
  } };
}

/* ---------------- the rainbow island ---------------- */
/** a flamingo on one leg. A tap: it dips its head, then spreads its wings. `friend`: another flamingo, who does the same a moment later */
export function flamingo(S, x, z, name = 'flamingo') {
  const { sfx } = S, f = make(S, 'flamingo', x, z, name); let t = -1, shows = 0, friend = null, due = -1;
  const show = () => { if (t >= 0) return false; t = 0; shows++; sfx.peep(); return true; };
  f.onTap = () => { if (show() && friend) friend.later(.45); };
  f.act = () => f.setFrame(t < 0 ? 0 : t < .9 ? 1 : 2);
  return { f, later(s) { due = s; }, pair(o) { friend = o; }, state: () => ({ frame: f.frame, shows }), step({ dt }) {
    if (due >= 0) { due -= dt; if (due < 0) show(); }
    if (t < 0) return; const was = t; t += dt; if (was < .9 && t >= .9) { f.hopV = 1.8; sfx.flutter(); } if (t > 2.3) t = -1;
  } };
}
/** the parrot on its perch (`y`: how high the perch is). A tap: it spreads its wings and squawks twice */
export function parrot(S, x, z, y) {
  const { sfx } = S, f = make(S, 'papegaai', x, z); let t = -1, talks = 0, said = 0; f.floatY = f.y = y; f.face = -1;
  f.onTap = () => { if (t >= 0) return; t = 0; talks++; said = 0; f.hopV = 1.4; };
  f.act = () => f.setFrame(t < 0 ? 0 : t < .5 ? 1 : (Math.floor(t / .18) % 2 ? 0 : 2));
  return { f, state: () => ({ frame: f.frame, talks }), step({ dt }) { if (t < 0) return; t += dt; if (said < 2 && t > .5 + said * .45) { said++; sfx.squawk(); } if (t > 1.5) t = -1; } };
}
/** the rabbit and its holes (`holes`: [x, z] in the set's measure; it sits by the first). A tap: it hops down the nearest
 *  hole, and a moment later peeks out of the next one. A tap on the peeking rabbit: found! Out it jumps, and sits there */
export function rabbit(S, holes) {
  const { sfx } = S, H = holes.map(p => S.at(p)), f = make(S, 'konijn', holes[0][0] + .55, holes[0][1] + .1); let mode = null, t = 0, at = 0, found = 0, dives = 0, from = null;
  f.onTap = () => {
    if (mode === 'peek') { mode = 'out'; t = 0; found++; f.hopV = 3; sfx.peep(); S.confetti(f.x, f.y + .4, f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf'], 10, S.starGeo, 2); }
    else if (!mode) { mode = 'in'; t = 0; dives++; from = [f.x, f.z]; f.hopV = 2.4; sfx.hop(); }
  };
  f.act = () => f.setFrame(mode === 'in' ? (t < .25 ? 1 : 2) : mode === 'peek' ? 3 : mode === 'out' ? (t < .3 ? 1 : 2) : 0);
  return { f, state: () => ({ frame: f.frame, mode, found, dives, at }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'in') { const k = Math.min(1, t / .4); f.x = from[0] + (H[at][0] - from[0]) * k; f.z = from[1] + (H[at][1] + .02 - from[1]) * k; if (k >= 1) { mode = 'gone'; t = 0; f.g.visible = false; S.confetti(f.x, f.y + .1, f.z, ['#c9a878', '#e6c98f'], 6, undefined, 1.4); } }
    else if (mode === 'gone' && t > 1.3) { at = (at + 1) % H.length; f.x = H[at][0]; f.z = H[at][1] + .02; f.g.visible = true; mode = 'peek'; t = 0; }
    else if (mode === 'out') { const k = Math.min(1, t / .4); f.x = H[at][0] + .55 * k; f.z = H[at][1] + .02 + .08 * k; if (k >= 1) mode = null; }
  } };
}
