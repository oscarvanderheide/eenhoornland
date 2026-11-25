// Art for the bigger island: ground painter, props, collectibles, eggs, baby unicorn and unicorn looks.
// Builds on pixel.js (same conventions: everything returns a <canvas>, 1px outline added automatically).
import * as PX from './pixel.js';
import * as ISLE from './art-isles.js';
export { ISLE };
import { GR, PA, WA, PL, SA, SE, FO, CO, SO, BW, CV, HF, RK, WF, POND, ROOMS, OUT_H } from './map.js';

const { sprite, gridSprite, mix, rgb } = PX;
const EYE = '#2B1E3A';
const copy = cv => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; };
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

/* ================= sharper characters ================= */
/** Twice the pixels for a character sprite: diagonals and curves are rounded off (Scale2x) and every eye gets a glint.
 *  The world draws the result at the same size as before, so it only looks finer. Cached per canvas. */
const hdCache = new WeakMap();
export function hd(cv) {
  if (cv.isHD) return cv; if (hdCache.has(cv)) return hdCache.get(cv);
  const w = cv.width, h = cv.height, src = new Uint32Array(cv.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const out = document.createElement('canvas'); out.width = w * 2; out.height = h * 2; const ox = out.getContext('2d'), img = ox.createImageData(w * 2, h * 2), dst = new Uint32Array(img.data.buffer);
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x], dark = new Uint32Array(new Uint8ClampedArray([...rgb(EYE), 255]).buffer)[0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    let p1 = P, p2 = P, p3 = P, p4 = P;
    if (C === A && C !== D && A !== B) p1 = A; if (A === B && A !== C && B !== D) p2 = B; if (D === C && D !== B && C !== A) p3 = C; if (B === D && B !== A && D !== C) p4 = D;
    // an eye: a dark pixel inside the sprite with something lighter beside it (the outline is dark too, but touches the outside)
    if (P === dark && A && B && C && D && A !== dark && (B !== dark || C !== dark) && at(x - 1, y - 1) && at(x + 1, y - 1)) p1 = 0xFFFFFFFF;
    const i = y * 2 * w * 2 + x * 2; dst[i] = p1; dst[i + 1] = p2; dst[i + w * 2] = p3; dst[i + w * 2 + 1] = p4;
  }
  ox.putImageData(img, 0, 0); out.isHD = true; hdCache.set(cv, out); return out;
}

/* ================= ground ================= */
export function paintGround(M) {
  const { W, H, ground, I, inb } = M, U = 16;
  const c = document.createElement('canvas'); c.width = W * U; c.height = H * U; const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.height), d = img.data, r = PX.rng(99);
  const hc = new Map(); const put = (x, y, hex) => { let v = hc.get(hex); if (!v) { v = rgb(hex); hc.set(hex, v); } const i = (y * c.width + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = 255; };
  const one = a => a[Math.floor(r() * a.length)];
  const grassC = ['#7BC86C', '#73BF65', '#84CF73', '#6DB862', '#7BC86C', '#7BC86C'], forestC = ['#62B066', '#5AA65F', '#69B86C', '#539C5A', '#62B066'];
  const pathC = ['#E4C291', '#DDB985', '#E8CA9B', '#D9B27F'], sandC = ['#F5E2AE', '#F0DAA2', '#F8E8BC', '#ECD398'];
  for (let tz = 0; tz < H; tz++) for (let tx = 0; tx < W; tx++) {
    const t = ground[I(tx, tz)];
    for (let py = 0; py < U; py++) for (let px = 0; px < U; px++) {
      let col;
      if (t === GR) col = one(grassC);
      else if (t === FO) col = r() < .025 ? (r() < .5 ? '#9DB85A' : '#C9A45A') : one(forestC);
      else if (t === PA) col = r() < .06 ? (r() < .5 ? '#C59B66' : '#F2DDB4') : one(pathC);
      else if (t === PL) { const bx = (px + (Math.floor((tz * U + py) / 4) % 2) * 2) % 4, by = py % 4; col = (bx === 0 || by === 0) ? '#B9AD9A' : ((tx * 7 + tz * 3 + Math.floor(px / 4) + Math.floor(py / 4)) % 3 === 0 ? '#DCD2C2' : '#E6DDCF'); }
      else if (t === WA) { const wx = tx + (px + .5) / U, wz = tz + (py + .5) / U; const dd = Math.sqrt(((wx - POND.cx) / (POND.rx - .15)) ** 2 + ((wz - POND.cz) / (POND.rz - .15)) ** 2); col = dd <= 1.02 ? '#3E9AD6' : dd <= 1.16 ? (r() < .2 ? '#D9BF8C' : '#E9D5A6') : dd <= 1.22 ? '#5FAE5A' : one(grassC); }
      else if (t === SE) col = r() < .15 ? '#C9AE78' : '#D6BC86';                                   // wet sand: only the strip the sea does not cover is ever seen
      else if (t === SA) col = r() < .04 ? (r() < .5 ? '#DCC38C' : '#FFF6D8') : one(sandC);
      else if (t === CO) { const row = Math.floor((tz * U + py) / 8), bx = (tx * U + px + (row % 2) * 4) % 8, by = py % 8; col = (bx === 0 || by === 0) ? '#8F8AA3' : ['#CFCAE0', '#BDB7D2', '#DAD6E8'][(Math.floor((tx * U + px + (row % 2) * 4) / 8) * 5 + row * 3) % 3]; if (bx === 1 && by === 1) col = '#EDEAF6'; }
      else if (t === SO) { const by = py % 8; col = by < 2 ? '#6E4A32' : by === 2 ? '#A07250' : (r() < .1 ? '#9A6B48' : '#8B5E3C'); }
      else if (t === CV) { const n = (tx * 13 + tz * 7 + Math.floor(px / 5) * 3 + Math.floor(py / 5) * 5) % 9; col = r() < .05 ? '#8CC98A' : n < 2 ? '#A898BC' : n < 5 ? '#B5A6C8' : '#C1B3D3'; if (py % 5 === 0 && (px + tz) % 7 < 3) col = '#9686AC'; }
      else if (t === HF) {                                                                                     // stone tiles, and a red carpet from the door to the garden
        const carpet = Math.abs(tx + .5 - (ROOMS.hal.in[0] + .5)) < 1.5 && (px > 2 || tx >= ROOMS.hal.in[0]) && (px < 13 || tx <= ROOMS.hal.in[0]);
        if (carpet) col = (px === 3 && tx === ROOMS.hal.in[0] - 1) || (px === 12 && tx === ROOMS.hal.in[0] + 1) ? '#F7C548' : (py + px) % 7 === 0 ? '#C23A4E' : '#D9475C';
        else { const bx = (px + (tz % 2) * 8) % 16, by = py % 16; col = (bx === 0 || by === 0) ? '#8C8199' : ((tx + tz) % 2 ? '#D5CCE0' : '#C6BCD4'); if (r() < .03) col = '#E4DCEC'; } }
      else if (t === RK) col = tz < OUT_H ? (r() < .3 ? '#9A9EB2' : '#B0B4C4') : r() < .08 ? '#2A2230' : '#221B28';   // a cliff on an island (seen on the map), else the rock round the rooms
      else if (t === WF) { const n = (tx * 11 + tz * 5 + Math.floor(px / 6) * 3 + Math.floor(py / 6) * 7) % 10; col = r() < .03 ? '#E8FAFF' : n < 2 ? '#6E8FA6' : n < 6 ? '#7FA2B8' : '#8DB2C6'; if (py % 6 === 0 && (px + tx) % 5 < 2) col = '#5E7E96'; }   // wet blue stone behind the waterfall
      else if (t === BW) { const by = py % 4; col = by === 0 ? '#8A5A3B' : ['#CC9A68', '#C18F5C', '#D6A674'][(tx * 3 + Math.floor(py / 4) + Math.floor(px / 8)) % 3]; if (by === 2 && (px === 1 || px === 14)) col = '#7A4E33'; }
      put(tx * U + px, tz * U + py, col);
    }
  }
  // ragged edges where grass / forest floor meets something harder
  const soft = t => t === GR || t === FO, hard = t => t === PA || t === PL || t === CO || t === SA || t === SO || t === BW;
  for (let tz = 0; tz < H; tz++) for (let tx = 0; tx < W; tx++) {
    if (!hard(ground[I(tx, tz)])) continue;
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (!inb(tx + dx, tz + dz) || !soft(ground[I(tx + dx, tz + dz)])) continue;
      const fo = ground[I(tx + dx, tz + dz)] === FO;
      for (let k = 0; k < U; k++) {
        const depth = r() < .5 ? 1 : (r() < .3 ? 2 : 0);
        for (let q = 0; q < depth; q++) { const px = dx === -1 ? q : dx === 1 ? U - 1 - q : k, py = dz === -1 ? q : dz === 1 ? U - 1 - q : k; put(tx * U + px, tz * U + py, q === depth - 1 ? (fo ? '#4A9052' : '#5FAE5A') : (fo ? '#5AA65F' : '#73BF65')); }
      }
    }
  }
  // tiny details
  const fc = ['#FF7EB6', '#FFFFFF', '#FFD43B', '#B9A3F0', '#FF9E6B'];
  for (let tz = 0; tz < H; tz++) for (let tx = 0; tx < W; tx++) {
    const t = ground[I(tx, tz)], X = tx * U, Y = tz * U;
    if (t === GR || t === FO) {
      for (let k = 0; k < 6; k++) { const px = Math.floor(r() * U), py = Math.floor(r() * (U - 1)); const col = t === GR ? '#5FA95A' : '#478C50'; put(X + px, Y + py, col); put(X + px, Y + py + 1, col); }
      if (t === GR && r() < .22) { const col = one(fc), n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) { const px = 2 + Math.floor(r() * 11), py = 2 + Math.floor(r() * 11); for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(X + px + a, Y + py + b, col); put(X + px, Y + py, '#FFF3A8'); } }
      if (t === FO && r() < .12) { const px = 2 + Math.floor(r() * 11), py = 2 + Math.floor(r() * 11); put(X + px, Y + py, '#E9D8B8'); put(X + px + 1, Y + py, '#E9D8B8'); put(X + px, Y + py + 1, '#B8946E'); }
    } else if (t === SA && r() < .25) { const px = 1 + Math.floor(r() * 13), py = 1 + Math.floor(r() * 13); put(X + px, Y + py, r() < .5 ? '#FFFFFF' : '#E6B8A2'); if (r() < .4) put(X + px + 1, Y + py, '#D9BF8C'); }
  }
  ctx.putImageData(img, 0, 0); return c;
}

/* ================= props ================= */
function palm(seed) {
  return cached('palm' + seed, () => {
    const lean = seed % 2 ? 1 : -1, mask = new Map();
    const fr = [[-1, 5, 3], [-.62, 7, 0], [.62, 7, 0], [1, 5, 3], [-.25, 6, -3], [.3, 6, -4]];
    for (const [dx, h, drop] of fr) for (let k = 0; k <= 40; k++) { const t = k / 40, fx = 12 + lean * 2 + dx * 10 * t, fy = 9 - Math.sin(t * Math.PI) * h * .55 + t * (drop + 5); for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 0; ox++) { const X = Math.round(fx) + ox, Y = Math.round(fy) + oy; if (X >= 0 && X < 24 && Y >= 0 && Y < 32 && !(oy === 1 && k % 3 === 0)) mask.set(Y * 24 + X, oy < 0 ? '#7ED98A' : oy === 0 ? '#4DB37C' : '#2F8F5B'); } }
    return gridSprite(24, 32, (x, y) => {
      const m = mask.get(y * 24 + x); if (m) return m;
      const cx = 12 + lean * 2 * (1 - (y - 9) / 22) ** 1.5; if (y >= 9 && Math.abs(x + .5 - cx) <= (y > 27 ? 1.6 : 1.1)) return y % 3 === 0 ? '#8A5A3B' : (x + .5 < cx ? '#C99664' : '#A97450');
      if ((x - 12 - lean * 2) ** 2 + (y - 10) ** 2 <= 1.5) return '#7A4E33';
      return null;
    });
  });
}
const rock = seed => cached('rock' + seed, () => gridSprite(15, 11, (x, y) => { const w = 6.5 + (seed % 3) * .4, cx = 7.5 + ((seed % 2) - .5), dd = ((x + .5 - cx) / w) ** 2 + ((y + .5 - 7) / (4.2 + (seed % 2))) ** 2; if (dd > 1 || y > 9) return null; const v = (x - 4) * .5 + (y - 3); return v < 1.5 ? '#D3D7E3' : v < 5 ? '#B4B9CB' : v < 8 ? '#989EB5' : '#7D8399'; }));
function appleTree(seed) { return cached('apt' + seed, () => { const c = copy(PX.treeRound(seed % 6 + 1)), x = c.getContext('2d'); for (const [ax, ay] of [[7, 9], [13, 6], [18, 11], [10, 14], [16, 16], [5, 14], [12, 11]]) { x.fillStyle = '#B8323A'; x.fillRect(ax, ay, 3, 3); x.fillStyle = '#E8484A'; x.fillRect(ax, ay, 2, 2); x.fillStyle = '#FF9A9A'; x.fillRect(ax, ay, 1, 1); } return c; }); }
const oak = () => cached('oak', () => {
  const r = PX.rng(4242), noise = []; for (let i = 0; i < 40 * 44; i++) noise.push(r());
  const blobs = [[20, 13, 12.5], [9.5, 18, 8], [30.5, 18, 8], [20, 21, 10.5], [13, 8, 6.5], [27, 8, 6.5]];
  return gridSprite(40, 44, (x, y) => {
    if (x >= 15 && x <= 24 && y >= 24) { if ((x === 17 || x === 22) && (y === 33 || y === 34)) return EYE; if (y === 37 && x >= 18 && x <= 21) return '#5E3A24'; if ((x === 16 || x === 23) && y === 36) return '#E58FB0'; return x === 15 ? '#B8825A' : x >= 23 ? '#6E4630' : (y < 27 ? '#5E3A24' : '#8A5A3B'); }
    if (y >= 40 && x >= 12 && x <= 27 && Math.abs(x - 19.5) <= 4.5 + (y - 40) * 1.2) return '#7A4E33';
    if (blobs.some(([cx, cy, rr]) => (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= rr * rr)) { const v = (x - 11) * .5 + (y - 5) + noise[y * 40 + x] * 3, dth = (x + y) & 1; return v < 3 + dth ? '#B5EA8C' : v < 11 + dth ? '#74C460' : v < 19 + dth ? '#52A655' : '#3A8346'; }
    return null;
  });
});
const stump = () => cached('stump', () => sprite(['..llllllll..', '.lLLlllLLll.', '.lLllLllLll.', '.bllllllllb.', '.bBbbBbbBbb.', '.bbBbbBbbBb.', 'bbBbbbBbbbbb', 'bb.bb..bb.bb'], { l: '#E9C99A', L: '#C9A06C', b: '#8A5A3B', B: '#6E4630' }));
const log = () => cached('log', () => sprite(['..bbbbbbbbbbbbb...', '.bbBbbbbBbbbbblll.', 'bbbbbbBbbbbBbllLll', 'bBbbbbbbbBbbblLlLl', '.bbbBbbbbbbbbllLl.', '..bbbbbbbbbbbbll..'], { l: '#E9C99A', L: '#C9A06C', b: '#8A5A3B', B: '#6E4630' }));
const fern = seed => cached('fern' + (seed % 2), () => sprite(seed % 2 ? ['g...G...g', '.g..G..g.', 'G.g.G.g.G', '.G.gGg.G.', '..GgGgG..', '...GGG...'] : ['..G...g..', 'g..G.g..G', '.g.G.g.G.', '.G.gGg.G.', '..GGgGG..', '...GGG...'], { g: '#7CCB64', G: '#3F8A4A' }));
function rose(seed) { return cached('rose' + seed, () => { const c = copy(PX.bush(seed)), x = c.getContext('2d'), col = ['#FF5E9C', '#FFFFFF', '#E8484A', '#FFB3CC'][seed % 4]; for (const [ax, ay] of [[3, 4], [7, 2], [11, 4], [5, 7], [13, 7], [9, 6]]) { x.fillStyle = col; x.fillRect(ax, ay, 2, 2); x.fillStyle = '#FFF3A8'; x.fillRect(ax, ay, 1, 1); } return c; }); }
const hedge = seed => cached('hedge' + (seed % 3), () => { const r = PX.rng(seed * 13 + 1), n = []; for (let i = 0; i < 16 * 13; i++) n.push(r()); return gridSprite(16, 13, (x, y) => { if (y < 1 && (x < 1 || x > 14)) return null; const v = y + n[y * 16 + x] * 4; return v < 3 ? '#8FD67A' : v < 9 ? '#5DB35A' : '#3F8A4A'; }); });
const SIGN_COL = ['#FF7EB6', '#69DB7C', '#FFD43B', '#4DABF7', '#B9A3F0'];
const sign = seed => cached('sign' + seed, () => sprite(['.wwwwwwwwww..', 'wWWWWWWWWWWw.', 'wWccWWWWWWWWw', 'wWccWWWWWWWw.', '.wwwwwwwwww..', '.....pp......', '.....pp......', '.....pp......', '.....pP......', '.....pP......', '....ppPp.....'], { w: '#8A5A3B', W: '#F2DDB4', c: SIGN_COL[seed % 5], p: '#A97450', P: '#6E4630' }));
const scarecrow = () => cached('scarecrow', () => sprite([
  '.....hhhhhh.....', '....hhhhhhhh....', '...yyyyyyyyyy...', '....ssssssss....', '....sksssks.....', '....sssnsss.....', '....ssmmmss.....', '.....ssssss.....',
  'yy.rrrrrrrrrr.yy', 'yyrrrrbrrbrrrryy', '...rrrrrrrrrr...', '....rrrbrrrr....', '....rrrrrrrr....', '....bbbbbbbb....', '.....yy..yy.....', '.......pp.......', '.......pp.......', '.......pp.......', '.......pp.......',
], { h: '#8B5A3C', y: '#E9C46A', s: '#FFE8CC', k: EYE, n: '#FF8C42', m: '#C2456E', r: '#E8616B', b: '#4DABF7', p: '#A97450' }));
const umbrella = seed => cached('umb' + (seed % 2), () => { const a = seed % 2 ? '#4DABF7' : '#FF5E9C'; return gridSprite(26, 26, (x, y) => { const dx = x + .5 - 13, dd = (dx / 12.5) ** 2 + ((y + .5 - 11) / 10) ** 2; if (y < 11 && dd <= 1) return Math.floor((x + 1) / 4) % 2 ? '#FFFFFF' : (y < 4 ? mix(a, '#ffffff', .25) : a); if (y === 11 && Math.abs(dx) < 12.5) return Math.floor((x + 1) / 4) % 2 ? '#E6E6F0' : mix(a, '#000000', .2); if (x >= 12 && x <= 13 && y > 11) return x === 12 ? '#E8E8F0' : '#B8BCCB'; if (y >= 23 && x >= 2 && x <= 22 && x !== 12 && x !== 13) return (Math.floor(x / 3) % 2) ? '#FFD43B' : '#FF9E6B'; return null; }); });
const sandcastle = () => cached('sandcastle', () => sprite([
  '.....r..........r.....', '.....rr....f....rr....', '.....p.....ff...p.....', '...s.s.s...p..s.s.s...', '...sssss...p..sssss...', '...sSsss.s.s.sssSss...', '...sssss.sssssssss....', '...sSssssssSsssssss...', '...sssssssssssssSss...', '..ssssSssskkssssssss..', '..ssssssssKKsssSssss..', '.sssSsssssKKssssssSss.', 'ssssssssssKKssssssssss',
], { s: '#F0D898', S: '#D6BC86', r: '#FF5E9C', f: '#4DABF7', p: '#8A5A3B', k: '#8A6A4A', K: '#6E5238' }));
const boatSail = () => {   // a big sail right of the mast (a pink stripe every few rows), a little one in front, a flag on top
  const rows = ['.............mff', '.............mfff', '.............mf'];
  for (let i = 0; i < 14; i++) { const w = 1 + i, j = i > 3 ? Math.floor((i - 3) * .7) : 0, c = i % 5 === 3 ? 'S' : 'w'; rows.push((' '.repeat(13 - j) + 'v'.repeat(j) + 'm' + c.repeat(w)).replace(/ /g, '.').padEnd(30, '.')); }
  rows.push('.............m................'); return rows;
};
const boat = () => cached('boat2', () => sprite([
  ...boatSail(),
  'rr...........m..............rr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', '.rWWWWWWWWWWWWWWWWWWWWWWWWWWr.', '.rrrrrrrrrrrrrrrrrrrrrrrrrrrr.', '..bbbbbbbbbbbbbbbbbbbbbbbbbb..', '...bbbbbbbbbbbbbbbbbbbbbbbb...', '....BBBBBBBBBBBBBBBBBBBBBB....',
], { r: '#E8616B', W: '#FFFFFF', b: '#4DABF7', B: '#2F7FC0', m: '#8A5A3B', w: '#FFF6E3', S: '#FF8FB8', v: '#FFE9C2', f: '#FF5E9C' }));
const statue = () => cached('statue', () => sprite([
  '.........y........', '........yY........', '.....y.yY.........', '....yyyyyy........', '...yyyykyyy.......', '...yyyyyyyyY......', '..Yyyyyyy.........', '..YYyyyyy.........', '..YYyyyyyyy.......', '...Yyyyyyyyy......', '...yyyyyyyyy......', '...yy.yy.yy.......', '...yy.yy.yy.......',
  '.ssssssssssssss...', '.sSSSSSSSSSSSSs...', '..ssssssssssss....', '..sSssSssSssSs....', '..ssssssssssss....', '.ssssssssssssss...', '.SSSSSSSSSSSSSS...',
], { y: '#F7C548', Y: '#D99A2B', k: EYE, s: '#D6D1E0', S: '#A9A3BD' }));
const flag = seed => cached('flag' + (seed % 2), () => { const a = seed % 2 ? '#6A7FD6' : '#E86A9A'; return sprite(['.y.......', 'yyy......', '.paaaaaa.', '.paaYaaaa', '.paaaaaa.', '.paaaa...', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', 'ppp......'], { y: '#F7C548', Y: '#FFF3A8', a, p: '#B8BCCB' }); });
const trough = () => cached('trough', () => sprite(['bwwwwwwwwwwwwwwwwb', 'bwWwwwWwwwwwWwwwwb', 'bbbbbbbbbbbbbbbbbb', '.bBbbbbBbbbbBbbbb.', '.bbbbbbbbbbbbbbbb.', '..B............B..'], { b: '#A97450', B: '#6E4630', w: '#5AB4E6', W: '#D8F4FF' }));
const hay = () => cached('hay', () => { const r = PX.rng(77), n = []; for (let i = 0; i < 16 * 11; i++) n.push(r()); return gridSprite(16, 11, (x, y) => { if ((y === 0 && (x < 1 || x > 14))) return null; if (x === 4 || x === 11) return '#B8323A'; return n[y * 16 + x] < .2 ? '#FFF1A8' : n[y * 16 + x] < .45 ? '#C9A23F' : '#E9C46A'; }); });
const bigMushroom = () => cached('bigmush', () => sprite(['...RRRRRR...', '.RRwRRRRwRR.', 'RRRRRwRRRRRR', 'RwRRRRRRRwRR', 'RRRRwRRRRRRR', '.RRRRRRRRRR.', '....ssss....', '....ssss....', '....sSss....', '...ssssss...'], { R: '#E8484A', w: '#FFFFFF', s: '#FFF1DC', S: '#E0CDB0' }));

/* things to jump over, cut or smash, and the tools for it */
const bramble = seed => cached('bramble' + (seed % 2), () => { const r = PX.rng(seed * 7 + 3), n = []; for (let i = 0; i < 18 * 14; i++) n.push(r()); return gridSprite(18, 14, (x, y) => { const dd = ((x + .5 - 9) / 9) ** 2 + ((y + .5 - 8) / 6.5) ** 2; if (dd > 1) return null; const v = n[y * 18 + x]; if ((x * 3 + y * 5 + seed) % 11 === 0) return '#F3EDE3'; if ((x + y * 2) % 7 === 0 && v < .6) return '#6B4A3A'; if ((x * 5 + y * 3) % 17 === 0) return '#C2456E'; return v < .3 ? '#5C9A4E' : v < .7 ? '#3F7A45' : '#2F5E3C'; }); });
const boulder = seed => cached('boulder' + (seed % 2), () => gridSprite(18, 15, (x, y) => { const dd = ((x + .5 - 9) / 9) ** 2 + ((y + .5 - 8.5) / 7) ** 2; if (dd > 1 || y > 13) return null; if ((x === 6 + seed % 2 && y > 3 && y < 9) || (y === 8 && x > 6 && x < 10) || (x === 12 && y > 6 && y < 12)) return '#6B7088'; const v = (x - 4) * .55 + (y - 3); return v < 2 ? '#E2E5EE' : v < 6 ? '#BFC4D4' : v < 10 ? '#9FA5BC' : '#848AA2'; }));
const plas = () => cached('plas', () => gridSprite(18, 12, (x, y) => { const dd = ((x + .5 - 9) / 9) ** 2 + ((y + .5 - 6) / 6) ** 2; if (dd > 1) return null; if (dd > .78) return '#8FD6F5'; return (x + y * 2) % 9 === 0 || (x === 5 && y === 3) || (x === 6 && y === 3) ? '#E8FAFF' : (y < 5 ? '#4FA8DE' : '#3E9AD6'); }, { outline: '#2F7FC0' }));
export const toolIcon = id => id === 'hamer'
  ? cached('hamer', () => sprite(['..ssssssss..', '.sSSSSSSSSs.', '.sSSSSSSSSs.', '..ssssssss..', '.....hh.....', '.....hh.....', '.....hH.....', '.....hH.....', '.....hH.....', '.....hH.....', '.....hh.....'], { s: '#9FA5BC', S: '#D8DCE8', h: '#B5823F', H: '#8A5A3B' }))
  : cached('zwaard', () => sprite(['......Ws', '.....WSs', '....WSs.', '...WSs..', 'g.WSs...', 'ggSs....', '.yg.....', 'y.gg....', '...g....'], { W: '#FFFFFF', S: '#D8DCE8', s: '#9FA5BC', g: '#F7C548', y: '#FF5E9C' }));
/** the sword standing in its stone in the village (before it is there, and once it is pulled out, only the stone with its slot) */
export const zwaardSteen = (withSword = true) => cached('zwsteen2' + withSword, () => gridSprite(22, 34, (x, y) => {
  const cx = x + .5 - 11;
  if (withSword) {
    if (y <= 2 && Math.hypot(cx, y + .5 - 1.5) <= 1.8) return x === 10 && y === 1 ? '#FFD6E7' : '#FF5E9C';                 // the pink gem
    if (y >= 3 && y <= 6 && Math.abs(cx) < 1.1) return y % 2 ? '#8A5A3B' : '#C08A4A';                                      // the grip
    if (y === 6 && Math.abs(cx) > 4 && Math.abs(cx) < 6) return '#F7C548';                                                  // the guard's tips curl up
    if (y >= 7 && y <= 8 && Math.abs(cx) < 6) return y === 7 ? '#FFE27A' : '#D99A2B';                                      // the golden guard
    if (y >= 9 && y <= 24 && Math.abs(cx) < 2.1) return cx < -1 ? '#FFFFFF' : cx < 0 ? '#E8ECF4' : cx < 1 ? '#C9CEDC' : '#9FA5BC';   // the blade
  }
  const dd = (cx / 10.5) ** 2 + ((y + .5 - 27.5) / 6.5) ** 2; if (dd > 1 || y < 21) return null;
  if (Math.abs(cx) < 2.6 && y >= (withSword ? 25 : 23) && y <= (withSword ? 25 : 24)) return '#4A4E62';                    // the slot
  if (y < 25 && (x * 5 + y * 3) % 4 === 0) return '#6FB86A';                                                               // moss on top
  const v = (x - 3) * .35 + (y - 21) * .9; return (x * 7 + y * 3) % 13 === 0 ? '#6FB86A' : v < 3 ? '#E2E5EE' : v < 7 ? '#BFC4D4' : v < 10 ? '#9FA5BC' : '#848AA2';
}));
/** the sword on its own (as it sits in the stone, point down): for the scene where she pulls it out (cutscene.js) */
export const zwaardLos = () => cached('zwaardLos', () => gridSprite(22, 25, (x, y) => {
  const cx = x + .5 - 11;
  if (y <= 2 && Math.hypot(cx, y + .5 - 1.5) <= 1.8) return x === 10 && y === 1 ? '#FFD6E7' : '#FF5E9C';
  if (y >= 3 && y <= 6 && Math.abs(cx) < 1.1) return y % 2 ? '#8A5A3B' : '#C08A4A';
  if (y === 6 && Math.abs(cx) > 4 && Math.abs(cx) < 6) return '#F7C548';
  if (y >= 7 && y <= 8 && Math.abs(cx) < 6) return y === 7 ? '#FFE27A' : '#D99A2B';
  if (y >= 9 && y <= 23 && Math.abs(cx) < 2.1 - (y === 23 ? 1 : 0)) return cx < -1 ? '#FFFFFF' : cx < 0 ? '#E8ECF4' : cx < 1 ? '#C9CEDC' : '#9FA5BC';
  return null;
}));
/** the forest gnome; asleep he snores against a tree stump, awake he stands and waves (his hammer is its own sprite) */
export const kabouter = (awake = false) => cached('kabouter2' + awake, () => sprite(awake ? [
  '....r.....', '...rrr....', '...rRr....', '..rrrrr...', '..rrrrrr..', '.ssssss...', '.skssks...', '.ssmsss...', 'wwwwwww...', 'wwwwwww.s.', 'bbbbbbbbs.', 'bBBBBbb...', '.bbbbb....', '.gg.gg....', 'kk..kk....',
] : [
  '...........r', '........rrr.', '......rrrRr.', '.....rrrrrr.', '....ssssss..', '....s-ss-s..', '....ssmsss..', '...wwwwwww..', '....wwwwww..', '...sbbbbbbb.', '....bBBBBbb.', '....gggggg..', '...kk...kk..',
], { r: '#E8484A', R: '#FF9A9A', s: '#FFD7B5', k: '#5E3A24', '-': '#5E3A24', m: '#E8616B', w: '#FFFFFF', b: '#4DABF7', B: '#8FD3FF', g: '#6B8E3A' }));
/** the gnome's big hammer, standing up next to him */
export const hamerGroot = () => cached('hamerGroot2', () => gridSprite(14, 22, (x, y) => {
  if (y <= 6 && !((y === 0 || y === 6) && (x === 0 || x === 13))) return y === 0 ? '#F2F4F8' : x < 2 ? '#E2E5EE' : x > 11 ? '#848AA2' : y > 4 ? '#9FA5BC' : (x === 3 && y === 2) ? '#FFFFFF' : '#C9CEDC';   // the head
  if (x >= 6 && x <= 7) return y === 21 ? '#6E4630' : x === 6 ? '#C08A4A' : '#8A5A3B';                                     // the handle
  return null;
}));
export const belIcon = () => cached('beli', () => sprite(['....kk....', '...yyyy...', '..yYyyyy..', '..yYyyyy..', '.yyYyyyyy.', '.yyyyyyyy.', 'yyyyyyyyyy', '....oo....'], { y: '#FFD43B', Y: '#FFF3A8', k: '#8A5A3B', o: '#E0A020' }));
/** a little picture for "press here to jump" */
/** the ✕ button with nothing to do right here: an open hand */
export const handIcon = () => cached('handi', () => sprite(['..s.s.s...', '.sSsSsSs..', '.sSsSsSs.s', '.sSsSsSssS', '.sSSSSSSSs', '.sSSSSSSs.', '..sSSSSs..', '...ssss...'], { s: '#C98A6B', S: '#FFD9C2' }));
export const jumpIcon = () => cached('jumpi', () => sprite(['....yy....', '...yyyy...', '..yyyyyy..', '.yyyyyyyy.', '...yyyy...', '...yyyy...', '..........', '.gg.gg.gg.', 'gggggggggg'], { y: '#FFD43B', g: '#5DC88A' }));

/** a little picture for "say hello": a speech bubble with a heart in it */
export const talkIcon = () => cached('talki', () => sprite(['.wwwwwwwww.', 'wwwwwwwwwww', 'wwrrwwrrwww', 'wrrrrrrrrww', 'wrrrrrrrrww', 'wwrrrrrrwww', 'wwwrrrrwwww', 'wwwwrrwwwww', '.wwwwwwwww.', '..ww.......', '.w.........'], { w: '#FFFFFF', r: '#FF5E9C' }));

/* the cave's puzzle: a wooden crate to push, the stone button it goes on, the crystal bars that sink when it is pressed */
export const kist = () => cached('kist', () => gridSprite(16, 15, (x, y) => {
  if (y < 3) return y === 0 || x === 0 || x === 15 ? '#8A5A3B' : (x + y) % 5 === 0 ? '#E9C99A' : '#D9A86A';   // the lid, seen from above
  if (x === 0 || x === 15 || y === 14 || y === 3) return '#6E4630';
  if (x === 1 || x === 14 || y === 4 || y === 13) return '#8A5A3B';
  if (Math.abs((x - 1) - (y - 4) * 13 / 9) < 1.1 || Math.abs((14 - x) - (y - 4) * 13 / 9) < 1.1) return '#8A5A3B';            // the cross brace
  return (y % 3 === 0) ? '#B57E4B' : '#C9925A';
}));
export const knop = (down = false) => cached('knop' + down, () => gridSprite(16, 12, (x, y) => {
  const d = ((x + .5 - 8) / 8) ** 2 + ((y + .5 - 6) / 6) ** 2; if (d > 1) return null;
  if (d > .62) return d > .85 ? '#7E6E96' : '#A898BC';                                                       // the stone ring
  const p = ((x + .5 - 8) / 4.6) ** 2 + ((y + .5 - (down ? 6.4 : 5.4)) / 3.4) ** 2; if (p > 1) return '#6C5D84';
  return down ? (p < .3 ? '#9BE8A8' : '#5DC88A') : (p < .3 ? '#FFD6E7' : '#FF5E9C');
}, { outline: '#4E4266' }));
export const kristalhek = () => cached('khek', () => gridSprite(16, 26, (x, y) => {
  if (y > 23) return x % 5 === 4 ? null : '#7E6E96';
  const bar = x % 5; if (bar === 4) return y === 6 || y === 16 ? '#C7B8F0' : null;
  const top = 3 - (x % 10 < 5 ? 0 : 2); if (y < top) return null;
  return bar === 0 ? '#F4EEFF' : bar === 1 ? '#D9C8FF' : bar === 2 ? '#B9A0F0' : '#9A80D8';
}, { outline: '#5B4A86' }));

/* the rainbow tree on the island, the hole in the bridge to the castle, and the rainbow that mends it */
const rainbowtree = () => cached('rbtree', () => {
  const blobs = [[15, 11, 10], [8, 15, 7], [22, 15, 7], [15, 17, 9]], blossom = [[9, 12], [19, 8], [14, 19], [23, 16], [5, 16], [13, 5]];
  return gridSprite(30, 36, (x, y) => {
    if (x >= 13 && x <= 16 && y >= 20) return x === 13 ? '#B8825A' : x === 16 ? '#6E4630' : '#8A5A3B';
    if (y >= 33 && Math.abs(x - 14.5) <= 3.5) return '#7A4E33';
    if (!blobs.some(([cx, cy, rr]) => (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= rr * rr)) return null;
    if (blossom.some(([a, b]) => Math.abs(x - a) + Math.abs(y - b) <= 1)) return '#FFFFFF';
    return mix(PX.RAINBOW[Math.floor((x * .5 + y) / 3.4) % 6], '#ffffff', (x + y) % 2 ? .22 : .38);
  });
});
const gat = () => cached('gat', () => gridSprite(18, 16, (x, y) => { const top = y < 2 + (x * 7) % 3, bot = y > 13 - (x * 5) % 3; if (!top && !bot) return null; return x % 6 === 5 ? '#8A5A3B' : (y === 0 || y === 15) ? '#D6A674' : '#C18F5C'; }));
const regenboogbrug = () => cached('rbbrug', () => gridSprite(18, 16, (x, y) => mix(PX.RAINBOW[Math.floor(x / 3)], '#ffffff', y % 4 === 0 ? .45 : .2)));
export const starItem = () => cached('starItem', () => sprite(['.....y.....', '....yyy....', '....yYy....', 'yyyyyYyyyyy', '.yyYYYYYyy.', '..yYkYkYy..', '..yYYmYYy..', '.yyYYYYYyy.', '.yyyy.yyyy.', 'yyy.....yyy'], { y: '#FFD43B', Y: '#FFF3A8', k: EYE, m: '#FF8FB1' }));
export const fruit = () => cached('fruit', () => gridSprite(9, 10, (x, y) => { if (y < 2) return (x === 4 && y === 1) ? '#8A5A3B' : (x === 5 || x === 6) && y === 0 ? '#5DC88A' : null; const dd = (x + .5 - 4.5) ** 2 + (y + .5 - 6) ** 2; if (dd > 16.5) return null; if (x === 2 && y === 4) return '#FFFFFF'; return PX.RAINBOW[Math.min(5, Math.floor((y - 2) * .75))]; }));

/* every kind of egg needs its own warm thing to hatch and its own food to grow strong (quest.js WARM / FOOD); the forest
   egg of the very first adventure keeps the fallen star and the rainbow fruit */
const honing = () => cached('honing', () => sprite(['.kkkkkk.', '.kKKKKk.', 'oooooooo', 'oOOyOOOo', 'oOyyyOOo', 'oOOyOOOo', 'oOOOOOOo', '.oooooo.'], { o: '#E0A020', O: '#FFC94D', y: '#FFF3A8', k: '#B5823F', K: '#E8C08A' }));
const aardbei = () => cached('aardbei', () => sprite(['...gg...', '..gGGg..', '.rrrrrr.', 'rrwrrwrr', 'rRrrrrrr', '.rwrrwr.', '..rrrr..', '...rr...'], { r: '#F0525A', R: '#FFB3B3', w: '#FFE08A', g: '#5DC88A', G: '#3A9E69' }));
const sterkoek = () => cached('sterkoek', () => sprite(['....b....', '...bBb...', 'bbbbBbbbb', '.bBBpBBb.', '..bBpBb..', '.bBb.bBb.', '.bb...bb.'], { b: '#C18F5C', B: '#F2C98A', p: '#FF7EB6' }));
const zeebes = () => cached('zeebes', () => sprite(['..g.g..', '...g...', '.bb.bb.', 'bBbbBbb', 'bbbbbbb', '.bBbbb.', '..bbb..'], { b: '#4FA3F7', B: '#BFE3FF', g: '#3A9E69' }));
const goudschelp = () => cached('goudschelp', () => sprite(['..yyyyy..', '.yWyLyWy.', 'yWyLyLyWy', 'yWyLyLyWy', '.yWyLyWy.', '..yyyy...', '...yy....'], { y: '#FFD43B', W: '#FFF3A8', L: '#E0A020' }));
const zonnebloem = () => cached('zonnebloem', () => sprite(['..y.y.y..', '.yyyyyyy.', 'yyybbbyyy', '.yybBbyy.', 'yyybbbyyy', '.yyyyyyy.', '..y.g.y..', '....g....', '...gg....', '....g....'], { y: '#FFD43B', b: '#8A5A3B', B: '#B5823F', g: '#5DC88A' }));
export const warmItem = kind => kind === 'bloem' ? zonnebloem() : kind === 'zee' ? goudschelp() : kind === 'regenboog' ? PX.rainbow() : kind === 'ster' ? PX.moon() : starItem();
export const foodItem = kind => kind === 'bloem' ? aardbei() : kind === 'zee' ? zeebes() : kind === 'regenboog' ? honing() : kind === 'ster' ? sterkoek() : fruit();
export const bike = () => cached('bike', () => sprite([
  '................kkkk....', '......ssss........p.....', '.......ss.........p.yyyy', '........p.........p.yYYy', '.......pppppppppppppyyyy', '......p.p......PP.p.....', '.....pp.p.....PP..p.....',
  '..kkkp..p...PP...kpk....', '.k.gpk..p..PP...k.p.k...', 'k..gp.k.p.PP...k..p..k..', 'kggppppppp.....kggpggk..', 'k..g..k..k.....k..g..k..', '.k.g.k...kk.....k.g.k...', '..kkk............kkk....',
], { k: '#3D2B4F', p: '#FF5E9C', P: '#E0457F', g: '#C3C8D8', s: '#7A4A2A', y: '#F2C14E', Y: '#D99A2B' }));
/** streamers on the handlebar of the bike, two frames of fluttering */
export const linten = (f = 0) => cached('linten' + f % 2, () => sprite(f % 2 ? ['k.....', 'kppbb.', 'k..ppy', 'k.bb..', 'k...yy'] : ['k.....', 'kpp...', 'k.ppbb', 'kbb.yy', 'k..yy.'], { k: '#3D2B4F', p: '#FF5E9C', b: '#4DABF7', y: '#FFD43B' }, { outline: false }));
export const ball = (beach = false) => cached('ball' + beach, () => { const n = beach ? 11 : 8, c = beach ? ['#FF5E9C', '#FFFFFF', '#4DABF7', '#FFFFFF', '#FFD43B', '#FFFFFF'] : ['#E8484A', '#FFFFFF', '#E8484A', '#FFFFFF']; return gridSprite(n, n, (x, y) => { const dx = x + .5 - n / 2, dy = y + .5 - n / 2; if (dx * dx + dy * dy > (n / 2) ** 2) return null; if (dx * dx + dy * dy < 1.2) return beach ? '#FFFFFF' : '#FFD43B'; const a = Math.atan2(dy, dx) + Math.PI; return c[Math.floor(a / (Math.PI * 2) * c.length) % c.length]; }); });

/* ================= fishing ================= */
export const hengel = () => cached('hengel', () => sprite([
  '..............w', '.............b.', '............b..', '...........B...', '..........b....', '.........b.....', '........b......', '.......B.......', '......b........', '.....bb........', '....rRr........', '...rRRr........', '...crr.........', '..cc...........', '.cC............', 'cc.............',
], { b: '#E8C08A', B: '#B5823F', w: '#FFFFFF', r: '#4DABF7', R: '#BFE3FF', c: '#C9A06C', C: '#E9C99A' }));   // bamboo with a cork handle and a little blue reel
export const dobber = () => cached('dobber', () => sprite(['.k.', 'rrr', 'rwr', 'www'], { k: '#3D2B4F', r: '#E8484A', w: '#FFFFFF' }));
export const laars = () => cached('laars', () => sprite(['.gggg..', '.gGgg..', '.gggg..', '.gggg..', '.ggggg.', '.gggggg', 'gggggGg', 'kkkkkkk'], { g: '#6B8E3A', G: '#8FB35A', k: '#3D2B1F' }));
export const badeend = () => cached('badeend', () => sprite(['..yyy...', '.yykyoo.', '.yyyy...', 'yyyyyyy.', 'yyyyyyyy', '.yyyyyy.'], { y: '#FFD43B', k: EYE, o: '#FF8C42' }));
export const fles = () => cached('fles', () => sprite(['..kk..', '..gg..', '..gg..', '.gggg.', 'gGgggg', 'gGyygg', 'gGyygg', 'gggggg', '.gggg.'], { k: '#B5823F', g: '#8FE3C8', G: '#E8FFF7', y: '#FFD43B' }));
export const zeewier = () => cached('zeewier', () => sprite(['g.g..g.g', 'gGg.gGg.', '.gGggg.g', '..gGgGg.', '..g.g.g.', '.g..g..g'], { g: '#3A9E69', G: '#7CCB64' }));

/* ================= the open sea ================= */
export const vuurtoren = () => cached('vuurtoren', () => gridSprite(16, 44, (x, y) => {
  if (y < 4) return Math.abs(x + .5 - 8) < 4 - y * .6 + 2 ? '#E8484A' : null;                                     // the red cap
  if (y < 10) { if (x < 3 || x > 12) return null; return x === 3 || x === 12 || y === 4 || y === 9 ? '#3D2B4F' : (y > 5 && y < 9 && x > 4 && x < 11 ? '#FFF3A8' : '#BFE3FF'); }   // the lamp
  if (y === 10) return x > 1 && x < 14 ? '#3D2B4F' : null;
  const half = 4 + (y - 10) * .1; if (Math.abs(x + .5 - 8) > half) return null;
  return Math.floor((y - 11) / 6) % 2 ? '#E8484A' : '#FFFFFF';
}));
export const zeehond = (f = 0) => cached('zeehond' + f % 2, () => sprite(f % 2 ? [
  '..ggg.......', '.gkggg......', 'gggggg......', '.nggggg..f.f', '..gggggg.ff.', '..ggGGGgggg.', '.ggGGGGGggg.', 'f.gggggggg..',
] : [
  '............', '..ggg.......', '.gkggg......', 'gggggggg....', '.nggGGGggg..', '..gGGGGGgggf', '..gggggggggf', '.ff.........',
], { g: '#8C93A8', G: '#C9CEDC', k: EYE, n: '#3D2B4F', f: '#6E7488' }));
export const dolfijn = (f = 0) => cached('dolfijn' + f % 2, () => sprite(f % 2 ? [
  '......b.......', '.....bb.......', '..bbbbbbbb....', '.bbbbbbbbbbb..', 'bbkbbbbbbbbbbb', '.wwwwwwbbbb.bb', '..wwwww...b..b',
] : [
  '.......bb.....', '..bbbbbbbbb...', '.bbbbbbbbbbbb.', 'bbkbbbbbbbbbbb', '.wwwwwbbb..bbb', '..www.....b..b', '..............',
], { b: '#5B9BD6', w: '#E3F1FF', k: EYE }));
export const zwemmer = (f = 0) => cached('zwemmer' + f % 2, () => sprite([
  f % 2 ? '.h......h.' : '..........', f % 2 ? '.s.hhhh.s.' : '...hhhh...', f % 2 ? '.s.hsss.s.' : '..hssss...', f % 2 ? '..ssksks..' : '..sksks...', f % 2 ? '...sssm...' : '.ssssms.s.', 'rrwwrrwwrr', 'rwwrrwwrrw', '.rrrrrrrr.',
], { h: '#5E3A24', s: '#FFD7B5', k: EYE, m: '#E8616B', r: '#FF5E9C', w: '#FFFFFF' }));
export const vissersboot = () => cached('vboot', () => sprite([
  '.......k..........', '.......kyy........', '.......kyyy.......', '.......k...bbb....', '.......k..bBBBb...', '.......k..bkBkb...', '.......k...bmb....', 'wwwwwwwwwwwwwwwwww', 'rRRRRRRRRRRRRRRRRr', '.rRRRRRRRRRRRRRRr.', '..rrrrrrrrrrrrrr..',
], { k: '#6E4630', y: '#FFD43B', b: '#A0703E', B: '#D9A066', m: '#3D2B1F', w: '#FFFFFF', r: '#3E7FC0', R: '#5DA3E8' }));
export const schildpad = (f = 0) => cached('schildpad' + f % 2, () => sprite(f % 2 ? [
  '...gggg.....', '..gGgGgg....', '.gGgGgGgg.hh', 'ggggggggghkh', 'l.l....l.hh.',
] : [
  '...gggg.....', '..gGgGgg..hh', '.gGgGgGgghkh', 'ggggggggg.hh', '.l.l..l.l...',
], { g: '#3A9E69', G: '#7CCB64', h: '#9ACB7A', k: EYE, l: '#7AAE62' }));
export const pijl = () => cached('pijl', () => gridSprite(13, 9, (x, y) => { const tip = x - 7; if (tip >= 0) return Math.abs(y - 4) <= 4 - tip * .75 ? '#FFFFFF' : null; return y >= 3 && y <= 5 ? PX.RAINBOW[Math.min(5, Math.floor(x / 1.2))] : null; }));

/* ================= the cave and the castle hall ================= */
const KRISTAL = [['#9FE8FF', '#5EC4F0', '#E8FBFF'], ['#FFB3E6', '#E86AC0', '#FFE8F7'], ['#C9B3FF', '#8C6BE8', '#F0E8FF']];
const kristal = seed => cached('krist' + seed % 3, () => { const [a, b, c] = KRISTAL[seed % 3]; return gridSprite(14, 16, (x, y) => {
  for (const [cx, hh, ww] of [[7, 15, 2.6], [3.5, 9, 1.8], [10.5, 11, 1.9]]) { const top = 16 - hh; if (y < top) continue; const half = Math.min(ww, (y - top + 1) * .9); const d = x + .5 - cx; if (Math.abs(d) <= half) return y === top || d < -half * .3 ? c : d < half * .35 ? a : b; }
  return y > 13 && x > 1 && x < 13 ? '#8F7FA6' : null; }); });
/** the cave's glowing mushrooms (where there used to be dark spikes): soft pastel caps with white dots */
const GLIM = [['#8FE3D6', '#5CC4B6', '#E6FFFA'], ['#FFB3D9', '#F07AB8', '#FFF0F8'], ['#FFE08A', '#F5B83D', '#FFF8DC']];
const druipsteen = seed => cached('glim' + seed % 3, () => { const [a, b, c] = GLIM[seed % 3]; return gridSprite(16, 18, (x, y) => {
  const cap = ((x + .5 - 8) / 7.5) ** 2 + ((y + .5 - 7) / 6) ** 2; if (y < 8 && cap <= 1) return (x * 5 + y * 3) % 11 === 0 || (x === 5 && y === 3) ? '#FFFFFF' : x < 6 && y < 5 ? c : y > 5 ? b : a;
  if (y >= 8 && Math.abs(x + .5 - 8) < 2.2) return x < 8 ? '#FFF6E8' : '#E8DCCB'; if (y >= 16 && Math.abs(x + .5 - 8) < 4) return '#8CC98A'; return null; }); });
const harnas = () => cached('harnas', () => sprite([
  '.....rr.....', '....rr......', '...ssss.....', '..sSSSSs....', '..sS--Ss....', '..sSSSSs....', '...ssss.....', '.ssSSSSss...', 'sSsSSSSsSs..', 'sSsSyySsSs..', 'sSsSSSSsSsk.', '.s.SSSSs.sk.', '...ssss...k.', '...s..s...k.', '..ss..ss..k.', '.bbbbbbbbbb.',
], { s: '#9FA5BC', S: '#D8DCE8', '-': '#3D3550', r: '#E8484A', y: '#F7C548', k: '#8A5A3B', b: '#6E6272' }));
const zuil = () => cached('zuil', () => gridSprite(12, 34, (x, y) => { if (y < 3 || y > 30) return x === 0 || x === 11 ? '#B9B0C9' : '#E4DCEC'; if (x < 2 || x > 9) return null; return x === 2 ? '#F2EEF8' : x === 9 ? '#A79DB8' : (x % 3 === 0 ? '#C6BCD4' : '#D5CCE0'); }));
const muntberg = seed => cached('mberg' + seed % 2, () => { const r = PX.rng(seed + 9); return gridSprite(22, 12, (x, y) => { const d = ((x + .5 - 11) / 11) ** 2 + ((y + .5 - 12) / 11.5) ** 2; if (d > 1) return null; const v = r(); if (v < .08) return seed % 2 && v < .03 ? '#E8484A' : '#FFFFFF'; return v < .35 ? '#FFF3A8' : v < .75 ? '#FFD43B' : '#E0A020'; }); });
export const schatkist = (open = false) => cached('kist' + open, () => sprite(open ? [
  '.bbbbbbbbbbbb.', 'bBBBBBBBBBBBBb', 'bKKKKKKKKKKKKb', '.byyyyyyyyyyb.', 'bbyyYyyyYyyybb', 'bBBBBByyBBBBBb', 'bBBBBByyBBBBBb', 'bbbbbbbbbbbbbb', 'bBBBBBBBBBBBBb', 'bbbbbbbbbbbbbb',
] : [
  '..............', '..............', '.bbbbbbbbbbbb.', 'bBBBBByyBBBBBb', 'byyyyyyyyyyyyb', 'bBBBBByyBBBBBb', 'bBBBBkyykBBBBb', 'bbbbbbbbbbbbbb', 'bBBBBBBBBBBBBb', 'bbbbbbbbbbbbbb',
], { b: '#6E3A24', B: '#B5603F', y: '#F7C548', Y: '#FFF3A8', K: '#2A1A1A', k: '#3D2B1F' }));
export const fakkel = (f = 0) => cached('fakkel' + f % 2, () => sprite(f % 2 ? ['..r..', '.ryr.', '.yYy.', 'rYWYr', '.yYy.', '.bbb.', '..b..', '..b..', '..b..'] : ['.r...', '..ry.', '.yYy.', 'ryWYr', '.yYy.', '.bbb.', '..b..', '..b..', '..b..'], { r: '#E8484A', y: '#FFA94D', Y: '#FFD43B', W: '#FFF3C8', b: '#6E4630' }));
/** the dark mouth of the cave, painted on the rock face */
export const grotmond = () => cached('grotmond2', () => gridSprite(30, 30, (x, y) => { const dx = x + .5 - 15, d = dx * dx / (11.5 * 11.5) + ((y + .5 - 30) / 27) ** 2; if (d > 1.12) return null; if (d > 1) return (x + y) % 3 ? (x * 7 + y) % 5 ? '#8F7FA6' : '#8CC98A' : '#7C6C94'; if (y > 26) return '#E8B86A'; return d > .7 ? '#C98F5A' : d > .4 ? '#F2B95E' : '#FFE6A8'; }));   // warm light shines out of it
export const lichtbundel = () => cached('licht', () => gridSprite(20, 48, (x, y) => { const half = 3 + y * .14, d = Math.abs(x + .5 - 10); if (d > half) return null; return (x + Math.floor(y / 3)) % 4 === 0 ? '#FFF8D8' : '#FFF1B0'; }, { outline: false }));
export const vleermuis = (f = 0) => cached('vleer' + f % 2, () => sprite(f % 2 ? ['w.......w', 'ww.kkk.ww', 'wwwkWkwww', '.wwkkkww.', '...k.k...'] : ['...kkk...', '..wkWkw..', '.wwkkkww.', 'ww.....ww', 'w.......w'], { k: '#4A3F6B', w: '#6E5FA0', W: '#FFE08A' }));
export const tuinpoort = () => cached('tuinpoort', () => gridSprite(26, 34, (x, y) => { const cx = x + .5 - 13; if (y < 13 && cx * cx + (y - 13) ** 2 > 169) return null; const edge = Math.abs(cx) > 11 || (y < 13 && cx * cx + (y - 13) ** 2 > 120); if (edge) return '#F7C548'; if (Math.abs(cx) < .8) return '#B8862E'; if ((y > 15 && y < 19) && Math.abs(Math.abs(cx) - 4) < 1.5) return '#FFF3A8'; return (Math.floor(cx + 20) % 5 === 0) ? '#D9A43A' : '#EDBF4E'; }));
const PROPS = {
  berk: ISLE.berk, bloesem: ISLE.bloesem, zonnebloemen: ISLE.zonnebloemen, lolly: ISLE.lolly, wolkstruik: ISLE.wolkstruik, kristalbloem: ISLE.kristalbloem, cipres: ISLE.cipres, lavendel: ISLE.lavendel, bol: ISLE.bol, helm: ISLE.helm,
  druipsteen, kristal, harnas, zuil, muntberg,
  bramble, boulder, plas, rainbowtree, gat, regenboogbrug,
  tree: s => PX.treeRound(s), pine: s => PX.pine(s), bush: s => PX.bush(s), palm, rock, apple: appleTree, oak, stump, log, fern, rose, hedge, sign, scarecrow, umbrella, sandcastle, boat, statue, flag, trough, hay,
};
const SCALE = { berk: 1.25, bloesem: 1.3, lolly: 1.2, cipres: 1.25, zonnebloemen: 1.1, zuil: 1.1, harnas: 1.15, rainbowtree: 1.5, tree: 1.25, pine: 1.25, apple: 1.25, oak: 1.5, palm: 1.35, flag: 1.2, statue: 1.15, scarecrow: 1.05 };
export function propArt(kind, seed = 1) { if (kind.startsWith('rots-')) return ISLE.rots(seed, kind.slice(5)); return (PROPS[kind] || PROPS.bush)(seed); }
export const propScale = kind => SCALE[kind] || 1;
export { bigMushroom };

/* ================= toys: one for every island (world-toys.js, world-play.js) ================= */
export const gieter = (full = false) => cached('gieter' + full, () => sprite(['....hhhh.....', '...h....h....', full ? 's..cwwwwc....' : 's..cccccc....', '.s.cCCCCc.h..', '..scCCCCchh..', '...cCCCCc.h..', '...cCCCCc....', '...cccccc....'], { c: '#4DABF7', C: '#8FD3FF', h: '#3E7FC0', s: '#3E7FC0', w: '#E8FAFF' }));
export const drop = () => cached('drop', () => sprite(['.b.', 'bbb', 'bBb', '.b.'], { b: '#6CC6F0', B: '#E8FAFF' }, { outline: '#3E9AD6' }));
const POT = ['.kkkkkkk.', 'ttttttttt', '.tTTTTTt.', '.tTTTTTt.', '..ttttt..'];
const PLANT = [
  ['....g....'],
  ['....g.g..', '..g.gg...', '...gg....', '....g....'],
  ['....p....', '...ppp...', '...gpg...', '....g....', '..g.g....', '...gg.gg.', '....ggg..', '....g....'],
  ['...ppp...', '..ppypp..', '..pyyyp..', '..ppypp..', '...ppp...', '....g....', '..g.g....', '...gg.gg.', '....ggg..', '....g....', '....g....'],
];
const PETAL = ['#FFD43B', '#FF7EB6', '#B9A3F0', '#FF6B6B'];
/** a flower pot: stage 0 a seed, 1 a sprout, 2 a bud, 3 in bloom */
export const pot = (stage = 0, seed = 0) => cached('pot' + stage + seed % 4, () => sprite([...PLANT[Math.max(0, Math.min(3, stage))], ...POT], { g: '#5DC88A', p: PETAL[seed % 4], y: seed % 4 ? '#FFD43B' : '#8A5A3B', k: '#6E4630', t: '#D2654A', T: '#E88A6B' }));
export const emmer = () => cached('emmer', () => sprite(['..hhhhh..', '.h.....h.', 'rrrrrrrrr', 'rRRRRRRRr', '.rRRRRRr.', '.rRRRRRr.', '.rrRRRrr.', '..rrrrr..'], { r: '#FF5E9C', R: '#FF9EC7', h: '#8A5A3B' }));
const SAND = [
  ['..ssssss..', '..sSSSSs..', '.ssSSSSss.', '.sSSSSSSs.', '.sSSSSSSs.', 'ssssssssss'],
  ['...s.ss.s...', '...ssssss...', '...sSSSSs...', '...sSSSSs...', '.s.sSSSSs.s.', '.ssssSSssss.', '.sSSSSSSSSs.', '.sSSSSSSSSs.', '.sSSSSSSSSs.', 'ssssssssssss'],
  ['.....kff....', '.....kfff...', '.....k......', '...s.ss.s...', '...ssssss...', '...sSSSSs...', '...sSwSSs...', '.s.sSSSSs.s.', '.ssssSSssss.', '.sSSSSSSSSs.', '.sSSSddSSSs.', '.sSwSddSSPs.', 'ssssssddssss'],
];
/** a sand tower, 1 to 3 buckets high (the third gets a flag, a door and shells) */
export const zandtoren = (level = 1) => cached('zand' + level, () => sprite(SAND[Math.max(1, Math.min(3, level)) - 1], { s: '#D9AE6C', S: '#F6DDA6', k: '#8A5A3B', f: '#FF5E9C', d: '#A87B45', w: '#FFFFFF', P: '#FFB3CC' }));
export const vlieger = () => cached('vlieger', () => gridSprite(11, 13, (x, y) => { const dx = x + .5 - 5.5, dy = y + .5 - 5.5; if (Math.abs(dx) / 5.5 + Math.abs(dy) / (dy < 0 ? 5.5 : 7.5) > 1) return null; if (Math.abs(dx) < .6 || Math.abs(dy) < .6) return '#FFFFFF'; return dx < 0 ? (dy < 0 ? '#FF5E9C' : '#FFD43B') : (dy < 0 ? '#4DABF7' : '#69DB7C'); }));
export const strikje = (seed = 0) => cached('strikje' + seed % 3, () => sprite(['c.c', 'ccc', 'c.c'], { c: ['#FF5E9C', '#FFD43B', '#4DABF7'][seed % 3] }));
export const pluis = (full = true) => cached('pluis' + full, () => sprite(full ? ['.wWw.', 'wWwWw', 'WwWwW', 'wWwWw', '.wgw.', '..g..', '..g..', '..g..'] : ['.....', '.....', '.....', '..y..', '..g..', '..g..', '..g..', '..g..'], { w: '#FFFFFF', W: '#E3EAF5', g: '#5DC88A', y: '#F5E08A' }, full ? { outline: '#A9B4CC' } : {}));
export const pluisje = () => cached('pluisje', () => sprite(['w.w', '.w.', '.k.'], { w: '#FFFFFF', k: '#B8A98A' }, { outline: false }));
export const PAINTS = ['#FF5E6C', '#FFD43B', '#4DABF7'];
export const verfplas = col => cached('verf' + col, () => gridSprite(18, 12, (x, y) => { const dd = ((x + .5 - 9) / 9) ** 2 + ((y + .5 - 6) / 6) ** 2; if (dd > 1) return null; return (x + y * 2) % 9 === 0 || (x === 5 && y === 3) || (x === 6 && y === 3) ? mix(col, '#ffffff', .65) : dd > .78 ? mix(col, '#ffffff', .25) : col; }, { outline: mix(col, '#2B1E3A', .35) }));
export const schans = () => cached('schans', () => gridSprite(20, 10, (x, y) => { const h = 2 + x * .42; if (y < 10 - h) return null; if (y < 10 - h + 2) return Math.floor(x / 3) % 2 ? '#FFD43B' : '#E8484A'; return x % 5 === 4 ? '#8A5A3B' : (y % 3 === 0 ? '#D6A674' : '#C18F5C'); }));
export const bak = () => cached('bak', () => sprite(['b..........b', 'bbbbbbbbbbbb', 'bBBBBBBBBBBb', 'bBBBBBBBBBBb', '.bbbbbbbbbb.', '....kkkk....', '....kwwk....', '....kkkk....'], { b: '#B5823F', B: '#E8C08A', k: '#3D2B4F', w: '#D8DCE8' }));
export const boei = () => cached('boei', () => sprite(['...k...', '..yk...', '...k...', '..rrr..', '.rrrrr.', '.wwwww.', '.rrrrr.', '..rrr..'], { k: '#5E4A3A', y: '#FFD43B', r: '#E8484A', w: '#FFFFFF' }));
export const kistje = () => cached('kistje', () => sprite(['.bbbbbbb.', 'bByyyyyBb', 'bbbbybbbb', 'bBBByBBBb', 'bBBBBBBBb', 'bbbbbbbbb'], { b: '#8A5A3B', B: '#B5823F', y: '#FFD43B' }));
export const walvis = () => cached('walvis', () => gridSprite(28, 13, (x, y) => { const dd = ((x + .5 - 14) / 14) ** 2 + ((y + .5 - 13) / 12.5) ** 2; if (dd > 1) return null; if (x >= 20 && x <= 21 && y >= 6 && y <= 7) return y === 6 && x === 21 ? '#FFFFFF' : EYE; if (y === 10 && x > 16 && x < 26) return '#2F5FA0'; if (y > 10 && x > 3) return '#DCEBFA'; return (x * 3 + y * 5) % 17 === 0 ? '#7CA8E6' : '#5B8FD6'; }));
export const walvisschaduw = () => cached('walvisS', () => gridSprite(24, 10, (x, y) => ((x + .5 - 12) / 12) ** 2 + ((y + .5 - 5) / 5) ** 2 <= 1 ? ((x + y) % 2 ? '#2B74B8' : '#2F7FC0') : null, { outline: false }));
/** the owl who keeps the stall: snowy white with lilac wings and big round eyes, so she stands out against the dark booth */
export const uil = () => cached('kraamuil', () => sprite([
  '.LL........LL.',
  '.LWL......LWL.',
  '..WWWWWWWWWW..',
  '.WWWWWWWWWWWW.',
  'WWyyyyWWyyyyWW',
  'WWykkyWWykkyWW',
  'WWykwyWWywkyWW',
  'WWyyyyooyyyyWW',
  '.WWWWWooWWWWW.',
  'LLWWPWWWWPWWLL',
  'LLWWPPPPPPWWLL',
  'LLWcWPWWPWcWLL',
  'LLWWWcWWcWWWLL',
  '.LLWcWWWWcWLL.',
  '..LWWWWWWWWL..',
  '...ff....ff...',
], { W: '#FFFDF8', L: '#B49CEB', y: '#FFE08A', k: EYE, w: '#FFFFFF', o: '#FF9F43', P: '#FF7EB6', c: '#DCD2F4', f: '#FF9F43' }));
/** the stall's parts (world-toys.js builds the booth from them): the dark back wall with bunting, the counter's
 *  painted front, and the striped awning with its scalloped edge */
export const kraamWand = () => cached('kraamWand', () => gridSprite(34, 22, (x, y) => {
  if (x < 2 || x > 31) return '#F4EDE4';
  if (y < 4) { const k = Math.floor((x - 2) / 5), dx = (x - 2) % 5; return y <= (dx <= 2 ? dx : 4 - dx) ? ['#FF7EB6', '#FFD43B', '#4DABF7', '#5DC88A', '#B49CEB', '#FF9F43'][k % 6] : '#4A3560'; }   // a string of little flags
  return (x * 5 + y * 3) % 29 === 0 ? '#6A5285' : '#4A3560';
}, { outline: false }));
export const kraamToonbank = () => cached('kraamToonbank', () => gridSprite(34, 10, (x, y) => {
  if (y === 0) return '#FFFFFF'; if (y === 9) return '#7FC9AE';
  const hx = x - 16.5, hy = y - 4.2, heart = (hx * hx + (hy - Math.abs(hx) * .55) ** 2) < 7;   // a heart in the middle
  if (heart && y > 1 && y < 8 && Math.abs(hx) < 4) return '#FF7EB6';
  return Math.floor(x / 4) % 2 ? '#A8E6CF' : '#C4F0DD';
}, { outline: false }));
export const kraamLuifel = () => cached('kraamLuifel', () => gridSprite(34, 10, (x, y) => {
  const stripe = Math.floor((x + 1) / 4) % 2 ? '#FF7EB6' : '#FFFFFF';
  if (y < 7) return stripe;
  const dx = (x + 1) % 4; return y - 7 < (dx === 0 || dx === 3 ? 1 : 3) ? (stripe === '#FFFFFF' ? '#F2E6EE' : '#E0559A') : null;   // scallops
}, { outline: false }));
const DRESS_ICON = ['..d...d..', '..ddddd..', '...ddd...', '..ddddd..', '.ddddddd.', '.ddddddd.', 'DDDDDDDDD'];
/** a picture of something to wear (the cards of the stall) */
export function wearIcon(id) {
  return cached('wear' + id, () => {
    switch (id) {
      case 'krans': return sprite(['..FlGlW..', '.Gl...lF.', '.Wl...lG.', '..lFlGl..'], { F: '#FF7EB6', G: '#FFD43B', W: '#FFFFFF', l: '#5DC88A' });
      case 'strik': return sprite(['RR.....RR', 'RRRR.RRRR', 'RRRRrRRRR', 'RRRR.RRRR', 'RR.....RR'], { R: '#E8484A', r: '#B5303A' });
      case 'hoed': return sprite(['...MMMMM...', '.MMwMMMMMM.', 'MMMMMMMwMMM', 'MwMMMMMMMMM', '....sss....', '....sss....'], { M: '#E8484A', w: '#FFFFFF', s: '#FFF1DC' });
      case 'kroon': return PX.crown();
      case 'ketting': return sprite(['W.......W', '.P.....P.', '..W...W..', '...PWP...'], { W: '#FFFFFF', P: '#FFB3CC' });
      case 'knuffel': return sprite(['.b...b.', '.b...b.', '.bbbbb.', '.bkbkb.', '.bbnbb.', '..bbb..', '.bbbbb.', '.b.b.b.'], { b: '#FFFFFF', k: EYE, n: '#FF8FB1' }, { outline: '#B9A3F0' });
      case 'ballon': return PX.balloon('#FF6B6B');
      case 'vleugels': return sprite(['vV.....Vv', 'vVV...VVv', '.vVV.VVv.', '..vV.Vv..'], { v: '#D9CCFF', V: '#FFFFFF' }, { outline: '#9B72E8' });
      case 'jurkgeel': return sprite(DRESS_ICON, { d: '#FFD43B', D: '#E0A020' });
      case 'jurkblauw': return sprite(DRESS_ICON, { d: '#6CC6F0', D: '#3E9AD6' });
      case 'jurkregenboog': return sprite(DRESS_ICON.map((r, i) => r.replace(/[dD]/g, String(1 + i % 6))), { 1: PX.RAINBOW[0], 2: PX.RAINBOW[1], 3: PX.RAINBOW[2], 4: PX.RAINBOW[3], 5: PX.RAINBOW[4], 6: PX.RAINBOW[5] });
      default: return PX.star();
    }
  });
}

/* ================= collectibles ================= */
export const shell = (seed = 0) => cached('shell' + (seed % 3), () => { const c = ['#FFB3CC', '#FFE8CC', '#D9CCFF'][seed % 3]; return sprite(['..ccccc..', '.cWcLcWc.', 'cWcLcLcWc', 'cWcLcLcWc', '.cWcLcWc.', '..cccc...', '...cc....'], { c, W: '#FFFFFF', L: mix(c, '#8a6fa0', .3) }); });
export const coin = () => cached('coin', () => sprite(['.yyyyy.', 'yYYyyyy', 'yYyoyyo', 'yyyoyyo', 'yyyoyyo', 'yyyyyoo', '.ooooo.'], { y: '#FFD43B', Y: '#FFF3A8', o: '#E0A020' }));
export const coinSide = () => cached('coinS', () => sprite(['..yyy..', '..Yyy..', '..yyo..', '..yyo..', '..yyo..', '..yoo..', '..ooo..'], { y: '#FFD43B', Y: '#FFF3A8', o: '#E0A020' }));
export const carrotTop = () => cached('ctop', () => sprite(['g..g..g', '.g.g.g.', '.g.gGg.', '..GgG..', '..ooo..'], { g: '#5DC88A', G: '#3A9E69', o: '#FF8C42' }));
export const starfish = () => cached('starfish', () => sprite(['....o....', '....o....', '...ooo...', 'ooooYoooo', '.ooYoYoo.', '..ooooo..', '..oo.oo..', '.oo...oo.'], { o: '#FF9E6B', Y: '#FFD9A8' }));
export const feather = () => cached('feather', () => sprite(['......ww', '....wwWw', '...wWWw.', '..wWWw..', '.wWww...', '.ww.....', 'k.......'], { w: '#FFFFFF', W: '#D9E6FF', k: '#8A5A3B' }));
const FLOWER_COLS = ['#FF7EB6', '#FFD43B', '#B9A3F0', '#FFFFFF', '#FF9E6B'];
/** world sprite for a collectible of a type (seed varies the look) */
export function itemArt(type, seed = 0) {
  switch (type) {
    case 'bloem': return PX.flower(FLOWER_COLS[seed % FLOWER_COLS.length]);
    case 'appel': return PX.apple();
    case 'paddenstoel': return PX.mushroom();
    case 'schelp': return shell(seed);
    case 'wortel': return carrotTop();
    case 'diamant': return PX.gem();
    case 'munt': return coin();
    case 'vis': return fish(seed);
    default: return PX.star();
  }
}
/** icon for HUD / speech (a carrot shows as a whole carrot) */
export function itemIcon(type) { return type === 'wortel' ? PX.carrot() : itemArt(type, 0); }

/* ================= animals ================= */
export const crab = () => cached('crab', () => sprite(['r.k...k.r', 'rr.r.r.rr', '.rrrrrrr.', 'rrkrrrkrr', '.rrrrrrr.', 'r.r...r.r'], { r: '#F0625A', k: EYE }));
export const squirrel = () => cached('squirrel', () => sprite(['........bb...', '.......bBBb..', '..b.b..bBBBb.', '.bbbbb..bBBb.', '.bkbbb..bBBb.', 'nbbbbb.bBBb..', '.bwwbbbbBb...', '..wwbbbbb....', '..wwbbbb.....', '.bb..bb......'], { b: '#C9773F', B: '#E8A56A', k: EYE, n: EYE, w: '#FFE8CC' }));
export const deer = () => cached('deer', () => sprite([
  '.........a.a....', '.........aaa....', '........e.b.e...', '.........bbbb...', '.........bkbbn..', '.........bbbb...', '.........bb.....', 't.bbbbbbbbb.....', 'tbbwbbwbbbb.....', '.bbbbwbbwbb.....', '.bbbbbbbbbb.....', '.b.b....b.b.....', '.b.b....b.b.....', '.f.f....f.f.....',
], { a: '#8A5A3B', b: '#D9A066', e: '#B8804A', k: EYE, n: EYE, w: '#FFF6E3', t: '#FFFFFF', f: '#6E4630' }));
export const dragon = () => cached('dragon', () => sprite([
  '....y...y.......', '...gg..gg.......', '..gggggggg......', '..gkggggkg...p..', '..gkggggkg..pp..', '..ggnggngg.ppg..', '..gcggggcg.pgg..', '...gggggg.pggg..', '..ggwwwwgggggg..', '.gggwwwwggggg...', '.g.gwwwwgg..gg..', '...gg..gg....gy.', '...ff..ff.......',
], { g: '#7ED9A0', y: '#FFD43B', k: EYE, n: '#3A9E69', c: '#FF8FB1', w: '#FFF3A8', p: '#B9A3F0', f: '#3A9E69' }));
export const gull = () => cached('gull', () => sprite(['...www...', '..wwkwoo.', '..wwww...', 'gggwwww..', '.ggggww..', '..wwww...', '...o.o...'], { w: '#FFFFFF', g: '#B8BCCB', k: EYE, o: '#FF8C42' }));

/* little things that make the world feel alive */
const BIRD_COL = [['#6FB7E8', '#3F86C4'], ['#F0625A', '#B8323A'], ['#FFD43B', '#E0A020']];
/** frame: 'sit' | 'up' | 'down' (wings) */
export const bird = (seed = 0, frame = 'sit') => cached('bird' + (seed % 3) + frame, () => {
  const [b, B] = BIRD_COL[seed % 3], pal = { b, B, k: EYE, o: '#FF8C42', w: '#FFFFFF' };
  if (frame === 'sit') return sprite(['..bbb...', '.bbkbo..', 'Bbbbb...', 'BBbww...', '.Bbb....', '..o.o...'], pal);
  return sprite(frame === 'up' ? ['B.....B..', 'BB...BB..', '.BbbbBko.', '..bbbb...', '...ww....'] : ['.........', '..bbbbko.', '.BbbbbB..', 'BB.ww.BB.', 'B.....B..'], pal);
});
export const fish = (seed = 0) => cached('fish' + (seed % 2), () => sprite(['..fff...f', '.fFfff.ff', 'fkfffffff', '.fffff.ff', '..fff...f'], { f: seed % 2 ? '#FF9E6B' : '#FFD43B', F: '#FFFFFF', k: EYE }));
export const leaf = (seed = 0) => cached('leaf' + (seed % 3), () => sprite(['.gg', 'ggG', 'G..'], { g: ['#7CCB64', '#5DB35A', '#F5B83D'][seed % 3], G: '#3F8A4A' }, { outline: false }));
export const note = (seed = 0) => cached('note' + (seed % 3), () => sprite(['..nn', '..n.', '..n.', 'nnn.', 'nnn.'], { n: ['#FF5E9C', '#4DABF7', '#FFD43B'][seed % 3] }));
export const dizzy = () => cached('dizzy', () => sprite(['.y.', 'yyy', '.y.'], { y: '#FFD43B' }));
/* rare surprises (world-life.js): what falls out of a tree on her head, a frog in a bush, a burp, a nap */
export const eikel = () => cached('eikel', () => sprite(['..k..', '.ccc.', 'cCcCc', '.aAa.', '.aaa.', '..a..'], { k: '#6E4630', c: '#8A5A3B', C: '#B5823F', a: '#D9A066', A: '#F2C98A' }));
export const dennenappel = () => cached('denappel', () => sprite(['..b..', '.bBb.', 'bBbBb', '.bBb.', 'bBbBb', '.bBb.', '..b..'], { b: '#8A5A3B', B: '#C18F5C' }));
export const kokosnoot = () => cached('kokos', () => sprite(['.bbbb.', 'bBbbkb', 'bbbbbb', 'bkbbBb', '.bbbb.'], { b: '#7A5236', B: '#A87B55', k: '#3D2B1F' }));
export const kikker = (frame = 'sit') => cached('kikker' + frame, () => sprite(frame === 'sit'
  ? ['.ww..ww.', 'wkgggkwg', 'ggggggg.', 'gLLLLLg.', 'gglllgg.', 'g.g..g.g']
  : ['.ww..ww.', 'wkgggkw.', 'ggggggg.', '.gLLLg..', 'g.lll.g.', 'g.....g.'], { g: '#69C46A', L: '#FF8FB1', l: '#C8F0B0', w: '#FFFFFF', k: EYE }));
export const burpBel = (seed = 0) => cached('burp' + seed % 6, () => { const c = PX.RAINBOW[seed % PX.RAINBOW.length]; return gridSprite(6, 6, (x, y) => { const d = (x + .5 - 3) ** 2 + (y + .5 - 3) ** 2; return d > 8 ? null : x === 1 && y === 1 ? '#FFFFFF' : d > 5 ? c : mix(c, '#FFFFFF', .7); }); });
export const appeltje = () => cached('appeltje', () => sprite(['..g.', '.rrr', 'rRrr', 'rrrr', '.rr.'], { r: '#F0525A', R: '#FFB3B3', g: '#5DC88A' }));
/* weather (world-weather.js) */
export const sneeuwhoop = () => cached('sneeuwhoop', () => gridSprite(14, 6, (x, y) => { const d = ((x + .5 - 7) / 7) ** 2 + ((y + .5 - 6) / 6) ** 2; return d > 1 ? null : y < 2 && x > 4 && x < 8 ? '#FFFFFF' : (x + y) % 5 === 0 ? '#DDEBFA' : '#F4F9FF'; }, { outline: '#A9B9D6' }));
export const bladerhoop = (seed = 0) => cached('blader' + seed % 2, () => gridSprite(16, 7, (x, y) => { const d = ((x + .5 - 8) / 8) ** 2 + ((y + .5 - 7) / 7) ** 2; if (d > 1) return null; const k = (x * 7 + y * 13 + seed * 5) % 9; return ['#F5B83D', '#E8743A', '#D9532F', '#FFD43B', '#C9773F', '#F5B83D', '#E8743A', '#B5823F', '#FF9E6B'][k]; }, { outline: '#8A4A2B' }));
/** the snowman: nose true/false (the rabbit may have eaten it), hatUp lifts the hat */
export const sneeuwpop = (nose = true, hatUp = 0) => cached('sneeuwpop' + nose + hatUp, () => sprite([
  ...(hatUp ? ['.....kkkk.....', '.....kkkk.....', '....kkkkkk....', '..............'] : ['..............', '.....kkkk.....', '.....kkkk.....', '....kkkkkk....']),
  '....wwwwww....', '...wwewwewW...', '...wwwwnnoo...', '...wwwwwwwW...', '....wwwwww....', '..wwwwwwwwww..', '.wwwwwkwwwwWw.', 'swwwwwwwwwwWWs', '.wwwwwkwwwwWw.', '..wwwwwwwwWW..', '.wwwwwwwwwwwW.',
  'wwwwwwwwwwwwWW', 'wwwwwwwwwwwwWW', '.wwwwwwwwwwWW.', '..wwwwwwwwWW..'].map(r => nose ? r : r.replace(/n|o/g, 'w')), { w: '#F7FBFF', W: '#D6E4F5', k: '#3D2B4F', e: '#2B1E3A', n: '#FF8C42', o: '#FF8C42', s: '#8A5A3B' }));
export const zzz = () => cached('zzz', () => sprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#8FA8FF' }));

/* ================= eggs ================= */
/** k = {base, spot, band} colours; part: 'whole' | 'top' | 'bottom' (cracked halves) */
export function egg(k, part = 'whole') {
  return cached('egg' + k.base + k.spot + part, () => gridSprite(13, 16, (x, y) => {
    const rx = y < 9 ? 4.4 + y * .2 : 6.2, dd = ((x + .5 - 6.5) / rx) ** 2 + ((y + .5 - 9) / (y < 9 ? 9 : 7)) ** 2; if (dd > 1) return null;
    const crack = 7 + ((x % 4) < 2 ? (x % 2) : 1 - (x % 2));
    if (part === 'top' && y > crack) return null; if (part === 'bottom' && y <= crack + 1) return null;
    if ((y === 10 || y === 11) && (x + (y % 2) * 2) % 4 < 2) return k.band;
    if ([[4, 4], [8, 3], [9, 6], [3, 7], [6, 6], [4, 13], [9, 13], [7, 14], [2, 11], [11, 9]].some(([a, b]) => a === x && b === y)) return k.spot;
    if (x <= 4 && y >= 3 && y <= 5 && x >= 3 && part !== 'bottom') return '#FFFFFF';
    return (x + y > 17) ? mix(k.base, '#8a6fa0', .22) : k.base;
  }));
}

/* ================= unicorn looks ================= */
const BABY_TOP = [
  '..............h...',
  '.............hH...',
  '..........rbbbb...',
  '.........rrbbbbbb.',
  '.........obbbbkbb.',
  '........oobbbbkbnn',
  '........yybbbpbnnn',
  '........yBbbbbnnn.',
  '.r......gBbbbb....',
  'rr.bbbbbbbbbbb....',
  'ro.bbbbbbbbbbb....',
  '.oybbbbbbbbbbb....',
  '..yBBBBBBBBBBB....',
];
const BABY_LEGS = { idle: ['...BB.bb.BB.bb....', '...ff.ff.ff.ff....'], w1: ['...BB.ff.ff.bb....', '...ff.......ff....'], w2: ['...ff.bb.BB.ff....', '......ff.ff.......'] };   // a trot: diagonal pairs lift
function babySprite(u, frame, sleep) {
  let top = BABY_TOP; if (sleep) top = top.map((r, i) => i === 4 ? r.replace('k', 'b') : (i === 5 ? r.replace('k', 'B') : r));
  return sprite([...top, ...BABY_LEGS[frame] || BABY_LEGS.idle], PX.uniPalette(u), { key: 'baby' + u.body + u.mane + u.horn + frame + sleep });
}
const MARKS = {
  vlekken: [[6, 13], [7, 13], [6, 14], [10, 14], [11, 14], [11, 15], [15, 13], [16, 13], [16, 14], [8, 15], [13, 15]],
  ster: [[8, 13], [7, 14], [8, 14], [9, 14], [8, 15]],
  hartje: [[7, 13], [9, 13], [7, 14], [8, 14], [9, 14], [8, 15]],
  sterren: [[6, 13], [9, 14], [13, 13], [16, 15], [11, 15], [18, 14]],
};
const WING = ['..www.', '.wwwww', 'wwWwww', '.wWWww', '..wWww'];
/** u = {body, mane, horn, mark?, wings?}; opts.baby draws the foal */
export function uniSprite(u, frame = 'idle', sleep = false, opts = {}) {
  if (opts.baby) return babySprite(u, frame, sleep);
  const base = PX.unicorn(u, frame, sleep); if (!u.mark && !u.wings) return base;
  return cached(['uni', u.body, u.mane, u.horn, u.mark, u.wings, frame, sleep].join('|'), () => {
    const c = copy(base), ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
    const at = (x, y) => ((y + 1) * c.width + x + 1) * 4;
    const is = (x, y, hex) => { const i = at(x, y), v = rgb(hex); return d[i + 3] && d[i] === v[0] && d[i + 1] === v[1] && d[i + 2] === v[2]; };
    const set = (x, y, hex) => { const i = at(x, y), v = rgb(hex); d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = 255; };
    const body = u.body.toUpperCase() === '#FFFFFF' ? '#FFFFFF' : u.body, shade = mix(u.body, '#8a6fa0', .25);
    const accent = u.mane === 'rainbow' ? '#FF9EC7' : u.mane;
    const onBody = (x, y) => is(x, y, body) || is(x, y, shade);
    if (u.mark === 'sokken') { for (let y = 17; y <= 18; y++) for (let x = 0; x < 26; x++) if (onBody(x, y)) set(x, y, mix(accent, '#ffffff', .25)); }
    else if (MARKS[u.mark]) { const col = u.mark === 'vlekken' ? mix(u.body, accent, .55) : u.mark === 'hartje' ? '#FF5E9C' : u.mark === 'ster' ? '#FFC21A' : '#FFE066'; for (const [x, y] of MARKS[u.mark]) if (onBody(x, y)) set(x, y, col); }
    if (u.wings) {
      const put = []; WING.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { set(4 + i, 8 + j, row[i] === 'W' ? mix(accent, '#ffffff', .25) : mix(accent, '#ffffff', .65)); put.push([4 + i, 8 + j]); } });
      for (const [x, y] of put) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < -1 || Y < -1 || X > 26 || Y > 20) continue; const i = at(X, Y); if (!d[i + 3]) set(X, Y, PX.OUT); }
    }
    ctx.putImageData(img, 0, 0); return c;
  });
}
/** frames for a world character: the egg, or the little unicorn that came out of it (she never changes into the big one) */
export function companionFrames(u, stage, kindDef) {
  if (stage === 'ei') { const e = egg(kindDef); return { idle: e, w1: e, w2: e }; }
  const o = { baby: true };
  return { idle: uniSprite(u, 'idle', false, o), w1: uniSprite(u, 'w1', false, o), w2: uniSprite(u, 'w2', false, o), blink: uniSprite(u, 'idle', true, o) };
}
export const bedIcon = () => cached('bed', () => sprite(['w...........', 'w...........', 'wpp.........', 'wppbbbbbbbbb', 'wwwbbbbbbbbb', 'wwwwwwwwwwww', 'w..........w'], { w: '#A97450', p: '#FFFFFF', b: '#FF7EB6' }));
/** the sword's slash: a white crescent with a cool blue rim, pointing right (world-sword.js turns it where she slashes) */
export const slashArc = () => cached('slash', () => gridSprite(26, 26, (x, y) => {
  const dx = x + .5 - 13, dy = y + .5 - 13, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (Math.abs(a) > 1.75) return null;
  const k = Math.cos(a / 1.75 * Math.PI / 2), outer = 12.6, inner = outer - .8 - 4.2 * k; if (r > outer || r < inner) return null;
  return r > outer - 1.1 ? '#BFE8FF' : r < inner + 1 ? '#DDF3FF' : '#FFFFFF';
}, { outline: false }));
/** the three saves each have their own colour, so the girls know theirs without reading */
export const SLOT_COLS = [['#FF9EC7', '#FFD7E8'], ['#B9A3F0', '#E4D9FF'], ['#7FD69B', '#CDF3D8']];
/** the save button: three little cards in the saves' colours, the one being played stands up */
export const slotsIcon = cur => cached('slots' + cur, () => gridSprite(14, 8, (x, y) => {
  const k = Math.floor(x / 5), cx = x % 5; if (cx === 4 || k > 2) return null;
  const top = k === cur - 1 ? 0 : 3; if (y < top) return null;
  return y === top && cx < 2 ? SLOT_COLS[k][1] : SLOT_COLS[k][0];
}));
/** throw a save away (held down, see saves.js) */
export const binIcon = () => cached('bin', () => sprite(['...dd...', '.dddddd.', 'dddddddd', '........', '.gGgGgg.', '.gGgGgg.', '.gGgGgg.', '.gGgGgg.', '..gggg..'], { d: '#7A6A8A', g: '#C3B5CF', G: '#8C7A9A' }));
export const mapIcon = () => cached('mapi', () => sprite(['pppp.pppp.pp', 'pgpppgbbppgp', 'pggpppbbpggp', 'ppgprppbpppp', 'pppprrpppgpp', 'pp.pppp.pppp'], { p: '#F2DDB4', g: '#69DB7C', b: '#4DABF7', r: '#FF5E9C' }));

/** a tiny picture of a house you can go into, in its own colours (wish chips, map) */
const HOUSE_COL = { stal: ['#D2654A', '#7A4A3A', '#6B3F2A'], atelier: ['#8DBDEB', '#4A6FB8', '#9B72E8'], bakkerij: ['#FFD7E2', '#D16A93', '#8B5A3C'], huisje: ['#FFF1C9', '#E8616B', '#4DABF7'] };
export function houseIcon(id) {
  if (id === 'kermis') return PX.gridSprite(16, 15, (x, y) => {
    const cx = Math.abs(x - 7.5); if (y < 2) return cx < 1 && y === 1 || (x === 8 || x === 9) && y === 0 ? '#FFD43B' : null;
    if (y < 8) return cx <= (y - 1) * 1.15 + .5 ? (Math.floor((x + 1) / 2) % 2 ? '#FFF1DC' : '#E85D75') : null;
    if (cx > 6.5) return null; if (cx < 2 && y > 9) return '#3D2B4F'; return Math.floor(x / 2) % 2 ? '#FFF1DC' : '#E85D75';
  });
  const [wall, roof, door] = HOUSE_COL[id] || HOUSE_COL.huisje;
  return PX.gridSprite(16, 15, (x, y) => {
    const cx = Math.abs(x - 7.5); if (y < 7) return cx <= y + 1.5 ? roof : null;
    if (cx > 6) return null; if (cx < 1.6 && y > 9) return door; if (y > 8 && y < 12 && (x === 3 || x === 12)) return '#BFE3FF'; return wall;
  });
}

/** a pebble small enough to pick up and throw (world-life.js) */
export const kei = (seed = 0) => cached('kei' + seed, () => sprite(seed % 2 ? ['.ggg..', 'gGGgg.', 'gGggdg', '.gddd.'] : ['..gg...', '.gGGgg.', 'gGGgggd', 'gggggdd', '.dddd..'], { g: '#B4B9C8', G: '#DCE0EA', d: '#8B90A4' }));

/* ================= the unicorn race (act-race.js) ================= */
export const raceArch = () => cached('raceArch', () => gridSprite(26, 24, (x, y) => {
  if ((x < 2 || x > 23) && y > 1) return Math.floor((y - 2) / 3) % 2 ? '#FFFFFF' : '#FF5E9C';            // candy-striped poles
  if (y >= 2 && y <= 7 && x >= 2 && x <= 23) return (Math.floor((x - 2) / 2) + Math.floor((y - 2) / 2)) % 2 ? '#FFFFFF' : '#3D2B4F';   // the chequered banner
  if (y < 2 && (x === 0 || x === 1 || x === 24 || x === 25)) return '#FFD43B';
  return null;
}));
export const medal = place => cached('medal' + place, () => gridSprite(11, 15, (x, y) => {
  const col = ['#FFD43B', '#D3DAE6', '#E0965A'][place - 1] || '#E0965A', dk = ['#E0A020', '#9AA5B8', '#B5673A'][place - 1] || '#B5673A';
  if (y < 6) { const a = Math.abs(x - 5); return a >= 1 + (5 - y) * .55 && a <= 3 + (5 - y) * .55 ? (x < 5 ? '#FF5E9C' : '#4DABF7') : null; }
  const d = Math.hypot(x - 5, y - 10); if (d > 4.6) return null; if (d > 3.4) return dk;
  return Math.abs(x - 5) + Math.abs(y - 10) <= 1 ? '#FFFFFF' : col;
}));
export const againIcon = () => cached('again', () => gridSprite(15, 15, (x, y) => {
  if (Math.hypot(x - 7, y - 7) > 7.4) return null;
  return x >= 5 && x <= 11 && Math.abs(y - 7) <= (11 - x) * .75 ? '#FFFFFF' : '#3EBF6E';                 // a play triangle: once more
}));
