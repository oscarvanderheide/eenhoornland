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
