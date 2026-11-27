// More animals (drawings in animals2.js), by the same rules as critters.js: each lives in one spot, waits for her, and
// answers a tap in its own way, always the same. Every maker takes the set's toolbox and a place in the set's own measure,
// and gives back { f, step, state }.
//   the meadow   sheep (a tap puffs it up, a second tap and the wool flies: shorn, until it grows back), the lamb (leaps),
//                the otter in the pool (taps its pebble, dives, comes up somewhere else)
//   the beach    the crab (dances, digs in), the gull (flaps up, lands), the turtle (tucks in), the seal (claps, balances a ball)
import { ANIMALS2 } from './animals2.js';
import { STORY } from './story.js';

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
export function otter(S, x, z, spots, up = null) {   // (`up`: called each time it comes up from a dive: what it may have found down there)
  const { sfx } = S, f = make(S, 'otter', x, z); let mode = null, t = 0, at = 0, to = null, dives = 0, knocks = 0;
  f.floatY = f.y = .03;
  f.onTap = () => { if (mode) return; mode = 'knock'; t = 0; knocks = 0; };
  f.act = tick => { f.setFrame(mode === 'knock' ? (Math.floor(t / .2) % 2 ? 0 : 1) : mode === 'dive' ? 2 : 0); f.tilt = mode ? 0 : Math.sin(tick * .35 + x) * .05; };
  return { f, state: () => ({ frame: f.frame, mode, dives, at: [f.x, f.z] }), step({ dt }) {
    if (mode === 'knock') { t += dt; if (Math.floor(t / .4) >= knocks && knocks < 3) { knocks++; sfx.click(); } if (t > 1.3) { mode = 'dive'; t = 0; dives++; sfx.splash(); S.confetti(f.x, .2, f.z + .1, WATER, 10, undefined, 2.4); at = (at + 1) % spots.length; to = S.at(spots[at]); } return; }
    if (mode === 'dive') { t += dt; if (to) { const dx = to[0] - f.x, dz = to[1] - f.z, d = Math.hypot(dx, dz); if (d > .05) { f.x += dx / d * Math.min(d, 2.4 * dt); f.z += dz / d * Math.min(d, 2.4 * dt); if (Math.abs(dx) > .05) f.face = Math.sign(dx); } else to = null; } if (t > .8 && !to) { mode = null; S.confetti(f.x, .15, f.z + .1, WATER, 6, undefined, 1.6); if (up) up(f); } }
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

/* ---------------- the castle ---------------- */
/** the peacock: a tap and its tail opens half, then all the way, a fan of eyes. It holds it a while. A tap on the fan: it shimmers */
export function peacock(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'pauw', x, z); let t = -1, fans = 0, shimmers = 0;
  f.onTap = () => { if (t < 0) { t = 0; fans++; sfx.flutter(); } else if (t > .7) { shimmers++; f.hopV = 1.6; sfx.flutter(); S.confetti(f.x, f.y + .8, f.z, ['#5fa8a0', '#8fc3e0', '#f2c65c', '#7fa676'], 12, undefined, 2); t = Math.min(t, 1.5); } };
  f.act = () => f.setFrame(t < 0 ? 0 : t < .7 ? 1 : 2);
  return { f, state: () => ({ frame: f.frame, fans, shimmers }), step({ dt }) { if (t < 0) { if (near(f, girl, 2.4)) look(f, girl); return; } const was = t; t += dt; if (was < .7 && t >= .7) { f.hopV = 1.4; sfx.swish(3); } if (t > 5.5) t = -1; } };
}
/** the baby dragon sleeps until she comes near. A tap: a smoke ring. Again: a smoke ring. The third time: a little flame,
 *  and fireworks go up. Then it starts over */
export function dragon(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'draakje', x, z); let t = -1, n = 0, puffs = 0, fires = 0, pops = [];
  f.onTap = () => { if (t >= 0) return; t = 0; n++; if (n < 3) { puffs++; sfx.swish(2); S.confetti(f.x + f.face * .5, f.y + .65, f.z + .05, ['#e9e4dc', '#d8d2c8', '#f6efe2'], 7, undefined, .9, true); } else { n = 0; fires++; f.hopV = 2; sfx.whoosh(); pops = [.25, .6, .95].map((at, i) => ({ at, x: f.x + (i - 1) * 1.4 + f.face * .6, done: false })); } };
  f.act = () => f.setFrame(t >= 0 ? (n === 0 ? 2 : 1) : near(f, girl, 4.5) ? 0 : 3);
  return { f, state: () => ({ frame: f.frame, puffs, fires, n }), step({ dt }) {
    if (t < 0) { if (near(f, girl, 3)) look(f, girl); return; }
    t += dt; for (const p of pops) if (!p.done && t > p.at) { p.done = true; sfx.hop(); S.confetti(p.x, f.y + 2.6 + (p.at * 7 % 1), f.z, ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea', '#e98f8f'], 22, S.starGeo, 3.2); }
    if (t > (n === 0 ? 1.5 : .9)) { t = -1; pops = []; }
  } };
}

/* ---------------- the story's star ---------------- */
/** The warm little star of the meadow: it hatches the egg. `spots`: three places [x, y, z] in the set's measure. It is
 *  shy: a tap, or her walking up close, and it hops away to its next place, twice. At the third place it stays; a tap, and
 *  it beams, flies to the egg that hops behind her, and circles it: the egg cracks, opens, and the unicorn is there (and
 *  the star is gone: its warmth is in the unicorn now). Without an egg behind her it sleeps (a tap: a peep, and it sleeps on).
 *  The hatching is a moment to watch: from the star's flight until a little after the unicorn is out she stands still,
 *  facing the egg, and the camera pushes in low and close between her and the egg, then glides back. */
export function star(S, spots) {
  const { girl, sfx } = S, f = S.figure('ster', STORY.ster), P = spots.map(([x, y, z]) => { const [wx, wz] = S.at([x, z]); return [wx, y, wz]; });
  let at = 0, mode = null, t = 0, from = null, hops = 0, done = false, cracked = 0, after = -1;
  const PUSH = { span: 6.2, tall: 4.4, rise: .2, riseTall: .34, fx: 1, fz: 1, lag: 1, dof: 1.5, range: .8 };   // close and low: the egg, the star and her in one small picture
  const watch = { look: [0, 0], shot: PUSH, step() { const [ex] = S.eggAt(); if (Math.abs(ex - girl.x) > .1) girl.face = Math.sign(ex - girl.x); } }; f.x = P[0][0]; f.z = P[0][2]; f.floatY = f.y = P[0][1];
  const egg = () => S.quest.stage === 'ei', ease = k => k * k * (3 - 2 * k);
  const go = () => {
    if (mode || done) return;
    if (!egg()) { f.hopV = 1.4; sfx.peep(); return; }
    if (at < P.length - 1) { from = P[at]; at++; mode = 'hop'; t = 0; hops++; sfx.peep(); }
    else { mode = 'fly'; t = 0; from = [f.x, f.y, f.z]; sfx.hello(); const [ex, ez] = S.eggAt(); watch.look = [(ex + girl.x) / 2, (ez + girl.z) / 2]; if (!S.playing()) S.play(watch); }
  };
  f.onTap = go;
  f.act = tick => { f.setFrame(mode === 'hop' ? 1 : mode === 'fly' || mode === 'warm' ? 2 : egg() ? 0 : 3); f.tilt = mode === 'warm' ? Math.sin(tick * .8) * .2 : 0; };
  return { f, state: () => ({ at, hops, mode, done, frame: f.frame, watching: S.playing() === watch }), step({ dt }) {
    f.g.visible = !done && S.quest.stage !== 'baby';
    if (after >= 0) { after += dt; if (after > 1.6) { after = -1; if (S.playing() === watch) S.stopPlay(); } }   // the unicorn is out: a moment more, then the camera glides back
    if (!mode) { if (egg() && !done && at < P.length - 1 && near(f, girl, 1.0) && girl.walking) go(); return; }
    t += dt;
    if (mode === 'hop') { const k = Math.min(1, t / .8), e = ease(k), to = P[at]; f.x = from[0] + (to[0] - from[0]) * e; f.z = from[2] + (to[2] - from[2]) * e; f.floatY = f.y = from[1] + (to[1] - from[1]) * e + Math.sin(k * Math.PI) * 1.4; if (k >= 1) mode = null; return; }
    const [ex, ez] = S.eggAt(), ey = (S.heightAt(ex, ez) ?? 0) + .7;
    if (mode === 'fly') { const k = Math.min(1, t / 1.1), e = ease(k); f.x = from[0] + (ex - from[0]) * e; f.z = from[2] + (ez + .06 - from[2]) * e; f.floatY = f.y = from[1] + (ey - from[1]) * e + Math.sin(k * Math.PI) * .8; if (k >= 1) { mode = 'warm'; t = 0; cracked = 0; } return; }
    // warming the egg: round and round it
    f.x = ex + Math.cos(t * 5) * .46; f.z = ez + .06 + Math.sin(t * 5) * .12; f.floatY = f.y = ey + Math.sin(t * 3) * .1;
    if (t > .9 && cracked < 1) { cracked = 1; S.eggFrame(1); sfx.click(); S.confetti(ex, ey - .2, ez + .1, ['#fbf5ea', '#f2c65c'], 6, undefined, 1.4); }
    if (t > 2.0 && cracked < 2) { cracked = 2; sfx.click(); S.confetti(ex, ey - .2, ez + .1, ['#fbf5ea', '#f2c65c'], 8, undefined, 1.6); }
    if (t > 3.0) { done = true; mode = null; f.g.visible = false; S.confetti(f.x, f.y + .2, f.z, ['#f2c65c', '#f6dfa6', '#fbf5ea'], 18, S.starGeo, 2.6); S.hatch(ex, ez); after = 0; }
  } };
}
