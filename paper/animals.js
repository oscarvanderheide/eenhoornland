// The small animals of the paper world, cut by the same scissors as the unicorns (see STYLE.md): few round pieces of
// sugar paper on a white card, dot eyes, a pink cheek. All face right (the world flips them). The sheet is animals.html.
import { E, S, C, U, P, piece, ink, line, eye } from './cut.js';

const DARK = '#33262E', PI = Math.PI;
/** legs forward, legs back (frames 1 and 2 of a simple walker) */
const step = f => f === 1 ? 1 : f === 2 ? -1 : 0;
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shut eye: a little arc hanging down */
const shut = (g, x, y, r = 4.6) => line(g, DARK, 2.2, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
const smile = (g, x, y, r = 5, col = '#8A3D4C') => line(g, col, 2, arc(x, y, r, .15 * PI, .85 * PI));
const cheek = (g, x, y, rx = 7, ry = 5) => ink(g, 'rgba(240,120,150,.4)', E(x, y, rx, ry));

// the puppy: cream with brown patches, a floppy ear, a stump of a tail. 0 stands, 1-2 walk (the tail wags), 3 sits with her tongue out, 4 lies on her back, paws up
const DOG = { c: '#F4ECDC', c2: '#DDCFB6', patch: '#C79A66', ear: '#8D6A48', tongue: '#EE8FA6', pad: '#E9A0AE' };
function dogHead(g, x, y, rot, tongue, happy) {
  const d = DOG; g.save(); g.translate(x, y); g.rotate(rot);
  if (tongue) piece(g, d.tongue, C(30, 24, 31, 37, 5.5));
  piece(g, d.c, U(E(0, 0, 36, 33), E(26, 14, 21, 17)));
  piece(g, d.patch, E(9, -9, 15, 14), .4);
  piece(g, d.ear, S([[-24, -26], [-4, -30], [-6, 2], [-18, 26], [-32, 18], [-34, -8]]));
  piece(g, '#4B3D3D', E(44, 7, 6, 5), .5);
  if (happy) shut(g, 12, -5, 5.2); else eye(g, 12, -7, 5.2);
  cheek(g, 13, 13, 8, 5.5); smile(g, 33, 19, 6);
  g.restore();
}
function drawHond(g, f) {
  const sw = step(f) * 7, d = DOG;
  if (f === 3) {
    piece(g, d.ear, C(54, 132, 36, 124, 6.5, 5));
    piece(g, d.c2, C(110, 104, 112, 130, 8)); piece(g, d.c2, E(115, 135, 10, 5));
    piece(g, d.c, U(E(78, 114, 30, 28), C(84, 110, 100, 90, 24, 20)));
    piece(g, d.patch, E(72, 104, 14, 12), .4);
    piece(g, d.c, E(72, 124, 23, 17)); piece(g, d.c, E(92, 136.5, 14, 5.5));
    piece(g, d.c, C(100, 106, 101, 131, 9)); piece(g, d.c, E(104, 136.5, 11, 5.5));
    dogHead(g, 124, 60, 0, true, false);
    return;
  }
  if (f === 4) {
    piece(g, d.ear, C(38, 126, 22, 118, 6.5, 5));
    piece(g, d.c2, C(52, 106, 40, 90, 8)); piece(g, d.c2, C(100, 102, 110, 82, 8));
    piece(g, d.c, E(78, 116, 42, 26));
    piece(g, d.patch, E(56, 124, 15, 10), .4);
    piece(g, d.c, C(66, 106, 58, 78, 9.5)); piece(g, d.c, C(88, 106, 92, 76, 9.5));
    ink(g, d.pad, U(E(57, 75, 4.5, 4), E(92, 73, 4.5, 4)));
    dogHead(g, 130, 108, -.55, true, true);
    return;
  }
  const wag = f === 1 ? 8 : f === 2 ? -6 : 0;
  piece(g, d.ear, C(42, 88, 30 + wag, 68, 6.5, 5));
  piece(g, d.c2, C(76, 108, 76 + sw, 129, 7.5)); piece(g, d.c2, E(79 + sw, 134, 9.5, 4.8));
  piece(g, d.c2, C(116, 106, 116 - sw, 129, 7.5)); piece(g, d.c2, E(119 - sw, 134, 9.5, 4.8));
  piece(g, d.c, E(80, 96, 44, 27));
  piece(g, d.patch, E(64, 87, 18, 13), .4);
  piece(g, d.c, C(60, 108, 60 - sw, 132, 8.5)); piece(g, d.c, E(63 - sw, 137, 10.5, 5));
  piece(g, d.c, C(102, 110, 102 + sw, 132, 8.5)); piece(g, d.c, E(105 + sw, 137, 10.5, 5));
  dogHead(g, 130, 64, 0, false, false);
}

// the hen: plump and cream. 0 stands, 1-2 walk, 3 sits on her nest (lower, fluffed up, eye shut)
function drawKip(g, f) {
  const sw = step(f), sit = f === 3, hy = sit ? 4 : 0, c = '#FCF8F1', c2 = '#E2D6C1', red = '#D8574F', o = '#E2803E', o2 = '#C96A2E';
  if (!sit) {
    piece(g, o2, C(56, 86, 56 - sw * 5, 97, 2.2)); piece(g, o2, E(59 - sw * 5, 99.5, 7, 2.6));
    piece(g, o, C(68, 86, 68 + sw * 5, 97, 2.2)); piece(g, o, E(71 + sw * 5, 99.5, 7, 2.6));
  }
  g.save(); g.translate(sit ? 0 : sw, sit ? 11 : 0);
  // tail feathers, the comb behind the head
  piece(g, c, E(23, 55, 7, 15, -.85)); piece(g, c, E(28, 47, 8, 18, -.45)); piece(g, c, E(38, 45, 7.5, 17, -.1));
  piece(g, red, U(E(81, 24 + hy, 5.5, 7), E(89, 21 + hy, 6, 7.5), E(97, 25 + hy, 5, 6.5)));
  // body and head in one piece
  piece(g, c, U(E(60, 66, sit ? 39 : 35, 25), C(78, 60 - hy / 2, 88, 42 + hy, 16, 18.5)));
  piece(g, c2, S([[74, 64], [70, 78], [48, 80], [28, 68], [28, 68], [52, 58]]), .7);
  piece(g, red, E(102, 56 + hy, 3.8, 5.8), .5);
  piece(g, o, S([[104, 39 + hy], [118, 44 + hy], [118, 44 + hy], [104, 50 + hy]]), .6);
  if (sit) shut(g, 94, 44 + hy, 4.4); else eye(g, 94, 40, 4.4);
  cheek(g, 90, 51 + hy, 5.5, 4);
  g.restore();
}

// the chick, a yellow ball. 0 stands, 1 hops a step (off the ground), 2 lands with the other foot forward
function drawKuiken(g, f) {
  const sw = step(f), up = f === 1 ? -3 : 0, y = '#F2CF5B', y2 = '#E0B441', o = '#E2803E', o2 = '#C96A2E';
  g.save(); g.translate(0, 4);
  piece(g, o2, C(34, 54 + up, 34 - sw * 4, 60 + up, 1.8)); piece(g, o2, E(36 - sw * 4, 62 + up, 5, 2.2));
  piece(g, o, C(43, 54 + up, 43 + sw * 4, 60, 1.8)); piece(g, o, E(45 + sw * 4, 62, 5, 2.2));
  g.translate(0, up);
  piece(g, y2, S([[22, 46], [11, 33], [11, 33], [28, 36]]));
  piece(g, y, E(37, 45, 18, 15.5));
  piece(g, y, S([[47, 19], [49, 10], [49, 10], [54, 17]])); piece(g, y, S([[52, 17], [57, 11], [57, 11], [59, 19]]));
  piece(g, y, E(52, 30, 17, 16));
  piece(g, y2, S([[38, 44], [40, 53], [29, 55], [20, 47], [20, 47], [29, 43]]), .6);
  piece(g, o, S([[67, 28], [78, 32.5], [78, 32.5], [67, 37]]), .6);
  eye(g, 59, 28, 3.4); cheek(g, 56, 37, 4.5, 3);
  g.restore();
}

// the pig: round and pink with a curly tail. 0 stands, 1-2 walk, 3 lies in the mud (legs tucked, eye shut, mud on her belly)
function drawVarken(g, f) {
  const sw = step(f) * 5, mud = f === 3, p = '#F6BFCB', p2 = '#E7A0B3', sn = '#EE98B0', m = '#8D6A48';
  const curl = [[40, 72], [29, 69], [22, 60], [26, 51], [34, 53], [33, 60]];
  g.save(); g.translate(0, mud ? 14 : 0); piece(g, p2, U(...curl.slice(1).map((q, i) => C(...curl[i], ...q, 3)))); g.restore();
  if (!mud) {
    piece(g, p2, C(58, 104, 58 + sw, 116, 8)); piece(g, sn, E(58 + sw, 120, 8, 4), .5);
    piece(g, p2, C(110, 104, 110 - sw, 116, 8)); piece(g, sn, E(110 - sw, 120, 8, 4), .5);
  } else piece(g, p2, E(122, 121, 14, 5.5));
  piece(g, p, mud ? E(78, 96, 50, 30) : E(78, 80, 44, 35));
  if (!mud) {
    piece(g, p, C(68, 106, 68 - sw, 118, 9)); piece(g, sn, E(68 - sw, 122.5, 9, 4.2), .5);
    piece(g, p, C(98, 106, 98 + sw, 118, 9)); piece(g, sn, E(98 + sw, 122.5, 9, 4.2), .5);
  }
  g.save(); g.translate(0, mud ? 14 : 0);
  piece(g, p2, S([[132, 50], [144, 22], [154, 32], [154, 54]]));
  piece(g, p, E(128, 72, 34, 32));
  piece(g, sn, S([[104, 58], [104, 26], [120, 28], [130, 48]]));
  piece(g, sn, E(160, 80, 11, 13), .6); ink(g, '#B9667C', U(E(157.5, 79, 2, 3.2), E(163.5, 79, 2, 3.2)));
  if (mud) shut(g, 140, 68, 5.4); else eye(g, 140, 66, 5.4);
  cheek(g, 134, 86, 9, 6); smile(g, 149, 94, mud ? 6 : 5);
  g.restore();
  if (mud) {
    piece(g, m, S([[26, 108], [40, 102], [56, 110], [72, 104], [90, 112], [106, 108], [118, 116], [116, 125], [78, 126], [36, 125]]), .5);
    ink(g, m, U(E(52, 86, 7, 5), E(66, 93, 3.5, 3), E(90, 84, 5, 4)));
  }
}

// the white duck on the pond, drawn from the waterline up. 0 floats, 1 dives: head down, round bottom and tail in the air, feet paddling
function drawEend(g, f) {
  const w = '#FCF8F1', w2 = '#E2D6C1', o = '#E2803E', o2 = '#C96A2E';
  if (f === 1) {
    piece(g, o2, P([[82, 60], [85, 30], [92, 39], [99, 30], [102, 42], [112, 41]]));
    piece(g, w, U(S([[40, 102], [40, 102], [24, 84], [30, 54], [50, 40], [74, 40], [96, 54], [106, 80], [100, 102], [100, 102]]), S([[38, 58], [44, 16], [44, 16], [70, 44]])));
    piece(g, w2, S([[48, 96], [38, 74], [48, 50], [48, 50], [68, 68], [66, 92]]), .7);
    piece(g, o, P([[92, 80], [103, 49], [110, 59], [119, 52], [121, 64], [129, 67]]), .8);
    return;
  }
  piece(g, w, U(S([[30, 102], [30, 102], [15, 90], [11, 56], [11, 56], [34, 76], [56, 72], [72, 70], [104, 66], [114, 90], [98, 102], [98, 102]]), C(88, 58, 86, 76, 13), E(92, 45, 20, 19)));
  piece(g, w2, S([[78, 82], [66, 95], [40, 93], [22, 76], [22, 76], [50, 77]]), .7);
  piece(g, o, S([[109, 41], [129, 45], [129, 51], [109, 54]]), .6);
  eye(g, 98, 41, 4.4); cheek(g, 95, 52, 6, 4);
}

// the hedgehog: a cream face under a back of pointed pieces. 0 stands, 1-2 walk, 3 is rolled into a ball of spikes
const burst = (cx, cy, rx1, ry1, rx0, ry0, n, a0 = 0, a1 = 2 * PI) => P(Array.from({ length: 2 * n + (a1 - a0 < 6.2 ? 1 : 0) }, (_, i) => { const a = a0 + (a1 - a0) * i / (2 * n), t = i % 2; return [cx + Math.cos(a) * (t ? rx1 : rx0), cy + Math.sin(a) * (t ? ry1 : ry0)]; }));
function drawEgel(g, f) {
  const sw = step(f), b = '#7A5A3E', b2 = '#8D6A48', b3 = '#A9825A', c = '#F4ECDC', c2 = '#DDCFB6';
  if (f === 3) {
    piece(g, b, burst(62, 51, 31, 29, 24, 22, 14)); piece(g, b2, burst(61, 50, 23, 21, 17, 15.5, 11, .3, .3 + 2 * PI), .8); piece(g, b3, burst(60, 49, 14, 12.5, 9, 8, 8, .1, .1 + 2 * PI), .8);
    return;
  }
  piece(g, c2, C(50, 70, 50 + sw * 3, 75, 4.5)); piece(g, c2, C(90, 70, 90 - sw * 3, 75, 4.5));
  piece(g, b, burst(52, 56, 42, 36, 35, 29, 9, .8 * PI, 2 * PI));
  piece(g, c, S([[22, 72], [26, 48], [60, 38], [100, 36], [122, 62], [122, 62], [102, 79], [60, 80]]));
  piece(g, c, C(40, 72, 40 - sw * 3, 76, 5)); piece(g, c, C(82, 72, 82 + sw * 3, 76, 5));
  piece(g, b2, burst(50, 51, 34, 24, 28, 18.5, 12, .15, .15 + 2 * PI), .8);
  piece(g, b3, burst(48, 49, 21, 14, 15, 9.5, 8, 0, 2 * PI), .8);
  piece(g, '#C79A66', E(85, 42, 6.5, 7), .6);
  piece(g, '#4B3D3D', E(121, 61, 4.2, 3.8), .4);
  eye(g, 101, 55, 4.2); cheek(g, 96, 66, 6.5, 4.5); smile(g, 109, 66, 3.5);
}

// the owl, sitting upright and looking at us. 0 awake, 1 asleep (eyes are little arcs, head sunk), 2 hoots with her wings out
function drawUil(g, f) {
  const b = '#8D6A48', b2 = '#7A5A3E', c = '#F4ECDC', tan = '#D9B98C', o = '#E2803E', hy = f === 1 ? 5 : f === 2 ? -3 : 0, mir = pts => pts.map(([x, y]) => [156 - x, y]).reverse();
  const wing = f === 2 ? [[52, 70], [22, 56], [10, 78], [22, 98], [36, 96], [44, 108], [56, 96]] : [[46, 72], [38, 96], [50, 120], [60, 98], [56, 76]];
  piece(g, b, E(78, 90, 34, 35));
  piece(g, tan, E(78, 98, 21, 24), .5);
  for (const [x, y] of [[70, 94], [86, 94], [78, 104], [68, 110], [88, 110]]) line(g, b, 2, [[x - 3.5, y - 2], [x, y + 1.5], [x + 3.5, y - 2]]);
  piece(g, b2, S(wing), .8); piece(g, b2, S(mir(wing)), .8);
  piece(g, o, E(66, 124, 8.5, 4.5), .6); piece(g, o, E(90, 124, 8.5, 4.5), .6);
  g.save(); g.translate(0, hy);
  piece(g, b2, S([[46, 42], [40, 14], [40, 14], [68, 30]])); piece(g, b2, S(mir([[46, 42], [40, 14], [40, 14], [68, 30]])));
  piece(g, b, E(78, 54, 42, 34));
  piece(g, c, U(E(63, 57, 19, 18), E(97, 57, 19, 18)), .5);
  piece(g, o, S([[74, 62], [80, 59], [86, 62], [80, 75], [80, 75]]), .6);
  if (f === 1) { shut(g, 64, 60, 7); shut(g, 96, 60, 7); } else { eye(g, 65, 57, 6.5); eye(g, 97, 57, 6.5); }
  cheek(g, 52, 69, 6, 4); cheek(g, 108, 69, 6, 4);
  g.restore();
}

// the squirrel: russet with a big curled tail. 0 sits up, 1-2 run (stretched out, then gathered), 3 sits holding an acorn
function drawEekhoorn(g, f) {
  const r = '#C9743F', r2 = '#A85C30', li = '#E3A56C', c = '#F4ECDC', run = f === 1 || f === 2;
  const head = (x, y) => {
    g.save(); g.translate(x, y);
    piece(g, r2, S([[86, 36], [84, 12], [92, 10], [100, 30]]));
    piece(g, r, U(E(104, 47, 24, 22), E(121, 55, 11, 9.5)));
    piece(g, r, S([[95, 32], [95, 12], [104, 11], [112, 30]]));
    piece(g, c, E(117, 57, 10, 6), .4);
    piece(g, '#4B3D3D', E(131, 53, 3.4, 3), .4);
    eye(g, 111, 45, 5); cheek(g, 104, 58, 6, 4);
    g.restore();
  };
  if (run) {
    const a = f === 1;
    piece(g, r, S(a ? [[60, 80], [44, 96], [14, 86], [8, 58], [24, 40], [44, 46], [38, 58], [42, 70]] : [[60, 82], [40, 92], [16, 72], [14, 42], [34, 22], [56, 30], [48, 44], [46, 62]]));
    piece(g, li, S(a ? [[48, 82], [26, 80], [20, 60], [30, 50], [32, 64]] : [[46, 78], [28, 68], [26, 46], [38, 34], [38, 52]]), .6);
    if (a) { piece(g, r2, C(64, 90, 50, 106, 6, 4.5)); piece(g, r2, C(98, 90, 116, 104, 5, 4)); }
    else { piece(g, r2, C(62, 96, 78, 108, 5.5, 4)); piece(g, r2, C(106, 90, 106, 107, 5, 4)); }
    g.save(); g.translate(0, a ? 0 : -4);
    piece(g, r, E(80, 86, 32, 17, a ? -.05 : -.2));
    piece(g, c, E(92, 94, 16, 7, a ? -.05 : -.2), .5);
    g.restore();
    if (a) { piece(g, r, C(60, 92, 42, 104, 7.5, 5)); piece(g, r, C(102, 92, 124, 102, 5.5, 4.5)); }
    else { piece(g, r, E(64, 92, 15, 13)); piece(g, r, C(66, 104, 86, 109, 5.5, 4.5)); piece(g, r, C(100, 92, 96, 108, 5.5, 4.5)); }
    head(14, a ? 18 : 12);
    return;
  }
  piece(g, r, S([[60, 104], [30, 110], [12, 80], [14, 42], [30, 14], [58, 14], [72, 34], [62, 52], [50, 44], [46, 60], [54, 80], [68, 96]]));
  piece(g, li, S([[42, 94], [26, 72], [28, 44], [40, 28], [56, 28], [60, 40], [48, 38], [38, 50], [38, 72], [50, 90]]), .6);
  piece(g, r, E(84, 84, 22, 27, -.12));
  piece(g, c, E(93, 86, 11, 18, -.1), .5);
  piece(g, r, E(76, 100, 19, 13)); piece(g, r, E(92, 109.5, 13, 4.8));
  head(0, 0);
  if (f === 3) {
    piece(g, '#C79A66', E(110, 82, 8, 9), .6); piece(g, '#7A5A3E', U(E(110, 75, 9, 4.5), C(110, 72, 111, 68, 1.6)), .6);
    piece(g, r, C(90, 76, 104, 84, 5.5, 5));
  } else piece(g, r, C(90, 78, 103, 86, 5.5, 5));
}

// the fawn: light brown with white spots on her back, big leaf ears, long thin legs, a cream tail that stands up.
// 0 stands, 1-2 walk, 3 grazes (head down in the grass, eye shut), 4 has heard something (head high, ears straight up, tail up)
const HERT = { c: '#DBA772', c2: '#BF8A58', cream: '#F4ECDC', spot: '#FCF8F1', inner: '#F2C4BC', hoof: '#7A5A3E' };
function fawnEar(g, x, y, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  piece(g, col, S([[-9, 4], [-15, -20], [-3, -44], [3, -44], [15, -20], [9, 4]]));
  ink(g, HERT.inner, S([[-4, -2], [-8, -19], [0, -36], [0, -36], [8, -19], [4, -2]]));
  g.restore();
}
function fawnHead(g, x, y, rot, e1, e2, look) {
  const d = HERT; g.save(); g.translate(x, y); g.rotate(rot); g.scale(1.1, 1.1);
  fawnEar(g, 6, -19, e2, d.c2);
  piece(g, d.c, U(E(0, 0, 29, 27), E(23, 10, 15, 12.5)));
  piece(g, d.cream, E(27, 14, 10, 7.5), .4);
  fawnEar(g, -15, -15, e1, d.c);
  piece(g, '#4B3D3D', E(36.5, 7, 4, 3.5), .4);
  if (look === 'shut') shut(g, 9, -1, 5.6); else eye(g, 9, -3, look === 'wide' ? 6.6 : 5.8);
  cheek(g, 3, 12, 8, 5.5); smile(g, 25, 15, 3.6);
  g.restore();
}
function drawHert(g, f) {
  const d = HERT, sw = step(f) * 7, graze = f === 3, alert = f === 4;
  const leg = (x, s, col) => { piece(g, col, C(x, 158, x + s, 189, 6.5, 5.5)); piece(g, d.hoof, E(x + s + 1, 194.5, 7.5, 5), .5); };
  g.save(); g.translate(0, 10);
  leg(66, sw, d.c2); leg(112, -sw, d.c2);
  piece(g, d.cream, alert ? E(41, 117, 5.5, 12, -.1) : E(37 - step(f) * 2, 124, 5.5, 10.5, -.7 - step(f) * .3));
  // body and neck in one piece
  piece(g, d.c, U(E(80, 140, 42, 26), graze ? C(104, 136, 138, 150, 17, 14) : alert ? C(104, 132, 116, 94, 17, 14) : C(104, 132, 124, 102, 17, 14)));
  piece(g, d.cream, E(82, 157, 24, 7), .4);
  for (const [x, y] of [[57, 129], [71, 121], [87, 123], [66, 138], [82, 135], [98, 131]]) piece(g, d.spot, E(x, y, 4.3, 4), .3);
  leg(52, -sw, d.c); leg(98, sw, d.c);
  if (graze) fawnHead(g, 148, 157, .9, -1.5, -.9, 'shut');
  else if (alert) fawnHead(g, 122, 74, -.15, .1, .32, 'wide');
  else fawnHead(g, 132, 86, 0, -.6, .15, '');
  g.restore();
}

// the boar piglet: brown and round, cream stripes along her back, a soft snout, a little tail with a tuft.
// 0 stands, 1-2 walk, 3 roots in the earth (snout in the ground, bottom in the air, eye shut)
function drawZwijn(g, f) {
  const sw = step(f) * 5, root = f === 3, b = '#A0744E', b2 = '#825A3C', st = '#EBD3A4', sn = '#DDA38E', hoof = '#4B3D3D';
  const tilt = fn => { g.save(); if (root) { g.translate(92, 112); g.rotate(.4); g.translate(-92, -112); } fn(); g.restore(); };
  const leg = (x1, y1, x2, y2, r, col) => { piece(g, col, C(x1, y1, x2, y2, r)); piece(g, hoof, E(x2 + 1, y2 + r - 3, r + .5, 4.2), .5); };
  // a stripe along her back: a bent strip that follows the round of the body, flatter the lower it lies
  const stripe = (ky, x0, x1) => { const at = i => { const x = x0 + (x1 - x0) * i / 6; return [x, 72 - 33 * ky * Math.sqrt(1 - ((x - 76) / 47) ** 2)]; }; return U(...Array.from({ length: 6 }, (_, i) => C(...at(i), ...at(i + 1), 2.8))); };
  tilt(() => { const wag = step(f) * 5; piece(g, b2, C(38, 64, 25 + wag, 50, 3.6, 2.8)); piece(g, b2, E(23 + wag, 47, 5, 4.4)); });
  if (root) { leg(52, 84, 48, 106, 7, b2); leg(112, 100, 122, 106, 7, b2); }
  else { leg(58, 94, 58 + sw, 106, 7, b2); leg(110, 94, 110 - sw, 106, 7, b2); }
  tilt(() => {
    piece(g, b, E(76, 72, 44, 33));
    piece(g, st, stripe(.8, 44, 100), .3); piece(g, st, stripe(.5, 38, 100), .3); piece(g, st, stripe(.16, 36, 100), .3);
  });
  if (root) { leg(64, 88, 60, 107, 8, b); leg(100, 102, 108, 107, 8, b); }
  else { leg(68, 96, 68 - sw, 107, 8, b); leg(100, 96, 100 + sw, 107, 8, b); }
  tilt(() => {
    piece(g, b2, S([[126, 50], [134, 26], [146, 34], [148, 54]]));
    piece(g, b, U(E(122, 70, 31, 29), E(145, 78, 16, 14)));
    piece(g, b2, S([[102, 56], [102, 28], [117, 30], [126, 50]]));
    piece(g, sn, E(158, 79, 8.5, 11.5), .6); ink(g, '#A8685C', U(E(156, 78, 1.7, 2.8), E(160.5, 78, 1.7, 2.8)));
    if (root) shut(g, 133, 66, 5.2); else eye(g, 133, 64, 5.2);
    cheek(g, 127, 82, 8, 5.5); smile(g, 143, 86, 4.5);
  });
  // the earth she turns over
  if (root) { piece(g, '#7A5A3E', S([[142, 119], [146, 106], [158, 103], [170, 107], [176, 119], [176, 119], [142, 119]]), .6); piece(g, '#7A5A3E', E(172, 94, 3.6, 3.2), .6); }
}

/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is */
export const ANIMALS = {
  hond: { w: 194, h: 152, draw: drawHond, frames: 5, size: .8, does: ['stand', 'walk', 'walk', 'sit', 'roll'] },
  kip: { w: 132, h: 112, draw: drawKip, frames: 4, size: .55, does: ['stand', 'walk', 'walk', 'nest'] },
  kuiken: { w: 88, h: 78, draw: drawKuiken, frames: 3, size: .3, does: ['stand', 'walk', 'walk'] },
  varken: { w: 184, h: 136, draw: drawVarken, frames: 4, size: .75, does: ['stand', 'walk', 'walk', 'mud'] },
  eend: { w: 140, h: 112, draw: drawEend, frames: 2, size: .6, does: ['float', 'dive'] },
  egel: { w: 136, h: 90, draw: drawEgel, frames: 4, size: .45, does: ['stand', 'walk', 'walk', 'ball'] },
  uil: { w: 156, h: 138, draw: drawUil, frames: 3, size: .7, does: ['awake', 'asleep', 'hoot'] },
  eekhoorn: { w: 160, h: 124, draw: drawEekhoorn, frames: 4, size: .6, does: ['sit', 'run', 'run', 'acorn'] },
  hert: { w: 200, h: 220, draw: drawHert, frames: 5, size: 1, does: ['stand', 'walk', 'walk', 'graze', 'alert'] },
  zwijn: { w: 190, h: 128, draw: drawZwijn, frames: 4, size: .6, does: ['stand', 'walk', 'walk', 'root'] },
};
