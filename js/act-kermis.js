// De Kermis: a little funfair arcade with three replayable mini-games
// (Sterren vangen, Memory, Ballonnen). All art is pixel art on one pixelStage.
export const meta = { id: 'kermis', title: 'De Kermis' };

const W = 192, H = 144;
const INK = '#2B1E3A', CREAM = '#FFF6E3', CREAM2 = '#F2D7A6';

/* ---------------- 5×7 pixel font ---------------- */
const FONT = {
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};
function textWidth(s, sc = 1) { let w = 0; for (const ch of s) w += ((FONT[ch] || FONT[' '])[0].length + 1) * sc; return Math.max(0, w - sc); }
function glyphs(c, s, x, y, sc, col) {
  c.fillStyle = col;
  for (const ch of s) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 7; r++) for (let k = 0; k < g[r].length; k++) if (g[r][k] === '#') c.fillRect(x + k * sc, y + r * sc, sc, sc);
    x += (g[0].length + 1) * sc;
  }
}
/** pixel text with an optional 1px ink outline; x,y = top-left */
function text(c, s, x, y, sc = 1, col = '#fff', out = INK) {
  x = Math.round(x); y = Math.round(y);
  if (out) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) glyphs(c, s, x + dx, y + dy, sc, out);
  glyphs(c, s, x, y, sc, col);
}

/* ---------------- small helpers ---------------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; fn(x); return c; }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function open(root, api) {
  const { PX, sfx } = api;
  const ex = api.state.extra.kermis = Object.assign({ best: 0, memory: 0, popped: 0 }, api.state.extra.kermis || {});
  let alive = true, paused = false, scene = null, pointerDown = false;
  const timers = new Set();
  const later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
  const say = s => api.speak(s);

  const stage = api.pixelStage(root, W, H);
  const { ctx, canvas } = stage;
  const barHost = document.createElement('div'); root.appendChild(barHost);

  const mixCache = new Map();
  const mix = (a, b, t) => { const k = a + b + t; if (!mixCache.has(k)) mixCache.set(k, PX.mix(a, b, t)); return mixCache.get(k); };
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  /** dithered vertical gradient: stops [[y, '#hex'], ...] */
  function skyFill(c, stops, y0 = 0, y1 = H) {
    for (let y = y0; y < y1; y++) {
      let i = 0; while (i < stops.length - 2 && y >= stops[i + 1][0]) i++;
      const [ya, ca] = stops[i], [yb, cb] = stops[i + 1];
      const v = clamp((y - ya) / (yb - ya), 0, 1) * 4, lo = Math.floor(v), fr = v - lo;
      for (let x = 0; x < W; x++) {
        const step = Math.min(4, lo + (fr * 16 > BAYER[(y & 3) * 4 + (x & 3)] + .5 ? 1 : 0));
        R(c, x, y, 1, 1, mix(ca, cb, step / 4));
      }
    }
  }
  function line(c, x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    c.fillStyle = col;
    for (let n = 0; n < 400; n++) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  /** rounded pixel panel with ink outline */
  function panel(c, x, y, w, h, fill = CREAM, edge = CREAM2) {
    R(c, x + 1, y, w - 2, h, INK); R(c, x, y + 1, w, h - 2, INK);
    R(c, x + 1, y + 1, w - 2, h - 2, edge); R(c, x + 2, y + 2, w - 4, h - 5, fill);
  }
  const crop = (cv, rows) => mkCanvas(cv.width, rows, c => c.drawImage(cv, 0, 0));
  const draw = (cv, x, y, s = 1, flip = false) => PX.drawSprite(ctx, cv, x, y, s, flip);

  /* ---------------- particles & floating text ---------------- */
  const parts = [], floats = [];
  function burst(x, y, cols, n = 16, spd = 50, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = spd * rnd(.4, 1);
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), life: rnd(.5, 1.1), g: o.g ?? 110, sz: Math.random() < .35 ? 2 : 1, col: pick(cols), spark: o.spark && Math.random() < .3 });
    }
  }
  function confetti(n = 60) {
    for (let i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(-30, -2), vx: rnd(-12, 12), vy: rnd(20, 50), life: rnd(2, 3.5), g: 8, sz: 2, col: pick(PX.RAINBOW.concat(['#FFFFFF', '#FF8FC8'])), spark: Math.random() < .15 });
  }
  function floatText(s, x, y, col = '#FFF3A8') { floats.push({ s, x, y, life: 1, col }); }
  function stepParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.y -= 18 * dt; f.life -= dt; if (f.life <= 0) floats.splice(i, 1); }
  }
  function drawParts() {
    for (const p of parts) { if (p.spark) draw(PX.sparkle(), p.x, p.y + 3); else R(ctx, p.x, p.y, p.sz, p.sz, p.col); }
    for (const f of floats) text(ctx, f.s, f.x - textWidth(f.s) / 2, f.y, 1, f.col);
  }

  /* ---------------- extra sprites ---------------- */
  const tentIcon = PX.sprite([
    '....f....', '....ff...', '....k....', '...rwr...', '..rwrwr..', '.rwrwrwr.', 'rwrwrwrwr', '.wr.d.rw.', '.wrddd.w.', '.wrddd.w.', '.wrddd.w.',
  ], { f: '#FF5E9C', k: '#6B5A7D', r: '#F0484E', w: CREAM, d: '#3D2B4F' }, { key: 'k-tent' });
  const cardIcon = PX.gridSprite(9, 12, (x, y) => {
    if ((x === 0 || x === 8) && (y === 0 || y === 11)) return null;
    if (x === 0 || y === 0 || x === 8 || y === 11) return CREAM;
    if ((x === 4 && y >= 4 && y <= 7) || (y === 5 && x >= 3 && x <= 5) || (y === 6 && x >= 2 && x <= 6 && x !== 4)) return '#FFD43B';
    return (x + y) & 1 ? '#FF7EB6' : '#F56AA8';
  }, { key: 'k-cardicon' });
  const fennaHead = crop(PX.fenna(), 11), annaHead = crop(PX.anna(), 12);

  function bigBalloon(col) {
    const hi = mix(col, '#FFFFFF', .6), sh = mix(col, '#6d4f86', .28);
    return PX.gridSprite(22, 27, (x, y) => {
      if (y <= 24) {
        const dx = (x + .5 - 11) / 11, dy = (y + .5 - 12.5) / 12.5; if (dx * dx + dy * dy > 1) return null;
        if ((x - 6) ** 2 + (y - 6) ** 2 < 5 && !(x === 6 && y === 4)) return hi;
        if (x === 5 && y === 10) return hi;
        if (dx * .6 + dy * .8 > .62) return sh;
        return col;
      }
      if (y === 25 && x >= 10 && x <= 12) return sh;
      if (y === 26 && x >= 9 && x <= 13) return sh;
      return null;
    }, { key: 'k-bal' + col });
  }
  function cardShape(w, h, fn) {
    const iw = w - 2, ih = h - 2;
    return PX.gridSprite(iw, ih, (x, y) => (Math.min(x, iw - 1 - x) + Math.min(y, ih - 1 - y) < 2 ? null : fn(x, y, iw, ih)));
  }
  const backCache = new Map(), faceCache = new Map();
  function cardBack(w, h) {
    const k = w + 'x' + h; if (backCache.has(k)) return backCache.get(k);
    const base = cardShape(w, h, (x, y, iw, ih) => {
      if (x < 2 || y < 2 || x >= iw - 2 || y >= ih - 2) return CREAM;
      const gx = (x - 2 + ((y - 2) >> 3 & 1) * 4) % 8, gy = (y - 2) % 8;
      if ((gx === 3 && gy >= 2 && gy <= 4) || (gy === 3 && gx >= 2 && gx <= 4)) return '#FFD3EA';
      return ((x >> 1) + (y >> 1)) & 1 ? '#FF7EB6' : '#F873B0';
    });
    const cv = mkCanvas(base.width, base.height, c => { c.drawImage(base, 0, 0); PX.drawSprite(c, PX.star(), base.width / 2, base.height / 2 + (w > 40 ? 11 : 6), w > 40 ? 2 : 1); });
    backCache.set(k, cv); return cv;
  }
  function cardFace(w, h, item, sc) {
    const k = w + 'x' + h + item.name; if (faceCache.has(k)) return faceCache.get(k);
    const base = cardShape(w, h, (x, y, iw, ih) => (x < 2 || y < 2 || x >= iw - 2 || y >= ih - 2) ? CREAM2 : CREAM);
    const sp = item.art();
    const cv = mkCanvas(base.width, base.height, c => { c.drawImage(base, 0, 0); PX.drawSprite(c, sp, base.width / 2, Math.round(base.height / 2 + sp.height * sc / 2), sc); });
    faceCache.set(k, cv); return cv;
  }

  /* ---------------- toolbar ---------------- */
  function setBar(tools, big) {
    barHost.innerHTML = '';
    const bar = api.toolbar(barHost, tools);
    if (big) bar.querySelectorAll('.tool').forEach(b => { b.style.minWidth = '104px'; b.style.minHeight = '92px'; b.style.fontSize = '1.1rem'; });
    return bar;
  }
  const backTool = { id: 'back', label: 'Terug naar de kermis', icon: tentIcon, onClick: () => setScene(Menu()) };

  function setScene(s) { clearTimers(); parts.length = 0; floats.length = 0; paused = false; if (scene && scene.exit) scene.exit(); scene = s; s.enter(); }

  /* ======================= MENU ======================= */
  let menuBg = null;
  const TX = 106, APEX = 28, RB = 72, GY = 124, WHEEL = { x: 34, y: 62, r: 24 };
  function buildMenuBg() {
    return mkCanvas(W, H, c => {
      skyFill(c, [[0, '#7E6BC9'], [55, '#E58FC8'], [100, '#FFD3A8'], [124, '#FFE7C2']], 0, GY);
      // distant stalls
      for (let i = 0; i < 6; i++) { const x = 150 + i * 9; R(c, x, 106 - (i % 2) * 4, 8, 20, i % 2 ? '#C89AD8' : '#B488CC'); }
      // ferris wheel supports + rim
      line(c, WHEEL.x, WHEEL.y, WHEEL.x - 14, GY, '#6B5A7D'); line(c, WHEEL.x, WHEEL.y, WHEEL.x + 14, GY, '#6B5A7D');
      line(c, WHEEL.x + 1, WHEEL.y, WHEEL.x - 13, GY, '#8C7FA0'); line(c, WHEEL.x + 1, WHEEL.y, WHEEL.x + 15, GY, '#8C7FA0');
      for (let a = 0; a < 360; a += 1) { const r = a * Math.PI / 180; R(c, WHEEL.x + Math.cos(r) * WHEEL.r, WHEEL.y + Math.sin(r) * WHEEL.r, 1, 1, '#FFFFFF'); R(c, WHEEL.x + Math.cos(r) * (WHEEL.r - 2), WHEEL.y + Math.sin(r) * (WHEEL.r - 2), 1, 1, '#D9CCFF'); }
      // tent roof (radial stripes)
      for (let y = APEX; y < RB; y++) {
        const hw = (y - APEX) / (RB - APEX) * 52;
        for (let x = Math.round(TX - hw); x <= Math.round(TX + hw); x++) {
          const u = (x - TX) / (hw + .001); const s = Math.floor((u + 1) * 5) & 1;
          const edge = Math.abs(x - TX) > hw - 1;
          R(c, x, y, 1, 1, edge ? INK : (s ? '#F0484E' : CREAM));
        }
      }
      // walls
      for (let y = RB; y < GY; y++) for (let x = 62; x <= 150; x++) {
        const edge = x === 62 || x === 150; const s = ((x - 62) >> 3) & 1;
        let col = edge ? INK : (s ? '#F0484E' : CREAM); if (!edge && y > GY - 6) col = mix(col, '#6d4f86', .2);
        R(c, x, y, 1, 1, col);
      }
      // valance scallops
      for (let x = 56; x <= 156; x++) {
        const k = Math.floor((x - 56) / 10), lx = (x - 56) % 10 - 4.5, d = Math.round(4 - lx * lx / 6);
        for (let y = RB; y < RB + d; y++) R(c, x, y, 1, 1, k & 1 ? '#FFD43B' : '#4DABF7');
        R(c, x, RB + Math.max(0, d), 1, 1, INK);
      }
      R(c, 55, RB - 1, 103, 1, INK);
      // door with curtains
      R(c, 94, 90, 25, GY - 90, '#3D2B4F'); R(c, 93, 89, 27, 1, INK); R(c, 93, 89, 1, GY - 89, INK); R(c, 119, 89, 1, GY - 89, INK);
      for (let y = 90; y < GY; y++) { const w = Math.max(1, Math.round(9 - Math.abs(y - 104) * .55)); R(c, 94, y, w, 1, '#D63F7C'); R(c, 119 - w, y, w, 1, '#D63F7C'); }
      // little stars inside the door
      R(c, 104, 100, 1, 1, '#FFF3A8'); R(c, 109, 108, 1, 1, '#FFF3A8'); R(c, 106, 116, 1, 1, '#FFD3EA');
      // sign
      panel(c, 82, 76, 49, 13, '#FFF3C4', '#E0A93A');
      text(c, 'KERMIS', TX - textWidth('KERMIS') / 2, 79, 1, '#D63F7C', null);
      // flag
      R(c, TX, APEX - 12, 1, 12, '#6B5A7D');
      for (let i = 0; i < 6; i++) R(c, TX + 1, APEX - 12 + i, 7 - i, 1, i === 0 ? INK : '#FF5E9C');
      // ground
      for (let y = GY; y < H; y++) for (let x = 0; x < W; x++) {
        let col = y === GY ? '#9BDB7D' : ((y - GY) > 9 && ((x + y) & 1) ? '#5AAE58' : '#7BC86C');
        if (x > 92 && x < 121 && y > GY) col = (x + y * 3) % 7 ? '#F2D7A6' : '#E0C08A';
        R(c, x, y, 1, 1, col);
      }
      for (let i = 0; i < 9; i++) PX.drawSprite(c, PX.tuft(i), 8 + i * 22, GY + 4 + (i % 3) * 5);
      // bunting
      const garland = (x0, x1, y0, sag, off) => {
        for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0); R(c, x, y0 + Math.sin(t * Math.PI) * sag, 1, 1, '#6B5A7D'); }
        for (let x = x0 + 4, i = off; x < x1 - 4; x += 10, i++) {
          const t = (x + 3 - x0) / (x1 - x0), yy = Math.round(y0 + Math.sin(t * Math.PI) * sag) + 1;
          const col = PX.RAINBOW[i % 6];
          for (let r = 0; r < 7; r++) { const ww = 7 - r; R(c, x + Math.floor(r / 2), yy + r, Math.max(1, ww - Math.floor(r / 2)), 1, col); }
          R(c, x - 1, yy, 9, 1, INK);
        }
      };
      garland(-4, 98, 1, 10, 0); garland(94, 198, 1, 10, 3);
    });
  }
  function Menu() {
    let blink = 0;
    return {
      enter() {
        menuBg = menuBg || buildMenuBg();
        setBar([
          { id: 'stars', label: 'Sterren vangen', icon: PX.star(), onClick: () => setScene(Stars()) },
          { id: 'mem', label: 'Memory', icon: cardIcon, onClick: () => setScene(Memory()) },
          { id: 'bal', label: 'Ballonnen', icon: PX.balloon('#FF6B6B'), onClick: () => setScene(Balloons()) },
        ], true);
        say('Welkom op de kermis! Kies een spelletje: sterren vangen, memory of ballonnen.');
      },
      update(dt) { blink += dt; },
      draw(t) {
        ctx.drawImage(menuBg, 0, 0);
        // rotating wheel
        const rot = t * .35;
        for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4; line(ctx, WHEEL.x, WHEEL.y, WHEEL.x + Math.cos(a) * (WHEEL.r - 2), WHEEL.y + Math.sin(a) * (WHEEL.r - 2), '#B9A3F0'); }
        R(ctx, WHEEL.x - 2, WHEEL.y - 2, 5, 5, INK); R(ctx, WHEEL.x - 1, WHEEL.y - 1, 3, 3, '#FFD43B');
        for (let i = 0; i < 8; i++) {
          const a = rot + i * Math.PI / 4 + Math.PI / 8, gx = Math.round(WHEEL.x + Math.cos(a) * WHEEL.r), gy = Math.round(WHEEL.y + Math.sin(a) * WHEEL.r);
          R(ctx, gx - 3, gy, 7, 6, INK); R(ctx, gx - 2, gy + 1, 5, 4, PX.RAINBOW[i % 6]); R(ctx, gx - 2, gy + 1, 5, 1, '#FFFFFF');
        }
        // blinking lights along roof edges
        const ph = Math.floor(t * 3);
        for (let i = 0; i <= 8; i++) {
          const f = i / 8, y = APEX + 2 + f * (RB - APEX - 4), hw = (y - APEX) / (RB - APEX) * 52;
          for (const [s, x] of [[0, TX - hw], [1, TX + hw]]) { const on = (i + s + ph) % 3 === 0; R(ctx, x - 1, y - 1, 3, 3, INK); R(ctx, x, y, 1, 1, on ? '#FFF6D0' : '#E0A93A'); }
        }
        for (let i = 0; i < 9; i++) { const x = 66 + i * 10, on = (i + ph) % 2 === 0; R(ctx, x, RB + 6, 3, 3, INK); R(ctx, x + 1, RB + 7, 1, 1, on ? '#FFF6D0' : '#C2456E'); }
        // characters
        const bob = Math.floor(t * 2) % 2;
        draw(PX.anna(bob ? 'idle' : 'idle', (t % 4) < .15), 20, GY + 2);
        draw(PX.fenna('idle', ((t + 1.3) % 4) < .15), 46, GY + 2, 1, true);
        draw(PX.unicorn(api.state.uni, 'idle', false), 170, GY + 3 - bob, 1, true);
        for (const [i, col] of ['#FF6B6B', '#4DABF7', '#FFD43B'].entries()) draw(PX.balloon(col), 140 + i * 5, GY - 2 + Math.round(Math.sin(t * 2 + i)), 1);
        // best score plaque
        panel(ctx, 152, 20, 38, 18);
        draw(PX.star(), 162, 34);
        text(ctx, String(ex.best), 170, 24, 1, '#D63F7C', null);
        text(ctx, 'BESTE', 155, 40, 1, '#FFFFFF');
      },
      down(p) { sfx.sparkle(); burst(p.x, p.y, ['#FFF6D0', '#FFD43B', '#FF8FC8'], 10, 30, { g: 20, spark: true }); },
    };
  }

  /* ======================= STERREN VANGEN ======================= */
  let starsBg = null;
  const SG = 132;
  function buildStarsBg() {
    return mkCanvas(W, H, c => {
      skyFill(c, [[0, '#1B1E4B'], [50, '#3E327E'], [92, '#8A4F9E'], [114, '#E98AA6'], [128, '#FFC79A']], 0, SG);
      const r = PX.rng(7);
      for (let i = 0; i < 46; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 84); R(c, x, y, 1, 1, r() < .5 ? '#FFF6D0' : '#C9C3F6'); }
      PX.drawSprite(c, PX.moon(), 166, 34, 2);
      for (let x = 0; x < W; x++) {
        const h1 = Math.round(110 + 5 * Math.sin(x / 17) + 3 * Math.sin(x / 7 + 1)), h2 = Math.round(120 + 3 * Math.sin(x / 11 + 2) + 2 * Math.sin(x / 5));
        R(c, x, h1, 1, SG - h1, '#5A3F80'); R(c, x, h2, 1, SG - h2, '#43306A');
      }
      for (let y = SG; y < H; y++) for (let x = 0; x < W; x++) R(c, x, y, 1, 1, y === SG ? '#9BDB7D' : (y - SG < 3 ? '#7BC86C' : ((x + y) & 1 ? '#4E9A51' : '#5AAE58')));
      for (let i = 0; i < 8; i++) PX.drawSprite(c, PX.smallFlower(PX.RAINBOW[i % 6]), 12 + i * 24, SG + 2, 1);
    });
  }
  function Stars() {
    const uni = { x: W / 2, tx: W / 2, flip: false, walk: 0 };
    const items = []; let score = 0, spawnT = .6, combo = 0, comboT = 0, nextReward = 20, sinceBonus = 0;
    const keys = { l: false, r: false };
    const onKey = e => { const d = e.type === 'keydown'; if (e.key === 'ArrowLeft') keys.l = d; if (e.key === 'ArrowRight') keys.r = d; };
    function spawn() {
      sinceBonus++;
      let k = Math.random() < .55 ? 'star' : (Math.random() < .55 ? 'heart' : 'gem');
      if (score > 3 && sinceBonus > 8 && Math.random() < .14) { k = 'rainbow'; sinceBonus = 0; }
      const vy = k === 'rainbow' ? 20 : Math.min(62, 24 + score * .45) + rnd(0, 6);
      items.push({ k, x: rnd(14, W - 14), x0: 0, y: -4, vy, ph: rnd(0, 6) });
      items[items.length - 1].x0 = items[items.length - 1].x;
    }
    const art = k => k === 'star' ? PX.star() : k === 'heart' ? PX.heart() : k === 'gem' ? PX.gem() : PX.rainbow();
    function caught(it) {
      const v = it.k === 'rainbow' ? 5 : 1; score += v;
      if (it.k === 'rainbow') {
        sfx.sparkle(); later(150, () => sfx.chime(5)); say('Regenboog! Plus vijf!');
        burst(it.x, it.y - 8, PX.RAINBOW.concat('#FFFFFF'), 34, 70, { g: 40, spark: true }); floatText('+5', it.x, it.y - 22, '#FFD43B');
      } else {
        sfx.chime(combo); combo = Math.min(7, combo + 1);
        burst(it.x, it.y - 8, it.k === 'star' ? ['#FFD43B', '#FFF3A8'] : it.k === 'heart' ? ['#FF5E9C', '#FFB3CC'] : ['#66D9E8', '#E6FBFF'], 12, 40, { g: 60, spark: true });
        floatText('+1', it.x, it.y - 22);
      }
      comboT = 2.5;
      if (score > ex.best) { ex.best = score; api.save(); }
      if (score >= nextReward) {
        nextReward += 20; paused = true;
        later(400, () => api.reward('Super gevangen!').then(() => { if (alive) paused = false; }));
      }
    }
    return {
      enter() {
        starsBg = starsBg || buildStarsBg();
        setBar([backTool]);
        window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
        say('Vang de sterren! Beweeg je eenhoorn met je vinger.');
      },
      exit() { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); },
      update(dt) {
        if (keys.l) uni.tx = uni.x - 30; if (keys.r) uni.tx = uni.x + 30;
        uni.tx = clamp(uni.tx, 16, W - 16);
        const d = uni.tx - uni.x, sp = 120 * dt;
        if (Math.abs(d) > 1) { uni.x += clamp(d, -sp, sp); uni.flip = d < 0; uni.walk += dt; } else uni.walk = 0;
        comboT -= dt; if (comboT <= 0) combo = 0;
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(.55, 1.15 - score * .01) * rnd(.8, 1.2); }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i]; it.y += it.vy * dt; it.ph += dt * 2;
          if (it.k === 'rainbow') it.x = it.x0 + Math.sin(it.ph) * 14;
          if (Math.abs(it.x - uni.x) < 25 && it.y >= 90 && it.y <= 128) { caught(it); items.splice(i, 1); continue; }
          if (it.y > SG + 6) { burst(it.x, SG, ['#FFF6D0'], 4, 15, { g: 30 }); items.splice(i, 1); }
        }
      },
      draw(t) {
        ctx.drawImage(starsBg, 0, 0);
        const r = PX.rng(3);
        for (let i = 0; i < 6; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 70), on = Math.sin(t * 3 + i * 2) > .4; if (on) draw(PX.sparkle(), x, y + 3); }
        for (const it of items) { const s = art(it.k); draw(s, it.x, it.y, 2); }
        const fr = uni.walk > 0 ? (Math.floor(uni.walk / .14) % 2 ? 'w1' : 'w2') : 'idle';
        draw(PX.unicorn(api.state.uni, fr), uni.x, SG + 2, 2, uni.flip);
        draw(PX.star(), 9, 15);
        text(ctx, String(score), 17, 3, 2, '#FFF3A8');
        // progress to next sticker: small bar
        const prog = 1 - (nextReward - score) / 20;
        R(ctx, W - 46, 5, 42, 6, INK); R(ctx, W - 45, 6, Math.round(40 * clamp(prog, 0, 1)), 4, '#FFD43B');
        draw(PX.heart(), W - 52, 13);
      },
      down(p) { uni.tx = p.x; },
      move(p, active) { if (active) uni.tx = p.x; },
    };
  }

  /* ======================= MEMORY ======================= */
  const ITEMS = [
    { name: 'Konijn', art: () => PX.bunny(), animal: 1 }, { name: 'Poes', art: () => PX.cat(), animal: 1 },
    { name: 'Hondje', art: () => PX.puppy(), animal: 1 }, { name: 'Egel', art: () => PX.hedgehog(), animal: 1 },
    { name: 'Eendje', art: () => PX.duck(), animal: 1 }, { name: 'Vlinder', art: () => PX.butterfly(), animal: 1 },
    { name: 'Ster', art: () => PX.star() }, { name: 'Hartje', art: () => PX.heart() }, { name: 'Appel', art: () => PX.apple() },
    { name: 'Paddenstoel', art: () => PX.mushroom() }, { name: 'IJsje', art: () => PX.icecream() }, { name: 'Bloem', art: () => PX.flower() },
    { name: 'Kroon', art: () => PX.crown() }, { name: 'Wortel', art: () => PX.carrot() },
  ];
  let clothBg = null;
  const buildCloth = () => mkCanvas(W, H, c => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = ((x >> 3) + (y >> 3)) & 1; let col = a ? '#FFD6E5' : CREAM;
      if (((x & 7) === 0 || (y & 7) === 0) && a) col = '#FFC2D9';
      R(c, x, y, 1, 1, col);
    }
  });
  function drawPicker(t, left, right) {
    for (const [i, fn] of [[0, left], [1, right]]) {
      const x = 10 + i * 92, y = 12, bob = Math.round(Math.sin(t * 3 + i * 1.5));
      panel(ctx, x, y + bob, 80, 118, '#FFFFFF', CREAM2);
      fn(x + 40, y + bob);
    }
  }
  function Memory() {
    let mode = null, cards = [], openCards = [], lock = false, done = false, cw, ch, sc;
    function start(level) {
      mode = level; done = false; lock = false; openCards = []; parts.length = 0;
      bar.setActive(level);
      const pairs = level === 'easy' ? 3 : 6;
      const pool = shuffle(level === 'easy' ? ITEMS.filter(i => i.animal) : ITEMS.slice()).slice(0, pairs);
      const cols = level === 'easy' ? 3 : 4, rows = level === 'easy' ? 2 : 3;
      cw = level === 'easy' ? 48 : 38; ch = level === 'easy' ? 58 : 42; sc = level === 'easy' ? 3 : 2;
      const gx = (W - cols * cw) / (cols + 1), gy = (H - rows * ch) / (rows + 1);
      const deck = shuffle(pool.concat(pool));
      cards = deck.map((item, i) => ({ item, x: Math.round(gx + (i % cols) * (cw + gx)), y: Math.round(gy + Math.floor(i / cols) * (ch + gy)), flip: 0, target: 0, gone: false, pop: 0, deal: i * .06 }));
      sfx.whoosh();
      say(level === 'easy' ? 'Zoek twee dezelfde plaatjes!' : 'Zoek de paren! Onthoud goed waar alles ligt.');
    }
    function tapCard(c) {
      if (lock || c.gone || c.target === 1 || done) return;
      c.target = 1; sfx.brush(); openCards.push(c);
      if (openCards.length < 2) { say(c.item.name + '!'); return; }
      lock = true;
      const [a, b] = openCards;
      if (a.item === b.item) {
        say(c.item.name + '! Goed zo!');
        later(450, () => { sfx.sparkle(); a.pop = b.pop = .001; });
        later(800, () => {
          sfx.pop();
          for (const k of [a, b]) { k.gone = true; burst(k.x + cw / 2, k.y + ch / 2, ['#FFD43B', '#FF8FC8', '#FFFFFF', '#B9A3F0'], 20, 55, { g: 60, spark: true }); }
          openCards = []; lock = false;
          if (cards.every(k => k.gone)) finish();
        });
      } else {
        say(c.item.name + '!');
        later(1300, () => { a.target = b.target = 0; sfx.whoosh(); openCards = []; lock = false; });
      }
    }
    function finish() {
      done = true; ex.memory++; api.save();
      later(300, () => { confetti(80); sfx.tada(); say('Hoera! Alles gevonden!'); });
      later(2200, () => api.reward('Goed onthouden!').then(() => { if (alive && scene === me) start(mode); }));
    }
    let bar;
    const me = {
      enter() {
        clothBg = clothBg || buildCloth();
        bar = setBar([
          { id: 'easy', label: 'Makkelijk', icon: fennaHead, onClick: () => start('easy') },
          { id: 'hard', label: 'Moeilijk', icon: annaHead, onClick: () => start('hard') },
          backTool,
        ]);
        say('Memory! Kies makkelijk of moeilijk.');
      },
      update(dt) {
        for (const c of cards) {
          if (c.deal > 0) c.deal -= dt;
          const d = c.target - c.flip; c.flip += clamp(d, -dt * 4, dt * 4);
          if (c.pop > 0 && c.pop < 1) c.pop = Math.min(1, c.pop + dt * 3);
        }
      },
      draw(t) {
        ctx.drawImage(clothBg, 0, 0);
        if (!mode) {
          drawPicker(t, (cx, y) => {
            for (let i = 0; i < 3; i++) draw(cardIcon, cx - 14 + i * 14, y + 44, 1);
            draw(PX.fenna(), cx, y + 106, 3);
          }, (cx, y) => {
            for (let i = 0; i < 6; i++) draw(cardIcon, cx - 25 + (i % 3) * 14 + 7, y + 22 + Math.floor(i / 3) * 16, 1);
            draw(PX.anna(), cx, y + 110, 3);
          });
          return;
        }
        for (const c of cards) {
          if (c.gone) { R(ctx, c.x + 3, c.y + 3, cw - 6, ch - 6, 'rgba(255,255,255,.35)'); continue; }
          if (c.deal > 0) continue;
          const f = c.flip, show = f > .5 ? cardFace(cw, ch, c.item, sc) : cardBack(cw, ch);
          const k = Math.max(.08, Math.abs(1 - 2 * f));
          let w = Math.max(2, Math.round(cw * k)), h = ch, lift = f > 0 && f < 1 ? 2 : 0;
          if (c.pop > 0) { const s = 1 + .18 * Math.sin(c.pop * Math.PI); w = Math.round(w * s); h = Math.round(ch * s); }
          const x = Math.round(c.x + (cw - w) / 2), y = Math.round(c.y + (ch - h) / 2 - lift);
          R(ctx, c.x + 2, c.y + ch - 1, cw - 3, 2, 'rgba(43,30,58,.25)');
          ctx.drawImage(show, x, y, w, h);
          if (c.pop > 0 && Math.sin(t * 20) > 0) draw(PX.sparkle(), c.x + cw - 4, c.y + 8);
        }
      },
      down(p) {
        if (!mode) { start(p.x < W / 2 ? 'easy' : 'hard'); return; }
        const c = cards.find(k => p.x >= k.x && p.x < k.x + cw && p.y >= k.y && p.y < k.y + ch);
        if (c) tapCard(c);
      },
    };
    return me;
  }

  /* ======================= BALLONNEN ======================= */
  const COLORS = [
    { n: 'rode', c: '#F0484E' }, { n: 'blauwe', c: '#4DABF7' }, { n: 'gele', c: '#FFD43B' }, { n: 'groene', c: '#5BC86A' },
    { n: 'roze', c: '#FF9ACB' }, { n: 'paarse', c: '#9775FA' }, { n: 'oranje', c: '#FF9A3C' },
  ];
  const PASTEL = ['#FFB3CC', '#BFE3FF', '#FFF0A6', '#C6F1DB', '#DCCBFA', '#FFD3A8'];
  const NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const LETTERS = ['A', 'N', 'F', 'E', 'A', 'N', 'F', 'E', 'O', 'M', 'S', 'B', 'L', 'I', 'K', 'P'];
  let balBg = null;
  const buildBalBg = () => mkCanvas(W, H, c => {
    skyFill(c, [[0, '#7CC6F0'], [90, '#BDE6FA'], [134, '#E4F6FF']], 0, 134);
    const cloud = (x, y, s) => { for (const [dx, dy, r] of [[0, 0, 6], [7, -3, 7], [15, 0, 6], [7, 2, 6]]) for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) R(c, x + dx * s + xx, y + dy * s + yy, 1, 1, yy > 2 ? '#E6EEFB' : '#FFFFFF'); };
    cloud(20, 46, 1); cloud(130, 30, 1); cloud(80, 84, 1); cloud(168, 96, 1);
    for (let i = 0; i < 8; i++) {
      const x0 = i * 26 - 4, col = i % 2 ? '#F0484E' : '#9775FA';
      for (let y = 0; y < 12; y++) { const hw = y; for (let x = -hw; x <= hw; x++) R(c, x0 + 12 + x, 120 + y, 1, 1, Math.abs(x) === hw ? INK : ((x + 20) >> 2) & 1 ? col : CREAM); }
      R(c, x0 + 12, 115, 1, 5, '#6B5A7D'); R(c, x0 + 13, 115, 3, 2, '#FFD43B');
    }
    for (let y = 132; y < H; y++) for (let x = 0; x < W; x++) R(c, x, y, 1, 1, y === 132 ? '#9BDB7D' : ((x + y) & 1 ? '#7BC86C' : '#68BC5E'));
  });
  function Balloons() {
    let mode = null, balloons = [], target = null, prevTarget = null, waiting = false, correct = 0, bar;
    const LANES = [18, 49, 80, 111, 142, 173];
    const isColor = () => mode === 'color';
    const valCol = v => isColor() ? COLORS[v].c : null;
    const qText = () => isColor() ? `Tik op de ${COLORS[target].n} ballon!` : (/\d/.test(target) ? `Tik op nummer ${target}!` : `Tik op de letter ${target}!`);
    function randVal(avoid) {
      for (let n = 0; n < 30; n++) {
        let v;
        if (isColor()) v = Math.floor(Math.random() * COLORS.length);
        else v = (target && /\d/.test(target)) || (!target && Math.random() < .5) ? (Math.random() < .8 ? pick(NUMS) : pick(LETTERS)) : (Math.random() < .8 ? pick(LETTERS) : pick(NUMS));
        if (!avoid.has(v)) return v;
      }
      return isColor() ? 0 : '1';
    }
    function present() { return new Set(balloons.filter(b => b.alive).map(b => b.val)); }
    function freeLane() { const used = new Set(balloons.filter(b => b.alive).map(b => b.lane)); return pick(LANES.map((_, i) => i).filter(i => !used.has(i))); }
    function newBalloon(b, y) {
      const avoid = present(); b.alive = false;
      b.lane = freeLane(); b.y = y; b.alive = true; b.wob = 0; b.ph = rnd(0, 6);
      b.vy = isColor() ? rnd(7, 10) : rnd(8, 12);
      b.val = target !== null && !avoid.has(target) ? target : randVal(avoid);
      b.col = isColor() ? valCol(b.val) : pick(PASTEL);
      return b;
    }
    function start(m) {
      mode = m; correct = 0; target = null; prevTarget = null; waiting = false; parts.length = 0;
      bar.setActive(m);
      balloons = [];
      const ys = shuffle([14, 46, 78, 110, 142]);
      for (let i = 0; i < 5; i++) balloons.push(newBalloon({}, ys[i]));
      sfx.whoosh();
      later(300, ask);
    }
    function ask() {
      waiting = false;
      const vis = balloons.filter(b => b.alive && b.y > 34 && b.y < H - 40);
      let cand = (vis.length ? vis : balloons.filter(b => b.alive)).map(b => b.val);
      if (cand.length > 1) cand = cand.filter(v => v !== prevTarget);
      target = pick(cand); prevTarget = target;
      say(qText());
    }
    function hit(b) {
      if (b.val === target) {
        b.alive = false; waiting = true; correct++; ex.popped++; api.save();
        sfx.pop(); later(90, () => sfx.chime((correct - 1) % 8));
        burst(LANES[b.lane], b.y + 14, [b.col, '#FFFFFF', mix(b.col, '#FFFFFF', .5), '#FFD43B'], 30, 70, { g: 70, spark: true });
        say(pick(['Goed zo!', 'Ja, knap!', 'Super!', 'Hoera!', 'Gevonden!']));
        later(1100, () => newBalloon(b, H + 6));
        if (correct % 5 === 0) {
          later(700, () => { paused = true; api.reward('Knap gedaan!').then(() => { if (!alive) return; paused = false; later(300, ask); }); });
        } else later(1300, ask);
      } else {
        b.wob = .6; sfx.wrong();
        say('Bijna! Probeer nog eens. ' + qText());
      }
    }
    function drawBalloon(b, t) {
      const wx = b.wob > 0 ? Math.round(Math.sin(t * 40) * 2) : 0;
      const x = LANES[b.lane] + Math.round(Math.sin(b.ph) * 2) + wx, y = Math.round(b.y);
      for (let i = 0; i < 14; i++) R(ctx, x + Math.round(Math.sin(b.ph * 1.3 + i * .45) * 1.2), y + 29 + i, 1, 1, '#8C7FA0');
      const sp = bigBalloon(b.col); ctx.drawImage(sp, x - 12, y);
      if (!isColor()) { const s = String(b.val), gw = textWidth(s, 2); text(ctx, s, x - gw / 2 + 1, y + 6, 2, INK, '#FFFFFF'); }
    }
    return {
      enter() {
        balBg = balBg || buildBalBg();
        bar = setBar([
          { id: 'color', label: 'Kleuren', icon: fennaHead, onClick: () => start('color') },
          { id: 'abc', label: 'Cijfers & letters', icon: annaHead, onClick: () => start('abc') },
          { id: 'again', label: 'Herhaal', icon: PX.sprite(['..k.k', '.kk..', 'kkk.k', 'kkk.k', '.kk..', '..k.k'], { k: '#4DABF7' }, { key: 'k-spk' }), onClick: () => { if (mode && target !== null && !waiting) say(qText()); else if (!mode) say('Kies kleuren of cijfers en letters.'); } },
          backTool,
        ]);
        say('Ballonnen! Kies kleuren, of cijfers en letters.');
      },
      update(dt) {
        if (!mode) return;
        for (const b of balloons) {
          if (!b.alive) continue;
          b.y -= b.vy * dt; b.ph += dt * 1.5; if (b.wob > 0) b.wob -= dt;
          if (b.y < -46) newBalloon(b, H + 6);
        }
      },
      draw(t) {
        ctx.drawImage(balBg, 0, 0);
        if (!mode) {
          drawPicker(t, (cx, y) => {
            for (let i = 0; i < 3; i++) draw(PX.balloon(COLORS[i].c), cx - 14 + i * 14, y + 50 + (i === 1 ? -4 : 0), 1);
            draw(PX.fenna(), cx, y + 106, 3);
          }, (cx, y) => {
            text(ctx, 'A', cx - 22, y + 10, 2, INK, null); text(ctx, '7', cx + 12, y + 10, 2, INK, null); text(ctx, 'F', cx - 5, y + 24, 2, '#D63F7C', null);
            draw(PX.anna(), cx, y + 110, 3);
          });
          return;
        }
        for (const b of balloons) if (b.alive) drawBalloon(b, t);
        // question banner
        if (target !== null) {
          panel(ctx, 74, 1, 44, 34, '#FFFFFF');
          if (isColor()) ctx.drawImage(bigBalloon(COLORS[target].c), 84, 3);
          else { const s = String(target), gw = textWidth(s, 3); text(ctx, s, 96 - gw / 2, 7, 3, '#D63F7C', null); }
        }
        for (let i = 0; i < 5; i++) { const on = i < correct % 5 || (correct > 0 && correct % 5 === 0 && paused); ctx.globalAlpha = on ? 1 : .3; draw(PX.star(), 128 + i * 12, 14); ctx.globalAlpha = 1; }
      },
      down(p) {
        if (!mode) { start(p.x < W / 2 ? 'color' : 'abc'); return; }
        if (p.y < 36 && p.x > 72 && p.x < 120 && target !== null && !waiting) { say(qText()); return; }
        if (waiting) return;
        for (let i = balloons.length - 1; i >= 0; i--) {
          const b = balloons[i]; if (!b.alive) continue;
          const x = LANES[b.lane];
          if (p.x > x - 15 && p.x < x + 15 && p.y > b.y - 3 && p.y < b.y + 34) { hit(b); return; }
        }
      },
    };
  }

  /* ---------------- input & loop ---------------- */
  const onDown = e => { e.preventDefault(); pointerDown = true; if (!paused && scene && scene.down) scene.down(stage.toLocal(e)); };
  const onMove = e => { if (!paused && scene && scene.move) scene.move(stage.toLocal(e), pointerDown || e.pointerType === 'mouse'); };
  const onUp = () => { pointerDown = false; };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);

  stage.loop((dt, t) => {
    if (!scene) return;
    if (!paused) { scene.update(dt, t); stepParts(dt); }
    scene.draw(t);
    drawParts();
  });

  setScene(Menu());

  return () => {
    alive = false; clearTimers();
    if (scene && scene.exit) scene.exit();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    stage.destroy();
  };
}
