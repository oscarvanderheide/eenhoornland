// Art that belongs to one island each, so the plants, rocks and animals never repeat between islands.
// Same conventions as pixel.js / art.js: everything returns a <canvas>, anchored bottom-centre, 1px soft outline.
import { sprite, gridSprite, mix, rng, RAINBOW } from './pixel.js';

const EYE = '#2B1E3A';
const memo = new Map();
const cached = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const noiseOf = (seed, n) => { const r = rng(seed), a = []; for (let i = 0; i < n; i++) a.push(r()); return a; };
const inBlobs = (blobs, x, y) => blobs.some(([cx, cy, rr]) => (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= rr * rr);

/* ================= forest ================= */
/** a birch: slim white trunk with black marks under a light, airy crown */
export const berk = (seed = 1) => cached('berk' + seed % 4, () => {
  const W = 20, H = 38, n = noiseOf(seed * 6151 + 7, W * H), s = seed % 4, lean = s % 2 ? .6 : -.6;
  const blobs = [[10, 8, 6.5], [5.5, 13, 4.8], [14.5, 12, 5], [10, 16, 5.2], [7, 5, 3.8], [13.5, 4.5, 3.6]];
  return gridSprite(W, H, (x, y) => {
    const i = y * W + x;
    if (inBlobs(blobs, x, y) && !(n[i] < .1 && !inBlobs(blobs.map(([a, b, r]) => [a, b, r - 1.6]), x, y))) {
      const v = (x - 6) * .45 + (y - 3) * .8 + n[i] * 3.2, d = (x + y) & 1;
      return v < 2 + d ? '#E2F7A8' : v < 6 + d ? '#B4E27C' : v < 11 + d ? '#86C860' : '#5EA552';
    }
    const cx = 10 + lean * (1 - y / H) * 2;
    if (y >= 12 && Math.abs(x + .5 - cx) <= (y > 34 ? 2 : 1.5)) {
      const left = x + .5 < cx - .4;
      if ((y * 5 + x * 3 + s) % 7 === 0 || (y % 6 === 2 && !left)) return '#3A3340';
      return left ? '#FFFFFF' : '#D9D3CB';
    }
    if (y >= 12 && y <= 15 && Math.abs(x - (cx + (y - 12) * 1.4)) < .8 && n[i] > .3) return '#D9D3CB';  // a little side branch
    return null;
  }, { outline: '#3E4A3A' });
});

/* ================= flower meadow ================= */
/** a blossom tree: a round crown full of pink and white flowers */
export const bloesem = (seed = 1) => cached('bloesem' + seed % 4, () => {
  const W = 26, H = 30, n = noiseOf(seed * 7919 + 13, W * H), white = seed % 2 === 0;
  const blobs = [[13, 9, 8.5], [6.5, 13, 6], [19.5, 13, 6], [13, 15, 7], [8.5, 6, 4.8], [17.5, 6.5, 4.8]];
  const ramp = white ? ['#FFFFFF', '#FFE6F0', '#F9C3D9', '#E39AB9'] : ['#FFE3EF', '#FFB8D6', '#F58BB8', '#D3668F'];
  return gridSprite(W, H, (x, y) => {
    const i = y * W + x;
    if (inBlobs(blobs, x, y)) {
      if (n[i] > .93) return white ? '#FF8FB8' : '#FFFFFF';          // single flowers
      if (n[i] < .035 && y > 8) return '#7CCB64';                      // a peek of leaf
      const v = (x - 8) * .5 + (y - 4) + n[i] * 3, d = (x + y) & 1;
      return v < 2 + d ? ramp[0] : v < 8 + d ? ramp[1] : v < 14 + d ? ramp[2] : ramp[3];
    }
    if (x >= 11 && x <= 14 && y >= 16) return x === 11 ? '#A97450' : (y < 19 ? '#5E3A24' : (x === 14 ? '#6E4630' : '#8A5A3B'));
    return null;
  }, { outline: '#6B3A55' });
});

/** two or three tall sunflowers in a clump */
export const zonnebloemen = (seed = 1) => cached('zonneb' + seed % 3, () => {
  const W = 19, H = 27, s = seed % 3;
  const heads = [[[5, 7.5], [13.5, 4.5], [9.5, 13]], [[5.5, 4.5], [13.5, 8.5]], [[4.5, 11], [9.5, 4.5], [14.5, 10]]][s];
  return gridSprite(W, H, (x, y) => {
    const X = x + .5, Y = y + .5;
    for (const [cx, cy] of heads) {
      const dx = X - cx, dy = Y - cy, d = Math.hypot(dx, dy);
      if (d <= 1.9) return d < 1 && dx < 0 && dy < 0 ? '#9A6A44' : (x + y) & 1 ? '#7A4A2A' : '#5E3A24';
      const a = Math.atan2(dy, dx), pet = 3.3 + .9 * Math.abs(Math.cos(a * 5));
      if (d <= pet) return d > 3.3 ? '#FFCC1F' : dy < 0 ? '#FFE066' : '#F5B000';
    }
    for (const [cx, cy] of heads) {
      const sx = Math.floor(cx), ly = Math.round(cy) + 7;
      if (x === sx && Y > cy) return '#4E9A51';
      if ((y === ly && (x === sx - 1 || x === sx - 2 || x === sx - 3)) || (y === ly - 1 && x === sx - 3)) return y === ly ? '#5AA650' : '#7CCB64';
      if ((y === ly + 4 && (x === sx + 1 || x === sx + 2 || x === sx + 3)) || (y === ly + 3 && x === sx + 3)) return y === ly + 4 ? '#5AA650' : '#7CCB64';
    }
    if (((X - 9.5) / 7.5) ** 2 + ((Y - 27) / 3.2) ** 2 <= 1) return (x * 3 + y) % 4 ? '#5AA650' : '#7CCB64';
    return null;
  }, { outline: '#3A4A22' });
});

const tiny = (rows, pal, key) => cached(key, () => sprite(rows, pal));
export const madelief = () => tiny(['.w.w.', 'wwyww', '.wyw.', 'w.g.w', '..g..', '.gg..'], { w: '#FFFFFF', y: '#FFD43B', g: '#4E9A51' }, 'madelief');
export const klaproos = () => tiny(['..rrr..', '.rRrrr.', 'rRrrkrr', 'rrkkkrr', '.rrkrr.', '..rrr..', '...g...', '..gg...', '...g...'], { r: '#E8383A', R: '#FF8A7A', k: EYE, g: '#4E9A51' }, 'klaproos');
export const korenbloem = () => tiny(['b..b..b', '.bBbBb.', 'bbBpBbb', '.bbbbb.', 'b..g..b', '...g...', '..gg...', '...g...'], { b: '#4F7CF7', B: '#9DB8FF', p: '#7A4CC8', g: '#4E9A51' }, 'korenbloem');

/* ================= rainbow island ================= */
const LOLLY = [RAINBOW, ['#FF6B9C', '#FFFFFF'], ['#7FE0C0', '#FFFFFF', '#C9B3FF'], ['#FFA94D', '#FFE066', '#FF6B6B']];
/** a lollipop tree: a swirl candy on a striped stick */
export const lolly = (seed = 1) => cached('lolly' + seed % 4, () => {
  const W = 17, H = 32, cols = LOLLY[seed % 4], R = 7.8, cx = 8.5, cy = 8;
  return gridSprite(W, H, (x, y) => {
    const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy);
    if (d <= R) {
      if (Math.hypot(dx + 3.4, dy + 3.6) < 1.3) return '#FFFFFF';    // shine
      const t = Math.atan2(dy, dx) / (Math.PI * 2) + d / 4.2, c = cols[((Math.floor(t * cols.length) % cols.length) + cols.length) % cols.length];
      return d > R - 1.1 ? mix(c, '#5A3A6A', .18) : c;
    }
    if (y >= 15 && x >= 7 && x <= 9) return (y + x) % 4 < 2 ? '#FF6B9C' : (x === 9 ? '#E8E0EE' : '#FFFFFF');
    return null;
  }, { outline: '#5A3A6A' });
});

const CLOUD = [['#FFFFFF', '#EEF0FF', '#D3D8F5'], ['#FFF4F9', '#FFD3E8', '#F2ADD0'], ['#F7F2FF', '#E0D3FF', '#C3ADF0'], ['#F2FFFA', '#CCF5E5', '#A3E0CB']];
/** a fluffy cloud of a bush in pastel: round puffs on a flat bottom */
export const wolkstruik = (seed = 1) => cached('wolk' + seed % 4, () => {
  const [a, b, c] = CLOUD[seed % 4], puffs = [[4.6, 8.4, 4], [9.5, 5.9, 5.4], [14.4, 8, 4.1]];
  return gridSprite(19, 12, (x, y) => {
    const X = x + .5, Y = y + .5, base = y >= 8 && y <= 11 && x >= 2 && x <= 16 && !(y === 11 && (x === 2 || x === 16));
    const ins = puffs.map(([px, py, r]) => Math.hypot(X - px, Y - py) / r);
    if (!base && !ins.some(d => d <= 1)) return null;
    if (y >= 11) return c;
    // the round edge of the middle puff drawn over the side puffs: that crease makes it a cloud
    if (ins[1] > .86 && ins[1] <= 1.08 && Y > 5.4 && (ins[0] <= 1 || ins[2] <= 1)) return c;
    const k = ins[1] <= 1 ? 1 : ins[0] <= 1 ? 0 : ins[2] <= 1 ? 2 : -1;
    if (k < 0) return b;
    const [px, py, r] = puffs[k], u = (X - px) / r, v = (Y - py) / r;
    if (u < -.15 && u > -.55 && v < -.35 && v > -.75) return '#FFFFFF';
    return u * .5 + v < -.25 ? a : b;
  }, { outline: '#9C8BC4' });
});

/** a flower with crystal petals */
export const kristalbloem = (seed = 1) => cached('krbloem' + seed % 3, () => {
  const s = seed % 3, petals = [[5.5, 2], [2.2, 4.5], [8.8, 4.5], [3.4, 7.6], [7.6, 7.6]];
  const cols = [[RAINBOW[0], RAINBOW[2], RAINBOW[4], RAINBOW[3], RAINBOW[5]], ['#9FE8FF', '#C9B3FF', '#FFB3E6', '#9FE8FF', '#C9B3FF'], ['#FFB3E6', '#FFE8A8', '#B3F5E0', '#FFE8A8', '#FFB3E6']][s];
  return gridSprite(11, 15, (x, y) => {
    const X = x + .5, Y = y + .5;
    if (Math.hypot(X - 5.5, Y - 5) < 1.3) return '#FFFFFF';
    for (let k = 0; k < petals.length; k++) {
      const [px, py] = petals[k], dx = X - px, dy = Y - py;
      if (Math.abs(dx) + Math.abs(dy) * .85 <= 2.2) { const c = mix(cols[k], '#FFFFFF', .3); return dx + dy < -.6 ? mix(c, '#FFFFFF', .6) : dx > .6 ? mix(c, '#6A5AA0', .2) : c; }
    }
    if (x === 5 && y >= 9) return '#5DC8A0';
    if (y === 11 && (x === 3 || x === 4)) return '#7FE0C0';
    if (y === 12 && (x === 6 || x === 7)) return '#5DC8A0';
    return null;
  }, { outline: '#4A3D7A' });
});

/* ================= castle ================= */
/** a tall slim cypress, clipped to a flame */
export const cipres = (seed = 1) => cached('cipres' + seed % 3, () => {
  const W = 12, H = 37, n = noiseOf(seed * 313 + 1, W * H), top = seed % 3, body = 32 - top;
  return gridSprite(W, H, (x, y) => {
    const yy = y - top;
    if (yy >= 0 && yy < body) {
      const t = (yy + 1) / body, hw = 5.4 * Math.pow(t, .65) * (t < .78 ? 1 : Math.sqrt(Math.max(0, 1 - ((t - .78) / .24) ** 2)));
      const dx = x + .5 - 6;
      if (Math.abs(dx) <= Math.max(.6, hw)) {
        const v = dx / Math.max(1, hw) * 2 + (yy % 5 === 0 ? 1 : 0) + n[y * W + x] * 1.4;
        return v < -1.2 ? '#4FA060' : v < .4 ? '#2F7F4E' : v < 1.6 ? '#246A42' : '#1A5236';
      }
    }
    if (y >= top + body && x >= 5 && x <= 6) return x === 5 ? '#8A5A3B' : '#5E3A24';
    return null;
  }, { outline: '#14301F' });
});

/** a low lavender bush with purple spikes */
export const lavendel = (seed = 1) => cached('lavendel' + seed % 3, () => {
  const W = 16, H = 12, n = noiseOf(seed * 97 + 3, W * H), s = seed % 3;
  const spikes = [1, 4, 7, 10, 13].map((x, k) => [x, (k * 2 + s) % 3]);
  return gridSprite(W, H, (x, y) => {
    for (const [sx, top] of spikes) if ((x === sx || x === sx + 1) && y >= top && y < 7) return y === top && x === sx + 1 ? null : (y + x) % 2 ? '#9B72E8' : '#C0A3FF';
    const d = ((x + .5 - 8) / 8) ** 2 + ((y + .5 - 12) / 6) ** 2;
    if (d <= 1) return n[y * W + x] < .4 ? '#9DBB96' : y > 9 ? '#5E8460' : '#779E74';
    return null;
  }, { outline: '#3E3360' });
});

/* ================= village ================= */
/** a round clipped box ball in a pot */
export const bol = (seed = 1) => cached('bol' + seed % 2, () => {
  const W = 14, H = 21, n = noiseOf(seed * 41 + 2, W * H), blue = seed % 2 === 1;
  const pot = blue ? ['#E8F1FF', '#9DB8E8', '#4F7CC4'] : ['#F2A27A', '#D9774E', '#A9563A'];
  return gridSprite(W, H, (x, y) => {
    const dx = x + .5 - 7, dy = y + .5 - 6.5;
    if (dx * dx + dy * dy <= 6.4 * 6.4) { const v = dx * .5 + dy + n[y * W + x] * 2.2, d = (x + y) & 1; return v < -4 + d ? '#A8E07E' : v < 0 + d ? '#6CBE5C' : v < 4 + d ? '#4E9E50' : '#3A7E44'; }
    if (y >= 13 && y <= 14 && (x === 6 || x === 7)) return x === 6 ? '#A97450' : '#6E4630';
    if (y === 15 && x >= 2 && x <= 11) return x === 2 ? pot[0] : pot[1];             // rim
    if (y >= 16 && Math.abs(x + .5 - 7) <= 4.4 - (y - 16) * .35) return x < 5 ? pot[0] : x > 8 ? pot[2] : (blue && y === 18 ? pot[2] : pot[1]);
    return null;
  }, { outline: '#2E3A2A' });
});

/* ================= beach ================= */
/** a clump of pale marram grass */
export const helm = (seed = 1) => cached('helm' + seed % 2, () => sprite(seed % 2 ? [
  '.....l.......', '..l..l....l..', '..l..lL...l..', '...l.LL..l...', '.l.l.L..lL.l.', '.lL.lL.lL..l.', '..L.lLlL.lL..', '..LllLLlLL...', '...LlLLLL....',
] : [
  '......l......', '.l....l...l..', '.l...lL..l...', '..l..L..lL...', '..lL.L.lL..l.', 'l..LlLlL..l..', '.lL.LLlL.lL..', '..LLlLLLlL...', '...LLlLLL....',
], { l: '#EDE6B4', L: '#BDBC80' }, { outline: '#8C8455' }));

/* ================= rocks per island ================= */
const ROCK = {
  dorp: ['#E6E3DE', '#C7C3BD', '#A6A29C', '#86827D'],
  bos: ['#C9CDD6', '#A9AEBC', '#8C92A3', '#717789'],
  wei: ['#FBE2B4', '#EBC487', '#D4A066', '#B07D4D'],
  strand: ['#FFFAF0', '#EEE6D6', '#D6CCB8', '#B9AE99'],
  kasteel: ['#E6DDF5', '#C9BBE3', '#A897C9', '#8775AA'],
  eiland: ['#FFF0FA', '#F7D3EC', '#D9B9F0', '#B49ADD'],
};
/** a rock in an island's own palette and with its own little extra (moss, strata, a shell, a crystal ...) */
export const rots = (seed = 1, kind = 'dorp') => cached('rots' + kind + seed % 3, () => {
  const P = ROCK[kind] || ROCK.dorp, s = seed % 3, w = 6.3 + s * .4, cx = 7.5 + ((s % 2) - .5), hh = 4.2 + (s % 2), crystal = kind === 'eiland';
  const cy = crystal ? 7.2 : 7, ry = crystal ? Math.min(hh, 3.6) : hh;
  const shade = (x, y) => { const v = (x - 4) * .5 + (y - 3); return v < 1.5 ? P[0] : v < 5 ? P[1] : v < 8 ? P[2] : P[3]; };
  return gridSprite(15, 10, (x, y) => {
    const X = x + .5, Y = y + .5;
    if (kind === 'kasteel') {                                                   // a squared block with a crack
      if (y < 3 || y > 9 || x < 2 || x > 12 || ((x === 2 || x === 12) && (y === 3 || y === 9))) return null;
      if ((x === 7 && y >= 4 && y <= 6) || (x === 8 && y >= 6 && y <= 8)) return P[3];
      if (y === 6 && x > 8) return P[2];
      return y === 3 ? P[0] : x === 12 ? P[3] : shade(x, y);
    }
    if (crystal && Math.abs(X - 9) * 1.1 + Math.max(0, 3 - Y) * .25 <= Math.min(1.6, (Y + .5) * .7) && y <= 5) return X < 9 ? '#E8FBFF' : '#7FD6F5';
    if (crystal && Math.abs(X - 6) <= Math.min(1, (Y - 2) * .6) && y >= 2 && y <= 5) return X < 6 ? '#FFE8F7' : '#F59BD6';
    const d = ((X - cx) / w) ** 2 + ((Y - cy) / ry) ** 2;
    if (d > 1 || y > 9) return null;
    const top = cy - ry * Math.sqrt(Math.max(0, 1 - ((X - cx) / w) ** 2));
    if (kind === 'bos' && Y < top + 2.2 + ((x * 7) % 3 === 0 ? 1 : 0)) return Y < top + 1 ? '#9BDB6D' : '#5FAE4E';
    if (kind === 'dorp' && ((x * 7 + y * 11 + s) % 13 === 0) && y > 3) return P[3];                // a few specks
    if (kind === 'wei' && (y === 6 || y === 8) && (x + y) % 5 !== 0) return P[2];
    if (kind === 'strand') {
      if (((X - 9.5) ** 2 + (Y - 6.5) ** 2) <= 2.2) return (x + y) % 2 ? '#FFB3C4' : '#FF8FA8';         // a shell
      if ((x === 4 && y === 5) || (x === 6 && y === 7) || (x === 12 && y === 7)) return '#FFFFFF';    // barnacles
      if ((x === 4 && y === 6) || (x === 6 && y === 8)) return P[3];
    }
    return shade(x, y);
  }, { outline: kind === 'kasteel' ? '#3E3360' : kind === 'eiland' ? '#5A4A8A' : undefined });
});

/* ================= grass tufts per island ================= */
const TUFT = { dorp: ['#4E9A51', '#7BC86C'], wei: ['#8FA840', '#C9D96A'], kasteel: ['#2F7F4E', '#4FA060'], eiland: ['#3FB8A8', '#8FE8D0'], bos: ['#2E6B48', '#4E9E64'] };
/** a small grass tuft coloured for an island (the meadow one carries a seed head) */
export const tuftZone = (zone = 'dorp', seed = 0) => cached('tz' + zone + seed % 3, () => {
  const [g, G] = TUFT[zone] || TUFT.dorp, s = seed % 3;
  let rows = [['G.g.G', 'GgGgG'], ['.G.g.', 'gGgGg'], ['g...G', 'GgGgg']][s];
  if (zone === 'wei') rows = [['.s...', '.sG.G', 'G.g.G', 'GgGgG'], ['...s.', '.G.sg', '.G.g.', 'gGgGg'], ['..s..', 'g.s.G', 'g.G.G', 'GgGgg']][s];
  return sprite(rows, { g, G, s: '#E8C860' }, { outline: false });
});

/* ================= animals (facing left, idle) ================= */
export const schaap = () => cached('schaap', () => sprite([
  '.ww...ww.ww.ww..',
  '.www.wwwwwwwwww.',
  'efffewwwwwwwwwWw',
  '.fkffwwwwwwwwwWw',
  '.ffffwwwwwwwwwWw',
  '.fnfwwWwwwwwwWWw',
  '..ff.wWwwwwwwWW.',
  '......WWWWWWWW..',
  '......ll...ll...',
  '......ll...ll...',
], { w: '#FFFFFF', W: '#E3E0EE', f: '#FFE3D3', e: '#F2B8A8', k: EYE, n: '#E58FA0', l: '#6B5A6E' }));

export const papegaai = () => cached('papegaai', () => sprite([
  '...rrr....',
  '..rrrrr...',
  '.nwkrrr...',
  'nnwwrrr...',
  'n..rrrrb..',
  '...rrybbb.',
  '...ryybBb.',
  '...ryybBb.',
  '...rrybb..',
  '...frrbb..',
  '..ff.bbr..',
  '.....brr..',
  '.....rbb..',
  '......b...',
], { r: '#F0423A', y: '#FFD43B', b: '#3F86E0', B: '#2BB673', w: '#FFFFFF', k: EYE, n: '#5A4E5C', f: '#8C7E8E' }));

/** a peacock: blue body in front of a big green fan with eyes */
export const pauw = () => cached('pauw', () => {
  const W = 20, H = 18, cx = 12, cy = 13, RX = 8.4, RY = 12, grid = [];
  for (let y = 0; y < H; y++) { let row = ''; for (let x = 0; x < W; x++) {
    const dx = (x + .5 - cx) / RX, dy = (y + .5 - cy) / RY, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let c = '.';
    if (d <= 1 && dy <= -.03) {
      let eye = 9;
      for (let k = 1; k <= 5; k++) { const ea = -Math.PI + k * Math.PI / 6; eye = Math.min(eye, Math.hypot(x + .5 - cx - Math.cos(ea) * RX * .8, y + .5 - cy - Math.sin(ea) * RY * .8)); }
      for (let k = 1; k <= 5; k += 2) { const ea = -Math.PI + k * Math.PI / 6; eye = Math.min(eye, Math.hypot(x + .5 - cx - Math.cos(ea) * RX * .45, y + .5 - cy - Math.sin(ea) * RY * .45)); }
      if (d > .9 && eye > 1.6) c = '.';                                          // a scalloped rim
      else c = eye < .75 ? 'e' : eye < 1.45 ? 'o' : d > .72 ? 'L' : Math.abs(((a / (Math.PI / 6)) % 1 + 1) % 1 - .5) < .12 ? 'g' : 'G';
    }
    row += c; } grid.push(row); }
  const body = [
    '..y.y....',
    '...b.....',
    '..bbb....',
    '.bwkb....',
    'nbbbb....',
    '..bbb....',
    '..bbb....',
    '..bbbb...',
    '.bbbbbb..',
    '.bbbbbbB.',
    '..bbbbBB.',
    '...bbbB..',
    '....l.l..',
    '...ll.ll.',
  ];
  body.forEach((r, j) => { const y = j + 4, a = grid[y].split(''); for (let i = 0; i < r.length; i++) if (r[i] !== '.') a[i + 1] = r[i]; grid[y] = a.join(''); });
  return sprite(grid, { g: '#3DBE8C', G: '#2A9A70', L: '#7FE0B0', e: '#2F4FB0', o: '#F5C84C', b: '#3F7FE0', B: '#2E5FB8', y: '#FFD43B', w: '#FFFFFF', k: EYE, n: '#C9B89A', l: '#8C7E8E' });
});

export const kip = () => cached('kip', () => sprite([
  '..rr.......',
  '.rrbb......',
  'ybkbb...B..',
  '.rbbb..BB..',
  '..bbbbbbB..',
  '..cbbBBbbB.',
  '..ccbBBbbb.',
  '..cccbbbb..',
  '...cccbb...',
  '....o..o...',
  '...oo.oo...',
], { b: '#D98C4A', B: '#A9563A', c: '#F7D9A8', r: '#E8383A', y: '#FFC23B', k: EYE, o: '#F5A623' }));

export const uil = () => cached('uil', () => sprite([
  'B.......B',
  'BBbbbbbBB',
  'bwwwbwwwb',
  'bkwwbkwwb',
  'bwwwywwwb',
  'bbbbybbbb',
  'bBcccccBb',
  'BbcCcCcbB',
  'BbcccccbB',
  '.bcCcCcb.',
  '..ccccc..',
  '..o...o..',
], { b: '#A9784F', B: '#7A5236', c: '#F2D9B0', C: '#C9A27A', w: '#FFF6E3', k: EYE, y: '#F5B83D', o: '#F5A623' }));
