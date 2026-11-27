// The figures of the paper world in a simple cut-paper style: few, clean shapes glued onto a white backing card,
// each piece casting a small shadow on the one below. All face right (the world flips them).
// The sisters live in kids.js (poses and things to wear), the shapes and the backing card in cut.js.
import { E, S, C, U, piece, ink, line, eye, swing, WALK } from './cut.js';
import { kidDraw } from './kids.js';
export { rng, paperCanvas, cutout, WALK } from './cut.js';
export * from './kids.js';

/* ---------- the unicorns ---------- */
const UNI = { body: '#FCF8F1', shade: '#E6DCEA', pink: '#F4A6C4', lilac: '#BBA6EA', mint: '#9ED9CF', horn: '#EBC35E', horn2: '#C9993A', hoof: '#C9A9DE', hoof2: '#AE8CC8', muzzle: '#F8DDE4' };
/** the baby: round and chubby, no neck, a little horn */
export function drawBaby(g, f) {
  const s = swing(f), u = UNI;
  piece(g, u.shade, C(82, 150, 84 - s * 6, 176, 10.5)); piece(g, u.hoof2, E(86 - s * 6, 182, 12, 7));
  piece(g, u.shade, C(138, 150, 140 + s * 6, 176, 10.5)); piece(g, u.hoof2, E(142 + s * 6, 182, 12, 7));
  // a curly tail
  piece(g, u.pink, E(40, 118, 17, 11, -.7)); piece(g, u.lilac, E(32, 134, 15, 10, -.2)); piece(g, u.mint, E(38, 150, 12, 8, .5));
  piece(g, u.body, E(98, 136, 58, 38));
  piece(g, u.body, C(70, 150, 66 - s * 6, 180, 12)); piece(g, u.hoof, E(68 - s * 6, 186, 13.5, 7.5));
  piece(g, u.body, C(124, 152, 126 + s * 6, 180, 12)); piece(g, u.hoof, E(128 + s * 6, 186, 13.5, 7.5));
  // head and muzzle in one piece, then the pink nose on top
  piece(g, u.body, U(E(160, 92, 40, 38), E(184, 108, 26, 22)));
  piece(g, u.muzzle, E(192, 112, 18, 14), .5);
  ink(g, '#D99AAE', E(200, 108, 2.6, 2));
  // ear, mane tufts, horn
  piece(g, u.body, S([[138, 66], [144, 30], [162, 60]])); ink(g, u.pink, S([[144, 62], [146, 40], [156, 60]]));
  piece(g, u.lilac, E(128, 80, 16, 12, -1.1), .7); piece(g, u.mint, E(124, 100, 13, 10, -1.4), .7);
  piece(g, u.pink, E(140, 64, 19, 12, -.5), .7); piece(g, u.pink, E(166, 58, 14, 9, .3), .7);
  piece(g, u.horn, S([[160, 56], [178, 22], [178, 22], [176, 58]]), .8);
  line(g, u.horn2, 2, [[164, 46], [176, 44]]); line(g, u.horn2, 2, [[168, 36], [177, 34]]);
  eye(g, 174, 90, 5.6); ink(g, 'rgba(240,120,150,.4)', E(172, 108, 8, 5.5));
}
/** the baby walking towards us: round chest, big face, two front legs stepping */
export function drawBabyFront(g, f) {
  const s = swing(f), u = UNI, cx = 110, l1 = Math.max(0, s) * 8, l2 = Math.max(0, -s) * 8;
  piece(g, u.pink, E(cx + 50, 128, 12, 9, .5)); piece(g, u.lilac, E(cx + 54, 140, 9, 7, .2));   // the tail peeks out behind
  piece(g, u.shade, C(cx - 26, 150, cx - 26, 174 - l2, 9.5)); piece(g, u.hoof2, E(cx - 26, 180 - l2, 10, 6));
  piece(g, u.shade, C(cx + 26, 150, cx + 26, 174 - l1, 9.5)); piece(g, u.hoof2, E(cx + 26, 180 - l1, 10, 6));
  piece(g, u.body, E(cx, 140, 44, 36));
  piece(g, u.body, C(cx - 16, 156, cx - 16, 182 - l1, 11.5)); piece(g, u.hoof, E(cx - 16, 188 - l1, 12.5, 7));
  piece(g, u.body, C(cx + 16, 156, cx + 16, 182 - l2, 11.5)); piece(g, u.hoof, E(cx + 16, 188 - l2, 12.5, 7));
  // ears, the head, the muzzle
  piece(g, u.body, S([[cx - 36, 70], [cx - 42, 36], [cx - 20, 58]])); ink(g, u.pink, S([[cx - 34, 64], [cx - 38, 44], [cx - 26, 58]]));
  piece(g, u.body, S([[cx + 36, 70], [cx + 42, 36], [cx + 20, 58]])); ink(g, u.pink, S([[cx + 34, 64], [cx + 38, 44], [cx + 26, 58]]));
  piece(g, u.body, E(cx, 94, 44, 40));
  piece(g, u.muzzle, E(cx, 116, 24, 16), .5);
  ink(g, '#D99AAE', U(E(cx - 8, 114, 2.6, 2), E(cx + 8, 114, 2.6, 2)));
  // mane tufts on top, the horn in the middle
  piece(g, u.lilac, E(cx - 26, 64, 13, 10, -.7), .7); piece(g, u.mint, E(cx + 24, 62, 12, 9, .6), .7);
  piece(g, u.pink, E(cx - 10, 58, 17, 11, -.3), .7); piece(g, u.pink, E(cx + 10, 58, 14, 10, .3), .7);
  piece(g, u.horn, S([[cx - 8, 56], [cx, 20], [cx, 20], [cx + 8, 56]]), .8);
  line(g, u.horn2, 2, [[cx - 5, 46], [cx + 5, 44]]); line(g, u.horn2, 2, [[cx - 3, 36], [cx + 3, 34]]);
  eye(g, cx - 18, 92, 5.4); eye(g, cx + 18, 92, 5.4);
  ink(g, 'rgba(240,120,150,.4)', U(E(cx - 30, 106, 7, 5), E(cx + 30, 106, 7, 5)));
  if (g.colour) { g.save(); g.strokeStyle = '#c9788f'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.arc(cx, 120, 6, .4, Math.PI - .4); g.stroke(); g.restore(); }
}
/** the baby walking away: her round bottom with the curly tail, the back of her head and mane, the horn tip */
export function drawBabyBack(g, f) {
  const s = swing(f), u = UNI, cx = 110, l1 = Math.max(0, s) * 8, l2 = Math.max(0, -s) * 8;
  piece(g, u.shade, C(cx - 24, 150, cx - 24, 174 - l2, 9.5)); piece(g, u.hoof2, E(cx - 24, 180 - l2, 10, 6));
  piece(g, u.shade, C(cx + 24, 150, cx + 24, 174 - l1, 9.5)); piece(g, u.hoof2, E(cx + 24, 180 - l1, 10, 6));
  piece(g, u.horn, S([[cx - 6, 60], [cx, 26], [cx, 26], [cx + 6, 60]]), .8);
  piece(g, u.body, S([[cx - 34, 70], [cx - 40, 38], [cx - 18, 58]])); piece(g, u.body, S([[cx + 34, 70], [cx + 40, 38], [cx + 18, 58]]));
  piece(g, u.body, E(cx, 90, 38, 34));
  // the mane runs down the back of her head
  piece(g, u.mint, E(cx - 12, 84, 10, 22, .15), .7); piece(g, u.lilac, E(cx + 12, 84, 10, 22, -.15), .7); piece(g, u.pink, E(cx, 78, 12, 28), .7);
  piece(g, u.body, E(cx, 142, 46, 38));
  piece(g, u.body, C(cx - 18, 158, cx - 18, 182 - l1, 11.5)); piece(g, u.hoof, E(cx - 18, 188 - l1, 12.5, 7));
  piece(g, u.body, C(cx + 18, 158, cx + 18, 182 - l2, 11.5)); piece(g, u.hoof, E(cx + 18, 188 - l2, 12.5, 7));
  // the curly tail, swishing as she walks
  const k = s * 5;
  piece(g, u.mint, E(cx + 7 + k, 142, 9, 12, -.3), .7); piece(g, u.lilac, E(cx - 7 + k, 134, 10, 12, .3), .7); piece(g, u.pink, E(cx + k, 120, 13, 15), .7);
}
/** the grown unicorn: tall and slender, a long horn, a flowing mane and tail, wings folded on her side */
export function drawGrown(g, f, wing = true) {
  const s = swing(f), u = UNI;
  piece(g, u.shade, C(104, 196, 102 - s * 9, 262, 10, 8)); piece(g, u.hoof2, E(105 - s * 9, 268, 12, 7));
  piece(g, u.shade, C(178, 196, 180 + s * 9, 262, 10, 8)); piece(g, u.hoof2, E(183 + s * 9, 268, 12, 7));
  // the tail: three long strands
  piece(g, u.mint, S([[78, 170], [46, 188], [36, 236], [50, 262], [56, 232], [76, 196]]), .7);
  piece(g, u.lilac, S([[76, 166], [36, 176], [20, 222], [30, 250], [42, 218], [72, 188]]), .7);
  piece(g, u.pink, S([[80, 162], [44, 160], [22, 196], [24, 222], [40, 198], [76, 180]]), .7);
  piece(g, u.body, E(142, 184, 66, 40));
  // a short strong neck rising to the head
  piece(g, u.body, S([[158, 178], [166, 136], [184, 108], [206, 96], [226, 106], [222, 140], [214, 192]]));
  piece(g, u.body, C(116, 196, 112 - s * 9, 266, 12, 9)); piece(g, u.hoof, E(115 - s * 9, 272, 13, 8));
  piece(g, u.body, C(190, 196, 192 + s * 9, 266, 12, 9)); piece(g, u.hoof, E(195 + s * 9, 272, 13, 8));
  // the folded wing: a rounded shoulder and long feathers sweeping back, a pastel row under a pearl row (only once she has her wings)
  if (wing) {
  piece(g, u.lilac, S([[174, 170], [166, 150], [140, 142], [110, 146], [80, 158], [98, 164], [76, 174], [100, 178], [86, 190], [116, 186], [126, 196], [148, 186]]), .8);
  piece(g, '#FFFDF8', S([[176, 166], [170, 144], [148, 134], [120, 136], [92, 148], [110, 154], [90, 164], [114, 168], [104, 180], [130, 176], [140, 186], [158, 178]]), .8);
  line(g, u.shade, 2, [[150, 150], [112, 158]]); line(g, u.shade, 2, [[156, 160], [120, 170]]);
  }
  g.save(); g.translate(-8, 24);
  // head and muzzle
  piece(g, u.body, U(E(228, 82, 35, 32, -.1), E(250, 100, 21, 18, .3)));
  piece(g, u.muzzle, E(255, 102, 15, 12, .3), .5); ink(g, '#D99AAE', E(262, 98, 2.6, 2));
  // ear, mane down the neck, forelock, horn
  piece(g, u.body, S([[206, 60], [204, 26], [222, 54]])); ink(g, u.pink, S([[208, 56], [207, 36], [217, 53]]));
  piece(g, u.mint, S([[196, 70], [178, 92], [166, 140], [170, 168], [180, 132], [196, 96]]), .7);
  piece(g, u.lilac, S([[204, 60], [184, 78], [172, 120], [176, 150], [188, 112], [206, 80]]), .7);
  piece(g, u.pink, S([[212, 54], [194, 62], [182, 96], [186, 124], [198, 92], [216, 70]]), .7);
  piece(g, u.pink, E(222, 56, 13, 8, .4), .7);
  piece(g, u.horn, S([[218, 52], [246, 4], [246, 4], [232, 56]]), .8);
  for (let i = 0; i < 4; i++) line(g, u.horn2, 2, [[224 + i * 4.6, 44 - i * 9], [233 + i * 3.4, 42 - i * 9]]);
  eye(g, 236, 78, 7); line(g, '#33262e', 2, [[230, 71], [225, 65]]); line(g, '#33262e', 2, [[234, 69], [231, 62]]);
  ink(g, 'rgba(240,120,150,.5)', E(242, 96, 9, 6));
  if (g.colour) { g.save(); g.strokeStyle = '#c9788f'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(258, 104, 7, .5, Math.PI - .7); g.stroke(); g.restore(); }
  g.restore();
}

/** canvas sizes (drawing units) and how tall each stands in the world */
export const FIGS = {
  anna: { w: 200, h: 240, kid: 'anna', draw: kidDraw('anna', 'side'), front: kidDraw('anna', 'front'), back: kidDraw('anna', 'back'), frames: 1 + WALK, size: 1.2 },
  fenna: { w: 200, h: 276, kid: 'fenna', draw: kidDraw('fenna', 'side'), front: kidDraw('fenna', 'front'), back: kidDraw('fenna', 'back'), frames: 1 + WALK, size: 1.38 },
  baby: { w: 220, h: 200, draw: drawBaby, front: drawBabyFront, back: drawBabyBack, frames: 1 + WALK, size: .95 },
  grown: { w: 280, h: 284, draw: drawGrown, frames: 1 + WALK, size: 1.75 },
  groot: { w: 280, h: 284, draw: (g, f) => drawGrown(g, f, false), frames: 1 + WALK, size: 1.75 },   // grown, before she has her wings
};

