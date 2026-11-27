// Who lives on the rainbow island besides the flamingos, the parrot and the rabbit (Oscar: "candy island ... is missing
// animals and people. it feels not alive as a result"):
//   the candy floss lady   at her cart: a tap and she spins her a candy floss (beach2.js vendor)
//   the alpacas            two fluffy alpacas strolling about their corner. A tap: a happy hop and a hum, and it trots after her a little way
//   the monkey             sitting on top of a giant lollipop. A tap: it claps; again: it hangs by one arm and swings; again: it waves
//   the children           two children of the island playing tag round and round. When she comes near they cheer; a tap and they jump
import { CARDS3 } from './cards3.js';
import { vendor } from './beach2.js';

export const candyFloss = (S, x, z) => vendor(S, 'suikerspin', 'spin', x, z, { rest: 0, make: 0, give: 1, wave: 2 });

/** an alpaca wandering between `spots` (the set's measure) */
export function alpaca(S, spots, name = 'alpaca') {
  const { girl, sfx } = S, P = spots.map(p => S.at(p)), f = S.figure(name, CARDS3.alpaca); [f.x, f.z] = P[0]; f.face = 1;
  let at = 0, wait = 1 + Math.random() * 2, happy = 0, follow = 0, hums = 0;
  f.onTap = () => { happy = 1.2; follow = 5; hums++; f.hopV = 2.8; sfx.peep(); setTimeout(() => sfx.peep(), 200); S.confetti(f.x, (f.y || 0) + 1.2, f.z, ['#f4a6c4', '#f8dde4', '#bba6ea'], 8, undefined, 1.8); };
  f.act = tick => f.setFrame(happy > 0 ? 3 : f.walking ? 1 + (Math.floor(tick / 4) % 2) : 0);
  return { f, state: () => ({ hums, following: follow > 0, at: [f.x, f.z] }), step({ dt }) {
    happy = Math.max(0, happy - dt); follow = Math.max(0, follow - dt);
    const [tx, tz] = follow > 0 ? [girl.x - girl.face * 1.3, girl.z + .3] : P[at], dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
    if (happy > 0 || d < (follow > 0 ? .8 : .1)) { f.walking = false; if (follow <= 0 && (wait -= dt) < 0) { at = (at + 1) % P.length; wait = 2 + Math.random() * 3; } return; }
    const v = (follow > 0 ? 2.2 : .7) * dt; f.walking = S.move(f, dx / d * Math.min(d, v), dz / d * Math.min(d, v)); if (Math.abs(dx) > .05) f.face = Math.sign(dx);
    if (!f.walking && follow <= 0) at = (at + 1) % P.length;
  } };
}

/** the monkey on top of something `y` high */
export function monkey(S, x, z, y) {
  const { sfx } = S, f = S.figure('aapje', CARDS3.aapje), [wx, wz] = S.at([x, z]); f.x = wx; f.z = wz; f.floatY = f.y = y; f.face = -1;
  let mode = null, t = 0, n = 0, tricks = 0;
  f.onTap = () => { if (mode && t < .4) return; mode = ['clap', 'hang', 'wave'][n++ % 3]; t = 0; tricks++; f.hopV = mode === 'hang' ? 0 : 1.6; if (mode === 'clap') { sfx.click(); setTimeout(() => sfx.click(), 180); } else if (mode === 'hang') sfx.whoosh(); else sfx.squawk(); };
  f.act = () => f.setFrame(mode === 'clap' ? (Math.floor(t / .18) % 2 ? 0 : 1) : mode === 'hang' ? 2 : mode === 'wave' ? 3 : 0);
  return { f, state: () => ({ mode, tricks, frame: f.frame }), step({ dt }) {
    if (!mode) { f.lean = 0; f.floatY = f.y = y; return; } t += dt;
    if (mode === 'hang') { f.lean = Math.sin(t * 5) * .35; f.floatY = f.y = y - .55; } else { f.lean = 0; f.floatY = f.y = y; }
    if (t > (mode === 'hang' ? 2.4 : 1.6)) mode = null;
  } };
}

/** two children playing tag round an oval about (`cx`, `cz`) */
export function children(S, cx, cz, rx = 2.2, rz = 1.3) {
  const { girl, sfx } = S, [ox, oz] = S.at([cx, cz]), kids = [0, 1].map(i => { const f = S.figure('kind' + (i ? '2' : ''), CARDS3.kind); if (i) f.g.scale.setScalar(.9); return { f, a: i * 2.6, jump: 0 }; });
  let cheers = 0, near = false;
  const cheer = () => { cheers++; sfx.hello(); for (const k of kids) { k.jump = 1.2; k.f.hopV = 3; } S.confetti(ox, 1.4, oz, ['#f4a6c4', '#f2c65c', '#9ed9cf', '#bba6ea'], 14, S.starGeo, 2.2); };
  for (const k of kids) { k.f.onTap = cheer; k.f.act = tick => k.f.setFrame(k.jump > 0 ? 3 : 1 + (Math.floor(tick / 3) % 2)); }
  return { kids: kids.map(k => k.f), state: () => ({ cheers, at: kids.map(k => [k.f.x, k.f.z]) }), step({ dt }) {
    const close = Math.hypot(girl.x - ox, girl.z - oz) < rx + 2; if (close && !near) cheer(); near = close;
    for (const k of kids) { k.jump = Math.max(0, k.jump - dt); if (k.jump > 0) continue;
      k.a += dt * .9; const x = ox + Math.cos(k.a) * rx, z = oz + Math.sin(k.a) * rz; k.f.face = -Math.sin(k.a) >= 0 ? 1 : -1; k.f.x = x; k.f.z = z; k.f.walking = true; }
  } };
}
