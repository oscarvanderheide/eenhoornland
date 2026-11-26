// The smaller animals: each lives in one spot, waits for her, and answers a tap in its own way, always the same.
// (The dog has a bigger part and a file of its own, dog.js.) Drawings in animals.js; every maker takes the set's toolbox
// and a place in the set's own measure, and gives back { f, step, state } for the set to step and the tests to ask.
import { THREE, paper } from './kit.js';
import { ANIMALS } from './animals.js';

const near = (f, girl, r) => Math.hypot(f.x - girl.x, f.z - girl.z) < r;
const look = (f, girl) => { f.face = girl.x < f.x ? -1 : 1; };
const make = (S, kind, x, z, name = kind) => { const f = S.figure(name, ANIMALS[kind]), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; return f; };

/** the hen: a tap and she clucks, sits down for a moment, and leaves an egg (three at most; they stay) */
export function hen(S, x, y, z) {
  const { girl, sfx } = S, f = make(S, 'kip', x, z); let sit = 0, eggs = 0;
  f.onTap = () => { if (sit > 0) return; f.hopV = 2.4; sfx.cluck(); sit = 1.6; };
  f.act = () => f.setFrame(sit > 0 && sit < 1.3 ? 3 : 0);
  return { f, state: () => ({ eggs, frame: f.frame }), step({ dt }) {
    if (near(f, girl, 2.2) && sit <= 0) look(f, girl);
    if (sit > 0) { sit -= dt; if (sit <= 0 && eggs < 3) { eggs++; const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), paper('#fbf5ea')); e.scale.y = 1.25; e.castShadow = true; e.position.set(x - f.face * (.28 + eggs * .13), y + .08, z + .12); S.root.add(e); sfx.hop(); f.x += f.face * .3; } }
  } };
}
/** a chick: a tap and it hops and peeps; it keeps close to where it lives */
export function chick(S, x, z, name) {
  const { girl, sfx } = S, f = make(S, 'kuiken', x, z, name);
  f.onTap = () => { f.hopV = 2.8; sfx.peep(); };
  f.act = () => f.setFrame(f.hop > 0 ? 1 : 0);
  return { f, state: () => ({ frame: f.frame }), step() { if (near(f, girl, 1.8)) look(f, girl); } };
}
/** the pig lies in its mud. A tap: up it gets, oinks, shakes the mud off, and lies down again */
export function pig(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'varken', x, z); let up = 0;
  f.onTap = () => { up = 2.4; f.hopV = 2.2; sfx.oink(); S.confetti(f.x, f.y + .35, f.z, ['#9c8f80', '#7d6f62', '#b5a999'], 12, undefined, 2); };
  f.act = tick => { f.setFrame(up > 0 ? (up > 1.6 ? 1 + (Math.floor(tick / 2) % 2) : 0) : 3); f.tilt = up > 1.6 ? Math.sin(tick * 2.2) * .12 : 0; };
  return { f, state: () => ({ up: up > 0, frame: f.frame }), step({ dt }) { if (up > 0) { up -= dt; look(f, girl); } } };
}
/** a duck on the pond. A tap: tail up, a splash, and it swims on to another spot on the water */
export function duck(S, x, z, name, spots) {
  const { sfx } = S, f = make(S, 'eend', x, z, name); let dive = 0, at = 0, to = null;
  f.floatY = f.y = .035;
  f.onTap = () => { if (dive > 0) return; dive = 1.1; sfx.splash(); setTimeout(() => sfx.quack(), 600); S.confetti(f.x, .2, f.z + .1, ['#8fc3cc', '#f6efe2'], 9, undefined, 2.4); at = (at + 1) % spots.length; to = S.at(spots[at]); };
  f.act = tick => { f.setFrame(dive > 0 ? 1 : 0); f.tilt = Math.sin(tick * .4 + x) * .04; };
  return { f, state: () => ({ dive: dive > 0, at: [f.x, f.z] }), step({ dt }) {
    if (dive > 0) { dive -= dt; return; }
    if (to) { const dx = to[0] - f.x, dz = to[1] - f.z, d = Math.hypot(dx, dz); if (d < .05) to = null; else { f.x += dx / d * Math.min(d, .7 * dt); f.z += dz / d * Math.min(d, .7 * dt); if (Math.abs(dx) > .05) f.face = Math.sign(dx); } }
  } };
}
/** the hedgehog is shy: when she comes close it curls up. A tap on the ball and it rolls a little way, then peeps out again */
export function hedgehog(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'egel', x, z); let roll = 0, dir = 1, calm = 0;
  f.onTap = () => { roll = .9; dir = girl.x < f.x ? 1 : -1; sfx.peep(); S.confetti(f.x, f.y + .2, f.z, ['#8fb06c', '#a3bf76', '#c79a66'], 7, undefined, 1.6); };
  f.act = tick => { const shy = near(f, girl, 1.5) && calm <= 0; f.setFrame(roll > 0 || shy ? 3 : 0); f.tilt = roll > 0 ? tick * .9 : 0; };
  return { f, state: () => ({ frame: f.frame, at: [f.x, f.z] }), step({ dt }) {
    if (roll > 0) { roll -= dt; S.move(f, dir * 1.6 * dt, 0); if (roll <= 0) calm = 3; }
    else if (calm > 0) { calm -= dt; look(f, girl); }   // after its roll it trusts her for a while, and looks
  } };
}
/** the owl sleeps on her ledge by day. A tap wakes her: she spreads her wings and hoots, looks about, and sleeps again. In the evening she is awake */
export function owl(S, x, z, up) {
  const { sfx } = S, f = make(S, 'uil', x, z); let woke = 0, eve = 0;
  f.lift = up; f.floatY = f.y = S.heightAt(...S.at([x, z])) ?? 0;
  f.onTap = () => { woke = 3.2; f.hopV = 1.6; sfx.hoot(); };
  f.act = () => f.setFrame(woke > 2.5 ? 2 : woke > 0 || eve > .5 ? 0 : 1);
  return { f, state: () => ({ frame: f.frame }), step({ dt, eve: e }) { eve = e; if (woke > 0) woke -= dt; } };
}
/** the squirrel sits at the foot of the oak. A tap: up the trunk it runs, and comes down with an acorn */
export function squirrel(S, x, z, high) {
  const { sfx } = S, f = make(S, 'eekhoorn', x, z); let t = -1; f.face = -1;
  f.onTap = () => { if (t >= 0) return; t = 0; sfx.peep(); };
  f.act = tick => f.setFrame(t >= 0 && t < 1.7 ? 1 + (Math.floor(tick / 2) % 2) : t >= 1.7 ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, lift: f.lift || 0, busy: t >= 0 }), step({ dt }) {
    if (t < 0) return; t += dt;
    f.lift = t < .7 ? high * t / .7 : t < 1.0 ? high : t < 1.7 ? high * (1.7 - t) / .7 : 0;   // up, a rummage in the leaves, down again
    if (t > 1.7 && t - dt <= 1.7) { sfx.hop(); S.confetti(f.x, f.y + .4, f.z, ['#8d6a48', '#c79a66', '#7a5a3e'], 6, undefined, 1.5); }
    if (t > 4) { t = -1; f.lift = 0; }
  } };
}
