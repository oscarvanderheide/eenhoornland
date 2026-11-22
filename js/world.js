// HD-2D style world: a 3D diorama island with pixel-art billboards, real-time light & shadow,
// and a depth-of-field / bloom / vignette post pass.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import * as PX from './pixel.js';
import { state } from './state.js';
import { sfx, speak } from './audio.js';
import * as MAP from './map.js';
import * as ART from './art.js';
import * as Q from './quest.js';
import { createExtras } from './world-extras.js';

const W = MAP.W, H = MAP.H, U = 16;      // map size in tiles (see map.js), pixels per tile
const { GR, WA, POND, FOUNT } = MAP;

export const BUILDINGS = [
  { id: 'stal', name: 'Stal', x: 3, z: 3, w: 5, d: 4, h: 2.1, rh: 1.3, wall: '#D2654A', roof: '#7A4A3A', trim: '#FFF1DC', doorCol: '#6B3F2A', exit: [5, 7], icon: () => PX.heart() },
  { id: 'atelier', name: 'Atelier', x: 21, z: 3, w: 5, d: 4, h: 2.1, rh: 1.3, wall: '#8DBDEB', roof: '#4A6FB8', trim: '#FFF6E3', doorCol: '#9B72E8', exit: [23, 7], icon: () => PX.butterfly() },
  { id: 'bakkerij', name: 'Bakkerij', x: 3, z: 12, w: 5, d: 4, h: 2.1, rh: 1.2, wall: '#FFD7E2', roof: '#D16A93', trim: '#FFFFFF', doorCol: '#8B5A3C', exit: [5, 16], icon: () => PX.cake() },
  { id: 'huisje', name: 'Huisje', say: 'Naar het huisje!', x: 12, z: 2, w: 5, d: 4, h: 2.1, rh: 1.3, wall: '#FFF1C9', roof: '#E8616B', trim: '#FFFFFF', doorCol: '#4DABF7', exit: [14, 7], icon: () => ART.bedIcon() },
  { id: 'kermis', name: 'Kermis', tent: true, cx: 23.5, cz: 13.5, r: 2.15, exit: [23, 16], icon: () => PX.star() },
];

function rngf(seed) { return PX.rng(seed); }
function tex(cv, nearest = true) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  return t;
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

/* ------------------------------------------------------------------ */
export function createWorld(cv, { onEnter, onWish }) {
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
  const mobile = matchMedia('(pointer:coarse)').matches;
  let DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2);
  renderer.setPixelRatio(DPR);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .5, 220);

  /* ---------------- map ---------------- */
  for (const b of BUILDINGS) b.door = b.tent ? [23, 16] : [b.x + Math.floor(b.w / 2), b.z + b.d];
  const rectOf = b => b.tent ? [21, 11, 25, 15] : [b.x, b.z, b.x + b.w - 1, b.z + b.d - 1];
  const M = MAP.buildMap({ solids: BUILDINGS.map(rectOf), keep: BUILDINGS.map(b => b.door).concat([MAP.CASTLE.door]) });
  const { ground, block, trees } = M, LANTERNS = MAP.LANTERNS;
  const I = (x, z) => z * W + x, inb = (x, z) => x >= 0 && z >= 0 && x < W && z < H;
  const doors = new Map(BUILDINGS.map(b => [I(b.door[0], b.door[1]), b]));
  const footprint = new Map();
  for (const b of BUILDINGS) { const [x0, z0, x1, z1] = rectOf(b); for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) footprint.set(I(x, z), b); }
  const rng = rngf(20251122);
  const walkable = (x, z) => inb(x, z) && !block[I(x, z)];
  const waterTile = (x, z) => inb(x, z) && ground[I(x, z)] === WA && (((x + .5 - POND.cx) / (POND.rx - .4)) ** 2 + ((z + .5 - POND.cz) / (POND.rz - .4)) ** 2 <= 1);

  /* ---------------- ground texture ---------------- */
  const groundCanvas = ART.paintGround(M);
  {
    const c = groundCanvas;
    const t = tex(c); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: t }));
    top.rotation.x = -Math.PI / 2; top.position.set(W / 2, 0, H / 2); top.receiveShadow = true; top.userData.ground = true; scene.add(top);
    var groundMesh = top;
  }
  /* cliffs */
  {
    const [c, x] = canvas(16, 32); const r = rngf(5);
    for (let py = 0; py < 32; py++) for (let px = 0; px < 16; px++) {
      let col = py < 4 ? (py < 3 - (px % 3 === 0 ? 1 : 0) ? '#5FAE5A' : '#4E9A51') : (r() < .12 ? '#7D5F45' : (r() < .1 ? '#B8946E' : (py > 18 ? '#7E6047' : '#9C7B5B')));
      if (py > 4 && (py % 7 === 0) && r() < .7) col = '#86684D';
      x.fillStyle = col; x.fillRect(px, py, 1, 1);
    }
    const mk = rep => { const t = tex(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(rep, 1); return new THREE.MeshLambertMaterial({ map: t }); };
    const dark = new THREE.MeshLambertMaterial({ color: '#5b4636' });
    const box = new THREE.Mesh(new THREE.BoxGeometry(W, 2, H), [mk(H), mk(H), dark, dark, mk(W), mk(W)]);
    box.position.set(W / 2, -1.002, H / 2); box.receiveShadow = true; scene.add(box);
  }

  /* ---------------- water ---------------- */
  const waterUniforms = [];
  function waterMat(c1, c2, c3, scale = 8) {
    const u = { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) }, c3: { value: new THREE.Color(c3) }, dim: { value: 1 }, sc: { value: scale } };
    waterUniforms.push(u);
    return new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform float t,dim,sc; uniform vec3 c1,c2,c3; varying vec3 vW;
        void main(){ vec2 p=floor(vW.xz*sc)/sc;
          float w=sin(p.x*1.7+t*1.1)+sin(p.y*2.3-t*.9)+sin((p.x-p.y)*1.1+t*.6);
          vec3 c=mix(c1,c2,smoothstep(-1.2,1.6,w));
          float s=sin(p.x*5.3+t*1.6)*sin(p.y*4.1-t*1.3)*sin((p.x+p.y)*2.2+t);
          if(s>.62) c=c3;
          gl_FragColor=vec4(c*dim,1.); }`,
    });
  }
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), waterMat('#2F7FC0', '#5AB4E6', '#D8F4FF', 4));
  sea.rotation.x = -Math.PI / 2; sea.position.set(W / 2, -.9, H / 2); scene.add(sea);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 40), waterMat('#3E9AD6', '#6CC6F0', '#E8FAFF', 8));
  pond.rotation.x = -Math.PI / 2; pond.scale.set(POND.rx - .15, POND.rz - .15, 1); pond.position.set(POND.cx, .012, POND.cz); scene.add(pond);

  /* ---------------- lights ---------------- */
  const hemi = new THREE.HemisphereLight('#D4ECFF', '#8C7A5E', 1.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFE0B5', 2.7);
  sun.position.set(W / 2 - 9, 16, H / 2 + 11); sun.target.position.set(W / 2, 0, H / 2); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
  const sunOff = sun.position.clone().sub(sun.target.position), lDir = sunOff.clone().normalize(), lRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), lDir).normalize(), lUp = new THREE.Vector3().crossVectors(lDir, lRight);
  /** keep the shadow map centred on the view; moves in whole shadow texels so shadows do not shimmer */
  function aimSun(x, z) { const c = new THREE.Vector3(x, 0, z), tx = 44 / 2048, a = c.dot(lRight), b = c.dot(lUp); c.addScaledVector(lRight, Math.round(a / tx) * tx - a).addScaledVector(lUp, Math.round(b / tx) * tx - b); sun.target.position.copy(c); sun.position.copy(c).add(sunOff); sun.target.updateMatrixWorld(); }
  const lampLights = [];
  for (const [x, z] of [[11, 9], [18, 9], [11, 15], [18, 15]]) { const l = new THREE.PointLight('#FFC97A', 0, 6.5, 1.6); l.position.set(x + .5, 1.25, z + .5); scene.add(l); lampLights.push(l); }

  /* ---------------- sprites ---------------- */
  const geoCache = new Map();
  function spriteGeom(w, h) { const k = w + 'x' + h; if (!geoCache.has(k)) { const g = new THREE.PlaneGeometry(w / U, h / U); g.translate(0, h / U / 2, 0); geoCache.set(k, g); } return geoCache.get(k); }
  const spriteMats = [];
  function spriteMat(t) { const m = new THREE.MeshLambertMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .28 }); spriteMats.push(m); return m; }
  function makeSprite(cvs, { lean = .3, shadow = true, scale = 1 } = {}) {
    const t = tex(cvs); const mesh = new THREE.Mesh(spriteGeom(cvs.width, cvs.height), spriteMat(t));
    mesh.scale.setScalar(scale); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.rotation.x = -lean;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5 });
    return mesh;
  }
  const blobGeo = new THREE.CircleGeometry(.5, 16); blobGeo.rotateX(-Math.PI / 2);
  const blobMat = new THREE.MeshBasicMaterial({ color: '#1d1430', transparent: true, opacity: .28, depthWrite: false });
  function blob(sx, sz) { const m = new THREE.Mesh(blobGeo, blobMat); m.scale.set(sx, 1, sz); m.position.y = .015; return m; }

  // trees, bushes
  {
    const groups = new Map(), d = new THREE.Object3D();
    for (const t of trees) { const k = t.kind + ':' + t.seed; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
    for (const list of groups.values()) {
      const art = ART.propArt(list[0].kind, list[0].seed), tx = tex(art), sc = ART.propScale(list[0].kind);
      const inst = new THREE.InstancedMesh(spriteGeom(art.width, art.height), spriteMat(tx), list.length); inst.castShadow = inst.receiveShadow = true;
      inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tx, alphaTest: .5 });
      list.forEach((t, i) => { d.position.set(t.x + .5 + (t.fixed ? 0 : (rng() - .5) * .3), 0, t.z + .55); d.rotation.set(-.22, 0, 0); d.scale.setScalar(sc); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
      scene.add(inst);
    }
  }
  // tufts and flowers (instanced)
  function scatterInstanced(art, n, pick) {
    const t = tex(art); const mat = spriteMat(t);
    const inst = new THREE.InstancedMesh(spriteGeom(art.width, art.height), mat, n); inst.receiveShadow = true;
    const d = new THREE.Object3D(); let k = 0; let guard = 0;
    while (k < n && guard++ < n * 20) {
      const x = 2 + rng() * (W - 4), z = 2 + rng() * (H - 3); const tx = Math.floor(x), tz = Math.floor(z);
      if (!pick(tx, tz)) continue;
      d.position.set(x, 0, z); d.rotation.set(-.3, 0, 0); d.updateMatrix(); inst.setMatrixAt(k++, d.matrix);
    }
    inst.count = k; scene.add(inst);
  }
  const grassFree = (x, z) => inb(x, z) && ground[I(x, z)] === GR && !block[I(x, z)];
  scatterInstanced(PX.tuft(0), 170, grassFree); scatterInstanced(PX.tuft(1), 170, grassFree); scatterInstanced(PX.tuft(2), 120, grassFree);
  for (const c of ['#FF7EB6', '#FFFFFF', '#FFD43B', '#B9A3F0']) scatterInstanced(PX.smallFlower(c), 22, (x, z) => grassFree(x, z) && MAP.zoneAt(x, z) === 'dorp');

  // lanterns
  const lanternGlows = [];
  const glowTex = (() => { const [c, x] = canvas(32, 32); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (const [x, z] of LANTERNS) {
    const m = makeSprite(PX.lantern(), { lean: .25, scale: 1.1 }); m.position.set(x + .5, 0, z + .5); scene.add(m);
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFD08A', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.scale.set(1.6, 1.6, 1); g.position.set(x + .5, .92, z + .55); scene.add(g); lanternGlows.push(g);
  }

  /* ---------------- buildings ---------------- */
  const pick = [];   // meshes that can be tapped
  const windowGlows = [];
  function wallCanvas(b, face, wu, hu) {
    const [c, x] = canvas(wu * U, hu * U); const r = rngf(b.id.length * 31 + face.length);
    const w = c.width, h = c.height; const dark = PX.mix(b.wall, '#3b2a4a', .18), light = PX.mix(b.wall, '#ffffff', .18);
    x.fillStyle = b.wall; x.fillRect(0, 0, w, h);
    for (let y = 3; y < h; y += 4) { x.fillStyle = dark; x.fillRect(0, y, w, 1); }
    for (let y = 0; y < h; y += 4) { const off = (y / 4 % 2) * 5; for (let px = off; px < w; px += 11) { x.fillStyle = dark; x.fillRect(px, y, 1, 3); } }
    for (let k = 0; k < w * h / 60; k++) { x.fillStyle = r() < .5 ? light : dark; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); }
    x.fillStyle = b.trim; x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); x.fillRect(0, 0, w, 2);
    x.fillStyle = '#A89A8A'; x.fillRect(0, h - 4, w, 4); x.fillStyle = '#8E8070'; for (let px = 0; px < w; px += 5) x.fillRect(px, h - 4, 1, 4); x.fillRect(0, h - 4, w, 1);
    const wins = [];
    const windowAt = (cx, wy) => {
      x.fillStyle = b.trim; x.fillRect(cx - 6, wy - 1, 12, 12); x.fillStyle = '#2B1E3A'; x.fillRect(cx - 5, wy, 10, 10);
      x.fillStyle = '#BFE3FF'; x.fillRect(cx - 4, wy + 1, 8, 8); x.fillStyle = '#E8F6FF'; x.fillRect(cx - 3, wy + 2, 2, 2);
      x.fillStyle = '#2B1E3A'; x.fillRect(cx, wy + 1, 1, 8); x.fillRect(cx - 4, wy + 5, 8, 1);
      x.fillStyle = '#8B5A3C'; x.fillRect(cx - 6, wy + 11, 12, 3); const fl = ['#FF7EB6', '#FFD43B', '#FFFFFF', '#B9A3F0'];
      for (let k = 0; k < 5; k++) { x.fillStyle = fl[k % 4]; x.fillRect(cx - 5 + k * 2 + (k % 2), wy + 10 - (k % 2), 1, 1); }
      x.fillStyle = '#4DB37C'; x.fillRect(cx - 5, wy + 10, 10, 1);
      wins.push([cx / U, (h - wy - 5) / U]);
    };
    if (face === 'front') {
      const dw = 12, dh = 20, dx = Math.floor(w / 2 - dw / 2), dy = h - 4 - dh;
      x.fillStyle = b.trim; x.fillRect(dx - 1, dy - 1, dw + 2, dh + 1);
      x.fillStyle = b.doorCol; x.fillRect(dx, dy, dw, dh); x.fillStyle = PX.mix(b.doorCol, '#000000', .25); x.fillRect(dx + 3, dy + 3, 2, dh - 6); x.fillRect(dx + 7, dy + 3, 2, dh - 6);
      x.clearRect(dx - 1, dy - 1, 2, 2); x.clearRect(dx + dw - 1, dy - 1, 2, 2); x.fillStyle = b.wall; x.fillRect(dx - 1, dy - 1, 2, 2); x.fillRect(dx + dw - 1, dy - 1, 2, 2);
      x.fillStyle = '#FFD43B'; x.fillRect(dx + dw - 3, dy + 10, 2, 2);
      windowAt(Math.floor(w * .2), 8); windowAt(Math.floor(w * .8), 8);
    } else if (face === 'side') windowAt(Math.floor(w / 2), 8);
    return { c, wins };
  }
  function roofCanvas(b) {
    const [c, x] = canvas(32, 16); const base = b.roof, dk = PX.mix(base, '#2b1e3a', .3), lt = PX.mix(base, '#fff', .15);
    x.fillStyle = base; x.fillRect(0, 0, 32, 16);
    for (let y = 0; y < 16; y += 4) { x.fillStyle = dk; x.fillRect(0, y + 3, 32, 1); x.fillStyle = lt; x.fillRect(0, y, 32, 1); const off = (y / 4 % 2) * 4; for (let px = off; px < 32; px += 8) { x.fillStyle = dk; x.fillRect(px, y, 1, 4); } }
    return c;
  }
  function addWindowGlows(group, wins, z, sideX) {
    for (const [wx, wy] of wins) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ color: '#FFD48A', transparent: true, opacity: 0, depthWrite: false }));
      if (sideX === undefined) m.position.set(wx, wy, z); else { m.rotation.y = sideX > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(sideX, wy, wx); }
      group.add(m); windowGlows.push(m);
    }
  }
  const labels = [];
  function house(b) {
    const g = new THREE.Group(); g.position.set(b.x + b.w / 2, 0, b.z + b.d / 2);
    const front = wallCanvas(b, 'front', b.w, b.h), side = wallCanvas(b, 'side', b.d, b.h), back = wallCanvas(b, 'back', b.w, b.h);
    const mF = new THREE.MeshLambertMaterial({ map: tex(front.c) }), mS = new THREE.MeshLambertMaterial({ map: tex(side.c) }), mB = new THREE.MeshLambertMaterial({ map: tex(back.c) }), mT = new THREE.MeshLambertMaterial({ color: b.wall });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), [mS, mS, mT, mT, mF, mB]);
    walls.position.y = b.h / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
    addWindowGlows(g, front.wins.map(([wx, wy]) => [wx - b.w / 2, wy]), b.d / 2 + .01);
    // roof
    const o = .3, run = b.d / 2 + o, drop = b.rh * (b.d / 2 + o) / (b.d / 2), L = Math.hypot(run, drop);
    const rt = tex(roofCanvas(b)); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set((b.w + 2 * o) / 2, L);
    const rm = new THREE.MeshLambertMaterial({ map: rt }), rdark = new THREE.MeshLambertMaterial({ color: PX.mix(b.roof, '#2b1e3a', .4) });
    const ang = Math.atan2(drop, run);
    for (const s of [1, -1]) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w + 2 * o, .16, L), [rdark, rdark, rm, rdark, rdark, rdark]);
      slab.rotation.x = s * ang; slab.position.set(0, b.h + b.rh - drop / 2, s * run / 2); slab.castShadow = slab.receiveShadow = true; g.add(slab);
    }
    const tri = new THREE.Shape([new THREE.Vector2(-b.d / 2, 0), new THREE.Vector2(b.d / 2, 0), new THREE.Vector2(0, b.rh)]);
    for (const s of [1, -1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshLambertMaterial({ color: PX.mix(b.wall, '#3b2a4a', .1), side: THREE.DoubleSide })); gm.rotation.y = Math.PI / 2; gm.position.set(s * b.w / 2, b.h, 0); g.add(gm); }
    // extras
    if (b.id === 'bakkerij') {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.2, .5), new THREE.MeshLambertMaterial({ color: '#C77B6B' })); ch.position.set(b.w / 2 - 1, b.h + b.rh * .6 + .3, -.4); ch.castShadow = true; g.add(ch);
      chimney = new THREE.Vector3(g.position.x + b.w / 2 - 1, b.h + b.rh * .6 + .95, g.position.z - .4);
      const [ac, ax] = canvas(16, 4); for (let i = 0; i < 16; i++) { ax.fillStyle = (Math.floor(i / 2) % 2) ? '#FFFFFF' : '#FF7EB6'; ax.fillRect(i, 0, 1, 3); } ax.fillStyle = '#FF7EB6'; for (let i = 0; i < 16; i += 2) ax.fillRect(i, 3, 1, 1);
      const at = tex(ac); const aw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .5), new THREE.MeshLambertMaterial({ map: at, side: THREE.DoubleSide, transparent: true, alphaTest: .5 }));
      aw.position.set(0, 1.55, b.d / 2 + .25); aw.rotation.x = -.7; aw.castShadow = true; g.add(aw);
    }
    if (b.id === 'stal') {
      const hay = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, .6), new THREE.MeshLambertMaterial({ color: '#E9C46A' })); hay.position.set(b.w / 2 + .6, .25, b.d / 2 - .3); hay.castShadow = true; g.add(hay);
      const hay2 = hay.clone(); hay2.position.set(b.w / 2 + .5, .75, b.d / 2 - .3); hay2.scale.set(.8, 1, .9); g.add(hay2);
    }
    if (b.id === 'atelier') {
      const easel = makeSprite(PX.gridSprite(12, 18, (x, y) => { if (y < 11 && x > 0 && x < 11) return (x + y) % 5 === 0 ? PX.RAINBOW[(x + y) % 6] : (y < 2 || x < 2 || x > 9 || y > 9 ? '#A0704E' : ['#FFFFFF', '#FFE6F2', '#E8F6FF'][(x * y) % 3]); if (y >= 11 && (x === 2 || x === 9 || x === 6)) return '#7A5236'; return null; }), { lean: .25 });
      easel.position.set(-b.w / 2 - .5, 0, b.d / 2 + .3); g.add(easel);
    }
    g.traverse(o => { if (o.isMesh && !windowGlows.includes(o)) { o.userData.building = b; pick.push(o); } });
    scene.add(g);
    labels.push({ b, pos: new THREE.Vector3(g.position.x, b.h + b.rh + .55, g.position.z + b.d / 2) });
  }
  var chimney = null;
  function tent(b) {
    const g = new THREE.Group(); g.position.set(b.cx, 0, b.cz);
    const [sc, sx] = canvas(64, 16); for (let i = 0; i < 64; i++) { sx.fillStyle = (Math.floor(i / 8) % 2) ? '#FFF1DC' : '#E85D75'; sx.fillRect(i, 0, 1, 16); }
    sx.fillStyle = '#FFD43B'; sx.fillRect(0, 0, 64, 1);
    const st = tex(sc); st.wrapS = THREE.RepeatWrapping; st.repeat.set(3, 1);
    const ct = tex(sc); ct.wrapS = THREE.RepeatWrapping; ct.repeat.set(3, 1);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(b.r, b.r, 1.7, 16, 1, true), new THREE.MeshLambertMaterial({ map: st, side: THREE.DoubleSide }));
    body.position.y = .85; body.castShadow = body.receiveShadow = true; g.add(body);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(b.r + .35, 1.9, 16, 1, true), new THREE.MeshLambertMaterial({ map: ct, side: THREE.DoubleSide }));
    cone.position.y = 1.7 + .95; cone.castShadow = true; g.add(cone);
    const flag = makeSprite(PX.sprite(['k....', 'krrr.', 'krrrr', 'krrr.', 'k....', 'k....', 'k....'], { k: '#5E4A3A', r: '#FFD43B' }), { lean: 0, scale: 1.2 });
    flag.position.set(0, 3.6, 0); g.add(flag);
    const door = makeSprite(PX.gridSprite(18, 22, (x, y) => { const cx = x + .5 - 9; if (y < 9 && cx * cx + (y - 9) ** 2 > 81) return null; if (Math.abs(cx) < 6.5) return '#3D2B4F'; return (x + y) % 3 === 0 ? '#C94A62' : '#E85D75'; }), { lean: 0, shadow: false });
    door.position.set(0, 0, b.r + .02); g.add(door);
    g.traverse(o => { if (o.isMesh) { o.userData.building = b; pick.push(o); } });
    scene.add(g);
    for (const [dx, col] of [[-2.4, '#FF6B6B'], [-2.1, '#4DABF7'], [2.3, '#FFD43B']]) {
      const bl = makeSprite(PX.balloon(col), { lean: .1, scale: 1.3 }); bl.position.set(b.cx + dx, .2, b.cz + b.r - .2); scene.add(bl); balloons.push(bl);
    }
    labels.push({ b, pos: new THREE.Vector3(b.cx, 2.6, b.cz + b.r) });
  }
  const balloons = [];
  for (const b of BUILDINGS) b.tent ? tent(b) : house(b);

  /* fountain: pixel-art billboard with 3 animated water frames */
  const fountainFrames = [0, 1, 2].map(f => PX.gridSprite(40, 38, (x, y) => {
    const X = x + .5, Y = y + .5, inE = (cx, cy, rx, ry) => ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1;
    // water jets from the top bowl down into the basin (dashed, moving with the frame)
    for (const side of [-1, 1]) for (let k = 0; k <= 24; k++) { const t = k / 24; const jx = 20 + side * (8 + 9 * t), jy = 13 + 14 * t * t; if (Math.abs(X - jx) < .9 && Math.abs(Y - jy) < .9 && ((k + f * 2) % 6) < 4) return (k + f) % 6 === 0 ? '#FFFFFF' : '#A6E1FA'; }
    if (x >= 19 && x <= 20 && y >= 3 && y <= 10) return ((y + f) % 3 === 0) ? '#FFFFFF' : '#A6E1FA';      // top spout
    if (inE(20, 3, 2.2, 1.6) && ((x + y + f) % 2 === 0)) return '#E8FAFF';
    if (inE(20, 12, 8.5, 2.2)) return ((x * 3 + f * 5) % 11 === 0) ? '#FFFFFF' : '#6CC6F0';             // top bowl water
    if (y >= 12 && y <= 15 && Math.abs(X - 20) <= 9.5 - (y - 12) * 1.8) return y === 12 ? '#EFE8DC' : (X < 19 ? '#E6DDCF' : '#C8BCAA'); // bowl
    if (x >= 18 && x <= 21 && y > 15 && y < 27) return x === 18 ? '#EFE8DC' : (x === 21 ? '#B8AC9A' : (y % 4 === 0 ? '#C8BCAA' : '#DCD2C2')); // pillar
    if (inE(20, 27, 16, 4.2)) {                                                                           // basin water
      const ring = Math.abs(((X - 20) / 16) ** 2 + ((Y - 27) / 4.2) ** 2 - (.25 + f * .22)) < .07;
      return ring ? '#A6E1FA' : ((x * 7 + y * 13 + f * 5) % 19 === 0 ? '#FFFFFF' : (Y < 26 ? '#3E9AD6' : '#4FA8DE'));
    }
    if (inE(20, 27, 19.5, 6.2)) return Y < 26 ? '#F3EDE3' : '#E6DDCF';                                    // rim
    if (y >= 27 && y <= 33 && Math.abs(X - 20) <= 19.5 && (y < 33 || inE(20, 32, 19.5, 2.5))) {           // front wall, bricks
      const mort = y % 3 === 1 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0;
      return mort ? '#A89A8A' : (X < 12 ? '#E6DDCF' : X > 30 ? '#C8BCAA' : '#D9CFC0');
    }
    return null;
  }));
  const fountain = makeSprite(fountainFrames[0], { lean: .3 }); fountain.position.set(FOUNT.cx, 0, FOUNT.cz + .55); scene.add(fountain);
  const fountainTex = fountainFrames.map(cv => tex(cv));
  fountain.userData.fountain = true; fountain.userData.alpha = fountainFrames[0]; pick.push(fountain);
  const spray = { update(t) { const f = fountainTex[Math.floor(t * 5) % 3]; if (fountain.material.map !== f) { fountain.material.map = f; fountain.material.emissiveMap = f; fountain.customDepthMaterial.map = f; } } };

  /* particles: fireflies at night, drifting petals by day */
  const motes = (() => {
    const n = 200, pos = new Float32Array(n * 3), seeds = [];
    for (let i = 0; i < n; i++) seeds.push({ x: 2 + Math.random() * (W - 4), z: 2 + Math.random() * (H - 4), y: .3 + Math.random() * 1.4, p: Math.random() * 10, s: .3 + Math.random() * .6 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: '#FFF1A8', size: .1, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat); scene.add(pts);
    return { mat, update(t) { for (let i = 0; i < n; i++) { const s = seeds[i]; pos[i * 3] = s.x + Math.sin(t * s.s + s.p) * .8; pos[i * 3 + 1] = s.y + Math.sin(t * s.s * 1.7 + s.p) * .25; pos[i * 3 + 2] = s.z + Math.cos(t * s.s * .8 + s.p) * .8; } geo.attributes.position.needsUpdate = true; } };
  })();
  const smoke = []; { const art = PX.gridSprite(6, 6, (x, y) => ((x - 2.5) ** 2 + (y - 2.5) ** 2 <= 7 ? '#F4F1EE' : null), { outline: false }); for (let i = 0; i < 5; i++) { const m = makeSprite(art, { lean: 0, shadow: false }); m.material = m.material.clone(); m.material.transparent = true; m.material.alphaTest = .01; m.material.depthWrite = false; scene.add(m); smoke.push({ m, o: i / 5 }); } }

  /* ---------------- characters ---------------- */
  const chars = [];
  function makeChar(frames, { flippable = false, blobW = .7, scale = 1, name, say, sound } = {}) {
    const texs = {};
    for (const k in frames) { texs[k] = tex(frames[k]); if (flippable) texs[k + 'F'] = tex(PX.flipX(frames[k])); }
    const first = frames.idle;
    const mesh = new THREE.Mesh(spriteGeom(first.width, first.height), spriteMat(texs.idle));
    mesh.rotation.x = -.3; mesh.scale.setScalar(scale); mesh.receiveShadow = true;
    const g = new THREE.Group(); g.add(mesh); g.add(blob(blobW, blobW * .55)); scene.add(g);
    const c = { g, mesh, texs, frames, flippable, face: 1, moving: false, hop: 0, pos: new THREE.Vector3(), name, say, sound, path: [], animT: Math.random() * 10, blinkT: 2 + Math.random() * 3,
      setFrame(k) { const key = k + (this.flippable && this.face < 0 ? 'F' : ''); const t = this.texs[key] || this.texs[k]; if (this.mesh.material.map !== t) { this.mesh.material.map = t; this.mesh.material.emissiveMap = t; } } };
    mesh.userData.char = c; pick.push(mesh); chars.push(c); return c;
  }
  const kidFrames = f => ({ idle: f('idle'), w1: f('w1'), w2: f('w2'), blink: f('idle', true) });
  const anna = makeChar(kidFrames(PX.anna), { name: 'Anna', say: ['Joepie!', 'Hoi!', 'Kom mee!'], blobW: .6 });
  const fenna = makeChar(kidFrames(PX.fenna), { name: 'Fenna', say: ['Hihi!', 'Hoera!', 'Wacht op mij!'], blobW: .55 });
  // the companion is whatever the quest says: nothing yet, an egg, a foal, or the growing unicorn
  const uniFrames = () => ART.companionFrames(Q.companionLook(), Q.quest.stage === 'ei' || Q.quest.stage === 'baby' ? Q.quest.stage : 'groot', Q.kind());
  const uni = makeChar(uniFrames(), { flippable: true, name: () => state.uni.name, say: ['Hihihi!', 'Ik ben ' + state.uni.name + '!', 'Briesss!'], blobW: 1.2 });
  uni.isUni = true;
  function refreshUnicorn() {
    const f = uniFrames(), st = Q.quest.stage;
    for (const k in uni.texs) { uni.texs[k].dispose(); delete uni.texs[k]; }
    for (const k in f) { uni.texs[k] = tex(f[k]); uni.texs[k + 'F'] = tex(PX.flipX(f[k])); }
    uni.frames = f; uni.mesh.geometry = spriteGeom(f.idle.width, f.idle.height); alphaCache.clear();
    uni.baseScale = st === 'jong' ? .82 : 1; uni.follow = st === 'ei' ? 1.5 : st === 'baby' ? 1.7 : 2;
    const bw = st === 'ei' ? .5 : st === 'baby' ? .8 : 1.2 * uni.baseScale; uni.g.children[1].scale.set(bw, 1, bw * .55);
    uni.g.visible = Q.hasCompanion(); uni.mesh.material.map = null; uni.setFrame('idle');
    uni.say = ['Hihihi!', 'Ik ben ' + state.uni.name + '!'];
  }

  const animals = [];
  function animal(frames, opts, home, water = false) {
    const c = makeChar(frames, opts); c.home = home; c.water = water; c.wait = 1 + Math.random() * 3; c.speed = water ? .6 : .9;
    const t = randomTile(c); c.pos.set(t[0] + .5, 0, t[1] + .5); animals.push(c); return c;
  }
  function randomTile(c) {
    const [x0, z0, x1, z1] = c.home;
    for (let k = 0; k < 60; k++) { const x = x0 + Math.floor(Math.random() * (x1 - x0 + 1)), z = z0 + Math.floor(Math.random() * (z1 - z0 + 1)); if (c.water ? waterTile(x, z) : walkable(x, z)) return [x, z]; }
    return [x0, z0];
  }
  const one = cv => ({ idle: cv, w1: cv, w2: cv });
  animal(one(PX.bunny()), { name: 'Konijn', say: ['Hop hop!', 'Wortel?'], sound: 'boing', blobW: .5 }, [8, 15, 13, 21]);
  animal(one(PX.cat()), { name: 'Poes', say: ['Miauw!', 'Prrr...'], sound: 'purr', blobW: .5 }, [18, 8, 26, 10]);
  animal(one(PX.puppy()), { name: 'Hondje', say: ['Woef woef!', 'Spelen?'], sound: 'boing', blobW: .55 }, [11, 14, 20, 20]);
  animal(one(PX.hedgehog()), { name: 'Egel', say: ['Snuf snuf!'], sound: 'pop', blobW: .55, flippable: true }, [2, 9, 9, 11]);
  animal(one(PX.duck()), { name: 'Eendje', say: ['Kwak!', 'Kwak kwak!'], sound: 'pop', blobW: .35, flippable: true }, [8, 10, 12, 14], true);
  animal(one(PX.duck()), { name: 'Eendje', say: ['Kwak!'], sound: 'pop', blobW: .35, flippable: true }, [8, 10, 12, 14], true);
  for (const a of animals) if (a.water) a.g.children[1].visible = false;

  /* ---------------- party & movement ---------------- */
  const START = [14.5, 15.5];
  anna.pos.set(START[0], 0, START[1]); fenna.pos.set(START[0], 0, START[1] + 1); uni.pos.set(START[0], 0, START[1] + 2.2);
  let trail = [];
  function resetTrail() { trail = []; for (let i = 0; i <= 30; i++) trail.push(new THREE.Vector2(anna.pos.x, anna.pos.z + i * .12)); }
  resetTrail();
  function trailAt(dist) {
    let acc = 0;
    for (let i = 0; i < trail.length - 1; i++) { const a = trail[i], b = trail[i + 1]; const seg = a.distanceTo(b); if (acc + seg >= dist) { const t = (dist - acc) / (seg || 1); return new THREE.Vector2().lerpVectors(a, b, t); } acc += seg; }
    return trail[trail.length - 1].clone();
  }

  function astar(sx, sz, tx, tz, ok) {
    if (!ok(tx, tz)) return null; const key = (x, z) => z * W + x;
    const open = [[sx, sz]], g = new Map([[key(sx, sz), 0]]), f = new Map([[key(sx, sz), 0]]), came = new Map(), closed = new Set();
    const hfn = (x, z) => Math.hypot(tx - x, tz - z);
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(key(...open[i])) < f.get(key(...open[bi]))) bi = i;
      const [cx, cz] = open.splice(bi, 1)[0]; const ck = key(cx, cz);
      if (cx === tx && cz === tz) { const p = [[cx, cz]]; let k = ck; while (came.has(k)) { k = came.get(k); p.unshift([k % W, Math.floor(k / W)]); } return p; }
      closed.add(ck);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue; const nx = cx + dx, nz = cz + dz; const nk = key(nx, nz);
        if (!ok(nx, nz) || closed.has(nk)) continue; if (dx && dz && (!ok(cx + dx, cz) || !ok(cx, cz + dz))) continue;
        const ng = g.get(ck) + (dx && dz ? 1.414 : 1);
        if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); f.set(nk, ng + hfn(nx, nz)); came.set(nk, ck); if (!open.some(o => o[0] === nx && o[1] === nz)) open.push([nx, nz]); }
      }
    }
    return null;
  }
  /** nearest walkable tile to a world point (by real distance, not scan order) */
  function nearestWalkable(px, pz) {
    const x = Math.floor(px), z = Math.floor(pz);
    for (let r = 1; r < 7; r++) { let best = null, bd = 1e9; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (!walkable(x + dx, z + dz)) continue; const d = Math.hypot(x + dx + .5 - px, z + dz + .5 - pz); if (d < bd) { bd = d; best = [x + dx, z + dz]; } } if (best) return best; }
    return null;
  }
  const R = .22; // character collision radius (tiles)
  const freeAt = (x, z) => walkable(Math.floor(x - R), Math.floor(z - R)) && walkable(Math.floor(x + R), Math.floor(z - R)) && walkable(Math.floor(x - R), Math.floor(z + R)) && walkable(Math.floor(x + R), Math.floor(z + R));
  function clearLine(a, b) { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / .12)); for (let i = 1; i <= n; i++) { const t = i / n; if (!freeAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; } return true; }
  /** string-pulling: keep only the waypoints needed to walk in straight lines */
  function smoothPath(start, pts) { const out = []; let cur = start, i = 0; while (i < pts.length) { let j = pts.length - 1; while (j > i && !clearLine(cur, pts[j])) j--; out.push(pts[j]); cur = pts[j]; i = j + 1; } return out; }
  let target = null; // building to enter on arrival
  function walkTo(tx, tz, building = null, exact = null) {
    const s = [Math.floor(anna.pos.x), Math.floor(anna.pos.z)];
    const ok = (x, z) => walkable(x, z) || (x === s[0] && z === s[1]);
    const p = astar(s[0], s[1], tx, tz, ok); if (!p) return false;
    let pts = p.slice(1).map(([x, z]) => new THREE.Vector3(x + .5, 0, z + .5));
    if (exact && freeAt(exact.x, exact.z)) { if (pts.length) pts[pts.length - 1] = exact.clone(); else pts = [exact.clone()]; }
    anna.path = smoothPath(anna.pos.clone(), pts);
    if (!anna.path.length && building) { arrive(building); return true; }
    target = building; const end = anna.path.length ? anna.path[anna.path.length - 1] : anna.pos; showMarker(end.x, end.z); return true;
  }
  function arrive(b) { target = null; anna.path = []; onEnter && onEnter(b.id); }
  let lastTile = -1;

  /* ---------------- marker, bubbles, labels ---------------- */
  const marker = makeSprite(PX.ring(), { lean: Math.PI / 2, shadow: false }); marker.material = marker.material.clone(); marker.material.transparent = true; marker.material.depthWrite = false; marker.material.alphaTest = .01; marker.position.y = .03; marker.visible = false; scene.add(marker);
  let markerT = 0;
  function showMarker(x, z) { marker.position.set(x, .03, z); marker.visible = true; markerT = 1; }
  const labelsEl = document.getElementById('labels');
  for (const l of labels) {
    const el = document.createElement('div'); el.className = 'blabel'; el.appendChild(PX.domSprite(l.b.icon(), 2)); el.appendChild(document.createTextNode(l.b.name));
    el.onclick = e => { e.stopPropagation(); if (!interactive) return; sfx.pop(); speak(l.b.say || 'Naar de ' + l.b.name.toLowerCase() + '!'); walkTo(l.b.door[0], l.b.door[1], l.b); };
    labelsEl.appendChild(el); l.el = el;
  }
  const bubbles = [];
  function bubble(c, text) {
    for (const b of bubbles) if (b.c === c) { b.el.remove(); b.dead = true; }
    const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; labelsEl.appendChild(el);
    bubbles.push({ c, el, until: performance.now() + 1800 });
  }
  const sparks = []; const sparkArt = [PX.sparkle('#FFF6D0'), PX.sparkle('#FFB3CC'), PX.heart()];
  function burst(p, n = 7, hearts = false) {
    for (let i = 0; i < n; i++) {
      const m = makeSprite(hearts && i % 2 ? sparkArt[2] : sparkArt[i % 2], { lean: 0, shadow: false, scale: hearts ? .7 : 1 });
      m.position.set(p.x + (Math.random() - .5) * .8, .8 + Math.random() * .6, p.z + .3); scene.add(m);
      sparks.push({ m, v: new THREE.Vector3((Math.random() - .5) * 1.5, 1.2 + Math.random(), 0), life: 1 });
    }
  }

  const alphaCache = new Map();
  let extras = null; const ctxHooks = { onWish };
  extras = createExtras({ THREE, scene, M, tex, canvas, spriteGeom, spriteMat, makeSprite, makeChar, animal, animals, chars, pick, burst, bubble, waterUniforms, windowGlows, anna, fenna, uni, refreshUnicorn, get onWish() { return ctxHooks.onWish; } });
  refreshUnicorn();

  /* ---------------- input ---------------- */
  let interactive = false;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  cv.addEventListener('pointerdown', e => {
    if (!interactive || paused) return;
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pick, false);
    for (const h of hits) {
      const d = h.object.userData;
      if (d.char && !d.char.g.visible) continue;
      if ((d.char || d.alpha) && h.uv && !opaqueAt(d.char ? d.char : null, d.alpha, h.uv)) continue;
      if (d.tap) { d.tap(); return; }
      if (d.char) { tapChar(d.char); return; }
      if (d.building) { const b = d.building; sfx.pop(); walkTo(b.door[0], b.door[1], b); return; }
      if (d.fountain) { if (extras.fountain()) return; sfx.splash(); burst(new THREE.Vector3(FOUNT.cx, 0, FOUNT.cz), 8); speak('Plons!'); return; }
    }
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, p)) return;
    const tx = Math.floor(p.x), tz = Math.floor(p.z);
    const fb = footprint.get(I(tx, tz)); if (fb) { sfx.pop(); walkTo(fb.door[0], fb.door[1], fb); return; }
    const t = walkable(tx, tz) ? [tx, tz] : nearestWalkable(p.x, p.z);
    if (t) { sfx.click(); target = null; walkTo(t[0], t[1], null, walkable(tx, tz) ? p : null); }
  });
  function opaqueAt(c, cvs, uv) {
    const src = c ? c.frames.idle : cvs; if (!src) return true;
    if (!alphaCache.has(src)) alphaCache.set(src, src.getContext('2d').getImageData(0, 0, src.width, src.height).data);
    const a = alphaCache.get(src); let x = Math.floor(uv.x * src.width), y = Math.floor((1 - uv.y) * src.height);
    if (c && c.flippable && c.face < 0) x = src.width - 1 - x;
    // a little forgiveness: count a hit if any pixel within 1px is solid
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < src.width && Y < src.height && a[(Y * src.width + X) * 4 + 3] > 0) return true; }
    return false;
  }
  function tapChar(c) {
    c.hop = 1; const txt = c.say[Math.floor(Math.random() * c.say.length)];
    if (c.isUni) { extras.tapCompanion(c); return; }
    (sfx[c.sound] || sfx.pop)(); bubble(c, txt); speak(txt); if (Math.random() < .4) burst(c.pos, 4, true);
  }
  const keys = new Set();
  addEventListener('keydown', e => { if (!interactive || paused) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) { keys.add(e.key.toLowerCase()); anna.path = []; target = null; e.preventDefault(); } });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  /* ---------------- post-processing ---------------- */
  const halfOK = renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float');
  let rt = null;
  const post = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2() }, near: { value: camera.near }, far: { value: camera.far }, focus: { value: 20 }, night: { value: 0 }, dof: { value: 6 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near, far, focus, night, dof; varying vec2 vUv;
      float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
      vec3 srgb(vec3 c){ c=max(c,0.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(vec3(.0031308),c)); }
      void main(){
        float d=lin(texture2D(tDepth,vUv).r); float df=d-focus;
        float coc = df>0. ? clamp((df-2.5)/11.,0.,1.) : clamp((-df-3.)/5.,0.,1.);
        float r=coc*dof; vec3 acc=vec3(0.); vec3 bl=vec3(0.);
        for(int i=0;i<16;i++){ float fi=float(i); float a=fi*2.39996; float rr=sqrt((fi+.5)/16.);
          vec2 o=vec2(cos(a),sin(a))*rr;
          acc+=texture2D(tColor,vUv+o*r/res).rgb;
          vec3 b=texture2D(tColor,vUv+o*dof*2.4/res).rgb; bl+=max(b-vec3(.72),0.); }
        vec3 col=acc/16.; bl/=16.;
        col+=bl*(.9+night*2.2);
        float l=dot(col,vec3(.2126,.7152,.0722)); col=mix(vec3(l),col,1.12);
        col*=mix(vec3(1.05,1.,.93),vec3(.9,.95,1.1),night);
        vec2 q=vUv-.5; col*=1.-dot(q,q)*(.7+night*.5);
        gl_FragColor=vec4(srgb(col),1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new THREE.Mesh(tri, post); quad.frustumCulled = false; postScene.add(quad);

  let camFov = 30, camPitch = .66, camDist = 20, viewW = 16;
  function resize() {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
    const a = w / h; camera.aspect = a;
    if (a < 1) { camFov = 44; camPitch = .86; viewW = 11.5; } else { camFov = 30; camPitch = .64; viewW = Math.min(19, 13 + a * 2.5); }
    camera.fov = camFov; camera.updateProjectionMatrix();
    camDist = THREE.MathUtils.clamp(viewW / 2 / (Math.tan(THREE.MathUtils.degToRad(camFov / 2)) * a), 12, 34);
    const pw = Math.floor(w * DPR), ph = Math.floor(h * DPR);
    if (rt) rt.dispose();
    rt = new THREE.WebGLRenderTarget(pw, ph, { type: halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType, depthTexture: new THREE.DepthTexture(pw, ph) });
    rt.depthTexture.type = THREE.UnsignedIntType;
    post.uniforms.tColor.value = rt.texture; post.uniforms.tDepth.value = rt.depthTexture; post.uniforms.res.value.set(pw, ph); post.uniforms.dof.value = 5.5 * DPR;
  }
  addEventListener('resize', resize); resize();

  /* ---------------- day / night ---------------- */
  let nightT = state.night ? 1 : 0, nightTarget = nightT;
  const C = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  function applyNight(t) {
    hemi.color.copy(C('#D4ECFF', '#5E6FB8', t)); hemi.groundColor.copy(C('#8C7A5E', '#2A2550', t)); hemi.intensity = 1.35 - .75 * t;
    sun.color.copy(C('#FFE0B5', '#A9BEFF', t)); sun.intensity = 2.7 - 2.25 * t;
    scene.background = C('#A6DCF7', '#141A45', t);
    for (const l of lampLights) l.intensity = 9 * t;
    for (const g of lanternGlows) g.material.opacity = .9 * t;
    for (const w of windowGlows) w.material.opacity = .95 * t;
    for (const u of waterUniforms) u.dim.value = 1 - .62 * t;
    for (const m of spriteMats) m.emissiveIntensity = .28 - .14 * t;
    motes.mat.opacity = .25 + .75 * t; motes.mat.size = .07 + .06 * t; motes.mat.color.copy(C('#FFFFFF', '#FFF1A8', t));
    post.uniforms.night.value = t;
  }
  applyNight(nightT);

  /* ---------------- loop ---------------- */
  let paused = false, last = performance.now(), time = 0; const perf = { t: 0, n: 0 };
  const camTarget = new THREE.Vector3(anna.pos.x, 0, anna.pos.z);
  const tmp = new THREE.Vector3();
  function updateChar(c, dt) {
    c.animT += dt;
    if (c.hop > 0) c.hop = Math.max(0, c.hop - dt * 2.5);
    const hopY = Math.sin((1 - c.hop) * Math.PI) * .35 * (c.hop > 0 ? 1 : 0);
    const bob = c.moving ? Math.abs(Math.sin(c.animT * 10)) * .05 : 0;
    c.g.position.copy(c.pos); c.mesh.position.y = hopY + bob;
    const breathe = (c.moving ? 1 : 1 + Math.sin(c.animT * 2.4) * .012) * (c.baseScale || 1); c.mesh.scale.set(breathe, breathe, 1);
    if (c.moving) { const f = Math.floor(c.animT * 7) % 4; c.setFrame(f === 0 ? 'w1' : f === 2 ? 'w2' : 'idle'); }
    else { c.blinkT -= dt; if (c.blinkT < 0) { c.setFrame(c.frames.blink ? 'blink' : 'idle'); if (c.blinkT < -.12) c.blinkT = 2 + Math.random() * 3.5; } else c.setFrame('idle'); }
  }
  function stepAlong(c, dt, speed) {
    if (!c.path.length) { c.moving = false; return false; }
    const tgt = c.path[0]; tmp.subVectors(tgt, c.pos); tmp.y = 0; const d = tmp.length(); const s = speed * dt;
    if (Math.abs(tmp.x) > .02) c.face = tmp.x > 0 ? 1 : -1;
    if (d <= s) { c.pos.copy(tgt); c.path.shift(); } else c.pos.addScaledVector(tmp, s / d);
    c.moving = true; return true;
  }
  let stepSnd = 0;
  function frame() {
    const now = performance.now(); const rawDt = (now - last) / 1000; const dt = Math.min(.05, rawDt); last = now; time += dt;
    // adaptive quality: if frames are slow for a while, render at a lower resolution (keeps walking smooth on phones)
    perf.t += rawDt; perf.n++;
    if (perf.t > 2) { const avg = perf.t / perf.n; if (avg > 1 / 40 && DPR > 1) { DPR = Math.max(1, DPR - .25); renderer.setPixelRatio(DPR); resize(); } perf.t = 0; perf.n = 0; }
    // night transition
    if (Math.abs(nightT - nightTarget) > .001) { nightT += Math.sign(nightTarget - nightT) * Math.min(Math.abs(nightTarget - nightT), dt * .8); applyNight(nightT); }
    // keyboard
    let kx = 0, kz = 0; if (keys.has('arrowleft') || keys.has('a')) kx--; if (keys.has('arrowright') || keys.has('d')) kx++; if (keys.has('arrowup') || keys.has('w')) kz--; if (keys.has('arrowdown') || keys.has('s')) kz++;
    const prev = anna.pos.clone();
    if (kx || kz) {
      const l = Math.hypot(kx, kz), sp = 3.4 * dt; const nx = anna.pos.x + kx / l * sp, nz = anna.pos.z + kz / l * sp;
      const stuck = !freeAt(anna.pos.x, anna.pos.z); // if somehow overlapping, let her walk out
      if (stuck || freeAt(nx, anna.pos.z)) anna.pos.x = nx; if (stuck || freeAt(anna.pos.x, nz)) anna.pos.z = nz;
      anna.moving = anna.pos.distanceTo(prev) > .001;
    } else stepAlong(anna, dt, 3.4);
    // tile events
    const ti = I(Math.floor(anna.pos.x), Math.floor(anna.pos.z));
    if (ti !== lastTile) lastTile = ti;
    { const b = doors.get(ti); if (b && interactive && !paused && kz < 0 && !kx) { keys.clear(); arrive(b); } }
    if (!anna.path.length && target) { const b = target; target = null; if (I(Math.floor(anna.pos.x), Math.floor(anna.pos.z)) === I(b.door[0], b.door[1])) arrive(b); }
    if (anna.moving) { stepSnd += dt; if (stepSnd > .32) { stepSnd = 0; sfx.step(); } }
    // trail followers
    if (anna.pos.distanceTo(prev) > .0001) { trail.unshift(new THREE.Vector2(anna.pos.x, anna.pos.z)); if (trail.length > 80) trail.pop(); }
    for (const [c, dist] of [[fenna, .85], [uni, uni.follow || 2]]) {
      const p = trailAt(dist); const before = c.pos.clone(); c.pos.x += (p.x - c.pos.x) * Math.min(1, dt * 12); c.pos.z += (p.y - c.pos.z) * Math.min(1, dt * 12);
      const mv = c.pos.distanceTo(before); c.moving = mv > .004; if (Math.abs(c.pos.x - before.x) > .003) c.face = c.pos.x > before.x ? 1 : -1;
    }
    // animals
    for (const a of animals) {
      if (a.path.length) stepAlong(a, dt, a.speed);
      else { a.moving = false; a.wait -= dt; if (a.wait < 0) { a.wait = 2 + Math.random() * 4; const t = randomTile(a); const s = [Math.floor(a.pos.x), Math.floor(a.pos.z)]; const ok = a.water ? waterTile : walkable; const p = astar(s[0], s[1], t[0], t[1], (x, z) => ok(x, z) || (x === s[0] && z === s[1])); if (p) a.path = p.slice(1).map(([x, z]) => new THREE.Vector3(x + .5, 0, z + .5)); } }
    }
    for (const c of chars) updateChar(c, dt);
    for (const a of animals) if (a.water) a.mesh.position.y = Math.sin(time * 2 + a.animT) * .03 - .05;
    // fx
    for (const u of waterUniforms) u.t.value = time;
    spray.update(time); motes.update(time); extras.update(dt, time, interactive && !paused);
    for (const bl of balloons) bl.position.y = .2 + Math.sin(time * 1.5 + bl.position.x) * .08;
    if (chimney) for (const s of smoke) { const k = (time * .25 + s.o) % 1; s.m.position.set(chimney.x + Math.sin(k * 6 + s.o * 9) * .15, chimney.y + k * 1.6, chimney.z); s.m.scale.setScalar(.6 + k * 1.2); s.m.material.opacity = (1 - k) * .8; }
    if (markerT > 0) { markerT -= dt * 1.2; marker.material.opacity = Math.max(0, markerT); marker.scale.setScalar(1 + (1 - markerT) * .4); if (markerT <= 0) marker.visible = false; }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt * 1.1; s.v.y -= dt * 1.5; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(Math.max(.01, s.life)); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
    // camera
    camTarget.x += (anna.pos.x - camTarget.x) * Math.min(1, dt * 3); camTarget.z += (anna.pos.z - camTarget.z) * Math.min(1, dt * 3);
    const halfW = viewW / 2; const cx = THREE.MathUtils.clamp(camTarget.x, Math.min(W / 2, halfW - 1), Math.max(W / 2, W - halfW + 1)); const cz = THREE.MathUtils.clamp(camTarget.z, 4, H - 3);
    camera.position.set(cx, Math.sin(camPitch) * camDist, cz + Math.cos(camPitch) * camDist); camera.lookAt(cx, .6, cz - .5); camera.updateMatrixWorld(); aimSun(cx, cz - 2);
    post.uniforms.focus.value = camera.position.distanceTo(anna.pos);
    // DOM
    const wpx = innerWidth, hpx = innerHeight;
    for (const l of labels) { tmp.copy(l.pos).project(camera); const vis = tmp.z < 1 && Math.abs(l.pos.x - anna.pos.x) < 17 && Math.abs(l.pos.z - anna.pos.z) < 14; l.el.style.display = vis ? '' : 'none'; if (!vis) continue; const off = Math.abs(tmp.x) > .92 || tmp.y > .8 || tmp.y < -.9; const x = THREE.MathUtils.clamp(tmp.x, -.86, .86), y = THREE.MathUtils.clamp(tmp.y, -.85, .76); l.el.style.left = ((x + 1) / 2 * wpx) + 'px'; l.el.style.top = ((1 - y) / 2 * hpx) + 'px'; l.el.classList.toggle('edge', off); }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (b.dead || now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } tmp.set(b.c.pos.x, 1.9 * (b.c.isUni ? 1.15 : 1) - (b.c === fenna ? .25 : 0), b.c.pos.z).project(camera); b.el.style.left = ((tmp.x + 1) / 2 * wpx) + 'px'; b.el.style.top = ((1 - tmp.y) / 2 * hpx) + 'px'; }
    // render
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
  renderer.setAnimationLoop(frame);

  function placeAt(x, z) { anna.pos.set(x, 0, z); anna.path = []; target = null; resetTrail(); fenna.pos.set(x, 0, z + .85); uni.pos.set(x, 0, z + 2); lastTile = I(Math.floor(x), Math.floor(z)); camTarget.set(x, 0, z); }

  if (new URLSearchParams(location.search).has('debug')) window.__w = {
    anna, chars, uni, renderer, walkTo, BUILDINGS, walkable, camera, M, Q, extras, placeAt,
    screen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; },
    info() { return { pos: [+anna.pos.x.toFixed(2), +anna.pos.z.toFixed(2)], path: anna.path.length, target: target && target.id, paused }; },
  };
  return {
    pause(p) { paused = p; labelsEl.style.visibility = p ? 'hidden' : ''; renderer.setAnimationLoop(p ? null : frame); if (!p) { last = performance.now(); perf.t = 0; perf.n = 0; } },
    setInteractive(v) { interactive = v; },
    setNight(n, instant) { nightTarget = n ? 1 : 0; if (instant) { nightT = nightTarget; applyNight(nightT); } },
    exitBuilding(id) { const b = BUILDINGS.find(b => b.id === id); if (b) placeAt(b.door[0] + .5, b.door[1] + 1.5); },
    refreshUnicorn,
    /** walk to a tile, or to a building's door (and go in) */
    walkToTile(x, z) { target = null; return walkTo(x, z); },
    walkToBuilding(id) { const b = BUILDINGS.find(b => b.id === id); return !!b && walkTo(b.door[0], b.door[1], b); },
    pos: () => [anna.pos.x, anna.pos.z],
    groundCanvas, extras,
  };
}
