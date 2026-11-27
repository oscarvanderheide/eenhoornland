// The people of the islands (drawings in people.js). Like the animals, each lives in one spot, waits for her, and answers a
// tap in a way of their own, always the same; a few have a little more to them if she keeps playing:
//   grandma     knits on a bench (dozes while nobody is near). A tap, or sitting down beside her: she waves
//   the baker   holds out a bun: it is in her hands, and whoever she taps next gets it (and munches)
//   the gardener  asleep in his wheelbarrow. A tap: up he shoots, hat in the air, and waves sleepily. A full watering can: wetter
//   the fisherman  a tap and something bites: a fish, a fish, a boot. The fish goes back into the water
//   the painter  every tap she paints on: first strokes, a rainbow, a little unicorn (and is proud); then a clean sheet
//   the accordion player  silent until tapped; then a few long soft notes out of the island's own chord, and he tips his cap
// Nobody makes a sound by themselves. Every maker takes the set's toolbox and a place in the set's own measure, and gives
// back { f, step, state } for the set to step and the tests to ask.
import { THREE, paper, card } from './kit.js';
import { PEOPLE, PROPS } from './people.js';
import { STORY } from './story.js';
import { THINGS } from './things.js';
import { gift } from './gear.js';

const near = (f, girl, r) => Math.hypot(f.x - girl.x, f.z - girl.z) < r;
const make = (S, name, spec, x, z, r = .34) => { const f = S.figure(name, spec), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; if (r) S.solid({ x, z, r }); return f; };
const WATER = ['#8fd0e0', '#f6efe2', '#7fbcc0'];

/** grandma, on the right half of a bench (x, z: the bench's middle; `bench`: what props.js bench gave, so she knows when she has company) */
export function grandma(S, x, z, bench) {
  const { girl, sfx } = S, f = make(S, 'oma', PEOPLE.oma, x + .3, z + .22, 0); f.lift = .13; f.face = -1; let wave = 0, sat = false, waves = 0;   // (z + .22: in front of the seat's front slat, which reaches .19; on the edge of the bench, her feet and the scarf hanging in front)
  const hello = () => { if (wave > 0) return; wave = 1.7; waves++; sfx.hello(); };
  f.onTap = hello;
  f.act = tick => f.setFrame(wave > 0 ? 2 : near(f, girl, 4) ? Math.floor(tick / 4) % 2 : 3);
  return { f, state: () => ({ frame: f.frame, waves }), step({ dt }) { if (wave > 0) wave -= dt; const now = !!bench && bench.state().mode === 'sit'; if (now && !sat) hello(); sat = now; } };
}

/** the baker, with his tray */
export function baker(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'bakker', PEOPLE.bakker, x, z), bun = S.figure('broodje', PROPS.broodje), me = {}; bun.g.visible = false;
  let mode = null, t = 0, held = false, given = 0;
  const down = () => { held = false; bun.g.visible = false; girl.poseName = null; };   // (put down, it is simply gone: the baker has more)
  S.offer(who => { if (!held) return false; down(); S.hands.free(me); given++; who.hopV = 2.6; sfx.munch(); S.confetti(who.x, (who.y || 0) + .6, who.z, ['#e8c58f', '#d9a066', '#f6efe2'], 8, undefined, 1.6); if (who === f) { mode = 'laugh'; t = 0; } return 'broodje'; });
  f.onTap = () => { if (S.playing() || mode) return; S.walkThen(f.x + 1.05, f.z + .12, () => { if (mode) return; girl.view = 'side'; girl.face = -1; mode = 'give'; t = 0; sfx.hop(); }, 1.2); };
  f.act = () => f.setFrame(mode === 'give' ? 1 : mode === 'laugh' ? 2 : 0);
  return { f, state: () => ({ frame: f.frame, held, given }), step({ dt }) {
    if (mode) { t += dt; if (mode === 'give' && t > .7) { S.hands.take(me, down); held = true; mode = 'laugh'; t = 0; f.hopV = 1.6; sfx.hello(); } else if (mode === 'laugh' && t > 1.3) mode = null; }
    if (held) { bun.g.visible = !S.playing(); if (bun.g.visible) { girl.poseName = 'hold'; const h = S.hand(); bun.x = h.x + girl.face * .06; bun.z = h.z + .05; bun.floatY = bun.y = h.y - .08; } }
  } };
}

/** the gardener, asleep in his wheelbarrow. `can`: the farm's watering can (farm.js), for the wet way of waking him */
export function gardener(S, x, z, can) {
  const { girl, sfx } = S, f = make(S, 'tuinman', PEOPLE.tuinman, x, z, .5); let mode = null, t = 0, woke = 0, wet = 0;
  const wake = water => { mode = 'jump'; t = 0; woke++; f.hopV = water ? 3.4 : 2.4; sfx.boing(); if (water) { wet++; sfx.splash(); S.confetti(f.x, .9, f.z, WATER, 18, undefined, 2.8); } };
  f.onTap = () => {
    if (S.playing() || mode) return;
    if (can && can.holding() && can.full()) { const side = girl.x < f.x ? -1 : 1; S.walkThen(f.x + side * 1.2, f.z + .12, () => { if (!mode && can.pourThen(() => wake(true))) girl.face = -side; }, 1.2); return; }
    wake(false);
  };
  f.act = tick => f.setFrame(mode === 'jump' ? 2 : mode === 'wave' ? 3 : near(f, girl, 4.5) ? Math.floor(tick / 8) % 2 : 0);
  return { f, state: () => ({ frame: f.frame, woke, wet }), step({ dt }) { if (!mode) return; t += dt; if (mode === 'jump' && t > 1.0) { mode = 'wave'; t = 0; sfx.hello(); } else if (mode === 'wave' && t > 2.4) mode = null; } };
}

/** the fisherman on his crate; `face` -1: his line hangs to the left of him */
export function fisher(S, x, z, face = -1) {
  const { sfx } = S, f = make(S, 'visser', PEOPLE.visser, x, z, .4); f.face = face; let mode = null, t = 0, n = 0;
  const lineX = () => f.x + face * (PEOPLE.visser.line / PEOPLE.visser.w - .5) * f.W, plop = k => { sfx.splash(); S.confetti(lineX(), .12, f.z, WATER, k, undefined, 1.4); };
  f.onTap = () => { if (mode) return; mode = 'bite'; t = 0; plop(6); };
  f.act = () => f.setFrame(mode === 'bite' ? 1 : mode === 'fish' ? 2 : mode === 'boot' ? 3 : 0);
  return { f, state: () => ({ frame: f.frame, caught: n, mode }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'bite' && t > .9) { n++; mode = n % 3 ? 'fish' : 'boot'; t = 0; f.hopV = 1.4; if (n % 3) sfx.hop(); else sfx.boing(); }
    else if (mode !== 'bite' && t > 2.4) { if (mode === 'fish') plop(10); mode = null; }   // the fish goes back into the water
  } };
}

/** the painter and her easel (the easel stands to her right) */
export function painter(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'schilder', PEOPLE.schilder, x, z), ez = make(S, 'ezel', PROPS.ezel, x + 1.05, z - .05, .3); let mode = null, t = 0, pic = 0, done = 0;
  const paint = () => { if (mode) return; if (pic === 3) { pic = 0; sfx.rustle(); } mode = 'paint'; t = 0; sfx.swish(3); };
  f.onTap = paint; ez.onTap = paint;
  f.act = tick => f.setFrame(mode === 'paint' ? Math.floor(tick / 2) % 2 : mode === 'proud' ? 3 : near(f, girl, 3.5) ? 2 : 0);
  ez.act = () => ez.setFrame(pic);
  return { f, state: () => ({ frame: f.frame, pic, done }), step({ dt }) {
    if (!mode) return; t += dt;
    if (mode === 'paint' && t > 1.3) { pic++; ez.hopV = 1.2; if (pic === 3) { mode = 'proud'; t = 0; done++; f.hopV = 2.4; sfx.chime(); S.confetti(ez.x, 1.0, ez.z, ['#e98f8f', '#f2c65c', '#9ed9cf', '#bba6ea'], 18, undefined, 2.4); } else { mode = null; sfx.hop(); } }
    else if (mode === 'proud' && t > 2.4) mode = null;
  } };
}

/** the accordion player on his stool */
export function player(S, x, z) {
  const { sfx } = S, f = make(S, 'muzikant', PEOPLE.muzikant, x, z);
  const notes = [0, 1, 2].map(i => { const n = S.figure('noot' + i, PROPS.noot); n.g.visible = false; n.act = () => n.setFrame(i % 2); return { n, t: -1, side: 1 }; });
  let mode = null, t = 0, plays = 0, next = 0, sent = 0;
  f.onTap = () => { if (mode) return; mode = 'play'; t = 0; next = .25; plays++; sfx.squeeze(); };
  f.act = tick => f.setFrame(mode === 'play' ? [0, 1, 2, 1][Math.floor(tick / 3) % 4] : mode === 'bow' ? 3 : 2);
  return { f, state: () => ({ frame: f.frame, plays, playing: mode === 'play', notes: notes.filter(q => q.t >= 0).length }), step({ dt }) {
    for (const q of notes) if (q.t >= 0) { q.t += dt; const k = q.t / 1.9; q.n.x = f.x + q.side * (.4 + k * .55) + Math.sin(q.t * 3) * .08; q.n.z = f.z + .06; q.n.floatY = q.n.y = 1.15 + k * 1.2; if (k >= 1) { q.t = -1; q.n.g.visible = false; } }
    if (!mode) return; t += dt;
    if (mode === 'play') { next -= dt; if (next <= 0) { next = .95; const q = notes.find(q => q.t < 0); if (q) { q.t = 0; q.side = sent++ % 2 ? 1 : -1; q.n.g.visible = true; } } if (t > 4.9) { mode = 'bow'; t = 0; f.hopV = 1.2; } }
    else if (t > 1.4) mode = null;
  } };
}

/** An animal of the island, made one that can come and listen to a musician: `c` is what its maker gave ({ f, step },
 *  or several figures in `c.figs`: the boar and her piglets). While it is asked, its own step does not run: it walks to
 *  its seat, sits there facing the music, and when the music is over it walks back to where it was and goes on with its
 *  own little life. Made once per animal, the first time it is asked */
const audiences = new WeakMap();
function audience(S, c) {
  if (audiences.has(c)) return audiences.get(c);
  const figs = c.figs || [c.f], own = c.step, speed = 2.6; let seats = null, back = null, on = false, look = 0;
  const stuck = figs.map(() => 0);
  const go = (f, i, p, dt) => { const dx = p[0] - f.x, dz = p[1] - f.z, d = Math.hypot(dx, dz); if (d < .12) { f.walking = false; return true; }
    const sp = Math.min(d, speed * dt), x0 = f.x, z0 = f.z; f.walking = S.move(f, dx / d * sp, dz / d * sp) && Math.hypot(f.x - x0, f.z - z0) > sp * .3; if (Math.abs(dx) > .1) f.face = Math.sign(dx);
    stuck[i] = f.walking ? 0 : stuck[i] + dt; if (stuck[i] > .5) { f.x += dx / d * sp; f.z += dz / d * sp; f.walking = true; }   // (something in the way: it squeezes past)
    return false; };
  c.step = e => {
    if (!on) { own.call(c, e); return; }
    let all = true; figs.forEach((f, i) => { if (go(f, i, (seats || back)[i], e.dt)) { if (seats) f.face = Math.sign(look - f.x) || f.face; } else all = false; });
    if (!seats && all) on = false;   // home again: its own life goes on
  };
  const a = { n: figs.length, figs,
    invite(ps, mx) { if (!on) back = figs.map(f => [f.x, f.z]); seats = ps; look = mx; on = true; figs.forEach(f => { f.lift = 0; f.lean = 0; }); },
    leave() { if (on) seats = null; },
    there: () => !!seats && figs.every((f, i) => Math.hypot(seats[i][0] - f.x, seats[i][1] - f.z) < .3) };
  audiences.set(c, a); return a;
}
/** seats in a part of a circle round (mx, mz) on the camera's side: her own seat in front, then the animals' to her left
 *  and right in turn, as wide as each one is, round to the musician's sides; a second row further out when it is full.
 *  Only where one can stand on this island (`ok`) */
function arc(mx, mz, R, sizes, ok) {
  const at = (r, a) => [mx + Math.sin(a) * r, mz + Math.cos(a) * r];
  let r = R, me = null; search: for (const dr of [0, -.4, .4]) for (const a of [0, .25, -.25, .5, -.5, .75, -.75, 1.0, -1.0, 1.3, -1.3, 1.6, -1.6]) if (ok(...at(R + dr, a))) { me = at(R + dr, a); break search; }
  if (!me) me = at(r, 0);
  const meA = Math.atan2(me[0] - mx, me[1] - mz), MAX = 1.75;   // (round to the musician's sides, not behind: there they would hide)
  let cur = [meA - .42 / r, meA + .42 / r];   // (left and right of her)
  const out = sizes.map((w, i) => {
    for (let tries = 0; tries < 40; tries++) {
      const side = (i + tries) % 2, half = (w * .5 + .14) / r, a = side ? cur[1] + half : cur[0] - half;
      if (Math.abs(a) > MAX) { if (Math.abs(cur[0]) > MAX && Math.abs(cur[1]) > MAX) { r += 1.15; cur = [meA - .2 / r, meA + .2 / r]; } else if (side) cur[1] = 9; else cur[0] = -9; continue; }
      if (side) cur[1] = a + half; else cur[0] = a - half;
      for (const dr of [0, -.35, .4]) { const p = at(r + dr, a); if (ok(...p)) return p; }
    }
    return at(r + 1.2, 0);
  });
  return { me, seats: out };
}

/** A musician (the guitar on the beach, the harp in the forest, the flute on the meadow, the herald at the castle). Silent
 *  until tapped; a tap and she walks over and sits down in front to listen, and the music goes on and on (a run every
 *  `loop` seconds) until she moves: the stick, a key, a touch anywhere, ✕ (Oscar: "all the musicians should just play
 *  until we move"). Meanwhile the animals of the island (`o.guests()`) come and sit in a part of a circle round the
 *  musician, facing the music (Oscar: "the animals of the area should gather in a (part of a) circle around the
 *  musician"), and go home when it ends; the first time they are all there, a coin. Frames: `o.play` while playing (taking
 *  turns), `o.end` (a bow, a wave) at the end, `o.rest` otherwise; notes float up from `o.from` ([dx, dy] from the card's
 *  middle bottom); `o.sound` makes one run of music; `o.lift` seats them on something */
export function musician(S, name, spec, note, x, z, o) {
  const f = make(S, name, spec, x, z, o.solid ?? .34); if (o.lift) f.lift = o.lift; if (o.face) f.face = o.face; if (o.sink) f.sink = o.sink;
  const notes = [0, 1, 2].map(i => { const n = S.figure(name + 'noot' + i, note); n.g.visible = false; n.act = () => n.setFrame(i % 2); return { n, t: -1, side: 1 }; });
  const from = o.from || [.3, 1.1], loop = o.loop || 4.6, reward = o.reward || (name === 'harpist' ? 'harp' : 'luister-' + name);
  let mode = null, t = 0, plays = 0, next = 0, sent = 0, sit = null, st = 0, again = 0, listens = 0, cheered = false, guests = [], seat = null, uniSeat = null;
  const ok = (px, pz) => { const h = S.heightAt(px, pz); return h !== null && Math.abs(h - (f.y || 0)) < .3 && S.land(px, pz) && S.free(px, pz, h) && Math.hypot(px - f.x, pz - f.z) > 1.0; };   // (on the musician's own level: the flute's hilltop, not below it)
  const gather = () => {   // who comes, and where everybody sits
    guests = (o.guests ? o.guests() : []).filter(c => c && c.f && c.f !== f && !c.f.away && c.f.g.visible).map(c => audience(S, c));
    // the small ones nearest her in the middle, the big ones (the deer, the sheep) at the ends; the ring as wide as they need
    const who = guests.flatMap(a => a.figs.map((q, j) => ({ a, j, w: q.W || .8 }))).sort((p, q) => p.w - q.w);
    const R = o.ring || Math.min(3.0, Math.max(1.9, (who.reduce((n, q) => n + q.w + .28, 0) + .84) / 3.3)), { me, seats } = arc(f.x, f.z, R, who.map(q => q.w), ok);
    seat = me; for (const a of guests) a.seats = []; who.forEach((q, i) => { q.a.seats[q.j] = seats[i]; });
    // her own unicorn: it is big, so it stands at the back, beside and behind the musician, where it hides nobody
    uniSeat = null; const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.1;
    search: for (const r of [1.5, 2.0, 2.6]) for (const a of [2.3, -2.3, 2.7, -2.7, 1.95, -1.95]) { const p = [f.x + Math.sin(a) * r, f.z + Math.cos(a) * r]; if (ok(...p) && !seats.some(q => near(p, q))) { uniSeat = p; break search; } } };
  const listen = { rest: true, look: [0, 0], step(dt, inp) {
    const { girl, sfx } = S; st += dt;
    if (sit === 'on') { const k = Math.min(1, st / .3); girl.x = seat[0]; girl.z = seat[1]; girl.lift = Math.sin(k * Math.PI) * .25; girl.poseName = k > .5 ? 'sit' : null; girl.view = 'side'; girl.face = Math.sign(f.x - seat[0]) || 1;
      if (k >= 1) { sit = 'sit'; st = 0; listens++; cheered = false; sfx.hop(); for (const a of guests) a.invite(a.seats, f.x); mode = 'play'; t = 0; next = .25; again = loop; plays++; o.sound(); } return; }
    if (sit === 'sit') { girl.lift = 0; girl.poseName = 'sit';
      const u = S.uni; if (uniSeat && u && !u.away) { u.busy = true; const dx = uniSeat[0] - u.x, dz = uniSeat[1] - u.z, d = Math.hypot(dx, dz); if (d > .1) { const sp = Math.min(d, 2.6 * dt); if (!S.move(u, dx / d * sp, dz / d * sp)) { u.x += dx / d * sp; u.z += dz / d * sp; } u.walking = true; u.face = Math.sign(dx) || u.face; } else { u.walking = false; u.face = Math.sign(f.x - u.x) || u.face; } }   // (stopPlay lets it go again)
      if (!cheered && guests.length && guests.every(a => a.there())) { cheered = true; S.coins.reward(reward, f.x, (f.y || 0) + 1.6, f.z); S.confetti(f.x, (f.y || 0) + 1.4, f.z, ['#f4a6c4', '#f8dde4', '#f2c65c'], 10, undefined, 2); }   // everybody is here
      if (st > .4 && (inp.act || inp.x || inp.y)) { sit = 'off'; st = 0; for (const a of guests) a.leave(); mode = 'end'; t = 0; f.hopV = 1.2; } return; }   // she moves: the music ends
    const k = Math.min(1, st / .28); girl.lift = Math.sin(k * Math.PI) * .2; girl.poseName = null; if (k >= 1) { girl.lift = 0; sit = null; S.stopPlay(); }
  } };
  f.onTap = () => {
    if (S.playing() || sit || mode === 'play') return; gather(); listen.look = [f.x, (f.z + seat[1]) / 2];
    S.walkThen(seat[0], seat[1], () => { if (S.playing() || sit) return; sit = 'on'; st = 0; S.play(listen); }, .8); };
  f.act = tick => f.setFrame(mode === 'play' ? o.play[Math.floor(tick / 3) % o.play.length] : mode === 'end' ? o.end : o.rest);
  return { f, state: () => ({ frame: f.frame, plays, playing: mode === 'play', notes: notes.filter(q => q.t >= 0).length, sitting: sit === 'sit', listens, guests: guests.filter(a => a.there()).length, invited: guests.reduce((n, a) => n + a.n, 0), seats: guests.flatMap(a => a.seats || []), seat, who: guests.flatMap(a => a.figs.map(q => [q.name, +q.x.toFixed(1), +q.z.toFixed(1)])) }), step({ dt }) {
    for (const q of notes) if (q.t >= 0) { q.t += dt; const k = q.t / 1.9; q.n.x = f.x + f.face * from[0] + q.side * k * .5 + Math.sin(q.t * 3) * .08; q.n.z = f.z + .06; q.n.floatY = q.n.y = (f.y || 0) + (f.lift || 0) + from[1] + k * 1.2; if (k >= 1) { q.t = -1; q.n.g.visible = false; } }
    if (!mode) return; t += dt;
    if (mode === 'play') { next -= dt; if (next <= 0) { next = .95; const q = notes.find(q => q.t < 0); if (q) { q.t = 0; q.side = sent++ % 2 ? 1 : -1; q.n.g.visible = true; } } if (sit === 'sit') { again -= dt; if (again <= 0) { again = loop; plays++; o.sound(); } } else if (sit === null) { mode = 'end'; t = 0; } }
    else if (t > 1.4) mode = null;
  } };
}

/* ---------------- the witch of the forest ---------------- */
/** A kind little witch, stirring a pot (Oscar: "dont make her look too scary ... a story element to be able to progress to
 *  the meadow"). The pot stands at her right (x, z is where she stands).
 *    before the egg is found   she is not there: only her pot, cold and empty (a tap: it wobbles)
 *    the egg behind her        when she first comes near, the witch appears by her pot in a puff of stars and shows at once
 *                              what the potion wants
 *    with the egg, a tap: she shows what the potion still wants, each as a card above the pot: a flower, an
 *                              apple, and water from the watering can. A tap on her (or on the pot) with one of them in
 *                              her hands puts it in: a puff, and the brew changes colour
 *    all three in              she stirs hard, the pot boils over in stars, and the potion flies up: it is hers (S.gear.potion)
 *  The potion makes the brambles on the bridge to the meadow bloom (props.js bramble, set-dorp.js). */
export function witch(S, x, z) {
  const { girl, sfx } = S, f = make(S, 'heks', STORY.heks, x, z, 0), [px, pz] = [x + 1.02, z - .04], [wpx, wpz] = S.at([px, pz]);
  // the pot: round and plum-coloured on three little legs over a paper fire; what is in it shows on top
  const pot = new THREE.Group(); pot.position.set(px, f.y || 0, pz); pot.userData.live = true; S.root.add(pot);   // (live: it wobbles, and its fire goes out)
  const body = new THREE.Mesh(new THREE.SphereGeometry(.46, 16, 10, 0, 6.283, Math.PI * .22, Math.PI * .78), paper('#8a6f9c')); body.position.y = .5; body.castShadow = true; pot.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.37, .05, 6, 18), paper('#6f5a80')); rim.rotation.x = Math.PI / 2; rim.position.y = .84; pot.add(rim);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + .5, l = new THREE.Mesh(new THREE.CylinderGeometry(.04, .03, .2, 5), paper('#6f5a80')); l.position.set(Math.cos(a) * .3, .1, Math.sin(a) * .3); pot.add(l); }
  const fire = new THREE.Group(); fire.userData.live = true; pot.add(fire);   // (the fire burns only while she is there)
  for (const [dx, c, h] of [[-.14, '#f2b56b', .26], [.02, '#f2d86b', .34], [.16, '#e98f8f', .22]]) { const fl = card([[-.09, 0], [-.06, h * .5], [0, h], [.06, h * .5], [.09, 0]], .02, paper(c, { side: THREE.DoubleSide, extra: { emissive: c, emissiveIntensity: .5 } })); fl.position.set(dx, 0, .32); fire.add(fl); }
  const brewM = new THREE.MeshStandardMaterial({ color: '#bfe9c9', emissive: '#bfe9c9', emissiveIntensity: .35, roughness: .5 }), brew = new THREE.Mesh(new THREE.CircleGeometry(.36, 18), brewM); brew.rotation.x = -Math.PI / 2; brew.position.y = .83; brew.userData.live = true; pot.add(brew); S.glue(pot);
  S.solid({ x: px, z: pz, r: .5 });
  const WANT = [['bloem', null], ['appel', THINGS.appel], ['water', THINGS.gieter]], COLS = ['#bfe9c9', '#f6e3a0', '#f8c6d8', '#f4a6c4'], have = { bloem: false, appel: false, water: false };
  // the wish cards: an egg; a flower (a little paper one of its own), an apple, the full can
  const FLOWER = { w: 90, h: 110, frames: 1, size: .32, thing: true, draw: THINGS.bloem ? THINGS.bloem.draw : (g => { g.save(); g.fillStyle = '#6f8f55'; g.fillRect(42, 52, 6, 50); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; g.fillStyle = '#e98f8f'; g.beginPath(); g.arc(45 + Math.cos(a) * 17, 38 + Math.sin(a) * 17, 12, 0, 6.283); g.fill(); } g.fillStyle = '#f2c65c'; g.beginPath(); g.arc(45, 38, 10, 0, 6.283); g.fill(); g.restore(); }) };
  const wishes = { bloem: S.figure('heksbloem', FLOWER), appel: S.figure('heksappel', THINGS.appel), water: S.figure('hekswater', THINGS.gieter) };
  wishes.water.act = () => wishes.water.setFrame(1); for (const w of Object.values(wishes)) { w.g.visible = false; w.thing = true; w.z = wpz + .08; }
  wishes.bloem.g.scale.setScalar(1.5); wishes.appel.g.scale.setScalar(1.4);
  const present = gift(S, 'drankje', STORY.drankje);
  // her second brew, once the unicorn has grown: wings, from three feathers (the owl's, the gull's, the peacock's)
  const featherWish = Object.fromEntries(['uil', 'meeuw', 'papegaai'].map(b => { const w = S.figure('heksveer-' + b, THINGS['veer-' + b]); w.g.visible = false; w.thing = true; w.z = wpz + .08; w.g.scale.setScalar(1.9); return [b, w]; }));
  let wingWish = false, wingsMade = 0;
  let mode = null, t = 0, show = 0, asks = 0, made = false, puff = 0, here = false, jig = 0;
  const egg = () => S.quest.stage !== 'zoek' && S.quest.stage !== 'dream';
  const arrive = () => {   // she comes: a puff of stars by the pot, a hop, and at once she shows what the potion wants
    here = true; S.solid({ x, z, r: .34 }); f.hopV = 2.6; sfx.chime(); S.confetti(f.x, (f.y || 0) + .8, f.z, ['#b9a3e8', '#f2c65c', '#fbf7ee', '#9fd8d0'], 22, S.starGeo, 2.6);
    if (made || S.gear.potion) { mode = 'glad'; t = 0; } else { mode = 'ask'; t = 0; show = 2.8; asks++; }
  };
  const count = () => Object.values(have).filter(Boolean).length;
  const put = kind => { have[kind] = true; puff = 1; f.hopV = 1.6; sfx.splash(); S.confetti(wpx, (f.y || 0) + 1.1, wpz, [COLS[count()], '#fbf7ee'], 14, S.starGeo, 2.2); if (count() === 3) { mode = 'brew'; t = 0; show = 0; } else { mode = 'glad'; t = 0; } };
  f.onGift = kind => { if (!here) return; if (made || mode === 'brew') { mode = 'glad'; t = 0; return; } if (kind in have && !have[kind] && S.quest.stage !== 'zoek' && S.quest.stage !== 'dream') put(kind); else { mode = 'glad'; t = 0; } };
  const tap = () => {
    if (S.playing() || mode === 'brew') return;
    if (!here) { jig = 1; sfx.click(); return; }   // only her cold pot: it wobbles
    const can = S.shared.can;
    if (made || S.gear.potion) {
      if (S.grown() && !S.gear.wings) { if (S.feathers.all()) { mode = 'wings'; t = 0; sfx.splash(); f.hopV = 1.6; } else { mode = 'ask'; t = 0; show = 2.8; wingWish = true; asks++; sfx.hello(); } return; }   // the wings: all three feathers, or she shows the ones still missing
      mode = 'glad'; t = 0; sfx.hello(); return; }
    if (!have.water && can && can.holding()) { if (can.full()) { S.walkThen(wpx - .15, wpz + 1.0, () => { girl.view = 'back'; can.pourThen(() => put('water')); }, 1.3); return; } }
    mode = 'ask'; t = 0; show = 2.8; asks++; sfx.hello();
  };
  f.onTap = tap; S.tap(pot, () => { if (!S.give(f)) tap(); });
  f.act = tick => f.setFrame(mode === 'ask' ? 2 : mode === 'glad' ? 3 : mode === 'brew' || mode === 'wings' ? Math.floor(tick / 2) % 2 : near(f, girl, 5) ? Math.floor(tick / 6) % 2 : 0);
  return { f, state: () => ({ frame: f.frame, mode, asks, have: { ...have }, made, potion: S.gear.potion, wishing: show > 0, here, wingWish, wingsMade }), step({ dt, time }) {
    const y0 = (f.y || 0);
    if (!here && egg() && near(f, girl, 4) && !S.playing()) arrive();
    f.g.visible = here; brew.visible = fire.visible = here;
    if (jig > 0) { jig = Math.max(0, jig - dt * 2.5); pot.rotation.z = Math.sin(jig * 18) * .08 * jig; }
    brewM.color.set(COLS[count()]); brewM.emissive.set(COLS[count()]); brew.position.y = .83 + Math.sin(time * 3) * .012; if (puff > 0) puff = Math.max(0, puff - dt * 2); brew.scale.setScalar(1 + puff * .12);
    if (show > 0) show -= dt;
    const on = show > 0; if (!on) wingWish = false;
    { const missing = ['uil', 'meeuw', 'papegaai'].filter(b => !S.feathers.have().includes(b)); Object.entries(featherWish).forEach(([b, w]) => { const i = missing.indexOf(b); w.g.visible = on && wingWish && i >= 0; if (w.g.visible) { w.x = wpx + (i - (missing.length - 1) / 2) * .62; w.floatY = w.y = y0 + 1.45 + Math.sin(time * 3 + i) * .05; } }); }
    const missing = Object.keys(wishes).filter(k => !have[k]); Object.entries(wishes).forEach(([k, w]) => { const i = missing.indexOf(k); w.g.visible = on && here && !made && !S.gear.potion && !wingWish && i >= 0; if (w.g.visible) { w.x = wpx + (i - (missing.length - 1) / 2) * .72; w.floatY = w.y = y0 + 1.5 + Math.sin(time * 3 + i) * .04; } });
    if (!mode) return; t += dt;
    if (mode === 'brew') { if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) S.confetti(wpx, y0 + 1.0, wpz, COLS, 3, S.starGeo, 1.8); if (t > 2.0 && !S.playing()) { made = true; mode = 'glad'; t = 0; sfx.chime(); present([wpx, y0 + 1.0, wpz], () => { S.gear.potion = true; S.coins.reward('drankje', f.x, y0 + 1.4, f.z); }); } }
    else if (mode === 'wings') { if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) S.confetti(wpx, y0 + 1.0, wpz, ['#fbf7ee', '#e2d8f4', '#bba6ea', '#f2c65c'], 3, S.starGeo, 1.8); if (t > 2.0) { mode = 'glad'; t = 0; wingsMade++; sfx.chime(); S.giveWings(); } }   // the feathers in the pot, a boil of stars, and the unicorn has wings
    else if (t > (mode === 'ask' ? 2.8 : 1.6)) mode = null;
  } };
}
