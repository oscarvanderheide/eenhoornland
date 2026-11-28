// A fifth batch of paper cards (see STYLE.md): the snow island far in the north (set-sneeuw.js, snow.js). Santa and his
// sleigh, his reindeer, a waddle of penguins and a chick, a wrapped present and what is in it, a snowball. Cut by the same
// scissors as cards3.js (its helpers are copied here: that file is not this one's to change). All face right (the world
// flips them). The sheet is cards5.html.
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
const cheek = (g, x, y, rx = 7, ry = 5, a = .4) => ink(g, `rgba(240,120,150,${a})`, E(x, y, rx, ry));
/** a little star of paper (a sparkle) */
const star = (x, y, r, n = 5, k = .45) => P(Array.from({ length: n * 2 }, (_, i) => { const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * k : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }));

/* ---------- people: a head with a face, arms and legs (as in cards3.js) ---------- */
const ROSE = ['#F4CDB0', '#E2B293'];
function eyeAt(g, x, y, r, how) {
  if (how === 'shut') return line(g, DARK, 2.4, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, 2.4, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  ink(g, DARK, E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32));
}
/** the head about its middle (x, y), turned by rot. o: skin, r, eyes, mouth ('smile' 'laugh' 'none'), ear, back(), top(), front() */
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
  if (o.front) o.front(g, r);
  g.restore();
}
function arm(g, col, hand, s, e, h, r = 10, hr = 9.5) { piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5))); piece(g, hand, E(h[0], h[1], hr, hr), .7); }
function leg(g, col, shoeCol, hip, knee, foot, r = 12) { piece(g, col, U(C(...hip, ...knee, r), C(...knee, ...foot, r, r - 1))); piece(g, shoeCol, E(foot[0] + 6, foot[1] + 9, 16, 8)); }

/* ---------------- Santa ---------------- */
// a round, jolly man in a red coat with white fur, a black belt with a gold buckle, a white beard, a floppy red hat.
// 0 stands, hands on his belly; 1 laughs (ho ho ho: eyes shut happily, mouth open, his belly up a little); 2 holds out his
// hand (a present is given: the present is its own card); 3 waves
const SANTA = { coat: '#DD6A5E', coat2: '#C2524A', fur: WHITE, fur2: '#E9E2D6', belt: '#4B3D3D', gold: '#E6B748', glove: '#F4ECDC', boot: '#4B3D3D' };
/** his head, beard and hat (used by the standing Santa and by the one in the sleigh) */
function santaHead(g, x, y, rot, laugh, r = 40) {
  const k = SANTA;
  head(g, x, y, rot, { skin: ROSE, r, ear: true, eyes: laugh ? 'glad' : 'open', mouth: 'none',
    back: () => { piece(g, k.fur2, U(E(-30, 12, 15, 20), E(-22, 30, 14, 14))); piece(g, k.coat2, strip([[-6, -44], [-34, -46], [-56, -30], [-62, -10]], 10)); piece(g, k.fur, E(-62, -6, 12, 12), .6); },
    top: () => { piece(g, k.coat, S([[-40, -16], [-30, -44], [0, -58], [30, -48], [42, -20]])); piece(g, k.fur, C(-38, -22, 40, -24, 10), .7); },
    front: () => {
      piece(g, k.fur, U(E(16, 32, 30, 20), E(-10, 26, 16, 15), E(38, 26, 12, 13), E(14, 50, 19, 15), E(-2, 42, 15, 13), E(30, 44, 14, 12)), .8);
      for (const [a, b] of [[4, 36], [24, 38], [14, 50]]) line(g, k.fur2, 1.6, arc(a, b, 6, .2 * PI, .8 * PI, 4));
      if (laugh) { ink(g, MOUTH, gg => { gg.moveTo(27, 27); gg.arc(17, 27, 10, 0, PI); gg.closePath(); }); ink(g, '#EE8FA6', E(17, 33, 5, 2.4)); }
      piece(g, k.fur, U(E(8, 20, 11, 6, -.3), E(26, 20, 11, 6, .3)), .6);   // the moustache
      piece(g, '#EBA58F', E(17, 12, 6.5, 5.5), .4);   // a round red nose
    } });
}
function drawKerstman(g, f) {
  const k = SANTA, up = f === 1 ? -5 : 0, cx = 106;
  g.save(); g.translate(0, up);
  leg(g, k.coat2, k.boot, [cx - 18, 214], [cx - 20, 244], [cx - 22, 262 - up], 14);
  leg(g, k.coat, k.boot, [cx + 10, 214], [cx + 14, 244], [cx + 16, 262 - up], 14);
  // the far arm, behind him
  if (f === 3) arm(g, k.coat2, k.glove, [cx - 30, 140], [cx - 48, 172], [cx - 44, 196], 12, 10);
  else arm(g, k.coat2, k.glove, [cx - 30, 140], [cx - 44, 172], [cx - 30, 192], 12, 10);
  const coat = S([[cx - 36, 118], [cx + 30, 116], [cx + 56, 158], [cx + 60, 204], [cx + 38, 226], [cx - 44, 226], [cx - 62, 202], [cx - 58, 152]]);
  piece(g, k.coat, coat);
  within(g, coat, () => { g.fillStyle = k.fur; g.fillRect(0, 208, 300, 40); g.fillRect(cx + 14, 100, 14, 120); g.fillStyle = k.belt; g.fillRect(0, 170, 300, 14); });
  piece(g, k.gold, round([[cx + 10, 166], [cx + 32, 166], [cx + 32, 188], [cx + 10, 188]], 4), .5); ink(g, k.belt, round([[cx + 16, 172], [cx + 26, 172], [cx + 26, 182], [cx + 16, 182]], 2));
  for (const y of [132, 152, 198]) ink(g, '#D8CFC0', E(cx + 21, y, 3, 3));
  piece(g, k.fur, C(cx - 40, 122, cx + 34, 120, 9), .6);   // the fur collar
  // the near arm: on his belly, held out, or waving
  if (f === 2) arm(g, k.coat, k.glove, [cx + 6, 138], [cx + 40, 156], [cx + 74, 150], 12, 10);
  else if (f === 3) arm(g, k.coat, k.glove, [cx + 6, 136], [cx + 42, 118], [cx + 72, 84], 12, 10);
  else arm(g, k.coat, k.glove, [cx - 4, 138], [cx + 20, 172], [cx + 40, 166], 12, 10);
  const cuff = f === 2 ? [cx + 62, 152] : f === 3 ? [cx + 64, 96] : [cx + 30, 170];
  piece(g, k.fur, E(cuff[0], cuff[1], 9, 9), .5);
  santaHead(g, cx + 6, 84, f === 1 ? -.12 : f === 3 ? .05 : 0, f === 1 || f === 3);
  g.restore();
}

/* ---------------- the sleigh ---------------- */
// a red sleigh with gold scrolls, its runners curling up at the front. 0 stands with presents peeking out; 1 Santa sits in
// front with the reins; 2 Santa in it waves (they have landed)
function drawSlee(g, f) {
  const red = '#D9534F', red2 = '#B9443F', gold = '#E6B748', gold2 = '#CF9C35';
  // the runners and the struts
  for (const x of [96, 196, 296]) piece(g, gold2, C(x, 150, x - 6, 182, 6));
  piece(g, gold, strip([[24, 184], [120, 186], [300, 186], [352, 182], [378, 164], [384, 140], [370, 124], [352, 130], [354, 146]], 6));
  // presents in the back (frame 0), or Santa in front (frames 1, 2)
  if (f === 0) {
    for (const [x, y, w, h, c, rb] of [[64, 60, 44, 46, '#9ED9CF', '#F4A6C4'], [110, 52, 50, 54, '#F2C65C', '#E98F8F'], [158, 70, 40, 36, '#BBA6EA', '#F2C65C']]) {
      const b = round([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 4); piece(g, c, b, .7); within(g, b, () => { g.fillStyle = rb; g.fillRect(x + w / 2 - 5, 0, 10, 300); });
      piece(g, rb, U(E(x + w / 2 - 9, y - 6, 9, 6, -.5), E(x + w / 2 + 9, y - 6, 9, 6, .5)), .5);
    }
  } else {
    const k = SANTA;
    piece(g, k.coat, S([[226, 110], [232, 72], [262, 60], [300, 66], [318, 92], [316, 120]]));
    within(g, S([[226, 110], [232, 72], [262, 60], [300, 66], [318, 92], [316, 120]]), () => { g.fillStyle = k.fur; g.fillRect(290, 50, 12, 80); });
    if (f === 2) { arm(g, k.coat, k.glove, [292, 76], [316, 56], [326, 26], 11, 9); piece(g, k.fur, E(324, 38, 8, 8), .5); }
    else { arm(g, k.coat, k.glove, [290, 80], [318, 92], [348, 84], 11, 9); piece(g, k.fur, E(338, 88, 8, 8), .5); }
    santaHead(g, 278, 40, f === 2 ? -.08 : .04, f === 2, 32);
  }
  // the body: a high back at the left, a low middle, the front rising like a swan's neck and curling over
  const body = S([[34, 158], [26, 96], [30, 48], [56, 34], [82, 52], [92, 100], [230, 108], [290, 104], [326, 82], [342, 52], [366, 40], [384, 58], [372, 88], [348, 128], [320, 160]]);
  piece(g, red, body);
  within(g, body, () => { g.fillStyle = red2; g.fillRect(0, 146, 400, 30); });
  // gold scrolls and a band along the rim
  line(g, gold, 5, [[94, 106], [228, 112], [292, 108], [328, 86]]);
  for (const [x, y, r] of [[60, 70, 14], [200, 132, 12], [130, 132, 12], [356, 62, 11]]) { line(g, gold, 3.4, arc(x, y, r, .1 * PI, 1.7 * PI, 10)); line(g, gold, 3.4, arc(x + r * .35, y + r * .2, r * .45, 1.7 * PI, 2.9 * PI, 6)); }
  ink(g, gold, star(166, 130, 7));
}

/* ---------------- the reindeer ---------------- */
// warm brown, a cream belly and a white tail, branched antlers, a red collar with a gold bell.
// 0 stands; 1 and 2 walk; 3 hops for joy (front legs tucked, head up, eyes shut); 4 flies (legs stretched out front and back)
const DEER = { c: '#B08560', c2: '#94704F', bel: '#EEDFC6', ant: '#E6D2A8', ant2: '#CDB689', hoof: '#5E4A42', nose: '#5E4A42' };
function drawRendier(g, f) {
  const k = DEER, sw = f === 1 ? 1 : f === 2 ? -1 : 0, hop = f === 3, fly = f === 4;
  g.save();
  if (hop) { g.translate(70, 214); g.rotate(-.22); g.translate(-70, -214); }
  if (fly) { g.translate(112, 150); g.rotate(-.1); g.translate(-112, -150); }
  const leg = (x, s, col, front) => {
    let ex = x + s * 9, ey = 214;
    if (hop && front) { ex = x + 18; ey = 186; } if (fly) { ex = front ? x + 34 : x - 34; ey = 196; }
    const kx = (x + ex) / 2 + (fly ? (front ? -8 : 8) : 0), ky = (160 + ey) / 2 + (hop && front ? -6 : 0);
    piece(g, col, U(C(x, 156, kx, ky, 8.5, 7), C(kx, ky, ex, ey, 7, 6))); piece(g, k.hoof, E(ex + 1, ey + 3, 7, 4.5), .3);
  };
  for (const [x, s, fr] of [[78, sw, false], [140, -sw, true]]) leg(x, s, k.c2, fr);
  piece(g, WHITE, U(E(46, 124, 11, 9, -.5), E(40, 118, 7, 7)), .6);   // the white tail, up
  const body = U(E(108, 144, 56, 30), E(76, 140, 26, 25), E(140, 136, 28, 26));
  piece(g, k.c, body);
  ink(g, k.bel, E(108, 162, 40, 10));
  for (const [x, s, fr] of [[92, -sw, false], [152, sw, true]]) leg(x, s, k.c, fr);
  // the neck, the collar and its bell, the head
  g.save(); if (hop) { g.translate(160, 130); g.rotate(-.12); g.translate(-160, -130); }
  piece(g, k.c, C(150, 134, 178, 98, 20, 16));
  // the far antler, then the near one: branched strips
  const ant = (base, d, col) => { piece(g, col, strip([[base[0], base[1]], [base[0] + d * 2, base[1] - 22], [base[0] + d * 10, base[1] - 42], [base[0] + d * 22, base[1] - 56]], 4.5), .5);
    piece(g, col, strip([[base[0] + d * 1, base[1] - 16], [base[0] + d * 16, base[1] - 26]], 3.6), .5); piece(g, col, strip([[base[0] + d * 6, base[1] - 34], [base[0] - d * 6, base[1] - 46]], 3.4), .5); };
  ant([192, 70], 1, k.ant2);
  piece(g, k.c2, E(166, 80, 15, 6.5, -.45));   // the ear
  ink(g, '#D9A68A', E(166, 80, 9, 3, -.45));
  piece(g, k.c, U(E(186, 90, 23, 21), E(206, 102, 16, 13, .3)));
  ink(g, k.bel, E(208, 106, 10, 7, .3));
  piece(g, k.nose, E(220, 100, 6.5, 5.5), .4);
  ant([178, 72], -1, k.ant);
  if (hop || fly) line(g, DARK, 2.4, arc(192, 88, 5, 1.2 * PI, 1.8 * PI)); else eye(g, 192, 86, 5.2);
  cheek(g, 196, 100, 6, 4);
  line(g, MOUTH, 2, arc(210, 108, 5, .25 * PI, .8 * PI));
  piece(g, '#D9534F', strip([[154, 120], [166, 128], [180, 126]], 4.5), .5);   // the collar
  piece(g, '#E6B748', E(166, 136, 6, 6), .5); ink(g, '#B8923E', E(166, 139, 2, 1.6));
  g.restore();
  g.restore();
}

/* ---------------- penguins ---------------- */
// a penguin: slate blue with a cream front and face, an orange beak and feet. The chick: grey and fluffy, a dark cap.
// 0 stands; 1 and 2 waddle (leaning to one side, then the other); 3 flaps (flippers up, beak open); 4 slides on its belly;
// 5 ducks (head in, eyes shut)
const PENG = { c: '#45506B', c2: '#37405A', bel: WHITE, face: WHITE, beak: '#E89A4E', feet: '#E2803E' };
const CHICK = { c: '#B7BBC6', c2: '#9EA3B0', bel: '#E6E3DE', face: WHITE, beak: '#4B3D3D', feet: '#7A6F74', cap: '#45506B', fluff: true };
const drawPenguin = k => (g, f) => {
  const cx = 95;
  if (f === 4) {   // on its belly: lying along the ground, head up and forward, flippers back, feet trailing
    piece(g, k.feet, U(E(34, 148, 10, 5, -.2), E(40, 154, 10, 5, .1)), .4);
    piece(g, k.c2, S([[78, 128], [44, 118], [28, 122], [52, 134]]), .6);
    const body = U(E(96, 136, 56, 22), E(146, 122, 22, 20));
    piece(g, k.c, body);
    within(g, body, () => { g.fillStyle = k.bel; g.beginPath(); g.ellipse(100, 154, 52, 12, 0, 0, PI * 2); g.fill(); });
    if (k.cap) piece(g, k.cap, E(146, 112, 18, 10), .4);
    piece(g, k.face, E(154, 122, 12, 11), .4);
    piece(g, k.beak, P([[164, 120], [182, 126], [164, 131]]), .4);
    eye(g, 156, 118, 4); cheek(g, 158, 128, 4, 3);
    piece(g, k.c2, S([[112, 132], [84, 128], [66, 132], [92, 140]]), .6);
    return;
  }
  const lean = f === 1 ? -.12 : f === 2 ? .12 : 0, duck = f === 5, flap = f === 3;
  g.save(); g.translate(cx, 158); g.rotate(lean); g.translate(-cx, -158);
  // the feet (the one it leans away from lifted a little)
  piece(g, k.feet, E(cx - 8, 154 - (f === 2 ? 4 : 0), 12, 5.5), .4); piece(g, k.feet, E(cx + 12, 155 - (f === 1 ? 4 : 0), 12, 5.5), .4);
  const by = duck ? 122 : 104, bh = duck ? 34 : 50, hy = duck ? 92 : 58;
  // the far flipper, up when it flaps
  if (flap) piece(g, k.c2, S([[cx + 14, by - 18], [cx + 40, by - 40], [cx + 52, by - 52], [cx + 44, by - 30], [cx + 22, by - 6]]), .6);
  const body = U(E(cx, by, 38, bh), E(cx + 4, hy, 28, 26));
  piece(g, k.c, body);
  if (k.fluff) for (const [x, y] of [[cx - 36, by - 10], [cx - 30, by + 18], [cx - 20, hy - 22], [cx + 4, hy - 26], [cx + 24, hy - 16]]) piece(g, k.c, E(x, y, 9, 8), 0);
  within(g, body, () => { g.fillStyle = k.bel; g.beginPath(); g.ellipse(cx + 12, by + 8, 24, bh - 8, 0, 0, PI * 2); g.fill(); });
  if (k.cap) piece(g, k.cap, U(E(cx + 2, hy - 12, 24, 14), E(cx - 14, hy - 4, 10, 10)), .4);
  piece(g, k.face, E(cx + 14, hy + 2, 15, 14), .4);
  if (duck) { line(g, DARK, 2.4, arc(cx + 18, hy - 2, 4, .2 * PI, .8 * PI)); }
  else if (flap) line(g, DARK, 2.4, arc(cx + 18, hy + 3, 4.5, 1.2 * PI, 1.8 * PI));
  else eye(g, cx + 18, hy, 4.4);
  cheek(g, cx + 22, hy + 10, 5, 3.4);
  if (flap) { piece(g, k.beak, P([[cx + 28, hy - 2], [cx + 48, hy - 8], [cx + 30, hy + 4]]), .4); piece(g, k.beak, P([[cx + 28, hy + 6], [cx + 44, hy + 12], [cx + 28, hy + 10]]), .4); }
  else piece(g, k.beak, P([[cx + 27, hy + 1], [cx + 46, hy + 6], [cx + 27, hy + 10]]), .4);
  // the near flipper: down at its side, up when it flaps, over its head when it ducks
  if (flap) piece(g, k.c2, S([[cx - 22, by - 14], [cx - 46, by - 40], [cx - 58, by - 52], [cx - 48, by - 28], [cx - 26, by + 2]]), .6);
  else if (duck) piece(g, k.c2, S([[cx - 26, by - 8], [cx - 10, hy - 24], [cx + 14, hy - 30], [cx - 2, hy - 18], [cx - 18, by]]), .6);
  else piece(g, k.c2, S([[cx - 18, by - 20], [cx - 32, by + 8], [cx - 34, by + 30], [cx - 24, by + 20], [cx - 12, by - 4]]), .6);
  g.restore();
};

/* ---------------- the present, and what is in it ---------------- */
// a wrapped box with a ribbon and a bow, in three papers. Even frames closed, odd frames open (the lid flown off, sparkles)
const WRAP = [['#E98F8F', '#F2C65C'], ['#9ED9CF', '#F4A6C4'], ['#BBA6EA', '#F2C65C']];
function drawCadeau(g, f) {
  const [c, rb] = WRAP[Math.floor(f / 2) % 3], open = f % 2 === 1, x0 = 18, x1 = 92, top = open ? 62 : 54, bot = 112;
  const box = round([[x0, top], [x1, top], [x1, bot], [x0, bot]], 4);
  piece(g, c, box); within(g, box, () => { g.fillStyle = rb; g.fillRect(48, 0, 14, 200); g.fillStyle = 'rgba(80,40,60,.12)'; g.fillRect(0, bot - 10, 200, 10); });
  if (open) {
    ink(g, '#6F4A5A', E(55, top + 2, 34, 5));
    g.save(); g.translate(26, 32); g.rotate(-.6);
    const lid = round([[-30, -9], [30, -9], [30, 9], [-30, 9]], 4); piece(g, c, lid); within(g, lid, () => { g.fillStyle = rb; g.fillRect(-7, -20, 14, 40); });
    g.restore();
    for (const [x, y, r] of [[80, 24, 8], [96, 44, 5], [64, 14, 5]]) piece(g, '#F2C65C', star(x, y, r), .4);
  } else {
    const lid = round([[x0 - 6, 42], [x1 + 6, 42], [x1 + 6, 58], [x0 - 6, 58]], 4); piece(g, c, lid); within(g, lid, () => { g.fillStyle = rb; g.fillRect(48, 0, 14, 200); });
    piece(g, rb, U(E(42, 32, 14, 9, -.45), E(68, 32, 14, 9, .45)), .5); piece(g, rb, U(C(52, 38, 42, 52, 4), C(58, 38, 68, 52, 4)), .4); piece(g, rb, E(55, 36, 6, 6), .4);
  }
}
// 0 a teddy bear, 1 a little wooden train, 2 a drum (each drawn sitting on its base line)
function drawVerrassing(g, f) {
  if (f === 0) {
    const b = '#C79A66', b2 = '#AD8250';
    for (const x of [40, 74]) piece(g, b2, E(x, 112, 14, 9));
    piece(g, b, E(56, 90, 28, 26)); ink(g, '#E8CFA8', E(58, 94, 16, 16));
    piece(g, b2, C(32, 82, 20, 66, 8)); piece(g, b2, C(80, 82, 94, 62, 8));   // its arms, one waving
    for (const x of [34, 78]) { piece(g, b, E(x, 28, 11, 11)); ink(g, '#E8CFA8', E(x, 28, 5.5, 5.5)); }
    piece(g, b, E(56, 46, 27, 24)); piece(g, '#E8CFA8', E(60, 54, 11, 8), .4); ink(g, '#4B3D3D', E(60, 50, 4, 3)); line(g, MOUTH, 1.8, arc(60, 54, 4, .2 * PI, .8 * PI));
    eye(g, 47, 42, 3.6); eye(g, 70, 42, 3.6); cheek(g, 42, 54, 5, 3); cheek(g, 76, 54, 5, 3);
    piece(g, '#E98F8F', U(E(48, 70, 8, 5, -.4), E(64, 70, 8, 5, .4)), .4);   // a bow at its neck
  } else if (f === 1) {
    piece(g, '#4B3D3D', C(30, 34, 30, 54, 7));   // the chimney
    piece(g, '#8FC3E0', round([[14, 56], [70, 56], [70, 96], [14, 96]], 6));   // the boiler
    piece(g, '#E98F8F', round([[62, 30], [100, 30], [100, 96], [62, 96]], 5));   // the cab
    ink(g, '#FCF8F1', round([[70, 40], [92, 40], [92, 60], [70, 60]], 3)); piece(g, '#F2C65C', round([[56, 24], [106, 24], [106, 34], [56, 34]], 3), .5);
    for (const [x, r] of [[28, 13], [56, 11], [86, 13]]) { piece(g, '#4B3D3D', E(x, 100, r, r)); piece(g, '#F2C65C', E(x, 100, r * .4, r * .4), .3); }
    piece(g, '#F2C65C', E(10, 82, 5, 7), .4);
  } else {
    piece(g, '#E98F8F', round([[20, 50], [92, 50], [92, 108], [20, 108]], 8));
    within(g, round([[20, 50], [92, 50], [92, 108], [20, 108]], 8), () => { g.strokeStyle = '#F2C65C'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(20 + i * 14, 56); g.lineTo(27 + i * 14, 102); g.moveTo(34 + i * 14, 56); g.lineTo(27 + i * 14, 102); } g.stroke(); });
    piece(g, '#FCF8F1', E(56, 50, 36, 9)); piece(g, '#F2C65C', E(56, 108, 36, 6), .4);
    for (const [x0, y0, x1, y1] of [[34, 40, 18, 14], [76, 40, 96, 16]]) { piece(g, '#C79A66', C(x0, y0, x1, y1, 3.4), .5); piece(g, '#F4ECDC', E(x1, y1, 6, 6), .4); }
  }
}

/* ---------------- a snowball ---------------- */
function drawSneeuwbal(g) {
  piece(g, '#EAF0F6', S([[32, 9], [48, 14], [55, 30], [50, 47], [33, 55], [16, 49], [9, 32], [15, 15]]));
  ink(g, '#C6D5E3', S([[12, 34], [20, 48], [36, 52], [50, 44], [38, 46], [22, 42]]));
  ink(g, '#FFFFFF', E(24, 22, 6, 4, -.5));
  for (const [x, y] of [[40, 28], [30, 38], [44, 40]]) ink(g, '#DCE6EE', E(x, y, 2, 1.6));
}

/** a drawing moved on its card (room round it for the backing card) */
const moved = (fn, dx, dy) => (g, f) => { g.save(); g.translate(dx, dy); fn(g, f); g.restore(); };
/** every card: { w, h, draw, frames, size, does } */
export const CARDS5 = {
  kerstman: { w: 224, h: 290, draw: drawKerstman, frames: 4, size: 1.75, does: ['stand', 'ho ho ho', 'give', 'wave'] },
  slee: { w: 404, h: 240, draw: moved(drawSlee, 0, 34), frames: 3, size: 1.56, does: ['presents', 'Santa drives', 'Santa waves'] },
  rendier: { w: 244, h: 264, draw: moved(drawRendier, 2, 32), frames: 5, size: 1.6, does: ['stand', 'walk', 'walk', 'hop', 'fly'] },
  pinguin: { w: 190, h: 170, draw: drawPenguin(PENG), frames: 6, size: .82, does: ['stand', 'waddle', 'waddle', 'flap', 'belly', 'duck'] },
  pinguinkuiken: { w: 190, h: 170, draw: drawPenguin(CHICK), frames: 6, size: .55, does: ['stand', 'waddle', 'waddle', 'flap', 'belly', 'duck'] },
  cadeau: { w: 124, h: 124, draw: moved(drawCadeau, 10, 0), frames: 6, size: .46, thing: true, does: ['red', 'red open', 'mint', 'mint open', 'lilac', 'lilac open'] },
  verrassing: { w: 124, h: 134, draw: moved(drawVerrassing, 8, 4), frames: 3, size: .5, thing: true, does: ['teddy', 'train', 'drum'] },
  sneeuwbal: { w: 64, h: 64, draw: drawSneeuwbal, frames: 1, size: .3, thing: true, does: ['snowball'] },
};
