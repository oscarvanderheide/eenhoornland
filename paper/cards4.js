// A fourth batch of paper cards (see STYLE.md): who swims in the beach's bathing lagoon (lagoon.js). A child in a rubber
// ring, a grandpa floating on his back, a boy with a snorkel, a white seal pup, and the big yellow rubber duck she can
// ride. They are in the water: each card shows only what is above it, and the waterline is the bottom of the drawing,
// with a little ring of water round it. All face right (the world flips them). The sheet is cards4.html.
import { E, S, C, U, P, piece, ink, line, eye } from './cut.js';

const DARK = '#33262E', PI = Math.PI, WHITE = '#FCF8F1', MOUTH = '#8A3D4C';
const WATER = '#B4E0DC', FOAM = '#EAF7F4';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
const cheek = (g, x, y, rx = 7, ry = 5, a = .4) => ink(g, `rgba(240,120,150,${a})`, E(x, y, rx, ry));
/** a band of water where somebody sits in it: a flat oval of pale water with a white curl on it (the card's waterline) */
function ripple(g, cx, y, rx) {
  piece(g, WATER, S([[cx - rx, y], [cx - rx * .7, y - 8], [cx, y - 9], [cx + rx * .7, y - 8], [cx + rx, y], [cx + rx * .7, y + 7], [cx, y + 8], [cx - rx * .7, y + 7]]), .5);
  line(g, FOAM, 2.2, arc(cx - rx * .45, y + 6, rx * .3, 1.15 * PI, 1.75 * PI, 5)); line(g, FOAM, 2.2, arc(cx + rx * .4, y + 6, rx * .25, 1.2 * PI, 1.8 * PI, 5));
}
/** drops of water flying off (pieces: they stick out) */
const drops = (g, pts, r = 4.5) => { for (const [x, y] of pts) piece(g, FOAM, S([[x, y - r * 1.5], [x + r, y], [x, y + r], [x - r, y]]), .4); };

/* ---------- people: a head with a face, arms (as in cards3.js) ---------- */
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
  if (!o.noEyes) { eyeAt(g, 25, 3, 5, eyes); eyeAt(g, 4, 3, 4.4, eyes); }
  ink(g, 'rgba(240,120,140,.45)', E(33, 18, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(-4, 18, 6, 4.5));
  ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'laugh') { ink(g, MOUTH, gg => { gg.moveTo(26, 18); gg.arc(16, 18, 10, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(16, 24.5, 5, 2.6)); }
  if (m === 'oh') ink(g, MOUTH, E(17, 23, 4.2, 5));
  if (o.front) o.front(g, r);
  g.restore();
}
function arm(g, col, skin, s, e, h, r = 10, hr = 9.5) { piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5))); piece(g, skin, E(h[0], h[1], hr, hr), .7); }

/* ---------------- a girl in a rubber ring ---------------- */
// pink and white, a mint swimsuit, two orange bunches. 0 floats, her arms on the ring; 1 and 2 paddle (one hand, then the
// other, in the water in front); 3 waves, laughing, the water splashing
const RING = '#F4A6C4', RING2 = '#E48AAE';
/** the ring seen a little from above: its far half behind her (`far`), its near half in front of her */
function ring(g, cx, cy, far) {
  const rx = 66, ry = 24, ix = 38, iy = 10, icy = cy - 5;
  const band = far
    ? gg => { gg.moveTo(cx - rx, cy); gg.ellipse(cx, cy, rx, ry, 0, PI, 2 * PI, false); gg.lineTo(cx + ix, icy); gg.ellipse(cx, icy, ix, iy, 0, 2 * PI, PI, true); gg.closePath(); }
    : gg => { gg.moveTo(cx + rx, cy); gg.ellipse(cx, cy, rx, ry, 0, 0, PI, false); gg.lineTo(cx - ix, icy); gg.ellipse(cx, icy, ix, iy, 0, PI, 0, true); gg.closePath(); };
  piece(g, far ? RING2 : RING, band, far ? .5 : 1);
  within(g, band, () => { g.fillStyle = WHITE; for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * PI + .2, b = a + .36; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * rx * 1.5, cy + Math.sin(a) * ry * 1.5); g.lineTo(cx + Math.cos(b) * rx * 1.5, cy + Math.sin(b) * ry * 1.5); g.closePath(); g.fill(); } });
  if (!far) line(g, 'rgba(255,255,255,.6)', 3, arc(cx - 18, cy + 4, 34, .6 * PI, .9 * PI, 5));
}
function drawZwemkind(g, f) {
  const cx = 86, WL = 150, [sk, sk2] = SKIN.rose, suit = '#9ED9CF', suit2 = '#7CC2B6', hair = '#E2803E', hair2 = '#C96A2C';
  ripple(g, cx, WL + 2, 74);
  ring(g, cx, WL - 14, true);
  // her far arm
  if (f === 1) arm(g, suit2, sk2, [cx + 6, WL - 58], [cx + 40, WL - 46], [cx + 70, WL - 26], 8);
  else arm(g, suit2, sk2, [cx + 6, WL - 58], [cx + 30, WL - 40], [cx + 52, WL - 30], 8);
  const body = S([[cx - 24, WL - 70], [cx + 22, WL - 70], [cx + 28, WL - 36], [cx + 30, WL - 14], [cx - 30, WL - 14], [cx - 28, WL - 36]]);
  piece(g, suit, body); within(g, body, () => { g.fillStyle = WHITE; for (const [x, y] of [[-12, 50], [8, 56], [-4, 36], [16, 34], [-18, 26]]) { g.beginPath(); g.arc(cx + x, WL - y, 3.4, 0, 2 * PI); g.fill(); } });
  ring(g, cx, WL - 14, false);
  // her near arm
  if (f === 2) arm(g, suit, sk, [cx - 10, WL - 58], [cx + 24, WL - 44], [cx + 58, WL - 18], 8.5);
  else if (f === 3) arm(g, suit, sk, [cx - 10, WL - 58], [cx - 36, WL - 86], [cx - 34, WL - 120], 8.5);
  else arm(g, suit, sk, [cx - 10, WL - 58], [cx + 8, WL - 36], [cx + 34, WL - 30], 8.5);
  head(g, cx + 4, WL - 98, f === 3 ? -.12 : 0, { skin: [sk, sk2], r: 33, ear: true, eyes: f === 3 ? 'glad' : 'open', mouth: f === 3 ? 'laugh' : 'smile',
    back: (_, r) => { piece(g, hair2, E(-6, 0, r + 3, r)); for (const s of [-1, 1]) piece(g, hair, E(-r + 4, s * 16 - 10, 13, 12), .7); },
    top: (_, r) => { piece(g, hair, S([[-r - 2, 2], [-r + 4, -r + 8], [0, -r - 6], [r - 2, -r + 10], [r + 2, -8], [6, -16], [-10, -10]]), .7); piece(g, '#F2C65C', U(E(-18, -r + 2, 6, 6), E(-8, -r - 2, 6, 6), E(-12, -r + 8, 5, 5)), .5); } });
  if (f === 3) drops(g, [[cx + 36, WL - 26], [cx + 52, WL - 40], [cx - 52, WL - 30], [cx - 62, WL - 14]]);
  if (f === 1 || f === 2) drops(g, [[cx + 74, WL - 20], [cx + 62, WL - 34]], 4);
}

/* ---------------- a grandpa floating on his back ---------------- */
// round tummy in red and white striped trunks, his toes up at one end, his face to the sky at the other. 0 floats, eyes
// shut; 1 blows a fountain out of his mouth like a whale; 2 wiggles his toes and waves, laughing
function drawDrijver(g, f) {
  const WL = 178, [sk, sk2] = SKIN.sun, hx = 248, hy = WL - 32, tilt = -1.0;
  ripple(g, 160, WL + 2, 144);
  // the far foot and the near one, toes up out of the water (wiggling in frame 2)
  const toes = f === 2 ? [-.3, .3] : [0, 0];
  for (const [x, c, a] of [[44, sk2, toes[0]], [60, sk, toes[1]]]) { g.save(); g.translate(x, WL - 2); g.rotate(a); piece(g, c, U(C(0, 0, 0, -14, 7, 8), E(3, -20, 8.5, 7.5))); g.restore(); }
  // his round tummy out of the water, red and white striped trunks over the lower end of it
  const tum = S([[84, WL], [96, WL - 30], [140, WL - 44], [186, WL - 30], [198, WL], [140, WL + 2]]);
  piece(g, sk, tum);
  within(g, tum, () => { g.fillStyle = '#E8505B'; g.fillRect(60, WL - 70, 62, 80); g.fillStyle = WHITE; for (let x = 66; x < 122; x += 13) g.fillRect(x, WL - 70, 5, 80); });
  ink(g, sk2, E(150, WL - 30, 3, 2.4));   // his belly button
  // the fountain, out of his mouth (behind his head: it rises above his face)
  if (f === 1) {
    const mx = 270, top = 22;
    piece(g, '#D8ECF1', U(C(mx - 3, WL - 40, mx - 6, top + 30, 5, 9), C(mx + 3, WL - 40, mx + 6, top + 30, 5, 9)));
    piece(g, WHITE, U(E(mx - 22, top + 16, 16, 12), E(mx, top + 8, 18, 13), E(mx + 20, top + 16, 15, 12), E(mx, top + 24, 14, 10)));
    drops(g, [[mx - 40, top + 38], [mx + 34, top + 42], [mx - 34, top + 64], [mx + 28, top + 70]]);
  }
  if (f === 2) arm(g, sk, sk, [212, WL - 4], [226, WL - 46], [214, WL - 84], 8.5, 9.5);   // a wave, out of the water by his head
  // his head, leaning back on the water, his face to the sky: bald, white hair round the back, a white moustache
  head(g, hx, hy, tilt, { skin: [sk, sk2], r: 28, ear: true, eyes: f === 0 ? 'shut' : f === 2 ? 'glad' : 'open', mouth: f === 1 ? 'oh' : f === 2 ? 'laugh' : 'smile',
    back: (_, r) => piece(g, '#F4ECDC', U(E(-r + 4, 10, 9, 13), E(-r + 8, -10, 9, 10))),
    front: () => { if (f !== 1) piece(g, '#F4ECDC', S([[6, 13], [16, 9], [27, 13], [16, 15]]), .4); } });
  if (f === 2) drops(g, [[30, WL - 44], [70, WL - 50], [50, WL - 58]]);
}

/* ---------------- a boy with a mask and a snorkel ---------------- */
// 0 looks about, the mask on his face; 1 puts his face in the water (the top of his head and the snorkel); 2 comes up and
// blows the water out of the snorkel, laughing; 3 swims under: only the tip of the snorkel goes along
const TUBE = '#F2C65C', TUBE2 = '#E0A93A', TIP = '#E8505B';
function drawSnorkelaar(g, f) {
  const cx = 80, WL = 194, [sk, sk2] = SKIN.brown, hair = '#4B3D3D', strap = '#4B9BA8', vest = '#7CB3D9';
  if (f === 3) {   // under water: the tube's tip, a ring of water round it, a few bubbles
    ripple(g, cx, WL + 2, 30);
    piece(g, TUBE, C(cx, WL - 2, cx, WL - 40, 6)); piece(g, TIP, round([[cx - 8, WL - 50], [cx + 8, WL - 50], [cx + 8, WL - 38], [cx - 8, WL - 38]], 3), .6);
    for (const [x, y, r] of [[cx + 22, WL - 10, 5], [cx + 32, WL - 24, 4], [cx + 26, WL - 36, 3]]) { piece(g, FOAM, E(x, y, r, r), .3); ink(g, WATER, E(x - 1, y - 1, r * .5, r * .5)); }
    return;
  }
  ripple(g, cx, WL + 2, 64);
  const down = f === 1, rot = down ? .95 : f === 2 ? -.15 : 0, hy = down ? WL - 26 : WL - 70;
  // shoulders out of the water (not when his face is in it)
  if (!down) { const sh = S([[cx - 36, WL], [cx - 32, WL - 20], [cx, WL - 27], [cx + 32, WL - 20], [cx + 36, WL]]); piece(g, vest, sh); within(g, sh, () => { g.fillStyle = WHITE; g.fillRect(cx - 50, WL - 12, 100, 5); }); }   // his shoulders, in a blue swim shirt
  // the snorkel behind his head: a tube from his mouth round the far side and up, a red tip
  g.save(); g.translate(cx + 2, hy); g.rotate(rot);
  piece(g, TUBE2, U(C(14, 20, -16, 22, 4.5), C(-16, 22, -26, -6, 5), C(-26, -6, -22, -58, 5.5)));
  piece(g, TIP, round([[-30, -70], [-14, -70], [-14, -56], [-30, -56]], 3), .6);
  if (f === 2) {   // the water he blows out of it
    piece(g, '#D8ECF1', U(C(-22, -72, -28, -92, 4, 6), C(-22, -72, -14, -92, 4, 6)), .5);
    piece(g, WHITE, U(E(-32, -98, 9, 7), E(-21, -102, 10, 8), E(-10, -96, 8, 7)), .5);
  }
  g.restore();
  head(g, cx + 2, hy, rot, { skin: [sk, sk2], r: 32, ear: true, eyes: f === 2 ? 'glad' : 'open', mouth: f === 2 ? 'laugh' : 'none',
    back: (_, r) => piece(g, hair, E(-6, -2, r + 2, r - 1)),
    top: (_, r) => { piece(g, hair, U(...[[-24, -20], [-6, -30], [14, -28], [28, -16], [-30, -2]].map(([a, b]) => E(a, b, 13, 11))), .7);
      piece(g, strap, C(-r + 2, -2, 6, -8, 3.4), .4); },   // the mask's strap round his head
    front: (_, r) => {
      // the mask: a pale blue window over his eyes, its blue rim, a white glint; the mouthpiece
      piece(g, strap, round([[-4, -12], [36, -12], [38, 14], [-2, 14]], 8), .6);
      piece(g, '#CFEAF0', round([[0, -8], [33, -8], [34, 10], [2, 10]], 6), .3);
      if (f !== 2) { eyeAt(g, 25, 2, 4.6, 'open'); eyeAt(g, 8, 2, 4, 'open'); } else { eyeAt(g, 25, 2, 4.6, 'glad'); eyeAt(g, 8, 2, 4, 'glad'); }
      ink(g, 'rgba(255,255,255,.7)', P([[6, -6], [12, -6], [6, 4]]));
      if (f !== 2) piece(g, TUBE2, round([[10, 18], [26, 18], [26, 26], [10, 26]], 3), .4);
    }, noEyes: true });
  if (f === 2) drops(g, [[cx - 44, 62], [cx + 4, 56], [cx - 52, 92], [cx + 14, 86]]);
  if (down) drops(g, [[cx + 40, WL - 14], [cx - 36, WL - 10]], 4);
}

/* ---------------- a white seal pup ---------------- */
// fluffy and round, big dark eyes, a black nose. 0 floats, its head up; 1 rolls over and claps its flippers; 2 dives: only
// its back flippers up out of the water
function drawZeehondje(g, f) {
  const c = '#F4F1EA', c2 = '#DCD8CF', WL = 116, cx = 90;
  if (f === 2) {   // diving: the back flippers, a splash
    ripple(g, cx, WL + 2, 44);
    g.save(); g.translate(cx, WL - 4); g.rotate(-.2);
    piece(g, c2, C(0, 0, 0, -26, 13, 10));
    piece(g, c, U(S([[0, -24], [-26, -50], [-32, -42], [-8, -18]]), S([[0, -24], [26, -50], [32, -42], [8, -18]])));
    g.restore();
    drops(g, [[cx - 38, WL - 26], [cx + 36, WL - 30], [cx - 26, WL - 46], [cx + 28, WL - 52]]);
    return;
  }
  ripple(g, cx, WL + 2, 64);
  if (f === 1) {   // on its back: the round belly up, the flippers up together, its head back to the right
    piece(g, c, S([[cx - 56, WL], [cx - 44, WL - 26], [cx, WL - 36], [cx + 42, WL - 28], [cx + 58, WL]]));
    for (const [x, a, k] of [[cx - 8, -.35, c2], [cx + 12, .35, c]]) { g.save(); g.translate(x, WL - 30); g.rotate(a); piece(g, k, S([[-7, 0], [-10, -26], [0, -36], [10, -26], [7, 0]]), .7); g.restore(); }
    piece(g, c, E(cx + 58, WL - 20, 26, 22));
    line(g, DARK, 2.4, arc(cx + 60, WL - 24, 5, 1.2 * PI, 1.8 * PI)); line(g, DARK, 2.4, arc(cx + 72, WL - 26, 4, 1.2 * PI, 1.8 * PI));
    piece(g, DARK, E(cx + 80, WL - 14, 4.4, 3.4), .3); cheek(g, cx + 54, WL - 14, 6, 4);
    drops(g, [[cx - 4, WL - 70], [cx + 20, WL - 74], [cx - 18, WL - 60]]);
    return;
  }
  // floating: its back just out of the water, the round head up, a front flipper paddling
  piece(g, c2, S([[cx - 60, WL], [cx - 52, WL - 14], [cx - 20, WL - 24], [cx + 20, WL - 22], [cx + 40, WL]]));
  piece(g, c, U(E(cx + 30, WL - 34, 36, 34)));
  for (const [x, y, r] of [[cx + 2, WL - 60, 8], [cx + 14, WL - 66, 7], [cx - 2, WL - 46, 7]]) piece(g, c, E(x, y, r, r - 1), .3);   // fluff
  piece(g, c2, S([[cx + 6, WL - 6], [cx + 24, WL - 18], [cx + 30, WL - 8], [cx + 18, WL]]), .6);   // the flipper
  ink(g, c2, E(cx + 50, WL - 22, 16, 11));   // its muzzle
  eye(g, cx + 42, WL - 44, 6.4); eye(g, cx + 22, WL - 44, 5.2);
  piece(g, DARK, E(cx + 58, WL - 30, 5.4, 4.2), .3);
  for (const [x1, y1, x2, y2] of [[cx + 52, WL - 22, cx + 66, WL - 24], [cx + 52, WL - 18, cx + 66, WL - 16]]) line(g, '#B9B3A8', 1.2, [[x1, y1], [x2, y2]]);
  line(g, MOUTH, 2.2, arc(cx + 54, WL - 26, 5, .25 * PI, .75 * PI)); cheek(g, cx + 36, WL - 26, 7, 5);
}

/* ---------------- the big yellow rubber duck ---------------- */
// to sit on and float: a fat yellow body with a dip to sit in, a curled tail, a big head with an orange beak.
// 0 floats, 1 squeaks (its beak open)
function drawBadeend(g, f) {
  const Y = '#F6D365', Y2 = '#E8B940', WL = 184, beak = '#F2A07B', beak2 = '#E2803E';
  ripple(g, 130, WL + 2, 116);
  // the body: low in the middle where she sits, the tail curled up at the back
  const body = S([[22, WL], [14, WL - 52], [28, WL - 84], [42, WL - 60], [70, WL - 52], [130, WL - 50], [180, WL - 62], [228, WL - 54], [244, WL], [130, WL + 4]]);
  piece(g, Y2, S([[30, WL - 50], [24, WL - 92], [46, WL - 70]]), .5);   // the far side of the tail
  piece(g, Y, body);
  ink(g, Y2, S([[24, WL - 6], [130, WL - 10], [240, WL - 6], [240, WL], [24, WL]]));
  ink(g, 'rgba(255,250,230,.7)', S([[60, WL - 40], [120, WL - 44], [150, WL - 40], [110, WL - 34]]));   // a shine
  // the wing, a curve of darker yellow
  piece(g, Y2, S([[84, WL - 22], [100, WL - 42], [140, WL - 44], [158, WL - 30], [126, WL - 18]]), .5);
  // the head on its fat neck, at the front
  piece(g, Y, U(C(196, WL - 50, 200, WL - 104, 30, 26), E(204, WL - 124, 40, 38)));
  ink(g, 'rgba(255,250,230,.7)', E(188, WL - 144, 10, 7, -.5));
  // the beak: shut, or open in a squeak
  if (f === 1) { piece(g, beak2, S([[234, WL - 116], [264, WL - 104], [260, WL - 96], [232, WL - 102]]), .6); piece(g, beak, S([[234, WL - 124], [266, WL - 136], [270, WL - 126], [236, WL - 112]]), .6); ink(g, MOUTH, E(240, WL - 112, 5, 4)); }
  else piece(g, beak, S([[232, WL - 126], [264, WL - 120], [268, WL - 110], [234, WL - 104]]), .6);
  eye(g, 216, WL - 136, 6.2); cheek(g, 214, WL - 116, 9, 6);
  // a little float valve, white, on its side
  piece(g, WHITE, E(170, WL - 30, 5, 4), .3);
}

/** every card: { w, h, draw, frames, size, does } */
export const CARDS4 = {
  zwemkind: { w: 180, h: 176, draw: drawZwemkind, frames: 4, size: .8, does: ['float', 'paddle', 'paddle', 'wave'] },
  drijver: { w: 320, h: 196, draw: drawDrijver, frames: 3, size: 1.25, does: ['float', 'fountain', 'wiggle'] },
  snorkelaar: { w: 170, h: 216, draw: drawSnorkelaar, frames: 4, size: .92, does: ['look', 'face in', 'blow', 'under'] },
  zeehondje: { w: 196, h: 132, draw: drawZeehondje, frames: 3, size: .5, does: ['float', 'clap', 'dive'] },
  badeend: { w: 290, h: 206, draw: drawBadeend, frames: 2, size: 1.0, thing: true, does: ['float', 'squeak'] },
};
