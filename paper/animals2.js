// More animals of the paper world, for the meadow, the beach and the sea, the rainbow island and the castle, and a kite.
// Cut by the same scissors as animals.js (see STYLE.md): few round pieces of sugar paper on a white card, dot eyes,
// a pink cheek. All face right (the world flips them). The sheet is animals2.html.
import { E, S, C, U, P, piece, ink, line, eye } from './cut.js';

const DARK = '#33262E', PI = Math.PI, CREAM = '#F4ECDC', WHITE = '#FCF8F1';
/** legs forward, legs back (frames 1 and 2 of a simple walker) */
const step = f => f === 1 ? 1 : f === 2 ? -1 : 0;
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shut eye: a little arc hanging down */
const shut = (g, x, y, r = 4.6, col = DARK) => line(g, col, 2.2, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
const smile = (g, x, y, r = 5, col = '#8A3D4C', w = 2) => line(g, col, w, arc(x, y, r, .15 * PI, .85 * PI));
const cheek = (g, x, y, rx = 7, ry = 5, a = .4) => ink(g, `rgba(240,120,150,${a})`, E(x, y, rx, ry));
/** a bent strip of paper: capsules along a row of points */
const strip = (pts, r) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r)));
/** n round lumps on a circle */
const ring = (cx, cy, R, r, n, a0 = 0) => Array.from({ length: n }, (_, i) => E(cx + Math.cos(a0 + i / n * 2 * PI) * R, cy + Math.sin(a0 + i / n * 2 * PI) * R, r, r));
/** draw something turned by `a` about (x, y) */
const rot = (g, x, y, a, fn) => { g.save(); g.translate(x, y); g.rotate(a); fn(); g.restore(); };

/* ---------------- the meadow ---------------- */

// the sheep: a cloud of cream wool lumps, a dark face and legs (the sheep of the test island, cut from paper).
// 0 stands, 1-2 walk, 3 is puffed up enormous and round (only her feet and her surprised face stick out), 4 is just shorn: small and pink, three tufts left
const SHEEP = { wool: '#F4ECDC', wool2: '#E2D6C1', face: '#4B3D3D', face2: '#3A2E31', skin: '#F6CFC8', skin2: '#E3A9A4' };
/** the dark face under a cap of wool. look: '' | 'wide' (surprised) | 'glad' (a big smile and a blush); ear: 0 hanging to 1 flying */
function sheepHead(g, x, y, s = 1, look = '', ear = 0) {
  const k = SHEEP, wide = look === 'wide', glad = look === 'glad'; g.save(); g.translate(x, y); g.scale(s, s);
  rot(g, -8, -13, .3 + ear * .7, () => piece(g, k.face2, E(-9 - ear * 3, 0, 11 + ear * 3, 5.5)));
  piece(g, k.face, E(0, 0, 19, 23, -.4));
  piece(g, k.wool, U(E(-9, -19, 11, 10), E(4, -21, 10, 9), E(-3, -26, 9, 8)));
  rot(g, -11, -7, -.45 + ear * 1.4, () => piece(g, k.face, E(-9 - ear * 3, 0, 11 + ear * 3, 6), .6));
  ink(g, WHITE, E(4.5, -3.5, wide ? 8.4 : 6.2, wide ? 9.4 : 6.8));
  eye(g, wide ? 5.5 : 5, -3.5, 4.2);
  ink(g, `rgba(246,140,165,${glad ? .8 : .5})`, E(-4, 9, glad ? 7.5 : 6, glad ? 5.5 : 4.5));
  ink(g, '#E9A0AE', E(11.5, 15, 3, 2.3, -.4));
  if (wide) ink(g, CREAM, E(5, 17, 2.4, 2.8)); else line(g, CREAM, 1.8, arc(4.5, 14.5, glad ? 5.5 : 4.2, .2 * PI, .9 * PI));
  g.restore();
}
function drawSchaap(g, f) {
  const k = SHEEP, sw = step(f) * 4;
  const leg = (x, s, col, y0) => piece(g, col, C(x, y0, x + s, 173, 4.8));
  if (f === 3) {
    for (const x of [82, 124]) leg(x, 0, k.face2, 160);
    piece(g, k.wool2, U(E(100, 107, 54, 52), ...ring(100, 107, 48, 18, 13)));
    for (const x of [70, 112]) leg(x, 0, k.face, 160);
    piece(g, k.wool, U(E(98, 104, 54, 52), ...ring(98, 104, 48, 18, 13, .2)));
    for (const [x, y, r] of [[70, 80, 15], [100, 68, 16], [128, 86, 15], [84, 110, 16], [118, 122, 15], [58, 116, 13], [98, 142, 14]]) piece(g, k.wool, E(x, y, r, r), .5);
    sheepHead(g, 164, 112, 1, 'wide', .75);
    return;
  }
  if (f === 4) {
    // lower and smaller: short thin legs under a little pink body, her head as big as ever
    const thin = (x, col) => piece(g, col, C(x, 150, x, 173.8, 4));
    thin(80, k.face2); thin(120, k.face2);
    piece(g, k.wool, U(E(54, 136, 8, 8), E(49, 142, 6, 6)));
    piece(g, k.skin, E(92, 144, 36, 20));
    for (const [x, y] of [[72, 139], [86, 150], [102, 140], [112, 151]]) line(g, k.skin2, 1.8, [[x - 5, y - 2], [x, y + 1], [x + 5, y - 2]]);
    thin(70, k.face); thin(110, k.face);
    piece(g, k.wool, U(E(84, 124, 7.5, 6.5), E(93, 122, 6.5, 6)), .6);
    sheepHead(g, 144, 128, 1, 'glad', 0);
    return;
  }
  const lumps = [[62, 128, 20], [80, 114, 22], [102, 110, 22], [122, 120, 20], [124, 138, 17], [102, 142, 20], [80, 142, 20], [60, 140, 17]];
  leg(80, sw, k.face2, 150); leg(126, -sw, k.face2, 150);
  piece(g, k.wool2, U(...lumps.map(([x, y, r]) => E(x + 2, y + 4, r, r))));
  leg(66, -sw, k.face, 150); leg(112, sw, k.face, 150);
  piece(g, k.wool, U(...lumps.map(([x, y, r]) => E(x, y, r, r)), E(92, 128, 26, 26)));
  for (const [x, y, r] of [[74, 126, 13], [96, 118, 14], [114, 132, 12], [88, 142, 12]]) piece(g, k.wool, E(x, y, r, r), .5);
  sheepHead(g, 146, 118, 1, '', 0);
}

// the lamb: a small cloud on long legs, a big head. 0 stands, 1-2 walk, 3 is in the middle of a leap: all four legs out, ears flying
function drawLam(g, f) {
  const k = SHEEP, sw = step(f) * 4, leap = f === 3;
  const lumps = [[52, 100, 14], [64, 90, 15], [80, 88, 15], [92, 98, 14], [80, 108, 14], [62, 108, 14]];
  const leg = (x1, y1, x2, y2, col) => piece(g, col, C(x1, y1, x2, y2, 4.2, 3.8));
  g.save(); g.translate(0, 10);
  if (leap) { g.translate(72, 100); g.rotate(-.22); g.translate(-72, -128); }
  if (leap) { leg(60, 106, 34, 120, k.face2); leg(88, 108, 110, 124, k.face2); }
  else { leg(62, 108, 62 + sw, 133, k.face2); leg(90, 108, 90 - sw, 133, k.face2); }
  piece(g, k.wool, leap ? E(40, 90, 7, 7) : E(41, 97, 7, 7));
  piece(g, k.wool2, U(...lumps.map(([x, y, r]) => E(x + 1.5, y + 3, r, r))));
  if (leap) { leg(54, 104, 22, 104, k.face); leg(90, 106, 120, 112, k.face); }
  else { leg(54, 108, 54 - sw, 134, k.face); leg(82, 108, 82 + sw, 134, k.face); }
  piece(g, k.wool, U(...lumps.map(([x, y, r]) => E(x, y, r, r)), E(72, 99, 17, 15)));
  for (const [x, y, r] of [[62, 98, 9], [78, 94, 10], [74, 108, 9]]) piece(g, k.wool, E(x, y, r, r), .5);
  sheepHead(g, 108, 80, .8, leap ? 'glad' : '', leap ? 1 : 0);
  g.restore();
}

// the bumblebee: a round yellow ball with two brown stripes and little pale wings. 0 wings up, 1 wings down
function drawBij(g, f) {
  const y = '#F2CF5B', br = '#6B4A35', w = '#EEF4F1', w2 = '#D6E4E2';
  if (!f) { piece(g, w2, E(37, 30, 8, 14, -.45)); piece(g, w, E(52, 28, 9, 15, .2)); }
  else piece(g, w2, E(27, 42, 15, 7.5, .35));
  piece(g, br, U(C(56, 42, 57, 28, 1.3), E(57, 26, 2.8, 2.8), C(61, 43, 67, 31, 1.3), E(68, 29, 2.8, 2.8)));
  piece(g, y, E(46, 56, 24, 20));
  ink(g, br, E(38, 56, 4.5, 18.5)); ink(g, br, E(27, 56, 4, 11.5));
  if (f) piece(g, w, E(35, 50, 16, 8, .45), .6);
  eye(g, 59, 52, 3.8); cheek(g, 56, 61, 4.5, 3); smile(g, 64, 59, 2.8, '#8A3D4C', 1.6);
}

// the river otter, floating on her back, drawn from the waterline up: tail tip and hind feet at the left, a shell on her cream tummy, her head at the right.
// 0 floats, 1 taps the shell with a pebble, 2 has dived: only her tail and feet show
function drawOtter(g, f) {
  const b = '#8D6A48', b2 = '#7A5A3E', shell = '#F8DDE4', sh2 = '#E9A0AE', W = 98;
  if (f === 2) {
    piece(g, b2, E(80, 58, 8, 13, -.5)); piece(g, b2, E(132, 62, 8, 13, .55));
    piece(g, b2, C(104, 70, 114, 30, 10, 5.5));
    piece(g, b, S([[64, W], [64, W], [66, 74], [92, 58], [122, 60], [142, 78], [144, W], [144, W]]));
    ink(g, '#C79A66', U(E(79, 55, 3, 5, -.5), E(133, 59, 3, 5, .55)));
    return;
  }
  piece(g, b2, C(36, 90, 20, 74, 7, 5));
  piece(g, b2, E(54, 70, 7.5, 11, -.3)); piece(g, b2, E(68, 67, 7.5, 11, .25));
  ink(g, '#C79A66', U(E(54, 68, 3, 4.5, -.3), E(68, 65, 3, 4.5, .25)));
  piece(g, b2, E(141, 54, 6, 6));
  piece(g, b, U(S([[42, W], [42, W], [46, 76], [80, 66], [124, 66], [150, 80], [182, 86], [182, W], [182, W]]), E(158, 70, 25, 23)));
  piece(g, CREAM, S([[62, 80], [72, 69], [104, 67], [130, 72], [128, 80], [96, 82]]), .4);
  piece(g, CREAM, E(172, 79, 12, 9), .4); piece(g, '#4B3D3D', E(182, 73, 4.2, 3.6), .4);
  eye(g, 163, 65, 4.8); cheek(g, 155, 79, 6.5, 4.5); smile(g, 173, 82, 4);
  // the shell on her tummy, a paw at each side
  piece(g, shell, S([[94, 68], [90, 54], [104, 45], [118, 54], [114, 68], [104, 70]]));
  for (const x of [97, 104, 111]) line(g, sh2, 1.4, [[104, 66], [x + (x - 104) * .5, 52]]);
  piece(g, b, C(84, 73, 95, 64, 5.5, 5));
  if (f === 1) { piece(g, '#A39A92', E(121, 40, 7.5, 6.5)); piece(g, b, C(127, 73, 122, 48, 5.5, 5)); }
  else piece(g, b, C(127, 73, 114, 64, 5.5, 5));
}

/* ---------------- the beach and the sea ---------------- */

// the crab, looking at us: a red-orange shell, mitten claws, eyes on stalks.
// 0 claws up, 1 left claw high and right low, 2 right claw high and left low (a dance), 3 dug into the sand: eyes and claw tips above a little mound
function drawKrab(g, f) {
  const r = '#E2683E', r2 = '#C9532E', sand = '#EBD9B4', sand2 = '#D6BF92', G = 128;
  // everything on the right half is drawn once and mirrored for the left
  const side = (s, fn) => { g.save(); g.translate(90, 0); g.scale(s, 1); fn(); g.restore(); };
  const pincer = () => piece(g, r, U(E(-2, 6, 12, 9), E(4, -6, 9, 14, .2), E(-10, -5, 5.5, 10, -.4)));
  g.save(); g.translate(6, 0);
  if (f === 3) {
    for (const s of [-1, 1]) side(s, () => { rot(g, 42, 110, .35, pincer); piece(g, r2, C(13, 104, 14, 84, 3)); piece(g, r, E(14, 80, 8, 8.5)); });
    eye(g, 76, 80, 4.6); eye(g, 104, 80, 4.6);
    piece(g, sand, S([[32, G], [32, G], [42, 108], [72, 98], [108, 98], [138, 108], [148, G], [148, G]]));
    ink(g, sand2, U(E(60, 114, 2, 1.6), E(84, 108, 2, 1.6), E(106, 116, 2, 1.6), E(124, 118, 2, 1.6), E(74, 121, 2, 1.6)));
    g.restore();
    return;
  }
  /** the claw on an arm: 0 low, 1 up, 2 high */
  const claw = up => { const ex = up === 0 ? 62 : up === 2 ? 48 : 54, ey = up === 0 ? 84 : up === 2 ? 46 : 64; piece(g, r2, C(36, 90, ex - 2, ey + 8, 5.5, 5)); rot(g, ex + 2, ey - 6, up === 0 ? .6 : up === 2 ? -.1 : .2, pincer); };
  g.save(); g.translate(90, 100); g.rotate(f === 1 ? -.07 : f === 2 ? .07 : 0); g.translate(-90, -100);
  for (const s of [-1, 1]) side(s, () => { for (const [x1, y1, x2, y2] of [[28, 106, 44, 122], [34, 100, 56, 114], [38, 94, 62, 102]]) piece(g, r2, C(x1, y1, x2, y2, 4, 2.8)); });
  side(1, () => claw(f === 1 ? 0 : f === 2 ? 2 : 1)); side(-1, () => claw(f === 1 ? 2 : f === 2 ? 0 : 1));
  for (const s of [-1, 1]) side(s, () => { piece(g, r2, C(12, 80, 14, 62, 3)); piece(g, r, E(14, 58, 8, 8.5)); });
  piece(g, r, E(90, 98, 42, 26));
  eye(g, 76, 58, 4.6); eye(g, 104, 58, 4.6);
  cheek(g, 66, 100, 7, 5, .5); cheek(g, 114, 100, 7, 5, .5); smile(g, 90, 98, 9, '#7A2E2A');
  g.restore(); g.restore();
}

// the seagull: white, a grey wing with a dark tip, an orange beak and feet. 0 stands, 1 flies with her wings up, 2 with her wings down, 3 stands with a little fish in her beak
function drawMeeuw(g, f) {
  const w = WHITE, gr = '#AEBBC6', gr2 = '#93A2AE', tip = '#4B3D3D', o = '#E2803E', o2 = '#C96A2E';
  const face = (x, y, fish) => {
    if (fish) { piece(g, '#8FB8D0', U(E(x + 27, y + 5, 5.5, 13, .12), P([[x + 25, y + 14], [x + 19, y + 27], [x + 31, y + 27]]))); ink(g, DARK, E(x + 28, y - 3, 1.4, 1.4)); }
    piece(g, o, S([[x + 12, y - 5], [x + 32, y + 1], [x + 33, y + 4], [x + 12, y + 8]]), .6);
    eye(g, x + 5, y - 3, 4.2); cheek(g, x + 1, y + 8, 5.5, 4);
  };
  if (f === 0 || f === 3) {
    piece(g, o2, C(84, 112, 84, 130, 2.2)); piece(g, o2, E(88, 133, 8, 3));
    piece(g, o, C(96, 112, 96, 130, 2.2)); piece(g, o, E(100, 133, 8, 3));
    piece(g, tip, S([[44, 90], [14, 92], [14, 92], [20, 104], [46, 104]]));
    piece(g, w, U(E(82, 94, 40, 23, -.1), C(104, 86, 116, 60, 16, 17)));
    piece(g, gr, S([[100, 86], [94, 104], [62, 110], [30, 100], [30, 100], [62, 84]]), .7);
    face(116, 58, f === 3);
    return;
  }
  const up = f === 1;
  g.save(); g.translate(0, up ? 4 : -3);
  piece(g, gr2, up ? S([[76, 72], [86, 20], [86, 20], [108, 42], [106, 72]]) : S([[76, 76], [88, 126], [88, 126], [106, 106], [106, 76]]));
  piece(g, w, S([[52, 70], [16, 66], [16, 66], [20, 82], [50, 84]]));
  piece(g, o2, E(58, 89, 8, 3.2));
  piece(g, w, U(E(84, 76, 38, 16, -.05), E(126, 68, 17, 16)));
  piece(g, gr, up ? S([[60, 76], [50, 22], [50, 22], [84, 40], [96, 76]]) : S([[60, 74], [58, 126], [58, 126], [86, 108], [96, 74]]), .8);
  piece(g, tip, up ? S([[51, 42], [50, 22], [50, 22], [68, 32], [60, 40]]) : S([[58, 106], [58, 126], [58, 126], [74, 114], [66, 106]]), .4);
  face(126, 68, false);
  g.restore();
}

// the little sea turtle, from the side: a green shell with paler plates, flippers, a round head.
// 0 stands, 1-2 walk (flippers forward and back), 3 has tucked herself into her shell: two eyes look out of the dark
function drawSchildpad(g, f) {
  const sh = '#6FAE7A', sh2 = '#57935F', pat = '#A5D29A', sk = '#BBDB8E', sk2 = '#9DC576', sw = step(f), tuck = f === 3;
  g.save(); g.translate(0, tuck ? 10 : 0);
  if (!tuck) {
    piece(g, sk2, C(118, 94, 134 - sw * 9, 109, 7.5, 5.5)); piece(g, sk2, C(58, 96, 50 + sw * 7, 109, 7, 5));
    piece(g, sk, S([[38, 90], [18, 96], [18, 96], [36, 103]]));
    piece(g, sk, U(C(126, 86, 150, 74, 11, 12), E(157, 70, 19, 17)));
    eye(g, 162, 66, 4.6); cheek(g, 154, 78, 6, 4.2); smile(g, 167, 76, 4);
  }
  piece(g, CREAM, C(44, 98, 124, 98, 7));
  piece(g, sh, S([[28, 96], [28, 96], [32, 62], [60, 42], [102, 42], [130, 62], [134, 96], [134, 96]]));
  for (const [x, y, rx, ry] of [[81, 61, 16, 11], [53, 76, 11, 10], [109, 76, 11, 10], [81, 83, 12, 5.5]]) piece(g, pat, E(x, y, rx, ry), .3);
  piece(g, sh2, C(34, 94, 128, 94, 5), .5);
  if (tuck) { ink(g, '#35573C', E(119, 82, 10, 6.5)); ink(g, '#fff', U(E(116, 81, 1.7, 1.9), E(123, 81, 1.7, 1.9))); }
  else { piece(g, sk, C(110, 96, 124 + sw * 9, 110, 8, 5.5)); piece(g, sk, C(50, 98, 40 - sw * 7, 110, 7, 5)); }
  g.restore();
}

// the dolphin, leaping: one arched body, turned about the middle of the card. 0 rises out of the water (nose up), 1 is at the top (level, most arched), 2 dives back in (nose down).
// No water on the card: the game adds the splash. She turns about (128, 112) in every frame: put that point of the three cards on the arc of her leap
function drawDolfijn(g, f) {
  const c = '#7F9DB8', c2 = '#6887A3', bel = '#EDF2F1', a = f === 1 ? 1.15 : .8;
  // half her thickness along her length, tail to beak: above her spine, below it; ys is the bend of her spine
  const st = [[-80, 5, 5], [-64, 8.5, 8.5], [-38, 18, 18], [-6, 26, 25], [26, 28, 26], [50, 25, 23], [64, 19, 19], [73, 10, 14], [82, 6, 9.5]];
  const ys = x => a * (30 * (x / 90) ** 2 - 9);
  g.save(); g.translate(128, 112); g.rotate(f === 0 ? -PI / 3 : f === 2 ? PI / 3 : 0); g.scale(1.08, 1.08);
  rot(g, -78, ys(-78), -Math.atan(.6 * a), () => piece(g, c2, S([[8, 0], [-8, -20], [-26, -24], [-16, 0], [-26, 24], [-8, 20]])));
  const yt = ys(-8) - 26;
  piece(g, c2, S([[6, yt + 6], [-10, yt - 20], [-28, yt - 26], [-22, yt - 6], [-30, yt + 8]]));
  piece(g, c, S([...st.map(([x, t]) => [x, ys(x) - t]), [88, ys(86) + 2], ...st.map(([x, , t]) => [x, ys(x) + t]).reverse(), [-84, ys(-82)]]));
  const bs = st.slice(2);
  piece(g, bel, S([...bs.map(([x, , t]) => [x, ys(x) + t * .3]), [85, ys(85) + 5], ...bs.map(([x, , t]) => [x, ys(x) + t - 2.5]).reverse()]), .4);
  const yb = ys(26) + 26;
  piece(g, c2, S([[36, yb - 12], [34, yb + 8], [20, yb + 22], [12, yb + 18], [16, yb - 2], [22, yb - 12]]), .7);
  line(g, '#4F6B85', 1.8, [[58, ys(58) + 6], [64, ys(64) + 10], [74, ys(74) + 8.5], [85, ys(85) + 3.5]]);
  eye(g, 54, ys(54) - 4, 5.6); cheek(g, 45, ys(45) + 7, 7, 5);
  g.restore();
}

// the seal, lying on her tummy with her head up: grey, a pale chest and muzzle, whiskers. 0 lies, 1 claps her front flippers, 2 balances a ball on her nose
function drawZeehond(g, f) {
  const c = '#A9B5BF', c2 = '#8F9CA8', pale = '#E3E8E9', G = 148, ball = f === 2;
  const hx = ball ? 132 : 138, hy = 72, tilt = ball ? -.55 : 0;
  g.save(); g.translate(8, 0);
  piece(g, c2, U(E(22, 122, 14, 6.5, -.6), E(18, 136, 14, 6.5, .1)));
  if (f === 1) piece(g, c2, C(122, 112, 158, 98, 8, 6));
  piece(g, c, U(S([[18, 134], [40, 108], [84, 100], [124, 106], [140, 128], [134, G], [80, G], [34, G - 2]]), C(112, 116, hx - 4, hy + 10, 25, 21), E(hx, hy, 24, 22)));
  piece(g, pale, S([[120, 144], [134, 128], [140, 106], [137, 94], [128, 104], [120, 124], [104, 140]]), .4);
  if (f === 1) piece(g, c, C(116, 126, 157, 107, 8.5, 6.5));
  else piece(g, c2, S([[104, 128], [124, 130], [152, 138], [154, G - 1], [114, G - 1]]), .8);
  rot(g, hx, hy, tilt, () => {
    piece(g, pale, E(15, 7, 12, 9), .4);
    piece(g, '#4B3D3D', E(24, 1, 4.6, 3.8), .4);
    eye(g, 5, -6, 5); cheek(g, -2, 8, 7, 5);
    for (const [x1, y1, x2, y2] of [[12, 5, 22, 4], [12, 8, 24, 9], [12, 11, 22, 14]]) line(g, c2, 1.2, [[x1, y1], [x2, y2]]);
    smile(g, 5, 13, 3.6);
  });
  if (ball) {
    piece(g, WHITE, E(157, 37, 15, 15));
    ink(g, '#D8574F', E(157, 37, 5, 14.6)); ink(g, '#6F9BCB', E(148, 37, 3, 11)); ink(g, '#F2CF5B', E(166, 37, 3, 11));
  }
  g.restore();
}

/* ---------------- the rainbow island and the castle ---------------- */

// the white rabbit: long ears with pink inside, a pink nose, a ball of a tail.
// 0 sits, 1 hops (stretched out in the air, ears flying), 2 lands (bunched up), 3 peeks out of a hole: only her head, ears and two paws, cut flat at the bottom
const RAB = { w: WHITE, w2: '#E2D6C1', pink: '#F6C3CF', nose: '#EE98B0' };
function rabEar(g, x, y, a, col) {
  rot(g, x, y, a, () => { piece(g, col, S([[-8, 4], [-12, -22], [-3, -46], [3, -46], [12, -22], [8, 4]])); ink(g, RAB.pink, S([[-3.5, -2], [-6.5, -20], [0, -37], [0, -37], [6.5, -20], [3.5, -2]])); });
}
function rabHead(g, x, y, e1, e2) {
  const k = RAB; g.save(); g.translate(x, y);
  rabEar(g, 2, -18, e2, k.w2);
  piece(g, k.w, U(E(0, 0, 27, 25), E(17, 8, 14, 12)));
  rabEar(g, -12, -16, e1, k.w);
  piece(g, k.nose, E(29, 5, 3.8, 3.2), .4);
  eye(g, 8, -4, 5.4); cheek(g, 2, 10, 8, 5.5); smile(g, 22, 13, 3.6);
  g.restore();
}
function drawKonijn(g, f) {
  g.save(); g.translate(7, 0); rabbit(g, f); g.restore();
}
function rabbit(g, f) {
  const k = RAB, G = 164;
  if (f === 3) {
    rabEar(g, 114, 104, .22, k.w2);
    piece(g, k.w, S([[72, G], [72, G], [70, 124], [88, 100], [118, 98], [140, 108], [152, 126], [154, G], [154, G]]));
    rabEar(g, 92, 106, -.2, k.w);
    piece(g, k.nose, E(148, 130, 3.8, 3.2), .4);
    eye(g, 126, 122, 5.4); cheek(g, 120, 138, 8, 5.5); smile(g, 141, 139, 3.6);
    piece(g, k.w, E(98, G - 5.5, 9, 5), .6); piece(g, k.w, E(128, G - 5.5, 9, 5), .6);
    return;
  }
  if (f === 1) {
    piece(g, k.w, E(28, 108, 8, 8));
    piece(g, k.w2, C(48, 122, 22, 142, 8, 5.5)); piece(g, k.w2, C(102, 120, 128, 134, 6.5, 5));
    piece(g, k.w, E(70, 112, 40, 22, -.12));
    piece(g, k.w, C(46, 116, 14, 132, 9.5, 6)); piece(g, k.w, C(98, 118, 122, 140, 7, 5.5));
    rabHead(g, 114, 84, -1.15, -.85);
    return;
  }
  if (f === 2) {
    piece(g, k.w, E(40, 120, 8, 8));
    piece(g, k.w2, C(104, 130, 118, 155, 6.5, 5.5));
    piece(g, k.w, E(74, 126, 34, 30, .15));
    piece(g, k.w, E(84, 157, 22, 6.5));
    piece(g, k.w, C(100, 132, 110, 156, 7, 6));
    rabHead(g, 112, 98, -.6, -.3);
    return;
  }
  piece(g, k.w, U(E(34, 142, 9, 9), E(30, 136, 6, 6)));
  piece(g, k.w, E(70, 128, 36, 33));
  piece(g, k.w, E(88, 157, 20, 6.5));
  piece(g, k.w, C(98, 126, 104, 152, 7.5, 6.5)); piece(g, k.w, E(108, 158, 9.5, 5));
  rabHead(g, 104, 88, -.3, .1);
}

// the parrot: red, with yellow and blue wings, a pale face and a big hooked beak. 0 perched, 1 wings spread, 2 beak open (talking)
function drawPapegaai(g, f) {
  const r = '#D8574F', r2 = '#BC463F', bl = '#5B8FD0', bl2 = '#4877B5', ye = '#F2CF5B', horn = '#F0D6AC', spread = f === 1, talk = f === 2;
  piece(g, bl2, C(70, 140, 28, 164, 10, 5.5)); piece(g, r2, C(74, 146, 40, 170, 9, 5));
  if (spread) piece(g, bl2, S([[84, 104], [60, 34], [66, 22], [84, 24], [102, 46], [104, 100]]));
  for (const [x, col] of [[86, '#7E736F'], [98, '#958A85']]) { piece(g, col, C(x, 154, x, 171, 2.6)); piece(g, col, E(x + 4, 174, 8, 3.4)); }
  piece(g, r, E(88, 120, 30, 40, .2));
  if (spread) {
    piece(g, bl, S([[96, 106], [42, 42], [18, 52], [18, 78], [32, 104], [56, 122], [80, 132]]));
    piece(g, ye, S([[94, 106], [52, 60], [36, 72], [38, 92], [60, 114], [82, 126]]), .6);
    piece(g, r, S([[94, 104], [66, 80], [58, 92], [68, 110], [84, 120]]), .6);
  } else {
    piece(g, bl, S([[62, 110], [94, 114], [88, 136], [66, 160], [56, 152], [56, 124]]), .8);
    piece(g, ye, S([[72, 96], [96, 106], [92, 124], [60, 120]]), .6);
  }
  rot(g, 104, 66, talk ? -.2 : 0, () => {
    rot(g, 19, 10, talk ? .8 : 0, () => piece(g, '#4B3D3D', S([[-2, -1], [12, 4], [9, 14], [-2, 10]])));
    if (talk) piece(g, '#EE8FA6', E(26, 15, 5.5, 4.5, .4), .4);
    piece(g, r, E(0, 0, 27, 25));
    piece(g, WHITE, E(9, 2, 14, 12.5), .4);
    piece(g, horn, S([[18, -12], [34, -10], [42, 4], [36, 20], [30, 14], [22, 8]]), .8);
    eye(g, 8, -1, 4.8); cheek(g, 5, 9, 5.5, 3.6);
  });
}

// the flamingo: pink, a long bent neck, a pale beak with a dark tip, standing on one leg with the other folded up.
// 0 stands on one leg, 1 has her head down in the water, 2 has her wings out
function drawFlamingo(g, f) {
  const p = '#F4A6C4', p2 = '#E888AE', p3 = '#D9608C', leg = '#E58AA6', dip = f === 1, open = f === 2;
  g.save(); g.translate(0, 10);
  piece(g, leg, C(78, 128, 78, 221, 2.8)); piece(g, leg, E(78, 176, 4.2, 4.2)); piece(g, leg, E(84, 224.5, 10, 3.5));
  piece(g, p2, strip([[88, 126], [100, 150], [84, 160]], 2.8));
  g.save(); if (dip) { g.translate(78, 128); g.rotate(.12); g.translate(-78, -128); }
  piece(g, p2, S([[46, 104], [22, 108], [22, 108], [30, 122], [52, 120]]));
  if (open) piece(g, p2, S([[62, 96], [58, 32], [58, 32], [88, 54], [92, 94]]));
  piece(g, p, E(74, 106, 36, 26, -.1));
  if (open) { piece(g, p2, S([[92, 100], [44, 42], [22, 46], [18, 70], [32, 96], [60, 116]])); piece(g, p3, S([[34, 46], [22, 46], [18, 70], [26, 86], [28, 64]]), .4); }
  else piece(g, p2, S([[86, 98], [80, 118], [52, 122], [30, 110], [30, 110], [58, 96]]), .7);
  g.restore();
  if (dip) {
    piece(g, p, U(strip([[104, 104], [124, 104], [136, 124], [138, 156], [136, 186], [132, 204]], 6), E(130, 210, 12.5, 11)));
    piece(g, WHITE, C(125, 217, 119, 221, 5, 4.4), .6); piece(g, '#4B3D3D', C(116, 222, 110, 221, 3.8, 2.6), .5);
    shut(g, 133, 209, 3.6);
  } else {
    piece(g, p, U(strip([[100, 98], [114, 86], [118, 68], [110, 52], [104, 36], [110, 24]], 6), E(116, 22, 12.5, 11)));
    piece(g, WHITE, C(125, 24, 134, 28, 5, 4.4), .6); piece(g, '#4B3D3D', C(136, 30, 134, 38, 4, 2.6), .5);
    eye(g, 118, 20, 3.6); cheek(g, 113, 27, 4, 2.8);
  }
  g.restore();
}

// the peacock: a blue bird with a little crown, and a green tail full of eyes. 0 the tail closed, trailing behind; 1 half open; 2 a great fan
const PAUW = { b: '#3E7CB8', b2: '#2F659C', gr: '#5FA777', gr2: '#4A8F63', gr3: '#3C7852', gold: '#E6B748', o: '#CF9C35', o2: '#B8872E', tan: '#C79A66' };
/** one eye of a tail feather: gold, blue, dark; turned by a, s times as big */
function pauwSpot(g, x, y, a, s = 1) {
  rot(g, x, y, a, () => { piece(g, PAUW.gold, E(0, 0, 9 * s, 10.5 * s), .3); ink(g, PAUW.b, E(0, 1.5 * s, 5.6 * s, 6.4 * s)); ink(g, '#2B3A6B', E(0, 2.5 * s, 2.8 * s, 3.2 * s)); });
}
/** the fan: n round feather ends on a circle round (cx, cy) from angle a0 to a1, a paler ring inside, an eye on every feather */
function pauwFan(g, cx, cy, R, a0, a1, n) {
  const k = PAUW, A = i => a0 + (a1 - a0) * i / (n - 1), at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const sector = r => P([[cx, cy], ...arc(cx, cy, r, a0, a1, 28)]), lr = (a1 - a0) * R / (n - 1) * .6;
  piece(g, k.gr2, U(sector(R), ...Array.from({ length: n }, (_, i) => E(...at(A(i), R), lr, lr))));
  piece(g, k.gr, U(sector(R * .72), ...Array.from({ length: n - 1 }, (_, i) => E(...at((A(i) + A(i + 1)) / 2, R * .72), lr * .8, lr * .8))), .6);
  for (let i = 0; i < n; i++) line(g, k.gr3, 1.4, [at(A(i), 18), at(A(i), R * .88)]);
  for (let i = 0; i < n; i++) pauwSpot(g, ...at(A(i), R + 1), A(i) + PI / 2);
  for (let i = 0; i < n - 1; i++) pauwSpot(g, ...at((A(i) + A(i + 1)) / 2, R * .64), (A(i) + A(i + 1)) / 2 + PI / 2, .72);
}
function drawPauw(g, f) {
  const k = PAUW;
  if (f === 0) {
    piece(g, k.gr2, S([[128, 152], [88, 160], [40, 180], [14, 194], [14, 194], [28, 204], [80, 198], [128, 182]]));
    piece(g, k.gr, S([[128, 158], [90, 168], [56, 182], [56, 182], [86, 190], [126, 178]]), .6);
    for (const [x, y, s] of [[38, 192, .62], [62, 186, .66], [88, 179, .7], [112, 171, .7]]) pauwSpot(g, x, y, -1.25, s);
  } else if (f === 1) pauwFan(g, 130, 168, 64, PI * .95, PI * 1.6, 6);
  else pauwFan(g, 132, 160, 92, PI * .96, PI * 2.04, 11);
  for (const [x, col] of [[140, k.o2], [152, k.o]]) { piece(g, col, C(x, 186, x, 201, 2.6)); piece(g, col, E(x + 4, 204.5, 8.5, 3.4)); }
  piece(g, k.b2, U(C(174, 108, 168, 90, 1.5), E(168, 88, 4, 4), C(178, 106, 179, 86, 1.5), E(179, 84, 4, 4), C(182, 108, 190, 92, 1.5), E(190, 90, 4, 4)));
  piece(g, k.b, U(E(146, 166, 30, 25), C(162, 154, 172, 130, 13, 10.5), E(176, 120, 15.5, 14.5)));
  piece(g, k.tan, S([[158, 156], [152, 176], [128, 180], [116, 166], [116, 166], [138, 152]]), .7);
  piece(g, WHITE, E(181, 120, 7.5, 6.5), .3);
  piece(g, k.o, S([[189, 115], [204, 121], [204, 122], [189, 126]]), .6);
  eye(g, 181, 119, 4);
}

// the baby dragon: mint green and round, a cream tummy, pink bumps down her back, tiny lilac wings, two horn nubs.
// 0 sits, 1 puffs a little smoke ring, 2 a small happy flame, 3 is asleep, curled up with her tail under her chin
const DRA = { c: '#9ED9CF', c2: '#7CC3B6', belly: '#FCF0D6', pink: '#F4A6C4', wing: '#BBA6EA', wing2: '#A08BD6', smoke: '#DCD8D2' };
/** mood: '' | 'puff' (a round mouth) | 'flame' (mouth open, eye shut with joy) | 'shut' (asleep) */
function draakHead(g, x, y, a, mood) {
  const k = DRA; g.save(); g.translate(x, y); g.rotate(a);
  piece(g, CREAM, E(-18, -31, 6, 10, -.35)); piece(g, CREAM, E(-2, -35, 6, 10, -.05));
  piece(g, k.pink, U(E(-35, -14, 7, 7), E(-38, 2, 7, 7)));
  piece(g, k.c, U(E(0, 0, 38, 35), E(30, 12, 22, 18)));
  piece(g, k.c2, S([[-14, -6], [-34, -22], [-42, -10], [-34, 4], [-16, 6]]), .7);
  ink(g, k.pink, S([[-18, -4], [-32, -15], [-37, -9], [-31, 0], [-19, 2]]));
  ink(g, k.c2, E(45, 5, 2.2, 3.2));
  if (mood === 'shut' || mood === 'flame') shut(g, 10, -2, 6.4); else eye(g, 10, -4, 6.4);
  ink(g, 'rgba(244,140,172,.8)', E(2, 14, 9, 6));
  if (mood === 'puff') ink(g, '#8A3D4C', E(47, 18, 3, 4));
  else if (mood === 'flame') ink(g, '#8A3D4C', S([[28, 18], [47, 15], [43, 26], [32, 27]]));
  else smile(g, 33, 19, 6);
  g.restore();
}
function drawDraakje(g, f) {
  g.save(); g.translate(4, 0); dragon(g, f); g.restore();
}
function dragon(g, f) {
  const k = DRA;
  if (f === 3) {
    piece(g, k.pink, U(E(48, 126, 7, 7), E(60, 112, 7.5, 7.5), E(78, 103, 7.5, 7.5), E(98, 101, 7.5, 7.5)));
    piece(g, k.c, E(88, 136, 50, 30));
    piece(g, k.wing, S([[68, 128], [54, 104], [68, 98], [80, 110], [90, 102], [98, 126]]), .8);
    draakHead(g, 150, 126, .25, 'shut');
    piece(g, k.pink, S([[126, 160], [138, 151], [147, 161], [137, 168]]));
    piece(g, k.c2, S([[40, 148], [52, 166], [100, 168], [130, 166], [130, 166], [100, 156], [60, 150]]));
    return;
  }
  piece(g, k.pink, S([[22, 134], [7, 118], [18, 105], [31, 119]]));
  piece(g, k.c2, S([[78, 146], [50, 164], [22, 158], [14, 134], [24, 126], [34, 140], [50, 146], [76, 130]]));
  piece(g, k.pink, U(E(50, 104, 7.5, 7.5), E(46, 122, 7.5, 7.5), E(50, 139, 7, 7)));
  piece(g, k.wing2, S([[70, 96], [52, 62], [62, 54], [84, 84]]));
  piece(g, k.c, E(88, 126, 40, 40));
  piece(g, k.belly, E(102, 132, 24, 29), .4);
  for (const y of [120, 132, 144]) line(g, '#EAD9B0', 1.6, arc(102, y - 30, 34, .36 * PI, .64 * PI));
  piece(g, k.c, E(108, 160, 20, 7.5));
  ink(g, k.c2, U(E(118, 160, 1.5, 3), E(123, 161, 1.5, 2.6)));
  piece(g, k.wing, S([[72, 108], [40, 84], [38, 68], [52, 72], [54, 58], [68, 66], [76, 56], [86, 92]]), .8);
  piece(g, k.c, C(112, 120, 126, 130, 7, 6));
  draakHead(g, 122, 68, 0, f === 1 ? 'puff' : f === 2 ? 'flame' : '');
  if (f === 1) { piece(g, k.smoke, E(181, 84, 4.5, 4.5)); piece(g, k.smoke, strip(arc(202, 71, 9.5, 0, 2 * PI, 14), 4.6)); }
  if (f === 2) {
    piece(g, '#E2803E', S([[166, 86], [180, 72], [200, 68], [216, 78], [204, 82], [220, 90], [204, 96], [212, 104], [190, 102], [174, 98]]));
    piece(g, '#F2CF5B', S([[172, 86], [184, 78], [198, 76], [206, 82], [196, 86], [204, 92], [190, 94], [178, 92]]), .4);
  }
}

/* ---------------- a thing to hold ---------------- */

// the kite: a red and yellow diamond on a cross of sticks, a tail of three bows. 0 the tail hangs straight, 1 it has swung left, 2 right
function drawVlieger(g, f) {
  const red = '#D8574F', ye = '#F2CF5B', wood = '#8D6A48', s = f === 1 ? -1 : f === 2 ? 1 : 0, cols = ['#6F9BCB', ye, red];
  const T = [70, 14], R = [116, 72], B = [70, 148], L = [24, 72], M = [70, 72];
  const pts = [B, [73 + s * 7, 168], [67 + s * 15, 188], [72 + s * 24, 208], [70 + s * 30, 222]];
  piece(g, wood, strip(pts, 1.3));
  pts.slice(1, 4).forEach(([x, y], i) => rot(g, x, y, s * .35 + (i % 2 ? -.2 : .2), () => { piece(g, cols[i], U(P([[0, 0], [-13, -7.5], [-13, 7.5]]), P([[0, 0], [13, -7.5], [13, 7.5]]))); piece(g, cols[i], E(0, 0, 3, 3), .4); }));
  piece(g, red, P([T, R, B, L]));
  ink(g, ye, P([T, R, M])); ink(g, ye, P([L, M, B]));
  line(g, wood, 2.2, [[70, 20], [70, 142]]); line(g, wood, 2.2, [[30, 72], [110, 72]]);
}

/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is */
export const ANIMALS2 = {
  schaap: { w: 210, h: 190, draw: drawSchaap, frames: 5, size: 1.2, does: ['stand', 'walk', 'walk', 'puffed', 'shorn'] },
  lam: { w: 160, h: 160, draw: drawLam, frames: 4, size: .75, does: ['stand', 'walk', 'walk', 'leap'] },
  bij: { w: 96, h: 88, draw: drawBij, frames: 2, size: .22, does: ['wings up', 'wings down'] },
  otter: { w: 200, h: 110, draw: drawOtter, frames: 3, size: .5, does: ['float', 'tap', 'dive'] },
  krab: { w: 192, h: 140, draw: drawKrab, frames: 4, size: .5, does: ['claws up', 'left high', 'right high', 'dug in'] },
  meeuw: { w: 180, h: 148, draw: drawMeeuw, frames: 4, size: .7, does: ['stand', 'wings up', 'wings down', 'fish'] },
  schildpad: { w: 190, h: 128, draw: drawSchildpad, frames: 4, size: .5, does: ['stand', 'walk', 'walk', 'tucked'] },
  dolfijn: { w: 240, h: 240, draw: drawDolfijn, frames: 3, size: 1.3, does: ['rise', 'top', 'dive'] },
  zeehond: { w: 198, h: 160, draw: drawZeehond, frames: 3, size: .8, does: ['lie', 'clap', 'ball'] },
  konijn: { w: 176, h: 176, draw: drawKonijn, frames: 4, size: .6, does: ['sit', 'hop', 'land', 'peek'] },
  papegaai: { w: 170, h: 190, draw: drawPapegaai, frames: 3, size: .6, does: ['perched', 'wings', 'talk'] },
  flamingo: { w: 160, h: 250, draw: drawFlamingo, frames: 3, size: 1.15, does: ['one leg', 'head down', 'wings out'] },
  pauw: { w: 264, h: 220, draw: drawPauw, frames: 3, size: 1.2, does: ['closed', 'half open', 'fan'] },
  draakje: { w: 240, h: 180, draw: drawDraakje, frames: 4, size: .9, does: ['sit', 'smoke ring', 'flame', 'asleep'] },
  vlieger: { w: 140, h: 240, draw: drawVlieger, frames: 3, size: .9, does: ['straight', 'left', 'right'] },
};
