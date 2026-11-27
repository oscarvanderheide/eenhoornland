// Anna and Fenna as paper dolls. A doll is a few jointed pieces (legs and arms turn at the hip and the shoulder), so a
// pose is a handful of numbers (rig), not a new drawing; and what she wears is its own layer of paper pieces in five
// slots, the same five the stall sells (quest.js SHOP): head, neck, hand, dress, back.
//   drawKid(g, 'anna', { view: 'side' | 'front' | 'back', pose, f, wear: { head, neck, hand, dress, back }, eyes })
//   kidPoints('anna', view, pose, f) -> where her hand, the top of her head and her seat are (for things she holds or sits on)
// Plain (no pose, nothing on) she is drawn exactly as before the dolls had joints.
import { E, S, C, U, P, piece, ink, line, swing } from './cut.js';

export const KID = {
  anna: { skin: '#F4CDB0', skin2: '#E2B293', hair: '#EEC363', hair2: '#D4A648', dress: '#F58DB9', dress2: '#DC6A9E', collar: '#FBF3E6', shoe: '#5BAEE8', shoe2: '#3E8DCB', clip: '#FF6FA5',
    head: 42, headY: 94, neck: 132, hem: 204, foot: 222, arm: 36, pony: 24 },
  fenna: { skin: '#F2C8A8', skin2: '#DFAD8C', hair: '#8A5634', hair2: '#6E4126', dress: '#A586E8', dress2: '#8467CC', collar: '#FBF3E6', shoe: '#F06FA3', shoe2: '#CC4F86', clip: '#F7CE5A',
    head: 40, headY: 92, neck: 128, hem: 226, foot: 258, arm: 46, pony: 56 },
};
/** what the stall sells, per slot (the ids of quest.js SHOP) */
export const WEAR = { head: ['strik', 'krans', 'hoed', 'kroon'], neck: ['ketting'], hand: ['knuffel', 'ballon'], dress: ['jurkgeel', 'jurkblauw', 'jurkregenboog'], back: ['vleugels'] };
/** stand and walk (twelve drawings), sitting, arms out in front to hold something, both arms up.
 *  'hold' and 'up' walk too when f is a walk drawing, so she can carry something along */
export const POSES = ['stand', 'walk', 'sit', 'hold', 'up'];

const DRESS = { jurkgeel: ['#F7D04A', '#DDA92A'], jurkblauw: ['#7CC4EE', '#4E9CD4'] };
const RAINBOW = ['#F2879B', '#F7A968', '#F7D76A', '#9ED9A0', '#7CC4EE', '#BBA6EA'];
const RED = '#E8505B', RED2 = '#C23A48', GOLD = '#EBC35E', GOLD2 = '#C9993A', PEARL = '#FFFDF6', LEAF = '#7CC48A', WING = '#FFFDF8', WING2 = '#CDBDF2';
const NONE = {};

/* ---------- the rig: where her joints are in a pose ---------- */
function rig(o, view, pose, f) {
  const s = f && (pose === 'walk' || pose === 'hold' || pose === 'up') ? swing(f) : 0, sh = o.neck + 12, thigh = o.hem - 10, L = o.foot - 2 - thigh, A = o.arm;
  if (view === 'side') {
    const cx = 102;
    const r = { cx, s, sh, pony: s * 3, toe: 0,
      hipN: [cx + 8, thigh], hipF: [cx - 8, thigh], footN: [cx + 8 + s * 11, o.foot - 2], footF: [cx - 8 - s * 11, o.foot - 2],
      shN: [cx + 13, sh], shF: [cx - 12, sh], handN: [cx + 20 + s * 9, sh + A], handF: [cx - 19 - s * 9, sh + A] };
    if (pose === 'sit') { r.toe = 1; r.hipN = [cx + 6, o.hem - 8]; r.hipF = [cx - 2, o.hem - 12]; r.footN = [cx + 28 + L, o.hem - 5]; r.footF = [cx + 20 + L, o.hem - 10]; r.handN = [cx + 27, sh + A * .86]; r.handF = [cx - 8, sh + A * .9]; }
    if (pose === 'hold') { r.handN = [cx + 13 + A * .95, sh + A * .3]; r.handF = [cx + 2 + A * 1.05, sh + A * .42]; }
    if (pose === 'up') { r.handN = [cx + 13 + A * .9, sh - A * .7]; r.handF = [cx + 4 + A * .9, sh - A * .6]; }
    return r;
  }
  const cx = 100, w0 = 16;
  const r = { cx, s, sh, thigh, k: s * 4, big: false, armsFront: false, legs: [[-9, Math.max(0, s) * 9], [9, Math.max(0, -s) * 9]],
    shL: [cx - w0 - 2, sh], shR: [cx + w0 + 2, sh], handL: [cx - w0 - 9, sh + A - s * 5], handR: [cx + w0 + 9, sh + A + s * 5] };
  if (pose === 'sit') { r.legs = [[-9, L * .45], [9, L * .45]]; r.big = view === 'front'; r.handL = [cx - w0 - 5, sh + A * .9]; r.handR = [cx + w0 + 5, sh + A * .9]; }
  if (pose === 'hold') { r.handL = [cx - 9, sh + A * .62]; r.handR = [cx + 9, sh + A * .62]; r.armsFront = view === 'front'; }
  if (pose === 'up') { r.handL = [cx - w0 - 2 - A, sh - A * .75]; r.handR = [cx + w0 + 2 + A, sh - A * .75]; }
  return r;
}
/** points on her card (drawing units, y down): `hand` holds a thread or a toy, `hold` is between her two hands,
 *  `top` is the top of her head, `seat` is where she sits */
export function kidPoints(who, view = 'side', pose = 'stand', f = 0) {
  const o = KID[who], r = rig(o, view, pose, f), top = [r.cx + (view === 'side' ? 4 : 0), o.headY - o.head - 8], seat = [r.cx, o.hem + 6];
  if (view === 'side') return { hand: r.handN, hold: [(r.handN[0] + r.handF[0]) / 2 + 6, (r.handN[1] + r.handF[1]) / 2], top, seat };
  const hand = view === 'front' ? r.handR : r.handL;
  return { hand, hold: [r.cx, (r.handL[1] + r.handR[1]) / 2], top, seat };
}

/* ---------- pieces every view shares ---------- */
const shoe = (g, col, [x, y], rx, toe) => piece(g, col, toe ? E(x + 5, y - 3, 7.5, rx) : E(x + 5, y + 6, rx, 7.5));
/** the dress, a little A, with a band at the hem; a bought dress is another colour, the rainbow one is six strips */
function dress(g, o, cx, wear) {
  const w0 = 16, w1 = 29 + (o.hem - o.neck) * .07, d = DRESS[wear.dress], rainbow = wear.dress === 'jurkregenboog';
  const body = S([[cx - w0, o.neck - 4], [cx + w0, o.neck - 4], [cx + w0 + 3, o.neck + 10], [cx + w1, o.hem - 2], [cx + w1 - 2, o.hem + 4], [cx, o.hem + 8], [cx - w1 + 2, o.hem + 4], [cx - w1, o.hem - 2], [cx - w0 - 3, o.neck + 10]]);
  piece(g, rainbow ? RAINBOW[0] : d ? d[0] : o.dress, body);
  if (rainbow) {
    if (g.colour) { g.save(); g.beginPath(); body(g); g.clip(); const top = o.neck - 6, h = (o.hem + 10 - top) / 6; RAINBOW.forEach((c, i) => { g.fillStyle = c; g.fillRect(cx - 60, top + i * h, 120, h + 1); if (i) { g.fillStyle = 'rgba(90,60,70,.16)'; g.fillRect(cx - 60, top + i * h, 120, 1.2); } }); g.restore(); }
  } else piece(g, d ? d[1] : o.dress2, S([[cx - w1 + 3, o.hem - 9], [cx + w1 - 3, o.hem - 9], [cx + w1, o.hem - 1], [cx + w1 - 2, o.hem + 4], [cx, o.hem + 8], [cx - w1 + 2, o.hem + 4], [cx - w1, o.hem - 1]]), .6);
}
const dress2 = (o, wear) => wear.dress === 'jurkregenboog' ? RAINBOW[5] : DRESS[wear.dress] ? DRESS[wear.dress][1] : o.dress2;
const collar = (g, o, cx) => piece(g, o.collar, S([[cx - 16, o.neck - 6], [cx + 16, o.neck - 6], [cx + 10, o.neck + 6], [cx, o.neck + 3], [cx - 10, o.neck + 6]]), .6);
/** an eye: open, a dot with a glint; shut, a little arc */
function eyeAt(g, x, y, r, eyes) {
  if (eyes !== 'shut') { ink(g, '#33262e', E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32)); return; }
  if (g.colour) { g.save(); g.strokeStyle = '#33262e'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(x, y - r * .5, r * 1.05, .2 * Math.PI, .8 * Math.PI); g.stroke(); g.restore(); }
}
function smile(g, x, y, a0, a1) { if (g.colour) { g.save(); g.strokeStyle = '#8a3d4c'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 6, a0, a1); g.stroke(); g.restore(); } }

/* ---------- things to wear ---------- */
/** the cuddly rabbit, held by its ears at (x, y) and dangling */
function rabbit(g, x, y) {
  piece(g, '#F6F0FA', U(E(x - 4, y + 2, 4.2, 11, -.25), E(x + 4, y + 2, 4.2, 11, .25)), .6);
  ink(g, '#D9BFEA', U(E(x - 4, y + 2, 1.8, 7, -.25), E(x + 4, y + 2, 1.8, 7, .25)));
  piece(g, '#F6F0FA', U(E(x, y + 31, 9, 11), E(x - 5, y + 41, 4.5, 3.2), E(x + 5, y + 41, 4.5, 3.2)), .6);
  piece(g, '#F6F0FA', E(x, y + 17, 10.5, 9.5), .7);
  ink(g, '#33262e', U(E(x - 4, y + 16, 1.5, 1.8), E(x + 4, y + 16, 1.5, 1.8))); ink(g, '#F08FB0', E(x, y + 20.5, 1.9, 1.4));
}
/** a string of beads through `pts`, pearl and pink in turn, a gold one in the middle */
function beads(g, pts) { pts.forEach(([x, y], i) => { const mid = i === (pts.length - 1) / 2; piece(g, mid ? GOLD : i % 2 ? '#F58DB9' : PEARL, E(x, y, mid ? 4.6 : 3.5, mid ? 4.6 : 3.5), .45); }); }
/** fairy wings: a big and a small lobe, pearl paper on lilac; `d` is 1 for the wing on the right, -1 for the left */
function wing(g, x, y, d, k = 1) {
  const m = pts => S(pts.map(([px, py]) => [x + px * d * k, y + py]));
  piece(g, WING2, m([[-4, 0], [22, -48], [64, -46], [62, -6], [28, 12]]), .7); piece(g, WING, m([[-2, -2], [24, -40], [54, -38], [52, -8], [26, 6]]), .5);
  piece(g, WING2, m([[-2, 6], [42, 6], [54, 40], [22, 46]]), .7); piece(g, WING, m([[0, 9], [36, 11], [44, 34], [22, 38]]), .5);
}
/** what she has on her head: a big red bow with dots, a wreath of flowers, a red sun hat, a crown.
 *  (hx, hy) is the middle of her head, r its size, `side` when seen from the side */
function headwear(g, kind, hx, hy, r, side) {
  if (kind === 'strik') {
    const by = hy - r - 4;
    piece(g, RED, U(E(hx - 14, by - 2, 15, 10, .4), E(hx + 14, by - 2, 15, 10, -.4)), .8);
    ink(g, '#fff', U(E(hx - 18, by - 5, 2.2, 2.2), E(hx - 11, by + 2, 2.2, 2.2), E(hx + 18, by - 5, 2.2, 2.2), E(hx + 11, by + 2, 2.2, 2.2)));
    piece(g, RED2, E(hx, by, 6.5, 7), .9);
  }
  if (kind === 'krans') {
    const n = 7, at = i => { const t = i / (n - 1), u = t * 2 - 1; return [hx + u * (r + (side ? 3 : 1)) + (side ? 2 : 0), hy - r * .86 + u * u * r * .46]; };
    for (let i = 0; i < n - 1; i++) { const [x1, y1] = at(i), [x2, y2] = at(i + 1); piece(g, LEAF, E((x1 + x2) / 2, (y1 + y2) / 2 + 1, 7, 3.6, Math.atan2(y2 - y1, x2 - x1)), .4); }
    for (let i = 0; i < n; i++) { const [x, y] = at(i), c = ['#F58DB9', '#F7D04A', PEARL][i % 3]; piece(g, c, E(x, y, 6.4, 6.4), .6); ink(g, c === '#F7D04A' ? '#F2994B' : '#F7D04A', E(x, y, 2.4, 2.4)); }
  }
  if (kind === 'hoed') {
    piece(g, RED, E(hx, hy - r * .78, r * .8, r * .44), .8);
    ink(g, '#fff', U(E(hx - r * .4, hy - r * .86, 3.4, 3.4), E(hx + r * .05, hy - r * 1.02, 3.4, 3.4), E(hx + r * .45, hy - r * .82, 3.4, 3.4)));
    piece(g, RED, E(hx + (side ? 3 : 0), hy - r * .42, r + 14, 8.5, side ? -.05 : 0), 1); ink(g, RED2, E(hx + (side ? 3 : 0), hy - r * .5, r * .78, 3.2));
  }
  if (kind === 'kroon') {
    const b = hy - r + 5, w = side ? 19 : 23;
    piece(g, GOLD, P([[hx - w, b], [hx - w - 2, b - 22], [hx - w * .5, b - 11], [hx, b - 27], [hx + w * .5, b - 11], [hx + w + 2, b - 22], [hx + w, b]]), .8);
    ink(g, GOLD2, P([[hx - w, b], [hx - w, b - 5], [hx + w, b - 5], [hx + w, b]]));
    ink(g, '#F2879B', E(hx, b - 16, 3, 3)); ink(g, '#7CC4EE', U(E(hx - w + 1, b - 13, 2.4, 2.4), E(hx + w - 1, b - 13, 2.4, 2.4)));
  }
}

/** a thing to wear on its own, for the shop's rack: drawn in the middle of a 120 x 120 canvas */
export function drawWearIcon(g, id) {
  if (WEAR.head.includes(id)) { headwear(g, id, 60, id === 'kroon' ? 104 : id === 'hoed' ? 92 : id === 'krans' ? 96 : 100, 34, false); return; }
  if (id === 'ketting') { beads(g, [0, 1, 2, 3, 4, 5, 6].map(i => [60 + (i / 3 - 1) * 30, 40 + Math.sin(i / 6 * Math.PI) * 40])); return; }
  if (id === 'knuffel') { rabbit(g, 60, 26); return; }
  if (id === 'ballon') { g.save(); g.translate(20, 8); drawBalloon(g); g.restore(); return; }
  if (id === 'vleugels') { wing(g, 54, 64, -1, .9); wing(g, 66, 64, 1, .9); return; }
  const d = DRESS[id], rb = id === 'jurkregenboog', body = S([[44, 20], [76, 20], [80, 44], [100, 104], [20, 104], [40, 44]]);
  piece(g, rb ? RAINBOW[0] : d[0], body);
  if (rb) RAINBOW.forEach((c, i) => { if (i) ink(g, c, P([[40 - i * 3, 44 + i * 10], [80 + i * 3, 44 + i * 10], [83 + i * 3, 54 + i * 10], [37 - i * 3, 54 + i * 10]])); });
  else ink(g, d[1], P([[24, 96], [96, 96], [100, 104], [20, 104]]));
  piece(g, '#FBF3E6', E(60, 22, 12, 6), .4);
}

/* ---------- the three views ---------- */
function kidSide(g, o, R, wear, eyes) {
  const { cx, sh } = R, hy = o.headY, r = o.head, legR = 8;
  if (wear.back === 'vleugels') wing(g, cx - 8, sh + 2, -1, .92);
  // far leg and arm (in the shade); sitting, her legs lie on top of her dress and are drawn after it
  const farLeg = () => { piece(g, o.skin2, C(...R.hipF, ...R.footF, legR)); shoe(g, o.shoe2, R.footF, 12, R.toe); };
  const nearLeg = () => { piece(g, o.skin, C(...R.hipN, ...R.footN, legR)); shoe(g, o.shoe, R.footN, 13, R.toe); };
  if (!R.toe) farLeg();
  piece(g, o.skin2, C(...R.shF, ...R.handF, 6.5, 8));
  // the ponytail, tied high at the back of her head: it swings out and curls down (longer for Fenna), and bounces as she walks
  { const L = o.pony, k = R.pony, bx = cx - r * .55, by = hy - r * .62;
    piece(g, o.hair, S([[bx + 6, by + 4], [bx - 14, by - 14], [bx - 38, by - 10], [bx - 50 + k, by + 10], [bx - 50 + k, by + L * .6], [bx - 40 + k, by + L + 12], [bx - 30 + k, by + L + 4],
      [bx - 34 + k, by + L * .55], [bx - 28, by + 16], [bx - 12, by + 12]]));
    ink(g, o.hair2, S([[bx - 34, by - 4], [bx - 44 + k, by + 12], [bx - 44 + k, by + L * .5], [bx - 38 + k, by + L * .6], [bx - 38, by + 14]])); }
  if (!R.toe) nearLeg();
  dress(g, o, cx, wear); collar(g, o, cx);
  if (R.toe) { farLeg(); nearLeg(); }
  if (wear.neck === 'ketting') beads(g, [0, 1, 2, 3, 4].map(i => [cx + 16 - i * 5.5, o.neck + 3 + Math.sin(i / 4 * Math.PI * .85) * 13]));
  if (wear.hand === 'knuffel') rabbit(g, R.handN[0] + 2, R.handN[1] + 3);
  // near arm with a round hand
  piece(g, o.skin, C(...R.shN, ...R.handN, 6.5, 8));
  // head: the hair behind, the face, then the hair on top with a fringe
  piece(g, o.hair2, E(cx - 6, hy - 6, r + 3, r - 3));
  piece(g, o.skin, E(cx + 4, hy, r, r - 1));
  const t = hy - r;
  piece(g, o.hair, S([[cx - r + 14, hy + 30], [cx - r - 5, hy + 6], [cx - r - 4, hy - 26], [cx - 22, t - 4], [cx + 6, t - 8], [cx + 34, t + 2], [cx + r + 6, hy - 22], [cx + r + 8, hy - 8],
    [cx + r - 4, hy - 16], [cx + 30, hy - 10], [cx + 20, hy - 20], [cx + 8, hy - 8], [cx - 4, hy - 18], [cx - 14, hy - 2], [cx - 14, hy + 18], [cx - 18, hy + 32]]));
  // the clip
  { const bx = cx - r * .55, by = hy - r * .62;
    piece(g, o.clip, U(E(bx - 9, by - 7, 9, 6.5, -.9), E(bx + 3, by + 7, 9, 6.5, -.9)), .7); piece(g, o.clip, E(bx - 3, by, 5, 5), .9); }
  if (wear.head) headwear(g, wear.head, cx + 4, hy, r, true);
  // face: two dot eyes (the far one a little smaller), rosy cheeks, a small smile
  eyeAt(g, cx + 28, hy + 6, 5, eyes); eyeAt(g, cx + 8, hy + 6, 4.3, eyes);
  ink(g, 'rgba(240,120,140,.45)', E(cx + 36, hy + 20, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(cx + 2, hy + 20, 6, 4.5));
  smile(g, cx + 20, hy + 18, .35, Math.PI - .5);
}
/** the same girl seen walking towards us (back = false) or away from us (back = true) */
function kidFB(g, o, R, wear, eyes, back) {
  const { cx, sh, thigh, k } = R, hy = o.headY, r = o.head, legR = 8;
  const arms = col => { piece(g, col, C(...R.shL, ...R.handL, 6.5, 8)); piece(g, col, C(...R.shR, ...R.handR, 6.5, 8)); };
  if (!back && wear.back === 'vleugels') { wing(g, cx + 12, sh + 2, 1); wing(g, cx - 12, sh + 2, -1); }
  // seen from the front the ponytail peeks out beside her head; it swings as she walks
  if (!back) piece(g, o.hair2, S([[cx - r * .3, hy - r * .9], [cx - r - 10 + k, hy - r * .7], [cx - r - 20 + k, hy - r * .2], [cx - r - 18 + k, hy + o.pony * .5], [cx - r - 8 + k, hy + o.pony * .7], [cx - r - 6, hy - r * .1]]));
  // legs: the one that steps lifts its foot a little
  for (const [sx, l] of R.legs) {
    piece(g, back ? o.skin2 : o.skin, C(cx + sx, thigh, cx + sx, o.foot - 2 - l, legR));
    piece(g, back ? o.shoe2 : o.shoe, back ? E(cx + sx, o.foot + 1 - l, 10, 7) : R.big ? E(cx + sx, o.foot + 3 - l, 11.5, 10.5) : E(cx + sx, o.foot + 4 - l, 10.5, 8));
  }
  // arms at her sides, swinging forwards and back (seen as a little longer and shorter)
  if (!R.armsFront) arms(o.skin2);
  dress(g, o, cx, wear);
  if (!back) collar(g, o, cx);
  else piece(g, dress2(o, wear), U(E(cx - 6, o.neck + 16, 7, 4.5, .5), E(cx + 6, o.neck + 16, 7, 4.5, -.5)), .5);   // a little bow at the back of the dress
  if (!back && wear.neck === 'ketting') beads(g, [0, 1, 2, 3, 4, 5, 6].map(i => [cx + (i / 3 - 1) * 13, o.neck + 3 + Math.sin(i / 6 * Math.PI) * 15]));
  if (wear.hand === 'knuffel') { const h = back ? R.handL : R.handR; rabbit(g, h[0] + (back ? -1 : 1), h[1] + 3); }
  if (R.armsFront) arms(o.skin);
  if (back) {
    if (wear.back === 'vleugels') { wing(g, cx + 5, sh + 2, 1); wing(g, cx - 5, sh + 2, -1); piece(g, WING, E(cx, sh + 4, 7, 9), .6); }
    // the back of her head is all hair, the ponytail hangs down the middle
    piece(g, o.skin2, U(E(cx - r + 2, hy + 6, 7, 9), E(cx + r - 2, hy + 6, 7, 9)));   // ears
    piece(g, o.hair, E(cx, hy - 2, r + 2, r));
    ink(g, o.hair2, S([[cx - 3, hy - r + 4], [cx + 3, hy - r + 4], [cx + 2, hy - r * .55], [cx - 2, hy - r * .55]]));
    const by = hy - r * .6;
    piece(g, o.hair, S([[cx - 11, by + 2], [cx + 11, by + 2], [cx + 15 + k, by + o.pony * .5 + 14], [cx + 9 + k, by + o.pony + 22], [cx + k, by + o.pony + 28], [cx - 9 + k, by + o.pony + 20], [cx - 15 + k, by + o.pony * .5 + 14]]));
    ink(g, o.hair2, S([[cx - 3, by + 10], [cx + 3, by + 10], [cx + 3 + k, by + o.pony * .7 + 14], [cx - 3 + k, by + o.pony * .7 + 14]]));
    piece(g, o.clip, U(E(cx - 10, by, 9, 6.5, -.3), E(cx + 10, by, 9, 6.5, .3)), .7); piece(g, o.clip, E(cx, by + 1, 5, 5), .9);
    if (wear.head) headwear(g, wear.head, cx, hy, r, false);
    return;
  }
  // the face, straight on: hair behind at the sides, a fringe on top
  piece(g, o.hair2, E(cx, hy - 3, r + 4, r - 2));
  piece(g, o.skin, E(cx, hy, r, r - 1));
  piece(g, o.hair, S([[cx - r - 3, hy + 20], [cx - r - 6, hy - 10], [cx - r + 6, hy - r + 4], [cx - 14, hy - r - 6], [cx + 14, hy - r - 6], [cx + r - 6, hy - r + 4], [cx + r + 6, hy - 10], [cx + r + 3, hy + 20],
    [cx + r - 6, hy + 4], [cx + r - 10, hy - 12], [cx + 22, hy - 8], [cx + 12, hy - 18], [cx, hy - 9], [cx - 12, hy - 18], [cx - 22, hy - 8], [cx - r + 10, hy - 12], [cx - r + 6, hy + 4]]));
  piece(g, o.clip, U(E(cx - r * .62 - 8, hy - r * .78, 8, 6, -.6), E(cx - r * .62 + 4, hy - r * .9, 8, 6, -.6)), .7); piece(g, o.clip, E(cx - r * .62 - 2, hy - r * .84, 4.5, 4.5), .9);
  if (wear.head) headwear(g, wear.head, cx, hy, r, false);
  eyeAt(g, cx - 14, hy + 8, 5, eyes); eyeAt(g, cx + 14, hy + 8, 5, eyes);
  ink(g, 'rgba(240,120,140,.45)', E(cx - 25, hy + 20, 7.5, 5)); ink(g, 'rgba(240,120,140,.45)', E(cx + 25, hy + 20, 7.5, 5));
  smile(g, cx, hy + 17, .4, Math.PI - .4);
}

/* ---------- asleep in bed: her pillow and her blanket are part of her drawing ----------
   (Oscar: the blanket "should be more like its part of the character", and the 3D pillow swallowed her head.) She is drawn
   from the front and the card is laid on its side; 'bedL': the bed's mattress is to the drawing's left (the pillow lies
   there, under her head), 'bedR' the other way. Her blanket goes from her chin to past her toes. */
const QUILT = { anna: ['#EF9FB8', '#F8C6D6'], fenna: ['#EFCB58', '#F7E29A'] };
function pillow(g, o, cx, d) {
  const hy = o.headY, r = o.head, px = cx - d * r * .78;
  piece(g, '#FBF5EA', S([[px - r * .62, hy - r * 1.45], [px + r * .62, hy - r * 1.5], [px + r * .7, hy], [px + r * .62, hy + r * 1.5], [px - r * .62, hy + r * 1.45], [px - r * .7, hy]]), .5);
  line(g, 'rgba(120,100,90,.18)', 2, [[px - d * r * .3, hy - r * 1.1], [px - d * r * .42, hy], [px - d * r * .3, hy + r * 1.1]]);
}
function quilt(g, o, who, cx, d) {
  const [col, light] = QUILT[who] || QUILT.anna, y0 = o.headY + o.head * .72, y1 = o.foot + 10, hw = 50;
  // the edge away from the mattress is soft (a hump over her tummy and her knees), the side on the mattress straight
  const up = cx + d * hw, dn = cx - d * hw, mid = (a, k) => [cx + d * (hw + a), y0 + (y1 - y0) * k];
  const pts = [[dn, y0 - 2], [cx, y0 - 6], mid(-4, 0), mid(4, .3), mid(-2, .55), mid(3, .78), [up - d * 4, y1], [cx, y1 + 4], [dn, y1], [dn - d * 2, (y0 + y1) / 2]];
  piece(g, col, S(pts), 1.2);
  if (g.colour) {
    g.save(); g.beginPath(); S(pts)(g); g.clip();
    const sq = 22; for (let y = y0 - 10; y < y1 + 10; y += sq) for (let x = cx - 70; x < cx + 70; x += sq) if (Math.round((x - cx + 70 + y - y0 + 10) / sq) % 2 === 0) { g.fillStyle = light; g.fillRect(x, y, sq, sq); }
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.4; g.setLineDash([4, 3.5]);
    for (let y = y0 - 10 + sq; y < y1; y += sq) { g.beginPath(); g.moveTo(cx - 70, y); g.lineTo(cx + 70, y); g.stroke(); }
    for (let x = cx - 70 + sq; x < cx + 70; x += sq) { g.beginPath(); g.moveTo(x, y0 - 10); g.lineTo(x, y1 + 10); g.stroke(); }
    g.restore();
  }
  // the folded-back white hem under her chin
  piece(g, '#FBF7EE', S([[dn, y0 - 3], [cx, y0 - 7], [up - d * 2, y0 - 3], [up - d * 2, y0 + 9], [cx, y0 + 6], [dn, y0 + 9]]), .6);
}

/** draw a sister: who 'anna' | 'fenna'; f is the walk drawing (1..WALK) when pose is 'walk' */
export function drawKid(g, who, { view = 'side', pose = 'stand', f = 0, wear = NONE, eyes = 'open' } = {}) {
  const bed = pose === 'bedL' ? 1 : pose === 'bedR' ? -1 : 0;
  if (bed) { const o = KID[who], R = rig(o, 'front', 'stand', 0); pillow(g, o, R.cx, bed); kidFB(g, o, R, wear || NONE, eyes, false); quilt(g, o, who, R.cx, bed); return; }
  const o = KID[who], R = rig(o, view, pose, f);
  if (view === 'side') kidSide(g, o, R, wear || NONE, eyes); else kidFB(g, o, R, wear || NONE, eyes, view === 'back');
}
/** the old way in: frame 0 stands, frames 1..WALK walk */
export const kidDraw = (who, view) => (g, f) => drawKid(g, who, { view, pose: f ? 'walk' : 'stand', f });

/** the balloon she holds is its own card on a thread (it floats above her, too far up to fit on her card): 80 x 100 */
export function drawBalloon(g) {
  piece(g, RED, U(E(40, 44, 30, 36), P([[34, 80], [46, 80], [40, 72]])));
  ink(g, 'rgba(255,255,255,.55)', E(28, 30, 6, 10, .5)); ink(g, RED2, E(40, 79, 4, 2.2));
}
export const BALLOON = { w: 80, h: 100, size: .42, knot: [40, 84] };
