// A test of a richer character style (only with ?hd2): drawn natively at twice the pixels, so the world shows them
// at the same size as the old ones (charGeom halves an HD canvas). What is automated: colour ramps that shift hue
// (shadows towards violet, light towards warm yellow) and a selective outline (a darker shade of the colour it borders,
// softer on the lit top-left). What is drawn by hand: every light, base and shade pixel in the grids below.
import * as PX from './pixel.js';

const OUT = '#2B1E3A';
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

/* ---------- colour ---------- */
function toHsl(hex) {
  let [r, g, b] = PX.rgb(hex).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l];
}
function toHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
const toward = (h, t, amt) => { let d = ((t - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), amt); };
/** five tones of one colour: [deep, shade, base, light, highlight]; greys and whites get a lavender shadow */
export function ramp(hex) {
  const [h0, s0, l] = toHsl(hex), grey = s0 < .08, h = grey ? 265 : h0, s = grey ? .35 : s0;
  return [
    toHex(toward(h, 262, 26), s * .78, l * .62 - .04),
    toHex(toward(h, 262, 13), s * .88, l * .84),
    hex,
    toHex(toward(h, 52, 7), s * .95, l + (1 - l) * .35),
    toHex(toward(h, 52, 14), s * .85, l + (1 - l) * .7),
  ];
}

/* ---------- rendering ---------- */
/** rows of letters -> canvas with a 1px selective outline. pal: letter -> hex */
function draw(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2, grid = new Array(w * h).fill(null);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r[x]; if (c === '.' || c === ' ') continue; if (pal[c] === undefined) throw new Error('hd2: no colour for ' + c); grid[(y + 1) * w + x + 1] = pal[c]; } });
  const out = grid.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (grid[y * w + x]) continue;
    // the neighbours inside the sprite: below/right of the pixel means this is a top/left (lit) edge
    const lit = [], dark = [];
    if (x + 1 < w && grid[y * w + x + 1]) lit.push(grid[y * w + x + 1]);
    if (y + 1 < h && grid[(y + 1) * w + x]) lit.push(grid[(y + 1) * w + x]);
    if (x > 0 && grid[y * w + x - 1]) dark.push(grid[y * w + x - 1]);
    if (y > 0 && grid[(y - 1) * w + x]) dark.push(grid[(y - 1) * w + x]);
    if (!lit.length && !dark.length) continue;
    const src = (dark.length ? dark : lit).map(c => [c, toHsl(c)[2]]).sort((a, b) => a[1] - b[1])[0][0];
    out[y * w + x] = PX.mix(ramp(src)[0], OUT, dark.length ? .8 : .6);
  }
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  out.forEach((c, i) => { if (!c) return; const [r, g, b] = PX.rgb(c); img.data.set([r, g, b, 255], i * 4); });
  ctx.putImageData(img, 0, 0); cv.isHD = true; return cv;
}
/** letters for one ramp: e.g. tones('jhHA1', '#E8B95A') -> {j: deep, h: shade, H: base, A: light, 1: highlight} */
const tones = (letters, hex) => { const r = ramp(hex), o = {}; [...letters].forEach((L, i) => { if (L !== '_') o[L] = r[i]; }); return o; };

/* ---------- Anna (front view, 26 x 32, the body's middle between columns 11 and 12) ---------- */
const ANNA_HEAD = [
  '........AAAHHHHh..........',
  '.....AAAAHHHHHHHHhh.......',
  '...AAA11AHHHHHHHHHHhh.....',
  '..AA1111AHHHHHHHHHHhhhyY..',
  '.AAA11AHHHHHHHHHHHHHHhjyYh',
  '.AAAAHHHHHHHHHHHHHHHHhhjhh',
  '.AAHHHHHHhHHHHhHHHHHHhjHhh',
  '.AHHHttHHHttttHHHttHHhjHh.',
  '.AHHtssthtssssthtssthhjHh.',
  '.AHssskksssssssskkssthjHh.',
  '.AHssswksssssssswkssthjHh.',
  '.AHssskksssssssskkssthjHh.',
  '.Hhsssikssssssssikssthjjh.',
  '.Hhsccssssmssmssssccthjj..',
  '..jtsssssssmmssssssstj....',
  '.....jttssssssssttj.......',
];
const ANNA_BODY = [
  '..........uttu............',
  '.......ooOoyyoOOo.........',
  '.....DDDdddyyddddeE.......',
  '...DDDDdddddddddddeeE.....',
  '...SseDddddddddddeEtt.....',
  '...SseDddddddddddeEtt.....',
  '...SseDddddddddddeEtt.....',
  '...stEDddddddddddeEtu.....',
  '...DDDddddddddddddeeE.....',
  '..DDDdddddddddddddeeEE....',
  '..EeeEeeEeeEeeEeeEeeEe....',
];
const ANNA_LEGS = {
  idle: ['........ttt..ttt..........', '........sst..sst..........', '........ooO..ooO..........', '.......Pppq..Pppq.........', '.......pqqq..pqqq.........'],
  w1: ['........ttt..ttt..........', '........ooO..sst..........', '.......Pppq..ooO..........', '.......pqqq..Pppq.........', '.............pqqq.........'],
  w2: ['........ttt..ttt..........', '........sst..ooO..........', '........ooO..Pppq.........', '.......Pppq..pqqq.........', '.......pqqq...............'],
  jump: ['.......ttt....ttt.........', '......ooO......ooO........', '.....Pppq......Pppq.......', '.....pqqq......pqqq.......', '..........................'],
};
const ANNA_PAL = Object.assign(
  tones('__HA1', '#E8B95A'), { h: PX.mix('#E8B95A', '#9C7C78', .42), j: PX.mix('#E8B95A', '#5E4058', .6) }, tones('utsS', '#FFD7BE'), tones('EedD', '#FF7EB6'), tones('_Oo', '#FFFFFF'), tones('_Yy', '#FF5E9C'), tones('_qpP', '#4DABF7'),
  { k: '#3A2448', i: '#7A5AA8', w: '#FFFFFF', c: '#FF9FB8', m: '#C2456E' });

export function anna(frame = 'idle', blink = false) {
  return cached('anna|' + frame + blink, () => {
    let head = ANNA_HEAD;
    if (blink) head = head.map((r, i) => i >= 9 && i <= 12 && i !== 11 ? r.replace(/[wki]/g, 's') : r);
    return draw([...head, ...ANNA_BODY, ...(ANNA_LEGS[frame] || ANNA_LEGS.idle)], ANNA_PAL);
  });
}

/* ---------- the little unicorn (side view facing right, 38 x 32) ---------- */
const FOAL_TOP = [
  '.............................1........',
  '............................1h........',
  '...........................j1h........',
  '........................L..hhj........',
  '.......................LeLj1h.........',
  '......................rLeLbhhj........',
  '.....................rrrLLLLLLbb......',
  '....................rroLLLLLLLLbbb....',
  '...................rrooLLLLbbbbbbbb...',
  '...................rooyLLbbbbbwkkbbb..',
  '..................rooyyLbbbbbbkkkbbbn.',
  '..................ooyyyLbbbbbbikkbbnnn',
  '..................oyyggbbbbbbbbbbbnnNn',
  '.................ooyyggbbbbbbbbbbnnnnn',
  '.................oyyggcbbbbbbpppbbnnnn',
  '.................yyggccbbbbbbbbbbvnmn.',
  '..o..............yggccxbbbbbbbbvvnnn..',
  '.oor.............gggcxxbbbbbbbbvv.....',
  'ooyrr.....LLLLLLLLgccxxbbbbbbbvv......',
  'oyyrr...LLLLLLLLLLLcxxbbbbbbbbv.......',
  'yygg..LLLLLLLLLLLLLLxbbbbbbbbbv.......',
  'ygg..LLLbbbbbbbbbbbbbbbbbbbbbbv.......',
  'gcc..Lbbbbbbbbbbbbbbbbbbbbbbbbv.......',
  'ccx..bbbbbbbbbbbbbbbbbbbbbbbbbv.......',
  '.cx..bbbbbbbbbbbbbbbbbbbbbbbbvv.......',
  '.xx..vbbbbbbbbbbbbbbbbbbbbbbbvV.......',
  '..x...vvvvvbbbbbbbbbbbbbbvvvvV........',
];
const FOAL_LEGS = {
  idle: ['......vVVbbv......vVVbbv.......', '......vVVbbv......vVVbbv.......', '......vVVbbv......vVVbbv.......', '......FFFffF......FFFffF.......', '......FFFffF......FFFffF.......'],
  w1: ['.......vVbbv........vVbbv......', '........vVbbv........vVbbv.....', '........vVbbv........vVbbv.....', '........FFfffF.......FFfffF....', '........FFfffF.......FFfffF....'],
  w2: ['.....vVv..bbv.....vVv..bbv.....', '....vVv....bbv...vVv....bbv....', '....vVv....bbv...vVv....bbv....', '....FFF....fff...FFF....fff....', '....FFF....fff...FFF....fff....'],
};
function foalPal(u) {
  const rb = u.mane === 'rainbow', m1 = rb ? null : u.mane, m2 = rb ? null : PX.mix(u.mane, '#ffffff', .35);
  const strand = rb ? PX.RAINBOW : [m1, m2, m1, m2, m1, m2];
  const hornRb = u.horn === 'rainbow', horn = hornRb ? '#FF9EC7' : u.horn;
  const body = ramp(u.body), mane = {};
  'roygcx'.split('').forEach((L, i) => { mane[L] = strand[i]; });
  return Object.assign(mane, {
    V: body[0], v: body[1], b: body[2], L: body[3],
    n: PX.mix(u.body, '#FFC2D6', .45), N: ramp(PX.mix(u.body, '#FFC2D6', .45))[0], m: '#C2456E', e: '#FFB3CC',
    k: '#3A2448', i: '#7A5AA8', w: '#FFFFFF', p: '#FF9FB8',
    j: ramp(horn)[1], h: horn, 1: ramp(horn)[4],
    f: ramp(PX.mix(u.body, '#6d5585', .45))[2], F: ramp(PX.mix(u.body, '#6d5585', .45))[1],
  });
}
export function foal(u, frame = 'idle', sleep = false) {
  return cached(['foal', u.body, u.mane, u.horn, frame, sleep].join('|'), () => {
    let top = FOAL_TOP;
    if (sleep) top = top.map((r, i) => i >= 9 && i <= 11 ? r.replace(/[wki]/g, (c, x) => i === 11 ? 'k' : 'b').replace(/k(?=b*n)/g, 'k') : r);
    return draw([...top, ...(FOAL_LEGS[frame] || FOAL_LEGS.idle)], foalPal(u));
  });
}
export const annaFrames = () => ({ idle: anna('idle'), w1: anna('w1'), w2: anna('w2'), blink: anna('idle', true), jump: anna('jump') });
export const foalFrames = u => ({ idle: foal(u, 'idle'), w1: foal(u, 'w1'), w2: foal(u, 'w2'), blink: foal(u, 'idle', true) });
