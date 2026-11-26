// Papiereiland: one small island built like a handmade diorama (stacked cardboard, paper with grain, real soft light,
// a long lens with shallow focus), to see how Eenhoornland could look in that style. Separate from the game.
// Everything is drawn in code: the paper is noise + fibres, the figures are cut-paper shapes on canvases.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const DPR = Math.min(devicePixelRatio || 1, 2);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, .5, 140);

/* ---------------- small helpers ---------------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const STEP = 1 / 12;   // figures move like stop motion: their poses change twelve times a second

/* ---------------- paper ---------------- */
/** a tileable sheet of paper: soft clouds of value noise plus little fibres, near white (materials tint it) */
function paperCanvas(size, seed, fibres = 900, contrast = 1) {
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
const PAPER = paperCanvas(512, 7);
function tex(cv, repeat = 1, color = true) {
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = 4; if (color) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const paperMap = tex(PAPER, .28), paperBump = tex(PAPER, .28, false);
/** paper with a print on it: little strokes for grass, a stipple for sand (drawn grey, the material tints it) */
function printed(kind, seed) {
  const c = paperCanvas(512, seed), g = c.getContext('2d'), R = rng(seed + 1);
  if (kind === 'grass') for (let i = 0; i < 520; i++) {
    const x = R() * 512, y = R() * 512, l = 5 + R() * 7, a = -Math.PI / 2 + (R() - .5) * .9;
    g.strokeStyle = R() < .7 ? 'rgba(80,90,60,.28)' : 'rgba(255,255,240,.5)'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  } else for (let i = 0; i < 1400; i++) { g.fillStyle = R() < .6 ? 'rgba(120,95,60,.22)' : 'rgba(255,255,245,.5)'; g.beginPath(); g.arc(R() * 512, R() * 512, .8 + R() * 1.4, 0, 7); g.fill(); }
  return c;
}
const grassCv = printed('grass', 41), sandCv = printed('sand', 42);
const grassMap = tex(grassCv, .3), grassBump = tex(grassCv, .3, false), sandMap = tex(sandCv, .3), sandBump = tex(sandCv, .3, false);
/** matte paper in a colour; every material shares the same grain so the whole set looks made of one kind of stock */
function paper(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, map: o.map || paperMap, bumpMap: o.bump || paperBump, bumpScale: o.bumpScale ?? 1.6, roughness: .93, metalness: 0, side: o.side ?? THREE.FrontSide, ...(o.extra || {}) });
}
/** the cut edge of corrugated card: two paper skins and the fluting between them */
function cardEdgeCanvas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#b58e62'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#cfae84'; g.fillRect(0, 0, 256, 9); g.fillRect(0, 55, 256, 9);
  g.strokeStyle = '#8c6842'; g.lineWidth = 2.2;
  for (let x = -8; x < 270; x += 9) { g.beginPath(); g.moveTo(x, 10); g.bezierCurveTo(x + 6, 22, x + 6, 42, x, 54); g.stroke(); }
  g.fillStyle = 'rgba(70,45,25,.35)'; g.fillRect(0, 9, 256, 2); g.fillRect(0, 53, 256, 2);
  const p = paperCanvas(128, 3, 120, .6); g.globalCompositeOperation = 'multiply'; g.drawImage(p, 0, 0, 256, 64);
  return c;
}
const EDGE = cardEdgeCanvas();

/* ---------------- card slabs (ExtrudeGeometry with honest UVs) ---------------- */
/** u along the outline, v up the cut edge from 0 to 1, tops in world units */
function uvGen(depth) {
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
function slab(pts, top, depth, topMat, edgeMat, holes = []) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4, UVGenerator: uvGen(depth) });
  geo.rotateX(-Math.PI / 2); geo.translate(0, top - depth, 0);
  const m = new THREE.Mesh(geo, [topMat, edgeMat]); m.castShadow = m.receiveShadow = true; return m;
}
/** an upright piece of card: outline in its own plane (x right, y up), `t` thick */
function card(pts, t, mat, edgeMat = mat, holes = []) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 6, UVGenerator: uvGen(t) });
  geo.translate(0, 0, -t / 2);
  const m = new THREE.Mesh(geo, [mat, edgeMat]); m.castShadow = m.receiveShadow = true; return m;
}
const edgeMat = (() => { const t = tex(EDGE, 1); t.repeat.set(1, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: .95 }); })();
const whiteEdge = paper('#efe6d4');

/** a hand-cut blob: an ellipse with slow waves and a little scissor jitter */
function blob(cx, cz, rx, rz, seed, n = 64, wob = .07) {
  const R = rng(seed), p1 = R() * 6, p2 = R() * 6, out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = 1 + wob * Math.sin(3 * a + p1) + wob * .6 * Math.sin(5 * a + p2) + (R() - .5) * .018;
    out.push([cx + Math.cos(a) * rx * r, cz + Math.sin(a) * rz * r]);
  }
  return out;
}
function inPoly(p, x, z) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function edgeDist(p, x, z) {
  let best = 1e9;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ax, az] = p[j], [bx, bz] = p[i], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z));
  }
  return best;
}

/* ---------------- light ---------------- */
const hemi = new THREE.HemisphereLight('#cfe6e4', '#8a6f58', .85); scene.add(hemi);
const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
key.position.set(-7, 11, 8); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.blurSamples = 12;
Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 40 });
key.shadow.bias = -.0006; key.shadow.normalBias = .025;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#9fc4d8', .45); fill.position.set(8, 4, -6); scene.add(fill);

/* ---------------- backdrop: painted sky, card hills, clouds on strings ---------------- */
const skyMat = new THREE.ShaderMaterial({
  uniforms: { t: { value: tex(paperCanvas(256, 11, 300, 1.4), 3) }, eve: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying float vY; void main(){ vUv=uv; vY=(modelMatrix*vec4(position,1.)).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D t; uniform float eve; varying vec2 vUv; varying float vY;
    void main(){
      float h=clamp((vY+1.)/9.,0.,1.);
      vec3 dayLo=vec3(1.,.84,.68), dayHi=vec3(.42,.74,.78);
      vec3 eveLo=vec3(.98,.6,.48), eveHi=vec3(.22,.24,.45);
      vec3 dayMid=vec3(.97,.93,.80); vec3 day=mix(mix(dayLo,dayMid,smoothstep(.0,.35,h)),dayHi,smoothstep(.35,.9,h));
      vec3 c=mix(day, mix(eveLo,eveHi,smoothstep(.0,.6,h)), eve);
      float p=texture2D(t,vUv*vec2(6.,2.)).r; c*=.86+.16*p;
      gl_FragColor=vec4(pow(c,vec3(2.2)),1.);
    }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const sky = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 40, 48, 1, true, Math.PI * .35, Math.PI * 1.3), skyMat);
sky.position.set(0, 16, 4); scene.add(sky);
scene.fog = new THREE.Fog('#efd2b4', 30, 95);

function wavyTop(w, h, seed, amp, waves) {
  const R = rng(seed), p = R() * 6, pts = [[-w / 2, 0]];
  for (let i = 0; i <= 40; i++) { const x = -w / 2 + w * i / 40; pts.push([x, h + Math.sin(x / w * Math.PI * waves + p) * amp + Math.sin(x * 1.7 + p * 2) * amp * .3 + (R() - .5) * .04]); }
  pts.push([w / 2, 0]); return pts;
}
const hills = [['#7fb0ad', -16, 1.3, 1], ['#9cc4bb', -24, 1.9, 2], ['#bcd6c6', -33, 2.6, 3]];
for (const [col, z, h, s] of hills) {
  const m = card(wavyTop(70, h, s * 5, h * .35, 2 + s), .12, paper(col)); m.position.set(0, -1.2, z); m.castShadow = false; scene.add(m);
}
// clouds and the sun hang on threads from the top of the theatre
const thread = new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 1 });
function hung(obj, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 20, 4), thread); t.position.y = 10; g.add(t, obj); scene.add(g); return g;
}
function cloudPts(w, seed) {
  const R = rng(seed), pts = [], bumps = 4 + Math.floor(R() * 2);
  pts.push([-w / 2, 0]);
  for (let b = 0; b < bumps; b++) {
    const x0 = -w / 2 + w * b / bumps, x1 = -w / 2 + w * (b + 1) / bumps, r = (x1 - x0) / 2, cx = (x0 + x1) / 2, hb = r * (1.1 + R() * .7);
    for (let i = 0; i <= 8; i++) { const a = Math.PI - Math.PI * i / 8; pts.push([cx + Math.cos(a) * r, Math.sin(a) * hb]); }
  }
  pts.push([w / 2, 0]); return pts;
}
for (const [x, y, z, w, s] of [[-7, 3.6, -11, 2.6, 1], [5.5, 4.4, -13, 3.4, 2], [12, 3.2, -10, 2.2, 3]]) {
  const c = card(cloudPts(w, s), .08, paper('#f7f1e6'), whiteEdge); c.castShadow = false; hung(c, x, y, z);
}
function sunPts(r, rays) { const p = []; for (let i = 0; i < rays * 2; i++) { const a = i / (rays * 2) * Math.PI * 2, rr = i % 2 ? r * .78 : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
const sunCard = card(sunPts(1.1, 14), .08, paper('#f2b94e', { extra: { emissive: '#f2a93e', emissiveIntensity: .35 } })); sunCard.castShadow = false;
const sun = hung(sunCard, -11, 4.6, -14);
const moonShape = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + Math.PI * i / 24; moonShape.push([Math.cos(a) * .9, Math.sin(a) * .9]); }
for (let i = 24; i >= 0; i--) { const a = -Math.PI / 2 + Math.PI * i / 24; moonShape.push([Math.cos(a) * .45 - .05, Math.sin(a) * .82]); }
const moonCard = card(moonShape, .08, paper('#f3e2a0', { extra: { emissive: '#f3e2a0', emissiveIntensity: .6 } })); moonCard.castShadow = false;
const moon = hung(moonCard, 9, 22, -14);
const stars = new THREE.Group(); scene.add(stars);
{ const R = rng(9); for (let i = 0; i < 16; i++) { const s = card(sunPts(.18 + R() * .12, 5), .04, paper('#f6e7ad', { extra: { emissive: '#f6e7ad', emissiveIntensity: .8 } })); s.castShadow = false; const g = hung(s, -20 + R() * 40, 24 + R() * 6, -16 - R() * 6); stars.add(g); } }

/* ---------------- the island ---------------- */
const SAND = blob(0, 0, 7.6, 5.1, 21);
const GRASS = blob(-.1, -.2, 6.5, 4.2, 22);
const HILL = blob(2.7, -2.1, 2.5, 1.45, 23, 48, .05);
const H_SAND = -.32, H_GRASS = 0, H_HILL = .48;
scene.add(slab(SAND, H_SAND, .55, paper('#ecd3a0', { map: sandMap, bump: sandBump }), edgeMat));
scene.add(slab(GRASS, H_GRASS, .32, paper('#a3bf76', { map: grassMap, bump: grassBump }), edgeMat));
scene.add(slab(HILL, H_HILL, .48, paper('#bccb84', { map: grassMap, bump: grassBump }), edgeMat));
// a lower, darker card under everything so the island reads as a thick stack
scene.add(slab(blob(0, .1, 7.9, 5.3, 24), H_SAND - .5, .5, paper('#8b7a62'), edgeMat));

// stairs: three card steps from the meadow up the hill (the walk rule allows steps of a third of a layer)
const hillFront = (() => { let z = -9; for (let t = -1; t <= 0; t += .002) { const zz = -2.1 + 1.45 * 1.2 * (1 + t); if (inPoly(HILL, 2.3, zz)) z = zz; } return z; })();
const STAIRS = [];
for (let i = 0; i < 3; i++) {
  const z0 = hillFront + .05 + (2 - i) * .42, h = (i + 1) * .16 - .02;
  const pts = [[1.75, z0], [2.85, z0], [2.85, z0 - .5], [1.75, z0 - .5]];
  const s = slab(pts, h, h + .02, paper('#d9c6a2'), edgeMat); scene.add(s);
  STAIRS.push({ x0: 1.75, x1: 2.85, z0: z0 - .5, z1: z0, h });
}
// the jetty: card planks on matchstick posts, out over the sea
const JETTY = { x0: 3.1, x1: 3.95, z0: 3.4, z1: 7.4, h: -.2 };
{
  const plankMat = paper('#c79a66'), postMat = paper('#8d6a48');
  for (let z = JETTY.z0; z < JETTY.z1; z += .32) {
    const p = slab([[JETTY.x0 - .05, z], [JETTY.x1 + .05, z], [JETTY.x1 + .05, z + .28], [JETTY.x0 - .05, z + .28]], JETTY.h, .06, plankMat, edgeMat);
    p.rotation.y = (Math.sin(z * 9) * .012); scene.add(p);
  }
  for (const z of [4.6, 6.0, 7.25]) for (const x of [JETTY.x0, JETTY.x1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), postMat); post.position.set(x, JETTY.h - .6, z); post.castShadow = true; scene.add(post);
  }
}

/* ---------------- the sea: rows of wavy card, like a toy theatre ---------------- */
const seaRows = [];
{
  const blues = ['#5f9fae', '#6fb0b8', '#4f8ea2', '#7fbcc0', '#5a97a8'];
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), paper('#3f6f80')); deep.rotation.x = -Math.PI / 2; deep.position.set(0, -1.05, 0); deep.receiveShadow = true; scene.add(deep);
  let k = 0;
  for (let z = -9; z <= 17; z += .75, k++) {
    // where the island is, the row is cut in two around it
    let xmin = 1e9, xmax = -1e9;
    for (const [x, zz] of SAND) if (Math.abs(zz - z) < .5) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
    const parts = xmin < xmax ? [[-30, xmin + .4], [xmax - .4, 30]] : [[-30, 30]];
    for (const [a, b] of parts) {
      const w = b - a; if (w < .5) continue;
      const pts = [[0, 0]];
      for (let i = 0; i <= Math.ceil(w * 3); i++) { const x = i / Math.ceil(w * 3) * w; pts.push([x, .5 + Math.sin((a + x) * 2.1 + k * 1.3) * .09 + Math.sin((a + x) * .7 + k) * .05]); }
      pts.push([w, 0]);
      const m = card(pts, .05, paper(blues[k % blues.length]), whiteEdge); m.position.set(a, -1.08, z); m.castShadow = false;
      scene.add(m); seaRows.push({ m, z, base: a, k });
    }
  }
}
const WATER_Y = -.62;

/* ---------------- props ---------------- */
const solids = [];          // circles {x, z, r} she walks round
const taps = [];            // meshes that answer a tap
function tapTarget(obj, fn) { obj.traverse(o => { if (o.isMesh) { o.userData.tap = fn; taps.push(o); } }); }

// lollipop trees: two slotted card discs on a stick, a smaller disc of another shade glued on each face
const trees = [];
function circlePts(r, seed, n = 40) { const R = rng(seed), p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 + (R() - .5) * .025); p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
function lollipop(x, z, y, r, col, col2, seed, stickH = 1.25) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const sway = new THREE.Group(); g.add(sway);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, stickH, 8), paper('#7a5a3e')); stick.position.y = stickH / 2; stick.castShadow = true; sway.add(stick);
  // one disc of card on the stick, with smaller discs of other shades glued on, front and back
  const d = card(circlePts(r, seed), .06, paper(col), whiteEdge); d.position.y = stickH + r * .78; sway.add(d);
  for (const side of [1, -1]) {
    const d2 = card(circlePts(r * .64, seed + side * 3), .03, paper(col2), whiteEdge); d2.position.set(.07 * side, stickH + r * .9, .05 * side); sway.add(d2);
    const d3 = card(circlePts(r * .3, seed + side * 5), .03, paper(col), whiteEdge); d3.position.set(.12 * side, stickH + r * 1.02, .075 * side); sway.add(d3);
  }
  sway.rotation.y = (seed % 3 - 1) * .18;
  solids.push({ x, z, r: .3 });
  const t = { g, sway, wob: 0, x, z }; trees.push(t);
  tapTarget(g, () => { t.wob = 1; sfx.rustle(); });
  return t;
}
function pine(x, z, y, h, col) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const sway = new THREE.Group(); g.add(sway);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .4, 8), paper('#7a5a3e')); trunk.position.y = .2; trunk.castShadow = true; sway.add(trunk);
  for (let i = 0; i < 3; i++) {
    const r = .55 - i * .13, hh = h * .45;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 14, 1, true), paper(col, { side: THREE.DoubleSide }));
    c.position.y = .35 + i * h * .22 + hh / 2; c.castShadow = c.receiveShadow = true; sway.add(c);
  }
  solids.push({ x, z, r: .32 });
  const t = { g, sway, wob: 0, x, z }; trees.push(t);
  tapTarget(g, () => { t.wob = 1; sfx.rustle(); });
}
lollipop(-5.1, -1.4, H_GRASS, .62, '#93b071', '#b3c98d', 1);
lollipop(-.3, -2.9, H_GRASS, .72, '#d8b35a', '#e8cd85', 2, 1.45);
lollipop(5.4, .2, H_GRASS, .55, '#d9806c', '#e9a48f', 3, 1.1);
lollipop(-4.0, 2.4, H_GRASS, .45, '#93b071', '#b3c98d', 4, .9);
pine(2.0, -2.7, H_HILL, 1.7, '#6f9670');
pine(3.6, -2.2, H_HILL, 1.35, '#7fa676');
pine(4.1, -2.9, H_HILL, 1.9, '#5f8665');

// paper flowers and grass tufts
{
  const R = rng(31), flowerCols = ['#f2efe6', '#e98f8f', '#f2c65c', '#b9a3e0'];
  const petals = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; for (let j = 0; j <= 6; j++) { const b = a - .5 + j / 6; petals.push([Math.cos(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI)), Math.sin(b) * (.07 + .05 * Math.sin((j / 6) * Math.PI))]); } }
  const tuftPts = [[-.16, 0], [-.12, .2], [-.06, .05], [0, .26], [.05, .05], [.12, .22], [.16, 0]];
  const stemMat = paper('#6f8f55');
  for (let i = 0; i < 70; i++) {
    const x = -6 + R() * 12, z = -4 + R() * 8;
    if (!inPoly(GRASS, x, z) || edgeDist(GRASS, x, z) < .3 || inPoly(HILL, x, z) && edgeDist(HILL, x, z) < .25) continue;
    if (x > -4 && x < -1 && z > -2.4 && z < .3) continue;   // not in the house
    const y = inPoly(HILL, x, z) ? H_HILL : H_GRASS;
    if (i % 2) {
      const t = card(tuftPts, .02, paper(R() < .5 ? '#86a466' : '#9bb877')); t.position.set(x, y, z); t.rotation.y = R() * .6 - .3; t.scale.setScalar(.8 + R() * .5); scene.add(t);
    } else {
      const f = new THREE.Group(); f.position.set(x, y, z); scene.add(f);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .28, 4), stemMat); stem.position.y = .14; f.add(stem);
      const fl = card(petals, .02, paper(flowerCols[Math.floor(R() * 4)])); fl.position.y = .3; f.add(fl);
      const mid = new THREE.Mesh(new THREE.CircleGeometry(.035, 10), paper('#e2a13c')); mid.position.set(0, .3, .012); f.add(mid);
      f.rotation.y = R() * .5 - .25;
    }
  }
}

// a lamp on the jetty
const lampLight = new THREE.PointLight('#ffc77a', 0, 5, 2); lampLight.position.set(JETTY.x1 - .05, JETTY.h + 1.45, JETTY.z1 - .35); scene.add(lampLight);
const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf86', emissiveIntensity: .4 });
{
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, 1.4, 8), paper('#3e3a3a')); post.position.set(JETTY.x1 - .05, JETTY.h + .7, JETTY.z1 - .35); post.castShadow = true; scene.add(post);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), bulbMat); bulb.position.set(JETTY.x1 - .05, JETTY.h + 1.42, JETTY.z1 - .35); scene.add(bulb);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(.16, .14, 12, 1, true), paper('#3e3a3a', { side: THREE.DoubleSide })); hat.position.copy(bulb.position).y += .12; hat.castShadow = true; scene.add(hat);
}

/* ---------------- the house: folded card, a door that opens, a lamp inside ---------------- */
const HOUSE = { x: -2.55, z: -1.15, w: 2.4, d: 1.8, h: 1.8 };
const house = new THREE.Group(); house.position.set(HOUSE.x, H_GRASS, HOUSE.z); scene.add(house);
const inLight = new THREE.PointLight('#ffb866', 0, 4, 1.4); inLight.position.set(0, 1.0, 0); house.add(inLight);
const paneMat = new THREE.MeshStandardMaterial({ color: '#3b3a45', emissive: '#ffbf6e', emissiveIntensity: 0, roughness: .6 });
let door, doorOpen = 0, doorTarget = 0, lightOn = false;
{
  const { w, d, h } = HOUSE, T = .07;
  const wallMat = paper('#e4a596', { side: THREE.DoubleSide }), roofMat = paper('#4f8f8c'), trimMat = paper('#f4ecdc');
  const win = (cx, cy, ww = .42, hh = .46) => [[cx - ww / 2, cy - hh / 2], [cx + ww / 2, cy - hh / 2], [cx + ww / 2, cy + hh / 2], [cx - ww / 2, cy + hh / 2]];
  const frame = (wall, cx, cy, ww = .42, hh = .46, z = T / 2 + .005) => {
    // a white card frame with a cross, and a dark pane behind it that glows when the lamp is on
    const outer = win(cx, cy, ww + .14, hh + .14), inner = win(cx, cy, ww, hh);
    const f = card(outer, .025, trimMat, trimMat, [inner.slice().reverse()]); f.position.z = z; wall.add(f);
    const bar1 = card(win(cx, cy, ww, .045), .02, trimMat); bar1.position.z = z; wall.add(bar1);
    const bar2 = card(win(cx, cy, .045, hh), .02, trimMat); bar2.position.z = z; wall.add(bar2);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), paneMat); pane.position.set(cx, cy, -T / 2 - .01); wall.add(pane);
  };
  // front: a door and two windows; the gable is part of the same sheet
  const front = new THREE.Group(); front.position.z = d / 2; house.add(front);
  const frontPts = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + .75], [-w / 2, h]];
  const doorHole = [[-.27, .02], [.27, .02], [.27, 1.25], [-.27, 1.25]];
  front.add(card(frontPts, T, wallMat, edgeMat, [doorHole.slice().reverse(), win(-.78, 1.05).reverse(), win(.78, 1.05).reverse()]));
  frame(front, -.78, 1.05); frame(front, .78, 1.05);
  const dGroup = new THREE.Group(); dGroup.position.set(-.27, 0, .02); front.add(dGroup);
  door = card([[0, .02], [.54, .02], [.54, 1.23], [0, 1.23]], .05, paper('#3f6f77'), edgeMat); dGroup.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), paper('#e2b04a')); knob.position.set(.45, .62, .04); dGroup.add(knob);
  door = dGroup;
  const back = card(frontPts, T, wallMat, edgeMat, [win(-.5, .95).reverse()]); back.position.z = -d / 2; house.add(back);
  const sidePts = [[-d / 2, 0], [d / 2, 0], [d / 2, h], [-d / 2, h]];
  for (const s of [-1, 1]) {
    const side = new THREE.Group(); side.position.x = s * w / 2; side.rotation.y = s * Math.PI / 2; house.add(side);
    side.add(card(sidePts, T, wallMat, edgeMat, [win(0, 1.05, .5, .46).reverse()])); frame(side, 0, 1.05, .5, .46);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - .1, d - .1), paper('#c9a77c')); floor.rotation.x = -Math.PI / 2; floor.position.y = .01; floor.receiveShadow = true; house.add(floor);
  // the roof: two sheets folded over the ridge, with an overhang
  const slope = Math.hypot(w / 2 + .18, .75 + .1);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(slope, .07, d + .4), [edgeMat, edgeMat, roofMat, roofMat, edgeMat, edgeMat]);
    r.position.set(s * (w / 4 + .04), h + .75 / 2 + .02, 0); r.rotation.z = -s * Math.atan2(.75 + .1, w / 2 + .18); r.castShadow = r.receiveShadow = true; house.add(r);
    // scalloped tiles: strips of slightly darker card along the roof
    for (let i = 0; i < 3; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.03, .02, d + .38), paper('#437e7b'));
      strip.position.set(s * (w / 4 + .04) + s * (-.35 + i * .35) * Math.cos(Math.atan2(.85, w / 2 + .18)), h + .75 / 2 + .06 - (i - 1) * .35 * Math.sin(Math.atan2(.85, w / 2 + .18)), 0);
      strip.rotation.z = r.rotation.z; house.add(strip);
    }
  }
  const chim = new THREE.Mesh(new THREE.BoxGeometry(.3, .6, .3), [edgeMat, edgeMat, paper('#b9675a'), paper('#b9675a'), paper('#c9776a'), paper('#c9776a')]);
  chim.position.set(.6, h + .75, -.3); chim.castShadow = true; house.add(chim);
  // flower boxes under the front windows, with paper flowers
  for (const cx of [-.78, .78]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(.6, .14, .14), [edgeMat, edgeMat, paper('#7a5a3e'), edgeMat, paper('#8d6a48'), edgeMat]);
    box.position.set(cx, .72, d / 2 + .1); box.castShadow = true; house.add(box);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.065, 10), paper(['#e98f8f', '#f2efe6', '#f2c65c', '#b9a3e0'][(i + (cx > 0 ? 2 : 0)) % 4])); f.position.set(cx - .22 + i * .15, .86 + (i % 2) * .04, d / 2 + .13); house.add(f); }
  }
  // curtains: two little triangles of patterned paper behind each front window
  const curtain = paper('#f3e3c8', { side: THREE.DoubleSide });
  for (const cx of [-.78, .78]) for (const sd of [-1, 1]) {
    const c = card([[0, 0], [sd * .2, 0], [0, -.42]], .01, curtain); c.position.set(cx - sd * .21, 1.27, d / 2 - T / 2 - .03); house.add(c);
  }
  // a little doorstep and a flower box
  const step = slab([[-.4, d / 2], [.4, d / 2], [.4, d / 2 + .28], [-.4, d / 2 + .28]], .08, .08, paper('#d9c6a2'), edgeMat); house.add(step);
}
tapTarget(house, () => toggleHouse());
// a path of paper stepping stones from the door into the meadow
{ const R = rng(51); for (let i = 0; i < 5; i++) { const st = slab(circlePts(.2 + R() * .05, 60 + i, 14).map(([x, z]) => [x * 1.2, z]), H_GRASS + .025, .025, paper('#e6dccb'), whiteEdge); st.position.set(HOUSE.x + .1 + i * .32 + (R() - .5) * .1, 0, HOUSE.z + HOUSE.d / 2 + .5 + i * .42); scene.add(st); } }
function toggleHouse() {
  doorTarget = doorTarget ? 0 : 1; lightOn = !!doorTarget; sfx.door(doorTarget);
}

/* ---------------- cut-paper figures ---------------- */
/** draws a figure from flat shapes, then adds the white cut border and paper grain; returns a canvas */
function cutout(w, h, draw) {
  const S = 2, W = w * S, H = h * S;
  const shape = document.createElement('canvas'); shape.width = W; shape.height = H;
  const g = shape.getContext('2d'); g.scale(S, S); g.lineJoin = g.lineCap = 'round'; draw(g);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d');
  const r = 5 * S; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; o.drawImage(shape, Math.cos(a) * r, Math.sin(a) * r); }
  o.globalCompositeOperation = 'source-in'; o.fillStyle = '#f6efe2'; o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = 'source-over'; o.drawImage(shape, 0, 0);
  o.globalCompositeOperation = 'multiply'; o.drawImage(PAPER, 0, 0, W * .8, H * .8, 0, 0, W, H);
  o.globalCompositeOperation = 'destination-in'; o.drawImage(shape, 0, 0); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; o.drawImage(shape, Math.cos(a) * r, Math.sin(a) * r); }
  return out;
}
const blobPath = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
const ell = (g, x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
const poly = (g, pts, col) => { g.fillStyle = col; blobPath(g, pts); g.fill(); };
const limb = (g, x1, y1, x2, y2, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };

// Anna: the small blonde sister in her pink dress, seen a little from the side (facing right)
function drawGirl(g, f) {
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0, skin = '#f1c6a2', dress = '#de7b8e', dress2 = '#c9667b';
  limb(g, 58, 150, 58 - sw * 8, 182, 11, '#e8b896'); limb(g, 72, 150, 72 + sw * 8, 182, 11, '#f1c6a2');
  ell(g, 56 - sw * 9, 186, 10, 6, '#5a4048'); ell(g, 75 + sw * 9, 186, 10, 6, '#6a4b55');
  limb(g, 50, 104, 42 - sw * 6, 136, 10, '#e8b896');
  poly(g, [[48, 96], [84, 96], [100, 158], [32, 158]], dress);
  poly(g, [[34, 150], [98, 150], [100, 158], [32, 158]], dress2);
  ell(g, 66, 98, 18, 6, '#f6efe2');
  limb(g, 82, 104, 92 + sw * 6, 134, 10, skin);
  ell(g, 66, 62, 30, 32, skin);
  // hair: a cap with a fringe and a ponytail behind
  ell(g, 38, 66, 13, 22, '#e5bd55', -.3);
  g.fillStyle = '#eccb6a'; g.beginPath(); g.ellipse(64, 54, 33, 27, 0, Math.PI * .98, Math.PI * 2.08); g.fill();
  poly(g, [[44, 44], [92, 44], [96, 58], [84, 52], [72, 60], [62, 50], [50, 58]], '#eccb6a');
  ell(g, 38, 40, 8, 7, '#de7b8e');
  ell(g, 80, 68, 3.6, 4.4, '#3a2c34'); ell(g, 81, 66.5, 1.2, 1.2, '#fff');
  ell(g, 86, 78, 6, 4, 'rgba(230,120,130,.55)');
  g.strokeStyle = '#7a3c45'; g.lineWidth = 2.4; g.beginPath(); g.arc(84, 80, 5, .3, 1.6); g.stroke();
}
// the little unicorn: white with a pastel mane and a gold horn (facing right)
function drawUnicorn(g, f) {
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0, body = '#fbf7f0', shade = '#e7dfe9';
  for (const [x, s, c] of [[40, -1, shade], [96, 1, shade], [52, 1, body], [108, -1, body]]) { limb(g, x, 120, x + s * sw * 8, 152, 13, c); ell(g, x + s * sw * 8, 155, 8, 5, '#c9a7d6'); }
  // tail
  for (const [c, dy] of [['#f2a7c0', 0], ['#b9a3e8', 10], ['#9fd8d0', 20]]) { g.strokeStyle = c; g.lineWidth = 10; g.beginPath(); g.moveTo(30, 96 + dy * .4); g.quadraticCurveTo(6, 100 + dy, 14, 128 + dy * .6); g.stroke(); }
  ell(g, 74, 106, 46, 26, body);
  ell(g, 70, 116, 34, 12, shade);
  poly(g, [[96, 100], [112, 54], [130, 60], [120, 108]], body);
  ell(g, 126, 62, 22, 18, body, -.3);
  ell(g, 142, 72, 12, 10, '#f6dde4');
  // mane down the neck
  for (const [c, o] of [['#f2a7c0', 0], ['#b9a3e8', 9], ['#9fd8d0', 18]]) { g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.moveTo(110 - o * .3, 44 + o * .8); g.quadraticCurveTo(96 - o * .5, 60 + o, 98 - o * .6, 92 + o * .4); g.stroke(); }
  poly(g, [[118, 44], [124, 44], [134, 8], [116, 40]], '#eac15a');
  g.strokeStyle = '#c99b3a'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(118 + i * 3, 36 - i * 9); g.lineTo(125 + i * 2, 34 - i * 9); g.stroke(); }
  poly(g, [[108, 48], [114, 30], [120, 48]], '#f3dfe6');
  ell(g, 130, 60, 3.6, 4.4, '#3a2c34'); ell(g, 131, 58.5, 1.2, 1.2, '#fff');
  ell(g, 140, 70, 5, 3.4, 'rgba(230,120,140,.55)');
}
// the sheep: a cloud of cream wool with a dark face (facing right)
function drawSheep(g, f) {
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0, wool = '#f4ecdc', wool2 = '#e2d6c1', face = '#4b3d3d';
  for (const x of [44, 58, 90, 104]) limb(g, x, 112, x + sw * 3, 140, 9, face);
  for (const [x, y, r] of [[40, 92, 20], [58, 78, 22], [80, 74, 22], [100, 84, 20], [104, 102, 17], [82, 108, 20], [58, 108, 20], [38, 106, 17]]) ell(g, x + 2, y + 4, r, r, wool2);
  for (const [x, y, r] of [[40, 90, 20], [58, 76, 22], [80, 72, 22], [100, 82, 20], [102, 100, 17], [80, 104, 20], [58, 104, 20], [38, 102, 17], [70, 90, 26]]) ell(g, x, y, r, r, wool);
  ell(g, 118, 82, 15, 19, face, -.4);
  ell(g, 104, 66, 9, 5, face, -.6);
  ell(g, 124, 78, 3, 3.6, '#f6efe2'); ell(g, 125, 77, 1.6, 1.8, '#2a2020');
  for (const [x, y, r] of [[110, 62, 9], [120, 60, 8]]) ell(g, x, y, r, r, wool);
}
// the duck: a mustard paper duck, floating (facing left)
function drawDuck(g, f) {
  ell(g, 66, 70, 38, 22, '#e6b748');
  poly(g, [[94, 66], [118, 50], [112, 72], [100, 80]], '#e6b748');
  ell(g, 70, 74, 22, 12, '#cf9c35', .15);
  ell(g, 40, 38, 20, 19, '#ecc257');
  poly(g, [[22, 38], [4, 42 + (f ? 2 : 0)], [22, 47]], '#e2803e');
  ell(g, 34, 33, 3.4, 4, '#2a2020'); ell(g, 35, 32, 1.2, 1.2, '#fff');
}

const figures = [];
function makeFigure(name, w, h, draw, frames, size) {
  const maps = []; for (let f = 0; f < frames; f++) { const t = new THREE.CanvasTexture(cutout(w, h, g => draw(g, f))); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; maps.push(t); }
  const H = size, W = size * w / h;
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2, 0);
  const mat = new THREE.MeshStandardMaterial({ map: maps[0], alphaTest: .5, side: THREE.DoubleSide, roughness: .9, bumpMap: paperBump, bumpScale: .6 });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = false;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: maps[0], alphaTest: .5 });
  const g = new THREE.Group(), pose = new THREE.Group(); g.add(pose); pose.add(mesh); scene.add(g);
  const fig = { name, g, pose, mesh, mat, maps, x: 0, z: 0, y: 0, face: 1, frame: 0, walking: false, hop: 0, hopV: 0, tilt: 0, setFrame(i) { if (this.frame === i) return; this.frame = i; mat.map = maps[i]; mesh.customDepthMaterial.map = maps[i]; } };
  mesh.userData.fig = fig; figures.push(fig); return fig;
}
const girl = makeFigure('girl', 130, 200, drawGirl, 3, 1.25);
const uni = makeFigure('unicorn', 160, 165, drawUnicorn, 3, 1.15);
const sheep = makeFigure('sheep', 140, 150, drawSheep, 3, .95);
const duck = makeFigure('duck', 125, 100, drawDuck, 2, .7);
girl.x = .8; girl.z = 2.2; uni.x = -.4; uni.z = 2.6; uni.face = 1;
sheep.x = 3.7; sheep.z = 1.1; sheep.face = -1;
duck.x = 4.9; duck.z = 5.6; duck.face = 1; duck.y = WATER_Y;
solids.push({ x: sheep.x, z: sheep.z, r: .42, fig: sheep });
for (const f of [girl, uni, sheep, duck]) tapTarget(f.g, () => tapFigure(f));

/* ---------------- paper confetti ---------------- */
const bits = [];
const bitGeo = new THREE.PlaneGeometry(.09, .09);
function confetti(x, y, z, cols, n = 10, shape = bitGeo, up = 2.2) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(shape, paper(cols[i % cols.length], { side: THREE.DoubleSide })); m.position.set(x, y, z); m.castShadow = true; scene.add(m);
    const a = Math.random() * Math.PI * 2, s = .8 + Math.random() * 1.2;
    bits.push({ m, vx: Math.cos(a) * s, vz: Math.sin(a) * s * .6, vy: up + Math.random() * 1.5, spin: (Math.random() - .5) * 12, life: 1.1 + Math.random() * .5 });
  }
}
const starGeo = (() => { const s = new THREE.Shape(sunPts(.08, 5).map(([x, y]) => new THREE.Vector2(x, y))); return new THREE.ShapeGeometry(s); })();

/* ---------------- sound: a few soft synth notes ---------------- */
let ac = null;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function tone(freq, dur, type = 'sine', vol = .12, slide = 0, vib = 0) {
  const a = audio(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = vib; lg.gain.value = freq * .06; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur); }
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol = .08, hp = 1200) {
  const a = audio(); if (!a) return; const t = a.currentTime, b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
}
const sfx = {
  bleat() { tone(330, .55, 'sawtooth', .05, .92, 7); tone(495, .5, 'triangle', .04, .9, 7); },
  quack() { tone(520, .12, 'square', .05, .6); setTimeout(() => tone(500, .14, 'square', .05, .55), 150); },
  splash() { noise(.35, .09, 900); },
  rustle() { noise(.4, .06, 2400); },
  door(open) { tone(open ? 220 : 180, .12, 'triangle', .1, open ? 1.3 : .7); noise(.08, .05, 3000); },
  neigh() { tone(660, .4, 'triangle', .06, 1.25, 9); setTimeout(() => tone(880, .3, 'sine', .05), 120); },
  hop() { tone(440, .1, 'sine', .07, 1.6); },
  chime() { [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, .5, 'sine', .06), i * 90)); },
};

/* ---------------- what figures do when tapped (always the same) ---------------- */
function tapFigure(f) {
  if (f === sheep) { sheep.hopV = 3.6; sheep.face = girl.x < sheep.x ? -1 : 1; sfx.bleat(); confetti(sheep.x, .5, sheep.z, ['#f4ecdc', '#e2d6c1', '#fbf7f0'], 9, new THREE.CircleGeometry(.07, 8), 1.6); }
  else if (f === duck) { if (!duck.dive) { duck.dive = 1.2; sfx.splash(); setTimeout(() => { sfx.quack(); duck.face *= -1; confetti(duck.x, WATER_Y + .2, duck.z + .1, ['#8fc3cc', '#f6efe2'], 10, bitGeo, 2.6); }, 700); } }
  else if (f === uni) { uni.hopV = 3; sfx.neigh(); confetti(uni.x, .9, uni.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 12, starGeo, 2.4); }
  else if (f === girl) { girl.hopV = 3.2; sfx.hop(); }
}

/* ---------------- where she can stand ---------------- */
function heightAt(x, z) {
  for (const s of STAIRS) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) return s.h;
  if (inPoly(HILL, x, z)) return H_HILL;
  if (inPoly(GRASS, x, z)) return H_GRASS;
  if (x > JETTY.x0 && x < JETTY.x1 && z > JETTY.z0 - .4 && z < JETTY.z1) return JETTY.h;
  if (inPoly(SAND, x, z) && edgeDist(SAND, x, z) > .22) return H_SAND;
  return null;
}
function free(x, z, fromH, me = girl) {
  const h = heightAt(x, z); if (h === null || Math.abs(h - fromH) > .34) return false;
  for (const s of solids) if (s.fig !== me && Math.hypot(x - s.x, z - s.z) < s.r + .18) return false;
  const hx = HOUSE.w / 2 + .15, hz = HOUSE.d / 2 + .12;
  if (Math.abs(x - HOUSE.x) < hx && Math.abs(z - HOUSE.z) < hz) return false;
  return true;
}
function move(f, dx, dz) {
  const fromH = heightAt(f.x, f.z) ?? 0;
  if (free(f.x + dx, f.z + dz, fromH, f)) { f.x += dx; f.z += dz; return true; }
  if (Math.abs(dx) > 1e-4 && free(f.x + dx, f.z, fromH, f)) { f.x += dx; return true; }
  if (Math.abs(dz) > 1e-4 && free(f.x, f.z + dz, fromH, f)) { f.z += dz; return true; }
  return false;
}

/* ---------------- input: tap to walk, hold to steer, arrows/WASD ---------------- */
const keys = new Set();
addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); audio(); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let target = null, hold = null;
const groundMeshes = []; scene.traverse(o => { if (o.isMesh && o.geometry.type === 'ExtrudeGeometry' && !o.userData.tap) groundMeshes.push(o); });
function pickAt(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...taps, ...groundMeshes], false);
  // a figure is a rectangle of card with a cutout on it: only the cutout (and a finger's width round it) takes the tap
  return hits.find(h => !h.object.userData.fig || solidAt(h.object.userData.fig, h.uv)) || null;
}
const alphaCache = new Map();
function solidAt(fig, uv) {
  const cv = fig.maps[fig.frame].image; let d = alphaCache.get(cv);
  if (!d) { d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height); alphaCache.set(cv, d); }
  const px = Math.round(uv.x * (cv.width - 1)), py = Math.round((1 - uv.y) * (cv.height - 1)), r = Math.round(cv.width * .08);
  for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) {
    const x = clamp(px + dx, 0, cv.width - 1), y = clamp(py + dy, 0, cv.height - 1);
    if (d.data[(y * cv.width + x) * 4 + 3] > 128) return true;
  }
  return false;
}
function groundPoint(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const p = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -girl.y), p); return p;
}
canvas.addEventListener('pointerdown', e => {
  audio(); canvas.setPointerCapture(e.pointerId);
  const hit = pickAt(e.clientX, e.clientY);
  if (hit && hit.object.userData.tap) { hit.object.userData.tap(); return; }
  if (hit) target = { x: hit.point.x, z: hit.point.z };
  else { const p = groundPoint(e.clientX, e.clientY); target = { x: p.x, z: p.z }; }
  hold = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointermove', e => { if (hold && hold.id === e.pointerId) { hold.x = e.clientX; hold.y = e.clientY; } });
const endHold = e => { if (hold && hold.id === e.pointerId) { if (performance.now() - hold.t > 220) target = null; hold = null; } };
canvas.addEventListener('pointerup', endHold); canvas.addEventListener('pointercancel', endHold);

/* ---------------- day and evening ---------------- */
let eve = 0, eveTarget = 0;
const skyBtn = document.getElementById('sky');
skyBtn.addEventListener('click', () => { eveTarget = eveTarget ? 0 : 1; document.getElementById('sun').hidden = !!eveTarget; document.getElementById('moon').hidden = !eveTarget; sfx.chime(); });
const C = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

/* ---------------- post: lens focus, glow, film look ---------------- */
const halfOK = renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float');
let rt = null;
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2() }, near: { value: camera.near }, far: { value: camera.far }, focus: { value: 14 }, dof: { value: 8 }, seed: { value: 0 }, eve: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near, far, focus, dof, seed, eve; varying vec2 vUv;
    float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    vec3 srgb(vec3 c){ c=max(c,0.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(vec3(.0031308),c)); }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+seed)*43758.5453); }
    float cocAt(vec2 uv){ float d=lin(texture2D(tDepth,uv).r); float df=d-focus; return df>0. ? clamp((df-1.2)/7.,0.,1.) : clamp((-df-1.)/3.5,0.,1.); }
    void main(){
      float coc=cocAt(vUv);
      float r=coc*dof; vec3 acc=vec3(0.); float wsum=0.; vec3 bl=vec3(0.);
      for(int i=0;i<24;i++){ float fi=float(i); float a=fi*2.39996; float rr=sqrt((fi+.5)/24.);
        vec2 o=vec2(cos(a),sin(a))*rr;
        vec2 uv=vUv+o*r/res;
        float w=max(cocAt(uv), coc*.6)+.02;          // a sharp thing in front is not smeared over by the blur behind it
        acc+=texture2D(tColor,uv).rgb*w; wsum+=w;
      }
      vec3 col=acc/wsum;
      bl=max(textureLod(tColor,vUv,3.).rgb-.85,0.)*.5+max(textureLod(tColor,vUv,4.5).rgb-.75,0.)*.8+max(textureLod(tColor,vUv,6.).rgb-.6,0.);
      col+=bl*(.25+eve*1.5);
      col=aces(col*1.05);
      // film: lifted blacks, warm highlights, a touch of teal in the shadows
      float l=dot(col,vec3(.2126,.7152,.0722));
      col=mix(col, col*vec3(.92,1.,1.04), (1.-l)*.35);
      col=mix(vec3(l),col,1.12);
      col=col*.97+.018;
      vec2 q=vUv-.5; col*=1.-dot(q,q)*(.75+eve*.4);
      vec3 o=srgb(col);
      o+=(hash(vUv*res)-.5)*.035;
      gl_FragColor=vec4(o,1.);
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
{ const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2)); const q = new THREE.Mesh(tri, post); q.frustumCulled = false; postScene.add(q); }

let camDist = 15, camH = 6.2, portrait = false;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  const a = w / h; camera.aspect = a; portrait = a < 1;
  camera.fov = portrait ? 34 : 24; camera.updateProjectionMatrix();
  // fit the island's width (about 16) in view
  const vw = portrait ? 7.5 : 12.5, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * a;
  camDist = clamp(vw / 2 / tanH, 11, 40); camH = camDist * (portrait ? .5 : .28);
  const pw = Math.floor(w * DPR), ph = Math.floor(h * DPR);
  if (rt) rt.dispose();
  rt = new THREE.WebGLRenderTarget(pw, ph, { type: halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: 4, depthTexture: new THREE.DepthTexture(pw, ph) });
  rt.depthTexture.type = THREE.UnsignedIntType;
  rt.texture.generateMipmaps = true; rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  post.uniforms.tColor.value = rt.texture; post.uniforms.tDepth.value = rt.depthTexture; post.uniforms.res.value.set(pw, ph); post.uniforms.dof.value = (portrait ? 6 : 9) * DPR * Math.min(1.4, w / 1100 + .4);
}
addEventListener('resize', resize); resize();

/* ---------------- the loop ---------------- */
const camLook = new THREE.Vector3(0, 0, .5), camPos = new THREE.Vector3();
let last = performance.now(), tick = 0, acc = 0, time = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
  acc += dt; let stepped = false; while (acc >= STEP) { acc -= STEP; tick++; stepped = true; }

  // her input
  let ix = 0, iz = 0;
  if (keys.has('arrowleft') || keys.has('a')) ix -= 1; if (keys.has('arrowright') || keys.has('d')) ix += 1;
  if (keys.has('arrowup') || keys.has('w')) iz -= 1; if (keys.has('arrowdown') || keys.has('s')) iz += 1;
  if (ix || iz) target = null;
  if (hold && performance.now() - hold.t > 220) { const p = groundPoint(hold.x, hold.y); target = { x: p.x, z: p.z }; }
  if (target && !ix && !iz) {
    const dx = target.x - girl.x, dz = target.z - girl.z, d = Math.hypot(dx, dz);
    if (d < .08) target = null; else { ix = dx / d; iz = dz / d; }
  }
  const speed = 2.5, il = Math.hypot(ix, iz);
  girl.walking = false;
  if (il > 0) {
    const mx = ix / il * speed * dt, mz = iz / il * speed * dt;
    if (move(girl, mx, mz)) girl.walking = true; else if (target && !hold) target = null;
    if (Math.abs(ix) > .2) girl.face = Math.sign(ix);
  }
  // the unicorn walks after her
  {
    const dx = girl.x - uni.x, dz = girl.z - uni.z, d = Math.hypot(dx, dz);
    uni.walking = false;
    if (d > 1.35) { const s = Math.min(3.2, (d - 1.1) * 3) * dt; if (move(uni, dx / d * s, dz / d * s)) uni.walking = true; else if (d > 4) { const cands = [[girl.x - girl.face * .9, girl.z + .3], [girl.x, girl.z - .9], [girl.x, girl.z + .9], [girl.x, girl.z]]; const [cx, cz] = cands.find(([x, z]) => heightAt(x, z) !== null); uni.x = cx; uni.z = cz; } if (Math.abs(dx) > .3) uni.face = Math.sign(dx); }
  }
  // the sheep looks at her when she comes close
  if (Math.hypot(girl.x - sheep.x, girl.z - sheep.z) < 2) sheep.face = girl.x < sheep.x ? -1 : 1;

  // figures: smooth positions, poses that step like stop motion
  for (const f of figures) {
    const ground = f === duck ? WATER_Y : (heightAt(f.x, f.z) ?? f.y);
    f.y += (ground - f.y) * Math.min(1, dt * 14);
    if (f.hopV || f.hop > 0) { f.hop += f.hopV * dt; f.hopV -= 14 * dt; if (f.hop <= 0) { f.hop = 0; f.hopV = 0; } }
    if (f === duck && f.dive) { f.dive -= dt; }
    if (stepped) {
      const walkK = Math.floor(tick / 2);
      if (f.maps.length > 2) f.setFrame(f.walking ? 1 + walkK % 2 : 0);
      f.bob = f.walking ? (walkK % 2 ? .05 : 0) : 0;
      f.tilt = f.walking ? (walkK % 2 ? .05 : -.05) : 0;
      if (f === duck) { const dv = f.dive > 0 ? Math.sin(clamp(1 - (f.dive - .1) / 1.1, 0, 1) * Math.PI) : 0; f.sink = dv * .55; f.tilt = Math.sin(tick * .4) * .04; f.setFrame(f.dive > 0 ? 1 : 0); }
      // pose = position snapped to the frame, so even a hop moves in little steps
      f.pose.position.y = f.bob + Math.round(f.hop * 24) / 24 - (f.sink || 0);
      f.pose.rotation.z = f.tilt * f.face;
      f.mesh.scale.x = f.face;
    }
    f.g.position.set(f.x, f.y, f.z);
    f.g.rotation.y = Math.atan2(camera.position.x - f.x, camera.position.z - f.z) * .85;
  }
  // trees wobble when tapped, in steps
  if (stepped) for (const t of trees) if (t.wob > .01) { t.wob *= .82; t.sway.rotation.z = Math.sin(tick * 1.9) * .09 * t.wob; t.sway.rotation.x = Math.cos(tick * 1.5) * .04 * t.wob; } else t.sway.rotation.set(0, 0, 0);
  // the door
  doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 6); door.rotation.y = -doorOpen * 1.7;
  // confetti
  for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.vy -= 7 * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt; b.m.rotation.x += b.spin * dt; b.m.rotation.y += b.spin * .7 * dt; b.life -= dt; if (b.life < .3) b.m.scale.setScalar(Math.max(.01, b.life / .3)); if (b.life <= 0) { scene.remove(b.m); b.m.material.dispose(); bits.splice(i, 1); } }
  // the sea rows rock gently, each its own way
  if (stepped) for (const r of seaRows) r.m.position.x = r.base + Math.sin(tick * .05 + r.k * 1.7) * .12;

  // day and evening: the sun is pulled up out of view and the moon let down on its thread
  eve += (eveTarget - eve) * Math.min(1, dt * 1.6);
  skyMat.uniforms.eve.value = eve; post.uniforms.eve.value = eve;
  key.color.copy(C('#ffdcae', '#a9b8ea', eve)); key.intensity = lerp(3.1, 1.0, eve);
  hemi.color.copy(C('#cfe6e4', '#6a6fa0', eve)); hemi.groundColor.copy(C('#8a6f58', '#4a3848', eve)); hemi.intensity = lerp(.85, 1.05, eve);
  fill.intensity = lerp(.45, .25, eve);
  scene.fog.color.copy(C('#efd2b4', '#5a5478', eve));
  sun.position.y = lerp(4.6, 24, eve); moon.position.y = lerp(22, 4.8, eve);
  for (const s of stars.children) s.position.y = lerp(28, 3.5 + (s.id % 5) * .7, eve);
  const lit = lightOn ? 1 : 0;
  inLight.intensity = lerp(inLight.intensity, lit * lerp(1.6, 2.6, eve), Math.min(1, dt * 5));
  paneMat.emissiveIntensity = lerp(.08, .3, eve) + inLight.intensity / 2.2;
  lampLight.intensity = lerp(.0, 2.2, eve); bulbMat.emissiveIntensity = lerp(.4, 2.2, eve);

  // camera: a still diorama shot that leans a little towards her
  camLook.lerp(new THREE.Vector3(girl.x * .7, girl.y * .5 + .5, girl.z * .6), Math.min(1, dt * 2));
  camPos.set(camLook.x * .8, camLook.y + camH, camLook.z + camDist);
  camera.position.copy(camPos); camera.lookAt(camLook);
  post.uniforms.focus.value = camera.position.distanceTo(new THREE.Vector3(girl.x, girl.y + .5, girl.z));
  if (stepped) post.uniforms.seed.value = (tick % 12) * 1.37;

  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// for tests and screenshots
window.__p = {
  placeAt(x, z) { girl.x = x; girl.z = z; uni.x = x; uni.z = z - .9; if (heightAt(uni.x, uni.z) === null) { uni.x = x - 1; uni.z = z; } target = null; },
  walkTo(x, z) { target = { x, z }; },
  tap(name) { const f = figures.find(f => f.name === name); if (f) tapFigure(f); else if (name === 'house') toggleHouse(); else if (name === 'tree') { trees[0].wob = 1; } },
  evening(on = true) { eveTarget = on ? 1 : 0; eve = eveTarget; },
  screen(name) { const f = figures.find(f => f.name === name); const v = name === 'house' ? new THREE.Vector3(HOUSE.x + .5, 1.2, HOUSE.z + HOUSE.d / 2) : new THREE.Vector3(f.x, f.y + .4, f.z); v.project(camera); const r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; },
  uniOk() { return heightAt(uni.x, uni.z) !== null; },
  hop(name) { return figures.find(f => f.name === name).hop; },
  info() { return { girl: [girl.x, girl.z, girl.y], uni: [uni.x, uni.z], door: doorTarget, eve, h: heightAt(girl.x, girl.z) }; },
};
