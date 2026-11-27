// Things of the paper world that she holds or that stand about, cut by the same scissors as the animals (see STYLE.md):
// few round pieces of sugar paper on a white card. Where a thing has a front it faces right. The sheet is animals.html.
import { E, S, C, U, P, piece, ink, line, eye } from './cut.js';

const DARK = '#33262E', PI = Math.PI;
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
const cheek = (g, x, y, rx = 7, ry = 5) => ink(g, 'rgba(240,120,150,.4)', E(x, y, rx, ry));
/** a shape with straight sides and corners rounded by r (a box, a sleeve, a trouser leg) */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** a bent strip of paper: capsules along a row of points */
const strip = (pts, r) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r)));
const mir = (pts, cx = 100) => pts.map(([x, y]) => [2 * cx - x, y]).reverse();

// the watering can, from the side: spout and rose to the right, a big loop of a handle at the left.
// 0 empty (dark inside), 1 full (water at the open top), 2 pouring: tipped to the right, drops falling from the rose
const CAN = { c: '#6FB0B8', c2: '#5F9FAE', dark: '#3A7483', light: '#A5D3D6', water: '#8FD0E0' };
function drawGieter(g, f) {
  const k = CAN, pour = f === 2;
  g.save(); g.translate(pour ? 76 : 80, pour ? 70 : 107); g.rotate(pour ? .75 : 0);
  piece(g, k.c2, strip(arc(-33, 0, 30, .5 * PI, 1.5 * PI, 8), 5));
  piece(g, k.c2, C(26, 24, 78, -22, 8, 5.5));
  // the rose: a little funnel and a disc with holes
  piece(g, k.c2, P([[73.6, -10.9], [94, -17.5], [75.4, -38.5], [66.4, -19.1]]));
  piece(g, k.light, E(84.7, -28, 6, 14, -.72), .6);
  ink(g, k.dark, U(...[[0, 0], [0, -8], [0, 8], [-2.4, -4], [2.4, 4]].map(([u, v]) => E(84.7 + u * .749 + v * .663, -28 - u * .663 + v * .749, 1.5, 1.5))));
  piece(g, k.c, round([[-29, -37], [29, -37], [33, 37], [-33, 37]], 10));
  piece(g, k.c2, E(0, -37, 29, 9), .6);
  ink(g, f ? k.water : k.dark, E(0, -36.5, 25, 6.4));
  if (f) ink(g, '#D9F1F5', E(-9, -38, 8, 1.8));
  ink(g, k.light, round([[-31, 14], [31, 14], [32, 22], [-32, 22]], 0));
  g.restore();
  if (pour) for (const [x, y] of [[171, 96], [176, 112], [170, 126], [177, 139]]) piece(g, k.water, S([[x, y - 8], [x, y - 8], [x + 5, y + 2], [x, y + 6.5], [x - 5, y + 2]]), .6);
}

// the scarecrow, looking at us: a straw hat, a round face of sackcloth, a red shirt with its arms out on the cross beam,
// straw for hands and feet, patched blue trousers, a wooden post. 0 stands still, 1 leans left, 2 leans right (a wobble)
function drawSchrik(g, f) {
  const straw = '#E6B748', straw2 = '#CF9C35', sack = '#EBD9B4', red = '#D8574F', red2 = '#BC463F', blue = '#6F9BCB', blue2 = '#5880B2', wood = '#8D6A48';
  // a bunch of straw: a fan of stalks with their tips snipped blunt (a sharp tip frays the backing card)
  const fan = (x, y, rot, n = 4, l = 22, w = 22) => { g.save(); g.translate(x, y); g.rotate(rot); piece(g, straw, P([[0, -w * .36], ...Array.from({ length: 2 * n - 1 }, (_, i) => { const v = -w / 2 + w * i / (2 * n - 2); return i % 2 ? [[l * .55, v]] : [[l, v - 1.8], [l, v + 1.8]]; }).flat(), [0, w * .36]])); g.restore(); };
  g.save(); g.translate(100, 250); g.rotate(f === 1 ? -.06 : f === 2 ? .06 : 0); g.translate(-100, -250);
  piece(g, wood, round([[94, 130], [106, 130], [106, 250], [94, 250]], 3));
  fan(44, 112, PI); fan(156, 112, 0); fan(87, 208, PI / 2, 3, 16, 18); fan(113, 208, PI / 2, 3, 16, 18);
  // trousers with two patches
  piece(g, blue, U(round([[75, 150], [125, 150], [126, 176], [74, 176]], 4), round([[74, 160], [97, 160], [96, 212], [77, 212]], 5), round(mir([[74, 160], [97, 160], [96, 212], [77, 212]]), 5)));
  piece(g, straw2, P([[79, 184], [90, 182], [92, 194], [80, 196]]), .3); piece(g, blue2, P([[107, 168], [119, 169], [118, 180], [106, 179]]), .3);
  for (const [x, y, a] of [[79, 190, 0], [91, 188, 0], [85, 183, 1], [86, 195, 1], [107, 174, 0], [118, 174, 0], [112, 168.5, 1], [112, 179.5, 1]]) line(g, DARK, 1.4, a ? [[x, y - 2.5], [x, y + 2.5]] : [[x - 2.5, y], [x + 2.5, y]]);
  // the shirt, arms straight out
  piece(g, red, U(round([[75, 98], [125, 98], [129, 158], [71, 158]], 9), C(80, 112, 50, 112, 13, 12), C(120, 112, 150, 112, 13, 12)));
  piece(g, red2, C(42, 102, 42, 122, 3.5), .5); piece(g, red2, C(158, 102, 158, 122, 3.5), .5);
  ink(g, '#F4ECDC', U(E(100, 124, 2.6, 2.6), E(100, 138, 2.6, 2.6)));
  piece(g, straw, P([[113, 138], [123, 136], [124, 148], [114, 149]]), .3);
  for (const [x, y, a] of [[113, 143, 0], [124, 142, 0], [118, 136.5, 1], [119, 149, 1]]) line(g, DARK, 1.4, a ? [[x, y - 2.5], [x, y + 2.5]] : [[x - 2.5, y], [x + 2.5, y]]);
  // a straw ruff, straw hair, the face
  piece(g, straw, P([[74, 92], [80, 106], [86, 98], [93, 109], [100, 99], [107, 109], [114, 98], [120, 106], [126, 92]]));
  piece(g, straw2, P([[74, 52], [63, 58], [62, 62], [70, 65], [62, 70], [63, 74], [72, 76], [80, 60]])); piece(g, straw2, P(mir([[74, 52], [63, 58], [62, 62], [70, 65], [62, 70], [63, 74], [72, 76], [80, 60]])));
  piece(g, sack, E(100, 70, 30, 28));
  eye(g, 87, 68, 5.4); eye(g, 113, 68, 5.4); cheek(g, 79, 79, 7, 5); cheek(g, 121, 79, 7, 5);
  piece(g, '#E2803E', S([[95, 73], [105, 73], [100, 82]]), .4);
  const sm = arc(100, 74, 14, .2 * PI, .8 * PI, 8);
  line(g, '#8A3D4C', 2, sm);
  for (const i of [2, 4, 6]) line(g, '#8A3D4C', 1.5, [[sm[i][0], sm[i][1] - 2.6], [sm[i][0], sm[i][1] + 2.6]]);
  // the hat, a little askew
  g.save(); g.translate(100, 46); g.rotate(-.1);
  piece(g, straw, U(E(0, 0, 45, 9), S([[-26, 4], [-22, -30], [22, -30], [26, 4]])));
  ink(g, red2, round([[-22.5, -9], [22.5, -9], [23.5, -2], [-23.5, -2]], 2));
  line(g, straw2, 1.6, [[-36, 2], [-20, 5]]); line(g, straw2, 1.6, [[20, 5], [36, 2]]);
  g.restore();
  g.restore();
}

// a little blackbird, round and dark with an orange beak. 0 sits, 1 flies with her wings up, 2 with her wings down
function drawVogel(g, f) {
  const b = '#4B3D3D', b2 = '#3A2E31', b3 = '#6B5852', o = '#E2803E', o2 = '#C96A2E';
  const face = (x, y) => {
    piece(g, b, E(x, y, 16, 15.5));
    piece(g, o, S([[x + 13, y - 4], [x + 26, y + 1], [x + 26, y + 1], [x + 13, y + 6]]), .6);
    ink(g, '#F0B354', E(x + 5, y - 2, 4.8, 5.4)); eye(g, x + 5, y - 2, 3.7);
  };
  if (!f) {
    piece(g, o2, C(40, 66, 40, 74, 1.7)); piece(g, o2, E(42, 76, 5, 2.2));
    piece(g, o, C(48, 66, 48, 74, 1.7)); piece(g, o, E(50, 76, 5, 2.2));
    piece(g, b2, S([[30, 50], [9, 46], [9, 46], [14, 58], [28, 62]]));
    piece(g, b, E(43, 54, 22, 17, -.15));
    face(59, 38);
    piece(g, b3, S([[46, 49], [48, 61], [32, 64], [20, 56], [20, 56], [34, 47]]), .6);
    return;
  }
  const up = f === 1, y = up ? 3 : -2;
  g.save(); g.translate(3, y);
  piece(g, b2, up ? S([[46, 46], [48, 12], [48, 12], [66, 24], [64, 46]]) : S([[46, 46], [50, 76], [50, 76], [66, 64], [64, 46]]));
  piece(g, b2, S([[30, 42], [7, 36], [7, 36], [9, 50], [28, 50]]));
  piece(g, b, E(46, 45, 22, 13.5, -.08));
  face(66, 40);
  piece(g, b3, up ? S([[34, 46], [28, 10], [28, 10], [50, 20], [56, 46]]) : S([[34, 44], [34, 78], [34, 78], [52, 66], [56, 44]]), .8);
  g.restore();
}

// a carrot just pulled: the orange root points down and to the left, the green leaves stand up at the right
function drawWortel(g) {
  const o = '#E2803E', o2 = '#C96A2E', gr = '#7FB069', gr2 = '#5F9450';
  const leaf = (rot, l, col) => { g.save(); g.translate(74, 46); g.rotate(rot); piece(g, col, S([[-5, 2], [-10, -l * .5], [-2, -l], [2, -l], [10, -l * .5], [5, 2]])); g.restore(); };
  leaf(-.25, 34, gr2); leaf(1.3, 32, gr2); leaf(.5, 38, gr);
  piece(g, o, C(66, 56, 25, 103, 16, 4));
  for (const [x, y, l] of [[60, 52, 9], [47, 64, 8], [44, 78, 6], [33, 86, 5]]) line(g, o2, 2, [[x, y], [x + l, y + l * .8]]);
}

// a hen's egg
function drawEi(g) {
  piece(g, '#F0D6AC', U(E(30, 40, 17, 19), E(30, 33, 13, 20)));
  ink(g, '#FCF8F1', E(24, 27, 3.6, 6, .45));
}

// the picnic basket: wicker, a handle, a red checked cloth peeking out
function drawMand(g) {
  const w = '#C79A66', w2 = '#A87B4B', w3 = '#8D6A48', red = '#D8574F', cream = '#FCF8F1';
  piece(g, w3, strip(arc(75, 66, 40, PI, 2 * PI, 10), 4.5));
  piece(g, red, S([[66, 70], [72, 50], [92, 44], [112, 52], [118, 70]]));
  piece(g, w, round([[30, 66], [120, 66], [112, 116], [38, 116]], 12));
  for (const y of [80, 92, 104]) line(g, w2, 2, [[34 + (y - 66) * .16, y], [116 - (y - 66) * .16, y]]);
  for (let r = 0; r < 4; r++) for (let x = 44 + (r % 2) * 9; x < 110; x += 18) line(g, w2, 2, [[x, 71 + r * 12], [x, 77 + r * 12]]);
  piece(g, w2, C(30, 66, 120, 66, 5.5), .6);
  piece(g, red, S([[80, 60], [122, 60], [116, 82], [102, 94], [102, 94], [90, 80]]));
  for (const [a, b] of [[[94, 62], [94, 80]], [[104, 62], [104, 89]], [[113, 63], [113, 77]], [[87, 70], [118, 70]], [[93, 79], [113, 79]]]) line(g, cream, 1.6, [a, b]);
  for (const [a, b] of [[[84, 50], [84, 60]], [[94, 47.5], [94, 60]], [[104, 49], [104, 60]], [[75, 54], [111, 54]]]) line(g, cream, 1.6, [a, b]);
}

// a red apple with a leaf
/** a coin: round and golden, a lighter ring, a little star pressed in */
function drawMunt(g) {
  piece(g, '#E0A93A', E(32, 32, 26, 26)); piece(g, '#F2C65C', E(32, 32, 21, 21), .3);
  ink(g, '#E0A93A', P([[32, 18], [36, 28], [46, 28], [38, 34], [41, 44], [32, 38], [23, 44], [26, 34], [18, 28], [28, 28]]));
  ink(g, 'rgba(255,255,255,.55)', E(23, 22, 4, 6, .6));
}
/* ---------- what falls out of a tree when it is shaken (paper.js) ---------- */
/** a caterpillar hanging head down from its thread: 0 and 1 wriggle */
function drawRups(g, f) {
  const w = f ? 1 : -1;
  for (let i = 0; i < 6; i++) { const y = 14 + i * 13, x = 30 + Math.sin(i * 1.1) * 6 * w; piece(g, i % 2 ? '#8CC46E' : '#A6D486', E(x, y, 11, 9), .5); ink(g, 'rgba(255,255,255,.35)', E(x - 4, y - 3, 2.5, 2)); }
  const hx = 30 + Math.sin(6 * 1.1) * 6 * w, hy = 100;
  line(g, '#5E8A4A', 2.2, [[hx - 5, hy + 8], [hx - 9, hy + 16]]); line(g, '#5E8A4A', 2.2, [[hx + 5, hy + 8], [hx + 9, hy + 16]]);
  piece(g, '#7FB862', E(hx, hy, 13, 12)); eye(g, hx - 5, hy + 1, 3); eye(g, hx + 5, hy + 1, 3); cheek(g, hx, hy + 6, 4, 2.6);
}
/** a stripy sock, for no reason at all */
function drawSok(g) {
  piece(g, '#F6EFE2', round([[22, 6], [52, 6], [52, 70], [74, 82], [76, 100], [48, 104], [22, 86]], 12));
  for (const y of [18, 34, 50]) piece(g, '#E98F8F', P([[22, y], [52, y], [52, y + 8], [22, y + 8]]), 0);
  piece(g, '#E98F8F', E(62, 96, 12, 8), 0); piece(g, '#E98F8F', P([[20, 4], [54, 4], [54, 12], [20, 12]]), .3);
}
/** a pinecone */
function drawDenappel(g) {
  piece(g, '#7A5A3E', E(30, 44, 18, 26));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) piece(g, r % 2 ? '#A77E54' : '#B88B5C', E(20 + c * 10 + (r % 2) * 5, 26 + r * 9, 6, 4.5), .3);
  line(g, '#5E4430', 3, [[30, 18], [30, 8]]);
}
/** a birdwatcher who fell out of a tree: 0 tumbling, arms up; 1 sitting, dazed, little stars; 2 up again, waving */
function drawVogelaar(g, f) {
  const coat = '#7FA676', coat2 = '#5F8A5E', skin = '#F2C8A8', hat = '#B8925E', shorts = '#C9A36E', boots = '#6B4B33';
  const sit = f === 1, body = sit ? 118 : 96;
  if (sit) { piece(g, shorts, round([[44, 148], [96, 148], [104, 170], [40, 170]], 8)); piece(g, boots, E(112, 172, 12, 8)); piece(g, boots, E(30, 172, 12, 8)); }
  else { for (const s of [-1, 1]) { piece(g, shorts, round([[70 + s * 4, 140], [70 + s * 22, 140], [70 + s * (f ? 22 : 30), 172], [70 + s * (f ? 8 : 14), 172]], 6)); piece(g, boots, E(70 + s * (f ? 15 : 24), 178, 11, 7)); } }
  piece(g, coat, round([[42, body], [98, body], [104, body + 50], [36, body + 50]], 16));
  if (f === 0) { line(g, coat2, 12, [[46, body + 8], [26, body - 30]]); line(g, coat2, 12, [[94, body + 8], [114, body - 30]]); piece(g, skin, E(24, body - 36, 8, 8)); piece(g, skin, E(116, body - 36, 8, 8)); }
  else if (f === 2) { line(g, coat2, 12, [[94, body + 8], [118, body - 24]]); piece(g, skin, E(120, body - 30, 8, 8)); line(g, coat2, 12, [[46, body + 10], [38, body + 44]]); }
  else { line(g, coat2, 12, [[46, body + 10], [34, body + 40]]); line(g, coat2, 12, [[94, body + 10], [106, body + 40]]); }
  piece(g, '#33262E', round([[56, body + 14], [84, body + 14], [84, body + 26], [56, body + 26]], 4)); ink(g, '#8FB8C8', E(62, body + 20, 4, 4)); ink(g, '#8FB8C8', E(78, body + 20, 4, 4));   // the binoculars
  const hy = body - 26; piece(g, skin, E(70, hy, 24, 24)); eye(g, 61, hy + 2, f === 1 ? 2.6 : 3.6); eye(g, 79, hy + 2, f === 1 ? 2.6 : 3.6); cheek(g, 70, hy + 12, 6, 3.5);
  if (f === 0) ink(g, '#33262E', E(70, hy + 14, 5, 6)); else line(g, '#33262E', 2.4, [[63, hy + 13], [70, hy + 16], [77, hy + 13]]);
  piece(g, hat, U(E(70, hy - 16, 26, 7), E(70, hy - 22, 18, 12)));
  if (f === 1) for (const [x, y] of [[40, hy - 38], [70, hy - 48], [100, hy - 38]]) piece(g, '#F2C65C', P([[x, y - 7], [x + 2, y - 2], [x + 7, y - 2], [x + 3, y + 2], [x + 5, y + 7], [x, y + 4], [x - 5, y + 7], [x - 3, y + 2], [x - 7, y - 2], [x - 2, y - 2]]), .3);
}
/** a hazelnut: 0 whole in its brown shell, 1 cracked open, the pale nut showing */
function drawNoot(g, f) {
  if (f === 1) { piece(g, '#8A5E3A', S([[8, 30], [10, 46], [22, 50], [22, 34]])); piece(g, '#8A5E3A', S([[40, 30], [38, 46], [26, 50], [26, 34]])); piece(g, '#F1DDB4', E(24, 30, 9, 11)); ink(g, 'rgba(255,255,255,.5)', E(21, 26, 2.4, 3.6)); return; }
  piece(g, '#9A6A40', E(24, 32, 15, 16)); piece(g, '#C9A36E', S([[10, 22], [16, 12], [24, 8], [32, 12], [38, 22], [24, 20]])); ink(g, 'rgba(255,255,255,.35)', E(18, 34, 3, 6, .3));
}
/** a bowl of hazelnuts, seen a little from above: a pale blue bowl, brown nuts heaped in it */
function drawSchaal(g) {
  for (const [x, y, r] of [[40, 40, 11], [58, 34, 12], [76, 38, 11], [94, 42, 10], [50, 50, 10], [68, 48, 11], [86, 52, 10]]) { piece(g, '#9A6A40', E(x, y, r, r * .95)); piece(g, '#C9A36E', E(x, y - r * .55, r * .75, r * .38), .3); }
  piece(g, '#9FC4C9', S([[16, 50], [114, 50], [108, 74], [92, 90], [38, 90], [22, 74]]));
  piece(g, '#B8D6DA', E(65, 52, 50, 6), .2); ink(g, 'rgba(255,255,255,.5)', E(36, 66, 4, 9, .4));
}
/** a pear: yellow-green, round at the bottom, a short stalk and a leaf */
function drawPeer(g) {
  piece(g, '#7A5A3E', C(34, 14, 18, 10, 1.9));
  piece(g, '#7FB069', S([[36, 14], [44, 6], [54, 8], [54, 8], [46, 16]]));
  piece(g, '#D8C45A', S([[34, 16], [40, 22], [44, 36], [52, 52], [50, 68], [34, 74], [18, 68], [16, 52], [24, 36], [28, 22]]));
  ink(g, 'rgba(255,255,255,.45)', E(26, 50, 3.4, 7, .3));
}
function drawAppel(g) {
  piece(g, '#7A5A3E', C(32, 28, 35, 16, 1.9));
  piece(g, '#7FB069', S([[35, 22], [42, 10], [54, 12], [54, 12], [47, 23]]));
  piece(g, '#D8574F', U(E(25, 41, 14, 17), E(39, 41, 14, 17)));
  ink(g, 'rgba(255,255,255,.45)', E(21, 34, 3.4, 6, .45));
}

/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is */
export const THINGS = {
  gieter: { w: 190, h: 154, draw: drawGieter, frames: 3, size: .56, does: ['empty', 'full', 'pour'] },
  vogelverschrikker: { w: 200, h: 260, draw: drawSchrik, frames: 3, size: 2, does: ['still', 'left', 'right'] },
  vogel: { w: 106, h: 88, draw: drawVogel, frames: 3, size: .34, does: ['sit', 'up', 'down'] },
  wortel: { w: 120, h: 120, draw: drawWortel, frames: 1, size: .4, does: ['carrot'] },
  ei: { w: 60, h: 70, draw: drawEi, frames: 1, size: .2, does: ['egg'] },
  mand: { w: 150, h: 126, draw: drawMand, frames: 1, size: .45, does: ['basket'] },
  appel: { w: 64, h: 70, draw: drawAppel, frames: 1, size: .18, does: ['apple'] },
  noot: { w: 48, h: 54, draw: drawNoot, frames: 2, size: .11, does: ['whole', 'cracked'] },
  schaal: { w: 130, h: 100, draw: drawSchaal, frames: 1, size: .26, does: ['a bowl of nuts'] },
  peer: { w: 70, h: 80, draw: drawPeer, frames: 1, size: .2, does: ['pear'] },
  munt: { w: 64, h: 64, draw: drawMunt, frames: 1, size: .2, does: ['coin'] },
  rups: { w: 60, h: 122, draw: drawRups, frames: 2, size: .4, does: ['wriggle', 'wriggle'] },
  sok: { w: 90, h: 110, draw: drawSok, frames: 1, size: .22, does: ['sock'] },
  denappel: { w: 60, h: 78, draw: drawDenappel, frames: 1, size: .2, does: ['pinecone'] },
  vogelaar: { w: 140, h: 196, draw: drawVogelaar, frames: 3, size: 1.15, does: ['tumble', 'dazed', 'wave'] },
};
