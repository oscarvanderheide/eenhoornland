// A sixth batch of paper cards (see STYLE.md): the people of the castle's entrance hall. A friendly little knight, a
// jester and a court lady, each with a few funny moves to answer a tap. Cut by the same scissors as cards3.js and
// cards5.js (their helpers are copied here: those files are not this one's to change). All face right (the world flips
// them). The sheet is cards6.html.
import { E, S, C, U, P, piece, ink, line } from './cut.js';

const DARK = '#33262E', PI = Math.PI, WHITE = '#FCF8F1', MOUTH = '#8A3D4C', TONGUE = '#EE8FA6';
const arc = (x, y, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + (a1 - a0) * i / n) * r, y + Math.sin(a0 + (a1 - a0) * i / n) * r]);
/** a shape with straight sides and corners rounded by r */
const round = (pts, r) => S(pts.flatMap((p, i) => {
  const n = pts.length, to = q => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(r, l / 2) / l; return [p[0] + dx * k, p[1] + dy * k]; };
  return [to(pts[(i + n - 1) % n]), p, to(pts[(i + 1) % n])];
}));
/** a bent strip of paper that gets thinner along a row of points, from r0 to r1 */
const taper = (pts, r0, r1) => U(...pts.slice(1).map((q, i) => C(...pts[i], ...q, r0 + (r1 - r0) * i / (pts.length - 1), r0 + (r1 - r0) * (i + 1) / (pts.length - 1))));
/** printed things that stay inside one shape */
function within(g, shape, fn) { if (!g.colour) return; g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); }
/** a little star of paper (a sparkle) */
const star = (x, y, r, n = 5, k = .45) => P(Array.from({ length: n * 2 }, (_, i) => { const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * k : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }));
/** a heart, its point down */
const heart = (x, y, r) => U(E(x - r * .5, y - r * .2, r * .56, r * .56), E(x + r * .5, y - r * .2, r * .56, r * .56), P([[x - r * 1.02, y], [x + r * 1.02, y], [x, y + r * 1.1]]));
const sparkles = (g, col, pts) => { for (const [x, y, r] of pts) piece(g, col, star(x, y, r, 4, .38), .4); };

/* ---------- people: a head with a face, arms and legs (as in cards3.js) ---------- */
const ROSE = ['#F4CDB0', '#E2B293'];
function eyeAt(g, x, y, r, how) {
  if (how === 'shut') return line(g, DARK, 2.4, arc(x, y - r * .5, r * 1.05, .2 * PI, .8 * PI));
  if (how === 'glad') return line(g, DARK, 2.4, arc(x, y + r * .7, r * 1.05, 1.2 * PI, 1.8 * PI));
  ink(g, DARK, E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32));
}
/** the head about its middle (x, y), turned by rot. o: skin, r, eyes (one way for both, or [far, near]), mouth ('smile'
 *  'grin' 'tongue' 'kiss' 'none'), ear, back(), top(), front() */
function head(g, x, y, rot, o) {
  const r = o.r || 40, [sk, sk2] = o.skin, eyes = o.eyes || 'open', m = o.mouth || 'smile', [ef, en] = Array.isArray(eyes) ? eyes : [eyes, eyes];
  g.save(); g.translate(x, y); g.rotate(rot);
  if (o.back) o.back(g, r);
  if (o.ear) piece(g, sk2, E(-r * .62, 8, 7.5, 9.5), .6);
  piece(g, sk, E(0, 0, r, r - 1));
  if (o.top) o.top(g, r);
  eyeAt(g, 25, 3, 5, en); eyeAt(g, 4, 3, 4.4, ef);
  ink(g, 'rgba(240,120,140,.45)', E(33, 18, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(-4, 18, 6, 4.5));
  ink(g, sk2, E(16, 11, 4.4, 3.6));
  if (m === 'smile') line(g, MOUTH, 2.6, arc(16, 17, 7, .2 * PI, .8 * PI));
  if (m === 'grin' || m === 'tongue') { ink(g, MOUTH, gg => { gg.moveTo(26, 19); gg.arc(16, 19, 10, 0, PI); gg.closePath(); }); ink(g, TONGUE, E(17, 25, 5, 2.6)); }
  if (m === 'tongue') piece(g, TONGUE, U(E(19, 31, 6, 7), C(19, 24, 19, 31, 6)), .3);
  if (m === 'kiss') { ink(g, MOUTH, E(19, 19, 3.6, 4)); ink(g, TONGUE, E(19, 19, 1.6, 2)); }
  if (o.front) o.front(g, r);
  g.restore();
}
function arm(g, col, hand, s, e, h, r = 10, hr = 9.5) { piece(g, col, U(C(...s, ...e, r), C(...e, ...h, r, r - 1.5))); piece(g, hand, E(h[0], h[1], hr, hr), .7); }
function leg(g, col, shoeCol, hip, knee, foot, r = 12) { piece(g, col, U(C(...hip, ...knee, r), C(...knee, ...foot, r, r - 1))); piece(g, shoeCol, E(foot[0] + 6, foot[1] + 9, 16, 8)); }
/** a part of the drawing turned about (x, y) */
const turned = (g, x, y, a, fn) => { g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y); fn(); g.restore(); };

/* ---------------- the knight ---------------- */
// a friendly little knight in shiny pale-blue paper armour, a red plume on his helmet, a little shield with a heart.
// 0 stands, visor up, smiling; 1 salutes, his hand at his helmet; 2 CLANG: the visor falls shut, only eye slits, sparks
// round his head and his hand comes up to lift it; 3 bows, his plume flopping forward over his helmet
const KN = { arm: '#CAD7E7', arm2: '#A9B9CE', arm3: '#8797B0', shine: '#F3F7FC', plume: '#E36A68', plume2: '#C4504F', gold: '#E6B748', shield: '#FAF3E6', heart: '#EE7F98', belt: '#B98A5E' };
function knightHead(g, x, y, rot, f) {
  const k = KN;
  head(g, x, y, rot, { skin: ROSE, r: 40, mouth: f === 2 ? 'none' : 'smile',
    top: () => {
      // the helmet: round on top, down over the back of his head to the chin, open in front
      const helm = round([[-48, 32], [-48, -20], [-26, -50], [24, -50], [48, -24], [48, -11], [-6, -11], [-12, 32]], 13);
      piece(g, k.arm, helm);
      within(g, helm, () => { g.fillStyle = k.shine; g.beginPath(); E(-16, -34, 16, 6, -.35)(g); g.fill(); g.fillStyle = k.arm2; g.fillRect(-60, -16, 120, 5); });
      for (const [a, b] of [[-36, 6], [-36, 22], [-24, -30]]) ink(g, k.arm3, E(a, b, 2.6, 2.6));
      // the plume, up and back; in the bow it flops forward
      // the visor, lifted up on top
      if (f !== 2) { piece(g, k.arm2, round([[-8, -62], [36, -58], [50, -44], [-2, -48]], 6), .5); line(g, k.arm3, 2, [[6, -53], [36, -51]]); }
      const pl = f === 3 ? [[-4, -48], [14, -66], [34, -66], [46, -50]] : [[-6, -48], [-14, -70], [-34, -80], [-54, -72]];
      piece(g, k.plume, taper(pl, 13, 8), .8);
      line(g, k.plume2, 2.2, pl.map(([a, b]) => [a, b + 2]));
      piece(g, k.gold, E(-4, -48, 7, 5), .4);
    },
    front: () => {
      if (f !== 2) return;
      // CLANG: the visor down over his face, two slits for his eyes, little holes to breathe through
      const v = round([[-10, -16], [50, -16], [52, 18], [38, 36], [-10, 36]], 10);
      piece(g, k.arm2, v, .6);
      within(g, v, () => { g.fillStyle = k.shine; g.beginPath(); E(6, -6, 18, 4, -.1)(g); g.fill(); });
      ink(g, DARK, round([[0, 0], [40, 0], [40, 6], [0, 6]], 3));
      for (const [a, b] of [[24, 18], [32, 18], [28, 25], [36, 25]]) ink(g, k.arm3, E(a, b, 2, 2));
      sparkles(g, k.gold, [[62, -34, 9], [-60, -50, 8], [64, 16, 7], [-16, -88, 6]]);
    } });
}
function drawRidder(g, f) {
  const k = KN, cx = 100, bow = f === 3 ? .3 : 0, hx = cx, hy = 222;
  leg(g, k.arm2, k.arm3, [cx - 16, 220], [cx - 18, 248], [cx - 20, 268], 13);
  leg(g, k.arm, k.arm3, [cx + 12, 220], [cx + 14, 248], [cx + 16, 268], 13);
  piece(g, k.arm, E(cx - 17, 248, 9, 8), .5); piece(g, k.shine, E(cx + 14, 248, 9, 8), .5);
  turned(g, hx, hy, bow, () => {
    // the far arm, behind him, and the shield in its hand
    const fh = f === 3 ? [cx - 62, 186] : [cx - 40, 198];
    arm(g, k.arm2, k.arm, [cx - 30, 142], f === 3 ? [cx - 50, 168] : [cx - 46, 174], fh, 12, 10);
    const body = S([[cx - 38, 124], [cx + 32, 122], [cx + 50, 160], [cx + 48, 206], [cx + 30, 226], [cx - 40, 226], [cx - 56, 204], [cx - 54, 158]]);
    piece(g, k.arm, body);
    within(g, body, () => {
      g.fillStyle = k.shine; g.beginPath(); E(cx + 22, 154, 9, 20, -.35)(g); g.fill();
      g.fillStyle = k.belt; g.fillRect(0, 194, 300, 11);
      g.fillStyle = k.arm2; g.fillRect(0, 213, 300, 3);
    });
    piece(g, k.gold, round([[cx + 6, 191], [cx + 22, 191], [cx + 22, 208], [cx + 6, 208]], 3), .4);
    piece(g, k.arm2, C(cx - 34, 127, cx + 28, 125, 9), .5);
    // the shield: a cream heater shield with a golden rim and a pink heart
    const [sx, sy] = [fh[0] - 8, fh[1] - 6];
    piece(g, k.gold, round([[sx - 31, sy - 35], [sx + 31, sy - 35], [sx + 31, sy + 2], [sx, sy + 42], [sx - 31, sy + 2]], 12), .9);
    ink(g, k.shield, round([[sx - 25, sy - 29], [sx + 25, sy - 29], [sx + 25, sy], [sx, sy + 34], [sx - 25, sy]], 9));
    ink(g, k.heart, heart(sx, sy - 6, 15));
    // the near arm: on his belly, saluting, lifting the visor, across his chest in the bow
    if (f === 0 || f === 3) arm(g, k.arm, k.arm, [cx + 4, 140], [cx + 26, 174], [cx + 44, 168], 12, 10);
    knightHead(g, cx + 8, 86, f === 3 ? .12 : f === 2 ? -.06 : 0, f);
    if (f === 1) arm(g, k.arm, k.arm, [cx + 8, 138], [cx + 52, 132], [cx + 52, 80], 12, 10);
    if (f === 2) arm(g, k.arm, k.arm, [cx + 8, 140], [cx + 50, 146], [cx + 60, 106], 12, 10);
  });
}

/* ---------------- the jester ---------------- */
// a jester in a two-colour suit, pink on one side and teal on the other, a hat with three floppy points and golden bells,
// curly shoes. 0 stands grinning, a hand on his hip; 1 juggles three balls; 2 stands on his hands, upside down, his legs in
// a V and his hat hanging down; 3 bows with a flourish, one arm swept out, his tongue out, bells jingling
const NAR = { pink: '#F4A6C4', pink2: '#E48AAE', teal: '#86D2C9', teal2: '#5FB6AD', gold: '#F2C65C', gold2: '#C99A35', collar: WHITE, balls: ['#F2C65C', '#BBA6EA', '#9ED9A0'] };
function bell(g, x, y, r = 7.5) { const k = NAR; piece(g, k.gold, E(x, y, r, r), .5); ink(g, k.gold2, E(x, y + r * .45, r * .55, r * .22)); ink(g, '#FBE7A6', E(x - r * .35, y - r * .35, r * .28, r * .28)); }
/** a jester's leg: a stocking and a curly pointed shoe with a bell on its toe */
function jleg(g, col, shoe, hip, knee, foot) {
  piece(g, col, U(C(...hip, ...knee, 11), C(...knee, ...foot, 11, 10)));
  const [x, y] = foot;
  piece(g, shoe, S([[x - 12, y + 2], [x + 6, y + 4], [x + 22, y + 6], [x + 34, y - 6], [x + 30, y + 14], [x + 14, y + 18], [x - 14, y + 16]]));
  bell(g, x + 33, y - 6, 5);
}
/** his hat on his head (in the head's own measure): three floppy points, each with a bell, on a little cap */
function jesterHat(g, how, part) {
  const k = NAR;
  const pts = how === 'hang'
    ? [[[-24, -32], [-46, -38], [-62, -30], [-72, -14]], [[0, -40], [-6, -48], [-16, -50]], [[24, -34], [46, -40], [62, -30], [72, -14]]]
    : how === 'swing'
      ? [[[-24, -32], [-50, -44], [-66, -36], [-72, -18]], [[0, -40], [8, -70], [26, -84], [42, -80]], [[24, -34], [48, -50], [62, -48], [68, -32]]]
      : [[[-24, -32], [-48, -50], [-66, -52], [-74, -36]], [[0, -40], [-4, -70], [8, -88], [24, -90]], [[24, -34], [50, -54], [66, -54], [74, -38]]];
  if (part === 'points') { pts.forEach((p, i) => { piece(g, i === 1 ? k.teal : k.pink, taper(p, 14, 6), .8); bell(g, ...p[p.length - 1]); }); return; }
  const cap = S([[-44, -4], [-40, -34], [-4, -50], [36, -40], [44, -6], [0, -18]]);
  piece(g, k.teal, cap, .6);
  within(g, cap, () => { g.fillStyle = k.pink; g.beginPath(); g.rect(0, -60, 60, 70); g.fill(); });
  piece(g, k.gold, C(-40, -10, 42, -12, 5), .4);
}
/** the jester. o: far and near arm and leg ([shoulder, elbow, hand], [hip, knee, foot]), hat, eyes, mouth, lean, head turn */
function jester(g, o) {
  const k = NAR, cx = 96;
  jleg(g, k.teal2, k.pink2, ...o.farLeg);
  jleg(g, k.pink, k.teal, ...o.nearLeg);
  turned(g, cx, 224, o.lean || 0, () => {
    arm(g, k.teal2, ROSE[0], ...o.farArm, 10, 9);
    // the tunic: split down the middle, a pointed hem, golden diamonds
    const tunic = S([[cx - 34, 130], [cx + 30, 128], [cx + 44, 170], [cx + 50, 212], [cx - 52, 214], [cx - 46, 170]]);
    piece(g, k.teal, tunic);
    within(g, tunic, () => { g.fillStyle = k.pink; g.fillRect(cx - 4, 100, 120, 140); for (const [a, b] of [[cx - 24, 168], [cx + 18, 160], [cx + 24, 196], [cx - 28, 200]]) { g.fillStyle = k.gold; g.beginPath(); P([[a, b - 7], [a + 5, b], [a, b + 7], [a - 5, b]])(g); g.fill(); } });
    for (let i = 0; i < 6; i++) { const x0 = cx - 52 + i * 17; piece(g, i % 2 ? k.pink : k.teal, P([[x0, 206], [x0 + 17, 206], [x0 + 8.5, 230]]), .5); bell(g, x0 + 8.5, 230, 4); }
    // the ruff round his neck: points in turn
    for (let i = 0; i < 5; i++) { const x0 = cx - 34 + i * 14; piece(g, i % 2 ? k.teal : k.pink, P([[x0, 124], [x0 + 18, 124], [x0 + 9, 146]]), .5); }
    piece(g, k.collar, C(cx - 32, 126, cx + 34, 124, 6), .4);
    arm(g, k.pink, ROSE[0], ...o.nearArm, 10, 9);
    head(g, cx + 6, 102, o.turn || 0, { skin: ROSE, r: 38, ear: true, eyes: o.eyes || 'open', mouth: o.mouth || 'grin', back: () => jesterHat(g, o.hat, 'points'), top: () => { piece(g, '#C98F6A', E(-34, 6, 8, 10), .3); jesterHat(g, o.hat, 'cap'); } });
  });
}
const JUGGLE = [[NAR.balls[0], 164, 116], [NAR.balls[1], 190, 80], [NAR.balls[2], 212, 122]];
function drawNar(g, f) {
  const cx = 96, standLegs = { farLeg: [[cx - 14, 224], [cx - 18, 250], [cx - 22, 268]], nearLeg: [[cx + 10, 224], [cx + 14, 250], [cx + 14, 268]] };
  if (f === 0) jester(g, { ...standLegs, farArm: [[cx - 26, 146], [cx - 50, 168], [cx - 54, 194]], nearArm: [[cx + 8, 146], [cx + 36, 170], [cx + 24, 194]] });
  if (f === 1) {
    jester(g, { ...standLegs, turn: -.12, farArm: [[cx - 24, 148], [cx - 8, 180], [cx + 40, 170]], nearArm: [[cx + 8, 148], [cx + 44, 176], [cx + 86, 160]] });
    for (const [c, x, y] of JUGGLE) { piece(g, c, E(x, y, 11, 11), 1.2); ink(g, 'rgba(255,255,255,.55)', E(x - 3.5, y - 3.5, 3.5, 3)); }
  }
  if (f === 2) {
    // on his hands: the whole jester mirrored top to bottom, his hands on the ground, his legs up in a V, his hat hanging
    g.save(); g.translate(0, 330); g.scale(1, -1);
    jester(g, { hat: 'hang', eyes: 'open', mouth: 'grin', farLeg: [[cx - 14, 224], [cx - 42, 254], [cx - 66, 274]], nearLeg: [[cx + 10, 224], [cx + 34, 254], [cx + 54, 276]], farArm: [[cx - 26, 146], [cx - 50, 104], [cx - 66, 58]], nearArm: [[cx + 8, 146], [cx + 44, 106], [cx + 70, 58]] });
    g.restore();
  }
  if (f === 3) {
    jester(g, { ...standLegs, lean: .26, hat: 'swing', eyes: ['open', 'glad'], mouth: 'tongue', turn: .08, farArm: [[cx - 26, 146], [cx - 50, 122], [cx - 56, 94]], nearArm: [[cx + 8, 146], [cx + 44, 172], [cx + 70, 196]] });
    sparkles(g, NAR.gold, [[30, 34, 8], [196, 110, 7], [160, 32, 6]]);
  }
}

/* ---------------- the court lady ---------------- */
// a lady of the castle in a long lilac gown with a pink front, a tall pink cone hat with a veil floating from its tip, a
// fan. 0 stands, her fan open at her chest; 1 curtsies: her gown spread wide, her head bowed; 2 blows a kiss, a little
// heart floating off; 3 laughs behind her open fan, her eyes shut happily
const LADY = { gown: '#CDB8EA', gown2: '#B39DD8', pink: '#F6BCD3', pink2: '#E89DBE', hat: '#F4A6C4', hat2: '#E58CB2', veil: '#FBF3F8', gold: '#F2C65C', hair: '#C98A5C', hair2: '#AE7047', fan: '#9ED9CF', fan2: '#6FBDB2', heart: '#EE7F98' };
/** a fan: open (a half round of pleats, its pivot in her hand) or shut (a slim stick) */
function fan(g, x, y, rot, open) {
  const k = LADY;
  g.save(); g.translate(x, y); g.rotate(rot);
  if (open) {
    const sh = gg => { gg.moveTo(0, 0); for (let i = 0; i <= 12; i++) { const a = -PI * .92 + i / 12 * PI * .84, r = i % 2 ? 34 : 31; gg.lineTo(Math.cos(a) * r, Math.sin(a) * r); } gg.closePath(); };
    piece(g, k.fan, sh, .7);
    for (let i = 1; i < 6; i++) { const a = -PI * .92 + i / 6 * PI * .84; line(g, k.fan2, 1.4, [[0, 0], [Math.cos(a) * 30, Math.sin(a) * 30]]); }
    within(g, sh, () => { g.strokeStyle = k.pink2; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 25, -PI * .92, -PI * .08); g.stroke(); });
    piece(g, k.gold, E(0, 0, 4, 4), .3);
  } else { piece(g, k.fan, C(0, 0, 0, -34, 4, 6), .6); line(g, k.fan2, 1.2, [[0, -4], [0, -32]]); }
  g.restore();
}
function ladyHead(g, x, y, rot, eyes, mouth) {
  const k = LADY;
  head(g, x, y, rot, { skin: ROSE, r: 36, eyes, mouth,
    back: () => {
      // the veil floats from the hat's tip down behind her, and her hair in a soft bun
      piece(g, k.veil, taper([[-30, -84], [-58, -60], [-70, -20], [-64, 22]], 6, 13), .6);
      piece(g, k.hair2, E(-28, 16, 16, 20), .5);
    },
    top: () => {
      piece(g, k.hair, U(E(-28, 2, 13, 22), E(-12, -20, 22, 12)), .4);
      // the hennin: a tall cone tipped back, a golden band where it sits on her head
      const cone = S([[-28, -22], [-38, -54], [-34, -88], [-26, -84], [-2, -54], [26, -34], [6, -24]]);
      piece(g, k.hat, cone, .7);
      within(g, cone, () => { g.strokeStyle = k.hat2; g.lineWidth = 3; for (const t of [.3, .55]) { g.beginPath(); g.moveTo(-40 + t * 12, -24 - t * 66); g.lineTo(26 - t * 50, -34 - t * 46); g.stroke(); } });
      piece(g, k.gold, C(-30, -22, 24, -32, 5), .4);
      piece(g, k.gold, E(-31, -86, 5, 5), .4);
    } });
}
function drawJonkvrouw(g, f) {
  const k = LADY, cx = 98, dip = f === 1 ? 16 : 0;
  // the gown: long and wide, spread out further in the curtsy; a pink front and a golden hem
  const w = f === 1 ? 18 : 0;
  const gown = S([[cx - 30, 168 + dip], [cx + 24, 168 + dip], [cx + 44 + w * .6, 240], [cx + 62 + w, 296], [cx + 58 + w, 318], [cx - 62 - w, 318], [cx - 68 - w, 296], [cx - 46 - w * .6, 240]]);
  if (f === 1) arm(g, k.gown2, ROSE[0], [cx - 22, 134 + dip], [cx - 46, 166 + dip], [cx - 70, 208], 10, 8.5);
  else if (f === 2 || f === 0) { arm(g, k.gown2, ROSE[0], [cx - 22, 132], [cx - 40, 160], [cx - 40, 190], 10, 8.5); if (f === 2) fan(g, cx - 40, 192, 2.9, false); }
  else arm(g, k.gown2, ROSE[0], [cx - 22, 132], [cx - 40, 162], [cx - 30, 186], 10, 8.5);
  piece(g, k.gown, gown);
  within(g, gown, () => {
    g.fillStyle = k.pink; g.beginPath(); P([[cx - 8, 160], [cx + 8, 160], [cx + 26 + w * .5, 330], [cx - 26 - w * .5, 330]])(g); g.fill();
    g.fillStyle = k.gold; g.fillRect(0, 304, 300, 6);
    g.fillStyle = k.pink2; for (let i = 0; i < 4; i++) { g.beginPath(); E(cx, 196 + i * 30, 3.4, 3.4)(g); g.fill(); }
  });
  // the bodice and a golden girdle high on the waist
  const bod = S([[cx - 26, 120 + dip], [cx + 22, 120 + dip], [cx + 28, 176 + dip], [cx - 30, 176 + dip]]);
  piece(g, k.gown2, bod, .6);
  within(g, bod, () => { g.fillStyle = k.pink; g.beginPath(); P([[cx - 6, 120 + dip], [cx + 8, 120 + dip], [cx + 2, 176 + dip]])(g); g.fill(); });
  piece(g, k.gold, C(cx - 30, 170 + dip, cx + 28, 170 + dip, 4.5), .4);
  piece(g, k.pink, C(cx - 24, 122 + dip, cx + 22, 122 + dip, 5), .4);
  // the near arm, a long sleeve with a hanging cuff: the fan, the skirt, the kiss, the fan at her face
  const near = f === 1 ? [[cx + 6, 134 + dip], [cx + 34, 168 + dip], [cx + 62, 206]] : f === 2 ? [[cx + 6, 134], [cx + 38, 156], [cx + 36, 120]] : f === 3 ? [[cx + 6, 134], [cx + 36, 160], [cx + 34, 128]] : [[cx + 6, 134], [cx + 28, 164], [cx + 42, 150]];
  piece(g, k.pink2, S([[near[1][0] - 8, near[1][1]], [near[1][0] + 8, near[1][1] + 4], [near[1][0] + 2, near[1][1] + 30], [near[1][0] - 10, near[1][1] + 24]]), .5);
  const headRot = f === 1 ? .32 : f === 3 ? -.1 : f === 2 ? -.06 : 0;
  ladyHead(g, cx + 8, 98 + dip, headRot, f === 1 ? 'shut' : f === 3 ? 'glad' : f === 2 ? ['open', 'glad'] : 'open', f === 2 ? 'kiss' : f === 3 ? 'none' : 'smile');
  arm(g, k.gown, ROSE[0], ...near, 10, 8.5);
  if (f === 0) fan(g, near[2][0], near[2][1], .1, true);
  if (f === 1) fan(g, near[2][0], near[2][1], 2.6, false);
  if (f === 3) { fan(g, near[2][0] - 6, near[2][1] + 2, .18, true); sparkles(g, k.gold, [[cx + 66, 66, 7], [cx + 76, 100, 5.5], [cx - 52, 56, 6]]); }
  if (f === 2) { piece(g, k.heart, heart(cx + 64, 92, 12), 1); piece(g, k.pink2, heart(cx + 78, 60, 8), .8); }
}

/** a drawing moved on its card (room round it for the backing card) */
const moved = (fn, dx, dy) => (g, f) => { g.save(); g.translate(dx, dy); fn(g, f); g.restore(); };

export const CARDS6 = {
  ridder: { w: 244, h: 318, draw: moved(drawRidder, 10, 16), frames: 4, size: 1.6, does: ['stand', 'salute', 'clang', 'bow'] },
  nar: { w: 236, h: 314, draw: moved(drawNar, 0, 12), frames: 4, size: 1.45, does: ['stand', 'juggle', 'handstand', 'bow'] },
  jonkvrouw: { w: 200, h: 338, draw: moved(drawJonkvrouw, 0, 8), frames: 4, size: 1.6, does: ['stand', 'curtsy', 'kiss', 'laugh'] },
};
