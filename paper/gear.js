// Her tools: things of the adventure that are hers for good once she has them (the stage keeps which: S.gear).
//   snorkel   flippers and a snorkel. With them, light water (a pond, the pool under the waterfall) can be walked into,
//             and she swims: up to her shoulders in it, the mask on, slower. The dark sea stays shut
//   hook      the hookshot: a hook on a chain. A tap on a post across a gap, and it pulls her over
// A tool is given in a moment of its own (give): it flies up from where it was, she holds it over her head, stars.
// The cards are drawn here; the stage wears the mask on her (paper.js), the sets say where each tool is found and used.
import { P, C, piece, ink, line } from './cut.js';

export const SNORKEL = { w: 120, h: 150, frames: 1, size: .5, thing: true, draw(g) {
  piece(g, '#f2b56b', C(92, 100, 92, 34, 6.5)); piece(g, '#f2b56b', C(92, 100, 74, 108, 6)); piece(g, '#e98f8f', C(92, 34, 92, 22, 8.5), .5);            // the tube, its bend to her mouth, its red top
  piece(g, '#5f9fae', P([[16, 62], [26, 52], [74, 52], [84, 62], [84, 84], [74, 94], [26, 94], [16, 84]]));                                              // the mask
  piece(g, '#cfeaf0', P([[24, 64], [30, 59], [70, 59], [76, 64], [76, 82], [70, 87], [30, 87], [24, 82]]), .4);
  ink(g, '#ffffff', P([[30, 64], [44, 62], [36, 72]]));
} };
export const FLIPPERS = { w: 150, h: 90, frames: 1, size: .26, thing: true, draw(g) {
  for (const [x, c] of [[40, '#9ed9cf'], [104, '#7fbcc0']]) { piece(g, c, P([[x - 8, 14], [x + 8, 14], [x + 26, 70], [x + 10, 78], [x, 70], [x - 10, 78], [x - 26, 70]])); line(g, '#5f9fae', 2.4, [[x, 28], [x, 66]]); }
} };
export const HOOK = { w: 170, h: 120, frames: 1, size: .42, thing: true, draw(g) {
  piece(g, '#b98a5a', C(28, 92, 78, 60, 9, 8)); piece(g, '#8d6a48', C(20, 98, 34, 88, 10), .5);                                                           // the grip
  piece(g, '#cbc5d6', C(78, 60, 112, 40, 6)); piece(g, '#bdb6c9', P([[104, 22], [150, 18], [142, 30], [156, 44], [134, 46], [128, 62], [112, 50]]));       // the shaft and the hook's head
  for (const [x, y] of [[52, 96], [66, 102], [80, 98]]) piece(g, '#d9d2c4', C(x, y, x + .1, y, 6), .4);                                                    // a few links of its chain
} };

/** The moment a tool becomes hers. Made while the set is built (a card cannot be made later): gift(S, name, spec) gives
 *  back give(from, done). `from`: [x, y, z] in the world, where it comes up from. It flies up and over to her, she holds
 *  it over her head, stars; `done` when it is over. She is busy meanwhile (a toy of its own). */
export function gift(S, name, spec) {
  const { girl, sfx } = S, f = S.figure(name, spec); f.g.visible = false;
  return (from, done) => {
    let t = 0, rang = false; f.g.visible = true; f.x = from[0]; f.z = from[2]; f.floatY = f.y = from[1];
    const toy = { look: [girl.x, girl.z], step(dt) {
      t += dt; const top = S.head(), k = Math.min(1, t / .9), e = k * k * (3 - 2 * k);
      f.x = from[0] + (top.x - from[0]) * e; f.z = from[2] + (top.z + .05 - from[2]) * e; f.floatY = f.y = from[1] + (top.y + .14 - from[1]) * e + Math.sin(k * Math.PI) * 1.1;
      girl.view = 'front'; girl.poseName = k > .7 ? 'up' : null;
      if (!rang && k >= 1) { rang = true; sfx.chime(); S.confetti(top.x, top.y + .5, top.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 22, S.starGeo, 2.8); }
      if (t > 2.7) { f.g.visible = false; girl.poseName = null; S.stopPlay(); if (done) done(); }
    } };
    S.play(toy);
  };
}
