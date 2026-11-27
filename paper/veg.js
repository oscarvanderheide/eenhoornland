// The farm's vegetables, cut from paper like everything else (Oscar: "in the farm there should be more varaity than just
// carrots. and it should be paper style vegetables"). Four kinds, a row each: carrots, tomatoes, cabbages, pumpkins.
// Each is drawn twice: as it grows in the bed (`ground`: the soil line at the bottom of the card) and on its own, pulled
// out and held (`held`: a card she carries, gives to somebody, or drops for the pig).
import { E, S, C, U, P, piece, ink, line } from './cut.js';

const GR = '#7FB069', GR2 = '#5F9450', GR3 = '#9BC47D';
const leaf = (g, x, y, rot, l, col, w = 10) => { g.save(); g.translate(x, y); g.rotate(rot); piece(g, col, S([[-w * .5, 2], [-w, -l * .5], [-2, -l], [2, -l], [w, -l * .5], [w * .5, 2]])); g.restore(); };

/* carrots: a fan of feathery leaves, and the orange shoulder showing above the soil */
function carrotGround(g) {
  leaf(g, 60, 92, -.5, 46, GR2); leaf(g, 60, 92, .45, 44, GR2); leaf(g, 60, 92, -.12, 54, GR); leaf(g, 60, 92, .2, 50, GR3, 8);
  piece(g, '#E2803E', U(E(60, 104, 19, 15)));
  line(g, '#C96A2E', 2, [[50, 100], [56, 103]]); line(g, '#C96A2E', 2, [[64, 106], [70, 104]]);
}
function carrotHeld(g) {
  const o = '#E2803E', o2 = '#C96A2E';
  leaf(g, 74, 46, -.25, 34, GR2); leaf(g, 74, 46, 1.3, 32, GR2); leaf(g, 74, 46, .5, 38, GR);
  piece(g, o, C(66, 56, 25, 103, 16, 4));
  for (const [x, y, l] of [[60, 52, 9], [47, 64, 8], [44, 78, 6], [33, 86, 5]]) line(g, o2, 2, [[x, y], [x + l, y + l * .8]]);
}
/* tomatoes: a little plant tied to a stick, three red tomatoes hanging from it */
function tomatoGround(g) {
  piece(g, '#B98F5C', P([[57, 20], [63, 20], [63, 150], [57, 150]]), .4);
  line(g, '#5F9450', 4, [[60, 150], [58, 110], [62, 70], [60, 34]]);
  for (const [x, y, r, s] of [[60, 120, .9, 1], [61, 96, -.8, 1], [60, 74, .8, .9], [61, 54, -.7, .8], [60, 38, .4, .7]]) leaf(g, x, y, r, 30 * s, r > 0 ? GR : GR2, 9);
  for (const [x, y, r] of [[42, 104, 11], [80, 84, 12], [44, 64, 10]]) { piece(g, '#E8505B', E(x, y, r, r * .92), .8); ink(g, '#F48A8F', E(x - r * .35, y - r * .35, r * .3, r * .22)); piece(g, GR2, P([[x - 6, y - r + 2], [x, y - r - 4], [x + 6, y - r + 2], [x + 2, y - r + 4], [x - 2, y - r + 4]]), .3); }
  line(g, '#B98F5C', 2.5, [[54, 76], [66, 80]]); line(g, '#B98F5C', 2.5, [[54, 112], [66, 116]]);
}
function tomatoHeld(g) {
  piece(g, '#E8505B', E(50, 58, 30, 27));
  ink(g, '#C93C48', S([[50, 34], [54, 58], [50, 84], [46, 58]]));
  ink(g, '#F48A8F', E(38, 46, 8, 6));
  piece(g, GR2, P([[36, 34], [44, 30], [50, 22], [56, 30], [64, 34], [56, 37], [50, 34], [44, 37]]), .4);
  line(g, GR2, 4, [[50, 30], [52, 18]]);
}
/* cabbages: a round head of leaves, the outer leaves curling open */
function cabbageGround(g) {
  for (const [x, y, rot] of [[30, 106, -1.2], [90, 106, 1.2], [44, 96, -.6], [76, 96, .6]]) leaf(g, x, y, rot, 34, GR2, 16);
  piece(g, GR3, E(60, 90, 30, 26));
  ink(g, '#B8D89E', E(60, 86, 18, 15));
  for (const a of [-.9, -.3, .3, .9]) line(g, '#7FB069', 2, [[60, 112], [60 + Math.sin(a) * 26, 90 - Math.cos(a) * 20]]);
  piece(g, GR, S([[30, 90], [40, 72], [58, 66], [52, 84], [40, 100]]), .5); piece(g, GR, S([[90, 90], [80, 72], [62, 66], [68, 84], [80, 100]]), .5);
}
function cabbageHeld(g) {
  piece(g, GR2, U(E(30, 62, 18, 24, -.5), E(70, 62, 18, 24, .5)));
  piece(g, GR3, E(50, 58, 28, 26));
  ink(g, '#B8D89E', E(50, 54, 17, 14));
  for (const a of [-.9, -.3, .3, .9]) line(g, '#7FB069', 2, [[50, 82], [50 + Math.sin(a) * 24, 58 - Math.cos(a) * 20]]);
  piece(g, GR, S([[22, 58], [32, 40], [48, 34], [42, 52], [30, 68]]), .5); piece(g, GR, S([[78, 58], [68, 40], [52, 34], [58, 52], [70, 68]]), .5);
}
/* pumpkins: fat and ribbed, a curly stalk, a big leaf beside it on the vine */
function pumpkinGround(g) {
  line(g, GR2, 3, [[8, 110], [24, 104], [36, 108]]);
  leaf(g, 24, 104, -1.1, 34, GR, 18);
  pumpkin(g, 66, 92, 1);
}
function pumpkin(g, x, y, k) {
  piece(g, '#E8893A', U(E(x - 18 * k, y, 20 * k, 20 * k), E(x + 18 * k, y, 20 * k, 20 * k), E(x, y - 1 * k, 22 * k, 22 * k)));
  ink(g, '#F2A65A', E(x, y - 2 * k, 10 * k, 19 * k));
  for (const dx of [-14, 14]) line(g, '#C96A2E', 2, [[x + dx * k, y - 18 * k], [x + dx * 1.15 * k, y], [x + dx * k, y + 18 * k]]);
  piece(g, '#7A5A3E', C(x, y - 20 * k, x + 4 * k, y - 32 * k, 4 * k, 3 * k), .4);
  line(g, GR2, 2, [[x + 4 * k, y - 30 * k], [x + 12 * k, y - 36 * k], [x + 16 * k, y - 30 * k], [x + 12 * k, y - 26 * k]]);
}
function pumpkinHeld(g) { pumpkin(g, 50, 62, 1.1); }

/** kind -> { ground: card spec for the bed, held: the card she carries } (names in Dutch, as the rest) */
export const VEG = {
  wortel: { ground: { w: 120, h: 120, draw: carrotGround, size: .7 }, held: { w: 120, h: 120, draw: carrotHeld, frames: 1, size: .4 } },
  tomaat: { ground: { w: 120, h: 160, draw: tomatoGround, size: .8 }, held: { w: 100, h: 100, draw: tomatoHeld, frames: 1, size: .26 } },
  kool: { ground: { w: 120, h: 120, draw: cabbageGround, size: .72 }, held: { w: 100, h: 100, draw: cabbageHeld, frames: 1, size: .34 } },
  pompoen: { ground: { w: 120, h: 120, draw: pumpkinGround, size: .78 }, held: { w: 100, h: 100, draw: pumpkinHeld, frames: 1, size: .38 } },
};
export const ROWS = ['wortel', 'tomaat', 'kool', 'pompoen'];
