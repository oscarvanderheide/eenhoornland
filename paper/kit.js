// The kit: what every paper set is made of. Paper with grain, card slabs with a cut edge, hand-cut outlines.
// No scene, no game: a set (set-*.js) and the stage (paper.js) both build with this.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
export { THREE };

/* ---------------- small helpers ---------------- */
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- paper ---------------- */
/** a tileable sheet of paper: soft clouds of value noise plus little fibres, near white (materials tint it) */
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
export const PAPER = paperCanvas(512, 7);
export function tex(cv, repeat = 1, color = true) {
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = 4; if (color) t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const paperMap = tex(PAPER, .28), paperBump = tex(PAPER, .28, false);
/** paper with a print on it: little strokes for grass, a stipple for sand (drawn grey, the material tints it) */
export function printed(kind, seed) {
  const c = paperCanvas(512, seed), g = c.getContext('2d'), R = rng(seed + 1);
  if (kind === 'grass') for (let i = 0; i < 520; i++) {
    const x = R() * 512, y = R() * 512, l = 5 + R() * 7, a = -Math.PI / 2 + (R() - .5) * .9;
    g.strokeStyle = R() < .7 ? 'rgba(80,90,60,.28)' : 'rgba(255,255,240,.5)'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  } else for (let i = 0; i < 1400; i++) { g.fillStyle = R() < .6 ? 'rgba(120,95,60,.22)' : 'rgba(255,255,245,.5)'; g.beginPath(); g.arc(R() * 512, R() * 512, .8 + R() * 1.4, 0, 7); g.fill(); }
  return c;
}
export const grassCv = printed('grass', 41), sandCv = printed('sand', 42);
export const grassMap = tex(grassCv, .3), grassBump = tex(grassCv, .3, false), sandMap = tex(sandCv, .3), sandBump = tex(sandCv, .3, false);
/** matte paper in a colour; every material shares the same grain so the whole set looks made of one kind of stock */
export const papers = new Map();
export function paper(color, o = {}) {
  // one material per kind of paper, shared: pieces of the same paper can then be drawn in one go (see bake). Never change one after making it
  const key = [color, (o.map || paperMap).uuid, (o.bump || paperBump).uuid, o.bumpScale ?? 1.6, o.side ?? THREE.FrontSide, JSON.stringify(o.extra || 0)].join('|');
  let m = papers.get(key); if (!m) { papers.set(key, m = makePaper(color, o)); m.userData.kind = key.slice(key.indexOf('|') + 1); } return m;
}
/** the white sheet of a kind of paper (same grain, side and glow, any colour): pieces of one kind are glued into one mesh that
 *  carries each piece's colour in its corners, so a set costs one draw per kind of paper however many colours it uses */
const sheets = new Map();
export function sheetOf(m) {
  const kind = m.userData.kind; if (!kind) return null;
  let s = sheets.get(kind); if (!s) { s = m.clone(); s.color.set('#ffffff'); s.vertexColors = true; sheets.set(kind, s); } return s;
}
export function makePaper(color, o) {
  return new THREE.MeshStandardMaterial({ color, map: o.map || paperMap, bumpMap: o.bump || paperBump, bumpScale: o.bumpScale ?? 1.6, roughness: .93, metalness: 0, side: o.side ?? THREE.FrontSide, ...(o.extra || {}) });
}
/** the cut edge of corrugated card: two paper skins and the fluting between them */
export function cardEdgeCanvas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#b58e62'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#cfae84'; g.fillRect(0, 0, 256, 9); g.fillRect(0, 55, 256, 9);
  g.strokeStyle = '#8c6842'; g.lineWidth = 2.2;
  for (let x = -8; x < 270; x += 9) { g.beginPath(); g.moveTo(x, 10); g.bezierCurveTo(x + 6, 22, x + 6, 42, x, 54); g.stroke(); }
  g.fillStyle = 'rgba(70,45,25,.35)'; g.fillRect(0, 9, 256, 2); g.fillRect(0, 53, 256, 2);
  const p = paperCanvas(128, 3, 120, .6); g.globalCompositeOperation = 'multiply'; g.drawImage(p, 0, 0, 256, 64);
  return c;
}
export const EDGE = cardEdgeCanvas();

/* ---------------- card slabs (ExtrudeGeometry with honest UVs) ---------------- */
/** u along the outline, v up the cut edge from 0 to 1, tops in world units */
export function uvGen(depth) {
  return {
    generateTopUV(g, v, a, b, c) { return [a, b, c].map(i => new THREE.Vector2(v[i * 3], v[i * 3 + 1])); },
    generateSideWallUV(g, v, a, b, c, d) {
      const P = i => [v[i * 3], v[i * 3 + 1], v[i * 3 + 2]], A = P(a), B = P(b), C = P(c), D = P(d);
      const ux = Math.abs(A[1] - B[1]) < Math.abs(A[0] - B[0]);
      const u = p => (ux ? p[0] : p[1]) * .7;
      return [new THREE.Vector2(u(A), A[2] / depth), new THREE.Vector2(u(B), B[2] / depth), new THREE.Vector2(u(C), C[2] / depth), new THREE.Vector2(u(D), D[2] / depth)];
    },
  };
}
/** a flat piece of card cut to `pts` ([x, z] on the ground), lying with its top at y = top */
export function slab(pts, top, depth, topMat, edgeMat, holes = []) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4, UVGenerator: uvGen(depth) });
  geo.rotateX(-Math.PI / 2); geo.translate(0, top - depth, 0);
  const m = new THREE.Mesh(geo, [topMat, edgeMat]); m.castShadow = m.receiveShadow = true; return m;
}
/** an upright piece of card: outline in its own plane (x right, y up), `t` thick */
export function card(pts, t, mat, edgeMat = mat, holes = []) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 6, UVGenerator: uvGen(t) });
  geo.translate(0, 0, -t / 2);
  const m = new THREE.Mesh(geo, [mat, edgeMat]); m.castShadow = m.receiveShadow = true; return m;
}
export const edgeMat = (() => { const t = tex(EDGE, 1); t.repeat.set(1, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: .95 }); })();
export const whiteEdge = paper('#efe6d4');

/** a hand-cut blob: an ellipse with slow waves and a little scissor jitter */
export function blob(cx, cz, rx, rz, seed, n = 64, wob = .07) {
  const R = rng(seed), p1 = R() * 6, p2 = R() * 6, out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = 1 + wob * Math.sin(3 * a + p1) + wob * .6 * Math.sin(5 * a + p2) + (R() - .5) * .018;
    out.push([cx + Math.cos(a) * rx * r, cz + Math.sin(a) * rz * r]);
  }
  return out;
}
export function inPoly(p, x, z) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
export function edgeDist(p, x, z) {
  let best = 1e9;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ax, az] = p[j], [bx, bz] = p[i], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z));
  }
  return best;
}

/* ---------------- outlines used again and again ---------------- */
export function wavyTop(w, h, seed, amp, waves) {
  const R = rng(seed), p = R() * 6, pts = [[-w / 2, 0]];
  for (let i = 0; i <= 40; i++) { const x = -w / 2 + w * i / 40; pts.push([x, h + Math.sin(x / w * Math.PI * waves + p) * amp + Math.sin(x * 1.7 + p * 2) * amp * .3 + (R() - .5) * .04]); }
  pts.push([w / 2, 0]); return pts;
}
export function cloudPts(w, seed) {
  const R = rng(seed), pts = [], bumps = 4 + Math.floor(R() * 2);
  pts.push([-w / 2, 0]);
  for (let b = 0; b < bumps; b++) {
    const x0 = -w / 2 + w * b / bumps, x1 = -w / 2 + w * (b + 1) / bumps, r = (x1 - x0) / 2, cx = (x0 + x1) / 2, hb = r * (1.1 + R() * .7);
    for (let i = 0; i <= 8; i++) { const a = Math.PI - Math.PI * i / 8; pts.push([cx + Math.cos(a) * r, Math.sin(a) * hb]); }
  }
  pts.push([w / 2, 0]); return pts;
}
export function sunPts(r, rays) { const p = []; for (let i = 0; i < rays * 2; i++) { const a = i / (rays * 2) * Math.PI * 2, rr = i % 2 ? r * .78 : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
export function circlePts(r, seed, n = 40) { const R = rng(seed), p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 + (R() - .5) * .025); p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
/** a path cut by hand: a ribbon of card along a line of points ([x, z]), about `w` wide, bending smoothly through them,
 *  its edges a little uneven as scissors leave them. Gives the outline (for slab) */
export function ribbon(line, w, seed, wob = .09) {
  const R = rng(seed), ph = R() * 6, mid = [], n = line.length, at = i => line[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < 8; k++) {
    const t = k / 8, [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    mid.push([0, 1].map(j => .5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t * t * t)));
  }
  mid.push(line[n - 1]);
  const left = [], right = [];
  mid.forEach(([x, z], i) => {
    const [px, pz] = mid[Math.max(0, i - 1)], [qx, qz] = mid[Math.min(mid.length - 1, i + 1)], l = Math.hypot(qx - px, qz - pz) || 1, nx = -(qz - pz) / l, nz = (qx - px) / l;
    const end = Math.min(1, .55 + Math.min(i, mid.length - 1 - i) * .15);   // the ends are cut round
    const hl = w / 2 * end * (1 + wob * Math.sin(i * .7 + ph) + (R() - .5) * .05), hr = w / 2 * end * (1 + wob * Math.sin(i * .5 + ph * 2) + (R() - .5) * .05);
    left.push([x + nx * hl, z + nz * hl]); right.push([x - nx * hr, z - nz * hr]);
  });
  return [...left, ...right.reverse()];
}
export const WATER_Y = -.62;   // where things float
