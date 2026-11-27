// The musicians of the paper world, cut by the same scissors as the grown-ups in people.js (see STYLE.md): a big round head,
// dot eyes, a small smile, pink cheeks, rounded limbs, few flat pieces on a white card. All face right (the world flips them).
// What somebody plays or sits on is part of his drawing. Drawn at 200 units a step, like Anna. The sheet is people2.html.
import { E, S, C, U, P, piece, ink, line } from './cut.js';

const DARK = '#33262E', PI = Math.PI, WHITE = '#FCF8F1', CREAM = '#F4ECDC', SAND = '#E2D6C1', MOUTH = '#8A3D4C';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shape with straight sides and corners rounded by r */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** a bent strip of paper: capsules along a row of points */
const strip = (pts, r) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r)));
/** printed pictures that stay inside one shape */
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
/** turn what `fn` draws by `rot` about (x, y) */
const turn = (g, x, y, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.translate(-x, -y); fn(); g.restore(); };
/** something drawn about (0, 0), put at (x, y), k times as big, turned by rot */
const put = (g, x, y, k, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); fn(); g.restore(); };
/** the point p turned by a about o */
const about = (p, o, a) => [o[0] + (p[0] - o[0]) * Math.cos(a) - (p[1] - o[1]) * Math.sin(a), o[1] + (p[0] - o[0]) * Math.sin(a) + (p[1] - o[1]) * Math.cos(a)];
/** the height of a bent line (points from left to right) at x */
const yAt = (pts, x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0] || i === pts.length - 1) { const [a, b] = [pts[i - 1], pts[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } };
/** a star with five points */
const star = (x, y, r) => P(Array.from({ length: 10 }, (_, i) => { const a = -PI / 2 + i * PI / 5, k = i % 2 ? r * .46 : r; return [x + Math.cos(a) * k, y + Math.sin(a) * k]; }));

/* ---------- the doll (as in people.js): a head with a face, arms and legs that bend ---------- */
const SKIN = { rose: ['#F4CDB0', '#E2B293'], sun: ['#EBBD98', '#D4A27C'], brown: ['#C99168', '#B07B55'] };
/** an eye: 'open' a dot with a glint, 'wide' a bigger dot, 'shut' a little arc hanging down, 'glad' an arc standing up (laughing) */
function eyeAt(g, x, y, r, how) {
  if (how === 'shut') return line(g, DARK, 2.4, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, 2.4, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  const k = how === 'wide' ? 1.3 : 1;
  ink(g, DARK, E(x, y, r * .86 * k, r * 1.08 * k)); ink(g, '#fff', E(x + r * .3 * k, y - r * .4 * k, r * .32 * k, r * .32 * k));
}
/** the head, turned by `rot` about its middle (x, y). o: skin [main, shade], r, eyes (or [near, far]), mouth ('none' when something is held to it), ear,
 *  puff (round cheeks full of air: two pieces that bulge out of the face), back(g, r) drawn behind the face (hair),
 *  top(g, r) on the face under the eyes (fringe, hat, beard), front(g, r) over the face */
function head(g, x, y, rot, o) {
  const r = o.r || 44, [sk, sk2] = o.skin, eyes = Array.isArray(o.eyes) ? o.eyes : [o.eyes || 'open', o.eyes || 'open'], m = o.mouth || 'smile';
  g.save(); g.translate(x, y); g.rotate(rot);
  if (o.back) o.back(g, r);
  if (o.ear) piece(g, sk2, E(-r * .62, 8, 7.5, 9.5), .6);
  piece(g, sk, E(0, 0, r, r - 1));
  if (o.top) o.top(g, r);
  if (o.puff) { piece(g, sk, E(34, 19, 13.5, 12), .6); piece(g, sk, E(-4, 19, 10, 9.5), .5); }
  eyeAt(g, 25, 3, 5.2, eyes[0]); eyeAt(g, 4, 3, 4.5, eyes[1]);
  if (o.puff) { ink(g, 'rgba(240,110,135,.55)', E(35, 20, 10, 8.5)); ink(g, 'rgba(240,110,135,.45)', E(-4, 20, 7.5, 6.5)); }
  else { ink(g, 'rgba(240,120,140,.45)', E(33, 18, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(-4, 18, 6, 4.5)); }
  if (o.nose !== false) ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'small') line(g, MOUTH, 2.4, arc(16, 19, 4.5, .15 * PI, .85 * PI));
  if (m === 'laugh') { ink(g, MOUTH, gg => { gg.moveTo(26, 18); gg.arc(16, 18, 10, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(16, 24.5, 5, 2.6)); }
  if (m === 'oh') ink(g, MOUTH, E(17, 23, 4.2, 5));
  if (o.front) o.front(g, r);
  g.restore();
}
/** a head of short hair: a cap over the top and the back of the head, with a short fringe */
const hairTop = (g, col, r) => piece(g, col, S([[-r + 12, 28], [-r - 4, 6], [-r - 3, -24], [-22, -r - 3], [6, -r - 6], [32, -r + 3], [r + 3, -20], [r + 4, -8], [r - 8, -16], [24, -22], [6, -26], [-10, -20], [-18, -4], [-17, 16]]));
/** a sleeve bent at the elbow (the hand is drawn apart, so it can lie on top of what it holds) */
const sleeve = (g, col, s, e, h, r = 10) => piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5)));
const hand = (g, col, h, r = 9.5) => piece(g, col, E(h[0], h[1], r, r), .7);
/** an arm in one piece of sleeve, bent at the elbow, with a round hand */
function arm(g, col, skin, s, e, h, r = 10, hr = 9.5) { sleeve(g, col, s, e, h, r); hand(g, skin, h, hr); }
/** a leg bent at the knee and a shoe flat on the ground */
function leg(g, col, shoeCol, hip, knee, foot, r = 12) {
  piece(g, col, U(C(...hip, ...knee, r), C(...knee, ...foot, r, r - 1)));
  piece(g, shoeCol, E(foot[0] + 6, foot[1] + 9, 17, 8.5));
}

/* ---------- the guitar player ---------- */
// a young woman of the beach, sitting (as on a low log: her seat is PEOPLE2.gitarist.seat): a straw sun hat, long brown hair,
// a sea-green dress, bare feet, a guitar on her knee with its neck up to the right.
// 0 the strumming hand high, 1 low, 2 looks up and laughs, the hand lifted off the strings, 3 tips her hat (the hand resting on the guitar)
function sunHat(g, x, y, rot) {
  put(g, x, y, 1, rot, () => {
    piece(g, '#E6B748', C(-55, 0, 55, 0, 5.5));
    piece(g, '#E6B748', S([[-29, 2], [-29, -22], [-13, -35], [13, -35], [29, -22], [29, 2]]), .6);
    piece(g, '#F08FA8', round([[-28.5, -14], [28.5, -14], [28.5, -4], [-28.5, -4]], 2), .4);
    for (const x2 of [-42, 42]) line(g, '#CF9C35', 1.6, [[x2 - 5, 0], [x2 + 5, 0]]);
    line(g, '#CF9C35', 1.6, [[-9, -26], [9, -26]]);
  });
}
// the guitar's middle, its tilt and its size; GIT_HOLE is its sound hole on the canvas (where notes start)
const GIT = { cx: 74, dy: 10, gx: 94, gy: 188, ga: -.42, gk: 1 };
const gitOn = (x, y) => [GIT.gx + (x * Math.cos(GIT.ga) - y * Math.sin(GIT.ga)) * GIT.gk, GIT.gy + (x * Math.sin(GIT.ga) + y * Math.cos(GIT.ga)) * GIT.gk];
function drawGitarist(g, f) {
  const cx = GIT.cx, [sk, sk2] = SKIN.sun, dress = '#58B5A6', dress2 = '#449C8E', hair = '#6B4630', hair2 = '#573726', wood = '#E0A85C', wood2 = '#C4873F', wood3 = '#6E4E34';
  const up = f === 2, tip = f === 3;
  /** a bare arm with its hand, in one piece */
  const bare = (col, s, e, h, r = 9) => piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1), E(h[0], h[1], r + .5, r + .5)));
  // the far leg: a shin and a bare foot
  piece(g, sk2, U(C(cx + 42, 216, cx + 44, 262, 10, 8.5), E(cx + 53, 270, 14, 7)));
  // the far arm: to the neck of the guitar, or up to her hat
  if (tip) bare(sk2, [cx + 26, 156], [cx + 70, 118], [cx + 60, 44], 9.5);
  else bare(sk2, [cx + 26, 158], [cx + 70, 184], gitOn(96, 6));
  piece(g, dress, S([[cx - 28, 138], [cx + 28, 138], [cx + 42, 172], [cx + 44, 218], [cx + 24, 232], [cx - 32, 232], [cx - 46, 216], [cx - 42, 172]]));
  // the near leg, her lap and the hem of the dress over her knee
  piece(g, sk, U(C(cx + 50, 220, cx + 52, 264, 10.5, 9), E(cx + 62, 272, 15, 7.5)));
  piece(g, dress, C(cx - 4, 220, cx + 46, 217, 20, 18)); piece(g, dress2, C(cx + 60, 206, cx + 62, 231, 5), .5);
  // the guitar
  put(g, GIT.gx, GIT.gy, GIT.gk, GIT.ga, () => {
    piece(g, wood3, C(40, -1, 124, -1, 5.5, 5));
    piece(g, wood3, round([[121, -10], [143, -9], [143, 7], [121, 8]], 4));
    piece(g, wood, U(E(-18, 0, 37, 33), E(24, -1, 28, 26)));
    ink(g, wood2, E(18, -1, 13.5, 13.5)); ink(g, '#4B3D3D', E(18, -1, 10, 10));
    ink(g, wood3, round([[-40, -11], [-32, -11], [-32, 9], [-40, 9]], 2));
    for (const y of [-5, -1, 3]) line(g, CREAM, 1.2, [[-36, y], [138, y]]);
    ink(g, CREAM, U(E(128, -8, 2.2, 2.2), E(137, -7.5, 2.2, 2.2), E(128, 6, 2.2, 2.2), E(137, 5.5, 2.2, 2.2)));
  });
  if (!tip) piece(g, sk2, E(...gitOn(96, -1), 8.5, 8.5), .7);
  // the near arm: over the sound hole (high, low, resting), or lifted off the strings
  const H = gitOn(18, -1), n = [-Math.sin(GIT.ga), Math.cos(GIT.ga)], k = f === 0 ? -17 : f === 1 ? 17 : 4;
  bare(sk, [cx - 10, 160], up ? [cx + 40, 172] : [cx - 34, 188 + k * .35], up ? [cx + 66, 128] : [H[0] + n[0] * k, H[1] + n[1] * k]);
  piece(g, dress, E(cx - 13, 157, 14, 12.5), .6);
  head(g, cx + 6, 96, [-.05, .07, -.17, .03][f], { skin: [sk, sk2], eyes: f >= 2 ? 'glad' : 'open', mouth: up ? 'laugh' : 'smile',
    back: (_, r) => { piece(g, hair2, E(-10, -6, r + 3, r - 3)); piece(g, hair2, S([[-r + 6, -10], [-r - 9, 30], [-r - 6, 80], [-r + 12, 92], [-14, 76], [-10, 20]])); },
    top: (_, r) => { hairTop(g, hair, r); if (!tip) sunHat(g, -4, -r + 14, -.1); } });
  if (tip) sunHat(g, cx + 5, 44, -.3);
}

/* ---------- the harp player ---------- */
// a small old man hidden in the forest, a bit of a gnome: a pointed moss-green cap, a long white beard, a blue coat, sitting on a red toadstool
// (the toadstool is his: PEOPLE2.harpist.seat is its top) with a tall golden harp leaning against his shoulder.
// 0 his hands apart on the strings, 1 together, 2 a flourish: both hands thrown up, eyes shut, head back, 3 a small bow, his cap in his hand
const HARP = { cx: 110, sy: 238, px: 132 };
const MOSS = '#7C9A4E', MOSS2 = '#66823C';
/** the pointed cap, about the middle of its rim */
function gnomeCap(g) {
  piece(g, MOSS, S([[-45, 4], [-41, -20], [-23, -50], [-27, -78], [-15, -88], [3, -54], [38, -24], [45, 2], [12, -5], [-18, -1]]));
  piece(g, MOSS2, strip([[-47, 5], [-28, -3], [30, -6], [48, 0]], 5.5), .6);
}
function drawHarpist(g, f) {
  const cx = HARP.cx, SY = HARP.sy, G = SY + 84, PX = cx + HARP.px, [sk, sk2] = SKIN.rose, coat = '#7FA8D2', coat2 = '#6A90BC', tr = '#8D6A48', tr2 = '#7A5A3E', boot = '#5E4630', boot2 = '#4B3D3D', red = '#E0625C', gold = '#E6B748', gold2 = '#CF9C35';
  const fl = f === 2, bow = f === 3;
  // the toadstool
  piece(g, CREAM, round([[cx - 30, SY + 22], [cx + 16, SY + 22], [cx + 22, G], [cx - 36, G]], 9));
  const hood = S([[cx - 76, SY + 30], [cx - 70, SY + 4], [cx - 30, SY - 9], [cx + 20, SY - 9], [cx + 58, SY + 4], [cx + 64, SY + 30], [cx - 6, SY + 39]]);
  piece(g, red, hood); within(g, hood, () => ink(g, WHITE, U(E(cx - 54, SY + 13, 7.5, 6.5), E(cx - 26, SY + 26, 6.5, 5.5), E(cx + 12, SY + 27, 7, 5.5), E(cx + 44, SY + 15, 6, 5.5), E(cx - 68, SY + 30, 5, 4.5))));
  leg(g, tr2, boot2, [cx + 4, SY - 10], [cx + 38, SY - 12], [cx + 38, SY + 22], 11);
  // where his hands are: the far one behind the strings, the near one in front of them
  const H2 = fl ? [cx + 66, SY - 138] : bow ? [cx + 84, SY - 66] : f ? [cx + 90, SY - 88] : [cx + 92, SY - 112];
  const H1 = fl ? [cx - 56, SY - 112] : bow ? [cx - 50, SY - 64] : f ? [cx + 84, SY - 72] : [cx + 86, SY - 46];
  if (!fl) arm(g, coat2, sk2, [cx + 22, SY - 50], bow ? [cx + 56, SY - 44] : [cx + 54, SY - 58 - f * 6], H2, 9.5, 9);
  // the harp: the sound box leaning to his shoulder, the strings, the neck, the pillar and its foot
  const T = [cx + 36, SY - 122], B = [PX - 16, G - 20], neck = [[T[0] - 2, T[1] - 4], [cx + 58, SY - 158], [cx + 84, SY - 166], [cx + 110, SY - 190], [PX, SY - 208]];
  piece(g, gold2, C(...T, ...B, 7.5, 12));
  for (let i = 0; i < 6; i++) { const x = cx + 62 + i * 11.4; piece(g, i === 1 || i === 4 ? '#D8574F' : '#A9825A', C(x, yAt(neck, x), x, yAt([T, B], x), 1), .3); }
  piece(g, gold, strip(neck, 7));
  piece(g, gold, C(PX, SY - 206, PX, G - 12, 6.5)); piece(g, gold, E(PX + 3, SY - 212, 12.5, 12.5)); ink(g, gold2, E(PX + 4, SY - 212, 5.5, 5.5));
  piece(g, gold2, round([[PX - 36, G - 15], [PX + 12, G - 15], [PX + 15, G], [PX - 39, G]], 5));
  if (fl) arm(g, coat2, sk2, [cx + 22, SY - 50], [cx + 56, SY - 78], H2, 9.5, 9);
  // his coat, a belt, the near leg
  piece(g, coat, S([[cx - 26, SY - 66], [cx + 26, SY - 66], [cx + 38, SY - 36], [cx + 38, SY - 6], [cx + 22, SY + 6], [cx - 28, SY + 6], [cx - 40, SY - 8], [cx - 38, SY - 36]]));
  leg(g, tr, boot, [cx - 2, SY - 8], [cx + 44, SY - 8], [cx + 46, SY + 24], 11.5);
  piece(g, coat, C(cx - 6, SY - 12, cx + 24, SY - 12, 17, 15));
  if (bow) put(g, cx - 54, SY - 68, .88, -.3, () => gnomeCap(g));
  arm(g, coat, sk, [cx - 8, SY - 48], fl ? [cx - 40, SY - 62] : bow ? [cx - 38, SY - 36] : [cx + 34, SY - 30 - f * 8], H1, 9.5, 9);
  head(g, cx + (bow ? 14 : 6), SY - (bow ? 98 : 104), [-.06, .07, -.2, .4][f], { skin: [sk, sk2], r: 40, ear: true, eyes: f >= 2 ? 'shut' : 'open', mouth: 'smile',
    back: (_, r) => piece(g, SAND, bow ? E(-14, 8, r - 3, r - 9) : E(-10, -2, r + 1, r - 5)),
    top: (_, r) => {
      piece(g, WHITE, S([[-36, 0], [-41, 28], [-26, 62], [6, 82], [32, 58], [42, 18], [34, 27], [16, 33], [-4, 27], [-20, 8]]), .6);
      piece(g, WHITE, S([[-r + 12, 22], [-r - 3, 6], [-r, -16], [-24, -24], [-17, -8], [-16, 16]]), .5);
      if (!bow) put(g, 0, -17, 1, 0, () => gnomeCap(g));
    } });
}

/* ---------- the flute player ---------- */
// a shepherd boy of the flower meadow, standing: a brown felt hat with a red feather, straw hair, a short blue cloak over a cream tunic,
// a wooden flute held sideways. 0 and 1 play (the flute level, then lifted; a finger up on one hand, then on the other),
// 2 the flute lowered and a big breath: cheeks round, 3 waves, the flute in his other hand
const FLUIT = { cx: 82, dy: 6 };
function drawFluitist(g, f) {
  const cx = FLUIT.cx, [sk, sk2] = SKIN.rose, tunic = CREAM, shirt = '#D8574F', shirt2 = '#B8443E', cloak = '#6F9BCB', cloak2 = '#5880B2', tr = '#8D6A48', tr2 = '#7A5A3E', shoe = '#5E4630', shoe2 = '#4B3D3D', hair = '#E2B45A', hair2 = '#C99A42', felt = '#7A5A3E', felt2 = '#63482F', red = '#E0625C', wood = '#C79A66', wood2 = '#8D6A48';
  const play = f < 2, breath = f === 2, HC = [cx + 6, 100], hr = [.04, -.09, -.13, -.05][f];
  // the flute lies along a line from his mouth; where its ends and his two hands are
  const M = about([HC[0] + 17, HC[1] + 21], HC, hr), a = f ? -.2 : .05, at = t => [M[0] + Math.cos(a) * t, M[1] + Math.sin(a) * t];
  const F = play ? [at(-14), at(100)] : breath ? [[cx + 2, 208], [cx + 110, 184]] : [[cx - 62, 286], [cx - 30, 186]];
  const H1 = play ? at(44) : breath ? [cx + 30, 202] : [cx - 46, 236], H2 = play ? at(76) : breath ? [cx + 76, 192] : [cx + 88, 86];
  leg(g, tr2, shoe2, [cx - 14, 250], [cx - 14, 272], [cx - 14, 291], 11);
  leg(g, tr, shoe, [cx + 12, 250], [cx + 12, 272], [cx + 12, 292], 11);
  // the cloak down his back
  piece(g, cloak2, S([[cx - 28, 146], [cx - 54, 180], [cx - 66, 236], [cx - 58, 258], [cx - 30, 264], [cx - 6, 250], [cx - 8, 160]]));
  sleeve(g, shirt2, [cx + 26, 166], play ? [cx + 66, 170 - f * 8] : breath ? [cx + 56, 198] : [cx + 62, 136], H2);
  const body = S([[cx - 28, 144], [cx + 28, 144], [cx + 40, 184], [cx + 46, 246], [cx + 34, 260], [cx, 264], [cx - 34, 260], [cx - 46, 246], [cx - 40, 184]]);
  piece(g, tunic, body); within(g, body, () => { line(g, tr2, 7, [[cx - 60, 226], [cx + 60, 226]]); ink(g, '#E6B748', round([[cx + 6, 220], [cx + 18, 220], [cx + 18, 232], [cx + 6, 232]], 2)); });
  sleeve(g, shirt, [cx - 8, 168], play ? [cx + 28, 182 - f * 6] : breath ? [cx - 4, 216] : [cx - 34, 202], H1);
  // the cloak over his shoulders, with a golden clasp
  piece(g, cloak, S([[cx - 38, 142], [cx + 36, 142], [cx + 48, 166], [cx + 34, 182], [cx + 8, 171], [cx - 18, 181], [cx - 50, 176]]));
  ink(g, '#E6B748', E(cx + 9, 159, 4.5, 4.5));
  head(g, HC[0], HC[1], hr, { skin: [sk, sk2], ear: true, puff: breath, eyes: f === 3 ? 'glad' : 'open', mouth: play ? 'none' : breath ? 'oh' : 'laugh',
    back: (_, r) => piece(g, hair2, E(-10, -5, r + 3, r - 3)),
    top: (_, r) => {
      hairTop(g, hair, r);
      piece(g, red, S([[-20, -50], [-28, -78], [-44, -94], [-54, -86], [-46, -66], [-30, -46]]), .6); line(g, '#B8443E', 1.6, [[-27, -54], [-46, -86]]);
      piece(g, felt, S([[-37, -26], [-33, -56], [-10, -74], [14, -72], [33, -54], [39, -26]]));
      piece(g, felt, C(-50, -27, 58, -31, 5.5));
      piece(g, '#E6B748', P([[-34, -42], [35, -45], [36, -37], [-35, -34]]), .3);
    } });
  // the flute, and his hands on it
  piece(g, wood, C(...F[0], ...F[1], 4.6), .8);
  const along = t => [F[0][0] + (F[1][0] - F[0][0]) * t, F[0][1] + (F[1][1] - F[0][1]) * t];
  ink(g, wood2, U(...[.44, .54, .64, .78, .88].map(t => E(...along(t), 2.2, 2.2)), E(...along(.02), 4.6, 4.6), E(...along(.98), 4.6, 4.6)));
  // a finger up: on the far hand, then on the near one
  if (play) { const h = f ? H1 : H2; piece(g, f ? sk : sk2, C(h[0] + 2, h[1] - 7, h[0] + 5, h[1] - 18, 3.4), .5); }
  hand(g, sk2, H2, 9); hand(g, sk, H1, 9.5);
}

/* ---------- the trumpeter ---------- */
// the castle's herald, standing straight: a flat lilac cap with a golden feather, a tabard half rose, half lilac with a golden star,
// hose in the two colours the other way round, a long straight trumpet with a small square pennant.
// 0 blows, cheeks round, 1 the same, the trumpet higher and the pennant swung, 2 stands proud, the trumpet upright at his side, 3 a deep bow
const TROMP = { cx: 108, dy: -18, len: 156 };
const GOLD = '#E6B748', GOLD2 = '#CF9C35', ROSE = '#F4A6C4', ROSE2 = '#DE86AC', LILAC = '#BBA6EA', LILAC2 = '#9C86D2';
/** the trumpet from its mouthpiece at (mx, my), pointing along a; the pennant hangs from it by `hang` */
function trumpet(g, mx, my, a, hang) {
  const at = t => [mx + Math.cos(a) * t, my + Math.sin(a) * t], A = at(50), B = at(96), L = TROMP.len;
  const flag = P([A, B, [B[0] + hang[0], B[1] + hang[1]], [A[0] + hang[0], A[1] + hang[1]]]), mid = [(A[0] + B[0] + hang[0]) / 2, (A[1] + B[1] + hang[1]) / 2];
  piece(g, ROSE, flag, .6);
  within(g, flag, () => { ink(g, LILAC, P([[(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], B, [B[0] + hang[0], B[1] + hang[1]], [(A[0] + B[0]) / 2 + hang[0], (A[1] + B[1]) / 2 + hang[1]]])); ink(g, GOLD, star(mid[0], mid[1], 9)); });
  put(g, mx, my, 1, a, () => {
    piece(g, GOLD, C(4, 0, L - 28, 0, 3.3));
    piece(g, GOLD, S([[L - 40, -3.5], [L - 20, -6], [L - 8, -15], [L - 2, -18], [L, 0], [L - 2, 18], [L - 8, 15], [L - 20, 6], [L - 40, 3.5]]));
    piece(g, GOLD2, E(L - 1.5, 0, 4, 17.5), .5);
    piece(g, GOLD2, E(4, 0, 4.5, 6), .5);
    ink(g, GOLD2, U(E(46, 0, 3.2, 4.6), E(100, 0, 3.2, 4.6)));
  });
}
function drawTrompetter(g, f) {
  const cx = TROMP.cx, [sk, sk2] = SKIN.rose, shoe = '#7A5A3E', shoe2 = '#63482F', hair = '#8A5634', hair2 = '#7A4B2C';
  const blow = f < 2, bow = f === 3, lean = bow ? .58 : f === 2 ? -.03 : 0, O = [cx, 290], rp = (x, y) => about([x, y], O, lean);
  const hr = [-.04, -.15, -.06, .2][f], HC = [cx + 6, 106];
  // the trumpet: at his mouth, or upright in the hand at his side
  const up = bow ? -PI / 2 - .26 : -PI / 2 - .17, grip = bow ? [cx - 46, 198] : [cx - 54, 234];
  const a = blow ? (f ? -.3 : -.08) : up, M = blow ? about([HC[0] + 22, HC[1] + 20], HC, hr) : [grip[0] - Math.cos(up) * 34, grip[1] - Math.sin(up) * 34];
  const H1 = blow ? [M[0] + Math.cos(a) * 36, M[1] + Math.sin(a) * 36] : grip;
  leg(g, ROSE2, shoe2, [cx - 14, 278], [cx - 14, 302], [cx - 14, 322], 11);
  leg(g, LILAC, shoe, [cx + 12, 278], [cx + 12, 302], [cx + 12, 323], 11);
  const tab = S([[cx - 28, 150], [cx + 28, 150], [cx + 42, 190], [cx + 50, 268], [cx + 40, 288], [cx, 292], [cx - 40, 288], [cx - 50, 268], [cx - 42, 190]]);
  turn(g, O[0], O[1], lean, () => {
    // the far arm: a hand on his hip
    if (!bow) sleeve(g, SAND, [cx + 26, 174], [cx + 66, 212], [cx + 42, 242]);
    piece(g, ROSE, tab);
    within(g, tab, () => {
      ink(g, LILAC, P([[cx + 3, 100], [cx + 100, 100], [cx + 100, 330], [cx + 3, 330]]));
      line(g, GOLD, 4, [[cx - 52, 266], [cx - 43, 279], [cx - 20, 285.5], [cx + 20, 285.5], [cx + 43, 279], [cx + 52, 266]]);
      ink(g, GOLD, star(cx + 3, 228, 13));
    });
    if (!bow) hand(g, sk2, [cx + 40, 241], 9);
    if (!bow) sleeve(g, CREAM, [cx - 8, 176], blow ? [cx + 34, 186 - f * 8] : [cx - 42, 204], H1);
    piece(g, WHITE, E(cx + 5, 153, 27, 8.5), .6);
    head(g, HC[0], HC[1], hr, { skin: [sk, sk2], ear: true, puff: blow, eyes: bow ? 'shut' : 'open', mouth: blow ? 'none' : 'smile',
      back: (_, r) => piece(g, hair2, E(-12, 0, r + 2, r - 1)),
      top: (_, r) => {
        hairTop(g, hair, r);
        piece(g, GOLD, S([[-28, -r + 4], [-38, -r - 20], [-56, -r - 34], [-66, -r - 26], [-56, -r - 8], [-40, -r + 8]]), .6); line(g, GOLD2, 1.6, [[-36, -r], [-58, -r - 26]]);
        piece(g, LILAC2, E(-6, -r + 4, 47, 16.5, -.12));
        piece(g, '#8672BE', C(-36, -r + 19, 42, -r + 12, 5), .5);
      } });
  });
  trumpet(g, M[0], M[1], a, blow ? (f ? [-15, 42] : [1, 45]) : bow ? [-27, 14] : [-29, 12]);
  if (bow) sleeve(g, CREAM, rp(cx - 8, 178), [cx + 2, 212], H1);
  hand(g, sk, H1);
}

/** a golden music note: 0 one crotchet, 1 two semiquavers joined by two beams */
function drawNoot2(g, f) {
  const gold = '#E0A93B';
  if (f === 1) {
    piece(g, gold, U(E(21, 55, 10.5, 8, -.35), E(51, 49, 10.5, 8, -.35), C(29.6, 53, 29.6, 16, 2.1), C(59.6, 47, 59.6, 10, 2.1), P([[27.5, 11], [61.7, 4.5], [61.7, 13], [27.5, 19.5]]), P([[27.5, 24], [61.7, 17.5], [61.7, 26], [27.5, 32.5]])));
    return;
  }
  piece(g, gold, U(E(34, 53, 11.5, 8.6, -.35), C(43.3, 50.5, 43.3, 10, 2.3)));
}

/** a drawing moved by (dx, dy) (to make room on its card) */
const moved = (dx, dy, draw) => (g, f) => { g.save(); g.translate(dx, dy); draw(g, f); g.restore(); };
/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is.
 *  All points are canvas points. seat: where somebody sits; note: where his notes start (the guitar's sound hole, the middle of the
 *  harp's strings, the end of the flute, the bell of the raised trumpet); mouth: his mouth; feet: the x of the middle of his feet;
 *  harp: the x of the harp's pillar and the y of the ground it and the toadstool stand on */
const rnd = p => p.map(Math.round);
export const PEOPLE2 = {
  gitarist: { w: 242, h: 304, draw: moved(0, GIT.dy, drawGitarist), frames: 4, size: 1.52, does: ['strum', 'strum', 'smile', 'hat'], seat: [GIT.cx, 232 + GIT.dy], note: rnd([gitOn(18, -1)[0], gitOn(18, -1)[1] + GIT.dy]), mouth: [GIT.cx + 22, 113 + GIT.dy] },
  harpist: { w: 270, h: 340, draw: drawHarpist, frames: 4, size: 1.7, does: ['pluck', 'pluck', 'flourish', 'bow'], seat: [HARP.cx - 6, HARP.sy], note: [HARP.cx + 92, HARP.sy - 96], mouth: [HARP.cx + 22, HARP.sy - 87], harp: [HARP.cx + HARP.px, HARP.sy + 84] },
  fluitist: { w: 226, h: 328, draw: moved(0, FLUIT.dy, drawFluitist), frames: 4, size: 1.64, does: ['play', 'play', 'breath', 'wave'], note: [FLUIT.cx + 122, 127 + FLUIT.dy], mouth: [FLUIT.cx + 22, 122 + FLUIT.dy], feet: FLUIT.cx + 5 },
  trompetter: { w: 310, h: 334, draw: moved(0, TROMP.dy, drawTrompetter), frames: 4, size: 1.67, does: ['blow', 'blow', 'proud', 'bow'], note: [TROMP.cx + 184, 113 + TROMP.dy], mouth: [TROMP.cx + 29, 125 + TROMP.dy], feet: TROMP.cx + 5 },
};
export const PROPS2 = {
  noot2: { w: 78, h: 78, draw: moved(2, 5, drawNoot2), frames: 2, size: .22, does: ['crotchet', 'two semiquavers'] },
};
