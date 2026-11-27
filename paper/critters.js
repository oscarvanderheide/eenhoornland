// The smaller animals: each lives in one spot, waits for her, and answers a tap in its own way, always the same.
// (The dog has a bigger part and a file of its own, dog.js.) Drawings in animals.js; every maker takes the set's toolbox
// and a place in the set's own measure, and gives back { f, step, state } for the set to step and the tests to ask.
import { THREE, paper } from './kit.js';
import { ANIMALS } from './animals.js';
import { THINGS } from './things.js';

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
    if (sit > 0) { sit -= dt; if (sit <= 0 && eggs < 3) { eggs++; const e = S.figure('ei' + eggs, THINGS.ei); e.x = f.x - f.face * (.3 + eggs * .16); e.z = f.z + .14; e.hopV = 1.8; sfx.hop(); f.x += f.face * .3; } }
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
  // something to eat put down on the ground (farm.js): out of the mud it trots, munches it up, and back it goes to lie down
  const home = [f.x, f.z]; let meal = null;
  const walkTo = (tx, tz, dt) => { const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz); if (d < .1) { f.walking = false; return true; } const st = Math.min(d, 1.7 * dt); if (!S.move(f, dx / d * st, dz / d * st)) { f.x += dx / d * st; f.z += dz / d * st; } f.walking = true; if (Math.abs(dx) > .05) f.face = Math.sign(dx); return false; };
  const act0 = f.act; f.act = tick => { if (meal) { f.setFrame(meal.mode === 'eat' ? (Math.floor(tick / 2) % 2 ? 1 : 0) : 1 + (Math.floor(tick / 2) % 2)); f.tilt = meal.mode === 'eat' ? Math.sin(tick * 1.6) * .1 : 0; } else act0(tick); };
  return { f, state: () => ({ up: up > 0, frame: f.frame, meal: meal ? meal.mode : null, at: [f.x, f.z] }), busy: () => !!meal,
    eat(x, z, done) { meal = { x: x - .45 * Math.sign(x - f.x || 1), z: z + .05, done, mode: 'go', t: 0 }; sfx.oink(); },
    step({ dt }) {
      if (meal) { meal.t += dt;
        if (meal.mode === 'go' && (walkTo(meal.x, meal.z, dt) || meal.t > 12)) { meal.mode = 'eat'; meal.t = 0; f.face = Math.sign(meal.x < f.x ? -1 : 1) || 1; }
        else if (meal.mode === 'eat') { f.walking = false; if (Math.floor(meal.t * 3) !== Math.floor((meal.t - dt) * 3)) sfx.munch(); if (meal.t > 1.6) { meal.done(); sfx.oink(); f.hopV = 2.2; S.confetti(f.x, f.y + .5, f.z, ['#f4a6c4', '#f8dde4', '#e8893a'], 10, undefined, 2); meal.mode = 'home'; meal.t = 0; } }
        else if (meal.mode === 'home' && (walkTo(home[0], home[1], dt) || meal.t > 12)) { meal = null; f.walking = false; }
        return; }
      if (up > 0) { up -= dt; look(f, girl); } } };
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
  const { girl, sfx } = S, f = make(S, 'egel', x, z), g = guest(S, f, 3.4); let roll = 0, dir = 1, calm = 0, busy = false;
  f.onTap = () => { roll = .9; dir = girl.x < f.x ? 1 : -1; sfx.peep(); S.confetti(f.x, f.y + .2, f.z, ['#8fb06c', '#a3bf76', '#c79a66'], 7, undefined, 1.6); };
  f.act = tick => { const shy = near(f, girl, 1.5) && calm <= 0 && !busy; f.setFrame(roll > 0 || shy ? 3 : f.walking ? 1 + (Math.floor(tick / 2) % 2) : 0); f.tilt = roll > 0 ? tick * .9 : 0; };
  return { f, guest: g, state: () => ({ frame: f.frame, at: [f.x, f.z], there: g.there() }), step({ dt }) {
    busy = g.mind(dt); if (busy) { if (g.there()) look(f, girl); return; }
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
/** the squirrel sits by the foot of its tree (`trunk`: [x, z, r] in the set's measure, the trunk's middle and how thick it
 *  is). A tap: it scampers to the trunk, turns with its feet on the bark and runs up head first, rustles about in the
 *  leaves, turns round and comes down head first, and hops off with an acorn */
export function squirrel(S, x, z, high, name = 'eekhoorn', trunk = [x + .8, z - .6, .45]) {
  const { sfx, girl } = S, f = make(S, 'eekhoorn', x, z, name), g = guest(S, f, 4.6), [kx, kz] = S.at([trunk[0], trunk[1]]), home = [f.x, f.z];
  const side = Math.sign(f.x - kx) || -1, W = f.H * 160 / 124 * .5, bark = kx + side * trunk[2], foot = bark + side * W * .9;   // which side of the tree it lives on; half its card's width; the bark; where it stands to start up
  let t = -1, busy = false, rustle = 0; f.face = -side;
  const ease = k => k * k * (3 - 2 * k), Q = Math.PI / 2;
  f.onTap = () => { if (t >= 0 || busy) return; t = 0; sfx.peep(); };
  f.act = tick => { const run = 1 + (Math.floor(tick / 2) % 2); f.setFrame(busy ? (f.walking ? run : 3) : t < 0 ? 0 : t < 2.55 ? (t > 1.3 && t < 1.8 ? 1 : run) : t < 4.1 ? 3 : run); };
  return { f, guest: g, state: () => ({ frame: f.frame, lift: f.lift || 0, climbing: t >= .5 && t < 2.5, busy: t >= 0, there: g.there() }), step({ dt }) {
    busy = g.mind(dt); if (busy) { t = -1; f.lift = 0; f.lean = 0; if (g.there()) look(f, girl); return; }
    if (t < 0) return; t += dt;
    const Z = home[1] + (kz + .25 - home[1]) * Math.min(1, t / .35) * (t < 4.1 ? 1 : Math.max(0, 1 - (t - 4.1) / .5));   // a little in front of the trunk while it is on it
    if (t < .35) { const k = ease(t / .35); f.x = home[0] + (foot - home[0]) * k; f.z = Z; f.face = -side; f.lift = 0; f.lean = 0; }                       // to the tree
    else if (t < .5) { const k = ease((t - .35) / .15); f.x = foot + (bark - foot) * k; f.lift = W * k; f.lean = -side * Q * k; }                            // turns: feet on the bark
    else if (t < 1.3) { f.x = bark; f.lift = W + high * ease((t - .5) / .8); f.lean = -side * Q; }                                                           // up, head first
    else if (t < 1.8) { f.lift = W + high + Math.sin((t - 1.3) * 26) * .03; if (t - dt < 1.3) { sfx.rustle(); S.confetti(f.x, f.y + f.lift + .3, f.z, ['#7fa676', '#93b071', '#c79a66'], 7, undefined, 1.2); } if (t > 1.55) f.face = side; }   // a rummage in the leaves, and round
    else if (t < 2.5) { f.lift = W + high * (1 - ease((t - 1.8) / .7)); }                                                                                     // down, head first
    else if (t < 2.65) { const k = ease((t - 2.5) / .15); f.x = bark + (foot - bark) * k; f.lift = W * (1 - k); f.lean = -side * Q * (1 - k); f.face = side; if (t - dt < 2.5) { sfx.hop(); S.confetti(f.x, f.y + .4, f.z, ['#8d6a48', '#c79a66', '#7a5a3e'], 6, undefined, 1.5); } }   // off the trunk, with its acorn
    else if (t < 4.1) { f.x = foot; f.lift = 0; f.lean = 0; }
    else { const k = ease(Math.min(1, (t - 4.1) / .5)); f.x = foot + (home[0] - foot) * k; f.face = side; if (k >= 1) { t = -1; f.face = -side; } }          // and home again
    if (t >= 0) f.z = Z;
  } };
}

/** makes an animal one that can be asked to a picnic: it runs to its place when asked, sits there, and goes home when the
 *  picnic is over. `mind(dt)` tells the animal's own step whether it is busy being a guest */
function guest(S, f, speed) {
  const home = [f.x, f.z]; let to = null, stuck = 0;
  const go = (p, dt) => { const dx = p[0] - f.x, dz = p[1] - f.z, d = Math.hypot(dx, dz); if (d < .2) { f.walking = false; return true; }
    const s = Math.min(d, speed * dt), x0 = f.x, z0 = f.z; f.walking = S.move(f, dx / d * s, dz / d * s) && Math.hypot(f.x - x0, f.z - z0) > s * .3; if (Math.abs(dx) > .1) f.face = Math.sign(dx);
    stuck = f.walking ? 0 : stuck + dt; if (stuck > .6) { f.x += dx / d * s; f.z += dz / d * s; f.walking = true; }   // a tree in the way: it squeezes through
    return false; };
  return { invite(p) { to = p; }, leave() { to = home; }, there: () => to && to !== home && Math.hypot(to[0] - f.x, to[1] - f.z) < .25,
    mind(dt) { if (!to) return false; const at = go(to, dt); if (at && to === home) { to = null; return false; } return true; } };
}
/** a paper butterfly: it flutters about near where it lives. When she stands still close by it comes and sits on her head,
 *  and flies off again when she walks on */
export function butterfly(S, x, z, name, col = '#f4a6c4', col2 = '#f2c65c') {
  const { girl } = S, g = new THREE.Group(); g.userData.live = true; S.root.add(g);
  const wings = new THREE.Group(); g.add(wings);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), paper(col, { side: THREE.DoubleSide })); w.scale.set(1, 1.25, 1); w.position.set(s * .08, .03, 0); w.castShadow = true; wings.add(w);
    const w2 = new THREE.Mesh(new THREE.CircleGeometry(.055, 8), paper(col2, { side: THREE.DoubleSide })); w2.position.set(s * .07, -.07, .004); w2.castShadow = true; wings.add(w2); }
  S.glue(wings);
  const origin = S.at([0, 0]), home = S.at([x, z]); let px = home[0], pz = home[1], py = .7, tx = px, tz = pz, ty = .7, wait = 0, calm = 0, on = false, landings = 0;
  return { state: () => ({ sitting: on, landings, at: [px, pz] }), step({ dt, tick, stepped, time }) {
    const near = Math.hypot(girl.x - px, girl.z - pz), base = S.heightAt(px, pz) ?? 0;
    calm = !girl.walking && !S.playing() && Math.hypot(girl.x - home[0], girl.z - home[1]) < 3.2 ? calm + dt : 0;
    if (calm > 2.2 && !on && near < 4) { const h = S.head(); tx = h.x; tz = h.z + .02; ty = h.y - base + .06; if (Math.hypot(tx - px, tz - pz) < .12) { on = true; landings++; S.sfx.peep(); } }
    else if (on && calm === 0) { on = false; wait = 0; S.sfx.flutter(); }
    else if (!on) { wait -= dt; if (wait <= 0) { wait = 1.2 + Math.random() * 1.8; const a = Math.random() * 6.283, r = .4 + Math.random() * 1.5; tx = home[0] + Math.cos(a) * r; tz = home[1] + Math.sin(a) * r * .7; ty = .45 + Math.random() * .6; } }
    if (on) { const h = S.head(); px = h.x; pz = h.z + .02; py = h.y - base + .06; }
    else { const k = Math.min(1, dt * (calm > 2.2 ? 2.4 : 1.1)); px += (tx - px) * k; pz += (tz - pz) * k; py += (ty - py) * k; py += Math.sin((time || 0) * 5 + x) * .004; }
    g.position.set(px - origin[0], base + py, pz - origin[1]);
    if (stepped) wings.scale.x = on ? (tick % 6 < 1 ? .5 : 1) : (tick % 2 ? .28 : 1);   // wings shut and open, in steps
  } };
}

/** The fawn. It grazes, and it is shy: when she comes walking it lifts its head, and if she comes too close it trots off to
 *  another spot. But if she stands still near it for a moment it comes to her by itself and nuzzles her; a tap then is a
 *  hop and hearts. (Given flowers, it takes them, like anyone.) `spots`: where it grazes, in the set's own measure */
export function deer(S, spots) {
  const { girl, sfx } = S, f = make(S, 'hert', ...spots[0]), at = spots.map(p => S.at(p)); let spot = 0, mode = 'graze', calm = 0, nuzzles = 0, t = 0;
  const go = (p, dt, sp) => { const dx = p[0] - f.x, dz = p[1] - f.z, d = Math.hypot(dx, dz); if (d < .25) { f.walking = false; return true; } const s = Math.min(d, sp * dt); f.walking = true; if (!S.move(f, dx / d * s, dz / d * s)) { f.x += dx / d * s; f.z += dz / d * s; } if (Math.abs(dx) > .1) f.face = Math.sign(dx); return false; };
  f.onTap = () => { f.hopV = 2.6; sfx.peep(); if (mode === 'friend') S.confetti(f.x, f.y + .9, f.z, ['#f4a6c4', '#f8dde4', '#e98f8f'], 9, undefined, 2.2); };
  f.act = tick => f.setFrame(f.walking ? 1 + (Math.floor(tick / 2) % 2) : mode === 'graze' ? 3 : mode === 'alert' ? 4 : 0);
  return { f, state: () => ({ mode, spot, nuzzles, at: [f.x, f.z] }), step({ dt }) {
    const d = Math.hypot(girl.x - f.x, girl.z - f.z); t += dt;
    calm = !girl.walking && d < 5 ? calm + dt : 0;
    if (mode === 'flee') { if (go(at[spot], dt, 4.2)) mode = 'graze'; return; }
    if (mode === 'come' || mode === 'friend') {
      if (d > 6) { mode = 'graze'; return; }
      if (d > 1.0) go([girl.x - (girl.x < f.x ? -.8 : .8), girl.z + .1], dt, 1.6); else { f.walking = false; f.face = girl.x < f.x ? -1 : 1; if (mode === 'come') { mode = 'friend'; nuzzles++; f.hopV = 1.6; sfx.chime(); S.confetti(f.x, f.y + .9, f.z, ['#f4a6c4', '#f8dde4'], 7, undefined, 2); } }
      return;
    }
    f.walking = false;
    if (calm > 2.4 && d < 5) { mode = 'come'; return; }                                        // she waits quietly: it comes
    if (girl.walking && d < 2.3) { spot = (spot + 1) % at.length; mode = 'flee'; sfx.flutter(); return; }   // she walks right up to it: off it trots
    mode = d < 4.6 ? 'alert' : 'graze'; if (mode === 'alert') f.face = girl.x < f.x ? -1 : 1;
  } };
}
/** A wild boar piglet and two smaller ones behind it, rooting in the ground. A tap on any of them: a squeal, and the whole
 *  row trots a little circle and roots again; where the first one rooted, something small is turned up */
export function boars(S, x, z) {
  const { girl, sfx } = S, lead = make(S, 'zwijn', x, z, 'zwijn'), kids = [1, 2].map(i => { const k = S.figure('zwijn' + (i + 1), { ...ANIMALS.zwijn, size: ANIMALS.zwijn.size * .68 }); k.x = lead.x - i * .62; k.z = lead.z + i * .12; return k; });
  const all = [lead, ...kids], home = [lead.x, lead.z]; let run = 0, a = 0, squeals = 0;
  const squeal = () => { if (run > 0) return; run = 2.6; a = 0; squeals++; sfx.oink(); for (const p of all) p.hopV = 2.2; };
  for (const p of all) { p.onTap = squeal; p.act = tick => p.setFrame(run > 0 ? 1 + (Math.floor(tick / 2) % 2) : Math.hypot(girl.x - p.x, girl.z - p.z) < 2.2 ? 0 : 3); }
  return { f: lead, figs: all, state: () => ({ run: run > 0, squeals, at: [lead.x, lead.z] }), step({ dt }) {   // (figs: the piglets come along to listen too, folk.js)
    if (run > 0) { run -= dt; a += dt * 2.6; all.forEach((p, i) => { const b = a - i * .55, tx = home[0] + Math.sin(b) * 1.1 - i * .62 * Math.max(0, 1 - a), tz = home[1] + (1 - Math.cos(b)) * .7 + i * .12; p.face = Math.cos(b) >= 0 ? 1 : -1; p.x += (tx - p.x) * Math.min(1, dt * 6); p.z += (tz - p.z) * Math.min(1, dt * 6); });
      if (run <= 0) { all.forEach((p, i) => { p.face = 1; }); S.confetti(lead.x + .3, lead.y + .15, lead.z, ['#8d6a48', '#a98f6f', '#7a5a3e'], 8, undefined, 1.4); } }
    else all.forEach((p, i) => { const tx = home[0] - i * .62, tz = home[1] + i * .12; p.x += (tx - p.x) * Math.min(1, dt * 4); p.z += (tz - p.z) * Math.min(1, dt * 4); if (Math.hypot(girl.x - p.x, girl.z - p.z) < 2.2) p.face = girl.x < p.x ? -1 : 1; });
  } };
}
