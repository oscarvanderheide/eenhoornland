// Art for the bigger island: ground painter, props, collectibles, eggs, baby unicorn and unicorn looks.
// Builds on pixel.js (same conventions: everything returns a <canvas>, 1px outline added automatically).
import * as PX from './pixel.js';
import { GR, PA, WA, PL, SA, SE, FO, CO, SO, BW, POND, shoreZ } from './map.js';

const { sprite, gridSprite, mix, rgb } = PX;
const EYE = '#2B1E3A';
const copy = cv => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; };
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

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
      else if (t === SA || t === SE) { const wx = tx + (px + .5) / U, wz = tz + (py + .5) / U, s = shoreZ(wx); col = wz > s - .25 ? (r() < .15 ? '#C9AE78' : '#D6BC86') : wz > s - .7 ? '#E3CB94' : (r() < .04 ? (r() < .5 ? '#DCC38C' : '#FFF6D8') : one(sandC)); }
      else if (t === CO) { const row = Math.floor((tz * U + py) / 8), bx = (tx * U + px + (row % 2) * 4) % 8, by = py % 8; col = (bx === 0 || by === 0) ? '#8F8AA3' : ['#CFCAE0', '#BDB7D2', '#DAD6E8'][(Math.floor((tx * U + px + (row % 2) * 4) / 8) * 5 + row * 3) % 3]; if (bx === 1 && by === 1) col = '#EDEAF6'; }
      else if (t === SO) { const by = py % 8; col = by < 2 ? '#6E4A32' : by === 2 ? '#A07250' : (r() < .1 ? '#9A6B48' : '#8B5E3C'); }
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
const boat = () => cached('boat', () => sprite([
  '.............m................', '.............mwww.............', '.............mwwwww...........', '.............mwwwwwww.........', '.............m................',
  'rr...........m..............rr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', '.rWWWWWWWWWWWWWWWWWWWWWWWWWWr.', '.rrrrrrrrrrrrrrrrrrrrrrrrrrrr.', '..bbbbbbbbbbbbbbbbbbbbbbbbbb..', '...bbbbbbbbbbbbbbbbbbbbbbbb...', '....BBBBBBBBBBBBBBBBBBBBBB....',
], { r: '#E8616B', W: '#FFFFFF', b: '#4DABF7', B: '#2F7FC0', m: '#8A5A3B', w: '#FFF6E3' }));
const statue = () => cached('statue', () => sprite([
  '.........y........', '........yY........', '.....y.yY.........', '....yyyyyy........', '...yyyykyyy.......', '...yyyyyyyyY......', '..Yyyyyyy.........', '..YYyyyyy.........', '..YYyyyyyyy.......', '...Yyyyyyyyy......', '...yyyyyyyyy......', '...yy.yy.yy.......', '...yy.yy.yy.......',
  '.ssssssssssssss...', '.sSSSSSSSSSSSSs...', '..ssssssssssss....', '..sSssSssSssSs....', '..ssssssssssss....', '.ssssssssssssss...', '.SSSSSSSSSSSSSS...',
], { y: '#F7C548', Y: '#D99A2B', k: EYE, s: '#D6D1E0', S: '#A9A3BD' }));
const flag = seed => cached('flag' + (seed % 2), () => { const a = seed % 2 ? '#6A7FD6' : '#E86A9A'; return sprite(['.y.......', 'yyy......', '.paaaaaa.', '.paaYaaaa', '.paaaaaa.', '.paaaa...', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', '.p.......', 'ppp......'], { y: '#F7C548', Y: '#FFF3A8', a, p: '#B8BCCB' }); });
const trough = () => cached('trough', () => sprite(['bwwwwwwwwwwwwwwwwb', 'bwWwwwWwwwwwWwwwwb', 'bbbbbbbbbbbbbbbbbb', '.bBbbbbBbbbbBbbbb.', '.bbbbbbbbbbbbbbbb.', '..B............B..'], { b: '#A97450', B: '#6E4630', w: '#5AB4E6', W: '#D8F4FF' }));
const hay = () => cached('hay', () => { const r = PX.rng(77), n = []; for (let i = 0; i < 16 * 11; i++) n.push(r()); return gridSprite(16, 11, (x, y) => { if ((y === 0 && (x < 1 || x > 14))) return null; if (x === 4 || x === 11) return '#B8323A'; return n[y * 16 + x] < .2 ? '#FFF1A8' : n[y * 16 + x] < .45 ? '#C9A23F' : '#E9C46A'; }); });
const bigMushroom = () => cached('bigmush', () => sprite(['...RRRRRR...', '.RRwRRRRwRR.', 'RRRRRwRRRRRR', 'RwRRRRRRRwRR', 'RRRRwRRRRRRR', '.RRRRRRRRRR.', '....ssss....', '....ssss....', '....sSss....', '...ssssss...'], { R: '#E8484A', w: '#FFFFFF', s: '#FFF1DC', S: '#E0CDB0' }));

const PROPS = {
  tree: s => PX.treeRound(s), pine: s => PX.pine(s), bush: s => PX.bush(s), palm, rock, apple: appleTree, oak, stump, log, fern, rose, hedge, sign, scarecrow, umbrella, sandcastle, boat, statue, flag, trough, hay,
};
const SCALE = { tree: 1.25, pine: 1.25, apple: 1.25, oak: 1.5, palm: 1.35, flag: 1.2, statue: 1.15, scarecrow: 1.05 };
export function propArt(kind, seed = 1) { return (PROPS[kind] || PROPS.bush)(seed); }
export const propScale = kind => SCALE[kind] || 1;
export { bigMushroom };

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
const BABY_LEGS = { idle: ['...BB.bb.BB.bb....', '...ff.ff.ff.ff....'], w1: ['....BBbb..BBbb....', '....ffff..ffff....'], w2: ['..BB..bb.BB...bb..', '..ff..ff.ff...ff..'] };
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
/** frames for a world character: stage 'ei' | 'baby' | 'jong' | 'groot' */
export function companionFrames(u, stage, kindDef) {
  if (stage === 'ei') { const e = egg(kindDef); return { idle: e, w1: e, w2: e }; }
  const o = { baby: stage === 'baby' };
  return { idle: uniSprite(u, 'idle', false, o), w1: uniSprite(u, 'w1', false, o), w2: uniSprite(u, 'w2', false, o), blink: uniSprite(u, 'idle', true, o) };
}
export const bedIcon = () => cached('bed', () => sprite(['w...........', 'w...........', 'wpp.........', 'wppbbbbbbbbb', 'wwwbbbbbbbbb', 'wwwwwwwwwwww', 'w..........w'], { w: '#A97450', p: '#FFFFFF', b: '#FF7EB6' }));
export const mapIcon = () => cached('mapi', () => sprite(['pppp.pppp.pp', 'pgpppgbbppgp', 'pggpppbbpggp', 'ppgprppbpppp', 'pppprrpppgpp', 'pp.pppp.pppp'], { p: '#F2DDB4', g: '#69DB7C', b: '#4DABF7', r: '#FF5E9C' }));
