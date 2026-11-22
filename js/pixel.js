// Pixel-art sprite library. Sprites are authored as rows of palette letters (fills only);
// a 1px dark outline is added automatically. Everything returns a <canvas>.
export const OUT = '#2B1E3A';
export const RAINBOW = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA'];

export function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const cache = new Map();

function toCanvas(grid, W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(W, H);
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i]; if (!c) continue;
    const [r, g, b] = rgb(c); img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return cv;
}
function addOutline(grid, W, H, col) {
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (grid[i]) continue;
    if ((x > 0 && grid[i - 1]) || (x < W - 1 && grid[i + 1]) || (y > 0 && grid[i - W]) || (y < H - 1 && grid[i + W])) add.push(i);
  }
  for (const i of add) grid[i] = col;
}

/** rows: array of strings; pal: {letter: '#hex'}; '.' or ' ' = transparent */
export function sprite(rows, pal, opt = {}) {
  const key = opt.key; if (key && cache.has(key)) return cache.get(key);
  const pad = opt.outline === false ? 0 : 1;
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const W = w + pad * 2, H = h + pad * 2; const grid = new Array(W * H).fill(null);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r[x]; if (c === '.' || c === ' ') continue; const col = pal[c]; if (col === undefined) throw new Error('missing palette ' + c); grid[(y + pad) * W + x + pad] = col; } });
  if (pad) addOutline(grid, W, H, opt.outline || OUT);
  const cv = toCanvas(grid, W, H); if (key) cache.set(key, cv); return cv;
}
/** procedural: fn(x,y) -> '#hex' | null */
export function gridSprite(w, h, fn, opt = {}) {
  const key = opt.key; if (key && cache.has(key)) return cache.get(key);
  const pad = opt.outline === false ? 0 : 1; const W = w + pad * 2, H = h + pad * 2; const grid = new Array(W * H).fill(null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) grid[(y + pad) * W + x + pad] = c; }
  if (pad) addOutline(grid, W, H, opt.outline || OUT);
  const cv = toCanvas(grid, W, H); if (key) cache.set(key, cv); return cv;
}
export function flipX(cv) { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); return c; }
/** a DOM canvas copy shown at an integer scale with crisp pixels */
export function domSprite(cv, scale = 3) {
  const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0);
  c.style.width = cv.width * scale + 'px'; c.style.height = cv.height * scale + 'px'; c.style.imageRendering = 'pixelated'; c.className = 'px';
  return c;
}
/** draw a sprite canvas into a 2D context at integer scale, anchored bottom-centre at (x,y) */
export function drawSprite(ctx, cv, x, y, scale = 1, flip = false) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const w = cv.width * scale, h = cv.height * scale;
  if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(cv, Math.round(-w / 2), Math.round(y - h), w, h); }
  else ctx.drawImage(cv, Math.round(x - w / 2), Math.round(y - h), w, h);
  ctx.restore();
}

/* ---------------- characters ---------------- */
const SKIN = '#FFD7BE', EYE = '#2B1E3A', CHEEK = '#FF8FB1', MOUTH = '#C2456E';
export const KIDS = {
  anna: { hair: '#E8B95A', dress: '#FF7EB6', dress2: '#E0559A', shoe: '#4DABF7', clip: '#FF5E9C' },   // the little one, blond
  fenna: { hair: '#7A4A2A', dress: '#9B72E8', dress2: '#7653C4', shoe: '#FF5E9C', clip: '#FFD166' },  // her big sister
};
const FENNA_TOP = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '.hhhhhhhhhhhh.',
  '.hhhhhhhhhhyh.',
  '.hhsssssssshh.',
  '.hssksssskssh.',
  '.hssksssskssh.',
  '.hscsssssscsh.',
  '.hssssmmssssh.',
  '.hh.ssssss.hh.',
  '.hh..dddd..hh.',
  '.hh.dddddd.hh.',
  '..s.ddyydd.s..',
  '..s.dddddd.s..',
  '...dddddddd...',
  '..DddddddddD..',
];
const FENNA_LEGS = {
  idle: ['....ss..ss....', '....ss..ss....', '....pp..pp....'],
  w1: ['....ss..ss....', '....pp..ss....', '........pp....'],
  w2: ['....ss..ss....', '....ss..pp....', '....pp........'],
  jump: ['...ss....ss...', '..pp......pp..', '..............'],
};
const ANNA_TOP = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  'yhhhhhhhhhhy',
  'hhhhhhhhhhhh',
  'hhsskssksshh',
  'hhsskssksshh',
  '.hcssssssch.',
  '..sssmmsss..',
  '...ssssss...',
  '...dddddd...',
  '..sddyydds..',
  '.sdddddddds.',
  '.DddddddddD.',
];
const ANNA_LEGS = {
  idle: ['...ss..ss...', '...pp..pp...'],
  w1: ['...pp..ss...', '.......pp...'],
  w2: ['...ss..pp...', '...pp.......'],
  jump: ['..pp....pp..', '............'],
};
function kidPal(k) { return { h: k.hair, y: k.clip, s: SKIN, k: EYE, c: CHEEK, m: MOUTH, d: k.dress, D: k.dress2, p: k.shoe }; }
export function anna(frame = 'idle', blink = false) {
  const top = blink ? ANNA_TOP.map((r, i) => i === 4 ? r.replace(/k/g, 's') : r) : ANNA_TOP;
  return sprite([...top, ...ANNA_LEGS[frame]], kidPal(KIDS.anna), { key: 'anna' + frame + blink });
}
export function fenna(frame = 'idle', blink = false) {
  const top = blink ? FENNA_TOP.map((r, i) => i === 6 ? r.replace(/k/g, 's') : r) : FENNA_TOP;
  return sprite([...top, ...FENNA_LEGS[frame]], kidPal(KIDS.fenna), { key: 'fenna' + frame + blink });
}

/* ---- what the girls can wear (bought at the stall, see quest.js SHOP) ---- */
const KID_ROWS = {
  anna: { top: ANNA_TOP, legs: ANNA_LEGS, eyes: 4, band: 1, neck: 9, dress: [9, 12], hand: 10 },
  fenna: { top: FENNA_TOP, legs: FENNA_LEGS, eyes: 6, band: 2, neck: 11, dress: [11, 16], hand: 13 },
};
const WEAR_PAL = { F: '#FF7EB6', G: '#FFD43B', W: '#FFFFFF', L: '#5DC88A', R: '#E8484A', r: '#B5303A', M: '#E8484A', w: '#FFFFFF', Y: '#FFD43B', g: '#4DABF7', P: '#FFB3CC', v: '#D9CCFF', V: '#FFFFFF', b: '#FFFFFF', n: '#FF8FB1',
  1: RAINBOW[0], 2: RAINBOW[1], 3: RAINBOW[2], 4: RAINBOW[3], 5: RAINBOW[4], 6: RAINBOW[5] };
const DRESS = { jurkgeel: ['#FFD43B', '#E0A020'], jurkblauw: ['#6CC6F0', '#3E9AD6'] };
const put = (row, at, str) => { const a = row.split(''); for (let i = 0; i < str.length; i++) if (str[i] !== ' ' && at + i >= 0 && at + i < a.length) a[at + i] = str[i]; return a.join(''); };
/** a girl with what she has on: wear = {head, neck, dress, back, hand}. The balloon is not part of the sprite (it floats). */
export function kidSprite(who, frame = 'idle', blink = false, wear = {}) {
  const K = KID_ROWS[who] || KID_ROWS.anna, w = K.top[0].length, mid = w / 2, pal = Object.assign({}, WEAR_PAL, kidPal(KIDS[who] || KIDS.anna));
  const sig = ['head', 'neck', 'dress', 'back', 'hand'].map(k => wear[k] || '').join(','), key = 'kid' + who + frame + blink + sig;
  let rows = K.top.map((r, i) => blink && i === K.eyes ? r.replace(/k/g, 's') : r).concat(K.legs[frame] || K.legs.idle), up = [];
  if (DRESS[wear.dress]) { pal.d = DRESS[wear.dress][0]; pal.D = DRESS[wear.dress][1]; }
  if (wear.dress === 'jurkregenboog') for (let i = K.dress[0]; i <= K.dress[1]; i++) rows[i] = rows[i].replace(/[dD]/g, String(1 + (i - K.dress[0]) % 6));
  if (wear.neck === 'ketting') { let n = 0; rows[K.neck] = rows[K.neck].replace(/d|[1-6]/g, () => n++ % 2 ? 'P' : 'W'); }
  if (wear.head === 'krans') { let n = 0; rows[K.band] = rows[K.band].replace(/h/g, () => 'FLGLWL'[n++ % 6]); }
  if (wear.head === 'strik') { up = [put('.'.repeat(w), mid - 3, 'RR  RR')]; rows[0] = put(rows[0], mid - 3, 'RRrrRR'); }
  if (wear.head === 'kroon') { up = [put('.'.repeat(w), mid - 4, 'Y  YY  Y'), put('.'.repeat(w), mid - 4, 'YYYggYYY')]; }
  if (wear.head === 'hoed') { up = [put('.'.repeat(w), 3, 'M'.repeat(w - 6)), put('.'.repeat(w), 2, 'MMw' + 'M'.repeat(w - 9) + 'wM')]; rows[0] = put(rows[0], 1, 'MMMM' + 'M'.repeat(w - 9) + 'wMMM'); rows[1] = 'MwM' + 'M'.repeat(w - 6) + 'MMM'; }
  rows = up.concat(rows); const off = up.length;
  if (wear.back === 'vleugels' || wear.hand === 'knuffel') {
    rows = rows.map(r => '....' + r + '....');
    if (wear.back === 'vleugels') ['vVV', 'vVV', 'vV', 'v'].forEach((wing, k) => { const i = off + K.neck - 1 + k, r = rows[i], a = r.search(/[^.]/), b = r.length - 1 - r.split('').reverse().join('').search(/[^.]/); rows[i] = put(put(r, a - wing.length, wing), b + 1, wing.split('').reverse().join('')); });
    if (wear.hand === 'knuffel') { const i = off + K.hand, r = rows[i], b = r.length - 1 - r.split('').reverse().join('').search(/[^.]/); ['b b', 'bbb', 'bnb', 'bbb'].forEach((t, k) => { rows[i - 2 + k] = put(rows[i - 2 + k], b + 1, t); }); }
  }
  return sprite(rows, pal, { key });
}

/* unicorn (side view, facing right) */
const UNI_TOP = [
  '....................h.....',
  '...................hH.....',
  '................b.hH......',
  '..............rrbbhhbb....',
  '.............rrbbbbbbbbb..',
  '............oorbbbbbbkbbb.',
  '............oobbbbbbbkbbnn',
  '...........yyobbbbbbpbnnnn',
  '...........yyBbbbbbbbnnnkn',
  '..........gyyBbbbbbbbnnnn.',
  '..........ggBbbbbb........',
  '..r.......ccBbbbbb........',
  '.rr..bbbbbbcbbbbbbb.......',
  '.ro.bbbbbbbbbbbbbbbb......',
  '.oyybbbbbbbbbbbbbbbbb.....',
  '..yybbbbbbbbbbbbbbbbb.....',
  '...gBBBBBBBBBBBBBBBBB.....',
];
const UNI_LEGS = {
  idle: ['.....BB..bb....BB..bb.....', '.....BB..bb....BB..bb.....', '.....ff..ff....ff..ff.....'],
  w1: ['......BBbb......BBbb......', '......BBbb......BBbb......', '......ffff......ffff......'],
  w2: ['....BB....bb..BB....bb....', '....BB....bb..BB....bb....', '....ff....ff..ff....ff....'],
};
export const UNI_BODY = [['Wit', '#FFFFFF'], ['Roze', '#FFC8DD'], ['Lila', '#DCCBFA'], ['Lichtblauw', '#BFE3FF'], ['Geel', '#FFF0A6'], ['Mintgroen', '#C6F1DB']];
export const UNI_MANE = [['Regenboog', 'rainbow'], ['Roze', '#FF7EB6'], ['Paars', '#9B72E8'], ['Blauw', '#4FA3F7'], ['Goud', '#F5B83D']];
export const UNI_HORN = [['Goud', '#F7C548'], ['Zilver', '#D3DAE6'], ['Roze', '#FF9EC7'], ['Regenboog', 'rainbow']];
export function uniPalette(u) {
  const b = u.body, rb = u.mane === 'rainbow';
  const m1 = rb ? null : u.mane, m2 = rb ? null : mix(u.mane, '#ffffff', .35);
  const hornRb = u.horn === 'rainbow';
  return {
    b, B: mix(b, '#8a6fa0', .25), n: mix(b, '#FFD3E2', .5), k: EYE, p: CHEEK, f: mix(b, '#6d5585', .55),
    h: hornRb ? '#FF9EC7' : u.horn, H: hornRb ? '#8FD3FF' : mix(u.horn, '#7a5a20', .3),
    r: rb ? RAINBOW[0] : m1, o: rb ? RAINBOW[1] : m2, y: rb ? RAINBOW[2] : m1, g: rb ? RAINBOW[3] : m2, c: rb ? RAINBOW[4] : m1,
  };
}
/** u = {body,mane,horn}; frame idle|w1|w2; sleep closes the eye */
export function unicorn(u, frame = 'idle', sleep = false) {
  let top = UNI_TOP;
  if (sleep) top = top.map((r, i) => i === 5 ? r.replace('k', 'b') : (i === 6 ? r.replace('k', 'B') : r));
  return sprite([...top, ...UNI_LEGS[frame]], uniPalette(u), { key: 'uni' + u.body + u.mane + u.horn + frame + sleep });
}

/* ---------------- animals ---------------- */
export function bunny() {
  return sprite([
    '.w.....w.', '.wp...pw.', '.wp...pw.', '.ww...ww.', '..wwwww..', '.wwwwwww.', '.wkwwwkw.', '.wcwnwcw.', '..wwwww..', '.wwwwwww.', '.wwwwwww.', '..ww.ww..',
  ], { w: '#FFFFFF', p: '#FFB3CC', k: EYE, c: CHEEK, n: '#FF7EB6' }, { key: 'bunny' });
}
export function cat(color = '#C9C3D6') {
  return sprite([
    'g.......g', 'gg.....gg', 'gpgggggpg', 'ggggggggg', 'ggkgggkgg', 'ggkgngkgg', 'gcgggggcg', '.ggggggg.', '.ggwwwgg.', '.ggwwwgg.', '.gg...gg.',
  ], { g: color, p: '#FFB3CC', k: EYE, n: '#FF7EB6', c: CHEEK, w: '#FFFFFF' }, { key: 'cat' + color });
}
export function puppy() {
  return sprite([
    '...ttttt...', '.EtttttttE.', 'EEtktttktEE', 'EEtktttktEE', 'EEtwwkwwtEE', '..ttwpwtt..', '...rrrrr...', '..ttttttt..', '..ttttttt..', '..tt...tt..',
  ], { t: '#E3A96E', E: '#8B5A3C', k: EYE, w: '#FFE8CC', p: '#FF7EB6', r: '#FF5E9C' }, { key: 'puppy' });
}
export function hedgehog() {
  return sprite([
    '..B.B.B.....', '.BBBBBBB....', 'BBKBBKBBff..', 'BBBBBBBffff.', 'BKBBKBfkfffn', 'BBBBBBfffff.', '.ffffffff...', '.f.f..f.f...',
  ], { B: '#8B5E3C', K: '#5E3B22', f: '#F2D2A9', k: EYE, n: EYE }, { key: 'hedgehog' });
}
export function duck() {
  return sprite([
    '.....yyy.', '....yyky.', '....yyyoo', '.....yy..', 'yyyyyyy..', '.yyyyyyy.', '..yyyyy..',
  ], { y: '#FFD43B', k: EYE, o: '#FF8C42' }, { key: 'duck' });
}

/* ---------------- items / stickers ---------------- */
export function star() {
  return sprite(['....y....', '...yYy...', '...yYy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '..yyoyy..', '.yyo.oyy.', '.yo...oy.'],
    { y: '#FFD43B', Y: '#FFF3A8', o: '#F2A93B' }, { key: 'star' });
}
export function heart(col = '#FF5E9C') {
  return sprite(['.rr...rr.', 'rWrr.rrrr', 'rWrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'],
    { r: col, W: mix(col, '#ffffff', .7) }, { key: 'heart' + col });
}
export function apple() {
  return sprite(['....bgg..', '....b....', '.rrrrrrr.', 'rWrrrrrrr', 'rWrrrrrrr', 'rrrrrrrRr', 'rrrrrrRRr', '.rrrrRRr.', '..rr.rr..'],
    { r: '#E8484A', R: '#B8323A', W: '#FF9A9A', b: '#7A5236', g: '#4DB37C' }, { key: 'apple' });
}
export function carrot() {
  return sprite(['g..g..g', '.g.g.g.', '..ggg..', 'ooooooo', 'oLooooo', '.ooooo.', '.oLooo.', '..ooo..', '..ooo..', '...o...', '...o...'],
    { g: '#4DB37C', o: '#FF8C42', L: '#FFB47A' }, { key: 'carrot' });
}
export function flower(col = '#FF7EB6') {
  return sprite(['..ppp..', '.ppppp.', 'pppyppp', '.ppppp.', '..ppp..', '...g...', '.g.g...', '..ggg..', '...g...'],
    { p: col, y: '#FFD43B', g: '#4DB37C' }, { key: 'flower' + col });
}
export function mushroom() {
  return sprite(['..RRRRR..', '.RwRRRwR.', 'RRRRwRRRR', 'RwRRRRRwR', 'RRRRRRRRR', '..sssss..', '..skssk..', '..sssss..', '...sss...'],
    { R: '#E8484A', w: '#FFFFFF', s: '#FFF1DC', k: EYE }, { key: 'mushroom' });
}
export function crown() {
  return sprite(['y...y...y', 'yy.yyy.yy', 'yyyyyyyyy', 'yYyryybyy', 'yyyyyyyyy', 'YYYYYYYYY'],
    { y: '#FFD43B', Y: '#F2A93B', r: '#FF5E9C', b: '#4DABF7' }, { key: 'crown' });
}
export function balloon(col = '#FF6B6B') {
  return sprite(['..rrr..', '.rrrrr.', 'rWrrrrr', 'rWrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...', '...l...', '....l..', '...l...', '....l..'],
    { r: col, W: mix(col, '#ffffff', .6), l: '#C9C3D6' }, { key: 'balloon' + col });
}
export function icecream() {
  return sprite(['...r...', '..ppp..', '.pWppp.', '.ppppp.', 'mmmmmmm', 'mWmmmmm', '.mmmmm.', '.ccccc.', '..ccc..', '..ccc..', '...c...'],
    { r: '#E8484A', p: '#FFB3CC', W: '#FFFFFF', m: '#A8E6CF', c: '#E8B061' }, { key: 'icecream' });
}
export function cake() {
  return sprite(['.....f.....', '.....c.....', '.wwwwwwwww.', 'wwwwwwwwwww', 'ppwppwppwpp', 'ppppppppppp', 'pyppbpppgpp', 'ppppppppppp', '.PPPPPPPPP.'],
    { f: '#FFA94D', c: '#9775FA', w: '#FFFFFF', p: '#FFB3CC', P: '#E58FB0', y: '#FFD43B', b: '#4DABF7', g: '#69DB7C' }, { key: 'cake' });
}
export function butterfly() {
  return sprite(['.vv.....vv.', 'vVvv.k.vvVv', 'vvvvvkvvvvv', '.vvvvkvvvv.', '..ppvkvpp..', '.pppvkvppp.', '.ppp.k.ppp.', '..p.....p..'],
    { v: '#9775FA', V: '#D9CCFF', p: '#FF7EB6', k: EYE }, { key: 'butterfly' });
}
export function gem() {
  return sprite(['..WWccc..', '.WWccccC.', 'ccccccCCC', '.ccccCCC.', '..ccCCC..', '...cCC...', '....C....'],
    { W: '#E6FBFF', c: '#66D9E8', C: '#2F9FB8' }, { key: 'gem' });
}
export function moon() {
  return sprite(['..yyyy..', '.yyy....', 'yyy.....', 'yyy.....', 'yyy.....', 'yyy.....', '.yyy....', '..yyyy..'],
    { y: '#FFE38A' }, { key: 'moon' });
}
export function rainbow() {
  return gridSprite(15, 8, (x, y) => {
    const d = Math.hypot(x + .5 - 7.5, y + .5 - 8.5); if (d > 7.5 || d < 1.5) return null;
    return RAINBOW[Math.min(5, Math.floor(7.5 - d))];
  }, { key: 'rainbow' });
}
export function lantern() {
  return sprite(['.KKK.', 'KyyyK', 'KyYyK', 'KyyyK', '.KKK.', '..P..', '..P..', '..P..', '..P..', '..P..', '..P..', '.PPP.'],
    { K: '#3D2B4F', y: '#FFD98A', Y: '#FFF6D0', P: '#5E4A3A' }, { key: 'lantern' });
}
export function tuft(seed = 0) {
  const v = [['G.g.G', 'GgGgG'], ['.G.g.', 'gGgGg'], ['g...G', 'GgGgg']][seed % 3];
  return sprite(v, { g: '#4E9A51', G: '#7BC86C' }, { key: 'tuft' + seed, outline: false });
}
export function smallFlower(col) {
  return sprite(['.p.', 'pyp', '.p.', '.g.'], { p: col, y: '#FFF3A8', g: '#4E9A51' }, { key: 'sf' + col });
}
export function ring() {
  return gridSprite(14, 7, (x, y) => { const d = Math.hypot((x + .5 - 7) / 7, (y + .5 - 3.5) / 3.5); return d <= 1 && d > .62 ? '#FFFFFF' : null; }, { key: 'ring', outline: false });
}
export function sparkle(col = '#FFF6D0') {
  return sprite(['..y..', '..y..', 'yyYyy', '..y..', '..y..'], { y: col, Y: '#FFFFFF' }, { key: 'spk' + col, outline: false });
}

/* ---------------- trees ---------------- */
export function treeRound(seed = 1) {
  return gridSprite(24, 30, (() => {
    const r = rng(seed * 7919 + 3);
    const blobs = [[12, 9, 8.5], [6.5, 13, 6], [17.5, 13, 6], [12, 15, 7], [8, 6, 4.5], [16, 6.5, 4.5]];
    const noise = []; for (let i = 0; i < 24 * 30; i++) noise.push(r());
    return (x, y) => {
      const inC = blobs.some(([cx, cy, rr]) => (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= rr * rr);
      if (inC) {
        const v = (x - 7) * .55 + (y - 4) + noise[y * 24 + x] * 3; const d = (x + y) & 1;
        if (v < 2 + d) return '#B5EA8C'; if (v < 8 + d) return '#7CCB64'; if (v < 14 + d) return '#5AAE58'; return '#3F8A4A';
      }
      if (x >= 10 && x <= 13 && y >= 16) return x === 10 ? '#A97450' : (y < 19 ? '#5E3A24' : (x === 13 ? '#6E4630' : '#8A5A3B'));
      return null;
    };
  })(), { key: 'tree' + seed });
}
export function pine(seed = 1) {
  return gridSprite(18, 30, (() => {
    const r = rng(seed * 104729 + 11); const noise = []; for (let i = 0; i < 18 * 30; i++) noise.push(r());
    const tiers = [[0, 9, 1, .62], [6, 16, 2.4, .7], [13, 24, 3.4, .72]];
    return (x, y) => {
      let inside = false;
      for (const [y0, y1, w0, k] of tiers) if (y >= y0 && y < y1) { const hw = w0 + (y - y0) * k; if (Math.abs(x + .5 - 9) <= hw) inside = true; }
      if (inside) { const v = (x - 5) * .7 + (y % 9) * .6 + noise[y * 18 + x] * 2.5; const d = (x + y) & 1; if (v < 2 + d) return '#6FBF7A'; if (v < 7 + d) return '#4E9E64'; if (v < 11 + d) return '#3B8456'; return '#2E6B48'; }
      if (y >= 24 && x >= 8 && x <= 9) return x === 8 ? '#A97450' : '#7A4E33';
      return null;
    };
  })(), { key: 'pine' + seed });
}
export function bush(seed = 1) {
  return gridSprite(16, 10, (() => {
    const r = rng(seed * 31 + 5); const noise = []; for (let i = 0; i < 160; i++) noise.push(r());
    return (x, y) => {
      const a = ((x + .5 - 5) / 5) ** 2 + ((y + .5 - 5.5) / 4.5) ** 2 <= 1, b = ((x + .5 - 11) / 5) ** 2 + ((y + .5 - 5.5) / 4.5) ** 2 <= 1, c = ((x + .5 - 8) / 4.5) ** 2 + ((y + .5 - 3.5) / 3.5) ** 2 <= 1;
      if (!(a || b || c)) return null;
      const v = (x - 4) * .4 + y + noise[y * 16 + x] * 2.5; if (v < 3) return '#9BDB7D'; if (v < 7) return '#68BC5E'; return '#468F4C';
    };
  })(), { key: 'bush' + seed });
}

/* ---------------- stickers ---------------- */
export const STICKER_ART = {
  eenhoorn: u => unicorn(u), anna: () => anna(), fenna: () => fenna(), konijn: () => bunny(), poes: () => cat(), hond: () => puppy(),
  egel: () => hedgehog(), eend: () => duck(), ster: () => star(), hart: () => heart(), appel: () => apple(), wortel: () => carrot(),
  bloem: () => flower(), paddenstoel: () => mushroom(), kroon: () => crown(), ballon: () => balloon(), ijsje: () => icecream(),
  taart: () => cake(), vlinder: () => butterfly(), diamant: () => gem(), maan: () => moon(), regenboog: () => rainbow(),
  boom: () => treeRound(3), den: () => pine(2),
};
export function stickerSprite(id, u) { const f = STICKER_ART[id]; return f ? f(u) : star(); }
