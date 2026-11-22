// Het Atelier: sticker scene maker. Pick a background, add stickers, drag them around, save to the gallery.
export const meta = { id: 'atelier', title: 'Het Atelier' };

const W = 192, H = 144, MAX_STICKERS = 60, MAX_GALLERY = 12;
const INK = '#2B1E3A';
let rewardedThisSession = false;

/* ---------------- pixel helpers ---------------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const rgbCache = new Map();
function rgbOf(h) {
  let c = rgbCache.get(h); if (c) return c;
  const s = h.replace('#', ''); c = [0, 2, 4].map(i => parseInt(s.substr(i, 2), 16)); rgbCache.set(h, c); return c;
}
function painter(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(w, h); const d = img.data;
  const p = {
    cv, ctx, w, h,
    px(x, y, col) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h || !col) return; const [r, g, b] = rgbOf(col); const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; },
    get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return null; const i = (y * w + x) * 4; return '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); },
    rect(x0, y0, x1, y1, col) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) p.px(x, y, col); },
    disc(cx, cy, r, fn) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dd = Math.hypot(x + .5 - cx, y + .5 - cy); if (dd <= r) p.px(x, y, typeof fn === 'function' ? fn(x, y, dd) : fn); } },
    flush() { ctx.putImageData(img, 0, 0); return cv; },
  };
  return p;
}
/** vertical gradient as solid pixel bands with a dithered seam between neighbouring colours */
function bandCol(stops, t, x, y) {
  const v = Math.max(0, Math.min(.9999, t)) * (stops.length - 1); const i = Math.floor(v); const f = v - i;
  const k = Math.max(0, Math.min(1, (f - .3) / .4));
  return k > bayer(x, y) ? stops[Math.min(stops.length - 1, i + 1)] : stops[i];
}
function grad(p, x0, y0, x1, y1, stops) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) p.px(x, y, bandCol(stops, (y - y0) / (y1 - y0), x, y)); }
function cloud(p, cx, cy, s, light = '#FFFFFF', shade = '#DCEBF7') {
  const blobs = [[0, 0, 5], [-6, 2, 4], [6, 2, 4], [-11, 4, 2.5], [11, 4, 2.5], [2, -3, 4]];
  for (const [bx, by, r] of blobs) p.disc(cx + bx * s, cy + by * s, r * s, (x, y) => (y > cy + 3 * s ? shade : light));
  for (let x = Math.round(cx - 13 * s); x < cx + 13 * s; x++) for (let y = Math.round(cy + 3 * s); y < cy + 6.5 * s; y++) { if (p.get(x, y) === light) p.px(x, y, shade); }
}
function sunDisc(p, cx, cy, r, col = '#FFE066', hi = '#FFF3A8', halo = '#FFF6D0') {
  p.disc(cx, cy, r + 4, (x, y, d) => (d > r ? ((x + y) & 1 ? halo : p.get(x, y)) : (x - cx + y - cy < -r * .4 ? hi : col)));
}

/* ---------------- backgrounds ---------------- */
const BGS = [
  { id: 'weide', name: 'De weide' },
  { id: 'strand', name: 'Het strand' },
  { id: 'nacht', name: 'De nacht' },
  { id: 'kasteel', name: 'Het kasteel' },
  { id: 'water', name: 'Onder water' },
];
const bgCache = new Map();
function bgCanvas(id, PX) {
  if (bgCache.has(id)) return bgCache.get(id);
  const p = painter(W, H); const r = PX.rng(id.length * 977 + id.charCodeAt(0));
  const extra = []; // sprites drawn on top after the pixel pass: [canvas, x, y]
  if (id === 'weide') {
    grad(p, 0, 0, W, 104, ['#7FC8F0', '#97D4F4', '#B2E1F6', '#CFEDF7', '#E8F7F4']);
    sunDisc(p, 160, 24, 10);
    const hf = x => 84 + 7 * Math.sin(x * .035 + 1) + 4 * Math.sin(x * .09);
    for (let x = 0; x < W; x++) for (let y = Math.floor(hf(x)); y < 112; y++) p.px(x, y, bandCol(['#A6DB8E', '#93D07F', '#84C676'], (y - hf(x)) / 26, x, y));
    for (let i = 0; i < 9; i++) { const tx = 8 + i * 22 + r() * 8; p.disc(tx, hf(tx) - 1, 3 + r() * 2, (x, y) => (x < tx ? '#86C873' : '#6FB463')); }
    const hn = x => 102 + 6 * Math.sin(x * .025 + 2.5) + 3 * Math.sin(x * .07);
    for (let x = 0; x < W; x++) { const t = Math.floor(hn(x)); p.px(x, t, '#B5EA8C'); for (let y = t + 1; y < H; y++) p.px(x, y, bandCol(['#7CCB64', '#6CC05E', '#5DB257', '#52A651'], (y - t) / (H - t), x, y)); }
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(r() * W), y = Math.floor(hn(x) + 4 + r() * (H - hn(x) - 4)); const k = r();
      if (k < .55) { p.px(x, y, '#4E9A51'); p.px(x - 1, y - 1, '#4E9A51'); p.px(x + 1, y - 1, '#4E9A51'); }
      else { const c = ['#FF9EC7', '#FFFFFF', '#FFE066', '#C9B8F5'][Math.floor(r() * 4)]; p.px(x, y - 1, c); p.px(x - 1, y, c); p.px(x + 1, y, c); p.px(x, y + 1, c); p.px(x, y, '#FFF3A8'); }
    }
    extra.push([PX.treeRound(5), 14, 110], [PX.bush(3), 178, 112]);
  } else if (id === 'strand') {
    grad(p, 0, 0, W, 72, ['#7CC8F0', '#9AD6F4', '#BFE6F5', '#E6F2E6', '#FFE3BE']);
    sunDisc(p, 44, 46, 11, '#FFD166', '#FFE89A', '#FFEBC8');
    for (let y = 72; y < 104; y++) for (let x = 0; x < W; x++) p.px(x, y, bandCol(['#8ED0EE', '#62B6E2', '#4AA0D6', '#3F92CD'], (y - 72) / 32, x, y));
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * W), y = 75 + Math.floor(r() * 24), l = 2 + Math.floor(r() * 4); for (let k = 0; k < l; k++) p.px(x + k, y, '#D8F1FF'); }
    for (let y = 73; y < 100; y += 2) { const l = 3 + Math.floor(r() * 4); for (let k = 0; k < l; k++) p.px(44 - l / 2 + k + Math.floor(r() * 3) - 1, y, '#FFE9A8'); }
    const sh = x => 101 + 3 * Math.sin(x * .05) + 1.5 * Math.sin(x * .17);
    for (let x = 0; x < W; x++) {
      const t = Math.floor(sh(x)); p.px(x, t - 2, '#E8F7FF'); p.px(x, t - 1, '#FFFFFF'); p.px(x, t, '#FFFFFF');
      for (let y = t + 1; y < H; y++) p.px(x, y, bandCol(['#E9D7A6', '#F7E3AD', '#F2D497', '#E8C27F'], (y - t) / (H - t), x, y));
    }
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * W), y = 108 + Math.floor(r() * 36); p.px(x, y, r() < .5 ? '#D9A962' : '#FFF3D0'); }
    // shells and a starfish
    for (let i = 0; i < 4; i++) { const x = 20 + Math.floor(r() * 150), y = 116 + Math.floor(r() * 22); p.rect(x, y, x + 3, y + 2, '#FFB3CC'); p.px(x + 1, y - 1, '#FFB3CC'); p.px(x + 1, y, '#FF8FB1'); }
    const sx = 132, sy = 128; for (let k = -3; k <= 3; k++) { p.px(sx + k, sy, '#FF8C42'); p.px(sx, sy + k, '#FF8C42'); } p.px(sx - 2, sy + 3, '#FF8C42'); p.px(sx + 2, sy + 3, '#FF8C42'); p.px(sx, sy, '#FFB47A');
    // palm tree
    for (let i = 0; i <= 50; i++) { const t = i / 50, x = 176 - 14 * t * t, y = 124 - 58 * t; p.rect(Math.round(x - 2), Math.round(y), Math.round(x + 2), Math.round(y) + 2, i % 6 < 3 ? '#A9744F' : '#8A5A3B'); }
    const tx = 162, ty = 66;
    for (let a = 0; a < 6; a++) {
      const ang = -Math.PI + a * Math.PI / 5 + .1, len = 20 + (a % 2) * 4;
      for (let s = 0; s <= len; s++) { const x = tx + Math.cos(ang) * s, y = ty + Math.sin(ang) * s * .6 + (s / len) ** 2 * 12; p.rect(Math.round(x) - 1, Math.round(y) - 1, Math.round(x) + 2, Math.round(y) + 1, s > len * .6 ? '#4DB37C' : '#3B9B62'); }
    }
    p.disc(tx - 2, ty + 2, 2.2, '#8A5A3B'); p.disc(tx + 2, ty + 3, 2.2, '#7A4E33');
  } else if (id === 'nacht') {
    grad(p, 0, 0, W, 112, ['#161A45', '#1E2257', '#2A2D6B', '#3A367F', '#56428F', '#74509C']);
    for (let i = 0; i < 80; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 90); p.px(x, y, ['#FFFFFF', '#FFF3A8', '#BFD8FF'][Math.floor(r() * 3)]); }
    for (let i = 0; i < 7; i++) { const x = 70 + Math.floor(r() * 110), y = 6 + Math.floor(r() * 50); p.px(x, y, '#FFFFFF'); p.px(x - 1, y, '#BFD8FF'); p.px(x + 1, y, '#BFD8FF'); p.px(x, y - 1, '#BFD8FF'); p.px(x, y + 1, '#BFD8FF'); }
    p.disc(38, 30, 18, (x, y, d) => (d > 13 ? ((x + y) & 1 ? '#3E3B86' : p.get(x, y)) : (d > 12 ? '#E8DCA0' : '#FFF1B8')));
    [[33, 26, 2.5], [43, 33, 2], [36, 37, 1.5], [44, 24, 1.2]].forEach(([x, y, rr]) => p.disc(x, y, rr, '#EADB98'));
    const hf = x => 92 + 8 * Math.sin(x * .03 + .4) + 3 * Math.sin(x * .1);
    for (let x = 0; x < W; x++) for (let y = Math.floor(hf(x)); y < 118; y++) p.px(x, y, '#2C3570');
    [[120, 1], [140, 0], [96, 1]].forEach(([hx, lit]) => { const by = Math.floor(hf(hx)) + 2; p.rect(hx - 4, by - 6, hx + 4, by, '#22295E'); for (let k = 0; k < 5; k++) p.rect(hx - 4 + k, by - 7 - k, hx + 4 - k, by - 6 - k, '#22295E'); if (lit) { p.px(hx - 2, by - 4, '#FFD98A'); p.px(hx + 1, by - 4, '#FFD98A'); } });
    const hn = x => 110 + 5 * Math.sin(x * .028 + 2) + 2 * Math.sin(x * .09);
    for (let x = 0; x < W; x++) { const t = Math.floor(hn(x)); p.px(x, t, '#4A7A78'); for (let y = t + 1; y < H; y++) p.px(x, y, bandCol(['#2F5A5E', '#28505A', '#21454F', '#1C3C48'], (y - t) / (H - t), x, y)); }
    for (let i = 0; i < 40; i++) { const x = Math.floor(r() * W), y = Math.floor(hn(x) + 4 + r() * (H - hn(x) - 4)); p.px(x, y, '#3D6E6A'); p.px(x + 1, y - 1, '#3D6E6A'); }
    extra.push([PX.pine(4), 12, 120], [PX.pine(6), 180, 118]);
  } else if (id === 'kasteel') {
    grad(p, 0, 0, W, 106, ['#BBA8F2', '#CDBDF7', '#E2CFF5', '#F5D8EC', '#FFE3EA']);
    const wall = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) p.px(x, y, x >= x1 - 3 ? '#D6C6E8' : ((y % 6 === 0 && (x + 3 * (Math.floor(y / 6) & 1)) % 8 !== 0) ? '#F7F0FB' : (((x + 3 * (Math.floor(y / 6) & 1)) % 8 === 0) && y % 6 !== 0 ? '#E3D5EF' : '#EFE5F6'))); };
    const crenel = (x0, x1, y) => { for (let x = x0; x < x1; x += 6) p.rect(x, y - 4, Math.min(x + 4, x1), y, '#EFE5F6'); };
    const roof = (cx, y0, y1, hw, c1, c2) => { for (let y = y0; y < y1; y++) { const w = (y - y0) / (y1 - y0) * hw; for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) p.px(x, y, x > cx + w * .25 ? c2 : ((x + y) % 7 === 0 ? mixHex(c1, '#FFFFFF', .35) : c1)); } };
    const flag = (x, y, c) => { p.rect(x, y - 10, x + 1, y, '#7A5236'); for (let k = 0; k < 4; k++) p.rect(x + 1, y - 10 + k, x + 1 + (6 - k * 1.5), y - 9 + k, c); for (let k = 0; k < 3; k++) p.rect(x + 1, y - 6 + k, x + 1 + (2 + k * 1.5), y - 5 + k, c); };
    const win = (x, y) => { p.rect(x, y, x + 4, y + 6, '#6E5A9E'); p.rect(x + 1, y - 1, x + 3, y, '#6E5A9E'); p.rect(x + 1, y + 1, x + 3, y + 3, '#9FD0F2'); p.px(x + 1, y + 1, '#E6FBFF'); };
    cloud(p, 30, 26, 1, '#FFFFFF', '#F2DDF0'); cloud(p, 170, 16, .8, '#FFFFFF', '#F2DDF0');
    wall(62, 54, 130, 106); crenel(62, 130, 54);
    wall(84, 30, 108, 60); roof(96, 6, 30, 15, '#9775FA', '#7653C4'); flag(96, 7, '#FFD43B');
    wall(44, 38, 64, 106); crenel(44, 64, 38); roof(54, 16, 36, 13, '#FF7EB6', '#E0559A'); flag(54, 17, '#69DB7C');
    wall(128, 38, 148, 106); crenel(128, 148, 38); roof(138, 16, 36, 13, '#FF7EB6', '#E0559A'); flag(138, 17, '#4DABF7');
    win(52, 50); win(52, 72); win(136, 50); win(136, 72); win(94, 38); win(74, 66); win(114, 66);
    for (let y = 80; y < 106; y++) for (let x = 86; x < 106; x++) { const dx = x + .5 - 96, top = 80 + 10 - Math.sqrt(Math.max(0, 100 - dx * dx)); if (y < top) continue; p.px(x, y, (x === 86 || x === 105 || y === Math.ceil(top)) ? '#6E4630' : (x === 96 ? '#7A4E33' : (x % 4 === 0 ? '#9A6A48' : '#A97450'))); }
    p.px(99, 94, '#FFD43B'); p.px(93, 94, '#FFD43B');
    for (let x = 0; x < W; x++) for (let y = 104; y < H; y++) p.px(x, y, y === 104 ? '#B5EA8C' : bandCol(['#8FD47A', '#7CCB64', '#6CBE5E', '#5DB257'], (y - 104) / 40, x, y));
    for (let y = 105; y < H; y++) { const hw = 9 + (y - 105) * .55; for (let x = Math.floor(96 - hw); x <= 96 + hw; x++) { const edge = Math.abs(x + .5 - 96) > hw - 1.5; if (edge && bayer(x, y) < .5) continue; p.px(x, y, (y + (x >> 2)) % 5 === 0 ? '#E5C48E' : '#F2D7A6'); } }
    for (let i = 0; i < 40; i++) { const x = Math.floor(r() * W), y = 108 + Math.floor(r() * 36); if (Math.abs(x - 96) < 12 + (y - 105) * .6) continue; const c = ['#FF9EC7', '#FFFFFF', '#FFE066'][Math.floor(r() * 3)]; p.px(x, y, c); p.px(x, y + 1, '#4E9A51'); }
    extra.push([PX.bush(2), 30, 108], [PX.bush(5), 162, 108]);
  } else if (id === 'water') {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c = bandCol(['#79D6EA', '#5CC3E2', '#45AAD8', '#3590C8', '#2C78B6', '#2563A3'], y / H, x, y);
      const beam = ((x + y * .45) % 46 + 46) % 46; if (y < 110 && beam < 7 && bayer(x, y) < .55 * (1 - y / 110)) c = mixHex(c, '#FFFFFF', .22);
      p.px(x, y, c);
    }
    for (let x = 0; x < W; x += 1) if (Math.sin(x * .3) > .2) p.px(x, 1, '#B8EEF7');
    const fl = x => 122 + 4 * Math.sin(x * .04) + 2 * Math.sin(x * .13);
    // seaweed behind the sand
    for (let i = 0; i < 9; i++) {
      const bx = 6 + i * 22 + Math.floor(r() * 10), hgt = 22 + Math.floor(r() * 26), ph = r() * 6;
      for (let s = 0; s < hgt; s++) { const x = Math.round(bx + Math.sin(s * .22 + ph) * 2.5), y = Math.round(fl(bx) + 2 - s); p.px(x, y, '#3FA66B'); p.px(x + 1, y, s % 5 < 2 ? '#2F8A5A' : '#56C07E'); if (s % 7 === 3) { p.px(x - 1, y, '#56C07E'); p.px(x - 2, y - 1, '#56C07E'); } }
    }
    for (let x = 0; x < W; x++) { const t = Math.floor(fl(x)); p.px(x, t, '#FFF1C4'); for (let y = t + 1; y < H; y++) p.px(x, y, bandCol(['#F2D9A0', '#E8C98C', '#DCB67A'], (y - t) / (H - t), x, y)); }
    for (let i = 0; i < 50; i++) { const x = Math.floor(r() * W), y = 126 + Math.floor(r() * 18); p.px(x, y, '#C9A06A'); }
    const rock = (cx, cy, rw, rh) => { for (let y = cy - rh; y <= cy; y++) for (let x = cx - rw; x <= cx + rw; x++) { if (((x - cx) / rw) ** 2 + ((y - cy) / rh) ** 2 > 1) continue; p.px(x, y, (x - cx) / rw + (y - cy) / rh < -.6 ? '#ABA6C8' : ((x - cx) / rw > .4 ? '#6E6890' : '#8A85AA')); } };
    rock(30, 128, 12, 8); rock(44, 130, 7, 5); rock(158, 126, 10, 7);
    const coral = (bx, by, col, dark) => {
      const branch = (x, y, len, ang, dpt) => { for (let s = 0; s < len; s++) { const xx = Math.round(x + Math.cos(ang) * s), yy = Math.round(y + Math.sin(ang) * s); p.px(xx, yy, col); p.px(xx + 1, yy, dark); }
        if (dpt > 0) { const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len; branch(ex, ey, len * .7, ang - .5, dpt - 1); branch(ex, ey, len * .7, ang + .5, dpt - 1); } else p.disc(x + Math.cos(ang) * len, y + Math.sin(ang) * len, 1.2, col); };
      branch(bx, by, 7, -Math.PI / 2, 2);
    };
    coral(100, 126, '#FF7EB6', '#E0559A'); coral(116, 127, '#FFA94D', '#E8843A'); coral(176, 126, '#B9A3F0', '#9775FA');
    const sx = 72, sy = 134; for (let k = -3; k <= 3; k++) { p.px(sx + k, sy, '#FF6B6B'); p.px(sx, sy + k, '#FF6B6B'); } p.px(sx, sy, '#FFB3B3');
  }
  const cv = p.flush();
  for (const [s, x, y] of extra) PX.drawSprite(cv.getContext('2d'), s, x, y, 1);
  bgCache.set(id, cv); return cv;
}
function mixHex(a, b, t) { const A = rgbOf(a), B = rgbOf(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

/** small animated details on top of each background (also used at t=0 for thumbnails) */
function drawAmbient(ctx, id, t, PX, cloudCv) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
  if (id === 'weide' || id === 'strand') {
    const n = id === 'strand' ? 1 : 2;
    for (let i = 0; i < n; i++) { const span = W + 60; const x = ((i * 97 + 30 + t * (3 + i * 1.5)) % span) - 30; ctx.drawImage(cloudCv, Math.round(x), 12 + i * 22); }
  }
  if (id === 'strand') for (let i = 0; i < 6; i++) { if (Math.sin(t * 2.5 + i * 1.7) > .75) { const x = (i * 53 + 17) % W, y = 76 + (i * 7) % 22; px(x, y, '#FFFFFF'); px(x - 1, y, '#D8F1FF'); px(x + 1, y, '#D8F1FF'); } }
  if (id === 'nacht') {
    for (let i = 0; i < 10; i++) { const s = Math.sin(t * 1.7 + i * 2.3); if (s > .6) { const x = (i * 71 + 60) % W, y = 8 + (i * 29) % 70; px(x, y, '#FFFFFF'); if (s > .85) { px(x - 1, y, '#BFD8FF'); px(x + 1, y, '#BFD8FF'); px(x, y - 1, '#BFD8FF'); px(x, y + 1, '#BFD8FF'); } } }
    for (let i = 0; i < 7; i++) { const x = (i * 37 + 20 + Math.sin(t * .7 + i) * 10 + W) % W, y = 112 + i * 4 % 26 + Math.sin(t * 1.3 + i * 2) * 4; if (Math.sin(t * 2 + i) > -.3) { px(x, y, '#FFF39A'); ctx.globalAlpha = .35; ctx.fillStyle = '#FFF39A'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); ctx.globalAlpha = 1; } }
  }
  if (id === 'water') {
    for (let i = 0; i < 10; i++) {
      const sp = 10 + (i % 3) * 4, y = H + 4 - ((t * sp + i * 41) % (H + 10)), x = (i * 43 + 11) % W + Math.sin(t * 2 + i) * 2, big = i % 3 === 0;
      ctx.fillStyle = '#DFF7FF'; if (big) { ctx.fillRect(Math.round(x), Math.round(y) - 1, 2, 1); ctx.fillRect(Math.round(x) - 1, Math.round(y), 1, 2); ctx.fillRect(Math.round(x) + 2, Math.round(y), 1, 2); ctx.fillRect(Math.round(x), Math.round(y) + 2, 2, 1); px(x, y, '#FFFFFF'); } else px(x, y, '#DFF7FF');
    }
  }
}

/* ---------------- extra sprites (same style as pixel.js) ---------------- */
function extraSprites(PX) {
  const fish = () => PX.sprite([
    '....ooooo...',
    'o..osoooooo.',
    'oooosoooooko',
    'oooLsoooooooo',
    'o..osooooooo',
    '....ooooo...',
  ], { o: '#FF9F43', L: '#FFC58A', s: '#FFFFFF', k: INK }, { key: 'atl-fish' });
  const cloudS = () => PX.sprite([
    '.....www......',
    '...wwwwwww.ww.',
    '.wwwwwwwwwwwww',
    'wwwwwwwwwwwwww',
    'wwwwwwwwwwwwww',
    '.bbbbbbbbbbbb.',
  ], { w: '#FFFFFF', b: '#DDE6F5' }, { key: 'atl-cloud' });
  const sun = () => PX.gridSprite(15, 15, (x, y) => {
    const dx = x + .5 - 7.5, dy = y + .5 - 7.5, d = Math.hypot(dx, dy);
    if (d <= 4.6) { if ((x === 6 || x === 9) && y === 7) return INK; if ((x === 5 || x === 10) && y === 8) return '#FF8FB1'; return dx + dy < -2.5 ? '#FFF3A8' : '#FFD43B'; }
    if (d > 5.6 && d < 7.6 && (Math.abs(dx) < .6 || Math.abs(dy) < .6 || Math.abs(Math.abs(dx) - Math.abs(dy)) < .9)) return '#FFA94D';
    return null;
  }, { key: 'atl-sun' });
  const shell = () => PX.sprite(['...p...', '.pPpPp.', 'pPpPpPp', 'pPpPpPp', '.ppppp.', '..ppp..'], { p: '#FFB3CC', P: '#FF8FB1' }, { key: 'atl-shell' });
  return { fish, cloudS, sun, shell };
}

/* ---------------- sticker catalogue ---------------- */
function catalogue(PX, uni) {
  const X = extraSprites(PX);
  return [
    { id: 'eenhoorn', name: 'Eenhoorn', art: () => PX.unicorn(uni()), say: 'Hihihi!', fx: 'sparkle' },
    { id: 'anna', name: 'Anna', art: () => PX.anna(), say: 'Hoi! Ik ben Anna!', fx: 'chime' },
    { id: 'fenna', name: 'Fenna', art: () => PX.fenna(), say: 'Hoi! Ik ben Fenna!', fx: 'chime' },
    { id: 'konijn', name: 'Konijn', art: () => PX.bunny(), say: 'Hop hop!', fx: 'boing' },
    { id: 'poes', name: 'Poes', art: () => PX.cat(), say: 'Miauw!', fx: 'purr' },
    { id: 'hond', name: 'Hondje', art: () => PX.puppy(), say: 'Woef woef!', fx: 'boing' },
    { id: 'egel', name: 'Egel', art: () => PX.hedgehog(), say: 'Snuf snuf!', fx: 'munch' },
    { id: 'eend', name: 'Eendje', art: () => PX.duck(), say: 'Kwak kwak!', fx: 'pop' },
    { id: 'vis', name: 'Visje', art: X.fish, say: 'Blub blub!', fx: 'bubble' },
    { id: 'vlinder', name: 'Vlinder', art: () => PX.butterfly(), say: 'Fladder fladder!', fx: 'whoosh' },
    { id: 'boom', name: 'Boom', art: () => PX.treeRound(3), say: 'Een grote boom!', fx: 'brush' },
    { id: 'den', name: 'Dennenboom', art: () => PX.pine(2), say: 'Een dennenboom!', fx: 'brush' },
    { id: 'struik', name: 'Struik', art: () => PX.bush(1), say: 'Ritsel ritsel!', fx: 'brush' },
    { id: 'bloem', name: 'Bloem', art: () => PX.flower(), say: 'Wat ruikt die lekker!', fx: 'sparkle' },
    { id: 'bloem2', name: 'Paarse bloem', art: () => PX.flower('#B9A3F0'), say: 'Een paarse bloem!', fx: 'sparkle' },
    { id: 'paddenstoel', name: 'Paddenstoel', art: () => PX.mushroom(), say: 'Een paddenstoel!', fx: 'boing' },
    { id: 'zon', name: 'Zon', art: X.sun, say: 'Het zonnetje schijnt!', fx: 'sparkle' },
    { id: 'wolk', name: 'Wolk', art: X.cloudS, say: 'Een zachte wolk!', fx: 'whoosh' },
    { id: 'regenboog', name: 'Regenboog', art: () => PX.rainbow(), say: 'Een regenboog!', fx: 'sparkle' },
    { id: 'maan', name: 'Maan', art: () => PX.moon(), say: 'Welterusten, maan!', fx: 'lullaby' },
    { id: 'ster', name: 'Ster', art: () => PX.star(), say: 'Twinkel twinkel!', fx: 'sparkle' },
    { id: 'hart', name: 'Hartje', art: () => PX.heart(), say: 'Ik hou van jou!', fx: 'chime' },
    { id: 'ballon', name: 'Ballon', art: () => PX.balloon(), say: 'Een rode ballon!', fx: 'boing' },
    { id: 'ballon2', name: 'Blauwe ballon', art: () => PX.balloon('#4DABF7'), say: 'Een blauwe ballon!', fx: 'boing' },
    { id: 'kroon', name: 'Kroon', art: () => PX.crown(), say: 'Een kroon voor de prinses!', fx: 'sparkle' },
    { id: 'diamant', name: 'Diamant', art: () => PX.gem(), say: 'Glinster glinster!', fx: 'sparkle' },
    { id: 'appel', name: 'Appel', art: () => PX.apple(), say: 'Hap! Lekker!', fx: 'munch' },
    { id: 'wortel', name: 'Wortel', art: () => PX.carrot(), say: 'Knabbel knabbel!', fx: 'munch' },
    { id: 'ijsje', name: 'IJsje', art: () => PX.icecream(), say: 'Mmm, een ijsje!', fx: 'munch' },
    { id: 'taart', name: 'Taart', art: () => PX.cake(), say: 'Hoera, taart!', fx: 'tada' },
    { id: 'schelp', name: 'Schelp', art: X.shell, say: 'Een mooie schelp!', fx: 'splash' },
    { id: 'lantaarn', name: 'Lantaarn', art: () => PX.lantern(), say: 'Licht aan!', fx: 'chime' },
  ];
}

/* ---------------- small UI icons ---------------- */
function icons(PX) {
  const S = PX.sprite;
  return {
    grow: S(['..ggg..', '..ggg..', 'ggggggg', 'ggggggg', 'ggggggg', '..ggg..', '..ggg..'], { g: '#69DB7C' }, { key: 'atl-i-grow' }),
    shrink: S(['.......', '.......', 'rrrrrrr', 'rrrrrrr', 'rrrrrrr', '.......', '.......'], { r: '#FFA94D' }, { key: 'atl-i-shrink' }),
    flip: S(['..b...b..', '.bb...bb.', 'bbbbbbbbb', '.bb...bb.', '..b...b..'], { b: '#4DABF7' }, { key: 'atl-i-flip' }),
    del: S(['rr...rr', 'rrr.rrr', '.rrrrr.', '..rrr..', '.rrrrr.', 'rrr.rrr', 'rr...rr'], { r: '#FF6B6B' }, { key: 'atl-i-del' }),
    clear: S(['...pp...', 'pppppppp', '........', '.gggggg.', '.gGgGgg.', '.gGgGgg.', '.gGgGgg.', '..gggg..'], { p: '#9775FA', g: '#DCCBFA', G: '#9775FA' }, { key: 'atl-i-clear' }),
    yes: S(['......g', '.....gg', 'g...gg.', 'gg.gg..', '.ggg...', '..g....'], { g: '#69DB7C' }, { key: 'atl-i-yes' }),
    arrowD: S(['..yyy..', '..yyy..', '..yyy..', 'yyyyyyy', '.yyyyy.', '..yyy..', '...y...'], { y: '#FFD43B' }, { key: 'atl-i-ad' }),
    arrowR: S(['...y...', '...yy..', 'yyyyyy.', 'yyyyyyy', 'yyyyyy.', '...yy..', '...y...'], { y: '#FFD43B' }, { key: 'atl-i-ar' }),
  };
}

const CSS = `
.act-atelier{gap:10px}
.act-atelier .atl-stage{flex:1 0 auto;display:flex;flex-direction:column;min-height:min(58vh,calc((100vw - 56px) * .75 + 8px))}
.act-atelier .atl-stage .pstage{flex:1;min-height:0}
.act-atelier .atl-panel{display:flex;flex-direction:column;gap:8px;min-width:0}
.act-atelier .sec{display:flex;flex-direction:column;gap:2px;min-width:0}
.act-atelier .sec>.hint{font-size:.9rem;text-align:left;padding-left:4px}
.act-atelier .scroll{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;padding:2px 4px 8px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.act-atelier .scroll>.tool{flex:0 0 auto}
.act-atelier .tools{gap:6px}
.act-atelier .stk{min-width:58px!important;min-height:58px!important}
.act-atelier .stk canvas{display:block}
.act-atelier .acts .tool{min-width:52px;padding:4px 5px;font-size:.78rem}
.act-atelier .bgb{padding:4px!important}
.act-atelier .bgb canvas{width:44px!important;height:33px!important}
.act-atelier .tool[aria-disabled="true"]{opacity:.45}
.act-atelier .bgb canvas,.act-atelier .thumb canvas{width:48px!important;height:36px!important;border:2px solid #2B1E3A;border-radius:3px}
.act-atelier .thumb canvas{width:64px!important;height:48px!important}
.act-atelier .savebtn{background:var(--pink);color:#fff;box-shadow:inset -3px -3px 0 var(--pink2),0 4px 0 var(--ink);min-width:72px!important}
.act-atelier .gempty{align-self:center;color:var(--soft);font-size:.9rem;padding:0 6px;white-space:nowrap}
.atl-confirm{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.atl-confirm h3{margin:0;font-size:1.6rem;color:var(--pink2)}
.atl-confirm .row .tool{min-width:96px;min-height:72px;font-size:1.2rem}
@media (orientation:landscape) and (min-width:640px){
  .act-atelier{flex-direction:row;overflow:hidden}
  .act-atelier .atl-stage{flex:1 1 auto;min-height:0;min-width:0}
  .act-atelier .atl-panel{flex:0 0 352px;overflow-y:auto;overflow-x:hidden;padding-right:2px}
  .act-atelier .sec.trays{order:-1;flex:1 1 0;min-height:132px}
  .act-atelier .tray{flex-wrap:wrap;justify-content:center;overflow-x:hidden;overflow-y:auto;flex:1;min-height:0;align-content:flex-start}
}
`;

export function open(root, api) {
  const { PX, sfx } = api;
  const say = t => api.speak(t);
  const STK = catalogue(PX, () => api.state.uni);
  const byId = Object.fromEntries(STK.map(s => [s.id, s]));
  const IC = icons(PX);
  const cloudCv = PX.sprite(['.....www......', '...wwwwwww.ww.', '.wwwwwwwwwwwww', 'wwwwwwwwwwwwww', '.bbbbbbbbbbbb.'], { w: '#FFFFFF', b: '#E3ECF8' }, { key: 'atl-amb-cloud', outline: false });
  const fx = n => { try { (sfx[n] || sfx.pop)(); } catch (e) { } };

  // ----- scene state -----
  if (!api.state.extra) api.state.extra = {};
  if (!Array.isArray(api.state.gallery)) api.state.gallery = [];
  const clean = list => (Array.isArray(list) ? list : []).filter(s => s && byId[s.type]).map(s => ({ type: s.type, x: +s.x || W / 2, y: +s.y || H * .7, scale: Math.max(1, Math.min(4, s.scale | 0 || 2)), flip: !!s.flip }));
  const work = api.state.extra.atelier || {};
  let bg = BGS.some(b => b.id === work.bg) ? work.bg : 'weide';
  let stickers = clean(work.stickers).map(s => ({ ...s, wig: -9 }));
  let currentId = work.currentId || null;
  let selected = null, drag = null, flash = 0, now = 0;
  const sparks = [];
  let modalClose = null;

  const persist = () => {
    api.state.extra.atelier = { bg, currentId, stickers: stickers.map(plain) };
    api.save();
  };
  const plain = s => ({ type: s.type, x: Math.round(s.x), y: Math.round(s.y), scale: s.scale, flip: s.flip });

  // ----- layout -----
  const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
  const stageCol = document.createElement('div'); stageCol.className = 'atl-stage'; root.appendChild(stageCol);
  const panel = document.createElement('div'); panel.className = 'atl-panel'; root.appendChild(panel);
  const stage = api.pixelStage(stageCol, W, H);
  const cv = stage.canvas, ctx = stage.ctx;
  cv.setAttribute('aria-label', 'Jouw tekening');
  const section = (label, cls) => { const s = document.createElement('div'); s.className = 'sec ' + (cls || ''); const h = document.createElement('p'); h.className = 'hint'; h.textContent = label; s.appendChild(h); panel.appendChild(s); return s; };
  const fitIcon = (btn, box) => { const c = btn.querySelector('canvas'); if (!c) return; const s = Math.max(1, Math.min(3, Math.floor(box / Math.max(c.width, c.height)))); c.style.width = c.width * s + 'px'; c.style.height = c.height * s + 'px'; };

  // actions
  const secActs = section('Plaatje in je tekening', 'acts-sec');
  const acts = api.toolbar(secActs, [
    { id: 'grow', label: 'Groter', icon: IC.grow, onClick: () => withSel(s => { if (s.scale >= 4) { fx('wrong'); say('Groter kan niet!'); return; } s.scale++; s.wig = now; fx('boing'); say('Groter!'); }) },
    { id: 'shrink', label: 'Kleiner', icon: IC.shrink, onClick: () => withSel(s => { if (s.scale <= 1) { fx('wrong'); say('Kleiner kan niet!'); return; } s.scale--; s.wig = now; fx('pop'); say('Kleiner!'); }) },
    { id: 'flip', label: 'Draaien', icon: IC.flip, onClick: () => withSel(s => { s.flip = !s.flip; s.wig = now; fx('whoosh'); say('Omdraaien!'); }) },
    { id: 'del', label: 'Weg', icon: IC.del, onClick: () => withSel(s => { removeSticker(s); }) },
    { id: 'clear', label: 'Alles weg', icon: IC.clear, onClick: askClear },
  ], { small: true });
  acts.classList.add('acts');

  // sticker tray
  const secTray = section('Plaatjes', 'trays');
  const tray = api.toolbar(secTray, STK.map(s => ({ id: s.id, label: s.name, icon: s.art(), onClick: () => addSticker(s.id) })), { small: true, noLabel: true });
  tray.classList.add('tray', 'scroll');
  tray.querySelectorAll('.tool').forEach(b => { b.classList.add('stk'); fitIcon(b, 56); });

  // backgrounds
  const secBg = section('Achtergrond', 'bgs');
  const bgBar = api.toolbar(secBg, BGS.map(b => ({ id: b.id, label: b.name, icon: thumbCanvas({ bg: b.id, stickers: [] }, 48, 36), onClick: () => setBg(b.id) })), { small: true, noLabel: true });
  bgBar.classList.add('scroll');
  bgBar.querySelectorAll('.tool').forEach(b => b.classList.add('bgb'));
  bgBar.setActive(bg);

  // gallery
  const secGal = section('Mijn tekeningen', 'gal');
  const galBar = document.createElement('div'); galBar.className = 'tools small scroll'; secGal.appendChild(galBar);

  // mouse wheel scrolls the horizontal strips
  const onWheel = e => { const el = e.currentTarget; if (el.scrollWidth > el.clientWidth + 2 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); } };
  [tray, bgBar, galBar].forEach(el => el.addEventListener('wheel', onWheel, { passive: false }));

  function renderGallery() {
    galBar.innerHTML = '';
    const sv = document.createElement('button'); sv.className = 'tool savebtn'; sv.setAttribute('aria-label', 'Bewaar');
    sv.appendChild(PX.domSprite(PX.heart(), 3)); const l = document.createElement('span'); l.textContent = 'Bewaar'; sv.appendChild(l);
    sv.onclick = saveScene; galBar.appendChild(sv);
    const g = api.state.gallery;
    if (!g.length) { const e = document.createElement('span'); e.className = 'gempty'; e.textContent = 'Nog geen tekeningen'; galBar.appendChild(e); }
    g.forEach((entry, i) => {
      const b = document.createElement('button'); b.className = 'tool thumb'; b.setAttribute('aria-label', 'Tekening ' + (i + 1));
      b.setAttribute('aria-pressed', entry.id === currentId ? 'true' : 'false');
      b.appendChild(thumbCanvas(entry, 96, 72));
      b.onclick = () => loadScene(entry);
      galBar.appendChild(b);
    });
  }
  renderGallery();

  /* ----- actions ----- */
  function updateButtons() {
    acts.querySelectorAll('.tool').forEach(b => { if (b.dataset.id !== 'clear') b.setAttribute('aria-disabled', selected ? 'false' : 'true'); });
    acts.querySelector('[data-id="clear"]').setAttribute('aria-disabled', stickers.length ? 'false' : 'true');
  }
  function withSel(fn) {
    if (!selected) { fx('wrong'); say('Tik eerst op een plaatje in je tekening.'); return; }
    fn(selected); persist(); updateButtons();
  }
  function addSticker(type) {
    if (stickers.length >= MAX_STICKERS) { fx('wrong'); say('Je tekening is vol! Haal eerst iets weg.'); return; }
    const def = byId[type]; const art = def.art();
    const scale = Math.max(1, Math.min(2, Math.floor(56 / Math.max(art.width, art.height)) || 1));
    const s = { type, x: W / 2 + Math.round((Math.random() - .5) * 100), y: Math.round(H * .6 + art.height * scale / 2 + (Math.random() - .5) * 30), scale, flip: false, wig: now };
    s.y = Math.min(H - 2, s.y);
    stickers.push(s); selected = s; burst(s);
    fx('pop'); say(def.name + '!');
    persist(); updateButtons();
  }
  function removeSticker(s) {
    stickers = stickers.filter(o => o !== s); if (selected === s) selected = null;
    burst(s); fx('whoosh'); say('Weg!');
  }
  function askClear() {
    if (!stickers.length) { fx('wrong'); say('Je tekening is al leeg.'); return; }
    const el = document.createElement('div'); el.className = 'atl-confirm';
    el.innerHTML = '<h3>Alles weg?</h3>';
    const big = PX.domSprite(IC.clear, 6); el.appendChild(big);
    const row = document.createElement('div'); row.className = 'row';
    const yes = document.createElement('button'); yes.className = 'tool'; yes.appendChild(PX.domSprite(IC.yes, 4)); yes.appendChild(Object.assign(document.createElement('span'), { textContent: 'Ja' }));
    const no = document.createElement('button'); no.className = 'tool'; no.dataset.close = '1'; no.appendChild(PX.domSprite(IC.del, 4)); no.appendChild(Object.assign(document.createElement('span'), { textContent: 'Nee' }));
    row.append(yes, no); el.appendChild(row);
    yes.onclick = () => {
      stickers.forEach(burst); stickers = []; selected = null; currentId = null;
      fx('whoosh'); say('Alles is weg. Begin maar opnieuw!');
      persist(); updateButtons(); renderGallery();
      if (modalClose) modalClose();
    };
    no.onclick = () => { fx('click'); say('Oké, we laten alles staan.'); };
    modalClose = api.modal(el, { onClose: () => { modalClose = null; } });
    say('Alles weggooien? Tik op ja of nee.');
  }
  function setBg(id) {
    bg = id; bgBar.setActive(id); fx('brush');
    say(BGS.find(b => b.id === id).name + '!');
    persist();
  }
  function saveScene() {
    fx('click');
    if (!stickers.length) { fx('wrong'); say('Zet eerst een plaatje in je tekening!'); return; }
    const g = api.state.gallery;
    const id = currentId && g.some(e => e.id === currentId) ? currentId : Date.now();
    const entry = { id, bg, stickers: stickers.map(plain) };
    const rest = g.filter(e => e.id !== id);
    api.state.gallery = [entry, ...rest].slice(0, MAX_GALLERY);
    currentId = id; flash = 1; selected = null;
    persist(); renderGallery(); updateButtons(); galBar.scrollLeft = 0;
    fx('sparkle');
    if (!rewardedThisSession) { rewardedThisSession = true; api.reward('Wat een mooie tekening!'); }
    else say('Bewaard! Wat mooi!');
  }
  function loadScene(entry) {
    bg = BGS.some(b => b.id === entry.bg) ? entry.bg : 'weide';
    stickers = clean(entry.stickers).map(s => ({ ...s, wig: now })); selected = null; currentId = entry.id;
    bgBar.setActive(bg); fx('whoosh'); say('Daar is je tekening weer!');
    persist(); renderGallery(); updateButtons();
  }

  /* ----- drawing ----- */
  function bounds(s) { const a = byId[s.type].art(); const w = a.width * s.scale, h = a.height * s.scale; const x0 = Math.round(s.x - w / 2), y0 = Math.round(s.y - h); return { x0, y0, x1: x0 + w, y1: y0 + h, w, h }; }
  function wiggle(s, t) {
    const e = t - s.wig; if (e < 0 || e > .7) return [0, 0];
    const k = 1 - e / .7;
    return [Math.round(Math.sin(e * 30) * 1.4 * k), -Math.round(Math.abs(Math.sin(e * 14)) * 5 * k)];
  }
  function drawScene(c, scene, t, live) {
    c.imageSmoothingEnabled = false;
    c.drawImage(bgCanvas(scene.bg, PX), 0, 0);
    drawAmbient(c, scene.bg, t, PX, cloudCv);
    for (const s of scene.stickers) {
      const def = byId[s.type]; if (!def) continue;
      const [dx, dy] = live ? wiggle(s, t) : [0, 0];
      PX.drawSprite(c, def.art(), s.x + dx, s.y + dy, s.scale, s.flip);
    }
  }
  function thumbCanvas(scene, tw, th) {
    const full = document.createElement('canvas'); full.width = W; full.height = H; const fc = full.getContext('2d');
    drawScene(fc, { bg: scene.bg, stickers: clean(scene.stickers) }, 0, false);
    const out = document.createElement('canvas'); out.width = tw; out.height = th; const oc = out.getContext('2d');
    oc.imageSmoothingEnabled = true; oc.imageSmoothingQuality = 'high'; oc.drawImage(full, 0, 0, tw, th);
    out.style.imageRendering = 'auto';
    return out;
  }
  function selectionBox(s, t) {
    const b = bounds(s); const x0 = b.x0 - 2, y0 = b.y0 - 2, x1 = b.x1 + 1, y1 = b.y1 + 1;
    const ph = Math.floor(t * 8); let i = 0;
    const dot = (x, y) => { ctx.fillStyle = ((i++ + ph) % 4) < 2 ? '#FFFFFF' : '#FF5E9C'; ctx.fillRect(x, y, 1, 1); };
    for (let x = x0; x <= x1; x++) dot(x, y0);
    for (let y = y0 + 1; y <= y1; y++) dot(x1, y);
    for (let x = x1 - 1; x >= x0; x--) dot(x, y1);
    for (let y = y1 - 1; y > y0; y--) dot(x0, y);
    if (Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = INK; for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) ctx.fillRect(cx - 1, cy - 1, 3, 3); ctx.fillStyle = '#FFD43B'; for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) ctx.fillRect(cx, cy, 1, 1); }
  }
  function burst(s) { const b = bounds(s); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.random(); sparks.push({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, t: now, col: ['#FFF6D0', '#FFD43B', '#FF9EC7'][i % 3] }); } }
  const landscape = () => window.matchMedia('(orientation:landscape) and (min-width:640px)').matches;

  stage.loop((dt, t) => {
    now = t;
    drawScene(ctx, { bg, stickers }, t, true);
    if (selected && stickers.includes(selected)) selectionBox(selected, t);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i], e = t - p.t; if (e > .5 || e < 0) { sparks.splice(i, 1); continue; }
      PX.drawSprite(ctx, PX.sparkle(p.col), p.x + p.vx * e, p.y + p.vy * e + 3, 1);
    }
    if (!stickers.length) {
      const b = Math.round(Math.abs(Math.sin(t * 4)) * 4);
      if (landscape()) PX.drawSprite(ctx, IC.arrowR, W - 10 + b, H / 2 + 5, 1); else PX.drawSprite(ctx, IC.arrowD, W / 2, H - 2 + b - 4, 1);
    }
    if (flash > 0) { ctx.globalAlpha = Math.min(1, flash) * .8; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; flash -= dt * 2.5; }
  });

  /* ----- pointer: select, drag, tap ----- */
  function hit(p) {
    for (let i = stickers.length - 1; i >= 0; i--) { const b = bounds(stickers[i]); const pad = 3; if (p.x >= b.x0 - pad && p.x <= b.x1 + pad && p.y >= b.y0 - pad && p.y <= b.y1 + pad) return stickers[i]; }
    return null;
  }
  const onDown = e => {
    if (drag) return;
    e.preventDefault();
    const p = stage.toLocal(e); const s = hit(p);
    if (!s) { if (selected) { selected = null; updateButtons(); } return; }
    selected = s; stickers = stickers.filter(o => o !== s); stickers.push(s);
    drag = { id: e.pointerId, s, ox: p.x - s.x, oy: p.y - s.y, sx: p.x, sy: p.y, moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { }
    updateButtons();
  };
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = stage.toLocal(e);
    if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 2.5) drag.moved = true;
    if (drag.moved) { const b = bounds(drag.s); drag.s.x = Math.max(0, Math.min(W, p.x - drag.ox)); drag.s.y = Math.max(Math.min(b.h, 10), Math.min(H + b.h / 2, p.y - drag.oy)); }
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    try { cv.releasePointerCapture(e.pointerId); } catch (err) { }
    if (e.type === 'pointercancel') { persist(); return; }
    if (!d.moved) { d.s.wig = now; const def = byId[d.s.type]; fx(def.fx); say(def.say); }
    else fx('step');
    persist();
  };
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  const onKey = e => {
    if (!selected || modalClose) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { removeSticker(selected); persist(); updateButtons(); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') acts.querySelector('[data-id="grow"]').click();
    else if (e.key === '-') acts.querySelector('[data-id="shrink"]').click();
  };
  window.addEventListener('keydown', onKey);

  updateButtons();
  say(stickers.length ? 'Welkom terug in het atelier! Ga lekker verder met je tekening.' : 'Welkom in het atelier! Kies een plaatje en zet het in je tekening.');

  return () => {
    window.removeEventListener('keydown', onKey);
    if (modalClose) { try { modalClose(); } catch (e) { } }
    persist();
    stage.destroy();
  };
}
