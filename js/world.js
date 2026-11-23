// HD-2D style world: a 3D diorama island with pixel-art billboards, real-time light & shadow,
// and a depth-of-field / bloom / vignette post pass.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import * as PX from './pixel.js';
import { state, save } from './state.js';
import { sfx, speak } from './audio.js';
import * as MAP from './map.js';
import * as ART from './art.js';
import * as Q from './quest.js';
import { createExtras } from './world-extras.js';
import { createTools } from './world-tools.js';
import { createPlay } from './world-play.js';
import { createLife } from './world-life.js';
import { createToys } from './world-toys.js';
import { createWeather } from './world-weather.js';

const W = MAP.W, H = MAP.H, U = 16;      // map size in tiles (see map.js), pixels per tile
const { GR, WA, POND, FOUNT } = MAP;

// where each house stands is map data (MAP.HOUSES: one per area); here is only how it looks
export const BUILDINGS = [
  { id: 'stal', name: 'Stal', h: 2.1, rh: 1.3, wall: '#D2654A', roof: '#7A4A3A', trim: '#FFF1DC', doorCol: '#6B3F2A' },
  { id: 'atelier', name: 'Atelier', h: 2.1, rh: 1.3, wall: '#8DBDEB', roof: '#4A6FB8', trim: '#FFF6E3', doorCol: '#9B72E8' },
  { id: 'bakkerij', name: 'Bakkerij', h: 2.1, rh: 1.2, wall: '#FFD7E2', roof: '#D16A93', trim: '#FFFFFF', doorCol: '#8B5A3C' },
  { id: 'huisje', name: 'Huisje', h: 2.1, rh: 1.3, wall: '#FFF1C9', roof: '#E8616B', trim: '#FFFFFF', doorCol: '#4DABF7' },
  { id: 'kermis', name: 'Kermis' },
].map(b => Object.assign(b, MAP.HOUSES[b.id], { door: MAP.houseDoor(MAP.HOUSES[b.id]) }));
/** the castle is a building too (you walk in through the gate), but it is built in world-extras.js */
const CASTLE = Object.assign({ id: 'kasteel', name: 'Kasteel', castle: true }, MAP.CASTLE);
BUILDINGS.push(CASTLE);

function rngf(seed) { return PX.rng(seed); }
function tex(cv, nearest = true) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  return t;
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

/* ------------------------------------------------------------------ */
let sharedRenderer = null;   // one WebGL context for the page; the world itself is rebuilt for every cycle's new island
export function createWorld(cv, { onEnter, onWish, onMount, onShow, onShop }) {
  const renderer = sharedRenderer || (sharedRenderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' }));
  const ac = new AbortController(), listen = { signal: ac.signal };   // every listener goes away with destroy()
  const mobile = matchMedia('(pointer:coarse)').matches;
  let DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2);
  renderer.setPixelRatio(DPR);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .5, 220);

  /* ---------------- map ---------------- */
  const rectOf = MAP.houseRect;
  const seed = Q.mapSeed();
  const M = MAP.buildMap({ seed });
  const { ground, block, trees } = M, LANTERNS = MAP.LANTERNS;
  const I = (x, z) => z * W + x, inb = (x, z) => x >= 0 && z >= 0 && x < W && z < H;
  const doors = new Map(BUILDINGS.map(b => [I(b.door[0], b.door[1]), b]));
  const footprint = new Map();
  for (const b of BUILDINGS) { const [x0, z0, x1, z1] = rectOf(b); for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) footprint.set(I(x, z), b); }
  const rng = rngf(20251122);
  const walkable = (x, z) => inb(x, z) && !block[I(x, z)];
  let mount = null, busy = false;   // riding the unicorn ('uni') or the bike ('fiets'); busy: something else moves her (the boat)
  // the hole in the bridge is a jump for a ridden unicorn and a closed gate for everybody else
  const lowAt = (x, z) => inb(x, z) && (block[I(x, z)] === MAP.LOW || (block[I(x, z)] === MAP.GAP && mount === 'uni'));
  const breakAt = (x, z) => inb(x, z) && (block[I(x, z)] === MAP.BREAK || (block[I(x, z)] === MAP.GAP && mount !== 'uni'));
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
  /* the sea around the islands: a distance-to-land map tells the shader where the beach ends and how deep the water is */
  {
    const S = 4, mw = W * S, mh = H * S, d = new Float32Array(mw * mh);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const i = I(Math.floor(x / S), Math.floor(y / S)); d[y * mw + x] = ground[i] === MAP.SE || M.deck[i] ? 1e4 : 0; }
    const rel = (i, j, c) => { if (d[j] + c < d[i]) d[i] = d[j] + c; };
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const i = y * mw + x; if (x) rel(i, i - 1, 1); if (y) { rel(i, i - mw, 1); if (x) rel(i, i - mw - 1, 1.414); if (x < mw - 1) rel(i, i - mw + 1, 1.414); } }
    for (let y = mh - 1; y >= 0; y--) for (let x = mw - 1; x >= 0; x--) { const i = y * mw + x; if (x < mw - 1) rel(i, i + 1, 1); if (y < mh - 1) { rel(i, i + mw, 1); if (x < mw - 1) rel(i, i + mw + 1, 1.414); if (x) rel(i, i + mw - 1, 1.414); } }
    const data = new Uint8Array(mw * mh); for (let i = 0; i < d.length; i++) data[i] = Math.min(255, d[i] / S / 6 * 255);
    const mask = new THREE.DataTexture(data, mw, mh, THREE.RedFormat); mask.magFilter = mask.minFilter = THREE.LinearFilter; mask.needsUpdate = true;
    const u = { t: { value: 0 }, dim: { value: 1 }, mask: { value: mask }, size: { value: new THREE.Vector2(W, H) }, c1: { value: new THREE.Color('#8FE3E6') }, c2: { value: new THREE.Color('#3E9AD6') }, c3: { value: new THREE.Color('#2F7FC0') }, foam: { value: new THREE.Color('#FFFFFF') } };
    waterUniforms.push(u);
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform float t,dim; uniform sampler2D mask; uniform vec2 size; uniform vec3 c1,c2,c3,foam; varying vec3 vW;
        void main(){ vec2 p=floor(vW.xz*8.)/8.+.0625;
          float d=texture2D(mask,clamp(p/size,0.,1.)).r*6.;
          float lap=sin(t*.9+p.x*.5+p.y*.37)*.07;
          float dz=d-(.36+lap); if(dz<0.) discard;
          float k=floor(clamp(dz/2.4,0.,1.)*5.)/5.;
          vec3 c=mix(c1,c2,k); c=mix(c,c3,smoothstep(2.4,5.2,dz));
          float s=sin(p.x*5.3+t*1.1)*sin(p.y*4.1-t*.9)*sin((p.x+p.y)*2.2+t*.7);
          if(s>.8) c=mix(c,foam,.7);
          if(dz<.12) c=foam;
          float l2=.5+.18*sin(t*.9+p.x*.5+1.5); if(abs(dz-l2)<.045 && sin(p.x*3.+p.y*2.+t)>-.3) c=mix(c,foam,.75);
          gl_FragColor=vec4(c*dim,1.); }`,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), mat); sea.rotation.x = -Math.PI / 2; sea.position.set(W / 2, .02, H / 2); scene.add(sea);
    // bridges and piers: planks just above the water, with a post wherever the open sea is next to them
    const [pc, px] = canvas(16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { px.fillStyle = y % 4 === 0 ? '#8A5A3B' : ['#CC9A68', '#C18F5C', '#D6A674'][(Math.floor(y / 4) + Math.floor(x / 8)) % 3]; px.fillRect(x, y, 1, 1); }
    const top = new THREE.MeshLambertMaterial({ map: tex(pc) }), side = new THREE.MeshLambertMaterial({ color: '#8A5A3B' }), tiles = [], posts = [], open = (x, z) => inb(x, z) && ground[I(x, z)] === MAP.SE && block[I(x, z)] === 1;
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (M.deck[I(x, z)]) { tiles.push([x, z]); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, z + dz) && (x + z) % 2 === 0) posts.push([x + .5 + dx * .46, z + .5 + dz * .46]); }
    const o = new THREE.Object3D(), planks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .06, 1), [side, side, top, side, side, side], tiles.length); planks.receiveShadow = true;
    tiles.forEach(([x, z], k) => { o.position.set(x + .5, .018, z + .5); o.updateMatrix(); planks.setMatrixAt(k, o.matrix); }); scene.add(planks);
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .62, .16), new THREE.MeshLambertMaterial({ color: '#7A4E33' }), posts.length); pm.castShadow = pm.receiveShadow = true;
    posts.forEach(([x, z], k) => { o.position.set(x, .2, z); o.updateMatrix(); pm.setMatrixAt(k, o.matrix); }); scene.add(pm);
  }
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
  for (const [x, z] of [1, 2, 4, 5].map(k => LANTERNS[k])) { const l = new THREE.PointLight('#FFC97A', 0, 6.5, 1.6); l.position.set(x + .5, 1.25, z + .5); scene.add(l); lampLights.push(l); }

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
  /** a small thing that must never get lost behind a tree or a house: where something stands in front of it, it shines through */
  function seeThrough(mesh) {
    const g = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ map: mesh.material.map, alphaTest: .5, transparent: true, opacity: .6, depthFunc: THREE.GreaterDepth, depthWrite: false, side: THREE.DoubleSide }));
    g.renderOrder = 5; g.raycast = () => { }; mesh.add(g); return mesh;
  }
  const blobGeo = new THREE.CircleGeometry(.5, 16); blobGeo.rotateX(-Math.PI / 2);
  const blobMat = new THREE.MeshBasicMaterial({ color: '#1d1430', transparent: true, opacity: .28, depthWrite: false });
  function blob(sx, sz) { const m = new THREE.Mesh(blobGeo, blobMat); m.scale.set(sx, 1, sz); m.position.y = .015; return m; }

  // trees, bushes
  const treeMeshes = [];
  {
    const groups = new Map(), d = new THREE.Object3D();
    for (const t of trees) { const k = t.kind + ':' + t.seed; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
    for (const list of groups.values()) {
      const art = ART.propArt(list[0].kind, list[0].seed), tx = tex(art), sc = ART.propScale(list[0].kind);
      const inst = new THREE.InstancedMesh(spriteGeom(art.width, art.height), spriteMat(tx), list.length); inst.castShadow = inst.receiveShadow = true;
      inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tx, alphaTest: .5 });
      list.forEach((t, i) => { t.px = t.x + .5 + (t.fixed ? 0 : (rng() - .5) * .3); t.inst = inst; t.i = i; t.sc = sc; d.position.set(t.px, 0, t.z + .55); d.rotation.set(-.22, 0, 0); d.scale.setScalar(sc); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
      inst.userData.trees = list; inst.userData.alpha = art; treeMeshes.push(inst);   // every tree, bush and prop can be tapped (see world-life.js)
      scene.add(inst);
    }
  }
  /** shake a tree, bush or prop for a moment */
  const wobbles = [], wobD = new THREE.Object3D();
  function wobble(t, amp = .22) { if (!t.inst || wobbles.some(w => w.t === t)) return false; wobbles.push({ t, k: 0, amp }); return true; }
  function stepWobbles(dt) {
    for (let i = wobbles.length - 1; i >= 0; i--) {
      const w = wobbles[i], t = w.t; w.k = Math.min(1, w.k + dt * 1.5);
      wobD.position.set(t.px, 0, t.z + .55); wobD.rotation.set(-.22, 0, Math.sin(w.k * 24) * w.amp * (1 - w.k)); const sq = 1 + Math.sin(w.k * 24) * .06 * (1 - w.k); wobD.scale.set(t.sc * sq, t.sc / sq, t.sc); wobD.updateMatrix();
      t.inst.setMatrixAt(t.i, wobD.matrix); t.inst.instanceMatrix.needsUpdate = true; if (w.k >= 1) wobbles.splice(i, 1);
    }
  }
  // tufts and flowers (instanced)
  function scatterInstanced(art, n, pick) {
    const t = tex(art); const mat = spriteMat(t);
    const inst = new THREE.InstancedMesh(spriteGeom(art.width, art.height), mat, n); inst.receiveShadow = true;
    const d = new THREE.Object3D(); let k = 0; let guard = 0;
    while (k < n && guard++ < n * 20) {
      const x = 4 + rng() * (W - 8), z = 4 + rng() * (H - 8); const tx = Math.floor(x), tz = Math.floor(z);
      if (!pick(tx, tz)) continue;
      d.position.set(x, 0, z); d.rotation.set(-.3, 0, 0); d.updateMatrix(); inst.setMatrixAt(k++, d.matrix);
    }
    inst.count = k; scene.add(inst);
  }
  const grassFree = (x, z) => inb(x, z) && ground[I(x, z)] === GR && !block[I(x, z)];
  scatterInstanced(PX.tuft(0), 300, grassFree); scatterInstanced(PX.tuft(1), 300, grassFree); scatterInstanced(PX.tuft(2), 200, grassFree);
  for (const c of ['#FF7EB6', '#FFFFFF', '#FFD43B', '#B9A3F0']) scatterInstanced(PX.smallFlower(c), 22, (x, z) => grassFree(x, z) && M.zone[I(x, z)] === 'dorp');

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
  // no signs on the houses: a few quiet twinkles at the door are the only hint that you can go in
  const twinkles = [];
  function doorGlow(x, z) {
    [[-.55, 1.25], [.5, .75], [-.3, .3], [.15, 1.55]].forEach(([dx, y], k) => {
      const m = makeSprite(PX.sparkle(k % 2 ? '#FFE3F1' : '#FFF6D0'), { lean: 0, shadow: false }); m.material = m.material.clone(); m.material.emissiveIntensity = 1;
      m.position.set(x + dx, y, z); scene.add(m); twinkles.push({ m, y, p: k * 1.7 + x });
    });
  }
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
    doorGlow(b.door[0] + .5, b.z + b.d + .1);
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
    doorGlow(b.cx, b.cz + b.r + .1);
  }
  const balloons = [];
  for (const b of BUILDINGS) if (!b.castle) b.tent ? tent(b) : house(b);
  doorGlow(CASTLE.x + CASTLE.w / 2, CASTLE.z + CASTLE.d + .1);

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
    const n = 70, pos = new Float32Array(n * 3), seeds = [];
    for (let i = 0; i < n; i++) seeds.push({ x: 2 + Math.random() * (W - 4), z: 2 + Math.random() * (H - 4), y: .3 + Math.random() * 1.4, p: Math.random() * 10, s: .3 + Math.random() * .6 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: '#FFF1A8', size: .1, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat); scene.add(pts);
    return { mat, update(t) { for (let i = 0; i < n; i++) { const s = seeds[i]; pos[i * 3] = s.x + Math.sin(t * s.s + s.p) * .8; pos[i * 3 + 1] = s.y + Math.sin(t * s.s * 1.7 + s.p) * .25; pos[i * 3 + 2] = s.z + Math.cos(t * s.s * .8 + s.p) * .8; } geo.attributes.position.needsUpdate = true; } };
  })();
  const smoke = []; { const art = PX.gridSprite(6, 6, (x, y) => ((x - 2.5) ** 2 + (y - 2.5) ** 2 <= 7 ? '#F4F1EE' : null), { outline: false }); for (let i = 0; i < 5; i++) { const m = makeSprite(art, { lean: 0, shadow: false }); m.material = m.material.clone(); m.material.transparent = true; m.material.alphaTest = .01; m.material.depthWrite = false; scene.add(m); smoke.push({ m, o: i / 5 }); } }

  /* ---------------- characters ---------------- */
  const chars = [];
  // characters are drawn with twice the pixels of everything else (ART.hd), at the same size in the world
  const hdF = f => { const o = {}; for (const k in f) o[k] = ART.hd(f[k]); return o; }, charGeom = cv => spriteGeom(cv.width / 2, cv.height / 2);
  function makeChar(frames, { flippable = false, blobW = .7, scale = 1, name, say, sound } = {}) {
    const texs = {}; frames = hdF(frames);
    for (const k in frames) { texs[k] = tex(frames[k]); if (flippable) texs[k + 'F'] = tex(PX.flipX(frames[k])); }
    const first = frames.idle;
    const mesh = new THREE.Mesh(charGeom(first), spriteMat(texs.idle));
    mesh.rotation.x = -.3; mesh.scale.setScalar(scale); mesh.receiveShadow = true;
    const g = new THREE.Group(); g.add(mesh); g.add(blob(blobW, blobW * .55)); scene.add(g);
    const c = { g, mesh, texs, frames, flippable, face: 1, moving: false, hop: 0, hopH: .35, pos: new THREE.Vector3(), name, say, sound, path: [], animT: Math.random() * 10, blinkT: 2 + Math.random() * 3,
      setFrame(k) { const key = k + (this.flippable && this.face < 0 ? 'F' : ''); const t = this.texs[key] || this.texs[k]; if (this.mesh.material.map !== t) { this.mesh.material.map = t; this.mesh.material.emissiveMap = t; if (this.ghost) this.ghost.material.map = t; } } };
    c.zBias = (chars.length % 7) * .008; mesh.userData.char = c; pick.push(mesh); chars.push(c); return c;
  }
  const kidFrames = f => ({ idle: f('idle'), w1: f('w1'), w2: f('w2'), blink: f('idle', true), jump: f('jump') });
  // one girl walks around at a time; the sisters take turns whenever they swap seats (HUD button, saved in state.extra.who)
  const GIRLS = {
    anna: { name: 'Anna', say: ['Hihi!', 'Hoera!', 'Kom mee!'], blobW: .55 },
    fenna: { name: 'Fenna', say: ['Joepie!', 'Hoi!', 'Kom mee!'], blobW: .6 },
  };
  /** draw a girl with what she has on today (bought at the stall) */
  function dress(id) {
    const g = GIRLS[id], w = Q.wearing(id); for (const k in g.texs || {}) g.texs[k].dispose();
    g.frames = hdF(kidFrames((f, blink) => PX.kidSprite(id, f, blink, w))); g.texs = {}; for (const k in g.frames) g.texs[k] = tex(g.frames[k]);
  }
  for (const id in GIRLS) dress(id);
  let who = GIRLS[state.extra.who] ? state.extra.who : 'anna';
  const kid = makeChar(GIRLS[who].frames, { name: GIRLS[who].name, say: GIRLS[who].say, blobW: GIRLS[who].blobW });
  function setWho(id, quiet = false) {
    const g = GIRLS[id]; if (!g) return;
    who = id; Object.assign(kid, { texs: g.texs, frames: g.frames, name: g.name, say: g.say });
    kid.mesh.geometry = charGeom(g.frames.idle); kid.g.children[1].scale.set(g.blobW, 1, g.blobW * .55); kid.mesh.material.map = null; kid.setFrame('idle');
    if (state.extra.who !== id) { state.extra.who = id; save(); }
    if (!quiet) { sfx.sparkle(); kid.hop = 1; burst(kid.pos, 8); bubble(kid, 'Ik ben ' + g.name + '!'); speak(g.name + ' is aan de beurt!'); }
  }
  const offWear = Q.on((type, d) => { if (type === 'wear' && GIRLS[d]) { dress(d); if (d === who) { setWho(who, true); kid.hop = 1; burst(kid.pos, 10, true); } } });
  // two billboards on the same spot fight over the same pixels and flicker: everyone gets a depth of their own, the girl in front
  kid.zBias = .06;
  // the companion is whatever the quest says: nothing yet, an egg, or the little unicorn (who never grows into another sprite)
  const uniFrames = () => ART.companionFrames(Q.companionLook(), Q.quest.stage === 'ei' ? 'ei' : 'baby', Q.kind());
  const uni = makeChar(uniFrames(), { flippable: true, name: () => state.uni.name, say: ['Hihihi!', 'Ik ben ' + state.uni.name + '!', 'Briesss!'], blobW: 1.2 });
  uni.isUni = true;
  function refreshUnicorn() {
    const f = hdF(uniFrames()), st = Q.quest.stage;
    for (const k in uni.texs) { uni.texs[k].dispose(); delete uni.texs[k]; }
    for (const k in f) { uni.texs[k] = tex(f[k]); uni.texs[k + 'F'] = tex(PX.flipX(f[k])); }
    uni.frames = f; uni.mesh.geometry = charGeom(f.idle); alphaCache.clear();
    uni.baseScale = st === 'vriend' ? 1.3 : 1; uni.follow = st === 'ei' ? 1.5 : 1.8;                       // the rainbow fruit makes her a little stronger, not different
    const bw = st === 'ei' ? .5 : .8 * uni.baseScale; uni.g.children[1].scale.set(bw, 1, bw * .55);
    uni.g.visible = Q.hasCompanion(); uni.mesh.material.map = null; uni.setFrame('idle');
    uni.say = ['Hihihi!', 'Ik ben ' + state.uni.name + '!'];
    if (mount === 'uni' && !Q.canRide()) setMount(null, true); else seat();
  }

  const animals = [];
  function animal(frames, opts, home, water = false) {
    const c = makeChar(frames, opts); c.home = home; c.water = water; c.ghost = seeThrough(c.mesh).children.at(-1); c.ghost.material.opacity = .5;   // never lost behind a tree after a throw
    c.wait = 1 + Math.random() * 3; c.speed = water ? .6 : .9;
    const t = randomTile(c); c.pos.set(t[0] + .5, 0, t[1] + .5); animals.push(c); return c;
  }
  function randomTile(c) {
    const [x0, z0, x1, z1] = c.home;
    for (let k = 0; k < 60; k++) { const x = x0 + Math.floor(Math.random() * (x1 - x0 + 1)), z = z0 + Math.floor(Math.random() * (z1 - z0 + 1)); if (c.water ? waterTile(x, z) : walkable(x, z)) return [x, z]; }
    return [x0, z0];
  }
  const one = cv => ({ idle: cv, w1: cv, w2: cv });
  animal(one(PX.bunny()), { name: 'Konijn', say: ['Hop hop!', 'Wortel?'], sound: 'boing', blobW: .5 }, [25, 44, 30, 50]);
  animal(one(PX.cat()), { name: 'Poes', say: ['Miauw!', 'Prrr...'], sound: 'purr', blobW: .5 }, [35, 37, 43, 39]);
  animal(one(PX.puppy()), { name: 'Hondje', say: ['Woef woef!', 'Spelen?'], sound: 'boing', blobW: .55 }, [28, 43, 37, 49]);
  animal(one(PX.hedgehog()), { name: 'Egel', say: ['Snuf snuf!'], sound: 'pop', blobW: .55, flippable: true }, [19, 38, 26, 40]);
  animal(one(PX.duck()), { name: 'Eendje', say: ['Kwak!', 'Kwak kwak!'], sound: 'pop', blobW: .35, flippable: true }, [25, 39, 29, 43], true);
  animal(one(PX.duck()), { name: 'Eendje', say: ['Kwak!'], sound: 'pop', blobW: .35, flippable: true }, [25, 39, 29, 43], true);
  for (const a of animals) if (a.water) a.g.children[1].visible = false;

  /* ---------------- party & movement ---------------- */
  const START = MAP.START;
  kid.pos.set(START[0], 0, START[1]); uni.pos.set(START[0], 0, START[1] + 2.2);
  let trail = [];
  /** (dx, dz): where the follower should end up, seen from her (south, unless that is water) */
  function resetTrail(dx = 0, dz = 1) { trail = []; for (let i = 0; i <= 30; i++) trail.push(new THREE.Vector2(kid.pos.x + dx * i * .12, kid.pos.z + dz * i * .12)); }
  resetTrail();
  function trailAt(dist) {
    let acc = 0;
    for (let i = 0; i < trail.length - 1; i++) { const a = trail[i], b = trail[i + 1]; const seg = a.distanceTo(b); if (acc + seg >= dist) { const t = (dist - acc) / (seg || 1); return new THREE.Vector2().lerpVectors(a, b, t); } acc += seg; }
    return trail[trail.length - 1].clone();
  }

  /** shortest path as [[x, z, jumped], ...]. With `jumps`, a low thing (log, puddle) can be hopped over in a straight
   *  line onto the free tile behind it; `jumped` marks the tile you land on. */
  function astar(sx, sz, tx, tz, ok, jumps = false) {
    if (!ok(tx, tz)) return null; const key = (x, z) => z * W + x;
    const open = [[sx, sz]], g = new Map([[key(sx, sz), 0]]), f = new Map([[key(sx, sz), 0]]), came = new Map(), closed = new Set(), via = new Set();
    const hfn = (x, z) => Math.hypot(tx - x, tz - z) * .85;
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(key(...open[i])) < f.get(key(...open[bi]))) bi = i;
      const [cx, cz] = open.splice(bi, 1)[0]; const ck = key(cx, cz);
      if (cx === tx && cz === tz) { const p = [[cx, cz, via.has(ck)]]; let k = ck; while (came.has(k)) { k = came.get(k); p.unshift([k % W, Math.floor(k / W), via.has(k)]); } return p; }
      closed.add(ck);
      const relax = (nx, nz, cost, jumped) => {
        const nk = key(nx, nz), ng = g.get(ck) + cost; if (closed.has(nk) || (g.has(nk) && ng >= g.get(nk))) return;
        g.set(nk, ng); f.set(nk, ng + hfn(nx, nz)); came.set(nk, ck); jumped ? via.add(nk) : via.delete(nk); if (!open.some(o => o[0] === nx && o[1] === nz)) open.push([nx, nz]);
      };
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue; const nx = cx + dx, nz = cz + dz;
        if (!ok(nx, nz)) continue; if (dx && dz && (!ok(cx + dx, cz) || !ok(cx, cz + dz))) continue;
        relax(nx, nz, dx && dz ? 1.414 : 1, false);
      }
      if (jumps) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (lowAt(cx + dx, cz + dz) && ok(cx + 2 * dx, cz + 2 * dz)) relax(cx + 2 * dx, cz + 2 * dz, 1.7, true);   // a bit cheaper than walking: hopping is fun
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
  function smoothPath(start, pts) {
    const out = []; let cur = start, i = 0;
    while (i < pts.length) {
      if (pts[i].jump) { out.push(pts[i]); cur = pts[i]; i++; continue; }
      let end = i; while (end + 1 < pts.length && !pts[end + 1].jump) end++;       // never cut a corner across a jump
      let j = end; while (j > i && !clearLine(cur, pts[j])) j--; out.push(pts[j]); cur = pts[j]; i = j + 1;
    }
    return out;
  }
  let target = null; // building to enter on arrival
  let after = null;  // what to do on arrival (cut the bramble she walked up to)
  /** deep: do not fall back to "walk up to whatever is in the way" */
  function walkTo(tx, tz, building = null, exact = null, deep = false) {
    after = null; if (!deep && play) play.wants(null);
    const s = [Math.floor(kid.pos.x), Math.floor(kid.pos.z)];
    const ok = (x, z) => walkable(x, z) || (x === s[0] && z === s[1]);
    const p = astar(s[0], s[1], tx, tz, ok, true);
    if (!p) {
      // the way is closed by brambles or boulders: walk up to the first one and use the tool on it (or hear which tool is missing)
      if (deep) return false;
      const p2 = astar(s[0], s[1], tx, tz, (x, z) => ok(x, z) || breakAt(x, z), true), hit = p2 && p2.find(([x, z]) => breakAt(x, z));
      if (hit) return approach(hit[0], hit[1], () => tools.useAt(hit[0], hit[1]), true);
      // over the water: walk to the boat instead (it sails by itself once she stands on the pier)
      const d = play.detour(tx, tz); if (!d || (d[0] === tx && d[1] === tz) || !walkTo(d[0], d[1])) return false;
      play.wants([tx, tz]); return true;                         // the boat takes her across and she walks on from there
    }
    let pts = p.slice(1).map(([x, z, j]) => { const v = new THREE.Vector3(x + .5, 0, z + .5); v.jump = j; return v; });
    if (exact && freeAt(exact.x, exact.z)) { if (!pts.length || pts[pts.length - 1].jump) pts.push(exact.clone()); else pts[pts.length - 1] = exact.clone(); }
    if (pts.length && pts[0].jump && freeAt(s[0] + .5, s[1] + .5)) pts.unshift(new THREE.Vector3(s[0] + .5, 0, s[1] + .5));   // take off from the middle of the tile
    kid.path = smoothPath(kid.pos.clone(), pts);
    if (!kid.path.length && building) { arrive(building); return true; }
    target = building; const end = kid.path.length ? kid.path[kid.path.length - 1] : kid.pos; showMarker(end.x, end.z); return true;
  }
  /** walk to a free tile next to (ox, oz), then do `then` */
  function approach(ox, oz, then, deep = false) {
    const s = [Math.floor(kid.pos.x), Math.floor(kid.pos.z)];
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [ox + dx, oz + dz]).filter(([x, z]) => walkable(x, z) || (x === s[0] && z === s[1]))
      .sort((a, b) => Math.hypot(a[0] + .5 - kid.pos.x, a[1] + .5 - kid.pos.z) - Math.hypot(b[0] + .5 - kid.pos.x, b[1] + .5 - kid.pos.z));
    for (const [x, z] of near) if (walkTo(x, z, null, null, true)) { after = then; return true; }
    return !deep && walkTo(ox, oz);
  }
  function arrive(b) { setMount(null, true); target = null; after = null; kid.path = []; onEnter && onEnter(b.id); }
  /** how she sits: on the unicorn she is drawn behind its body, a little towards the tail, so her legs disappear behind its back */
  function seat() { const u = mount === 'uni', sc = uni.baseScale || 1; kid.lift = u ? .36 * sc : mount === 'fiets' ? .34 : 0; kid.zBias = u ? -.03 : .06; kid.dx = u ? -.2 * sc : 0; }
  /** climb onto the unicorn ('uni') or the bike ('fiets'), or get off (null) */
  function setMount(m, quiet = false) {
    if (m === mount) return true; if (m === 'uni' && !(Q.canRide() && uni.g.visible)) return false;
    const was = mount; mount = m; kid.sit = !!m; seat(); kid.path = []; target = null; after = null;
    if (was === 'uni') { uni.pos.copy(kid.pos); resetTrail(); }
    if (!quiet) { kid.hop = .7; (m === 'fiets' ? sfx.bell : m ? sfx.sparkle : sfx.pop)(); if (m === 'uni') burst(kid.pos, 8, true); }
    play && play.mounted(m, was); onMount && onMount(m); return true;
  }
  /** a hop on the spot, just for fun (jumping over things happens by itself while walking) */
  function jump() {
    if (!interactive || paused || kid.hop > 0) return;
    if (mount === 'fiets') { kid.hop = .45; play.bell(); return; }               // on the bike the button is the bell
    if (life.throwIt()) return;                                                  // with an animal above her head the button throws it
    sfx.boing(); kid.hop = 1; toys.stomp(); life.jumped(); weather.stomp();
    if (mount !== 'uni') setTimeout(() => { if (uni.g.visible && uni.hop <= 0) uni.hop = 1; }, 200);
  }
  let lastTile = -1;

  /* ---------------- marker, bubbles, labels ---------------- */
  const marker = makeSprite(PX.ring(), { lean: Math.PI / 2, shadow: false }); marker.material = marker.material.clone(); marker.material.transparent = true; marker.material.depthWrite = false; marker.material.alphaTest = .01; marker.position.y = .03; marker.visible = false; scene.add(marker);
  let markerT = 0;
  function showMarker(x, z) { marker.position.set(x, .03, z); marker.visible = true; markerT = 1; }
  const labelsEl = document.getElementById('labels');
  const bubbles = [];
  function bubble(c, text, icon = null) {
    for (const b of bubbles) if (b.c === c) { b.el.remove(); b.dead = true; }
    const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; labelsEl.appendChild(el);
    if (icon) { const cvs = PX.domSprite(icon, 3); cvs.style.verticalAlign = 'middle'; el.prepend(cvs); }
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
  let extras = null, toys = null; const ctxHooks = { onWish };
  const ctx = { groundMesh, groundCanvas, THREE, scene, M, tex, canvas, spriteGeom, spriteMat, makeSprite, seeThrough, castle: CASTLE, onEnter, makeChar, animal, animals, chars, pick, burst, bubble, waterUniforms, windowGlows, kid, uni, refreshUnicorn, approach, get onWish() { return ctxHooks.onWish; },
    walkToTile: (x, z) => { target = null; return walkTo(x, z); }, walkable, nearestWalkable, randomTile, wobble, ground, astar, showMarker: (x, z) => showMarker(x, z),
    /** walk onto this very tile, then do `then` */
    walkThen: (x, z, then) => { target = null; if (!walkTo(x, z, null, null, true)) return false; after = then; return true; },
    onShop: () => onShop && onShop(),
    /** a full-screen moment (hatching, the rainbow fruit): main.js plays it and resolves when it is over */
    show: (type, data) => onShow ? onShow(type, data) : Promise.resolve(), placeAt: (x, z, dx, dz) => placeAt(x, z, dx, dz), mount: () => mount, setMount, who: () => who,
    /** something else moves her for a while (the boat): no walking, no taps */
    busy: () => busy,
    setBusy(v) { busy = v; if (v) { kid.path = []; target = null; after = null; keys.clear(); } } };
  let play = null;
  extras = ctx.extras = createExtras(ctx);
  const tools = createTools(ctx);
  play = ctx.play = createPlay(ctx);
  const life = ctx.life = createLife(ctx);
  toys = ctx.toys = createToys(ctx);
  const weather = ctx.weather = createWeather(ctx);
  for (const m of treeMeshes) pick.push(m);
  refreshUnicorn();

  /* ---------------- input ---------------- */
  let interactive = false;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  cv.addEventListener('pointerdown', e => {
    if (!interactive || paused) return;
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (play.aboard()) { const w = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, w)) play.steer(w.x, w.z); return; }   // in the boat a tap is where to sail
    if (busy) return;
    const hits = ray.intersectObjects(pick, false); let shook = false;
    for (const h of hits) {
      const d = h.object.userData;
      if (d.char && !d.char.g.visible) continue;
      if ((d.char || d.alpha) && h.uv && !opaqueAt(d.char ? d.char : null, d.alpha, h.uv)) continue;
      if (d.trees) { if (!shook) { shook = true; life.tapProp(d.trees[h.instanceId]); } continue; }   // it shakes, and she still walks there
      if (d.tap) { d.tap(h); return; }
      // an animal can be picked up: a tap makes it talk, a drag lifts it, letting go throws it (it thinks that is great fun)
      if (d.char && (animals.includes(d.char) || d.char.stone)) { if (!d.char.fly) { grab = { c: d.char, x: e.clientX, y: e.clientY, drag: false, pts: [] }; try { cv.setPointerCapture(e.pointerId); } catch (err) { } } return; }
      if (d.char) { tapChar(d.char); return; }
      if (d.building) { const b = d.building; sfx.pop(); walkTo(b.door[0], b.door[1], b); return; }
      if (d.fountain) { sfx.splash(); burst(new THREE.Vector3(FOUNT.cx, .5, FOUNT.cz), 8); for (const a of animals) if (a.water && !a.fly) a.hop = 1; toys.fountain(); return; }
    }
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, p)) return;
    const tx = Math.floor(p.x), tz = Math.floor(p.z);
    const fb = footprint.get(I(tx, tz)); if (fb) { sfx.pop(); walkTo(fb.door[0], fb.door[1], fb); return; }
    if (toys.tapGround(tx, tz)) return;                                         // with the bucket: build a sand tower there
    if (inb(tx, tz) && (ground[I(tx, tz)] === MAP.SE || ground[I(tx, tz)] === WA)) life.splash(p.x, p.z);
    const t = walkable(tx, tz) ? [tx, tz] : nearestWalkable(p.x, p.z);
    if (t) { sfx.click(); target = null; walkTo(t[0], t[1], null, walkable(tx, tz) ? p : null); }
  }, listen);
  let grab = null;
  const groundAt = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null; };
  cv.addEventListener('pointermove', e => {
    if (!grab) return;
    if (!grab.drag && Math.hypot(e.clientX - grab.x, e.clientY - grab.y) > 10) { grab.drag = true; life.hold(grab.c); }
    if (!grab.drag) return; const p = groundAt(e); if (!p) return;
    p.x = THREE.MathUtils.clamp(p.x, 2, W - 2); p.z = THREE.MathUtils.clamp(p.z, 2, H - 2);
    grab.c.pos.set(p.x, 0, p.z); grab.pts.push({ x: p.x, z: p.z, t: performance.now() }); if (grab.pts.length > 6) grab.pts.shift();
  }, listen);
  const letGo = () => {
    if (!grab) return; const g = grab; grab = null;
    if (!g.drag) { if (g.c.stone || (!toys.tapAnimal(g.c) && !play.tapAnimal(g.c))) life.tapAnimal(g.c); return; }
    const a = g.pts[0], b = g.pts[g.pts.length - 1], dt = a && b ? Math.max(.03, (b.t - a.t) / 1000) : 1;
    life.toss(g.c, a && b && performance.now() - b.t < 120 ? (b.x - a.x) / dt : 0, a && b && performance.now() - b.t < 120 ? (b.z - a.z) / dt : 0);
  };
  cv.addEventListener('pointerup', letGo, listen); cv.addEventListener('pointercancel', letGo, listen);
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
    if (c === kid && mount) { setMount(null); return; }
    if (c === kid && toys.carrying()) { toys.putDown(); return; }
    if (c === kid && life.setDown()) return;
    if (c === kid && life.tapKid()) return;                                      // three quick taps: she twirls                                     // or the animal she holds above her head                // tap her and she puts down what she carries
    c.hop = 1; const txt = c.say[Math.floor(Math.random() * c.say.length)];
    if (c.isUni) { extras.tapCompanion(c); return; }
    (sfx[c.sound] || sfx.pop)(); bubble(c, txt); speak(txt); if (Math.random() < .4) burst(c.pos, 4, true);
  }
  /** the pick-up key (Enter): throw or put down what she holds, else pick up what is next to her: an animal, a pebble, the can, the bucket, the kite, or get on the bike */
  function grabKey() {
    if (life.carrying()) return life.throwIt(); if (toys.carrying()) return toys.putDown();
    if (life.grabNear() || toys.takeNear()) return; if (mount === 'fiets') return setMount(null); if (play.bikeNear()) return play.tapBike(); kid.hop = .4;
  }
  const keys = new Set();
  const midJump = () => !!(kid.path[0] && kid.path[0].jump);
  addEventListener('keydown', e => {
    if (!interactive || paused || busy) return;
    if (e.key === ' ') { e.preventDefault(); if (!e.repeat) jump(); return; }
    if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); if (!e.repeat) grabKey(); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) { keys.add(e.key.toLowerCase()); if (!midJump()) { kid.path = []; target = null; after = null; } e.preventDefault(); }
  }, listen);
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()), listen);
  addEventListener('blur', () => keys.clear(), listen);

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
  addEventListener('resize', resize, listen); resize();

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
    motes.mat.opacity = .1 + .9 * t; motes.mat.size = .07 + .06 * t; motes.mat.color.copy(C('#FFFFFF', '#FFF1A8', t));
    post.uniforms.night.value = t;
  }
  applyNight(nightT);

  /* ---------------- loop ---------------- */
  let paused = false, last = performance.now(), time = 0; const perf = { t: 0, n: 0 };
  const camTarget = new THREE.Vector3(kid.pos.x, 0, kid.pos.z);
  const tmp = new THREE.Vector3();
  function updateChar(c, dt) {
    c.animT += dt;
    if (c.hop > 0) c.hop = Math.max(0, c.hop - dt * 2.5);
    const hopY = Math.sin((1 - c.hop) * Math.PI) * c.hopH * (c.hop > 0 ? 1 : 0); if (c.hop <= 0) c.hopH = .35;
    const bob = c.moving ? Math.abs(Math.sin(c.animT * 10)) * .05 : 0;
    c.g.position.copy(c.pos); c.mesh.position.y = hopY + bob + (c.lift || 0); c.mesh.position.z = c.zBias || 0; c.mesh.position.x = (c.dx || 0) * c.face;
    const breathe = (c.moving ? 1 : 1 + Math.sin(c.animT * 2.4) * .012) * (c.baseScale || 1); c.mesh.scale.set(breathe, breathe, 1);
    if (c.hop > 0 && c.texs.jump && !c.sit) c.setFrame('jump');
    else if (c.moving && !c.sit) { const f = Math.floor(c.animT * 7) % 4; c.setFrame(f === 0 ? 'w1' : f === 2 ? 'w2' : 'idle'); }
    else { c.blinkT -= dt; if (c.blinkT < 0) { c.setFrame(c.frames.blink ? 'blink' : 'idle'); if (c.blinkT < -.12) c.blinkT = 2 + Math.random() * 3.5; } else c.setFrame('idle'); }
  }
  function stepAlong(c, dt, speed) {
    if (!c.path.length) { c.moving = false; return false; }
    const tgt = c.path[0]; tmp.subVectors(tgt, c.pos); tmp.y = 0; const d = tmp.length(); const s = speed * dt;
    if (Math.abs(tmp.x) > .02) c.face = tmp.x > 0 ? 1 : -1;
    if (d <= s) { c.pos.copy(tgt); c.path.shift(); } else c.pos.addScaledVector(tmp, s / d);
    c.moving = true; return true;
  }
  let stepSnd = 0, jumpTo = null, jumpSpeed = 5, bumpT = 0;
  function frame() {
    const now = performance.now(); const rawDt = (now - last) / 1000; const dt = Math.min(.05, rawDt); last = now; time += dt;
    // adaptive quality: if frames are slow for a while, render at a lower resolution (keeps walking smooth on phones)
    perf.t += rawDt; perf.n++;
    if (perf.t > 2) { const avg = perf.t / perf.n; if (avg > 1 / 40 && DPR > 1) { DPR = Math.max(1, DPR - .25); renderer.setPixelRatio(DPR); resize(); } perf.t = 0; perf.n = 0; }
    // night transition
    if (Math.abs(nightT - nightTarget) > .001) { nightT += Math.sign(nightTarget - nightT) * Math.min(Math.abs(nightTarget - nightT), dt * .8); applyNight(nightT); }
    // keyboard
    const speed = mount === 'uni' ? 5.4 : mount === 'fiets' ? 4.8 : 3.4;
    let kx = 0, kz = 0; if (keys.has('arrowleft') || keys.has('a')) kx--; if (keys.has('arrowright') || keys.has('d')) kx++; if (keys.has('arrowup') || keys.has('w')) kz--; if (keys.has('arrowdown') || keys.has('s')) kz++;
    const prev = kid.pos.clone();
    if ((kx || kz) && !midJump()) {
      if (kx) kid.face = kx;                                                      // with the keys too she (and whoever carries her) looks where she goes
      const l = Math.hypot(kx, kz), sp = speed * dt; const nx = kid.pos.x + kx / l * sp, nz = kid.pos.z + kz / l * sp;
      const stuck = !freeAt(kid.pos.x, kid.pos.z); // if somehow overlapping, let her walk out
      if (stuck || freeAt(nx, kid.pos.z)) kid.pos.x = nx; if (stuck || freeAt(kid.pos.x, nz)) kid.pos.z = nz;
      kid.moving = kid.pos.distanceTo(prev) > .001;
      // walking straight into a log or puddle hops over it; into brambles or a boulder uses the tool
      if (!kid.moving && !stuck && !(kx && kz)) {
        const ax = Math.floor(kid.pos.x) + kx, az = Math.floor(kid.pos.z) + kz;
        if (lowAt(ax, az) && walkable(ax + kx, az + kz)) { const land = new THREE.Vector3(ax + kx + .5, 0, az + kz + .5); land.jump = true; kid.path = [land]; target = null; after = null; }
        else if (breakAt(ax, az) && time > bumpT) { bumpT = time + 1.5; tools.useAt(ax, az); }
      }
    } else {
      const land = midJump() ? kid.path[0] : null;
      if (land && jumpTo !== land) { jumpTo = land; kid.hop = 1; kid.hopH = mount === 'uni' ? .95 : .6; sfx.boing(); jumpSpeed = Math.max(4.5, Math.hypot(land.x - kid.pos.x, land.z - kid.pos.z) / .38); }
      stepAlong(kid, dt, land ? jumpSpeed : speed);
    }
    if (!kid.path.length && after) { const f = after; after = null; f(); }
    // tile events
    const ti = I(Math.floor(kid.pos.x), Math.floor(kid.pos.z));
    if (ti !== lastTile) lastTile = ti;
    { const b = doors.get(ti); if (b && interactive && !paused && kz < 0 && !kx) { keys.clear(); arrive(b); } }
    if (!kid.path.length && target) { const b = target; target = null; if (I(Math.floor(kid.pos.x), Math.floor(kid.pos.z)) === I(b.door[0], b.door[1])) arrive(b); }
    if (kid.moving) { stepSnd += dt; if (stepSnd > .32) { stepSnd = 0; sfx.step(); } }
    // trail followers
    if (kid.pos.distanceTo(prev) > .0001) { trail.unshift(new THREE.Vector2(kid.pos.x, kid.pos.z)); if (trail.length > 80) trail.pop(); }
    if (mount === 'uni') { uni.pos.copy(kid.pos); uni.face = kid.face; uni.moving = kid.moving; uni.hop = kid.hop; uni.hopH = kid.hopH; }   // she carries the girl
    else if (!busy) for (const [c, dist] of [[uni, uni.follow || 2]]) {
      let p = trailAt(dist); const before = c.pos.clone();
      // nobody stands on a log: wait in front of it, then hop over when the trail moves on
      if (lowAt(Math.floor(p.x), Math.floor(p.y))) { let back = dist; for (let k = 0; k < 8 && lowAt(Math.floor(p.x), Math.floor(p.y)); k++) p = trailAt(back += .25); p = trailAt(back + .45); }
      else if (c.hop <= 0 && (lowAt(Math.floor((c.pos.x + p.x) / 2), Math.floor((c.pos.z + p.y) / 2)) || lowAt(Math.floor(c.pos.x), Math.floor(c.pos.z))) && Math.hypot(p.x - c.pos.x, p.y - c.pos.z) > .05) { c.hop = 1; c.hopH = .55; } c.pos.x += (p.x - c.pos.x) * Math.min(1, dt * 12); c.pos.z += (p.y - c.pos.z) * Math.min(1, dt * 12);
      const mv = c.pos.distanceTo(before), dx = c.pos.x - before.x; c.moving = mv > .004; if (Math.abs(dx) > .01 && Math.abs(dx) > mv * .35) c.face = dx > 0 ? 1 : -1;   // walking straight up or down must not flip her left-right every frame
    }
    // animals
    for (const a of animals) {
      if (a.held || a.fly || a.cart || a.swim) { a.moving = false; continue; }                          // in her hands or flying through the air (world-life.js)
      if (a.friend) continue;                                                                             // walking along behind her (world-life.js)
      if (a.path.length) stepAlong(a, dt, a.speed);
      else { a.moving = false; a.wait -= dt; if (a.wait < 0) { a.wait = 2 + Math.random() * 4; const t = randomTile(a); const s = [Math.floor(a.pos.x), Math.floor(a.pos.z)]; const ok = a.water ? waterTile : walkable; const p = astar(s[0], s[1], t[0], t[1], (x, z) => ok(x, z) || (x === s[0] && z === s[1])); if (p) a.path = p.slice(1).map(([x, z]) => new THREE.Vector3(x + .5, 0, z + .5));
        else if (a.lost) { a.lost = false; burst(a.pos, 6); a.pos.set(t[0] + .5, 0, t[1] + .5); burst(a.pos, 6); sfx.sparkle(); } } }   // thrown too far to walk back: a little magic brings it home
    }
    for (const c of chars) updateChar(c, dt);
    for (const a of animals) if (a.water) a.mesh.position.y = Math.sin(time * 2 + a.animT) * .03 - .05;
    // fx
    for (const u of waterUniforms) u.t.value = time;
    spray.update(time); motes.update(time); extras.update(dt, time, interactive && !paused && !busy); tools.update(dt, time, interactive && !paused && !busy); play.update(dt, time, interactive && !paused); life.update(dt, time, interactive && !paused && !busy); toys.update(dt, time, interactive && !paused && !busy); weather.update(dt, time, interactive && !paused && !busy); stepWobbles(dt);
    for (const t of twinkles) { const k = Math.max(0, Math.sin(time * 2.2 + t.p)); t.m.scale.setScalar(.15 + k * .75); t.m.position.y = t.y + k * .08; t.m.visible = k > .02; }
    for (const bl of balloons) bl.position.y = .2 + Math.sin(time * 1.5 + bl.position.x) * .08;
    if (chimney) for (const s of smoke) { const k = (time * .25 + s.o) % 1; s.m.position.set(chimney.x + Math.sin(k * 6 + s.o * 9) * .15, chimney.y + k * 1.6, chimney.z); s.m.scale.setScalar(.6 + k * 1.2); s.m.material.opacity = (1 - k) * .8; }
    if (markerT > 0) { markerT -= dt * 1.2; marker.material.opacity = Math.max(0, markerT); marker.scale.setScalar(1 + (1 - markerT) * .4); if (markerT <= 0) marker.visible = false; }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt * 1.1; s.v.y -= dt * 1.5; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(Math.max(.01, s.life)); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
    // camera
    camTarget.x += (kid.pos.x - camTarget.x) * Math.min(1, dt * 3); camTarget.z += (kid.pos.z - camTarget.z) * Math.min(1, dt * 3);
    const halfW = viewW / 2; const cx = THREE.MathUtils.clamp(camTarget.x, Math.min(W / 2, halfW - 1), Math.max(W / 2, W - halfW + 1)); const cz = THREE.MathUtils.clamp(camTarget.z, 4, H - 3);
    camera.position.set(cx, Math.sin(camPitch) * camDist, cz + Math.cos(camPitch) * camDist); camera.lookAt(cx, .6, cz - .5); camera.updateMatrixWorld(); aimSun(cx, cz - 2);
    post.uniforms.focus.value = camera.position.distanceTo(kid.pos);
    // DOM
    const wpx = innerWidth, hpx = innerHeight;
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (b.dead || now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } tmp.set(b.c.pos.x, 1.9 * (b.c.isUni ? 1.15 : 1) - (b.c === kid && who === 'anna' ? .25 : 0), b.c.pos.z).project(camera); b.el.style.left = ((tmp.x + 1) / 2 * wpx) + 'px'; b.el.style.top = ((1 - tmp.y) / 2 * hpx) + 'px'; }
    // render
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
  renderer.setAnimationLoop(frame);

  function placeAt(x, z, dx = 0, dz = 1) { kid.pos.set(x, 0, z); kid.path = []; target = null; after = null; resetTrail(dx, dz); uni.pos.set(x + dx * 1.4, 0, z + dz * 1.4); lastTile = I(Math.floor(x), Math.floor(z)); camTarget.set(x, 0, z); }

  if (new URLSearchParams(location.search).has('debug')) window.__w = {
    grabKey, weather, kid, chars, uni, setWho, who: () => who, renderer, walkTo, BUILDINGS, walkable, camera, M, Q, MAP, extras, tools, play, life, toys, animals, placeAt, jump, seed, setMount, mount: () => mount, busy: () => busy,
    walkToBuilding(id) { const b = BUILDINGS.find(b => b.id === id); return !!b && walkTo(b.door[0], b.door[1], b); },
    screen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; },
    info() { return { pos: [+kid.pos.x.toFixed(2), +kid.pos.z.toFixed(2)], path: kid.path.length, target: target && target.id, paused }; },
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
    pos: () => [kid.pos.x, kid.pos.z],
    groundCanvas, extras, tools, play, toys, jump, setWho, who: () => who, M,
    /** on or off the unicorn (the HUD button); getting off a bike works the same way */
    ride() { return mount ? setMount(null) : setMount('uni'); }, mount: () => mount,
    /** the island this world was built for; when Q.mapSeed() moves on (a new cycle), main.js builds a new world */
    seed,
    destroy() {
      renderer.setAnimationLoop(null); ac.abort(); extras.dispose(); tools.dispose(); play.dispose(); life.dispose(); toys.dispose(); weather.dispose(); offWear(); labelsEl.innerHTML = ''; if (rt) rt.dispose();
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose(); if (o.customDepthMaterial) o.customDepthMaterial.dispose();
        for (const m of [].concat(o.material || [])) { for (const k of ['map', 'emissiveMap']) if (m[k] && m[k].dispose) m[k].dispose(); m.dispose(); }
      });
      renderer.renderLists.dispose(); if (window.__w && window.__w.seed === seed) delete window.__w;
    },
  };
}
