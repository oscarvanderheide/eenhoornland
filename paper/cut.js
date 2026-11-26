// The paper kit for figures: paper grain, the shapes a pair of scissors makes, pieces that cast a small shadow on the
// piece below, and cutout(), which glues a drawing onto a white backing card.
// Every draw function is called twice by cutout(): once for the outline (g.colour false: no shadows, no ink) and once in colour.
// So anything that sticks out of the figure must be a piece(); ink() and line() only show inside the outline.

export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
export const lerp = (a, b, t) => a + (b - a) * t;

/** a tileable sheet of paper: soft clouds of value noise plus little fibres, near white */
export function paperCanvas(size, seed, fibres = 900, contrast = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const R = rng(seed), img = g.createImageData(size, size), d = img.data;
  const octs = [[6, .34], [14, .26], [34, .2], [80, .12], [170, .08]].map(([n, w]) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = R(); return { n, w, a }; });
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const o of octs) {
      const fx = x / size * o.n, fy = y / size * o.n, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
      const i0 = ix % o.n, i1 = (ix + 1) % o.n, j0 = (iy % o.n) * o.n, j1 = ((iy + 1) % o.n) * o.n;
      v += o.w * lerp(lerp(o.a[j0 + i0], o.a[j0 + i1], tx), lerp(o.a[j1 + i0], o.a[j1 + i1], tx), ty);
    }
    const k = (y * size + x) * 4, val = 238 + (v - .5) * 46 * contrast;
    d[k] = val + 3; d[k + 1] = val + 1; d[k + 2] = val - 4; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < fibres; i++) {
    const x = R() * size, y = R() * size, a = R() * Math.PI * 2, l = 3 + R() * 16;
    g.strokeStyle = R() < .6 ? `rgba(255,255,250,${.35 * contrast})` : `rgba(110,90,70,${.12 * contrast})`; g.lineWidth = .5 + R() * .7;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}

/* ---------- shapes ---------- */
export const TAU = Math.PI * 2;
/** an ellipse */
export const E = (x, y, rx, ry, rot = 0) => g => { g.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
/** a smooth closed shape through the midpoints of `pts` (the points pull the curve like a hand cutting round them) */
export const S = pts => g => {
  const n = pts.length, m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  g.moveTo(...m(n - 1)); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i)); g.closePath();
};
/** a rounded limb from (x1, y1) to (x2, y2), r1 thick at the start, r2 at the end */
export const C = (x1, y1, x2, y2, r1, r2 = r1) => g => {
  const a = Math.atan2(y2 - y1, x2 - x1), q = Math.PI / 2;
  g.moveTo(x1 + Math.cos(a + q) * r1, y1 + Math.sin(a + q) * r1); g.arc(x1, y1, r1, a + q, a + 3 * q); g.arc(x2, y2, r2, a - q, a + q); g.closePath();
};
export const U = (...bs) => g => bs.forEach(b => b(g));
/** a shape with straight cut edges (a crown, a star) */
export const P = pts => g => { g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
/** one piece of paper: in colour it casts a soft shadow on what lies under it */
export function piece(g, col, build, lift = 1) {
  g.save();
  if (g.colour && lift) { g.shadowColor = 'rgba(70,45,50,.30)'; g.shadowBlur = 3 + 2 * lift; g.shadowOffsetX = 1 + lift; g.shadowOffsetY = 1.5 + 1.5 * lift; }
  g.fillStyle = col; g.beginPath(); build(g); g.fill(); g.restore();
}
/** flat ink: eyes, cheeks, stripes (printed on, no thickness) */
export function ink(g, col, build) { if (!g.colour) return; g.save(); g.fillStyle = col; g.beginPath(); build(g); g.fill(); g.restore(); }
export function line(g, col, w, pts) { if (!g.colour) return; g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); g.restore(); }
export function eye(g, x, y, r = 4.6) {
  ink(g, '#33262e', E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32));
}

/** a walk is WALK drawings (frames 1..WALK after the standing frame 0); s swings from -1 to 1 and back over one cycle of two steps */
export const WALK = 12;
export const swing = f => f ? Math.sin((f - 1) / WALK * TAU) : 0;

/** draws a figure twice: its outline grown into a white backing card, then the pieces in colour, then paper grain */
export function cutout(w, h, draw, grain, S2 = 2, border = 5) {
  const W = w * S2, H = h * S2, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const shape = mk(), sg = shape.getContext('2d'); sg.scale(S2, S2); sg.colour = false; draw(sg);
  const col = mk(), cg = col.getContext('2d'); cg.scale(S2, S2); cg.colour = true; draw(cg);
  // the backing card: the outline grown by `border` all round (a union of shifted copies)
  const mask = mk(), mg = mask.getContext('2d'), r = border * S2;
  mg.drawImage(shape, 0, 0); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; mg.drawImage(shape, Math.cos(a) * r, Math.sin(a) * r); }
  const out = mk(), o = out.getContext('2d');
  o.drawImage(mask, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#f7f1e5'; o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = 'source-over'; o.drawImage(col, 0, 0);
  if (grain) { o.globalCompositeOperation = 'multiply'; o.drawImage(grain, 0, 0, Math.min(grain.width, W * .8), Math.min(grain.height, H * .8), 0, 0, W, H); }
  o.globalCompositeOperation = 'destination-in'; o.drawImage(mask, 0, 0);
  return out;
}
