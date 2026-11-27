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
import { PEOPLE, PROPS } from './people.js';

const near = (f, girl, r) => Math.hypot(f.x - girl.x, f.z - girl.z) < r;
const make = (S, name, spec, x, z, r = .34) => { const f = S.figure(name, spec), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; if (r) S.solid({ x, z, r }); return f; };
const WATER = ['#8fd0e0', '#f6efe2', '#7fbcc0'];

/** grandma, on the right half of a bench (x, z: the bench's middle; `bench`: what props.js bench gave, so she knows when she has company) */
export function grandma(S, x, z, bench) {
  const { girl, sfx } = S, f = make(S, 'oma', PEOPLE.oma, x + .3, z + .08, 0); f.lift = .13; f.face = -1; let wave = 0, sat = false, waves = 0;
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
  S.offer(who => { if (!held) return false; down(); S.hands.free(me); given++; who.hopV = 2.6; sfx.munch(); S.confetti(who.x, (who.y || 0) + .6, who.z, ['#e8c58f', '#d9a066', '#f6efe2'], 8, undefined, 1.6); if (who === f) { mode = 'laugh'; t = 0; } return true; });
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

/** Any other musician (the guitar on the beach, the harp in the forest, the flute on the meadow, the herald at the castle):
 *  silent until tapped; then they play for a few seconds (frames `o.play`, taking turns), notes float up from `o.from`
 *  ([dx, dy] from the card's middle bottom), and they end with frame `o.end` (a bow, a wave). At rest: frame `o.rest`.
 *  `o.sound` makes the music (one of the stage's soft instruments); `o.lift` seats them on something. */
export function musician(S, name, spec, note, x, z, o) {
  const f = make(S, name, spec, x, z, o.solid ?? .34); if (o.lift) f.lift = o.lift; if (o.face) f.face = o.face;
  const notes = [0, 1, 2].map(i => { const n = S.figure(name + 'noot' + i, note); n.g.visible = false; n.act = () => n.setFrame(i % 2); return { n, t: -1, side: 1 }; });
  const from = o.from || [.3, 1.1], long = o.long || 4.8; let mode = null, t = 0, plays = 0, next = 0, sent = 0;
  f.onTap = () => { if (mode) return; mode = 'play'; t = 0; next = .25; plays++; o.sound(); };
  f.act = tick => f.setFrame(mode === 'play' ? o.play[Math.floor(tick / 3) % o.play.length] : mode === 'end' ? o.end : o.rest);
  return { f, state: () => ({ frame: f.frame, plays, playing: mode === 'play', notes: notes.filter(q => q.t >= 0).length }), step({ dt }) {
    for (const q of notes) if (q.t >= 0) { q.t += dt; const k = q.t / 1.9; q.n.x = f.x + f.face * from[0] + q.side * k * .5 + Math.sin(q.t * 3) * .08; q.n.z = f.z + .06; q.n.floatY = q.n.y = (f.y || 0) + (f.lift || 0) + from[1] + k * 1.2; if (k >= 1) { q.t = -1; q.n.g.visible = false; } }
    if (!mode) return; t += dt;
    if (mode === 'play') { next -= dt; if (next <= 0) { next = .95; const q = notes.find(q => q.t < 0); if (q) { q.t = 0; q.side = sent++ % 2 ? 1 : -1; q.n.g.visible = true; } } if (t > long) { mode = 'end'; t = 0; f.hopV = 1.2; } }
    else if (t > 1.4) mode = null;
  } };
}
