// The grown-ups of the paper world and the small things they hold, cut by the same scissors as the sisters (see STYLE.md
// and kids.js): a big round head, dot eyes, a small smile, pink cheeks, rounded limbs, few flat pieces on a white card.
// They are the same paper dolls as Anna, only taller, with their own clothes. All face right (the world flips them).
// Whatever somebody holds or sits in is part of his drawing. People are drawn at 200 units a step, like Anna. The sheet is people.html.
import { E, S, C, U, P, piece, ink, line } from './cut.js';

const DARK = '#33262E', PI = Math.PI, WHITE = '#FCF8F1', CREAM = '#F4ECDC', SAND = '#E2D6C1', MOUTH = '#8A3D4C';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shape with straight sides and corners rounded by r (a box, a tray, a hat) */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** a bent strip of paper: capsules along a row of points */
const strip = (pts, r) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r)));
/** stripes printed on one piece: bands `w` wide every `step`, across (or down when `down`) */
function stripes(g, shape, col, step, w, down, off = 0) {
  if (!g.colour) return;
  g.save(); g.beginPath(); shape(g); g.clip(); g.fillStyle = col;
  for (let v = -100 + off; v < 600; v += step) down ? g.fillRect(v, -100, w, 800) : g.fillRect(-100, v, 800, w);
  g.restore();
}
/** printed pictures that stay inside one shape (a painting on its canvas) */
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
/** turn what `fn` draws by `rot` about (x, y) */
const turn = (g, x, y, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.translate(-x, -y); fn(); g.restore(); };
/** something drawn about (0, 0), put at (x, y), k times as big, turned by rot */
const put = (g, x, y, k, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); fn(); g.restore(); };

/* ---------- the doll: a head with a face, arms and legs that bend ---------- */
const SKIN = { rose: ['#F4CDB0', '#E2B293'], sun: ['#EBBD98', '#D4A27C'], brown: ['#C99168', '#B07B55'] };
/** an eye: 'open' a dot with a glint, 'wide' a bigger dot, 'shut' a little arc hanging down (asleep), 'glad' an arc standing up (laughing) */
function eyeAt(g, x, y, r, how) {
  if (how === 'shut') return line(g, DARK, 2.4, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, 2.4, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  const k = how === 'wide' ? 1.3 : 1;
  ink(g, DARK, E(x, y, r * .86 * k, r * 1.08 * k)); ink(g, '#fff', E(x + r * .3 * k, y - r * .4 * k, r * .32 * k, r * .32 * k));
}
/** the head, turned by `rot` about its middle (x, y). o: skin [main, shade], r, eyes (or [near, far]), mouth, ear,
 *  back(g, r) drawn behind the face (hair), top(g, r) on the face under the eyes (fringe, hat, beard), front(g, r) over the face (glasses, moustache) */
function head(g, x, y, rot, o) {
  const r = o.r || 44, [sk, sk2] = o.skin, eyes = Array.isArray(o.eyes) ? o.eyes : [o.eyes || 'open', o.eyes || 'open'], m = o.mouth || 'smile';
  g.save(); g.translate(x, y); g.rotate(rot);
  if (o.back) o.back(g, r);
  if (o.ear) piece(g, sk2, E(-r * .62, 8, 7.5, 9.5), .6);
  piece(g, sk, E(0, 0, r, r - 1));
  if (o.top) o.top(g, r);
  eyeAt(g, 25, 3, 5.2, eyes[0]); eyeAt(g, 4, 3, 4.5, eyes[1]);
  ink(g, 'rgba(240,120,140,.45)', E(33, 18, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(-4, 18, 6, 4.5));
  if (o.nose !== false) ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'small') line(g, MOUTH, 2.4, arc(16, 19, 4.5, .15 * PI, .85 * PI));
  if (m === 'laugh') { ink(g, MOUTH, gg => { gg.moveTo(26, 18); gg.arc(16, 18, 10, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(16, 24.5, 5, 2.6)); }
  if (m === 'oh') ink(g, MOUTH, E(17, 23, 4.2, 5));
  if (m === 'hm') line(g, MOUTH, 2.6, [[10, 24], [15, 22.5], [20, 24.5], [24, 22]]);
  if (o.front) o.front(g, r);
  g.restore();
}
/** a head of short hair: a cap over the top and the back of the head, with a short fringe */
const hairTop = (g, col, r) => piece(g, col, S([[-r + 12, 28], [-r - 4, 6], [-r - 3, -24], [-22, -r - 3], [6, -r - 6], [32, -r + 3], [r + 3, -20], [r + 4, -8], [r - 8, -16], [24, -22], [6, -26], [-10, -20], [-18, -4], [-17, 16]]));
/** an arm in one piece of sleeve, bent at the elbow, with a round hand */
function arm(g, col, skin, s, e, h, r = 10, hr = 9.5) {
  piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5)));
  piece(g, skin, E(h[0], h[1], hr, hr), .7);
}
/** a leg bent at the knee and a shoe flat on the ground */
function leg(g, col, shoeCol, hip, knee, foot, r = 12) {
  piece(g, col, U(C(...hip, ...knee, r), C(...knee, ...foot, r, r - 1)));
  piece(g, shoeCol, E(foot[0] + 6, foot[1] + 9, 17, 8.5));
}

/* ---------- the small things (each drawn once: on its own card in PROPS and in somebody's hand) ---------- */
/** a round bun with sugar pearls, its middle at (x, y) */
function bun(g, x, y, k = 1) {
  piece(g, '#DBA35C', S([[x - 16 * k, y + 8 * k], [x - 17 * k, y - 6 * k], [x - 8 * k, y - 14 * k], [x + 8 * k, y - 14 * k], [x + 17 * k, y - 6 * k], [x + 16 * k, y + 8 * k], [x, y + 12 * k]]), .7);
  ink(g, '#C4873F', S([[x - 15 * k, y + 4 * k], [x, y + 7 * k], [x + 15 * k, y + 4 * k], [x + 13 * k, y + 9 * k], [x, y + 11 * k], [x - 13 * k, y + 9 * k]]));
  ink(g, WHITE, U(...[[-7, -6], [0, -9], [7, -6], [-3, -2], [4, -2]].map(([a, b]) => E(x + a * k, y + b * k, 1.9 * k, 1.9 * k))));
}
/** a small silver-blue fish, nose to the right, about 70 long */
function fish(g, x, y, k = 1, rot = 0) {
  put(g, x, y, k, rot, () => {
    piece(g, '#6F9BC0', S([[-20, 0], [-38, -15], [-41, -12], [-33, 0], [-41, 12], [-38, 15]]), .7);
    piece(g, '#6F9BC0', S([[-8, -10], [0, -22], [12, -20], [10, -10]]), .6);
    piece(g, '#9CC3DB', S([[-28, 0], [-14, -14], [10, -16], [28, -6], [33, 1], [28, 8], [10, 15], [-14, 13]]), .7);
    ink(g, '#E3EFF3', S([[-22, 3], [0, 5], [28, 3], [26, 8], [10, 14], [-12, 12]]));
    for (const sx of [-12, -2]) line(g, '#6F9BC0', 1.8, arc(sx - 6, -1, 8, -.3 * PI, .3 * PI));
    line(g, '#6F9BC0', 1.8, arc(4, 0, 12, -.32 * PI, .32 * PI));
    ink(g, DARK, E(22, -3, 2.8, 3.2)); ink(g, '#fff', E(22.9, -4.2, 1, 1));
    ink(g, 'rgba(240,120,150,.4)', E(18, 5, 4, 2.6));
  });
}
/** an old brown boot with a hole in its toe, about 58 tall, the toe to the right */
function boot(g, x, y, k = 1, rot = 0) {
  put(g, x, y, k, rot, () => {
    piece(g, '#5E4630', round([[-17, 18], [-4, 18], [-4, 28], [-17, 28]], 3));
    piece(g, '#8D6A48', U(round([[-15, -30], [8, -30], [8, 6], [-15, 6]], 5), S([[-15, 19], [-16, 0], [6, -8], [20, -2], [31, 8], [33, 19]])));
    piece(g, '#5E4630', C(-14, 20.5, 31, 20.5, 3.2), .5);
    piece(g, '#A9825A', round([[-16, -31], [9, -31], [9, -21], [-16, -21]], 4), .5);
    piece(g, '#C79A66', round([[-11, 4], [-1, 3], [0, 12], [-10, 13]], 2), .3);
    for (const [x, y, a] of [[-11, 8, 0], [-1, 7.5, 0], [-5.5, 3.5, 1], [-5, 12.5, 1]]) line(g, '#4B3D3D', 1.4, a ? [[x, y - 2], [x, y + 2]] : [[x - 2, y], [x + 2, y]]);
    ink(g, '#4B3D3D', S([[15, 5], [22, 3], [28, 8], [26, 14], [19, 13], [16, 15], [14, 10]]));
    for (const yy of [-15, -8, -1]) line(g, CREAM, 1.8, [[0, yy], [7.5, yy + 2.5]]);
  });
}
/** a ball of red wool with a loose end */
function wool(g, x, y, k = 1) {
  put(g, x, y, k, 0, () => {
    piece(g, '#C23A48', strip([[12, 18], [20, 24], [29, 26], [36, 22], [41, 18], [47, 19], [51, 24]], 2.1), .5);
    piece(g, '#E8505B', E(0, 0, 25, 24));
    within(g, E(0, 0, 25, 24), () => {
      for (const d of [-13, -3, 7, 17]) line(g, '#C23A48', 2, arc(0, d - 58, 62, .3 * PI, .7 * PI, 8));
      for (const d of [-9, 2, 13]) line(g, '#F5858C', 2, arc(d + 58, 4, 62, .82 * PI, 1.18 * PI, 8));
    });
  });
}
const PLUM = '#4B3D5A';
/** a music note: 0 one quaver, 1 two quavers joined by a beam */
function drawNoot(g, f) {
  if (f === 1) {
    piece(g, PLUM, U(E(22, 52, 10, 7.5, -.35), E(52, 46, 10, 7.5, -.35), C(30.2, 50, 30.2, 19, 2), C(60.2, 44, 60.2, 13, 2), P([[28.2, 13.5], [62.2, 7], [62.2, 17], [28.2, 23.5]])));
    return;
  }
  piece(g, PLUM, U(E(30, 51, 10, 7.5, -.35), C(38.2, 49, 38.2, 14, 2), S([[37, 11], [44, 20], [54, 26], [54, 40], [49, 42], [48, 32], [42, 27], [37, 25]])));
}
/** the painter's easel from the front. 0 a blank canvas, 1 the first strokes, 2 a rainbow over a green hill, 3 a little white unicorn */
const RAINBOW = ['#F2879B', '#F7A968', '#F7D76A', '#9ED9A0', '#7CC4EE', '#BBA6EA'];
function drawEzel(g, f) {
  const wood = '#C79A66', wood2 = '#A9825A', wood3 = '#8D6A48', cv = round([[35, 51], [155, 51], [155, 167], [35, 167]], 2);
  piece(g, wood3, C(95, 44, 95, 250, 4.5));
  piece(g, wood, U(C(89, 22, 38, 256, 5.5), C(101, 22, 152, 256, 5.5)));
  piece(g, wood2, C(54, 208, 136, 208, 4), .6);
  piece(g, WHITE, round([[31, 47], [159, 47], [159, 171], [31, 171]], 3));
  piece(g, wood2, C(27, 177, 163, 177, 5.5)); piece(g, wood2, round([[84, 34], [106, 34], [106, 51], [84, 51]], 3), .6);
  if (f === 1) within(g, cv, () => {
    line(g, '#7CC4EE', 8, [[52, 82], [74, 70], [98, 76], [122, 66]]); line(g, '#F2879B', 8, [[60, 112], [86, 104], [108, 112]]); line(g, '#F7D76A', 8, [[104, 136], [128, 128], [140, 138]]);
  });
  if (f === 2) within(g, cv, () => {
    ink(g, '#D5EAF2', cv);
    RAINBOW.forEach((c, i) => ink(g, c, E(95, 150, 54 - i * 6.5, 54 - i * 6.5))); ink(g, '#D5EAF2', E(95, 150, 15, 15));
    ink(g, '#F7D04A', E(138, 68, 9, 9));
    ink(g, '#8CCB7E', E(95, 190, 86, 46));
    ink(g, '#F58DB9', U(E(58, 154, 3, 3), E(128, 156, 3, 3))); ink(g, WHITE, E(92, 158, 3, 3));
  });
  if (f === 3) within(g, cv, () => {
    ink(g, '#DCD0F4', cv); ink(g, '#8CCB7E', E(95, 186, 90, 36));
    ink(g, '#F7D04A', E(56, 72, 8, 8));
    ink(g, '#F4A6C4', U(E(62, 112, 9, 14, .5), E(104, 86, 6, 13, .35)));
    for (const x of [78, 86, 104, 112]) line(g, WHITE, 6.5, [[x, 124], [x, 148]]);
    ink(g, WHITE, U(E(95, 118, 24, 15), C(110, 112, 118, 94, 9, 8), E(122, 92, 13, 10.5)));
    ink(g, '#EBC35E', P([[119, 84], [127, 60], [129, 84]]));
    ink(g, DARK, E(125, 91, 2.2, 2.6)); ink(g, 'rgba(240,120,150,.5)', E(120, 97, 4, 2.6));
  });
}

/* ---------- the baker ---------- */
// round and jolly: a tall white hat, a white apron over a striped shirt, a red neckerchief, a tray of buns held out in front.
// 0 stands with the tray, 1 holds one bun out in his free hand (two left on the tray), 2 laughs: head back, eyes shut, hat slipping, a hand on his belly
function drawBakker(g, f) {
  const cx = 100, [sk, sk2] = SKIN.rose, shirt = '#F4ECDC', blue = '#7FB4DE', blue2 = '#6A9CC8', tr = '#7C8FB5', tr2 = '#6779A0', shoe = '#7A5A3E', shoe2 = '#63482F', red = '#E0625C', wood = '#C79A66', wood2 = '#A9825A';
  const laugh = f === 2;
  leg(g, tr2, shoe2, [cx - 16, 284], [cx - 16, 304], [cx - 16, 322], 13);
  leg(g, tr, shoe, [cx + 14, 284], [cx + 14, 304], [cx + 14, 323], 13);
  turn(g, cx, 292, laugh ? -.05 : 0, () => {
    // the far arm reaches under the tray
    arm(g, blue2, sk2, [cx + 30, 176], [cx + 58, 208], [cx + 96, 229], 10);
    const body = S([[cx - 34, 150], [cx + 34, 150], [cx + 56, 186], [cx + 66, 244], [cx + 54, 290], [cx, 302], [cx - 54, 290], [cx - 66, 244], [cx - 56, 186]]);
    piece(g, shirt, body); stripes(g, body, blue, 13, 6, true, 3);
    // the apron: a bib and a round skirt, a pocket
    piece(g, WHITE, S([[cx - 12, 178], [cx + 32, 178], [cx + 38, 206], [cx + 60, 240], [cx + 54, 296], [cx + 8, 306], [cx - 40, 296], [cx - 48, 240], [cx - 20, 206]]), .7);
    line(g, SAND, 2, arc(cx + 8, 258, 13, .1 * PI, .9 * PI)); line(g, SAND, 2, [[cx - 5, 258], [cx + 21, 258]]);
    // the tray and the buns
    piece(g, wood, C(cx + 48, 228, cx + 136, 228, 5.5)); ink(g, wood2, C(cx + 48, 231, cx + 136, 231, 2.2));
    for (const x of f === 1 ? [cx + 78, cx + 112] : [cx + 70, cx + 96, cx + 122]) bun(g, x, 212);
    piece(g, sk2, E(cx + 100, 227, 8.5, 7), .6);
    // the near arm: on the tray, holding a bun out, or on his belly
    if (f === 1) { bun(g, cx + 112, 150); arm(g, blue, sk, [cx - 6, 176], [cx + 44, 196], [cx + 104, 164], 10.5, 10); }
    else if (laugh) arm(g, blue, sk, [cx - 10, 176], [cx - 30, 222], [cx + 6, 244], 10.5, 10);
    else arm(g, blue, sk, [cx - 6, 176], [cx + 12, 214], [cx + 56, 225], 10.5, 10);
    // the neckerchief
    piece(g, red, S([[cx - 22, 148], [cx + 30, 148], [cx + 26, 160], [cx + 12, 176], [cx + 2, 162], [cx - 18, 158]]), .6);
    head(g, cx + 6, 106, laugh ? -.26 : 0, { skin: [sk, sk2], r: 46, ear: true, eyes: laugh ? 'glad' : 'open', mouth: laugh ? 'laugh' : 'smile',
      back: () => piece(g, '#7A4B2C', E(-12, -6, 48, 43)),
      top: (_, r) => { hairTop(g, '#8A5634', r); turn(g, 0, -34, laugh ? -.3 : 0, () => {
        piece(g, WHITE, round([[-31, -76], [31, -76], [27, -32], [-27, -32]], 8));
        piece(g, WHITE, U(E(-21, -76, 19, 15), E(2, -80, 21, 15), E(24, -76, 18, 14)), .7);
        for (const x of [-12, 4, 18]) line(g, SAND, 1.8, [[x, -44], [x * 1.15, -64]]);
        piece(g, CREAM, round([[-31, -47], [31, -47], [31, -30], [-31, -30]], 6), .6);
      }); } });
  });
}

/* ---------- grandma ---------- */
// small and round, sitting (as on a bench: her seat is PEOPLE.oma.seat): a grey bun, round glasses, a pink shawl, knitting a long
// striped scarf that hangs from her needles. 0 and 1 knit (the needles cross one way, then the other), 2 looks up and waves,
// 3 dozes: chin on her chest, eyes shut, glasses slipped, the needles resting in her lap
function drawOma(g, f) {
  const cx = 84, [sk, sk2] = SKIN.rose, dress = '#A990DC', dress2 = '#8F78C4', shawl = '#F4A6C4', shawl2 = '#DE86AC', grey = '#DAD6DE', grey2 = '#BDB7C6', sock = '#F4ECDC', sock2 = '#E2D6C1', shoe = '#8D6A48', shoe2 = '#7A5A3E', wood = '#B08D5E', red = '#E8505B';
  const wave = f === 2, doze = f === 3;
  // where her hands are, and the two needles (each from its knob to its tip)
  const H1 = doze ? [cx + 46, 180] : wave ? [cx + 50, 172] : f ? [cx + 48, 148] : [cx + 52, 170];
  const H2 = doze ? [cx + 64, 182] : wave ? [cx + 72, 106] : f ? [cx + 76, 172] : [cx + 72, 150];
  const N = doze ? [[cx + 34, 178, cx + 86, 186], [cx + 38, 186, cx + 90, 180]] : wave ? [[cx + 40, 178, cx + 86, 152], [cx + 44, 182, cx + 90, 160]]
    : f ? [[cx + 36, 136, cx + 90, 172], [cx + 88, 182, cx + 50, 138]] : [[cx + 40, 180, cx + 92, 138], [cx + 84, 158, cx + 44, 124]];
  const top = doze ? [cx + 72, 184] : wave ? [cx + 68, 164] : f ? [cx + 70, 162] : [cx + 66, 154], sway = f === 1 ? 14 : wave ? -3 : 0;
  // legs hang from the knees, feet off the ground
  piece(g, sock2, C(cx + 46, 204, cx + 40, 232, 9)); piece(g, shoe2, E(cx + 46, 241, 14, 8.5, .15));
  arm(g, dress2, sk2, [cx + 24, 136], wave ? [cx + 54, 146] : [cx + 42, 168], H2, 9, 9);
  piece(g, dress, S([[cx - 28, 118], [cx + 28, 118], [cx + 46, 150], [cx + 48, 192], [cx + 30, 208], [cx - 32, 208], [cx - 50, 192], [cx - 46, 150]]));
  piece(g, sock, C(cx + 56, 206, cx + 50, 234, 9.5)); piece(g, shoe, E(cx + 56, 243, 15, 9, .15));
  piece(g, dress, C(cx - 2, 190, cx + 50, 192, 20, 19)); piece(g, dress2, C(cx + 60, 180, cx + 62, 205, 5), .5);
  // the scarf: red with cream and mustard bands
  const scarf = strip([top, [top[0] + 8, top[1] + 26], [cx + 80 + sway * .5, 216], [cx + 80 + sway, 242]], 11);
  piece(g, red, scarf); stripes(g, scarf, CREAM, 30, 7, false, 4); stripes(g, scarf, '#E6B748', 30, 7, false, 19);
  for (const [x1, y1, x2, y2] of N) { piece(g, wood, C(x1, y1, x2, y2, 2.1), .5); piece(g, '#7CC4EE', E(x1, y1, 4.2, 4.2), .5); }
  arm(g, dress, sk, [cx - 8, 138], f === 1 ? [cx + 8, 166] : [cx + 4, 174], H1, 9, 9);
  // the shawl over her shoulders
  piece(g, shawl, S([[cx - 38, 112], [cx + 38, 112], [cx + 52, 140], [cx + 40, 158], [cx + 16, 146], [cx + 2, 168], [cx - 18, 150], [cx - 44, 160], [cx - 54, 140]]));
  ink(g, WHITE, U(...[[-34, 142], [-16, 136], [2, 150], [20, 134], [38, 142], [-26, 126], [28, 122]].map(([a, b]) => E(cx + a, b, 2.2, 2.2))));
  const gl = doze ? [7, 13] : [0, 0];
  head(g, cx + (doze ? 18 : 6), doze ? 88 : 76, doze ? .45 : wave ? -.1 : f ? .16 : -.02, { skin: [sk, sk2], eyes: doze ? 'shut' : 'open', mouth: doze ? 'small' : 'smile',
    back: (_, r) => { piece(g, grey2, E(-10, -6, r + 3, r - 3)); piece(g, grey, E(-34, -36, 17, 16)); piece(g, shawl2, E(-27, -28, 4, 4), .5); },
    top: (_, r) => hairTop(g, grey, r),
    front: () => { for (const [x, r] of [[25, 10.5], [3.5, 9]]) line(g, '#8D6A48', 2, arc(x + gl[0], 4 + gl[1], r, 0, 2 * PI, 18)); line(g, '#8D6A48', 2, [[12.5 + gl[0], 3 + gl[1]], [14.5 + gl[0], 3 + gl[1]]]); } });
}

/* ---------- the gardener ---------- */
// asleep in his wooden wheelbarrow, legs hanging out over the front, his straw hat over his eyes.
// 0 asleep, 1 a snore lifts the hat (and a little puff of breath), 2 startled awake: bolt upright, arms and legs in the air, the hat flying above him
// (the hat is a loose bit of card there, with sky between it and his head),
// 3 sitting up with a sleepy smile and a little wave, the hat askew on the back of his head
function strawHat(g, x, y, rot) {
  put(g, x, y, 1, rot, () => {
    piece(g, '#E6B748', C(-46, 0, 46, 0, 5));
    piece(g, '#E6B748', S([[-27, 2], [-27, -22], [-12, -34], [12, -34], [27, -22], [27, 2]]), .6);
    piece(g, '#6FAE82', round([[-26.5, -14], [26.5, -14], [26.5, -4], [-26.5, -4]], 2), .4);
    for (const x2 of [-36, 36]) line(g, '#CF9C35', 1.6, [[x2 - 4, 0], [x2 + 4, 0]]);
  });
}
function drawTuinman(g, f) {
  const [sk, sk2] = SKIN.sun, shirt = '#E2803E', shirt2 = '#C96A2E', dung = '#6F9BCB', dung2 = '#5880B2', boots = '#5E8C6A', boots2 = '#4C7558', wood = '#C79A66', wood2 = '#A9825A', wood3 = '#8D6A48', hair = '#B5653A', hair2 = '#974F2B';
  const RIM = 176, up = f >= 2;
  /** a leg over the front of the barrow: thigh, shin and a wellington */
  const dangle = (col, bc, hip, knee, foot, toe) => { piece(g, col, U(C(...hip, ...knee, 11.5), C(...knee, ...foot, 11.5, 10.5))); const m = [(knee[0] + foot[0]) / 2, (knee[1] + foot[1]) / 2]; piece(g, bc, U(C(...m, ...foot, 12.5, 12), E(foot[0] + Math.cos(toe) * 9, foot[1] + Math.sin(toe) * 9, 15, 10, toe))); };
  // the wheel and the far leg of the barrow
  piece(g, wood3, C(118, 226, 114, 268, 4.5));
  piece(g, '#4B3D3D', E(264, 246, 26, 26)); piece(g, wood, E(264, 246, 16.5, 16.5), .5);
  piece(g, wood3, C(232, 220, 264, 246, 5)); piece(g, '#4B3D3D', E(264, 246, 5, 5), .5);
  const hairBack = (_, r) => piece(g, hair2, E(-12, -4, r, r - 5));
  const hairSide = (_, r) => { piece(g, hair, S([[-r + 12, 26], [-r - 3, 6], [-r, -20], [-18, -r + 6], [-6, -r + 12], [-16, -12], [-18, 8], [-16, 22]])); piece(g, hair, U(C(-2, -r + 3, -6, -r - 7, 2.6), C(3, -r + 2, 5, -r - 8, 2.6))); };
  if (!up) {
    // lying back: his head on the back board, his belly a hill
    const b = f === 1 ? -7 : 0;
    piece(g, shirt, S([[104, 184], [108, 146], [146, 126 + b / 2], [196, 124 + b], [240, 148], [250, 184]]));
    piece(g, dung, S([[150, 184], [150, 136 + b / 2], [176, 120 + b], [210, 124 + b], [242, 150], [250, 184]]), .7); piece(g, dung, C(152, 138 + b / 2, 124, 148, 4.5), .6);
    ink(g, '#F7D04A', E(158, 140 + b / 2, 3, 3));
    arm(g, shirt2, sk, [128, 154], [156, 174], [188, 130 + b], 10, 9.5);
    head(g, 92, 150, -1, { skin: [sk, sk2], r: 40, ear: true, eyes: 'shut', mouth: f === 1 ? 'oh' : 'small', back: hairBack, top: hairSide,
      front: () => { if (f === 1) { strawHat(g, 13, -7, .2); piece(g, WHITE, U(E(44, 32, 5, 5), E(52, 27, 6.5, 6.5), E(60, 33, 5, 5)), .5); } else strawHat(g, 5, 4, .414); } });
  } else {
    // sitting up, deep in the barrow
    piece(g, shirt, S([[164, 214], [168, 148], [198, 132], [228, 148], [232, 214]]));
    piece(g, dung, U(round([[178, 162], [220, 162], [224, 214], [174, 214]], 6), C(182, 164, 178, 142, 4.5), C(216, 164, 220, 142, 4.5)), .7);
    ink(g, '#F7D04A', U(E(183, 168, 3, 3), E(215, 168, 3, 3)));
  }
  // the barrow: its side, the rim, the near leg, the handle
  piece(g, wood, round([[56, RIM], [268, RIM], [240, 228], [98, 228]], 7));
  for (const [x1, x2, y] of [[70, 256, 194], [84, 248, 211]]) line(g, wood2, 2, [[x1, y], [x2, y]]);
  piece(g, wood2, C(58, RIM, 266, RIM, 4.5), .6);
  piece(g, wood2, C(104, 226, 98, 268, 5)); piece(g, wood2, C(70, 186, 24, 168, 5.5, 5)); piece(g, wood3, C(34, 172, 22, 167.5, 6.5), .5);
  if (!up) {
    dangle(dung2, boots2, [228, 166], [266, 162], [278, 206], .2);
    dangle(dung, boots, [228, 172], [276, 170], [292, 214], -.1);
    return;
  }
  if (f === 2) { dangle(dung2, boots2, [228, 166], [262, 160], [296, 142], -1.1); dangle(dung, boots, [228, 172], [268, 168], [306, 160], -.9); }
  else { dangle(dung2, boots2, [228, 166], [266, 162], [274, 206], .3); dangle(dung, boots, [228, 172], [276, 170], [288, 214], 0); }
  if (f === 2) {
    arm(g, shirt2, sk2, [224, 154], [250, 122], [256, 82], 10, 9.5);
    head(g, 200, 98, -.06, { skin: [sk, sk2], r: 40, ear: true, eyes: 'wide', mouth: 'oh', back: hairBack, top: hairSide });
    arm(g, shirt, sk, [172, 154], [146, 122], [142, 82], 10, 9.5);
    strawHat(g, 206, 28, -.3);
  } else {
    arm(g, shirt2, sk2, [224, 154], [250, 148], [262, 114], 10, 9.5);
    head(g, 200, 100, .05, { skin: [sk, sk2], r: 40, ear: true, eyes: 'shut', mouth: 'smile', back: hairBack, top: hairSide, front: () => strawHat(g, -14, -30, -.42) });
    arm(g, shirt, sk, [172, 154], [148, 172], [168, 170], 10, 9.5);
  }
}

/* ---------- the fisherman ---------- */
// in a yellow raincoat and sou'wester, a white beard, sitting on a wooden crate with his rod out over the water (the line hangs at x = PEOPLE.visser.line).
// 0 waits, 1 a bite: the rod bends, he leans back, eyes wide, 2 holds up a small silver fish, proud, 3 holds up an old boot and scratches his head
const VISSER_LINE = 352;
function drawVisser(g, f) {
  const cx = 96, [sk, sk2] = SKIN.sun, coat = '#F2C83F', coat2 = '#D9AC2E', tr = '#6F8FB5', tr2 = '#5B7AA0', wel = '#3E7C86', wel2 = '#32666F', wood = '#C79A66', wood2 = '#A9825A', rodc = '#8D6A48', LX = VISSER_LINE;
  const bite = f === 1, got = f >= 2, lean = bite ? -.14 : got ? -.04 : 0;
  // the crate
  piece(g, wood, round([[cx - 44, 232], [cx + 32, 232], [cx + 32, 285], [cx - 44, 285]], 4));
  for (const y of [249, 267]) line(g, wood2, 2, [[cx - 42, y], [cx + 30, y]]);
  for (const x of [cx - 34, cx + 22]) ink(g, wood2, U(E(x, 240.5, 1.6, 1.6), E(x, 258, 1.6, 1.6), E(x, 276, 1.6, 1.6)));
  const seaLeg = (col, bc, hip, knee, foot) => { piece(g, col, U(C(...hip, ...knee, 12), C(...knee, ...foot, 12, 11))); piece(g, bc, U(C(knee[0], knee[1] + 18, ...foot, 13, 12.5), E(foot[0] + 8, foot[1] + 8, 18, 9.5))); };
  seaLeg(tr2, wel2, [cx + 2, 222], [cx + 40, 220], [cx + 40, 266]);
  // the rod: straight, bent by a bite, or held up with the catch on a short line
  const rod = bite ? [[cx + 30, 204], [200, 146], [244, 120], [284, 106], [318, 103], [340, 110], [LX, 124]] : got ? [[cx + 40, 216], [cx + 74, 136], [cx + 122, 34]] : [[cx + 30, 208], [220, 139], [LX, 42]];
  const tip = rod[rod.length - 1], at = t => [rod[0][0] + (rod[1][0] - rod[0][0]) * t, rod[0][1] + (rod[1][1] - rod[0][1]) * t];
  const H1 = at(got ? .3 : .16), H2 = got ? (f === 3 ? [cx - 20, 70] : [cx + 86, 168]) : at(.42);
  turn(g, cx, 232, lean, () => {
    if (f !== 3) arm(g, coat2, sk2, [cx + 26, 168], got ? [cx + 58, 188] : [cx + 46, 192], H2, 10.5, 9.5);
    piece(g, coat, S([[cx - 30, 148], [cx + 30, 148], [cx + 44, 186], [cx + 46, 230], [cx + 22, 242], [cx - 36, 242], [cx - 50, 226], [cx - 44, 186]]));
  });
  seaLeg(tr, wel, [cx - 2, 226], [cx + 48, 226], [cx + 50, 268]);
  piece(g, coat, C(cx - 6, 222, cx + 30, 222, 20, 18)); ink(g, coat2, C(cx + 44, 206, cx + 46, 238, 3));
  piece(g, rodc, strip(rod, 2.4)); piece(g, '#4B3D3D', E(...at(got ? .12 : .06), 5.5, 5.5), .5);
  if (!got) {
    piece(g, '#4B3D3D', C(LX, tip[1], LX, 282, 1.1), .3);
    if (bite) piece(g, '#9CCDE6', U(E(LX - 9, 268, 3, 4.5), E(LX + 9, 264, 3, 4.5), E(LX + 2, 256, 2.6, 4)), .4);
    else { piece(g, WHITE, E(LX, 262, 6.5, 8), .5); piece(g, '#E0625C', E(LX, 258, 6.5, 5), .4); }
  } else {
    piece(g, '#4B3D3D', C(tip[0], tip[1], tip[0], 92, 1.1), .3);
    if (f === 2) fish(g, tip[0], 128, .86, -PI / 2);
    else { boot(g, tip[0] + 7, 124, .92, .12); piece(g, '#9CCDE6', U(E(tip[0] - 5, 163, 3, 4.8), E(tip[0] + 15, 167, 3, 4.8)), .4); }
  }
  turn(g, cx, 232, lean, () => {
    for (const y of [176, 196, 216]) ink(g, coat2, E(cx + 8, y, 3, 3));
    arm(g, coat, sk, [cx - 8, 170], f === 3 ? [cx - 6, 206] : got ? [cx + 8, 204] : [cx + 12, 204], H1, 10.5, 9.5);
    piece(g, coat2, S([[cx - 24, 146], [cx + 32, 146], [cx + 28, 158], [cx + 8, 166], [cx - 18, 160]]), .6);
    head(g, cx + 6, 106, f === 3 ? .1 : f === 2 ? -.08 : 0, { skin: [sk, sk2], eyes: bite || f === 3 ? 'wide' : f === 2 ? 'glad' : 'open', mouth: bite ? 'oh' : f === 3 ? 'hm' : f === 2 ? 'laugh' : 'smile',
      back: (_, r) => piece(g, coat2, S([[-r + 8, -22], [-r - 16, -4], [-r - 24, 24], [-r - 8, 32], [-r + 8, 16], [-r + 16, -8]])),
      top: (_, r) => {
        piece(g, CREAM, S([[-38, 0], [-42, 26], [-22, 50], [12, 54], [38, 40], [45, 18], [36, 27], [16, 33], [-4, 27], [-20, 8]]), .6);
        piece(g, coat, S([[-r - 2, -8], [-r + 2, -36], [-10, -r - 14], [20, -r - 10], [r, -30], [r + 2, -12], [10, -18], [-20, -14]]));
        piece(g, coat, strip([[-r - 6, -6], [-r + 12, -14], [r - 8, -15], [r + 15, -19]], 5.5), .6);
      } });
    if (f === 3) arm(g, coat2, sk, [cx - 16, 168], [cx - 56, 132], H2, 10.5, 9.5);
  });
}

/* ---------- the painter ---------- */
// a red beret, russet hair in a plait, a cream smock with paint spots and a lilac bow, a palette in one hand and a brush in the other.
// 0 the brush raised high, 1 the brush low, 2 leans back with one eye shut and her thumb held out, measuring, 3 arms wide, proud
function drawSchilder(g, f) {
  const cx = 126, [sk, sk2] = SKIN.rose, smock = '#F4ECDC', smock2 = '#E2D6C1', tr = '#6779A0', tr2 = '#566690', shoe = '#7A5A3E', shoe2 = '#63482F', hair = '#B5653A', hair2 = '#974F2B', red = '#E0625C', wood = '#C79A66';
  const wide = f === 3, meas = f === 2;
  const brush = (x, y, a, col = '#7CC4EE') => put(g, x, y, 1, a, () => { piece(g, wood, C(-10, 0, 26, 0, 2.3), .5); piece(g, '#B9B4AE', C(26, 0, 31, 0, 3), .5); piece(g, col, S([[31, -4], [39, -4.5], [45, 0], [39, 4.5], [31, 4]]), .5); });
  const palette = (x, y, a) => put(g, x, y, 1, a, () => {
    piece(g, wood, S([[-32, -2], [-24, -20], [4, -25], [30, -14], [34, 8], [16, 21], [-2, 12], [-20, 19]]));
    ink(g, '#E8505B', E(-16, -8, 5.5, 5)); ink(g, '#F7D04A', E(-2, -14, 5.5, 5)); ink(g, '#7CC4EE', E(13, -10, 5.5, 5)); ink(g, '#8CCB7E', E(22, 2, 5.5, 5)); ink(g, WHITE, E(-22, 6, 4.5, 4));
  });
  leg(g, tr2, shoe2, [cx - 14, 276], [cx - 14, 300], [cx - 14, 322], 11);
  leg(g, tr, shoe, [cx + 12, 276], [cx + 12, 300], [cx + 12, 323], 11);
  turn(g, cx, 300, meas ? -.07 : 0, () => {
    // the far arm: brush up, brush down, thumb out, arm wide
    const H2 = wide ? [cx + 96, 132] : meas ? [cx + 102, 164] : f ? [cx + 92, 214] : [cx + 88, 134];
    if (!meas) brush(H2[0], H2[1], wide ? -1.1 : f ? .25 : -.65);
    else piece(g, sk2, C(H2[0] + 2, H2[1] - 4, H2[0] + 1, H2[1] - 19, 4.6), .6);
    arm(g, smock2, sk2, [cx + 26, 174], wide ? [cx + 64, 168] : meas ? [cx + 64, 170] : f ? [cx + 54, 206] : [cx + 62, 176], H2, 10, 9.5);
    piece(g, smock, S([[cx - 28, 150], [cx + 28, 150], [cx + 42, 190], [cx + 56, 268], [cx + 42, 288], [cx, 292], [cx - 42, 288], [cx - 56, 268], [cx - 42, 190]]));
    for (const [x, y, c, r] of [[-22, 232, '#F2879B', 5], [-8, 262, '#7CC4EE', 6], [22, 250, '#F7D04A', 5], [34, 276, '#8CCB7E', 4.5], [-34, 272, '#BBA6EA', 4.5], [10, 212, '#F2879B', 3.5], [-6, 196, '#7CC4EE', 3.5], [28, 208, '#F7A968', 4]]) ink(g, c, E(cx + x, y, r, r * .9));
    // the plait down her back
    piece(g, hair2, U(E(cx - 38, 136, 9, 10), E(cx - 42, 153, 8.5, 10), E(cx - 44, 170, 8, 9.5))); piece(g, '#BBA6EA', E(cx - 44, 182, 6, 4.5), .6);
    // the near arm and the palette (the spare brush with it while she measures)
    const H1 = wide ? [cx - 70, 140] : [cx + 20, 226];
    if (meas) brush(H1[0] + 2, H1[1] - 2, -1.25);
    arm(g, smock, sk, [cx - 10, 176], wide ? [cx - 44, 172] : [cx - 14, 216], H1, 10.5, 9.5);
    palette(wide ? H1[0] - 12 : H1[0] + 14, wide ? H1[1] - 12 : H1[1] - 8, wide ? .5 : -.1);
    piece(g, sk, wide ? E(H1[0] - 4, H1[1] - 4, 5, 5) : E(H1[0] + 6, H1[1] - 4, 5, 5), .5);
    piece(g, '#BBA6EA', U(E(cx - 6, 156, 11, 7.5, .45), E(cx + 20, 156, 11, 7.5, -.45))); piece(g, '#9C86D2', E(cx + 7, 155, 5, 5.5), .7);
    head(g, cx + 6, 106, meas ? -.1 : wide ? -.06 : 0, { skin: [sk, sk2], eyes: meas ? ['shut', 'open'] : wide ? 'glad' : 'open', mouth: meas ? 'small' : wide ? 'laugh' : 'smile',
      back: (_, r) => piece(g, hair2, E(-10, -6, r + 3, r - 3)),
      top: (_, r) => { hairTop(g, hair, r); piece(g, red, E(-8, -r + 3, 43, 17, -.14)); piece(g, red, C(-10, -r - 12, -8, -r - 18, 2.6), .6); } });
  });
}

/* ---------- the accordion player ---------- */
// on a wooden stool: a flat cap, a big moustache, red braces over a white shirt, a red accordion.
// 0 the bellows wide, 1 half, 2 closed, 3 tips his cap with a smile (the accordion shut on his knee)
function drawMuzikant(g, f) {
  const cx = 104, [sk, sk2] = SKIN.brown, shirt = '#A8DCD2', shirt2 = '#8CC7BC', tr = '#5E6FA0', tr2 = '#4D5C88', shoe = '#7A5A3E', shoe2 = '#63482F', red = '#D8574F', cap = '#CF9C35', cap2 = '#B58428', wood = '#C79A66', wood2 = '#A9825A', wood3 = '#8D6A48', hair = '#4B3D3D';
  const tip = f === 3, L = cx + [-38, -24, -9, -9][f], R = cx + [64, 42, 22, 22][f], ay = tip ? 8 : 0, rot = [-.06, 0, .05, 0][f];
  // the stool
  piece(g, wood3, C(cx - 4, 230, cx - 4, 272, 4));
  piece(g, wood2, U(C(cx - 26, 230, cx - 36, 273, 4.5), C(cx + 18, 230, cx + 28, 273, 4.5)));
  piece(g, wood, C(cx - 34, 226, cx + 26, 226, 6.5));
  leg(g, tr2, shoe2, [cx + 2, 216], [cx + 42, 214], [cx + 42, 258], 12);
  piece(g, shirt, S([[cx - 30, 136], [cx + 30, 136], [cx + 42, 170], [cx + 42, 216], [cx + 24, 230], [cx - 30, 230], [cx - 44, 214], [cx - 42, 170]]));
  piece(g, red, U(C(cx - 14, 142, cx - 18, 222, 3.6), C(cx + 20, 142, cx + 22, 222, 3.6)), .4);
  leg(g, tr, shoe, [cx - 4, 220], [cx + 50, 220], [cx + 52, 260], 12.5);
  // his arms go round behind the accordion; tipping, the far hand lifts his cap
  const E1 = [L - 34, 178 + ay], E2 = [R + 34, 174 + ay], H1 = [L - 19, 192 + ay], H2 = [R + 20, 190 + ay];
  if (tip) arm(g, shirt2, sk2, [cx + 26, 152], [cx + 66, 110], [cx + 58, 33], 10, 9.5);
  else piece(g, shirt2, U(C(cx + 26, 152, ...E2, 10), C(...E2, ...H2, 10, 8.5)));
  piece(g, shirt, U(C(cx - 14, 152, ...E1, 10.5), C(...E1, ...H1, 10.5, 9)));
  // the accordion: two red boxes and the folds between them
  turn(g, (L + R) / 2, 184 + ay, rot, () => {
    const n = 7, w = (R - L) / n, y0 = 154 + ay, y1 = 214 + ay;
    piece(g, CREAM, P([...Array.from({ length: n + 1 }, (_, i) => [L + i * w, y0 + (i % 2 ? 6 : 0)]), ...Array.from({ length: n + 1 }, (_, i) => [R - i * w, y1 - ((n - i) % 2 ? 6 : 0)])]));
    for (let i = 1; i < n; i++) line(g, i % 2 ? '#8D6A48' : SAND, 1.8, [[L + i * w, y0 + (i % 2 ? 6 : 0) + 1], [L + i * w, y1 - (i % 2 ? 6 : 0) - 1]]);
    piece(g, red, round([[L - 20, y0 - 3], [L, y0 - 3], [L, y1 + 3], [L - 20, y1 + 3]], 5)); piece(g, red, round([[R, y0 - 3], [R + 20, y0 - 3], [R + 20, y1 + 3], [R, y1 + 3]], 5));
    ink(g, CREAM, U(...[0, 1, 2, 3].map(i => E(L - 10, y0 + 12 + i * 12, 2.6, 2.6))));
    for (let i = 0; i < 6; i++) ink(g, i % 2 ? '#4B3D3D' : CREAM, round([[R + 9, y0 + 4 + i * 9], [R + 20, y0 + 4 + i * 9], [R + 20, y0 + 11 + i * 9], [R + 9, y0 + 11 + i * 9]], 1.5));
  });
  if (!tip) piece(g, sk2, E(...H2, 9.5, 9.5), .7);
  piece(g, sk, E(...H1, 9.5, 9.5), .7);
  const capAt = (x, y, a) => put(g, x, y, 1, a, () => {
    piece(g, cap2, C(28, -2, 58, 3, 5.5, 4.5));
    piece(g, cap, S([[-48, 0], [-44, -24], [-12, -36], [22, -32], [44, -14], [46, 2], [10, -2], [-20, 2]]));
    piece(g, cap2, E(-2, -31, 4, 3), .5);
  });
  head(g, cx + 6, 94, [-.09, 0, .09, 0][f], { skin: [sk, sk2], ear: true, eyes: tip ? 'glad' : 'open', mouth: 'smile',
    back: (_, r) => piece(g, hair, E(-10, -6, r + 2, r - 4)),
    top: (_, r) => { hairTop(g, hair, r); if (!tip) capAt(-2, -r + 14, 0); },
    front: () => piece(g, hair, U(E(28, 19, 14, 6.5, .3), E(4, 19, 12, 6, -.3), E(41, 21, 4.5, 4.5), E(-7, 21, 4, 4)), .6) });
  if (tip) capAt(cx + 5, 40, -.3);
}

/** a drawing moved down by dy (to make room on its card) */
const moved = (dy, draw) => (g, f) => { g.save(); g.translate(0, dy); draw(g, f); g.restore(); };
/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is */
export const PEOPLE = {
  oma: { w: 204, h: 266, draw: drawOma, frames: 4, size: 1.33, does: ['knit', 'knit', 'wave', 'doze'], seat: [84, 208] },
  bakker: { w: 256, h: 350, draw: drawBakker, frames: 3, size: 1.75, does: ['tray', 'bun', 'laugh'] },
  tuinman: { w: 336, h: 300, draw: moved(16, drawTuinman), frames: 4, size: 1.5, does: ['asleep', 'snore', 'startled', 'wave'] },
  visser: { w: 382, h: 300, draw: drawVisser, frames: 4, size: 1.5, does: ['wait', 'bite', 'fish', 'boot'], seat: [96, 232], line: VISSER_LINE },
  schilder: { w: 272, h: 320, draw: moved(-30, drawSchilder), frames: 4, size: 1.6, does: ['high', 'low', 'measure', 'proud'] },
  muzikant: { w: 250, h: 298, draw: moved(8, drawMuzikant), frames: 4, size: 1.49, does: ['wide', 'half', 'closed', 'cap'] },
};
export const PROPS = {
  ezel: { w: 190, h: 274, draw: drawEzel, frames: 4, size: 1.37, does: ['blank', 'strokes', 'rainbow', 'unicorn'] },
  broodje: { w: 70, h: 60, draw: g => bun(g, 35, 31, 1.45), frames: 1, size: .2, does: ['bun'] },
  vis: { w: 106, h: 62, draw: g => fish(g, 55, 33, 1.08), frames: 1, size: .2, does: ['fish'] },
  laars: { w: 88, h: 92, draw: g => boot(g, 37, 47, 1.2), frames: 1, size: .3, does: ['boot'] },
  wol: { w: 110, h: 80, draw: g => wool(g, 38, 38, 1.1), frames: 1, size: .26, does: ['wool'] },
  noot: { w: 78, h: 72, draw: moved(4, drawNoot), frames: 2, size: .22, does: ['quaver', 'two quavers'] },
};
