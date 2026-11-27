// A third batch of paper cards (see STYLE.md): the sea (the whale, the little sailboats), the beach (a coconut, the fish
// kite, a spade, the ice cream seller and his cones, the lifeguard on her chair, a lady sunbathing) and the rainbow island
// (the candy floss seller, an alpaca, a little monkey, a child of the island). Cut by the same scissors as people.js and
// animals2.js. All face right (the world flips them). The sheet is cards3.html.
import { E, S, C, U, P, piece, ink, line, eye } from './cut.js';

const DARK = '#33262E', PI = Math.PI, WHITE = '#FCF8F1', CREAM = '#F4ECDC', MOUTH = '#8A3D4C';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shape with straight sides and corners rounded by r */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** a bent strip of paper: capsules along a row of points */
const strip = (pts, r) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r)));
/** printed things that stay inside one shape */
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
/** stripes printed on one piece: bands `w` wide every `step`, across (or down when `down`) */
const stripes = (g, shape, col, step, w, down, off = 0) => within(g, shape, () => { g.fillStyle = col; for (let v = -400 + off; v < 900; v += step) down ? g.fillRect(v, -100, w, 900) : g.fillRect(-100, v, 900, w); });
const cheek = (g, x, y, rx = 7, ry = 5, a = .4) => ink(g, `rgba(240,120,150,${a})`, E(x, y, rx, ry));

/* ---------- people: a head with a face, arms and legs (as in people.js) ---------- */
const SKIN = { rose: ['#F4CDB0', '#E2B293'], sun: ['#EBBD98', '#D4A27C'], brown: ['#C99168', '#B07B55'] };
function eyeAt(g, x, y, r, how) {
  if (how === 'shut') return line(g, DARK, 2.4, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, 2.4, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  ink(g, DARK, E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32));
}
/** the head about its middle (x, y), turned by rot. o: skin, r, eyes, mouth ('smile' 'laugh' 'oh' 'none'), ear, back(), top(), front() */
function head(g, x, y, rot, o) {
  const r = o.r || 40, [sk, sk2] = o.skin, eyes = o.eyes || 'open', m = o.mouth || 'smile';
  g.save(); g.translate(x, y); g.rotate(rot);
  if (o.back) o.back(g, r);
  if (o.ear) piece(g, sk2, E(-r * .62, 8, 7.5, 9.5), .6);
  piece(g, sk, E(0, 0, r, r - 1));
  if (o.top) o.top(g, r);
  eyeAt(g, 25, 3, 5, eyes); eyeAt(g, 4, 3, 4.4, eyes);
  ink(g, 'rgba(240,120,140,.45)', E(33, 18, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(-4, 18, 6, 4.5));
  ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'laugh') { ink(g, MOUTH, gg => { gg.moveTo(26, 18); gg.arc(16, 18, 10, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(16, 24.5, 5, 2.6)); }
  if (m === 'oh') ink(g, MOUTH, E(17, 23, 4.2, 5));
  if (o.front) o.front(g, r);
  g.restore();
}
function arm(g, col, skin, s, e, h, r = 10, hr = 9.5) { piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5))); piece(g, skin, E(h[0], h[1], hr, hr), .7); }
function leg(g, col, shoeCol, hip, knee, foot, r = 12) { piece(g, col, U(C(...hip, ...knee, r), C(...knee, ...foot, r, r - 1))); piece(g, shoeCol, E(foot[0] + 6, foot[1] + 9, 16, 8)); }
/** a cart on two wheels: a box with stripes printed down it and a lid; (x0..x1, top..bottom) */
function cart(g, x0, x1, top, bot, col, col2, stripe) {
  for (const wx of [x0 + 34, x1 - 34]) { piece(g, '#7A5A3E', E(wx, bot + 6, 19, 19)); piece(g, '#C79A66', E(wx, bot + 6, 8, 8), .4); }
  const box = round([[x0, top], [x1, top], [x1, bot], [x0, bot]], 8); piece(g, col, box); stripes(g, box, stripe, 30, 13, true, x0 + 8);
  ink(g, col2, P([[x0, bot - 12], [x1, bot - 12], [x1, bot], [x0, bot]]));
}

/* ---------------- the sea ---------------- */

// the whale: as much as shows above the water, its belly line on the bottom of the card (the waterline).
// 0 its back up, calm; 1 blowing a tall fountain from the top of its head; 2 only its tail up, diving
const WH = { c: '#7392B8', c2: '#5F7FA6', bel: '#E8EFF1', spout: '#FCF8F1', spout2: '#D8ECF1' };
function drawWalvis(g, f) {
  const k = WH;
  if (f === 2) {   // the tail: a stalk out of the water and two broad lobes
    piece(g, k.c2, C(260, 192, 262, 128, 20, 15));
    g.save(); g.translate(262, 150); g.scale(1.3, 1.3); g.translate(-262, -150);
    piece(g, k.c, S([[262, 132], [228, 104], [182, 78], [140, 72], [168, 96], [204, 120], [240, 140], [262, 150], [284, 140], [320, 120], [356, 96], [384, 72], [342, 78], [296, 104]]));
    ink(g, k.c2, S([[262, 132], [240, 122], [262, 144], [284, 122]]));
    for (const [x, y] of [[168, 84], [356, 84]]) ink(g, k.bel, E(x, y + 4, 9, 4, x < 262 ? .4 : -.4));
    g.restore();
    for (const [x, y, r] of [[220, 196], [306, 192], [250, 160], [276, 170]]) piece(g, k.spout2, E(x, y, 6, 7), .4);   // drops running off
    return;
  }
  if (f === 1) {   // the spout: a column of white paper, a cloud of lumps on top, drops falling
    piece(g, k.spout2, U(C(392, 106, 386, 58, 9, 15), C(400, 106, 408, 58, 9, 15)));
    piece(g, k.spout, U(E(360, 44, 24, 18), E(394, 30, 28, 20), E(430, 44, 24, 18), E(378, 58, 18, 13), E(414, 58, 18, 13)));
    for (const [x, y] of [[338, 74], [450, 72], [350, 96], [440, 98]]) piece(g, k.spout2, E(x, y, 6, 7.5), .4);
  }
  // the flipper in front, the body, the belly line along the water
  const body = S([[22, 212], [54, 176], [108, 136], [190, 112], [290, 104], [380, 108], [446, 126], [492, 158], [508, 196], [500, 212]]);
  piece(g, k.c2, S([[48, 212], [30, 196], [18, 170], [36, 176], [62, 196], [74, 212]]));   // the tail end going into the water
  piece(g, k.c, body);
  ink(g, k.bel, S([[330, 212], [356, 196], [420, 190], [480, 190], [506, 200], [500, 212]]));
  for (let i = 0; i < 4; i++) line(g, '#C9D6DE', 1.6, [[372 + i * 30, 200], [380 + i * 30, 211]]);
  for (const [x, y, rx, ry] of [[200, 140, 22, 8], [256, 128, 14, 6], [150, 160, 12, 5]]) ink(g, '#8BA7C7', E(x, y, rx, ry, -.15));
  ink(g, k.c2, E(398, 110, 7, 3));   // the blowhole
  eye(g, 452, 158, 6.4); cheek(g, 466, 176, 10, 6);
  line(g, '#3F5A7A', 2.6, arc(452, 160, 30, .2 * PI, .48 * PI));
  piece(g, k.c2, S([[352, 196], [380, 190], [404, 204], [392, 214], [362, 214]]), .7);   // the flipper
}

// the little sailboats: a hull with a stripe, a mast, a big sail and a jib, a pennant. 0 the sail full, 1 flatter, fluttering
const BOATS = {
  zeilboot: { hull: '#E98F8F', hull2: '#D07474', band: '#FCF8F1', sail: '#FCF8F1', jib: '#F4A6C4', pen: '#F2C65C' },
  zeilboot2: { hull: '#7CB3D9', hull2: '#5F98C2', band: '#FCF8F1', sail: '#F8DDE4', jib: '#FCF8F1', pen: '#E8505B' },
  zeilboot3: { hull: '#F2C65C', hull2: '#D9A93E', band: '#E8505B', sail: '#FCF8F1', jib: '#9ED9CF', pen: '#7CB3D9', striped: '#E98F8F' },
  zeilboot4: { hull: '#F4ECDC', hull2: '#E2D6C1', band: '#7CB3D9', sail: '#9ED9CF', jib: '#F2C65C', pen: '#F4A6C4' },
};
const drawBoat = c => (g, f) => {
  const full = f === 0, b = full ? 0 : -8;
  piece(g, '#8D6A48', C(100, 194, 100, 34, 3.4));   // the mast
  const pen = full ? P([[100, 30], [134, 24], [100, 16]]) : P([[100, 30], [118, 30], [132, 22], [116, 20], [100, 16]]);
  piece(g, c.pen, pen, .5);
  const sail = P([[106, 40], [148 + b, 98], [170 + b * .6, 150], [180, 182], [106, 182]]);
  piece(g, c.sail, sail);
  if (c.striped) stripes(g, sail, c.striped, 34, 14, false, 8);
  if (!full) line(g, 'rgba(120,100,90,.35)', 1.6, [[150, 110], [140, 130], [150, 150]]);
  piece(g, c.jib, P([[94, 54], [62 - b * .5, 118], [40, 182], [94, 182]]), .8);
  line(g, '#8D6A48', 1.4, [[100, 34], [36, 186]]);
  const hull = S([[16, 186], [100, 182], [188, 186], [176, 214], [156, 228], [44, 228], [26, 214]]);
  piece(g, c.hull, hull);
  within(g, hull, () => { g.fillStyle = c.band; g.fillRect(0, 196, 220, 8); g.fillStyle = c.hull2; g.fillRect(0, 218, 220, 20); });
  for (const x of [70, 128]) { ink(g, '#FCF8F1', E(x, 200, 5, 5)); ink(g, '#7CA3C4', E(x, 200, 3, 3)); }
};

/* ---------------- the beach ---------------- */

// a coconut: brown and hairy, its three dark eyes on top (it turns about its middle as it rolls)
function drawKokos(g) {
  piece(g, '#8D6A48', S([[40, 12], [62, 20], [70, 42], [62, 62], [40, 70], [18, 62], [10, 42], [18, 20]]));
  for (const [x0, y0, x1, y1] of [[22, 30, 30, 26], [52, 26, 60, 32], [18, 46, 26, 44], [56, 48, 64, 46], [30, 60, 38, 62], [44, 58, 50, 62], [36, 40, 44, 38], [26, 52, 32, 54]]) line(g, '#B08D5E', 1.8, [[x0, y0], [x1, y1]]);
  ink(g, '#A9825A', S([[40, 14], [58, 20], [48, 26], [32, 26], [22, 20]]));
  for (const [x, y] of [[33, 20], [47, 20], [40, 27]]) ink(g, '#4B3D3D', E(x, y, 3.4, 3));
  ink(g, 'rgba(255,240,220,.35)', E(26, 38, 5, 9, .4));
}

// the fish kite: a koi windsock, head up into the wind, turquoise with coral bands, ribbons below. 0 straight, 1 left, 2 right
function drawVisKite(g, f) {
  const sw = f === 1 ? -10 : f === 2 ? 10 : 0, tq = '#9ED9CF', tq2 = '#7CC2B6', co = '#F2A07B', co2 = '#E2803E';
  // the ribbons, swinging
  for (const [x, c, l] of [[48, '#F2C65C', 0], [60, co, 6], [72, '#F4A6C4', 0]]) piece(g, c, strip([[x, 128], [x + sw * .4, 150], [x + sw, 170], [x + sw * .7, 176 + l]], 3), .5);
  piece(g, tq2, S([[60, 112], [38, 140], [46, 122], [60, 132], [74, 122], [82, 140]]), .7);   // the tail fin
  const body = S([[60, 10], [92, 30], [100, 70], [88, 108], [60, 122], [32, 108], [20, 70], [28, 30]]);
  piece(g, tq, body);
  within(g, body, () => { g.fillStyle = co; for (const y of [56, 86]) g.fillRect(0, y, 140, 13); g.fillStyle = co2; g.fillRect(0, 108, 140, 20); });
  for (const [x, y] of [[44, 74], [60, 70], [76, 74], [52, 100], [68, 100]]) line(g, 'rgba(255,255,255,.6)', 1.8, arc(x, y, 7, .15 * PI, .85 * PI));
  piece(g, co2, E(60, 14, 15, 6), .5);   // its round mouth, where the wind goes in
  ink(g, '#FCF8F1', E(60, 14, 9, 3));
  for (const x of [44, 76]) { ink(g, '#FCF8F1', E(x, 36, 8, 8)); eye(g, x, 37, 5); }
  cheek(g, 36, 50, 6, 4); cheek(g, 84, 50, 6, 4);
  for (const s of [-1, 1]) piece(g, tq2, S([[60 + s * 36, 64], [60 + s * 52, 76], [60 + s * 40, 84]]), .6);   // side fins
}

// a child's spade: a yellow handle with a crossbar at the top, a pink blade
function drawSchep(g) {
  piece(g, '#F2C65C', C(30, 72, 30, 26, 4.6));
  piece(g, '#F2C65C', C(17, 18, 43, 18, 6.5));
  const blade = S([[14, 70], [46, 70], [50, 92], [30, 110], [10, 92]]);
  piece(g, '#F4A6C4', blade);
  ink(g, '#E48AAE', S([[30, 74], [44, 76], [46, 92], [30, 106]]));
  piece(g, '#E48AAE', round([[24, 64], [36, 64], [36, 74], [24, 74]], 3), .4);
}

// the ice cream seller behind his cart: a striped cap, an apron, a big smile. 0 waits, 1 scoops, 2 holds out a cone, 3 waves
function cone(g, x, y, k = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k);
  piece(g, '#E2B46A', P([[-13, -2], [13, -2], [0, 36]]), .7);
  for (let i = 0; i < 3; i++) { line(g, '#C79A66', 1.4, [[-11 + i * 7, -1], [3 + i * 4, 26]]); line(g, '#C79A66', 1.4, [[11 - i * 7, -1], [-3 - i * 4, 26]]); }
  piece(g, '#F4A6C4', U(E(0, -8, 14, 11), E(-9, -4, 6, 5), E(9, -4, 6, 5)), .7);
  piece(g, '#9ED9CF', E(0, -22, 11, 10), .7);
  ink(g, '#FCF8F1', E(-4, -26, 3, 2));
  g.restore();
}
function drawIjsverkoper(g, f) {
  const cx = 150, [sk, sk2] = SKIN.sun, shirt = '#7CB3D9', shirt2 = '#5F98C2';
  // his far arm, behind the cart's lid
  if (f !== 1) arm(g, shirt2, sk2, [cx + 26, 142], [cx + 44, 170], [cx + 70, 182], 10);
  const body = S([[cx - 34, 116], [cx + 34, 116], [cx + 44, 160], [cx + 46, 200], [cx - 46, 200], [cx - 44, 160]]);
  piece(g, shirt, body);
  piece(g, WHITE, S([[cx - 22, 128], [cx + 22, 128], [cx + 30, 200], [cx - 30, 200]]), .6);   // the apron
  line(g, '#E8A3BE', 2.4, [[cx - 22, 128], [cx - 14, 112]]); line(g, '#E8A3BE', 2.4, [[cx + 22, 128], [cx + 14, 112]]);
  // the cart: cream with pink stripes, a lid with three tubs, two wheels
  cart(g, 50, 262, 186, 296, '#FBF5EA', '#E2D6C1', '#F8C9DA');
  piece(g, '#E2D6C1', round([[44, 176], [268, 176], [268, 192], [44, 192]], 6));
  for (const [x, c] of [[90, '#F4A6C4'], [140, '#F7E7B0'], [190, '#9ED9CF']]) { piece(g, '#DAD6DE', round([[x - 22, 166], [x + 22, 166], [x + 20, 180], [x - 20, 180]], 4), .5); piece(g, c, U(E(x - 9, 166, 11, 8), E(x + 8, 165, 12, 9)), .5); }
  // his near arm and what is in his hand
  if (f === 1) { piece(g, '#B9B3C4', C(cx + 52, 150, cx + 42, 172, 3), .5); piece(g, '#B9B3C4', E(cx + 40, 174, 8, 6), .5); arm(g, shirt, sk, [cx - 20, 136], [cx + 16, 160], [cx + 52, 146], 10.5); }
  else if (f === 2) { arm(g, shirt, sk, [cx - 20, 136], [cx + 40, 132], [cx + 96, 118], 10.5); cone(g, cx + 104, 92, 1.1, .15); }
  else if (f === 3) arm(g, shirt, sk, [cx - 20, 136], [cx - 50, 100], [cx - 46, 56], 10.5);
  else arm(g, shirt, sk, [cx - 20, 136], [cx - 8, 162], [cx + 18, 178], 10.5);
  head(g, cx + 4, 78, f === 3 ? -.1 : 0, { skin: [sk, sk2], r: 40, ear: true, eyes: f === 3 ? 'glad' : 'open', mouth: f === 3 || f === 2 ? 'laugh' : 'smile',
    back: (_, r) => piece(g, '#7A5A3E', E(-10, 2, r + 2, r - 2)),
    top: (_, r) => { const capS = S([[-r - 6, -6], [-r + 2, -r + 2], [0, -r - 10], [r - 4, -r + 4], [r + 4, -8], [0, -18]]); piece(g, '#FCF8F1', capS, .7); stripes(g, capS, '#F4A6C4', 14, 6, true, 0); piece(g, '#E98F8F', S([[r - 14, -14], [r + 22, -10], [r + 20, -4], [r - 12, -6]]), .6); },
    front: () => piece(g, '#7A5A3E', S([[4, 14], [16, 9], [28, 14], [16, 15]]), .4) });   // a little moustache
}

// the lifeguard up on her tall white chair: a red suit, a whistle on a cord, a sun hat.
// 0 looks out to sea (binoculars on her chest), 1 looks through them, 2 waves, the whistle in her mouth
function drawBadmeester(g, f) {
  const cx = 110, [sk, sk2] = SKIN.rose, red = '#E8505B', red2 = '#C93C48', wood = '#FCF8F1', wood2 = '#E2D6C1';
  // the chair: two pairs of legs splayed, rungs, a seat, a back; all white wood
  for (const [x0, x1, c] of [[46, 74, wood2], [174, 146, wood2], [36, 66, wood], [184, 156, wood]]) piece(g, c, C(x0, 400, x1, 226, 6.5));
  for (const y of [270, 320, 370]) piece(g, wood, C(52 + (y - 226) * -.1, y, 168 + (y - 226) * .1, y, 4.5), .6);
  piece(g, wood2, C(58, 290, 160, 380, 3.5), .5);
  piece(g, wood, round([[50, 216], [174, 216], [174, 232], [50, 232]], 4));
  piece(g, wood, round([[52, 120], [64, 120], [64, 224], [52, 224]], 4));
  // the red float hanging on the back post
  piece(g, '#E98F8F', E(58, 176, 22, 22)); ink(g, '#FCF8F1', E(58, 176, 10, 10)); for (const a of [.3, 1.9, 3.5, 5.1]) ink(g, '#FCF8F1', P([[58 + Math.cos(a) * 10, 176 + Math.sin(a) * 10], [58 + Math.cos(a) * 22, 176 + Math.sin(a) * 22], [58 + Math.cos(a + .35) * 22, 176 + Math.sin(a + .35) * 22], [58 + Math.cos(a + .35) * 10, 176 + Math.sin(a + .35) * 10]]));
  // her legs over the front of the seat, hanging down
  leg(g, red2, '#E2B293', [cx + 2, 214], [cx + 42, 216], [cx + 44, 272], 11);
  leg(g, red, sk, [cx + 10, 212], [cx + 50, 212], [cx + 54, 268], 11.5);
  // her body, the far arm
  if (f === 1) arm(g, red2, sk2, [cx + 18, 140], [cx + 34, 120], [cx + 46, 96], 9);
  else arm(g, red2, sk2, [cx + 18, 140], [cx + 30, 172], [cx + 46, 196], 9);
  piece(g, red, S([[cx - 22, 124], [cx + 26, 124], [cx + 32, 170], [cx + 30, 214], [cx - 24, 214], [cx - 28, 170]]));
  piece(g, '#FCF8F1', U(E(cx - 6, 150, 7, 7), C(cx - 6, 150, cx + 8, 128, 2.2), C(cx - 6, 150, cx - 14, 128, 2.2)), .4);   // a white cross on her suit
  if (f === 0) { line(g, DARK, 1.6, [[cx - 2, 128], [cx + 8, 160]]); piece(g, '#4B3D3D', U(E(cx + 6, 166, 7, 6), E(cx + 18, 166, 7, 6)), .5); }   // the binoculars on their strap
  if (f !== 2) { line(g, '#F2C65C', 1.6, [[cx + 2, 128], [cx + 16, 152]]); piece(g, '#F2C65C', E(cx + 16, 156, 5, 4), .4); }   // the whistle on its cord
  // her near arm
  if (f === 1) arm(g, red, sk, [cx - 12, 140], [cx + 12, 120], [cx + 36, 98], 9.5);
  else if (f === 2) arm(g, red, sk, [cx - 12, 140], [cx - 40, 108], [cx - 38, 66], 9.5);
  else arm(g, red, sk, [cx - 12, 140], [cx - 2, 176], [cx + 24, 196], 9.5);
  head(g, cx + 4, 92, 0, { skin: [sk, sk2], r: 34, ear: true, eyes: f === 2 ? 'glad' : 'open', mouth: f === 2 ? 'none' : 'smile',
    back: (_, r) => { piece(g, '#D9764A', E(-6, 4, r + 3, r)); piece(g, '#D9764A', C(-r, 6, -r - 12, 34, 9, 6), .7); },
    top: (_, r) => { piece(g, '#F2C65C', E(2, -r + 6, r + 26, 9), .7); piece(g, '#F2C65C', S([[-r + 4, -r + 6], [-r + 10, -r - 16], [0, -r - 22], [r - 10, -r - 16], [r - 4, -r + 6]]), .7); ink(g, '#E8505B', P([[-r + 6, -r + 2], [r - 6, -r + 2], [r - 6, -r - 4], [-r + 6, -r - 4]])); },
    front: () => {
      if (f === 1) piece(g, '#4B3D3D', U(E(25, 2, 9, 8), E(8, 2, 8, 7), C(10, 2, 26, 2, 4)), .6);
      if (f === 2) { piece(g, '#F2C65C', round([[14, 16], [32, 16], [32, 24], [14, 24]], 3), .5); ink(g, '#C99B2E', E(30, 20, 2, 2)); }
    } });
}

// a lady sunbathing on a striped towel: a big sun hat, sunglasses, a book. 0 reads (the book up over her face), 1 peeks
// over it, 2 sits up and waves
function drawZonnebader(g, f) {
  const [sk, sk2] = SKIN.brown, suit = '#F2A07B', suit2 = '#E2803E', hat = '#F7E7B0', hat2 = '#E6CF8A';
  const towel = round([[18, 122], [342, 122], [342, 148], [18, 148]], 6);
  piece(g, '#FCF8F1', towel); stripes(g, towel, '#9ED9CF', 40, 16, true, 18); stripes(g, towel, '#F4A6C4', 40, 8, true, 38);
  // her legs, along the towel to the left (one knee up)
  piece(g, sk2, U(C(160, 126, 104, 124, 11), C(104, 124, 54, 126, 10)));
  piece(g, sk, U(C(170, 122, 128, 96, 12), C(128, 96, 82, 120, 11)));
  for (const [x, y, c] of [[44, 124, sk2], [74, 120, sk]]) piece(g, c, E(x, y, 11, 7), .6);
  ink(g, '#E8505B', U(E(38, 120, 3, 2.4), E(68, 116, 3, 2.4)));   // painted toes
  const glasses = () => { ink(g, '#4B3D3D', U(E(25, 2, 9, 7), E(5, 2, 8, 6.5))); line(g, '#4B3D3D', 2, [[12, 1], [17, 1]]); ink(g, 'rgba(255,255,255,.5)', E(28, -1, 3, 2)); };
  const hair = (_, r) => piece(g, '#4B3D3D', U(E(-8, 2, r + 4, r), E(-r + 2, 18, 12, 14)));
  if (f === 2) {   // sitting up, waving
    piece(g, suit, S([[180, 128], [178, 92], [196, 64], [236, 62], [252, 92], [248, 128]]));
    ink(g, suit2, S([[180, 112], [248, 112], [248, 128], [180, 128]]));
    arm(g, suit, sk2, [200, 72], [186, 102], [168, 120], 8.5, 8.5);
    arm(g, suit, sk, [234, 72], [262, 52], [268, 22], 8.5, 9);
    head(g, 222, 44, 0, { skin: [sk, sk2], r: 26, eyes: 'open', mouth: 'laugh', back: hair,
      top: (_, r) => { piece(g, hat, E(0, -r + 4, r + 26, 7), .7); piece(g, hat, S([[-r + 6, -r + 4], [-r + 10, -r - 12], [r - 10, -r - 12], [r - 6, -r + 4]]), .7); ink(g, hat2, P([[-r + 8, -r + 2], [r - 8, -r + 2], [r - 8, -r - 4], [-r + 8, -r - 4]])); }, front: glasses });
    return;
  }
  // lying on her back: her body along the towel, her head at the right, face up (drawn as a face turned to look up)
  piece(g, suit, S([[166, 132], [168, 108], [204, 102], [258, 104], [270, 120], [262, 134]]));
  ink(g, suit2, P([[196, 104], [208, 104], [208, 134], [196, 134]]));
  g.save(); g.transform(0, -1, -1, 0, 300, 100);   // her head: the top of it to the right, the face looking up
  piece(g, hat2, E(-2, -28, 42, 10), .7); piece(g, hat, E(-2, -25, 40, 10), .7); piece(g, hat, E(-2, -30, 24, 13), .7);
  head(g, 0, 0, 0, { skin: [sk, sk2], r: 24, eyes: 'open', mouth: 'smile', back: hair, front: glasses });
  g.restore();
  // the book, held up in both hands (lower when she peeks over it)
  const by = f === 1 ? 98 : 70, bx = f === 1 ? 248 : 262;
  arm(g, sk2, sk2, [226, 108], [236, by + 34], [bx - 10, by + 14], 7, 7);
  piece(g, '#7CB3D9', P([[bx - 34, by + 18], [bx, by + 2], [bx + 34, by + 18], [bx + 30, by + 26], [bx, by + 10], [bx - 30, by + 26]]));
  piece(g, '#FCF8F1', P([[bx - 28, by + 16], [bx, by + 4], [bx + 28, by + 16], [bx, by + 8]]), .3);
  arm(g, sk, sk, [244, 112], [256, by + 36], [bx + 12, by + 16], 7.5, 7.5);
}

/* ---------------- the rainbow island ---------------- */

// candy floss: a pink cloud on a stick
function floss(g, x, y, k = 1) {
  g.save(); g.translate(x, y); g.scale(k, k);
  piece(g, '#E8D5B0', C(0, 50, 0, 6, 3), .5);
  piece(g, '#F4A6C4', U(E(0, -6, 20, 17), E(-14, 4, 13, 12), E(14, 4, 13, 12), E(0, -18, 14, 12)), .8);
  for (const [a, b] of [[-8, -10], [6, -16], [8, 2], [-10, 6]]) line(g, '#FBD3E2', 2, arc(a, b, 5, PI, 1.8 * PI, 4));
  g.restore();
}
function drawSpin(g) { floss(g, 35, 44); }

// the candy floss seller at her cart, pink curls, a big candy floss on a stick for a sign.
// 0 spins (a stick in the machine, a little floss growing on it), 1 holds a candy floss out, 2 waves
function drawSuikerspin(g, f) {
  const cx = 160, [sk, sk2] = SKIN.rose, dress = '#BBA6EA', dress2 = '#9F88D6', curl = '#F4A6C4', curl2 = '#E48AAE';
  floss(g, 58, 66, 1.9);   // the sign: a giant one on a pole
  piece(g, '#E8D5B0', C(58, 190, 58, 150, 4.5));
  if (f !== 1) arm(g, dress2, sk2, [cx + 26, 150], [cx + 46, 172], [cx + 64, 182], 9.5);
  piece(g, dress, S([[cx - 32, 124], [cx + 32, 124], [cx + 44, 170], [cx + 46, 200], [cx - 46, 200], [cx - 42, 170]]));
  for (let k = 0; k < 3; k++) ink(g, '#FCF8F1', E(cx - 20 + k * 20, 172, 3, 3));
  cart(g, 54, 270, 192, 296, '#F8DDE4', '#EBC3D0', '#FCF8F1');
  // the machine: a round silver bowl on the cart
  piece(g, '#DAD6DE', S([[cx + 20, 168], [cx + 104, 168], [cx + 96, 194], [cx + 28, 194]]));
  ink(g, '#BDB7C6', P([[cx + 22, 168], [cx + 102, 168], [cx + 100, 174], [cx + 24, 174]]));
  if (f === 0) { piece(g, '#FBD3E2', U(E(cx + 62, 160, 24, 12), E(cx + 50, 156, 10, 8), E(cx + 76, 156, 10, 8)), .4); piece(g, '#E8D5B0', C(cx + 62, 158, cx + 40, 130, 2.6), .4); arm(g, dress, sk, [cx - 18, 140], [cx + 4, 154], [cx + 38, 132], 10); }
  else if (f === 1) { arm(g, dress, sk, [cx - 18, 140], [cx + 36, 136], [cx + 86, 120], 10); floss(g, cx + 94, 78, .9); }
  else arm(g, dress, sk, [cx - 18, 140], [cx - 48, 104], [cx - 40, 62], 10);
  head(g, cx + 4, 86, f === 2 ? -.1 : 0, { skin: [sk, sk2], r: 38, ear: true, eyes: f === 2 ? 'glad' : 'open', mouth: f === 2 ? 'laugh' : 'smile',
    back: (_, r) => piece(g, curl2, U(E(-12, 2, r + 4, r + 2), E(-r - 4, 22, 14, 14), E(-r + 6, 36, 13, 13))),
    top: (_, r) => { piece(g, curl, U(...[[-28, -24], [-10, -36], [10, -38], [28, -28], [-34, -6], [36, -14]].map(([a, b]) => E(a, b, 15, 13))), .7); for (const [a, b] of [[-10, -36], [10, -38], [-28, -24]]) line(g, curl2, 1.8, arc(a, b, 6, .9 * PI, 1.9 * PI, 4)); },
    front: () => piece(g, '#F2C65C', E(-6, -38, 6, 5), .5) });
}

// the alpaca: fluffy cream wool, a long neck, pompom ears, a lilac blanket with pink tassels.
// 0 stands, 1 and 2 walk, 3 is happy (a hop, its head up, eyes shut)
function drawAlpaca(g, f) {
  const c = '#F4ECDC', c2 = '#E2D6C1', sw = f === 1 ? 1 : f === 2 ? -1 : 0, up = f === 3 ? -2 : 6, tilt = f === 3 ? -.18 : 0;
  g.save(); g.translate(0, up);
  const legs = (x, s, col, tuck) => piece(g, col, C(x, 168, x + s * 7 + tuck, 212 - Math.abs(tuck) * .4, 9, 8));
  for (const [x, s] of [[70, sw], [126, -sw]]) legs(x, s, c2, f === 3 ? -8 : 0);
  piece(g, c2, U(E(50, 138, 14, 12)));   // the tail tuft
  piece(g, c, U(E(98, 146, 54, 34), E(64, 138, 26, 24), E(130, 138, 28, 26), E(80, 120, 22, 18), E(112, 118, 22, 18), E(96, 170, 40, 16)));
  for (const [x, s] of [[82, -sw], [138, sw]]) legs(x, s, c, f === 3 ? 8 : 0);
  // the blanket over its back
  const bl = S([[70, 112], [128, 112], [134, 142], [66, 142]]);
  piece(g, '#BBA6EA', bl, .7); ink(g, '#F4A6C4', P([[66, 130], [134, 130], [134, 136], [66, 136]]));
  for (let k = 0; k < 5; k++) piece(g, '#F4A6C4', U(C(72 + k * 15, 142, 72 + k * 15, 152, 2), E(72 + k * 15, 155, 4, 4)), .4);
  // the neck and the head, tilted up when it is happy
  g.save(); g.translate(140, 130); g.rotate(tilt); g.translate(-140, -130);
  piece(g, c, U(C(138, 132, 148, 66, 17, 15), E(142, 98, 18, 16), E(150, 76, 16, 14)));
  for (const [x, y] of [[130, 108], [136, 88]]) piece(g, c2, E(x, y, 7, 6), .3);
  for (const [x, col] of [[136, '#F4A6C4'], [160, '#BBA6EA']]) { piece(g, c2, C(x - 4, 44, x - 6, 26, 5, 4)); piece(g, col, E(x - 6, 22, 8, 8), .5); }
  piece(g, c, U(E(156, 52, 22, 20), E(172, 60, 15, 12)));
  piece(g, c2, U(E(144, 34, 10, 8), E(156, 30, 10, 8), E(168, 36, 9, 7)), .4);   // its fringe
  ink(g, '#D9C5B4', E(182, 60, 5, 4));
  if (f === 3) line(g, DARK, 2.4, arc(160, 52, 5, 1.2 * PI, 1.8 * PI)); else eye(g, 160, 50, 5);
  line(g, MOUTH, 2.2, arc(176, 64, 5, .2 * PI, .8 * PI)); cheek(g, 168, 64, 6, 4);
  g.restore();
  g.restore();
}

// the little monkey: brown with a cream face and big round ears, a curly tail.
// 0 sits, 1 claps and grins, 2 hangs by one arm (holding on over its head), 3 waves
function drawAapje(g, f) {
  const c = '#A9825A', c2 = '#8D6A48', face = '#F4DCC0', hang = f === 2, dy = 0;
  g.save(); g.translate(0, dy);
  piece(g, c2, strip([[54, 160], [30, 150], [22, 124], [36, 112], [46, 124]], 4.5), .6);   // the tail
  if (hang) { piece(g, c2, U(C(70, 150, 64, 184, 8), C(94, 150, 100, 182, 8))); piece(g, c, U(E(62, 186, 9, 7), E(102, 184, 9, 7))); }
  else { piece(g, c2, U(C(62, 162, 52, 178, 9), C(98, 162, 112, 176, 9))); piece(g, c, U(E(50, 180, 12, 7), E(116, 178, 12, 7))); }
  piece(g, c, E(80, 138, 30, 32));
  piece(g, face, E(84, 146, 18, 20), .4);
  // the arms
  if (f === 1) { piece(g, c, U(C(60, 124, 96, 128, 7), C(104, 122, 100, 128, 7))); piece(g, face, U(E(98, 124, 7, 7), E(106, 122, 7, 7)), .5); }
  else if (f === 2) { piece(g, c, C(94, 116, 92, 30, 7.5, 7)); piece(g, face, E(92, 26, 8, 8), .5); piece(g, c, C(62, 122, 54, 150, 7)); }
  else if (f === 3) { piece(g, c, C(100, 118, 122, 74, 7.5, 7)); piece(g, face, E(124, 70, 8, 8), .5); piece(g, c, C(62, 122, 58, 158, 7)); }
  else { piece(g, c, U(C(62, 122, 58, 160, 7), C(102, 122, 108, 158, 7))); piece(g, face, U(E(58, 162, 6.5, 6), E(108, 160, 6.5, 6)), .5); }
  // the head
  const hy = hang ? 74 : 82;
  for (const x of [56, 118]) { piece(g, c, E(x, hy - 4, 13, 13)); ink(g, face, E(x, hy - 4, 7, 7)); }
  piece(g, c, E(88, hy, 30, 28));
  piece(g, face, S([[70, hy - 6], [86, hy - 16], [92, hy - 8], [98, hy - 16], [112, hy - 4], [112, hy + 16], [90, hy + 24], [68, hy + 14]]), .4);
  piece(g, c2, U(E(80, hy - 30, 6, 5), E(88, hy - 32, 6, 5)), .3);
  if (f === 1) { line(g, DARK, 2.4, arc(84, hy + 2, 4.5, 1.2 * PI, 1.8 * PI)); line(g, DARK, 2.4, arc(102, hy + 2, 4.5, 1.2 * PI, 1.8 * PI)); ink(g, MOUTH, gg => { gg.moveTo(102, hy + 12); gg.arc(94, hy + 12, 8, 0, PI); gg.closePath(); }); }
  else { eye(g, 84, hy - 1, 4.4); eye(g, 102, hy - 1, 4.4); line(g, MOUTH, 2.2, arc(94, hy + 10, 6, .2 * PI, .8 * PI)); }
  ink(g, '#C99B85', U(E(90, hy + 6, 1.6, 1.4), E(96, hy + 6, 1.6, 1.4)));
  cheek(g, 76, hy + 10, 5, 3.5); cheek(g, 108, hy + 8, 5, 3.5);
  g.restore();
}

// a child of the island: a boy with dark curls, a yellow shirt, mint dungarees.
// 0 stands, 1 and 2 walk, 3 jumps for joy, both arms up
function drawKind(g, f) {
  const cx = 90, [sk, sk2] = SKIN.brown, shirt = '#F2C65C', shirt2 = '#D9A93E', dung = '#7CC2B6', dung2 = '#5FA89C', shoe = '#E8505B', shoe2 = '#C93C48';
  const s = f === 1 ? 1 : f === 2 ? -1 : 0, jump = f === 3, up = jump ? -12 : 0;
  g.save(); g.translate(0, up);
  if (jump) { leg(g, dung2, shoe2, [cx - 8, 190], [cx - 20, 206], [cx - 16, 226], 10); leg(g, dung, shoe, [cx + 10, 190], [cx + 22, 206], [cx + 20, 226], 10.5); }
  else { leg(g, dung2, shoe2, [cx - 8, 190], [cx - 8 - s * 8, 212], [cx - 10 - s * 14, 230], 10); leg(g, dung, shoe, [cx + 10, 190], [cx + 10 + s * 8, 212], [cx + 10 + s * 14, 230], 10.5); }
  if (jump) arm(g, shirt2, sk2, [cx + 16, 128], [cx + 30, 100], [cx + 36, 70], 8.5, 8.5);
  else arm(g, shirt2, sk2, [cx + 16, 128], [cx + 20 + s * 6, 152], [cx + 22 + s * 12, 176], 8.5, 8.5);
  piece(g, shirt, S([[cx - 26, 116], [cx + 26, 116], [cx + 32, 150], [cx + 30, 196], [cx - 30, 196], [cx - 32, 150]]));
  const dg = S([[cx - 22, 140], [cx + 22, 140], [cx + 30, 196], [cx - 30, 196]]); piece(g, dung, dg, .6);
  line(g, dung2, 3, [[cx - 18, 140], [cx - 14, 118]]); line(g, dung2, 3, [[cx + 18, 140], [cx + 14, 118]]);
  piece(g, dung2, round([[cx - 9, 150], [cx + 9, 150], [cx + 9, 164], [cx - 9, 164]], 3), .4);
  for (const x of [cx - 15, cx + 15]) ink(g, '#F2C65C', E(x, 142, 2.6, 2.6));
  if (jump) arm(g, shirt, sk, [cx - 16, 128], [cx - 34, 100], [cx - 36, 68], 9, 9);
  else arm(g, shirt, sk, [cx - 16, 128], [cx - 18 - s * 6, 152], [cx - 16 - s * 12, 178], 9, 9);
  head(g, cx + 2, 76, jump ? -.1 : 0, { skin: [sk, sk2], r: 40, ear: true, eyes: jump ? 'glad' : 'open', mouth: jump ? 'laugh' : 'smile',
    back: (_, r) => piece(g, '#4B3D3D', U(...[[-30, -14], [-36, 8], [-26, 26]].map(([a, b]) => E(a, b, 16, 15)))),
    top: () => piece(g, '#4B3D3D', U(...[[-26, -26], [-8, -38], [12, -38], [28, -28], [36, -14], [-36, -10]].map(([a, b]) => E(a, b, 14, 12)))) });
  g.restore();
}

/** every card: { w, h, draw, frames, size, does } */
/** a bottle with a message: pale green glass, a cork, a rolled-up note with a red ribbon inside; it lies a little tilted */
function drawFles(g) {
  g.save(); g.translate(60, 70); g.rotate(-.5);
  piece(g, '#9fd8b8', U(C(0, 34, 0, -8, 24), C(0, -14, 0, -44, 10)));          // the body and the neck
  ink(g, '#c6ecd6', C(-11, 30, -11, -6, 4));                                       // a shine down the glass
  piece(g, '#fbf5ea', C(4, 26, 4, -2, 9), .3); line(g, '#e8505b', 3, [[-5, 12], [13, 12]]);   // the note, and its ribbon
  piece(g, '#b98f5c', C(0, -44, 0, -54, 9));                                       // the cork
  g.restore();
}
// the cow and her calf: white with soft brown-black patches, a pink muzzle, a bell on a strap (the calf: smaller and rounder,
// no horns, no bell). 0 stands, 1-2 walk, 3 the cow moos (head up, mouth open, eyes shut happily) / the calf jumps for joy
const COW = { c: WHITE, c2: '#E6DED2', spot: '#5E4A42', pink: '#F4B8C4', horn: '#F2E3B8' };
function bovine(g, f, calf) {
  const k = COW, sw = f === 1 ? 1 : f === 2 ? -1 : 0, joy = f === 3, jump = calf && joy, moo = !calf && joy;
  const legLen = jump ? 26 : 50;
  const leg = (x, s, col) => { const dx = jump ? (x < 120 ? 10 : -10) : s * 8; piece(g, col, C(x, 150, x + dx, 150 + legLen, 11, 10)); piece(g, k.spot, E(x + dx, 154 + legLen, 10.5, 6.5), .3); };
  g.save(); if (jump) g.translate(0, -20);
  for (const [x, s] of [[80, sw], [150, -sw]]) leg(x, s, k.c2);
  piece(g, k.c2, strip([[50, 108], [40, 128], [38, 156]], 3.2), .4); piece(g, k.spot, E(38, 160, 6, 9), .3);   // the tail and its tuft
  const body = calf ? E(116, 122, 64, 44) : U(E(115, 118, 74, 44), E(80, 112, 30, 28));
  piece(g, k.c, body);
  within(g, body, () => { g.fillStyle = k.spot; for (const [x, y, rx, ry, r] of (calf ? [[96, 104, 20, 15, .3], [146, 132, 17, 12, -.2]] : [[82, 98, 24, 18, .4], [136, 128, 22, 15, -.3], [158, 96, 13, 10, .2]])) { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, PI * 2); g.fill(); } });
  for (const [x, s] of [[94, -sw], [164, sw]]) leg(x, s, k.c);
  // the head, on the right; up when she moos
  const hx = calf ? 198 : 204, hy = moo ? 70 : calf ? 92 : 84;
  piece(g, k.c, C(168, 112, hx - 8, hy + 10, 26, 21));
  if (!calf) for (const [x0, y0, x1, y1] of [[hx - 16, hy - 24, hx - 26, hy - 42], [hx + 4, hy - 28, hx + 12, hy - 44]]) piece(g, k.horn, C(x0, y0, x1, y1, 4.5, 2.5), .4);
  piece(g, k.c2, E(hx - 30, hy - 14, 14, 7, -.45));   // the ear
  piece(g, k.c, E(hx, hy, calf ? 30 : 31, calf ? 29 : 31));
  ink(g, k.spot, E(hx - 8, hy - 16, 13, 9, .2));
  ink(g, '#F4C7CF', E(hx - 30, hy - 14, 8, 3.5, -.45));
  piece(g, k.pink, E(hx + 18, hy + 17, 19, 14, .15), .5);
  for (const [x, y] of [[hx + 13, hy + 14], [hx + 26, hy + 15]]) ink(g, '#C98A98', E(x, y, 2.6, 2));
  if (joy) line(g, DARK, 2.4, arc(hx + 4, hy - 4, 5.5, 1.2 * PI, 1.8 * PI)); else eye(g, hx + 4, hy - 6, 5.6);
  cheek(g, hx - 2, hy + 10, 7, 4.5);
  if (moo) ink(g, MOUTH, E(hx + 22, hy + 26, 7.5, 6.5)); else line(g, MOUTH, 2, arc(hx + 18, hy + 22, 5, .2 * PI, .8 * PI));
  if (!calf) { line(g, '#C9433F', 4, [[hx - 22, hy + 22], [hx - 10, hy + 32], [hx + 4, hy + 30]]); piece(g, '#F2C65C', U(P([[hx - 18, hy + 30], [hx - 4, hy + 30], [hx - 1, hy + 48], [hx - 21, hy + 48]]), E(hx - 11, hy + 50, 4, 3)), .5); }   // the bell on its strap
  g.restore();
}
function drawKoe(g, f) { bovine(g, f, false); }
function drawKalf(g, f) { g.save(); g.translate(-4, 190 - 220 * .78); g.scale(.78, .78); bovine(g, f, true); g.restore(); }

// the goat: small and cream, little curved horns, a beard, perky ears. 0 stands, 1-2 walk, 3 rears up on its hind legs
function drawGeit(g, f) {
  const c = '#F6EEDD', c2 = '#E4D8C2', hoof = '#7A6250', sw = f === 1 ? 1 : f === 2 ? -1 : 0, rear = f === 3;
  g.save(); if (rear) { g.translate(62, 204); g.rotate(-.5); g.translate(-62, -204); }
  const leg = (x, s, col, tuck) => { const ex = tuck ? x + 16 : x + s * 7, ey = tuck ? 176 : 202; piece(g, col, C(x, 146, ex, ey, 6.5, 5.5)); piece(g, hoof, E(ex, ey + 2, 6, 4), .3); };
  for (const [x, s] of [[62, sw], [118, -sw]]) leg(x, s, c2, rear && x > 100);
  piece(g, c, U(C(44, 110, 34, 92, 6, 4)));   // the little tail, up
  piece(g, c, U(E(88, 124, 50, 30), E(60, 118, 22, 22)));
  ink(g, c2, E(86, 132, 30, 10));
  for (const [x, s] of [[74, -sw], [130, sw]]) leg(x, s, c, rear && x > 100);
  // the head
  const hx = 150, hy = 74;
  piece(g, c, C(122, 112, hx - 6, hy + 8, 18, 14));
  piece(g, '#C9A46A', strip([[hx - 6, hy - 16], [hx - 18, hy - 34], [hx - 34, hy - 38], [hx - 40, hy - 28]], 4), .4);   // the curved horn
  piece(g, c2, E(hx - 22, hy - 4, 16, 6.5, -.25));   // the ear, sticking out
  ink(g, '#F4C7CF', E(hx - 22, hy - 4, 9, 3, -.25));
  piece(g, c, U(E(hx, hy, 20, 19), E(hx + 16, hy + 10, 14, 11, .3)));
  piece(g, c2, strip([[hx + 10, hy + 20], [hx + 8, hy + 34], [hx + 4, hy + 42]], 4.5), .4);   // the beard
  eye(g, hx + 2, hy - 4, 4.8); cheek(g, hx + 2, hy + 8, 6, 4);
  ink(g, '#B08A7A', E(hx + 26, hy + 8, 2.4, 2)); line(g, MOUTH, 2, arc(hx + 20, hy + 14, 4, .2 * PI, .8 * PI));
  g.restore();
}

/** a telescope on its tripod: three wooden legs, a brass tube with dark bands, a big lens at the front (looking up and to the right) */
function drawKijker(g) {
  for (const [x, y] of [[34, 196], [86, 198], [132, 194]]) line(g, '#8d6a48', 6, [[84, 104], [x, y]]);
  piece(g, '#7a5a3e', E(84, 104, 9, 9));
  g.save(); g.translate(84, 92); g.rotate(-.42);
  piece(g, '#e0b453', U(C(-58, 0, 30, 0, 13), C(30, 0, 62, 0, 18)));
  for (const x of [-34, 12, 40]) ink(g, '#b98a3a', S([[x - 3, -16], [x + 3, -16], [x + 3, 16], [x - 3, 16]]));
  ink(g, '#f6dfa6', C(-50, -6, 50, -6, 3));
  piece(g, '#8fc3e0', E(64, 0, 5, 16)); piece(g, '#7a5a3e', C(-64, 0, -58, 0, 7));
  g.restore();
}
/** a hanging basket chair: a rope from the ceiling, a round woven basket open at the front, a pink cushion in it */
function drawHangstoel(g) {
  line(g, '#d8c9a8', 6, [[100, 0], [100, 132]]); piece(g, '#c9a46a', E(100, 138, 12, 9));
  piece(g, '#e8c896', E(100, 226, 84, 86));
  g.save(); g.beginPath(); g.ellipse(100, 226, 80, 82, 0, 0, Math.PI * 2); g.clip(); for (let i = -8; i <= 8; i++) { line(g, '#d2ad74', 3, [[100 + i * 16 - 40, 140], [100 + i * 16 + 40, 312]]); line(g, '#d2ad74', 3, [[100 + i * 16 + 40, 140], [100 + i * 16 - 40, 312]]); } g.restore();   // (the weave, kept inside the basket)
  piece(g, '#b98a54', E(100, 214, 64, 66));
  piece(g, '#f4a6c4', E(100, 196, 46, 40), .3); piece(g, '#f8c6d8', E(100, 268, 58, 18), .3);
  ink(g, '#fbe3ea', E(84, 182, 12, 9));
}
export const CARDS3 = {
  hangstoel: { w: 200, h: 320, draw: drawHangstoel, frames: 1, size: 2.1, does: ['chair'] },
  kijker: { w: 170, h: 200, draw: drawKijker, frames: 1, size: 1.15, does: ['telescope'] },
  koe: { w: 260, h: 220, draw: drawKoe, frames: 4, size: 1.35, does: ['stand', 'walk', 'walk', 'moo'] },
  kalf: { w: 200, h: 190, draw: drawKalf, frames: 4, size: .95, does: ['stand', 'walk', 'walk', 'jump'] },
  geit: { w: 190, h: 210, draw: drawGeit, frames: 4, size: 1.0, does: ['stand', 'walk', 'walk', 'rear'] },
  fles: { w: 120, h: 140, draw: drawFles, frames: 1, size: .55, does: ['bottle'] },
  walvis: { w: 520, h: 220, draw: drawWalvis, frames: 3, size: 3.2, does: ['back up', 'blow', 'tail'] },
  zeilboot: { w: 200, h: 240, draw: drawBoat(BOATS.zeilboot), frames: 2, size: 1.9, does: ['full', 'flutter'] },
  zeilboot2: { w: 200, h: 240, draw: drawBoat(BOATS.zeilboot2), frames: 2, size: 1.9, does: ['full', 'flutter'] },
  zeilboot3: { w: 200, h: 240, draw: drawBoat(BOATS.zeilboot3), frames: 2, size: 1.9, does: ['full', 'flutter'] },
  zeilboot4: { w: 200, h: 240, draw: drawBoat(BOATS.zeilboot4), frames: 2, size: 1.9, does: ['full', 'flutter'] },
  kokosnoot: { w: 80, h: 80, draw: drawKokos, frames: 1, size: .32, does: ['coconut'] },
  viskite: { w: 120, h: 200, draw: drawVisKite, frames: 3, size: .95, thing: true, does: ['straight', 'left', 'right'] },
  schep: { w: 60, h: 120, draw: drawSchep, frames: 1, size: .5, does: ['spade'] },
  ijsverkoper: { w: 300, h: 330, draw: drawIjsverkoper, frames: 4, size: 1.75, does: ['wait', 'scoop', 'cone', 'wave'] },
  ijsje: { w: 60, h: 100, draw: g => cone(g, 30, 58), frames: 1, size: .32, does: ['ice cream'] },
  badmeester: { w: 220, h: 420, draw: drawBadmeester, frames: 3, size: 2.6, does: ['look out', 'binoculars', 'wave'] },
  zonnebader: { w: 360, h: 160, draw: drawZonnebader, frames: 3, size: .9, does: ['read', 'peek', 'wave'] },
  suikerspin: { w: 300, h: 340, draw: drawSuikerspin, frames: 3, size: 1.75, does: ['spin', 'give', 'wave'] },
  spin: { w: 70, h: 110, draw: drawSpin, frames: 1, size: .38, does: ['candy floss'] },
  alpaca: { w: 200, h: 240, draw: drawAlpaca, frames: 4, size: 1.3, does: ['stand', 'walk', 'walk', 'happy'] },
  aapje: { w: 160, h: 200, draw: drawAapje, frames: 4, size: .85, does: ['sit', 'clap', 'hang', 'wave'] },
  kind: { w: 180, h: 260, draw: drawKind, frames: 4, size: 1.1, does: ['stand', 'walk', 'walk', 'cheer'] },
};
