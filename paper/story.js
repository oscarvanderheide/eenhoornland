// Three cards for the story of the paper world, cut by the same scissors as the people (see STYLE.md and people.js):
// a kind little forest witch, the potion she brews and a small warm star. All face right (the world flips them).
// The witch is drawn at 200 units a step, like Anna and the grown-ups; the two small things about 280 to 330 a step, like the small things in people.js.
// The sheet is story.html.
import { E, S, C, U, P, piece, ink, line } from './cut.js';

const DARK = '#33262E', PI = Math.PI, TAU = PI * 2, CREAM = '#F4ECDC', MOUTH = '#8A3D4C';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shape with straight sides and corners rounded by r (a patch, a label, a cork) */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** stripes printed on one piece: bands `w` wide every `step`, across (or down when `down`) */
function stripes(g, shape, col, step, w, down, off = 0) {
  if (!g.colour) return;
  g.save(); g.beginPath(); shape(g); g.clip(); g.fillStyle = col;
  for (let v = -100 + off; v < 600; v += step) down ? g.fillRect(v, -100, w, 800) : g.fillRect(-100, v, 800, w);
  g.restore();
}
/** printed pictures that stay inside one shape (the potion in its bottle) */
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
/** turn what `fn` draws by `rot` about (x, y) */
const turn = (g, x, y, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.translate(-x, -y); fn(); g.restore(); };
/** something drawn about (0, 0), put at (x, y), k times as big, turned by rot */
const put = (g, x, y, k, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); fn(); g.restore(); };
/** where the point p is after a turn by `a` about o (for what is drawn outside the turn but hangs on something inside it: a shoulder) */
const about = (p, o, a) => [o[0] + (p[0] - o[0]) * Math.cos(a) - (p[1] - o[1]) * Math.sin(a), o[1] + (p[0] - o[0]) * Math.sin(a) + (p[1] - o[1]) * Math.cos(a)];
/** the corners of a star with n points, the first one straight up (turned by rot): tips at R, notches at r, going round clockwise */
const starPts = (x, y, R, r, rot = 0, n = 5) => Array.from({ length: n * 2 }, (_, i) => { const a = rot - PI / 2 + i * PI / n, q = i % 2 ? r : R; return [x + Math.cos(a) * q, y + Math.sin(a) * q]; });

/* ---------- the doll (as in people.js): a head with a face, arms that bend ---------- */
const SKIN = { rose: ['#F4CDB0', '#E2B293'] };
/** an eye: 'open' a dot with a glint, 'wide' a bigger dot, 'shut' a little arc hanging down (asleep), 'glad' an arc standing up (laughing).
 *  lw is the width of the arcs, side -1 puts the glint on the left (looking away) */
function eyeAt(g, x, y, r, how, lw = 2.4, side = 1) {
  if (how === 'shut') return line(g, DARK, lw, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, lw, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  const k = how === 'wide' ? 1.3 : 1;
  ink(g, DARK, E(x, y, r * .86 * k, r * 1.08 * k)); ink(g, '#fff', E(x + side * r * .3 * k, y - r * .4 * k, r * .32 * k, r * .32 * k));
}
/** the head, turned by `rot` about its middle (x, y). o: skin [main, shade], r, eyes, mouth, brows (raised eyebrows, for asking),
 *  back(g, r) drawn behind the face (hair), top(g, r) on the face under the eyes (curls, hat) */
function head(g, x, y, rot, o) {
  const r = o.r || 44, [sk, sk2] = o.skin, eyes = o.eyes || 'open', m = o.mouth || 'smile';
  g.save(); g.translate(x, y); g.rotate(rot);
  if (o.back) o.back(g, r);
  piece(g, sk, E(0, 0, r, r - 1));
  if (o.top) o.top(g, r);
  eyeAt(g, 25, 3, 5.2, eyes); eyeAt(g, 4, 3, 4.5, eyes);
  // (the brows are little arches, each a touch higher at the nose side: asking, never cross; they are turned back against the tilt of the head)
  if (o.brows) { turn(g, 25.5, -10.5, .23 - rot, () => line(g, '#8D7F8C', 2.4, arc(25.5, -4, 7, 1.2 * PI, 1.8 * PI))); turn(g, 3.5, -10, -.2 - rot, () => line(g, '#8D7F8C', 2.2, arc(3.5, -4, 6, 1.2 * PI, 1.8 * PI))); }
  ink(g, 'rgba(240,110,135,.6)', E(34, 18, 8.5, 6)); ink(g, 'rgba(240,110,135,.48)', E(-5, 18, 6.5, 5));
  ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'big') line(g, MOUTH, 2.8, arc(16, 12.5, 11.5, .16 * PI, .84 * PI, 8));
  if (m === 'laugh') { ink(g, MOUTH, gg => { gg.moveTo(27, 18); gg.arc(16, 18, 11, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(16, 25, 5.5, 2.8)); }
  g.restore();
}
/** an arm in one piece of sleeve, bent at the elbow, with a round hand */
function arm(g, col, skin, s, e, h, r = 10, hr = 9.5) {
  piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5)));
  piece(g, skin, E(h[0], h[1], hr, hr), .7);
}

/* ---------- the witch ---------- */
// a kind little forest witch, a jolly grandmother who likes cooking: silver curls, rosy cheeks and a big smile, a soft floppy plum hat with a star,
// a moss-green dress with two patches, red striped stockings, a long wooden spoon. Her cauldron is not on the card: it stands in the world at her right,
// under the bowl of her spoon (STORY.heks.spoon gives the middle of the bowl in frames 0 and 1).
// 0 stirs: both hands on the spoon, its bowl down at her right, 1 stirs: the spoon has gone round to the far side of the pot and she leans after it,
// 2 asks: one hand held out open, palm up (STORY.heks.hand is the middle of the palm), head tilted, eyebrows raised, the spoon at rest by her side,
// 3 delighted: both arms up, the spoon in the air, eyes shut in a laugh
const HX = 106;
/** the spoon in each frame, from the top of its handle to the middle of its bowl */
const SPOON = [[[HX + 62, 190], [HX + 102, 272]], [[HX + 104, 190], [HX + 124, 272]], [[HX - 49, 240], [HX - 70, 296]], [[HX - 67, 166], [HX - 80, 96]]];
const PALM = [HX + 100, 212];
function drawHeks(g, f) {
  const cx = HX, [sk, sk2] = SKIN.rose, moss = '#8BA862', moss2 = '#74914F', plum = '#96599F', plum2 = '#7F4789', sock = '#F4ECDC', sock2 = '#E2D6C1', red = '#E0625C', red2 = '#C4524D', shoe = '#7A5A3E', shoe2 = '#63482F', hair = '#DAD6DE', hair2 = '#BDB7C6', wood = '#C79A66', wood2 = '#A9825A', gold = '#F2C83F';
  const ask = f === 2, glad = f === 3, lean = f === 1 ? .07 : glad ? -.04 : 0, O = [cx, 296], at = p => about(p, O, lean);
  const [T, B] = SPOON[f], on = t => [T[0] + (B[0] - T[0]) * t, T[1] + (B[1] - T[1]) * t];
  const spoon = () => { const a = Math.atan2(B[1] - T[1], B[0] - T[0]); piece(g, wood, U(C(...T, ...B, 3.4), E(...B, 12.5, 9.5, a))); ink(g, wood2, E(...B, 8.5, 5.8, a)); };
  // the stockings and the shoes
  const stocking = (col, band, x, y) => { const sh = C(x, 268, x, y, 10, 9.5); piece(g, col, sh); stripes(g, sh, band, 10, 5, false, 8); };
  stocking(sock2, red2, cx - 14, 309); piece(g, shoe2, E(cx - 8, 318, 17, 8.5));
  stocking(sock, red, cx + 12, 310); piece(g, shoe, E(cx + 18, 319, 17, 8.5));
  // stirring, the spoon is out at her right and her far hand holds the top of it
  if (f < 2) spoon();
  const S2 = at([cx + 24, 198]);
  if (f < 2) arm(g, moss2, sk2, S2, f ? [cx + 74, 224] : [cx + 52, 236], on(.14));
  else if (glad) arm(g, moss2, sk2, S2, [cx + 62, 184], [cx + 78, 144]);
  else {
    // the open hand: a flat palm with the thumb standing up
    piece(g, moss2, U(C(...S2, cx + 60, 224, 10), C(cx + 60, 224, PALM[0] - 12, PALM[1] + 3, 10, 8.5)));
    piece(g, sk2, U(E(...PALM, 13, 7.5, -.1), C(PALM[0] - 7, PALM[1] - 3, PALM[0] - 12, PALM[1] - 13, 4.4)), .7);
  }
  turn(g, ...O, lean, () => {
    const body = S([[cx - 28, 180], [cx + 28, 180], [cx + 44, 214], [cx + 62, 264], [cx + 46, 280], [cx, 284], [cx - 46, 280], [cx - 62, 264], [cx - 44, 214]]);
    piece(g, moss, body);
    within(g, body, () => ink(g, moss2, P([[cx - 80, 268], [cx + 80, 268], [cx + 80, 300], [cx - 80, 300]])));
    // two patches, sewn on with big stitches
    put(g, cx - 27, 248, 1, .16, () => {
      piece(g, gold, round([[-11, -11], [11, -11], [11, 11], [-11, 11]], 3), .3);
      for (const v of [-5, 5]) { line(g, shoe, 1.7, [[v, -13.5], [v, -8]]); line(g, shoe, 1.7, [[v, 8], [v, 13.5]]); line(g, shoe, 1.7, [[-13.5, v], [-8, v]]); line(g, shoe, 1.7, [[8, v], [13.5, v]]); }
    });
    put(g, cx + 30, 257, 1, -.2, () => {
      piece(g, '#F4A6C4', round([[-10, -8], [10, -8], [10, 8], [-10, 8]], 4), .3);
      for (const [x, y, dx, dy] of [[-5, -8, 0, 1], [5, -8, 0, 1], [-5, 8, 0, 1], [5, 8, 0, 1], [-10, 0, 1, 0], [10, 0, 1, 0]]) line(g, plum2, 1.7, [[x - dx * 3, y - dy * 3], [x + dx * 3, y + dy * 3]]);
    });
  });
  // the near arm: on the spoon (stirring, at rest by her side, or up in the air)
  if (f >= 2) spoon();
  const S1 = at([cx - 8, 200]);
  arm(g, moss, sk, S1, glad ? [cx - 48, 190] : ask ? [cx - 40, 228] : f ? [cx + 54, 230] : [cx + 30, 236], glad ? [cx - 71, 148] : ask ? [cx - 53, 254] : on(.44), 10.5, 10);
  // a cream collar with a gold button, over her shoulders
  turn(g, ...O, lean, () => { piece(g, CREAM, U(E(cx - 7, 187, 14, 7.5, .4), E(cx + 21, 187, 14, 7.5, -.4)), .6); ink(g, gold, E(cx + 7, 190, 3.4, 3.4)); });
  const hat = () => {
    const cone = S([[-43, -22], [-30, -70], [-10, -104], [8, -100], [24, -66], [43, -22], [0, -14]]);
    piece(g, plum, U(cone, C(-2, -95, -30, -108, 12, 7), C(-30, -108, -45, -97, 7, 5.5)));
    within(g, cone, () => ink(g, '#C7B4EE', P([[-60, -51], [60, -51], [60, -37], [-60, -37]])));
    piece(g, gold, P(starPts(3, -72, 13, 5.6)), .4);
    piece(g, plum2, E(0, -27, 61, 10.5, -.04), .8);
  };
  head(g, ...at([cx + 6, 136]), ask ? -.13 : glad ? -.2 : f ? .1 : 0, { skin: [sk, sk2], eyes: glad ? 'glad' : 'open', mouth: glad ? 'laugh' : 'big', brows: ask,
    back: () => piece(g, hair2, U(E(-30, 6, 27, 27), E(-36, 30, 17, 15))),
    top: () => { piece(g, hair, U(E(-36, -3, 12, 13), E(-39, 17, 11, 12), E(-33, 33, 9, 9)), .6); hat(); } });
}

/* ---------- the potion ---------- */
// a small round glass bottle with a cork, full of bright rose-pink potion with little stars and bubbles in it, a paper label with a flower.
// 0 as it stands, 1 it twinkles: the sparkles are somewhere else, the glass has gone pink and a glow of lighter pink lies round the belly of the bottle
// (the glow is a piece of its own behind the bottle, so the card is a little wider in frame 1)
function drawDrankje(g, f) {
  const cx = 52, cork = '#C79A66', cork2 = '#A9825A', pink = f ? '#F2709F' : '#EE5F97', pink2 = f ? '#FBC3D6' : '#F8A9C6', glass = f ? '#F7DDE6' : '#DDEEF0', glass2 = f ? '#EFC6D5' : '#C3DEE4', spark = '#FFF6C9';
  const inner = E(cx, 76, 27.5, 25.5);
  if (f) piece(g, '#FAC3D7', E(cx, 75, 38, 36), .4);
  piece(g, cork, round([[cx - 8, 13], [cx + 8, 13], [cx + 7, 30], [cx - 7, 30]], 3));
  ink(g, cork2, U(E(cx - 3, 18, 1.5, 1.5), E(cx + 3, 21, 1.5, 1.5)));
  piece(g, glass, U(round([[cx - 9, 27], [cx + 9, 27], [cx + 9, 52], [cx - 9, 52]], 3), E(cx, 75, 33, 31)));
  piece(g, glass2, C(cx - 10, 29, cx + 10, 29, 4.6), .5);
  within(g, inner, () => { ink(g, pink, P([[0, 56], [110, 56], [110, 110], [0, 110]])); ink(g, pink2, E(cx, 56.5, 27, 3.6)); });
  // the sparkles: two stars and a bubble
  const star = (x, y, r, rot) => ink(g, spark, P(starPts(x, y, r, r * .44, rot))), bub = (x, y, r) => ink(g, 'rgba(252,248,241,.9)', E(x, y, r, r));
  if (f) { star(cx - 2, 67, 7.5, -.2); star(cx + 21, 80, 6, .3); bub(cx - 17, 69, 3.4); }
  else { star(cx - 13, 68, 7.5, .2); star(cx + 13, 67, 6, -.3); bub(cx - 21, 85, 3.4); }
  // the label: a lilac flower with a yellow heart
  piece(g, CREAM, round([[cx - 16, 77], [cx + 16, 77], [cx + 16, 98], [cx - 16, 98]], 3.5), .4);
  ink(g, '#A98FE0', U(...[0, 1, 2, 3, 4].map(i => E(cx + Math.cos(-PI / 2 + i * TAU / 5) * 5, 87.5 + Math.sin(-PI / 2 + i * TAU / 5) * 5, 3.7, 3.7))));
  ink(g, '#F2C83F', E(cx, 87.5, 3, 3));
  // a shine on the glass
  ink(g, 'rgba(252,248,241,.8)', C(cx - 23, 62, cx - 26, 72, 2.6));
}

/* ---------- the star ---------- */
// a small warm star with a face: plump, warm yellow with a paler middle, dot eyes and rosy cheeks.
// 0 shy: its points drawn in, turned a little away and looking sideways, a small closed smile, 1 hopping: squashed wider, eyes wide, mouth a small "o",
// 2 beaming: a big open smile, eyes shut in arcs, paler rays between its points, 3 asleep: eyes shut, hanging to one side
function drawSter(g, f) {
  const cx = 71, cy = 66, gold = '#F7CB45', pale = '#FCE493', shy = f === 0, hop = f === 1, beam = f === 2, sleep = f === 3;
  // the rays stand between the points, close enough to share the star's card
  if (beam) for (let i = 0; i < 5; i++) { const a = -PI / 2 + PI / 5 + i * TAU / 5, c = Math.cos(a), s = Math.sin(a); piece(g, pale, C(cx + c * 45, cy + s * 45, cx + c * 56.5, cy + s * 56.5, 5, 3.6), .5); }
  g.save(); g.translate(cx, cy + (sleep ? 5 : 0)); g.rotate(shy ? -.14 : sleep ? .32 : 0);
  // (a smooth shape cuts its corners: these tips come out at 54 and the notches at 33; shy, at 47 and 34)
  g.save(); if (hop) { g.translate(0, 48); g.scale(1.12, .86); g.translate(0, -48); }
  piece(g, gold, S(starPts(0, 0, shy ? 54.5 : 65, shy ? 31 : 27)));
  ink(g, pale, E(0, 3, 27, 25));
  g.restore();
  // the face (it sits a little lower in the squashed star)
  const y = hop ? 8 : 2, x = shy ? -8 : 3, how = hop ? 'wide' : beam ? 'glad' : sleep ? 'shut' : 'open';
  eyeAt(g, x - 11, y - 3, 5.6, how, 3.2, shy ? -1 : 1); eyeAt(g, x + 11, y - 3, 5.6, how, 3.2, shy ? -1 : 1);
  const blush = shy ? 'rgba(240,105,130,.7)' : 'rgba(240,110,135,.55)', br = shy ? 8 : 7;
  ink(g, blush, U(E(x - 19, y + 7, br, br * .68), E(x + 19, y + 7, br, br * .68)));
  if (shy) line(g, MOUTH, 3, arc(x, y + 5, 5, .2 * PI, .8 * PI));
  if (hop) ink(g, MOUTH, E(x, y + 11, 4.4, 5.2));
  if (beam) { ink(g, MOUTH, gg => { gg.moveTo(x + 10.5, y + 6); gg.arc(x, y + 6, 10.5, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(x, y + 12.5, 5.2, 2.8)); }
  if (sleep) line(g, MOUTH, 3, arc(x, y + 7, 3.6, .15 * PI, .85 * PI));
  g.restore();
}

/** canvas sizes (drawing units), how tall each card stands in the world (Anna is 1.2) and what each frame is.
 *  heks: `feet` is where she stands (the middle between her shoes, on the ground), `spoon` the middle of the spoon's bowl in frames 0 and 1
 *  (the cauldron goes under it), `hand` the middle of her open palm in frame 2 (what she is given lies about 7 above it). All in canvas units. */
export const STORY = {
  heks: { w: 260, h: 340, draw: drawHeks, frames: 4, size: 1.7, does: ['stir', 'stir', 'ask', 'glad'], feet: [HX + 5, 327], spoon: [SPOON[0][1], SPOON[1][1]], hand: PALM },
  drankje: { w: 104, h: 122, draw: drawDrankje, frames: 2, size: .36, does: ['potion', 'twinkle'] },
  ster: { w: 142, h: 140, draw: drawSter, frames: 4, size: .5, does: ['shy', 'hop', 'beam', 'asleep'] },
};
