// The figures of the paper world in a simple cut-paper style: few, clean shapes glued onto a white backing card,
// each piece casting a small shadow on the one below. All face right (the world flips them).
// Every draw function is called twice by cutout(): once for the outline (no shadows) and once in colour.

export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const lerp = (a, b, t) => a + (b - a) * t;

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
const TAU = Math.PI * 2;
/** an ellipse */
const E = (x, y, rx, ry, rot = 0) => g => { g.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
/** a smooth closed shape through the midpoints of `pts` (the points pull the curve like a hand cutting round them) */
const S = pts => g => {
  const n = pts.length, m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  g.moveTo(...m(n - 1)); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i)); g.closePath();
};
/** a rounded limb from (x1, y1) to (x2, y2), r1 thick at the start, r2 at the end */
const C = (x1, y1, x2, y2, r1, r2 = r1) => g => {
  const a = Math.atan2(y2 - y1, x2 - x1), q = Math.PI / 2;
  g.moveTo(x1 + Math.cos(a + q) * r1, y1 + Math.sin(a + q) * r1); g.arc(x1, y1, r1, a + q, a + 3 * q); g.arc(x2, y2, r2, a - q, a + q); g.closePath();
};
const U = (...bs) => g => bs.forEach(b => b(g));
/** one piece of paper: in colour it casts a soft shadow on what lies under it */
function piece(g, col, build, lift = 1) {
  g.save();
  if (g.colour && lift) { g.shadowColor = 'rgba(70,45,50,.30)'; g.shadowBlur = 3 + 2 * lift; g.shadowOffsetX = 1 + lift; g.shadowOffsetY = 1.5 + 1.5 * lift; }
  g.fillStyle = col; g.beginPath(); build(g); g.fill(); g.restore();
}
/** flat ink: eyes, cheeks, stripes (printed on, no thickness) */
function ink(g, col, build) { if (!g.colour) return; g.save(); g.fillStyle = col; g.beginPath(); build(g); g.fill(); g.restore(); }
function line(g, col, w, pts) { if (!g.colour) return; g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); g.restore(); }
function eye(g, x, y, r = 4.6) {
  ink(g, '#33262e', E(x, y, r * .86, r * 1.08)); ink(g, '#fff', E(x + r * .3, y - r * .4, r * .32, r * .32));
}

/** a walk is WALK drawings (frames 1..WALK after the standing frame 0); s swings from -1 to 1 and back over one cycle of two steps */
export const WALK = 12;
const swing = f => f ? Math.sin((f - 1) / WALK * TAU) : 0;

/* ---------- the sisters ---------- */
const KID = {
  anna: { skin: '#F4CDB0', skin2: '#E2B293', hair: '#EEC363', hair2: '#D4A648', dress: '#F58DB9', dress2: '#DC6A9E', collar: '#FBF3E6', shoe: '#5BAEE8', shoe2: '#3E8DCB', clip: '#FF6FA5',
    head: 42, headY: 94, neck: 132, hem: 204, foot: 222, arm: 36, pony: 24 },
  fenna: { skin: '#F2C8A8', skin2: '#DFAD8C', hair: '#8A5634', hair2: '#6E4126', dress: '#A586E8', dress2: '#8467CC', collar: '#FBF3E6', shoe: '#F06FA3', shoe2: '#CC4F86', clip: '#F7CE5A',
    head: 40, headY: 92, neck: 128, hem: 226, foot: 258, arm: 46, pony: 56 },
};
function kid(o) {
  return (g, f) => {
    const s = swing(f), hy = o.headY, r = o.head, cx = 102;
    const thigh = o.hem - 10, legR = 8, shoulder = o.neck + 12;
    // far leg and arm (in the shade)
    piece(g, o.skin2, C(cx - 8, thigh, cx - 8 - s * 7, o.foot - 2, legR));
    piece(g, o.shoe2, E(cx - 3 - s * 7, o.foot + 4, 12, 7.5));
    piece(g, o.skin2, C(cx - 12, shoulder, cx - 19 - s * 9, shoulder + o.arm, 6.5, 8));
    // the ponytail, tied high at the back of her head: it swings out and curls down (longer for Fenna), and bounces as she walks
    { const L = o.pony, k = s * 3, bx = cx - r * .55, by = hy - r * .62;
      piece(g, o.hair, S([[bx + 6, by + 4], [bx - 14, by - 14], [bx - 38, by - 10], [bx - 50 + k, by + 10], [bx - 50 + k, by + L * .6], [bx - 40 + k, by + L + 12], [bx - 30 + k, by + L + 4],
        [bx - 34 + k, by + L * .55], [bx - 28, by + 16], [bx - 12, by + 12]]));
      ink(g, o.hair2, S([[bx - 34, by - 4], [bx - 44 + k, by + 12], [bx - 44 + k, by + L * .5], [bx - 38 + k, by + L * .6], [bx - 38, by + 14]])); }
    // near leg
    piece(g, o.skin, C(cx + 8, thigh, cx + 8 + s * 7, o.foot - 2, legR));
    piece(g, o.shoe, E(cx + 13 + s * 7, o.foot + 4, 13, 7.5));
    // the dress, a little A, with a band at the hem and a white collar
    const w0 = 16, w1 = 29 + (o.hem - o.neck) * .07;
    piece(g, o.dress, S([[cx - w0, o.neck - 4], [cx + w0, o.neck - 4], [cx + w0 + 3, o.neck + 10], [cx + w1, o.hem - 2], [cx + w1 - 2, o.hem + 4], [cx, o.hem + 8], [cx - w1 + 2, o.hem + 4], [cx - w1, o.hem - 2], [cx - w0 - 3, o.neck + 10]]));
    piece(g, o.dress2, S([[cx - w1 + 3, o.hem - 9], [cx + w1 - 3, o.hem - 9], [cx + w1, o.hem - 1], [cx + w1 - 2, o.hem + 4], [cx, o.hem + 8], [cx - w1 + 2, o.hem + 4], [cx - w1, o.hem - 1]]), .6);
    piece(g, o.collar, S([[cx - 16, o.neck - 6], [cx + 16, o.neck - 6], [cx + 10, o.neck + 6], [cx, o.neck + 3], [cx - 10, o.neck + 6]]), .6);
    // near arm with a round hand
    piece(g, o.skin, C(cx + 13, shoulder, cx + 20 + s * 9, shoulder + o.arm, 6.5, 8));
    // head: the hair behind, the face, then the hair on top with a fringe
    piece(g, o.hair2, E(cx - 6, hy - 6, r + 3, r - 3));
    piece(g, o.skin, E(cx + 4, hy, r, r - 1));
    const t = hy - r, b = hy + r;
    piece(g, o.hair, S([[cx - r + 14, hy + 30], [cx - r - 5, hy + 6], [cx - r - 4, hy - 26], [cx - 22, t - 4], [cx + 6, t - 8], [cx + 34, t + 2], [cx + r + 6, hy - 22], [cx + r + 8, hy - 8],
      [cx + r - 4, hy - 16], [cx + 30, hy - 10], [cx + 20, hy - 20], [cx + 8, hy - 8], [cx - 4, hy - 18], [cx - 14, hy - 2], [cx - 14, hy + 18], [cx - 18, hy + 32]]));
    // the clip
    { const bx = cx - r * .55, by = hy - r * .62;
      piece(g, o.clip, U(E(bx - 9, by - 7, 9, 6.5, -.9), E(bx + 3, by + 7, 9, 6.5, -.9)), .7); piece(g, o.clip, E(bx - 3, by, 5, 5), .9); }
    // face: two dot eyes (the far one a little smaller), rosy cheeks, a small smile
    eye(g, cx + 28, hy + 6, 5); eye(g, cx + 8, hy + 6, 4.3);
    ink(g, 'rgba(240,120,140,.45)', E(cx + 36, hy + 20, 8, 5.5)); ink(g, 'rgba(240,120,140,.35)', E(cx + 2, hy + 20, 6, 4.5));
    if (g.colour) { g.save(); g.strokeStyle = '#8a3d4c'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.arc(cx + 20, hy + 18, 6, .35, Math.PI - .5); g.stroke(); g.restore(); }
  };
}
export const drawAnna = kid(KID.anna), drawFenna = kid(KID.fenna);

/* ---------- the unicorns ---------- */
const UNI = { body: '#FCF8F1', shade: '#E6DCEA', pink: '#F4A6C4', lilac: '#BBA6EA', mint: '#9ED9CF', horn: '#EBC35E', horn2: '#C9993A', hoof: '#C9A9DE', hoof2: '#AE8CC8', muzzle: '#F8DDE4' };
/** the baby: round and chubby, no neck, a little horn */
export function drawBaby(g, f) {
  const s = swing(f), u = UNI;
  piece(g, u.shade, C(82, 150, 84 - s * 6, 176, 10.5)); piece(g, u.hoof2, E(86 - s * 6, 182, 12, 7));
  piece(g, u.shade, C(138, 150, 140 + s * 6, 176, 10.5)); piece(g, u.hoof2, E(142 + s * 6, 182, 12, 7));
  // a curly tail
  piece(g, u.pink, E(40, 118, 17, 11, -.7)); piece(g, u.lilac, E(32, 134, 15, 10, -.2)); piece(g, u.mint, E(38, 150, 12, 8, .5));
  piece(g, u.body, E(98, 136, 58, 38));
  piece(g, u.body, C(70, 150, 66 - s * 6, 180, 12)); piece(g, u.hoof, E(68 - s * 6, 186, 13.5, 7.5));
  piece(g, u.body, C(124, 152, 126 + s * 6, 180, 12)); piece(g, u.hoof, E(128 + s * 6, 186, 13.5, 7.5));
  // head and muzzle in one piece, then the pink nose on top
  piece(g, u.body, U(E(160, 92, 40, 38), E(184, 108, 26, 22)));
  piece(g, u.muzzle, E(192, 112, 18, 14), .5);
  ink(g, '#D99AAE', E(200, 108, 2.6, 2));
  // ear, mane tufts, horn
  piece(g, u.body, S([[138, 66], [144, 30], [162, 60]])); ink(g, u.pink, S([[144, 62], [146, 40], [156, 60]]));
  piece(g, u.lilac, E(128, 80, 16, 12, -1.1), .7); piece(g, u.mint, E(124, 100, 13, 10, -1.4), .7);
  piece(g, u.pink, E(140, 64, 19, 12, -.5), .7); piece(g, u.pink, E(166, 58, 14, 9, .3), .7);
  piece(g, u.horn, S([[160, 56], [178, 22], [178, 22], [176, 58]]), .8);
  line(g, u.horn2, 2, [[164, 46], [176, 44]]); line(g, u.horn2, 2, [[168, 36], [177, 34]]);
  eye(g, 174, 90, 5.6); ink(g, 'rgba(240,120,150,.4)', E(172, 108, 8, 5.5));
}
/** the grown unicorn: tall and slender, a long horn, a flowing mane and tail, wings folded on her side */
export function drawGrown(g, f) {
  const s = swing(f), u = UNI;
  piece(g, u.shade, C(104, 196, 102 - s * 9, 262, 10, 8)); piece(g, u.hoof2, E(105 - s * 9, 268, 12, 7));
  piece(g, u.shade, C(178, 196, 180 + s * 9, 262, 10, 8)); piece(g, u.hoof2, E(183 + s * 9, 268, 12, 7));
  // the tail: three long strands
  piece(g, u.mint, S([[78, 170], [46, 188], [36, 236], [50, 262], [56, 232], [76, 196]]), .7);
  piece(g, u.lilac, S([[76, 166], [36, 176], [20, 222], [30, 250], [42, 218], [72, 188]]), .7);
  piece(g, u.pink, S([[80, 162], [44, 160], [22, 196], [24, 222], [40, 198], [76, 180]]), .7);
  piece(g, u.body, E(142, 184, 66, 40));
  // a short strong neck rising to the head
  piece(g, u.body, S([[158, 178], [166, 136], [184, 108], [206, 96], [226, 106], [222, 140], [214, 192]]));
  piece(g, u.body, C(116, 196, 112 - s * 9, 266, 12, 9)); piece(g, u.hoof, E(115 - s * 9, 272, 13, 8));
  piece(g, u.body, C(190, 196, 192 + s * 9, 266, 12, 9)); piece(g, u.hoof, E(195 + s * 9, 272, 13, 8));
  // the folded wing: a rounded shoulder and long feathers sweeping back, a pastel row under a pearl row
  piece(g, u.lilac, S([[174, 170], [166, 150], [140, 142], [110, 146], [80, 158], [98, 164], [76, 174], [100, 178], [86, 190], [116, 186], [126, 196], [148, 186]]), .8);
  piece(g, '#FFFDF8', S([[176, 166], [170, 144], [148, 134], [120, 136], [92, 148], [110, 154], [90, 164], [114, 168], [104, 180], [130, 176], [140, 186], [158, 178]]), .8);
  line(g, u.shade, 2, [[150, 150], [112, 158]]); line(g, u.shade, 2, [[156, 160], [120, 170]]);
  g.save(); g.translate(-8, 24);
  // head and muzzle
  piece(g, u.body, U(E(228, 82, 35, 32, -.1), E(250, 100, 21, 18, .3)));
  piece(g, u.muzzle, E(255, 102, 15, 12, .3), .5); ink(g, '#D99AAE', E(262, 98, 2.6, 2));
  // ear, mane down the neck, forelock, horn
  piece(g, u.body, S([[206, 60], [204, 26], [222, 54]])); ink(g, u.pink, S([[208, 56], [207, 36], [217, 53]]));
  piece(g, u.mint, S([[196, 70], [178, 92], [166, 140], [170, 168], [180, 132], [196, 96]]), .7);
  piece(g, u.lilac, S([[204, 60], [184, 78], [172, 120], [176, 150], [188, 112], [206, 80]]), .7);
  piece(g, u.pink, S([[212, 54], [194, 62], [182, 96], [186, 124], [198, 92], [216, 70]]), .7);
  piece(g, u.pink, E(222, 56, 13, 8, .4), .7);
  piece(g, u.horn, S([[218, 52], [246, 4], [246, 4], [232, 56]]), .8);
  for (let i = 0; i < 4; i++) line(g, u.horn2, 2, [[224 + i * 4.6, 44 - i * 9], [233 + i * 3.4, 42 - i * 9]]);
  eye(g, 236, 78, 7); line(g, '#33262e', 2, [[230, 71], [225, 65]]); line(g, '#33262e', 2, [[234, 69], [231, 62]]);
  ink(g, 'rgba(240,120,150,.5)', E(242, 96, 9, 6));
  if (g.colour) { g.save(); g.strokeStyle = '#c9788f'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(258, 104, 7, .5, Math.PI - .7); g.stroke(); g.restore(); }
  g.restore();
}

/** canvas sizes (drawing units) and how tall each stands in the world */
export const FIGS = {
  anna: { w: 200, h: 240, draw: drawAnna, frames: 1 + WALK, size: 1.2 },
  fenna: { w: 200, h: 276, draw: drawFenna, frames: 1 + WALK, size: 1.38 },
  baby: { w: 220, h: 200, draw: drawBaby, frames: 1 + WALK, size: .95 },
  grown: { w: 280, h: 284, draw: drawGrown, frames: 1 + WALK, size: 1.75 },
};

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
