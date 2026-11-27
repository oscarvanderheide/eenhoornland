// The thread of the adventure: what belongs to the story and not to one island.
//   EGG      the unicorn's egg, a card: 0 whole, 1 cracked, 2 open with a horn and two ears peeping out, 3 the empty shell
//   dream    the dream the sisters share at the very start: a cloud above their beds in which the egg wobbles, cracks
//            and opens. Then it is morning, and the egg is somewhere to be found (the cave in the forest: set-hol.js)
// The stage keeps where the story stands (S.quest.stage: 'dream', 'zoek' = looking for the egg, 'baby' = the unicorn is
// with her). A start by a direct link (?set=...) is at 'baby', so every island can be looked at with the unicorn there.
import { THREE, paper, card, circlePts } from './kit.js';
import { FIGS } from './figures.js';
import { P, C, piece, ink, line } from './cut.js';

const OVAL = (cx, cy, rx, ry, n = 26, top = 1) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, s = Math.sin(a); p.push([cx + Math.cos(a) * rx * (s < 0 ? .86 + .14 * (1 + s) : 1), cy + s * ry * (s < 0 ? top : 1)]); } return p; };
const ZIG = [[30, 78], [42, 70], [52, 80], [62, 68], [72, 80], [82, 70], [92, 78]];
export const EGG = { w: 124, h: 150, frames: 4, size: .56, thing: true, draw(g, f) {
  const shell = '#fbf5ea', spot = ['#f4a6c4', '#bba6ea', '#9ed9cf', '#f2c65c'];
  const spots = () => [[44, 62, 7], [78, 58, 6], [62, 96, 8], [86, 100, 6], [40, 104, 5]].forEach(([x, y, r], i) => ink(g, spot[i % 4], P(OVAL(x, y, r, r, 12))));
  if (f < 2) { piece(g, shell, P(OVAL(62, 84, 40, 52, 30, 1.12))); spots(); if (f === 1) line(g, '#8d6a48', 2.6, ZIG); return; }
  // the lower half of the shell, its edge broken in points
  const low = [[22, 92], ...ZIG.map(([x, y]) => [x, y + 16]), [102, 92], [100, 110], [90, 128], [62, 138], [34, 128], [24, 110]];
  if (f === 2) {
    piece(g, '#f6efe2', P(OVAL(62, 74, 26, 24, 18)));                                               // a little white head
    piece(g, '#f2c65c', P([[56, 54], [62, 22], [68, 54]]), .5);                                     // the horn
    piece(g, '#f6efe2', P([[38, 60], [42, 42], [52, 58]]), .5); piece(g, '#f6efe2', P([[86, 60], [82, 42], [72, 58]]), .5);
    piece(g, '#f4a6c4', P(OVAL(50, 52, 8, 6, 10)), .4);                                             // a tuft of mane
    ink(g, '#43363a', P(OVAL(52, 76, 3.4, 3.4, 10))); ink(g, '#43363a', P(OVAL(72, 76, 3.4, 3.4, 10))); ink(g, '#f4a6c4', P(OVAL(46, 84, 5, 3.4, 10))); ink(g, '#f4a6c4', P(OVAL(78, 84, 5, 3.4, 10)));
  }
  piece(g, shell, P(low)); [[44, 112, 6], [78, 116, 7], [62, 126, 5]].forEach(([x, y, r], i) => ink(g, spot[i % 4], P(OVAL(x, y, r, r, 12))));
} };

/** The dream: built in the bedroom (set-huis.js). `at`: [x, y, z] in the set's measure, where the cloud hangs. Gives back
 *  { start(done), step(dt), on() }. All cut paper (Oscar: "the dream should have paper egg/unicorn not 3d"): a cloud cut
 *  from pale card with two little puffs leading down to the sleepers; on it the egg's own card wobbles, cracks and opens,
 *  and the baby unicorn's own card hops out. Then the cloud folds away and `done` is called. */
export function dream(S, at) {
  const g = new THREE.Group(); g.position.set(...at); g.visible = false; g.userData.live = true; S.root.add(g);
  const lit = c => paper(c, { extra: { emissive: c, emissiveIntensity: .55 } });
  // a soft cloud like Oscar's picture: big round bumps all the way round, three on top, one each side, three underneath
  const PUFFS = [[0, .3, .52], [-.6, .2, .46], [.6, .2, .46], [-1.08, -.02, .42], [1.08, -.02, .42], [-.58, -.3, .44], [0, -.36, .46], [.58, -.3, .44], [0, 0, .6]];
  const cloud = () => { const p = []; for (let i = 0; i < 90; i++) { const a = i / 90 * 6.283, dx = Math.cos(a), dy = Math.sin(a); let r = 0;
    for (const [cx, cy, cr] of PUFFS) { const b = dx * cx + dy * cy, c = cx * cx + cy * cy - cr * cr, d = b * b - c; if (d >= 0) r = Math.max(r, b + Math.sqrt(d)); }
    p.push([dx * r, dy * r]); } return p; };
  { const back = card(cloud().map(([x, y]) => [x * 1.05, y * 1.1]), .03, lit('#fbf7ee')); back.position.set(0, -.1, -.05); g.add(back); const front = card(cloud(), .03, lit('#bfcdf0')); front.position.set(0, -.1, -.02); g.add(front); }
  // little puffs down to each sleeper: they share it
  // (they step down towards the sleepers' heads and stop above them, clear of the beds)
  for (const [x, y, r] of [[-1.42, -.62, .13], [-1.72, -.76, .09], [-1.95, -.86, .06], [1.42, -.62, .13], [1.72, -.76, .09], [1.95, -.86, .06]]) { const b = card(circlePts(r + .025, 3, 16), .03, lit('#fbf7ee')); b.position.set(x, y, -.05); g.add(b); const f = card(circlePts(r, 3, 16), .03, lit('#bfcdf0')); f.position.set(x, y, -.02); g.add(f); }
  const egg = S.figure('droomei', EGG), baby = S.figure('droomeenhoorn', FIGS.baby), [wx, wz] = S.at([at[0], at[2]]);
  for (const f of [egg, baby]) { f.g.visible = false; f.z = wz + .08; f.thing = true; } egg.g.scale.setScalar(1.7); baby.g.scale.setScalar(.72);
  const glow = f => { if (f.mat.emissiveMap !== f.mat.map) { f.mat.emissiveMap = f.mat.map; f.mat.emissive.set('#ffffff'); f.mat.emissiveIntensity = .5; f.mat.needsUpdate = true; } };
  const dark = f => { f.mat.emissive.set('#000000'); f.mat.emissiveMap = null; f.mat.emissiveIntensity = 1; f.mat.needsUpdate = true; };
  let t = -1, done = null, popped = false, frame = 0;
  egg.act = tick => { egg.setFrame(frame); if (t >= 0) glow(egg); egg.tilt = frame < 2 && t > 1 ? Math.sin(tick * (frame ? 1.5 : .9)) * (frame ? .2 : .12) : 0; };
  baby.act = () => { baby.setFrame(0); if (t >= 0) glow(baby); };
  return { on: () => t >= 0, start(fn) { t = 0; done = fn; popped = false; frame = 0; g.visible = true; g.scale.setScalar(.01); },
    step(dt) {
      if (t < 0) return; t += dt > 0 ? Math.min(dt, .05) : 0;
      const k = t < .9 ? t / .9 : t > 8.2 ? Math.max(0, 1 - (t - 8.2) / .7) : 1; g.scale.setScalar(Math.max(.01, k * (1 + Math.sin(t * 1.3) * .015)));
      // the egg wobbles, cracks, and then (Oscar: "just let the egg hatch and then some confetti and then the egg dissapears and the baby unicorn appears") a burst of confetti: the egg is gone and the baby is there
      frame = t < 3 ? 0 : 1;
      egg.g.visible = k > .6 && !popped; egg.x = wx; egg.floatY = egg.y = at[1] - .56;
      if (t > 4.6 && !popped) { popped = true; baby.hopV = 2.6; S.sfx.hello(); S.confetti(wx, at[1] - .2, wz + .1, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a', '#fbf5ea'], 26, S.starGeo, 2.4); }
      baby.g.visible = popped && k > .6; baby.x = wx; baby.floatY = baby.y = at[1] - .5; if (popped && t > 5.6 && !(baby.hop > 0) && Math.floor(t * 1.2) % 2 === 0) baby.hopV = 1.4;
      if (t > 8.9) { t = -1; g.visible = egg.g.visible = baby.g.visible = false; dark(egg); dark(baby); if (done) done(); }
    } };
}
