// De Bakkerij: stack cake layers, pour icing, decorate, then the animals come and eat it.
export const meta = { id: 'bakkerij', title: 'De Bakkerij' };

const W = 192, H = 144, CX = 96, PLATE_Y = 96, COUNTER_Y = 112;
const OUT = '#2B1E3A';
const LAYER_DIMS = [[64, 16], [50, 14], [36, 12]];
const FLAV = [
  { id: 'aardbei', name: 'Aardbei', c: ['#FF9EC2', '#FFC4DA', '#E0739C', '#E8484A'], stripe: '#FFF6E3' },
  { id: 'chocola', name: 'Chocola', c: ['#9A5B3C', '#B9764F', '#6E3D27', '#5A2E1C'], stripe: '#FFE1B8' },
  { id: 'vanille', name: 'Vanille', c: ['#FFEBB8', '#FFF8E0', '#E8CF8E', '#6E4A30'], stripe: '#FF8FB1' },
  { id: 'bosbes', name: 'Bosbes', c: ['#B58BE0', '#D0B0F2', '#8A62B8', '#5B3C8F'], stripe: '#FFF6E3' },
  { id: 'citroen', name: 'Citroen', c: ['#FFE066', '#FFF0A6', '#E8BE3C', '#FFFFFF'], stripe: '#FFF6E3' },
];
const ICE = [
  { id: 'roze', name: 'Roze', c: ['#FF7EB6', '#FFB8D6', '#D9559A'] },
  { id: 'wit', name: 'Wit', c: ['#FFFFFF', '#FFFFFF', '#D6D0E6'] },
  { id: 'chocola', name: 'Chocola', c: ['#7A4430', '#9A5B3C', '#4E2A1C'] },
  { id: 'mint', name: 'Mint', c: ['#8EE3C0', '#C4F5DF', '#55B890'] },
  { id: 'blauw', name: 'Blauw', c: ['#8FD3FF', '#C8EBFF', '#5AA8E0'] },
  { id: 'paars', name: 'Paars', c: ['#C9A3FF', '#E4D2FF', '#9B72E8'] },
];
const TOPS = [
  { id: 'aardbei', name: 'Aardbei', say: 'Aardbeien!' },
  { id: 'kers', name: 'Kers', say: 'Kersen!' },
  { id: 'hart', name: 'Hartje', say: 'Hartjes!' },
  { id: 'ster', name: 'Ster', say: 'Sterretjes!' },
  { id: 'spikkels', name: 'Spikkels', say: 'Spikkels!' },
  { id: 'kaars', name: 'Kaarsje', say: 'Kaarsjes!' },
  { id: 'bloem', name: 'Bloem', say: 'Bloemetjes!' },
];
const CANDLE_COLS = ['#FF7EB6', '#7FC8F8', '#8EDB9C', '#FFC94D', '#B9A3F0'];
const FLOWER_COLS = ['#FFFFFF', '#FFB3E0', '#C9B6FF', '#9FDFFF', '#FFE38A'];
const SPRINKLE_COLS = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA', '#FFFFFF', '#FF7EB6'];

/* tiny 5px pixel font for speech bubbles and the tally */
const FONT = {
  A: ['.1.', '1.1', '111', '1.1', '1.1'], E: ['111', '1..', '11.', '1..', '111'], I: ['1', '1', '1', '1', '1'],
  J: ['..1', '..1', '..1', '1.1', '.1.'], K: ['1.1', '1.1', '11.', '1.1', '1.1'], L: ['1..', '1..', '1..', '1..', '111'],
  M: ['1...1', '11.11', '1.1.1', '1...1', '1...1'], N: ['1..1', '11.1', '1.11', '1..1', '1..1'], P: ['11.', '1.1', '11.', '1..', '1..'],
  R: ['11.', '1.1', '11.', '1.1', '1.1'], X: ['1.1', '1.1', '.1.', '1.1', '1.1'], '!': ['1', '1', '1', '.', '1'],
  0: ['111', '1.1', '1.1', '1.1', '111'], 1: ['.1', '11', '.1', '.1', '.1'], 2: ['111', '..1', '111', '1..', '111'],
  3: ['111', '..1', '.11', '..1', '111'], 4: ['1.1', '1.1', '111', '..1', '..1'], 5: ['111', '1..', '111', '..1', '111'],
  6: ['111', '1..', '111', '1.1', '111'], 7: ['111', '..1', '..1', '.1.', '.1.'], 8: ['111', '1.1', '111', '1.1', '111'],
  9: ['111', '1.1', '111', '..1', '111'],
};
const textW = s => [...s].reduce((a, ch) => a + (FONT[ch] ? FONT[ch][0].length : 2) + 1, 0) - 1;
function drawText(c, s, x, y, col) {
  c.fillStyle = col; let cx = x;
  for (const ch of s) {
    const g = FONT[ch]; if (!g) { cx += 3; continue; }
    g.forEach((row, yy) => { for (let xx = 0; xx < row.length; xx++) if (row[xx] === '1') c.fillRect(cx + xx, y + yy, 1, 1); });
    cx += g[0].length + 1;
  }
}

const CSS = `
.act-bakkerij .bk-panel{display:flex;flex-direction:column;gap:10px;flex:none}
.act-bakkerij .bk-steps .tool{min-width:92px;flex-direction:row;gap:6px}
.act-bakkerij .bk-steps .tool[aria-pressed="false"]{opacity:.7}
.act-bakkerij .bk-acts .tool{min-width:96px}
.act-bakkerij .bk-klaar{background:var(--pink)!important;color:#fff;box-shadow:inset -3px -3px 0 var(--pink2),0 4px 0 var(--ink)!important}
.act-bakkerij .bk-dim{opacity:.4;pointer-events:none}
.act-bakkerij .hint{font-size:1.15rem;color:var(--ink)}
@media (min-width:820px) and (min-aspect-ratio:5/4){
  .act-root.act-bakkerij{flex-direction:row;align-items:stretch}
  .act-bakkerij .pstage{min-width:0}
  .act-bakkerij .bk-panel{width:350px;overflow:auto;justify-content:center}
}`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function layerCol(F, lx, ly, w, h, seed, stripeRow) {
  const [b, l, d, s] = F.c;
  if (ly === 0) return l;
  if (ly === 1) return lx === 0 ? l : mixCache(l, b);
  if (ly === h - 1) return d;
  if (stripeRow && ly === stripeRow) return F.stripe;
  if (lx === 0) return l;
  if (lx === w - 1) return d;
  if (lx === w - 2 && ly % 2) return d;
  if (lx === 1 && ly % 2 === 0) return l;
  if (hash(lx, ly, seed) < .07) return s;
  return b;
}
const mc = new Map();
function mixCache(a, b) { const k = a + b; if (!mc.has(k)) mc.set(k, mixHex(a, b, .5)); return mc.get(k); }
function mixHex(a, b, t) {
  const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), B = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export function open(root, api) {
  const { PX, sfx } = api;
  const ex = api.state.extra || (api.state.extra = {});
  const data = ex.bakkerij || (ex.bakkerij = { gebakken: 0 });
  if (typeof data.gebakken !== 'number') data.gebakken = 0;
  const uni = api.state.uni || { body: '#FFFFFF', mane: 'rainbow', horn: '#F7C548' };

  const styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);
  const stage = api.pixelStage(root, W, H);
  const ctx = stage.ctx;
  stage.canvas.setAttribute('aria-label', 'De bakkerij: tik op de taart');

  /* ---------------- sprites ---------------- */
  const S = PX.sprite;
  const spr = {
    aardbei: S(['..g..', '.gGg.', 'rrrrr', 'rWryr', 'ryrrr', '.rry.', '..r..'], { r: '#F04A5E', W: '#FF9AA8', y: '#FFE38A', g: '#4E9A51', G: '#7BC86C' }, { key: 'bk-aardbei' }),
    kers: S(['...gG', '...s.', '..s..', '.rrr.', 'rWrrr', 'rrrrR', '.rRR.'], { r: '#E8344A', W: '#FF9AA8', R: '#B8323A', s: '#6E8A3A', g: '#4E9A51', G: '#7BC86C' }, { key: 'bk-kers' }),
    hart: S(['rr.rr', 'rWrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#FF5E9C', W: '#FFC2DA' }, { key: 'bk-hart' }),
    ster: S(['..y..', '.yYy.', 'yyyyy', '.yyy.', '.y.y.'], { y: '#FFD43B', Y: '#FFF6D0' }, { key: 'bk-ster' }),
    spikkels: S(['r..y..b', '..g..p.', 'p...r..', '..b...y', 'y..p..g'], { r: '#FF6B6B', y: '#FFD43B', b: '#4DABF7', g: '#69DB7C', p: '#9775FA' }, { key: 'bk-spk', outline: false }),
  };
  const candle = col => S(Array.from({ length: 8 }, (_, i) => [0, 1, 2].map(x => (x + i) % 3 === 0 ? 'p' : 'w').join('')), { w: '#FFFFFF', p: col }, { key: 'bk-candle' + col });
  const flowerS = col => S(['.p.p.', 'ppppp', '.pyp.', 'ppppp', '.p.p.'], { p: col, y: '#FFC94D' }, { key: 'bk-fl' + col });
  const slice = F => PX.gridSprite(12, 7, (x, y) => layerCol(F, x, y, 12, 7, 3, 4), { key: 'bk-slice' + F.id });
  const dripIcon = I => PX.gridSprite(12, 7, (x, y) => {
    const len = [1, 4, 5, 2, 1, 3, 4, 1, 2, 5, 4, 1][x];
    if (y > len) return null; return y === 0 ? I.c[1] : y === len ? I.c[2] : I.c[0];
  }, { key: 'bk-drip' + I.id });
  const stackIcon = PX.gridSprite(12, 10, (x, y) => {
    if (y < 3) return x >= 3 && x < 9 ? layerCol(FLAV[0], x - 3, y, 6, 3, 1, 0) : null;
    if (y < 6) return x >= 1 && x < 11 ? layerCol(FLAV[2], x - 1, y - 3, 10, 3, 2, 0) : null;
    return layerCol(FLAV[1], x, y - 6, 12, 4, 3, 0);
  }, { key: 'bk-stack' });
  const bell = S(['....k....', '...yyy...', '..yYyyy..', '..yYyyy..', '.yyyyyyy.', 'yyyyyyyyy', 'OOOOOOOOO'], { k: '#C99A3A', y: '#FFD43B', Y: '#FFF6D0', O: '#C99A3A' }, { key: 'bk-bell' });
  const arrow = S(['...y...', '...yy..', 'yyyyyy.', 'yyyyyyy', 'yyyyyy.', '...yy..', '...y...'], { y: '#7ED9B4' }, { key: 'bk-arrow' });
  const redo = PX.gridSprite(9, 9, (x, y) => {
    const d = Math.hypot(x - 4, y - 4.5); const a = Math.atan2(y - 4.5, x - 4);
    if ((x === 6 && y <= 3) || (x === 7 && y >= 1 && y <= 3) || (x === 8 && y === 3) || (x >= 5 && x <= 8 && y === 3)) return '#FF7EB6';
    if (d <= 4.2 && d >= 2.6 && !(a < -0.3 && a > -1.4)) return '#FF7EB6';
    return null;
  }, { key: 'bk-redo' });
  const tallyCake = S(['..f..', '.www.', 'ppppp', 'PPPPP'], { f: '#FFA94D', w: '#FFFFFF', p: '#FF9EC2', P: '#E0739C' }, { key: 'bk-tally' });

  /* ---------------- static background (wall) ---------------- */
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const [wallCv, wc] = mk();
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  (function paintWall() {
    for (let y = 0; y < 88; y++) for (let x = 0; x < W; x++) {
      let col = (x % 10) < 3 ? '#F6D3B0' : '#FBE3C6';
      const d = Math.hypot(x - 96, (y - 24) * 1.15);
      if (d < 34 || (d < 46 && (x + y) % 2 === 0)) col = (x % 10) < 3 ? '#FCE2C4' : '#FFF0DA';
      R(wc, x, y, 1, 1, col);
    }
    R(wc, 0, 0, W, 4, '#C98B5E'); R(wc, 0, 4, W, 1, '#A0623A');
    // wainscot
    R(wc, 0, 86, W, 26, '#E3AE82'); R(wc, 0, 86, W, 1, '#FFF0DA'); R(wc, 0, 87, W, 2, '#C98B5E'); R(wc, 0, 89, W, 1, '#A0623A');
    for (let x = 4; x < W; x += 24) { R(wc, x, 92, 18, 18, '#D99E72'); R(wc, x, 92, 18, 1, '#B97E54'); R(wc, x, 109, 18, 1, '#F0C49C'); }
    // window
    const wx = 10, wy = 12, ww = 44, wh = 40;
    R(wc, wx - 1, wy - 1, ww + 2, wh + 2, OUT); R(wc, wx, wy, ww, wh, '#B07A52');
    R(wc, wx + 3, wy + 3, ww - 6, wh - 6, OUT);
    for (let y = wy + 4; y < wy + wh - 4; y++) R(wc, wx + 4, y, ww - 8, 1, y < wy + 16 ? '#A6DCF7' : y < wy + 26 ? '#BFE8FF' : '#D8F2FF');
    R(wc, wx + 14, wy + 30, 16, 6, '#9BDB7D'); R(wc, wx + 4, wy + 33, ww - 8, 3, '#7CCB64'); // hills
    R(wc, wx + 8, wy + 8, 8, 3, '#FFFFFF'); R(wc, wx + 10, wy + 6, 4, 2, '#FFFFFF'); R(wc, wx + 26, wy + 13, 7, 2, '#FFFFFF'); R(wc, wx + 28, wy + 11, 3, 2, '#FFFFFF');
    R(wc, wx + 21, wy + 4, 2, wh - 8, '#B07A52'); R(wc, wx + 4, wy + 19, ww - 8, 2, '#B07A52');
    R(wc, wx - 3, wy + wh, ww + 6, 3, '#C98B5E'); R(wc, wx - 3, wy + wh + 3, ww + 6, 1, OUT); R(wc, wx - 3, wy + wh, ww + 6, 1, '#E8B48A');
    // curtains
    for (const [cx0, dir] of [[wx - 4, 1], [wx + ww - 5, -1]]) {
      for (let y = wy - 3; y < wy + 30; y++) {
        const wdt = 9 - Math.max(0, Math.floor((y - wy - 14) / 4));
        for (let i = 0; i < wdt; i++) { const x = dir > 0 ? cx0 + i : cx0 + 9 - i; R(wc, x, y, 1, 1, i === wdt - 1 ? OUT : (i % 4 === 2 ? '#E0739C' : '#FF9EC2')); }
      }
    }
    R(wc, wx - 5, wy - 5, ww + 10, 4, '#FF7EB6'); R(wc, wx - 5, wy - 6, ww + 10, 1, OUT);
    for (let x = wx - 5; x < wx + ww + 5; x++) if (x % 4 !== 0) R(wc, x, wy - 1, 1, 1, '#FF7EB6'); else R(wc, x, wy - 1, 1, 1, OUT);
    PX.drawSprite(wc, PX.flower('#FFB3E0'), wx + 9, wy + wh + 1); PX.drawSprite(wc, PX.flower('#C9B6FF'), wx + ww - 9, wy + wh + 1);
    // utensil rail
    R(wc, 12, 62, 42, 2, '#8A5A3B');
    const spoon = S(['.ww.', 'wwww', 'wwww', '.ww.', '.bb.', '.bb.', '.bb.', '.bb.', '.bb.', '.bb.'], { w: '#E6C08F', b: '#B07A52' }, { key: 'bk-spoon' });
    const whisk = S(['.m.m.', 'm.m.m', 'm.m.m', 'm.m.m', '.mmm.', '..m..', '..b..', '..b..', '..b..', '..b..'], { m: '#D3DAE6', b: '#FF9EC2' }, { key: 'bk-whisk' });
    const spat = S(['bbbb', 'bbbb', 'bbbb', '.hh.', '.hh.', '.hh.', '.hh.', '.hh.', '.hh.'], { b: '#8FD3FF', h: '#B07A52' }, { key: 'bk-spat' });
    [[spoon, 20], [whisk, 32], [spat, 44]].forEach(([s, x]) => { R(wc, x, 64, 1, 2, OUT); PX.drawSprite(wc, PX.flipX(s), x, 66 + s.height); });
    // bunting
    const cols = ['#FF9EC2', '#FFE38A', '#9FDFFF', '#B8EBC8', '#C9B6FF'];
    const by = x => 6 + Math.round(5 * Math.sin(Math.PI * (x - 62) / 70));
    for (let x = 62; x <= 132; x++) R(wc, x, by(x), 1, 1, '#8A5A3B');
    for (let i = 0, x = 64; x < 128; x += 9, i++) {
      const y0 = by(x + 3) + 1;
      for (let r = 0; r < 6; r++) { const hw = 3 - r / 2; R(wc, Math.round(x + 3 - hw) , y0 + r, Math.max(1, Math.round(hw * 2)), 1, cols[i % 5]); }
    }
    // lamp
    R(wc, 96, 0, 1, 14, OUT);
    const lamp = PX.gridSprite(14, 6, (x, y) => { const hw = 3 + y; return Math.abs(x + .5 - 7) <= hw ? (x < 7 - hw + 2 ? '#FFD3E2' : '#FF7EB6') : null; }, { key: 'bk-lamp' });
    PX.drawSprite(wc, lamp, 97, 22); R(wc, 94, 22, 6, 2, '#FFF3A8'); R(wc, 95, 24, 4, 1, '#FFF3A8');
    // shelves + jars
    for (const y of [26, 48]) { R(wc, 136, y, 54, 3, '#C98B5E'); R(wc, 136, y, 54, 1, '#E8B48A'); R(wc, 136, y + 3, 54, 1, OUT); R(wc, 140, y + 4, 2, 3, '#8A5A3B'); R(wc, 184, y + 4, 2, 3, '#8A5A3B'); }
    const jarC = [['#FF9EC2', '#FF5E9C'], ['#D9A066', '#7FC8F8'], ['#9BE3A8', '#FFD166'], ['#C9B6FF', '#9B72E8']];
    jarC.forEach(([c, l], i) => {
      const j = S(['.llll.', '.LLLL.', 'gWgggg', 'gWgggg', 'cWcdcc', 'cccccc', 'cdcccd', '.cccc.'], { g: '#E6F6FF', W: '#FFFFFF', c, d: mixHex(c, '#FFFFFF', .5), l, L: mixHex(l, '#2B1E3A', .25) }, { key: 'bk-jar' + i });
      PX.drawSprite(wc, j, 144 + i * 12, 26);
    });
    // oven
    R(wc, 145, 57, 42, 56, OUT); R(wc, 146, 58, 40, 54, '#EDE7F5'); R(wc, 182, 58, 4, 54, '#CFC6DE'); R(wc, 146, 58, 1, 54, '#FFFFFF');
    R(wc, 146, 66, 40, 1, OUT);
    [154, 164, 174].forEach((x, i) => { R(wc, x - 2, 60, 5, 5, OUT); R(wc, x - 1, 61, 3, 3, ['#FF7EB6', '#FFD166', '#7FC8F8'][i]); R(wc, x, 61, 1, 2, '#FFFFFF'); });
    R(wc, 150, 70, 32, 2, OUT); R(wc, 151, 70, 30, 1, '#D3DAE6');
    R(wc, 150, 75, 32, 30, OUT);
  })();

  /* counter + cake stand (drawn in front of the unicorn baker) */
  const [frontCv, fc] = mk();
  (function paintFront() {
    R(fc, 0, COUNTER_Y, W, 1, '#F2C08F'); R(fc, 0, COUNTER_Y + 1, W, 3, '#D9965F'); R(fc, 0, COUNTER_Y + 4, W, 1, '#8A5A3B');
    R(fc, 0, COUNTER_Y - 1, W, 1, OUT);
    R(fc, 0, COUNTER_Y + 5, W, H - COUNTER_Y - 5, '#C7834E');
    for (let x = 0; x < W; x += 24) { R(fc, x, COUNTER_Y + 5, 1, 40, '#A86A3E'); R(fc, x + 1, COUNTER_Y + 5, 1, 40, '#D99A64'); }
    for (let x = 0; x < W; x++) { R(fc, x, COUNTER_Y + 5, 1, 3, '#FF9EC2'); if (Math.abs((x % 8) - 4) <= 2) R(fc, x, COUNTER_Y + 8, 1, 2, '#FF9EC2'); else R(fc, x, COUNTER_Y + 8, 1, 1, '#E0739C'); }
    const stand = PX.gridSprite(74, 14, (x, y) => {
      if (y < 3) return y === 0 ? '#FFFFFF' : y === 1 ? '#F4F0FF' : '#D3CCE6';
      if (y < 10) return Math.abs(x + .5 - 37) <= 3 ? (x < 36 ? '#FFFFFF' : '#D3CCE6') : null;
      return Math.abs(x + .5 - 37) <= 9 - (y - 10) * 0 ? (y === 10 ? '#F4F0FF' : '#D3CCE6') : null;
    }, { key: 'bk-stand' });
    PX.drawSprite(fc, stand, CX, COUNTER_Y + 1);
  })();

  /* ---------------- game state ---------------- */
  let layers = [];   // {f, seed, dy, vy, landed}
  let icing = null;  // {i, seed, t}
  let tops = [];     // {kind, x, y, spr, seed, lit, born}
  let dots = [];     // sprinkles {x,y,w,h,col,sx,sy,born}
  let step = 1, tool = 'aardbei', phase = 'build', T = 0, alive = true;
  let bites = [], cakeGone = false, ovenFlash = 0, events = [], parts = [], bubbles = [];
  let animals = [];

  const layerRects = (withDy = true) => {
    const out = []; let bottom = PLATE_Y;
    layers.forEach((L, i) => {
      const [w, h] = LAYER_DIMS[i]; const y1 = bottom, y0 = y1 - h; bottom = y0;
      const dy = withDy ? Math.round(L.dy) : 0;
      out.push({ x0: CX - w / 2, x1: CX + w / 2, y0: y0 + dy, y1: y1 + dy, f: L.f, seed: L.seed, i });
    });
    return out;
  };

  /* ---------------- cake rendering (procedural pixel grid) ---------------- */
  const GX = 40, GY = 0, GW = 112, GH = 100;
  const cakeCv = document.createElement('canvas'); cakeCv.width = GW; cakeCv.height = GH;
  const cakeCtx = cakeCv.getContext('2d');
  let cakeKey = '', mask = new Uint8Array(GW * GH);
  function buildCake() {
    const Rs = layerRects();
    const key = Rs.map(r => r.f + ':' + r.seed + ':' + r.y0).join('|') + '/' + (icing ? icing.i + ':' + icing.seed + ':' + Math.round(icing.t * 24) : '');
    if (key === cakeKey) return; cakeKey = key;
    const g = new Array(GW * GH).fill(null);
    const set = (x, y, c) => { x -= GX; y -= GY; if (x >= 0 && y >= 0 && x < GW && y < GH) g[y * GW + x] = c; };
    Rs.forEach((r, i) => {
      const F = FLAV[r.f], w = r.x1 - r.x0, h = r.y1 - r.y0, stripe = Math.floor(h / 2) + 1;
      for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) set(x, y, layerCol(F, x - r.x0, y - r.y0, w, h, r.seed, stripe));
    });
    if (icing && Rs.length) {
      const r = Rs[Rs.length - 1], I = ICE[icing.i].c, h = r.y1 - r.y0;
      const rr = PX.rng(icing.seed); const lens = {};
      let x = r.x0 + 1 + Math.floor(rr() * 3);
      while (x < r.x1 - 2) {
        const w = rr() < .5 ? 3 : 2, L = 3 + Math.floor(rr() * (h - 5));
        for (let k = 0; k < w; k++) lens[x + k] = (w === 3 && k === 1) ? L + 1 : L;
        x += w + 2 + Math.floor(rr() * 3);
      }
      for (let x = r.x0 - 1; x <= r.x1; x++) {
        const edge = x < r.x0 || x >= r.x1;
        const extra = edge ? 0 : Math.round((lens[x] || 0) * icing.t);
        const bottom = edge ? r.y0 : r.y0 + 1 + extra;
        for (let y = r.y0 - 1; y <= bottom; y++) {
          let c = I[0];
          if (y === r.y0 - 1) c = I[1]; else if (y === bottom) c = I[2]; else if (lens[x] && !lens[x - 1]) c = I[1];
          set(x, y, c);
        }
      }
    }
    // auto outline
    const add = [];
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x; if (g[i]) continue;
      if ((x > 0 && g[i - 1]) || (x < GW - 1 && g[i + 1]) || (y > 0 && g[i - GW]) || (y < GH - 1 && g[i + GW])) add.push(i);
    }
    for (const i of add) g[i] = OUT;
    const img = cakeCtx.createImageData(GW, GH);
    for (let i = 0; i < g.length; i++) {
      mask[i] = g[i] && g[i] !== OUT ? 1 : 0; if (!g[i]) continue;
      const c = g[i]; img.data[i * 4] = parseInt(c.substr(1, 2), 16); img.data[i * 4 + 1] = parseInt(c.substr(3, 2), 16); img.data[i * 4 + 2] = parseInt(c.substr(5, 2), 16); img.data[i * 4 + 3] = 255;
    }
    cakeCtx.putImageData(img, 0, 0);
  }
  const onCake = (x, y) => { x = Math.round(x) - GX; y = Math.round(y) - GY; return x >= 0 && y >= 0 && x < GW && y < GH && mask[y * GW + x] === 1; };

  /* ---------------- UI ---------------- */
  const panel = document.createElement('div'); panel.className = 'bk-panel'; root.appendChild(panel);
  const hint = document.createElement('p'); hint.className = 'hint'; panel.appendChild(hint);
  const steps = api.toolbar(panel, [
    { id: '1', label: '1 Bodem', icon: stackIcon, onClick: () => setStep(1) },
    { id: '2', label: '2 Glazuur', icon: dripIcon(ICE[0]), onClick: () => setStep(2) },
    { id: '3', label: '3 Versieren', icon: spr.aardbei, onClick: () => setStep(3) },
  ], { small: true });
  steps.classList.add('bk-steps');
  const g1 = api.toolbar(panel, FLAV.map((F, i) => ({ id: F.id, label: F.name, icon: slice(F), onClick: () => addLayer(i) })));
  const g2 = api.toolbar(panel, ICE.map((I, i) => ({ id: I.id, label: I.name, icon: dripIcon(I), onClick: () => setIcing(i) })));
  const g3 = api.toolbar(panel, TOPS.map(t => ({
    id: t.id, label: t.name, icon: t.id === 'kaars' ? candle(CANDLE_COLS[0]) : t.id === 'bloem' ? flowerS('#FFB3E0') : spr[t.id],
    onClick: () => { tool = t.id; g3.setActive(t.id); api.speak(t.say + ' Tik op de taart.'); },
  })));
  const acts = api.toolbar(panel, [
    { id: 'opnieuw', label: 'Opnieuw', icon: redo, onClick: () => restart() },
    { id: 'verder', label: 'Verder', icon: arrow, onClick: () => setStep(Math.min(3, step + 1)) },
    { id: 'klaar', label: 'Klaar!', icon: bell, onClick: () => finale() },
  ]);
  acts.classList.add('bk-acts');
  const btnVerder = acts.querySelector('[data-id="verder"]');
  acts.querySelector('[data-id="klaar"]').classList.add('bk-klaar');
  g3.setActive(tool);
  const groups = { 1: g1, 2: g2, 3: g3 };
  const SAY = { 1: 'Kies de bodem van je taart!', 2: 'Welk glazuur wil je?', 3: 'Versier je taart! Tik op de taart.' };

  function setStep(n, silent) {
    if (phase !== 'build') return;
    if (n > 1 && !layers.length) { sfx.wrong(); api.speak('Kies eerst een bodem!'); n = 1; silent = true; }
    step = n; steps.setActive(String(n));
    for (const k in groups) groups[k].hidden = Number(k) !== n;
    btnVerder.hidden = n === 3;
    hint.textContent = SAY[n];
    if (!silent) api.speak(SAY[n]);
  }
  function addLayer(i) {
    if (phase !== 'build') return;
    if (layers.length >= 3) { api.speak('De taart is al hoog genoeg! Nu het glazuur.'); setStep(2, true); return; }
    layers.push({ f: i, seed: (Math.random() * 1e6) | 0, dy: -46, vy: 0, landed: false });
    g1.setActive(FLAV[i].id);
    if (layers.length === 3) { api.speak(FLAV[i].name + '! Mooi hoog! Welk glazuur wil je?'); setTimeout(() => alive && phase === 'build' && step === 1 && setStep(2, true), 900); }
    else api.speak(FLAV[i].name + '!');
  }
  function setIcing(i) {
    if (phase !== 'build') return;
    if (!layers.length) { setStep(1); return; }
    icing = { i, seed: (Math.random() * 1e6) | 0, t: 0 };
    g2.setActive(ICE[i].id); sfx.splash();
    api.speak(ICE[i].name + ' glazuur!');
  }
  function resetCake() {
    layers = []; icing = null; tops = []; dots = []; bites = []; cakeGone = false; cakeKey = '';
    g1.setActive(''); g2.setActive('');
  }
  function restart() {
    if (phase !== 'build') return;
    sfx.whoosh(); resetCake();
    api.speak('Opnieuw! Kies de bodem van je taart!'); setStep(1, true);
  }
  function setDim(on) { panel.classList.toggle('bk-dim', on); }

  /* ---------------- placing toppings ---------------- */
  function place(px, py) {
    const Rs = layerRects(false);
    if (!Rs.length) { sfx.wrong(); api.speak('Kies eerst een bodem!'); setStep(1, true); return; }
    const top = Rs[Rs.length - 1], B = Rs[0];
    if (px < B.x0 - 10 || px > B.x1 + 10 || py < top.y0 - 26 || py > PLATE_Y + 12) { sfx.boing(); api.speak('Tik op de taart!'); return; }
    const cx = clamp(Math.round(px), B.x0 + 3, B.x1 - 4);
    const surf = x => { for (let i = Rs.length - 1; i >= 0; i--) if (x >= Rs[i].x0 + 2 && x < Rs[i].x1 - 2) return Rs[i]; return B; };
    const byY = Rs.find(r => py >= r.y0 + 2 && py < r.y1);
    let onTop = null, face = null;
    if (['kaars', 'aardbei', 'kers'].includes(tool) || py < top.y0 + 2) onTop = surf(cx);
    else if (byY && cx >= byY.x0 + 2 && cx < byY.x1 - 2) face = byY;
    else if (byY) onTop = surf(cx);
    else face = B;
    let x = cx, y;
    if (onTop) { x = clamp(cx, onTop.x0 + 3, onTop.x1 - 4); y = onTop.y0 + 2; }
    else { y = clamp(Math.round(py), face.y0 + 3, face.y1 - 3); x = clamp(cx, face.x0 + 3, face.x1 - 4); }
    const seed = (Math.random() * 1000) | 0;
    if (tool === 'spikkels') {
      const cy = onTop ? onTop.y0 + 1 : y;
      for (let n = 0, tries = 0; n < 16 && tries < 80; tries++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * 9;
        const tx = Math.round(x + Math.cos(a) * d), ty = Math.round(cy + Math.sin(a) * d * .7);
        if (!onCake(tx, ty)) continue;
        const horiz = Math.random() < .5;
        dots.push({ x: tx, y: ty, w: horiz && onCake(tx + 1, ty) ? 2 : 1, h: !horiz && onCake(tx, ty + 1) ? 2 : 1, col: SPRINKLE_COLS[(Math.random() * SPRINKLE_COLS.length) | 0], sx: x, sy: cy, born: T + n * .01 });
        n++;
      }
      if (dots.length > 500) dots.splice(0, dots.length - 500);
      sfx.bubble(); setTimeout(() => alive && sfx.bubble(), 70); setTimeout(() => alive && sfx.bubble(), 140);
      return;
    }
    let s;
    if (tool === 'kaars') s = candle(CANDLE_COLS[seed % CANDLE_COLS.length]);
    else if (tool === 'bloem') s = flowerS(FLOWER_COLS[seed % FLOWER_COLS.length]);
    else s = spr[tool];
    if (!onTop) y += Math.floor(s.height / 2);
    tops.push({ kind: tool, x, y, spr: s, seed, lit: true, born: T });
    tops.sort((a, b) => a.y - b.y);
    if (tops.length > 80) tops.shift();
    if (tool === 'ster') sfx.sparkle(); else if (tool === 'kaars') sfx.chime(4 + tops.filter(t => t.kind === 'kaars').length % 4); else sfx.pop();
    for (let k = 0; k < 4; k++) parts.push({ kind: 'spark', x, y: y - s.height / 2, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40, life: .35, age: 0, col: '#FFF6D0' });
  }

  /* ---------------- pointer ---------------- */
  const onDown = e => {
    e.preventDefault();
    const p = stage.toLocal(e);
    if (phase === 'build') {
      if (step === 3) place(p.x, p.y);
      else {
        const Rs = layerRects(false);
        if (Rs.length && p.x > Rs[0].x0 - 6 && p.x < Rs[0].x1 + 6 && p.y > Rs[Rs.length - 1].y0 - 10 && p.y < PLATE_Y + 4) { sfx.boing(); wobble = 1; }
        api.speak(SAY[step]);
      }
    } else {
      for (const a of animals) { const b = animalBox(a); if (p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1) { a.lean = 1; sfx.boing(); break; } }
    }
  };
  stage.canvas.addEventListener('pointerdown', onDown);
  let wobble = 0;

  /* ---------------- finale ---------------- */
  const later = (d, fn) => events.push({ at: T + d, fn });
  const ANIMALS = () => [
    { id: 'uni', get: fr => PX.unicorn(uni, fr), scale: 2, x: -40, tx: 34, y: 119, behind: true, side: -1, say: 'JIPPIE!', delay: 0 },
    { id: 'bunny', get: () => PX.bunny(), scale: 2, x: -20, tx: 24, y: 143, side: -1, say: 'MMM!', delay: .3 },
    { id: 'cat', get: () => PX.cat(), scale: 2, x: -50, tx: 60, y: 143, side: -1, say: 'LEKKER!', delay: .6 },
    { id: 'puppy', get: () => PX.puppy(), scale: 2, x: 215, tx: 132, y: 143, side: 1, say: 'NJAM!', delay: .2 },
    { id: 'hedgehog', get: () => PX.hedgehog(), scale: 2, x: 240, tx: 168, y: 143, side: 1, say: 'JAMMIE!', delay: .5, flipIn: true },
  ];
  function animalSprite(a) {
    if (a.id === 'uni') return a.get(a.walking ? (Math.floor(T * 7) % 2 ? 'w1' : 'w2') : 'idle');
    return a.get();
  }
  function animalBox(a) {
    const s = animalSprite(a), w = s.width * a.scale, h = s.height * a.scale;
    return { x0: a.x - w / 2, x1: a.x + w / 2, y0: a.y - h, y1: a.y };
  }

  function finale() {
    if (phase !== 'build') return;
    if (!layers.length) { sfx.wrong(); api.speak('Bak eerst een taart! Kies de bodem.'); setStep(1, true); return; }
    phase = 'finale'; setDim(true);
    layers.forEach(L => { L.dy = 0; L.vy = 0; }); if (icing) icing.t = 1;
    hint.textContent = 'Ding! De taart is klaar!';
    sfx.chime(5); ovenFlash = 1.4; later(.28, () => sfx.chime(7)); later(.56, () => sfx.chime(5));
    api.speak('Ding! De taart is klaar! Wie komt er proeven?');
    animals = ANIMALS().map(a => Object.assign(a, { walking: false, start: T + 1.4 + a.delay, lean: 0, flip: !!a.flipIn, leaving: false }));
    later(1.4, () => sfx.whoosh());
    later(4.6, () => {
      api.speak('Mmm! Lekker! Njam njam!');
      animals.forEach((a, i) => later(i * .35, () => { bubbles.push({ a, text: a.say, born: T, life: 2.2 }); sfx.pop(); }));
    });
    const lit = tops.filter(t => t.kind === 'kaars');
    let tb = 7.2;
    if (lit.length) {
      later(6.6, () => { api.speak('Blaas de kaarsjes uit!'); });
      later(7.6, () => {
        sfx.whoosh();
        lit.forEach(t => { t.lit = false; for (let k = 0; k < 3; k++) parts.push({ kind: 'smoke', x: t.x, y: t.y - 12, vx: (Math.random() - .5) * 6, vy: -10 - Math.random() * 8, life: 1.2, age: k * -.15 }); });
      });
      tb = 8.6;
    }
    // bite plan: top layer first, alternating sides
    const Rs = layerRects(false), plan = [];
    const L = ['uni', 'bunny', 'cat'], Rt = ['puppy', 'hedgehog']; let li = 0, ri = 0, ci = 0;
    for (let i = Rs.length - 1; i >= 0; i--) {
      const r = Rs[i], h = r.y1 - r.y0, ym = Math.round((r.y0 + r.y1) / 2), w = r.x1 - r.x0;
      if (i === Rs.length - 1) plan.push({ x: CX, y: r.y0 - 4, r: 9, who: 'uni', f: r.f, ice: true });
      plan.push({ x: r.x0 + 1, y: ym, r: Math.round(h * .75), who: L[li++ % 3], f: r.f, ice: i === Rs.length - 1 });
      plan.push({ x: r.x1 - 2, y: ym, r: Math.round(h * .75), who: Rt[ri++ % 2], f: r.f, ice: i === Rs.length - 1 });
      if (w > 40) { plan.push({ x: r.x0 + 14, y: ym, r: Math.round(h * .8), who: L[li++ % 3], f: r.f }); plan.push({ x: r.x1 - 15, y: ym, r: Math.round(h * .8), who: Rt[ri++ % 2], f: r.f }); }
      plan.push({ x: CX + (ci++ % 2 ? 3 : -3), y: ym, r: Math.round(Math.max(h * .9, w * .3)), who: ['bunny', 'puppy', 'cat', 'hedgehog', 'uni'][ci % 5], f: r.f, ice: i === Rs.length - 1 });
    }
    plan.forEach((b, k) => later(tb + k * .62, () => bite(b)));
    const tEnd = tb + plan.length * .62;
    later(tEnd + .2, () => {
      cakeGone = true; sfx.munch();
      for (let k = 0; k < 24; k++) crumb(CX + (Math.random() - .5) * 50, 60 + Math.random() * 34, FLAV[layers[(Math.random() * layers.length) | 0].f].c[0]);
    });
    later(tEnd + .8, () => {
      sfx.sparkle();
      animals.forEach((a, i) => { const b = animalBox(a); for (let k = 0; k < 2; k++) parts.push({ kind: 'heart', x: (b.x0 + b.x1) / 2 + (k ? 6 : -6), y: b.y0 + 2, vx: 0, vy: -16 - Math.random() * 8, life: 2.4, age: -(i * .18 + k * .4), ph: Math.random() * 6 }); });
      data.gebakken++; api.save(); tallyPop = 1;
    });
    later(tEnd + 3.1, () => {
      api.reward('Wat een lekkere taart!').then(() => {
        if (!alive) return;
        animals.forEach(a => { a.leaving = true; a.tx = a.side < 0 ? -60 : 260; a.flip = a.id === 'uni' ? true : a.id === 'hedgehog' ? false : a.flip; });
        phase = 'build'; setDim(false); resetCake(); setStep(1, true);
        api.speak('Nog een taart bakken? Kies de bodem!');
      });
    });
  }
  function bite(b) {
    bites.push(b); sfx.munch();
    tops = tops.filter(t => Math.hypot(t.x - b.x, t.y - t.spr.height / 2 - b.y) > b.r + 3);
    const a = animals.find(x => x.id === b.who); if (a) a.lean = 1;
    const cols = [FLAV[b.f].c[0], FLAV[b.f].c[1], FLAV[b.f].stripe]; if (b.ice && icing) cols.push(ICE[icing.i].c[0]);
    for (let k = 0; k < 10; k++) crumb(b.x + (Math.random() - .5) * b.r, b.y + (Math.random() - .5) * b.r, cols[k % cols.length]);
  }
  function crumb(x, y, col) {
    parts.push({ kind: 'crumb', x, y, vx: (Math.random() - .5) * 70, vy: -30 - Math.random() * 40, life: 1.6 + Math.random() * .6, age: 0, col, s: Math.random() < .4 ? 2 : 1 });
  }
  let tallyPop = 0;

  /* ---------------- draw ---------------- */
  const [cakeLCv, cl] = mk();
  function drawFlame(c, t) {
    const fx = t.x, fy = t.y - 11;
    c.fillStyle = '#3D2B4F'; c.fillRect(fx, fy, 1, 1);
    if (!t.lit) return;
    const f = Math.sin(T * 17 + t.seed) + Math.sin(T * 29 + t.seed * 2), tall = f > .4, sway = f > 1.3 ? 1 : f < -1.3 ? -1 : 0;
    c.globalAlpha = .28; c.fillStyle = '#FFE9A8';
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if ((dx + dy) % 2 === 0 && dx * dx + dy * dy <= 14) c.fillRect(fx + dx, fy - 3 + dy, 1, 1);
    c.globalAlpha = 1;
    c.fillStyle = '#FF8C42'; c.fillRect(fx - 1, fy - 2, 3, 1); c.fillRect(fx, fy - 1, 1, 1); c.fillRect(fx + sway, fy - 4, 1, 1);
    if (tall) c.fillRect(fx + sway, fy - 5, 1, 1);
    c.fillStyle = '#FFD43B'; c.fillRect(fx, fy - 3, 1, 2);
    c.fillStyle = '#FFF6D0'; c.fillRect(fx, fy - 2, 1, 1);
  }
  function drawCake() {
    cl.clearRect(0, 0, W, H);
    if (cakeGone || !layers.length) return;
    buildCake();
    const wob = wobble > 0 ? Math.round(Math.sin(T * 40) * wobble * 1.4) : 0;
    cl.drawImage(cakeCv, GX + wob, GY);
    for (const d of dots) {
      const k = clamp((T - d.born) / .22, 0, 1), e = 1 - (1 - k) * (1 - k);
      const x = Math.round(d.sx + (d.x - d.sx) * e) + wob, y = Math.round(d.sy + (d.y - d.sy) * e - Math.sin(k * Math.PI) * 5);
      if (k < 0) continue; cl.fillStyle = d.col; cl.fillRect(x, y, k < 1 ? 1 : d.w, k < 1 ? 1 : d.h);
    }
    for (const t of tops) {
      const age = T - t.born, pop = age < .15 ? -Math.round((1 - age / .15) * 4) : 0;
      PX.drawSprite(cl, t.spr, t.x + wob, t.y + pop);
      if (t.kind === 'kaars') drawFlame(cl, { x: t.x + wob, y: t.y + pop, seed: t.seed, lit: t.lit });
    }
    if (bites.length) {
      cl.globalCompositeOperation = 'destination-out'; cl.fillStyle = '#000';
      for (const b of bites) for (let dy = -b.r; dy <= b.r; dy++) { const hw = Math.floor(Math.sqrt(b.r * b.r - dy * dy)); cl.fillRect(b.x - hw, b.y + dy, hw * 2 + 1, 1); }
      cl.globalCompositeOperation = 'source-over';
    }
  }
  function drawAnimal(a) {
    if (T < a.start) return;
    const s = animalSprite(a);
    let x = a.x, y = a.y;
    if (a.walking) y -= Math.round(Math.abs(Math.sin(T * 12 + a.tx)) * 2);
    if (a.lean > 0) {
      const k = Math.sin(a.lean * Math.PI);
      if (a.behind) { x += Math.round(k * 5); y -= Math.round(k * 2); }
      else { x += Math.round(-a.side * k * 6); y -= Math.round(k * 12); }
    }
    PX.drawSprite(ctx, s, x, y, a.scale, a.flip);
  }
  function drawBubble(bb) {
    const a = bb.a, box = animalBox(a), age = T - bb.born;
    const w = textW(bb.text) + 7, h = 11;
    const cx = Math.round(a.behind ? box.x1 - 14 : (box.x0 + box.x1) / 2);
    const bottom = Math.round(box.y0 - 3 - (age < .15 ? (1 - age / .15) * 3 : 0));
    const x0 = clamp(cx - Math.floor(w / 2), 1, W - w - 1), y0 = bottom - h;
    ctx.fillStyle = OUT; ctx.fillRect(x0 + 1, y0, w - 2, h); ctx.fillRect(x0, y0 + 1, w, h - 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    ctx.fillStyle = OUT; ctx.fillRect(cx - 1, y0 + h, 3, 1); ctx.fillRect(cx, y0 + h + 1, 1, 1);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx, y0 + h - 1, 1, 2);
    drawText(ctx, bb.text, x0 + 4, y0 + 3, '#D63F7C');
  }
  function drawTally() {
    const n = data.gebakken, bump = tallyPop > 0 ? -Math.round(Math.sin(tallyPop * Math.PI) * 3) : 0;
    if (n <= 6) for (let i = 0; i < n; i++) PX.drawSprite(ctx, tallyCake, 144 + i * 8, 48 + (i === n - 1 ? bump : 0));
    else {
      PX.drawSprite(ctx, tallyCake, 148, 48 + bump);
      const s = 'X' + n; ctx.fillStyle = '#FFF6E3'; ctx.fillRect(154, 40, textW(s) + 4, 7);
      drawText(ctx, s, 156, 41, OUT);
    }
  }
  function drawOvenWindow() {
    const flash = ovenFlash > 0 && Math.floor(ovenFlash * 6) % 2 === 0;
    for (let y = 76; y < 104; y++) for (let x = 151; x < 181; x++) {
      let c = '#4A3448';
      if (flash) c = (x + y) % 2 ? '#FFE38A' : '#FFF6D0';
      else if (y > 92 || (y > 86 && (x + y) % 2 === 0)) c = '#B5564A';
      ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
    }
    ctx.fillStyle = '#6B4F68'; ctx.fillRect(151, 76, 30, 1); ctx.fillRect(151, 89, 30, 1);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(153, 78, 4, 1); ctx.fillRect(153, 79, 2, 1);
  }

  /* ---------------- loop ---------------- */
  function frame(dt) {
    T += dt;
    // events
    for (let i = 0; i < events.length; i++) if (T >= events[i].at) { const e = events[i]; events.splice(i--, 1); try { e.fn(); } catch (err) { console.error(err); } }
    // layer drop physics
    for (const L of layers) {
      if (L.dy < 0 || L.vy !== 0) {
        L.vy += 700 * dt; L.dy += L.vy * dt;
        if (L.dy >= 0) {
          if (!L.landed) { L.landed = true; sfx.pop(); wobble = .6; }
          if (L.vy > 80) { L.dy = 0; L.vy = -L.vy * .25; } else { L.dy = 0; L.vy = 0; }
        }
      }
    }
    if (icing && icing.t < 1) icing.t = Math.min(1, icing.t + dt * 1.6);
    wobble = Math.max(0, wobble - dt * 2.5); ovenFlash = Math.max(0, ovenFlash - dt); tallyPop = Math.max(0, tallyPop - dt * 2);
    // animals
    for (const a of animals) {
      if (T < a.start) continue;
      const d = a.tx - a.x; a.walking = Math.abs(d) > .5;
      if (a.walking) a.x += Math.sign(d) * Math.min(Math.abs(d), (a.leaving ? 70 : 42) * dt);
      a.lean = Math.max(0, a.lean - dt * 2);
    }
    animals = animals.filter(a => !(a.leaving && !a.walking));
    // particles
    for (const p of parts) {
      p.age += dt; if (p.age < 0) continue;
      if (p.kind === 'crumb') {
        p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const floor = p.x > 60 && p.x < 132 ? PLATE_Y + 1 : COUNTER_Y + 1;
        if (p.y > floor && p.vy > 0 && p.y < floor + 6) { p.y = floor; p.vy = 0; p.vx *= .5; }
      } else if (p.kind === 'heart') { p.y += p.vy * dt; p.x += Math.sin(p.age * 4 + p.ph) * 10 * dt; }
      else { p.x += p.vx * dt; p.y += p.vy * dt; }
    }
    parts = parts.filter(p => p.age < p.life);
    bubbles = bubbles.filter(b => T - b.born < b.life);

    // draw
    ctx.drawImage(wallCv, 0, 0);
    drawOvenWindow();
    drawTally();
    for (const a of animals) if (a.behind) drawAnimal(a);
    ctx.drawImage(frontCv, 0, 0);
    drawCake();
    ctx.drawImage(cakeLCv, 0, 0);
    for (const a of animals) if (!a.behind) drawAnimal(a);
    for (const p of parts) {
      if (p.age < 0) continue;
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.kind === 'crumb') { ctx.globalAlpha = clamp((p.life - p.age) * 2, 0, 1); ctx.fillStyle = p.col; ctx.fillRect(x, y, p.s, p.s); ctx.globalAlpha = 1; }
      else if (p.kind === 'spark') { ctx.fillStyle = p.col; ctx.fillRect(x, y, 1, 1); }
      else if (p.kind === 'smoke') { ctx.globalAlpha = .6 * (1 - p.age / p.life); ctx.fillStyle = '#C9C3D6'; ctx.fillRect(x, y, 2, 2); ctx.globalAlpha = 1; }
      else if (p.kind === 'heart') { ctx.globalAlpha = clamp((p.life - p.age) * 1.5, 0, 1); PX.drawSprite(ctx, PX.heart(), x, y); ctx.globalAlpha = 1; }
    }
    if (ovenFlash > 0) { const k = Math.floor(ovenFlash * 8) % 2; PX.drawSprite(ctx, PX.sparkle('#FFF3A8'), 166 + (k ? -12 : 12), 58 - k * 2); }
    for (const b of bubbles) drawBubble(b);
  }
  stage.loop(dt => frame(dt));

  setStep(1, true);
  api.speak('Welkom in de bakkerij! Kies de bodem van je taart!');

  // dev hook for testing (harmless): window.__bakkerij
  try { window.__bakkerij = { addLayer, setIcing, setStep, place: (x, y, t) => { tool = t || tool; place(x, y); }, finale, sim: (sec) => { for (let i = 0; i < sec * 30; i++) frame(1 / 30); }, get T() { return T; } }; } catch (e) { }

  return () => {
    alive = false; events = [];
    stage.canvas.removeEventListener('pointerdown', onDown);
    stage.destroy(); styleEl.remove();
    try { delete window.__bakkerij; } catch (e) { }
  };
}
