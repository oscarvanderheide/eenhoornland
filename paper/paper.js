// The stage of the paper game: the light, the lens, the theatre behind (sky, hills, clouds on threads), the two who are
// always there (she and her unicorn), and the rules of walking and tapping. What stands on the stage are sets (set-*.js):
// the one she is on and its neighbours across a bridge, each at its own place in one world (lands.js), built by loadWorld
// and thrown away by dropSet. Everything is made of the kit (kit.js).
// Everything is drawn in code: the paper is noise + fibres, the figures are cut-paper shapes on canvases.
import { THREE, rng, lerp, clamp, paperCanvas, PAPER, tex, paperBump, paper, sheetOf, card, whiteEdge, inPoly, edgeDist, wavyTop, cloudPts, sunPts, circlePts, WATER_Y } from './kit.js';
import { FIGS, cutout, WALK, drawKid, kidPoints, drawBalloon, BALLOON, WEAR } from './figures.js';
import eiland from './set-eiland.js';
import dorp from './set-dorp.js';
import bos from './set-bos.js';
import huis from './set-huis.js';
import wei from './set-wei.js';
import strand from './set-strand.js';
import { ORIGIN, WORLDS, SPREAD } from './lands.js';
const SETS = { eiland, dorp, bos, huis, wei, strand };

// switches in the address, for measuring on a phone what costs what: ?fps shows a readout; ?shadows=0, ?dof=0 (no soft focus),
// ?post=0 (no lens and film pass at all), ?dpr=1 (pixels per point; default the screen's, at most 2), ?bake=0 (every piece drawn on its own). Also ?who=fenna and ?wear=kroon,ballon.
const ASK = new URLSearchParams(location.search);
// how many pixels the picture may have, in millions: a phone lying down draws about one, a laptop's window at x2 five or more,
// and soft focus, shadows and the film pass are paid per pixel. Over the budget the picture is drawn a little coarser and
// stretched (it is soft and grainy anyway). ?px=4 sets another budget, ?px=0 none; ?dpr=1 fixes the pixels per point instead
const BUDGET = ASK.has('px') ? +ASK.get('px') * 1e6 : 3e6;
let DPR = 1;
const dprFor = (w, h) => ASK.get('dpr') ? Math.max(.5, Math.min(3, +ASK.get('dpr') || 1)) : Math.min(devicePixelRatio || 1, 2, BUDGET ? Math.sqrt(BUDGET / (w * h)) : 9);
const SHADOWS = ASK.get('shadows') !== '0', DOF = ASK.get('dof') !== '0', POST = ASK.get('post') !== '0', BAKE = ASK.get('bake') !== '0';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = SHADOWS; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.info.autoReset = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, .5, 140);

const STEP = 1 / 12;   // figures move like stop motion: their poses change twelve times a second
const WSTEP = 1 / 15;  // ...but a walk has twelve drawings per two steps, 15 a second: two calm steps in 0.8 s

/* ---------------- light ---------------- */
const hemi = new THREE.HemisphereLight('#cfe6e4', '#8a6f58', .85); scene.add(hemi);
const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
key.position.set(-7, 11, 8); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.blurSamples = 12;
Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 40 });
key.shadow.bias = -.0006; key.shadow.normalBias = .025;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#9fc4d8', .45); fill.position.set(8, 4, -6); scene.add(fill);
// two lamps a set may place (a street lamp, a lit room). They are always there, dark when unused: adding or taking away
// a light makes the graphics chip rebuild every paper, which would be a hitch whenever a set comes or goes
const lamps = [new THREE.PointLight('#ffc77a', 0, 5, 2), new THREE.PointLight('#ffb866', 0, 4, 1.4)]; scene.add(...lamps);

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

const theatre = new THREE.Group(); theatre.name = 'theatre'; scene.add(theatre);
const hills = [['#7fb0ad', -16, 1.3, 1], ['#9cc4bb', -24, 1.9, 2], ['#bcd6c6', -33, 2.6, 3]];
for (const [col, z, h, s] of hills) {
  const m = card(wavyTop(70, h, s * 5, h * .35, 2 + s), .12, paper(col)); m.position.set(0, -1.2, z); m.castShadow = false; theatre.add(m);
}
// clouds and the sun hang on threads from the top of the theatre
const thread = new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 1 }), hungs = [];
function hung(obj, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.userData.live = true;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 20, 4), thread); t.position.y = 10; g.add(t, obj); theatre.add(g); hungs.push(g); return g;   // in the theatre: where a set pushes the hills back, the clouds go along
}
for (const [x, y, z, w, s] of [[-7, 3.6, -11, 2.6, 1], [5.5, 4.4, -13, 3.4, 2], [12, 3.2, -10, 2.2, 3]]) {
  const c = card(cloudPts(w, s), .08, paper('#f7f1e6'), whiteEdge); c.castShadow = false; hung(c, x, y, z);
}
const sunCard = card(sunPts(1.1, 14), .08, paper('#f2b94e', { extra: { emissive: '#f2a93e', emissiveIntensity: .35 } })); sunCard.castShadow = false;
const sun = hung(sunCard, -11, 4.6, -14);
const moonShape = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + Math.PI * i / 24; moonShape.push([Math.cos(a) * .9, Math.sin(a) * .9]); }
for (let i = 24; i >= 0; i--) { const a = -Math.PI / 2 + Math.PI * i / 24; moonShape.push([Math.cos(a) * .45 - .05, Math.sin(a) * .82]); }
const moonCard = card(moonShape, .08, paper('#f3e2a0', { extra: { emissive: '#f3e2a0', emissiveIntensity: .6 } })); moonCard.castShadow = false;
const moon = hung(moonCard, 9, 22, -14);
const stars = new THREE.Group(); theatre.add(stars);
{ const R = rng(9); for (let i = 0; i < 16; i++) { const s = card(sunPts(.18 + R() * .12, 5), .04, paper('#f6e7ad', { extra: { emissive: '#f6e7ad', emissiveIntensity: .8 } })); s.castShadow = false; const g = hung(s, -20 + R() * 40, 24 + R() * 6, -16 - R() * 6); stars.add(g); } }

/* ---------------- sets: the places that exist right now ----------------
   A set is built by its file's build(S) under one group and thrown away whole. What a set tells the stage: floors (where
   she can stand), walls and solids (what she walks round), taps, trees, who lives there, the sea round it, its shots.
   The toolbox S is all a set file needs besides the kit. A set file thinks in its own measure, with its own middle at
   0, 0; the stage puts it at its place in the world (ORIGIN in lands.js) and moves everything it registers there.
   The set she stands on and its neighbours (NEAR) exist together, in one world: a bridge between two islands is a real
   bridge, owned by one of the two sets, and walking over it changes nothing but which set she is on. */
let sets = [], set = null, into = null;   // every set that exists; the one she stands on; the one being built just now
const world = { ms: 0 };
/* The camera director. A set gives a list of shots; each is a way of looking at her, and all but the last have a zone (a box
   on the floor, [x0, z0, x1, z1]). While she stands in a shot's zone that shot is on; she must walk `pad` beyond its edge to
   leave it again, so a shot never flickers at its border. The last shot is the one for everywhere else. Going from one shot
   to the next every number glides, never jumps: only a door cuts. What a shot says:
     ax, az, fx, fz  the camera looks at a point between (ax, az) and her: fx = fz = 1 keeps her in the middle, less leans
     lag             how much of that the camera itself moves sideways (under 1 it turns a little instead)
     span, tall      how many steps wide the picture is at her distance, lying down and upright: a big span makes her small
     rise, riseTall  how high the camera stands for every step it stands back (lying down, upright)
     yaw             turned round her, in radians: plus looks from the east. Keep it small: 'up' on the stick is always away
                     from the camera, so a wide turn would bend her path while the shot changes
     dof, range      how strong the soft focus is, and how deep the sharp part (2 = twice as deep)
     play            false for a shot she only walks through (a bridge): she may be too small there to tap things */
const SHOT_KEYS = ['ax', 'az', 'fx', 'fy', 'fz', 'lag', 'span', 'tall', 'rise', 'riseTall', 'yaw', 'dof', 'range'];
const SHOT_DEF = { ax: 0, az: 0, fx: 1, fy: .5, fz: 1, lag: 1, span: 14, tall: 8, rise: .28, riseTall: .5, yaw: 0, dof: 1, range: 1, pad: .8, play: true };
const SHOT0 = { ...SHOT_DEF, name: 'eiland', fx: .7, fz: .6, lag: .8, span: 12.5, tall: 7.5 };   // the test island's, and the look it was approved with
let shot = SHOT0, camYaw = 0, shotChanges = 0;
const cam = { ...SHOT0 };   // what the camera is doing right now: on its way to `shot`
const inZone = (s, x, z, pad = 0) => !s.zone || (x > s.zone[0] - pad && x < s.zone[2] + pad && z > s.zone[1] - pad && z < s.zone[3] + pad);
function shotFor(x, z) {
  if (shot.zone && inZone(shot, x, z, shot.pad) && sets.some(s => s.shots.includes(shot))) return shot;
  for (const s of sets) { const hit = s.shots.find(q => q.zone && inZone(q, x, z)); if (hit) return hit; }
  return set.shots[set.shots.length - 1];   // everywhere else: the last shot of the set she stands on
}
// the stick and her drawings think in the screen's left-right and near-far; the floor's east and south are turned by the camera's yaw
const toFloor = (sx, sz) => [sx * Math.cos(camYaw) + sz * Math.sin(camYaw), -sx * Math.sin(camYaw) + sz * Math.cos(camYaw)];
const toScreen = (wx, wz) => [wx * Math.cos(camYaw) - wz * Math.sin(camYaw), wx * Math.sin(camYaw) + wz * Math.cos(camYaw)];
const baseTaps = [];        // meshes that answer a tap on every set (she and her unicorn)
const baseSpots = [];       // ...and the things themselves, to find the one nearest a finger that just missed
function tapTarget(obj, fn, list = into.taps, spots = into.tapSpots) { obj.traverse(o => { if (o.isMesh) { o.userData.tap = fn; list.push(o); } }); spots.push({ obj, fn }); }

// lollipop trees: two slotted card discs on a stick, a smaller disc of another shade glued on each face
function lollipop(x, z, y, r, col, col2, seed, stickH = 1.25) {
  const g = new THREE.Group(); g.position.set(x, y, z); into.root.add(g);
  const sway = new THREE.Group(); sway.userData.live = true; g.add(sway);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, stickH, 8), paper('#7a5a3e')); stick.position.y = stickH / 2; stick.castShadow = stick.receiveShadow = true; sway.add(stick);   // (the same shadow flags and side as its crown: the whole tree is then one draw)
  // one disc of card on the stick, with smaller discs of other shades glued on, front and back
  const d = card(circlePts(r, seed), .06, paper(col), whiteEdge); d.position.y = stickH + r * .78; sway.add(d);
  for (const side of [1, -1]) {
    const d2 = card(circlePts(r * .64, seed + side * 3), .03, paper(col2), whiteEdge); d2.position.set(.07 * side, stickH + r * .9, .05 * side); sway.add(d2);
    const d3 = card(circlePts(r * .3, seed + side * 5), .03, paper(col), whiteEdge); d3.position.set(.12 * side, stickH + r * 1.02, .075 * side); sway.add(d3);
  }
  bake(sway);
  into.local.push({ x, z, r: .3 }); into.solids.push({ x: x + into.ox, z: z + into.oz, r: .3 });
  const t = { g, sway, wob: 0, x, z }; into.trees.push(t);
  tapTarget(g, () => { t.wob = 1; sfx.rustle(); });
  return t;
}
function pine(x, z, y, h, col) {
  const g = new THREE.Group(); g.position.set(x, y, z); into.root.add(g);
  const sway = new THREE.Group(); sway.userData.live = true; g.add(sway);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .4, 8), paper('#7a5a3e', { side: THREE.DoubleSide })); trunk.position.y = .2; trunk.castShadow = trunk.receiveShadow = true; sway.add(trunk);
  for (let i = 0; i < 3; i++) {
    const r = .55 - i * .13, hh = h * .45;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 14, 1, true), paper(col, { side: THREE.DoubleSide }));
    c.position.y = .35 + i * h * .22 + hh / 2; c.castShadow = c.receiveShadow = true; sway.add(c);
  }
  bake(sway); into.local.push({ x, z, r: .32 }); into.solids.push({ x: x + into.ox, z: z + into.oz, r: .32 });
  const t = { g, sway, wob: 0, x, z }; into.trees.push(t);
  tapTarget(g, () => { t.wob = 1; sfx.rustle(); });
  return t;
}
/** the sea: rows of wavy card, like a toy theatre, one sea for everything that exists. Every set says what water it wants
 *  round it (S.sea: the outlines its rows are cut around, how far it reaches); the stage makes one sea of all of that */
const seaRoot = new THREE.Group(); seaRoot.name = 'sea'; scene.add(seaRoot);
let seaRows = [], seaBaked = null, seaChunks = [];   // (the glued sea lies in pieces: one the camera cannot see is not drawn)
const view = new THREE.Frustum(), viewM = new THREE.Matrix4();
function buildSea() {
  seaRoot.traverse(o => { if (o.geometry) o.geometry.dispose(); }); seaRoot.clear(); seaRows = []; seaBaked = null; seaChunks = [];
  const asks = sets.map(s => s.seaAsk).filter(Boolean); if (!asks.length) return;
  const land = asks.flatMap(a => a.land), x0 = Math.min(...asks.map(a => a.x0)), x1 = Math.max(...asks.map(a => a.x1)), z0 = Math.min(...asks.map(a => a.z0)), z1 = Math.max(...asks.map(a => a.z1));
  const deep = asks.length === 1 ? asks[0].deep : [x1 - x0 + 500, z1 - z0 + 400, (x0 + x1) / 2, (z0 + z1) / 2];   // (deep water far beyond the waves: from the balloon the sea has no end)
  const blues = ['#5f9fae', '#6fb0b8', '#4f8ea2', '#7fbcc0', '#5a97a8'], fine = Math.min(...asks.map(a => a.fine));   // how many cuts per step along a wave
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(deep[0], deep[1]), paper('#3f6f80')); bed.rotation.x = -Math.PI / 2; bed.position.set(deep[2], -1.05, deep[3]); bed.receiveShadow = true; seaRoot.add(bed);
  let k = 0;
  for (let z = z0; z <= z1; z += .75, k++) {
    // where land is, the row is cut around it: one stretch of water between every two stretches of land
    const dry = [];
    for (const p of land) { let a = 1e9, b = -1e9; for (const [x, zz] of p) if (Math.abs(zz - z) < .5) { a = Math.min(a, x); b = Math.max(b, x); } if (a < b) dry.push([a + .4, b - .4]); }
    dry.sort((p, q) => p[0] - q[0]);
    const parts = []; let from = x0;
    for (const [a, b] of dry) { if (a > from) parts.push([from, a]); from = Math.max(from, b); }
    parts.push([from, x1]);
    for (const [a, b] of parts) {
      const w = b - a; if (w < .5) continue;
      const pts = [[0, 0]];
      for (let i = 0; i <= Math.ceil(w * fine); i++) { const x = i / Math.ceil(w * fine) * w; pts.push([x, .5 + Math.sin((a + x) * 2.1 + k * 1.3) * .09 + Math.sin((a + x) * .7 + k) * .05]); }
      pts.push([w, 0]);
      const m = card(pts, .05, paper(blues[k % blues.length]), whiteEdge); m.position.set(a, -1.08, z); m.castShadow = false;
      m.userData.live = true; seaRoot.add(m); seaRows.push({ m, z, base: a, k });
    }
  }
  if (BAKE) seaBaked = bakeSea(seaRows, seaRoot);
}
/** build one set at its place in the world */
function buildSet(def) {
  const t0 = performance.now(), [ox, oz] = ORIGIN[def.name] || [0, 0], W = ([x, z]) => [x + ox, z + oz];
  const root = new THREE.Group(); root.name = def.name; root.position.set(ox, 0, oz); scene.add(root);
  const s = into = { name: def.name, root, ox, oz, floors: [], walls: [], solids: [], local: [], taps: [], tapSpots: [], trees: [], ground: [], figs: [], lamps: [], doors: [], offers: [], names: {}, spots: {} };
  const S = {
    THREE, FIGS, root, girl, uni, sfx, confetti, bitGeo, starGeo, lollipop, pine,
    at: W,   // a place in the set's own measure -> where that is in the world (for whoever lives here: figures think in the world's measure)
    sea: o => { s.seaAsk = { fine: o.fine ?? 3, land: o.land.map(p => p.map(W)), x0: (o.x0 ?? -30) + ox, x1: (o.x1 ?? 30) + ox, z0: (o.z0 ?? -9) + oz, z1: (o.z1 ?? 17) + oz, deep: o.deep ? [o.deep[0], o.deep[1], o.deep[2] + ox, o.deep[3] + oz] : [120, 80, ox, oz] }; },
    floor: (h, pts, inset = 0) => { s.floors.push({ h, pts: pts.map(W), inset }); },
    floorBox: (h, x0, z0, x1, z1) => { s.floors.push({ h, box: [x0 + ox, z0 + oz, x1 + ox, z1 + oz] }); },
    wall: (cx, cz, hx, hz) => { const w = [cx + ox, cz + oz, hx, hz]; s.walls.push(w); return w; },   // (gives the wall back: a gate opens by making it nothing wide)
    solid: o => { s.local.push(o); s.solids.push({ ...o, x: o.x + ox, z: o.z + oz }); return o; }, solids: s.local,   // S.solids: what stands here so far, in the set's own measure
    tap: (obj, fn) => tapTarget(obj, fn),
    // a lamp the set may light (two per set). The stage has only two real lights and gives them to the lit lamps nearest her
    lamp: (i, color, distance, decay) => (s.lamps[i] = { color, distance, decay, intensity: 0, position: new THREE.Vector3() }),
    figure: (name, spec) => { const f = makeFigure(name, spec); s.figs.push(f); tapTarget(f.g, () => tapFigure(f)); return f; },
    // a door: walking into `zone` in the direction `dir` is a cut to the door of the same name on another set, where she then
    // stands at its `stand`. S.through(name) takes her through at once (a tap on the house)
    door: (name, zone, stand, dir) => { s.doors.push({ name, zone: [zone[0] + ox, zone[1] + oz, zone[2] + ox, zone[3] + oz], stand: W(stand), dir }); },
    through: name => { const d = s.doors.find(q => q.name === name); if (d) goThrough(d); },
    // for toys (toys.js): take her over, give her back, send her somewhere first, ask where she can stand (the world's measure)
    play, stopPlay, playing: () => playing, walkThen, free: (x, z, fromH) => free(x, z, fromH), heightAt: (x, z) => heightAt(x, z),
    pushing: () => push,   // which way she is pushing right now, in the world's measure ([0, 0]: not at all)
    hands,   // one thing in her hands at a time (see `hands`)
    offer: fn => { offers.push(fn); s.offers.push(fn); },   // something she holds that whoever she taps next may be given
    hand: () => { girl.g.updateMatrixWorld(true); return girl.point(kidPoints(girl.kid, girl.view, girl.poseOf(girl.frame), girl.frame).hold); },   // where her two hands are, in the world: for what she carries
    head: () => { girl.g.updateMatrixWorld(true); return girl.point(kidPoints(girl.kid, girl.view, girl.poseOf(girl.frame), girl.frame).top); },   // the top of her head, in the world
    glue: group => bake(group),   // a thing that moves as a whole (a windmill's sails): glue its pieces into one, so it is one draw
    move: (f, dx, dz) => move(f, dx, dz),   // for whoever lives here: a step that minds walls and edges; false if there was no way
  };
  Object.assign(s, def.build(S));
  s.start = W(s.start); s.uni = s.uni ? W(s.uni) : [s.start[0] - 1.2, s.start[1] + .4];
  s.places = Object.fromEntries(Object.entries(s.places || {}).map(([n, q]) => [n, W(q)])); s.spots = Object.fromEntries(Object.entries(s.spots).map(([n, [x, y, z]]) => [n, [x + ox, y, z + oz]]));
  { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const f of s.floors) for (const [x, z] of f.box ? [[f.box[0], f.box[1]], [f.box[2], f.box[3]]] : f.pts) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } s.box = [x0 - 1, z0 - 1, x1 + 1, z1 + 1]; s.box3 = new THREE.Box3(new THREE.Vector3(x0 - 4, -3, z0 - 4), new THREE.Vector3(x1 + 4, 9, z1 + 4)); }   // where its floors lie: a far set is passed over quickly
  s.shots = (s.shots || [SHOT0]).map(q => ({ ...SHOT_DEF, ...q, ax: (q.ax ?? SHOT_DEF.ax) + ox, az: (q.az ?? SHOT_DEF.az) + oz, ...(q.zone ? { zone: [q.zone[0] + ox, q.zone[1] + oz, q.zone[2] + ox, q.zone[3] + oz] } : {}) }));
  root.traverse(o => { if (o.isMesh && o.geometry.type === 'ExtrudeGeometry' && !o.userData.tap) s.ground.push(o); });   // card she can be sent to with a tap
  bake(root); s.farTrees = glueTrees(s); into = null; s.ms = performance.now() - t0;
  return s;
}
/** every tree of a set once more, all glued into one piece that stands still: what is drawn of them while she is on another
 *  set (a tree only moves when she taps it). The trees themselves are shown again the moment she steps onto their set */
function glueTrees(s) {
  if (!BAKE || !s.trees.length) return null;
  s.root.updateMatrixWorld(true);
  const inv = s.root.matrixWorld.clone().invert(), rel = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), lots = new Map();
  for (const t of s.trees) for (const m of (t.sway.children.find(c => c.name === 'baked') || { children: [] }).children) {
    const key = m.material.uuid + (m.castShadow ? 'c' : '') + (m.receiveShadow ? 'r' : ''), g = m.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
    let lot = lots.get(key); if (!lot) lots.set(key, lot = { m, p: [], n: [], u: [], c: [] });
    rel.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(rel);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(rel); lot.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); lot.n.push(v.x, v.y, v.z);
      lot.u.push(U.getX(i), U.getY(i)); if (C) lot.c.push(C.getX(i), C.getY(i), C.getZ(i)); else lot.c.push(1, 1, 1);
    }
  }
  const out = new THREE.Group(); out.name = 'far trees'; out.userData.live = true; out.visible = false;
  for (const lot of lots.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lot.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(lot.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(lot.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(lot.c, 3));
    const m = new THREE.Mesh(g, lot.m.material); m.castShadow = lot.m.castShadow; m.receiveShadow = lot.m.receiveShadow; out.add(m);
  }
  s.root.add(out); return out;
}
/** she stands on `s` now: its trees are themselves, every other set's are the glued piece */
let pinned = false;   // (a test may hold her on a set she does not stand on, to see that it makes no difference to the picture)
function standOn(s) { set = s; for (const q of sets) if (q.farTrees) { q.farTrees.visible = q !== s; for (const t of q.trees) t.g.visible = q === s; } }
/** throw away what exists and build the set called `name` with its neighbours; she starts on `name` */
/** every gate of the world stands open (brambles in bloom): for a start somewhere beyond them, and for the tests */
function openGates() { for (const s of sets) for (const q of Object.values(s.toys || {})) if (q.openGate) q.openGate(); }
function loadWorld(name) {
  const t0 = performance.now();
  for (const s of sets) dropSet(s);
  inHand = null;
  const group = WORLDS.find(w => w.includes(name)) || [name];
  sets = [name, ...group.filter(n => n !== name && SETS[n])].map(n => buildSet(SETS[n])); standOn(sets[0]);
  buildSea();
  // the sun's shadow: a set says how wide a sheet covers it (a number: the sheet lies still over the set) or that the sheet follows the camera
  { const sh = set.shadow || 13, r = sh.follow || sh, [cx, cz] = set.shadowAt || [0, 0], k = Math.max(1, r / 13);
    Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, far: 40 * k }); key.shadow.camera.updateProjectionMatrix();
    sun3.set(-7 * k, 11 * k, 8 * k); shadowFollow = sh.follow ? r : 0;
    key.target.position.set(set.ox + cx, 0, set.oz + cz); key.position.copy(key.target.position).add(sun3); }
  // the theatre stands behind everything that exists
  theatre.position.z = Math.min(...sets.map(s => s.back || 0)); { const k = Math.max(...sets.map(s => s.sky || 1)); sky.scale.set(k, 1, k); }
  [girl.x, girl.z] = set.start; [uni.x, uni.z] = set.uni; uni.face = 1;
  if (name !== group[0]) openGates();   // started beyond the village (a look at one island): the ways there are open
  // a new world is a cut: the camera is there at once
  shot = set.shots[set.shots.length - 1]; shot = shotFor(girl.x, girl.z); Object.assign(cam, shot); camCut = true;
  girl.y = heightAt(girl.x, girl.z) ?? 0; uni.y = heightAt(uni.x, uni.z) ?? 0; target = null; hold = null;
  world.ms = performance.now() - t0;
}
function dropSet(s) {
  scene.remove(s.root);
  s.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  for (const f of s.figs) { figures.splice(figures.indexOf(f), 1); scene.remove(f.g); f.mesh.geometry.dispose(); f.dispose(); }
  for (const o of s.offers) offers.splice(offers.indexOf(o), 1);
}
const sun3 = new THREE.Vector3(-7, 11, 8); let shadowFollow = 0;

/* ---------------- cut-paper figures ---------------- */

const figures = [];
/** a figure has a side view (facing right, the world flips it) and, if drawn, a front and a back view; each is a standing frame plus a walk.
 *  A sister (spec.kid) is a paper doll: she also has poses (fig.poseName), eyes that shut and things to wear (fig.redress).
 *  Drawings are made when first shown and kept; the usual ones are made ahead, a few per frame (warm), so a walk never stutters. */
const warm = [], figMats = [];   // figMats: the materials of figures that left with their set, kept for the next one (a material thrown away takes its program along, and making that again is a hitch)
function makeFigure(name, { w, h, draw, front, back, frames, size, kid }) {
  const views = { side: draw, front, back }, cache = new Map();
  const H = size, W = size * w / h;
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2, 0);
  const [mat, depth] = figMats.pop() || [new THREE.MeshStandardMaterial({ alphaTest: .5, side: THREE.DoubleSide, roughness: .9, bumpMap: paperBump, bumpScale: .6 }), new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: .5 })];
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = false;
  mesh.customDepthMaterial = depth;
  const g = new THREE.Group(), pose = new THREE.Group(); g.userData.live = true; g.add(pose); pose.add(mesh); scene.add(g);
  const fig = { name, g, pose, mesh, mat, views, kid, w, h, W, H, cyc: frames > WALK, view: 'side', x: 0, z: 0, y: 0, face: 1, frame: 0, walking: false, hop: 0, hopV: 0, tilt: 0, dirX: 1, dirZ: 0,
    wear: {}, poseName: null, eyes: 'open' };
  const poseOf = i => fig.poseName && fig.poseName !== 'sit' ? fig.poseName : fig.poseName === 'sit' && !i ? 'sit' : i ? 'walk' : 'stand';
  const tex = (view, i, ps = poseOf(i), eyes = fig.eyes) => {
    const key = kid ? `${view}|${ps}|${i}|${eyes}` : `${view}|${i}`; let t = cache.get(key);
    if (!t) { t = new THREE.CanvasTexture(cutout(w, h, kid ? c => drawKid(c, kid, { view, pose: ps, f: i, wear: fig.wear, eyes }) : c => views[view](c, i), PAPER, 1.25)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cache.set(key, t); }
    return t;
  };
  fig.poseOf = poseOf;
  fig.setFrame = (i, view = fig.view) => { if (!views[view]) view = 'side'; fig.frame = i; fig.view = view; const m = tex(view, i); if (mat.map !== m) { mat.map = m; mesh.customDepthMaterial.map = m; } };
  /** make the standing frame and the walk of every view ahead of time: at once (now) or a few per frame */
  fig.warmUp = now => { for (const v of Object.keys(views)) if (views[v]) for (let i = 0; i < frames; i++) { if (now) tex(v, i, i ? 'walk' : 'stand', 'open'); else warm.push(() => tex(v, i)); } };
  /** put other things on her: every drawing of her is thrown away and made again */
  fig.redress = wear => { fig.wear = wear || {}; for (const t of cache.values()) t.dispose(); cache.clear(); mat.map = null; fig.setFrame(fig.frame); fig.warmUp(false); };
  /** a point on her card (drawing units) as a place in the world */
  fig.point = ([px, py]) => mesh.localToWorld(new THREE.Vector3((px / w - .5) * W, (1 - py / h) * H, 0));
  fig.dispose = () => { for (const t of cache.values()) t.dispose(); cache.clear(); mat.map = depth.map = null; figMats.push([mat, depth]); };
  fig.warmUp(true); fig.setFrame(0);
  mesh.userData.fig = fig; figures.push(fig); return fig;
}
const fig = (name, k) => makeFigure(name, FIGS[k]);
const girl = fig('girl', ASK.get('who') === 'fenna' ? 'fenna' : 'anna');
const uni = fig('unicorn', 'baby');
for (const f of [girl, uni]) tapTarget(f.g, () => tapFigure(f), baseTaps, baseSpots);
/** things to wear by their stall ids, sorted into their slots */
const wearOf = ids => { const o = {}; for (const id of ids) for (const [slot, list] of Object.entries(WEAR)) if (list.includes(id)) o[slot] = id; return o; };
if (ASK.get('wear')) girl.redress(wearOf(ASK.get('wear').split(',')));

/* the balloon she holds is its own little card on a thread tied to her hand: it floats above her, trails a little behind when she walks and sways */
const balloon = (() => {
  const t = new THREE.CanvasTexture(cutout(BALLOON.w, BALLOON.h, drawBalloon, PAPER, 1.25)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const Hb = BALLOON.size, Wb = Hb * BALLOON.w / BALLOON.h;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Wb, Hb), new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, roughness: .85, bumpMap: paperBump, bumpScale: .6 })); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5 });
  const thread = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#6f625c' })); thread.frustumCulled = false;
  const g = new THREE.Group(); g.userData.live = true; g.add(m, thread); g.visible = false; scene.add(g);
  return { g, m, thread, pos: new THREE.Vector3(), knot: (.5 - BALLOON.knot[1] / BALLOON.h) * Hb, on: false };
})();
function stepBalloon(dt) {
  const on = girl.wear.hand === 'ballon'; balloon.g.visible = on; if (!on) { balloon.on = false; return; }
  girl.g.updateMatrixWorld(true);
  const hand = girl.point(kidPoints(girl.kid, girl.view, girl.poseOf(girl.frame), girl.frame).hand);
  // it floats out to the side her hand is on, so it never hangs in front of her face
  const want = hand.clone(); want.x += (hand.x - girl.x) * .9 + Math.sin(time * 1.3) * .06; want.y += .98 + Math.sin(time * 1.9) * .03;
  const real = v => isFinite(v.x + v.y + v.z); if (!real(want)) return;   // never let a bad frame in: the balloon eases from where it was, so one bad spot would stay for good
  if (!balloon.on || !real(balloon.pos)) { balloon.pos.copy(want); balloon.on = true; } else balloon.pos.lerp(want, Math.min(1, dt * 3.2));
  balloon.m.position.copy(balloon.pos); balloon.m.rotation.y = girl.g.rotation.y; balloon.m.rotation.z = (hand.x - balloon.pos.x) * .7;
  const knot = balloon.pos.clone(); knot.y += balloon.knot; const mid = hand.clone().lerp(knot, .5); mid.x += (hand.x - knot.x) * .25;
  const pa = balloon.thread.geometry.attributes.position; [hand, mid, knot].forEach((v, i) => pa.setXYZ(i, v.x, v.y, v.z)); pa.needsUpdate = true;   // written in place: no new buffer every frame
}

/* ---------------- paper confetti ---------------- */
const bits = [];
const bitGeo = new THREE.PlaneGeometry(.09, .09);
/** bits of paper thrown up from a spot. `float`: they hardly fall and drift off sideways (dandelion seeds) */
function confetti(x, y, z, cols, n = 10, shape = bitGeo, up = 2.2, float = false) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(shape, paper(cols[i % cols.length], { side: THREE.DoubleSide })); m.position.set(x, y, z); m.castShadow = true; scene.add(m);
    const a = Math.random() * Math.PI * 2, s = .8 + Math.random() * 1.2;
    bits.push(float ? { m, vx: .9 + Math.random() * 1.1, vz: (Math.random() - .5) * .8, vy: up * (.4 + Math.random() * .6), g: .5, spin: (Math.random() - .5) * 5, life: 2.6 + Math.random() * 1.6 } : { m, vx: Math.cos(a) * s, vz: Math.sin(a) * s * .6, vy: up + Math.random() * 1.5, spin: (Math.random() - .5) * 12, life: 1.1 + Math.random() * .5 });
  }
}
// the very first confetti would make the graphics chip build its program while she watches: draw one bit out of sight at the start
{ const m = new THREE.Mesh(bitGeo, paper('#ffffff', { side: THREE.DoubleSide })); m.castShadow = true; m.frustumCulled = false; m.position.set(0, -30, 0); scene.add(m); setTimeout(() => scene.remove(m), 2000); }
const starGeo = (() => { const s = new THREE.Shape(sunPts(.08, 5).map(([x, y]) => new THREE.Vector2(x, y))); return new THREE.ShapeGeometry(s); })();

/* ---------------- sound: a few soft synth notes ---------------- */
let ac = null;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { } } if (ac && ac.state === 'suspended') ac.resume(); if (ac && !wash && typeof startWash === 'function') setTimeout(startWash, 0); return ac; }
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
  swish(v = 2) { noise(.22, Math.min(.07, .02 * v), 1800); },
  whoosh() { noise(.5, .08, 700); tone(300, .45, 'sine', .04, 2.2); },
  boing() { tone(260, .22, 'sine', .09, 2.1); },
  thud() { tone(120, .12, 'sine', .12, .6); noise(.08, .05, 400); },
  cluck() { tone(520, .07, 'square', .05, .8); setTimeout(() => tone(640, .1, 'square', .05, .7), 110); },
  peep() { tone(1500, .08, 'sine', .06, 1.2); },
  oink() { tone(180, .16, 'sawtooth', .06, .8, 30); setTimeout(() => tone(200, .14, 'sawtooth', .05, .8, 30), 220); },
  hoot() { tone(330, .3, 'sine', .08, .95); setTimeout(() => tone(290, .45, 'sine', .08, .9), 380); },
  bark() { tone(420, .09, 'square', .06, .7); tone(210, .1, 'sawtooth', .04, .8); },
  yip() { tone(700, .12, 'triangle', .07, 1.5); },
  munch() { [0, 110, 220].forEach(d => setTimeout(() => noise(.06, .06, 1500), d)); },
  flutter() { [0, 70, 140, 210].forEach(d => setTimeout(() => noise(.05, .035, 3200), d)); },
  gust() { noise(1.6, .028, 500); tone(240, 1.4, 'sine', .01, 1.8); },
  note(f) { tone(f, 1.7, 'sine', .07); tone(f * 2, 1.1, 'sine', .018); },
  whirr() { noise(.7, .035, 2600); tone(1200, .5, 'triangle', .012, .7, 22); },
  click() { tone(900, .04, 'square', .04, .7); },
  /** somebody says hello: two soft voiced notes */
  hello() { tone(294, .26, 'triangle', .045, 1.18, 5); setTimeout(() => tone(370, .36, 'triangle', .045, .92, 5), 190); },
  /** the accordion: a few long, soft, breathing notes out of the island's own chord (never plucked: every note swells and fades) */
  squeeze() { const a = audio(); if (!a) return; const ch = CHORDS[tune.chord] || CHORDS[0], t0 = a.currentTime + .05, lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(a.destination);
    [2, 3, 1, 2, 3].forEach((n, i) => { const f = ch[n] * 2, t = t0 + i * .95, g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.04, t + .25); g.gain.setValueAtTime(.04, t + .8); g.gain.linearRampToValueAtTime(0, t + 1.4); g.connect(lp);
      for (const [type, det, v] of [['sawtooth', -6, .5], ['square', 7, .22]]) { const o = a.createOscillator(), og = a.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.45); } }); },
  chime() { [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, .5, 'sine', .06), i * 90)); },
};

/* ---------------- gusts of wind ----------------
   Now and then a gust crosses the picture from the left: a few dark curls of paper, turning as they go. Where it passes,
   the crowns of trees sway, and whatever a set says the wind does (set.wind(x, z): its toy windmills spin). Only out of
   doors, on sets with a sea round them. (Oscar's idea, 2026-11-26.) */
const gust = { g: new THREE.Group(), curls: [], t: -1, next: 9, x: 0, z: 0, n: 0 };
gust.g.userData.live = true; gust.g.visible = false; scene.add(gust.g);
{ const mat = new THREE.MeshStandardMaterial({ color: '#3f3a48', roughness: 1, side: THREE.DoubleSide });
  for (let c = 0; c < 4; c++) {   // a curl: a ribbon wound into a spiral, with a long tail behind it
    const pos = [], w = .075, turns = 1.6 + c * .2, R0 = .5 + (c % 2) * .2, N = 46;
    const at = i => { const u = i / N; if (u < .35) { const k = u / .35; return [-1.7 + k * (1.7 - R0), -R0 * .0 + Math.sin(k * 3) * .06]; } const k = (u - .35) / .65, a = -Math.PI / 2 + k * turns * 6.283, r = R0 * (1 - .78 * k); return [Math.cos(a) * r, R0 + Math.sin(a) * r]; };
    // a ribbon along the line: at every point a little to both sides of it (across the line from the point before to the point after), so the edges are smooth
    const L = [], Rr = []; for (let i = 0; i <= N; i++) { const [xa, ya] = at(Math.max(0, i - 1)), [xb, yb] = at(Math.min(N, i + 1)), [x, y] = at(i), l = Math.hypot(xb - xa, yb - ya) || 1, h = w * (.35 + .65 * Math.min(1, i / 10)) * (i > N - 6 ? (N - i + 1) / 6 : 1); L.push([x - (yb - ya) / l * h, y + (xb - xa) / l * h]); Rr.push([x + (yb - ya) / l * h, y - (xb - xa) / l * h]); }
    for (let i = 0; i < N; i++) pos.push(L[i][0], L[i][1], 0, Rr[i][0], Rr[i][1], 0, Rr[i + 1][0], Rr[i + 1][1], 0, L[i][0], L[i][1], 0, Rr[i + 1][0], Rr[i + 1][1], 0, L[i + 1][0], L[i + 1][1], 0);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.position.set(-c * 2.3 - (c % 2) * .7, 1.4 + ((c * 7) % 4) * .34, ((c * 5) % 3 - 1) * 1.1 - .6); m.scale.setScalar(.9 + (c % 3) * .2); gust.g.add(m); gust.curls.push(m);
  } }
function stepWind(dt, stepped) {
  if (!set.seaAsk) { gust.g.visible = false; gust.t = -1; return; }
  if (gust.t < 0) { gust.next -= dt; if (gust.next > 0) return; gust.t = 0; gust.n++; gust.x = camLook.x - 26; gust.z = camLook.z - 5 + Math.random() * 6; gust.next = 24 + Math.random() * 22; sfx.gust(); }
  const before = gust.x; gust.t += dt; gust.x += 8.5 * dt; gust.g.visible = true; gust.g.position.set(gust.x, 0, gust.z);
  const k = Math.min(1, gust.t / .6, Math.max(0, (6.4 - gust.t) / .8)); gust.g.scale.setScalar(Math.max(.01, k));
  if (stepped) gust.curls.forEach((m, i) => { m.rotation.z = Math.sin(tick * .5 + i) * .25; });
  for (const q of sets) { for (const t of q.trees) { const tx = t.x + q.ox; if (tx > before - 2 && tx <= gust.x - 2 && Math.abs(t.z + q.oz - gust.z) < 4.5) t.wob = Math.max(t.wob, .75); } if (q.wind) q.wind(gust.x - 2, gust.z, before - 2); }
  if (gust.t > 6.4) { gust.t = -1; gust.g.visible = false; }
}

/* ---------------- the island's own sound: one long, soft chord that slowly changes ----------------
   Not a tune: Oscar found single chiming notes distracting ("the chimes make my brain think I need to pay attention to
   something ... needs to be more continuous"). So: four soft voices holding a chord, each swelling and fading on its own
   slow breath, the chord sliding to the next every twenty seconds or so. Nothing ever starts with a click or a pluck.
   Resting on a bench or the picnic cloth it opens up a little; in the evening it is darker; indoors it is quieter. */
const tune = { v: null, out: null, lp: null, chord: 0, t: 0, rest: 0 };
const CHORDS = [[130.8, 196, 261.6, 329.6], [146.8, 220, 261.6, 349.2], [110, 164.8, 261.6, 329.6], [98, 196, 246.9, 293.7], [130.8, 196, 293.7, 392]];
function stepTune(dt) {
  if (!ac || ac.state !== 'running') return;
  if (!tune.v) {
    tune.lp = ac.createBiquadFilter(); tune.lp.type = 'lowpass'; tune.lp.frequency.value = 700; tune.out = ac.createGain(); tune.out.gain.value = 0; tune.lp.connect(tune.out); tune.out.connect(ac.destination);
    tune.v = CHORDS[0].map((f, i) => { const g = ac.createGain(); g.gain.value = 0; g.connect(tune.lp); const os = [0, 4].map((cents, k) => { const o = ac.createOscillator(); o.type = k ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = cents; const og = ac.createGain(); og.gain.value = k ? .25 : 1; o.connect(og); og.connect(g); o.start(); return o; }); return { g, os, rate: .11 + i * .037, ph: i * 1.7 }; });
  }
  const now = ac.currentTime, resting = playing && playing.rest ? 1 : 0, indoors = set.seaAsk ? 0 : 1; tune.rest += (resting - tune.rest) * Math.min(1, dt * .8);
  // the chord slides over to the next, slowly
  tune.t -= dt; if (tune.t <= 0) { tune.t = 18 + Math.random() * 8; tune.chord = (tune.chord + 1 + Math.floor(Math.random() * 2)) % CHORDS.length; tune.v.forEach((v, i) => v.os.forEach(o => o.frequency.setTargetAtTime(CHORDS[tune.chord][i], now, 3.5))); }
  // each voice on its own slow breath
  tune.v.forEach(v => v.g.gain.setTargetAtTime(.5 + .5 * Math.sin(time * v.rate + v.ph), now, .8));
  tune.out.gain.setTargetAtTime((.022 + .008 * tune.rest) * (indoors ? .55 : 1), now, 1.2); tune.lp.frequency.setTargetAtTime((eve > .5 ? 480 : 720) + 380 * tune.rest, now, 1.5);
}

/* the water: a soft wash of waves that grows as she comes near the sea or the pond, and is gone indoors */
let wash = null, washT = 0;
function startWash() {
  const a = audio(); if (!a || wash) return;
  const len = a.sampleRate * 4, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0); let v = 0;
  for (let i = 0; i < len; i++) { v = (v + .03 * (Math.random() * 2 - 1)) / 1.03; d[i] = v * 6; }   // brown noise: the low rush of water
  for (let i = 0; i < 2000; i++) { const k = i / 2000; d[i] *= k; d[len - 1 - i] *= k; }             // so the loop has no click
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650;
  const swell = a.createGain(); swell.gain.value = .6; const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = .14; lg.gain.value = .4; lfo.connect(lg); lg.connect(swell.gain); lfo.start();   // waves come and go
  const g = a.createGain(); g.gain.value = 0; src.connect(lp); lp.connect(swell); swell.connect(g); g.connect(a.destination); src.start(); wash = { g, lp, near: 0 };
}
function stepWater(dt) {
  if (!wash) return; washT -= dt; if (washT > 0) return; washT = .25;
  // how near water is: looking round her at three distances for places with no floor (the sea, the pond)
  let n = 0; if (set.seaAsk) for (const r of [1.3, 2.6, 4]) for (let a = 0; a < 8; a++) if (heightAt(girl.x + Math.cos(a * .785) * r, girl.z + Math.sin(a * .785) * r) === null) n += r < 2 ? 2 : r < 3 ? 1.2 : .7;
  const low = (heightAt(girl.x, girl.z) ?? 0) < -.05;   // only down on the sand, or on planks over the water: up on the grass the waves are out of earshot (Oscar's wish)
  wash.near = low ? Math.min(1, n / 9) : 0; wash.g.gain.setTargetAtTime(wash.near * .06, ac.currentTime, .8); wash.lp.frequency.setTargetAtTime(500 + wash.near * 500, ac.currentTime, .5);
}

/* ---------------- what figures do when tapped (always the same) ---------------- */
/* Her hands: she carries one thing at a time. Whatever she takes says so (and how to put itself down); taking the next
   thing puts the first one down. A flower is the gentle one: with her hands full it goes straight into her hair. */
let inHand = null;
const hands = {
  take(who, drop) { if (inHand && inHand.who !== who) { const d = inHand.drop; inHand = null; d(); } inHand = { who, drop }; },
  free(who) { if (inHand && inHand.who === who) inHand = null; },
  busy(who) { return !!inHand && inHand.who !== who; },
};
const offers = [];   // what she is holding that can be given: each is asked when somebody else is tapped, and says true if it was given
function tapFigure(f) {
  if (f !== girl && offers.some(o => o(f))) return;
  if (f === uni) { uni.hopV = 3; sfx.neigh(); confetti(uni.x, .9, uni.z, ['#f2a7c0', '#b9a3e8', '#9fd8d0', '#eac15a'], 12, starGeo, 2.4); }
  else if (f === girl) { girl.hopV = 3.2; sfx.hop(); }
  else if (f.onTap) f.onTap();
}

/* ---------------- toys: something that takes her over for a while (toys.js) ---------------- */
let playing = null, playAct = false;
function play(toy) { playing = toy; target = null; playAct = false; }
function stopPlay() { playing = null; girl.lift = 0; girl.lean = 0; girl.poseName = null; target = null; uni.busy = false; uni.lift = 0; uni.lean = 0; }
/** send her to a spot and do something when she is there (or as near as she can get, if that is within `near`) */
function walkThen(x, z, then, near = .3) { if (Math.hypot(girl.x - x, girl.z - z) < .2) { then(); return; } target = goTo(x, z, { then, near }); }

/* ---------------- finding her way: a tap is a place to go, and she walks round what stands between ----------------
   If the straight line is free she takes it. If not, a flood over the floor in small steps from where she stands finds the
   way round (only as far as a few steps beyond the goal: a tap is rarely far), and the corners are cut where she can see
   past them. A finger held down steers her directly instead: no way-finding there. */
const pathStat = { n: 0, ms: 0 };
/** can she walk the straight line from a to b? */
function clearWay(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / .12)); let h = heightAt(ax, az); if (h === null) return false;
  for (let i = 1; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (!free(x, z, h)) return false; h = heightAt(x, z); }
  return true;
}
/** the corners to walk through to get from her to (gx, gz), or as near to it as she can get */
function wayTo(gx, gz) {
  if (clearWay(girl.x, girl.z, gx, gz)) return [];
  const t0 = performance.now(), step = .25, x0 = girl.x, z0 = girl.z, R = Math.min(34, Math.ceil((Math.hypot(gx - x0, gz - z0) + 3) / step));
  const key = (i, j) => (i + 64) * 256 + j + 64, from = new Map([[key(0, 0), null]]), hs = new Map([[key(0, 0), heightAt(x0, z0) ?? 0]]), q = [[0, 0]];
  let best = [0, 0], bd = Math.hypot(gx - x0, gz - z0);
  for (let n = 0; n < q.length && n < 1600 && bd > step * .75; n++) {
    const [i, j] = q[n], h = hs.get(key(i, j));
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = i + di, b = j + dj, k = key(a, b); if (from.has(k) || Math.abs(a) > R || Math.abs(b) > R) continue;
      const x = x0 + a * step, z = z0 + b * step; if (!free(x, z, h)) continue;
      from.set(k, [i, j]); hs.set(k, heightAt(x, z)); q.push([a, b]);
      const d = Math.hypot(gx - x, gz - z); if (d < bd) { bd = d; best = [a, b]; }
    }
  }
  const pts = []; for (let c = best; c; c = from.get(key(c[0], c[1]))) pts.push([x0 + c[0] * step, z0 + c[1] * step]); pts.reverse();
  if (bd < step && clearWay(pts[pts.length - 1][0], pts[pts.length - 1][1], gx, gz)) pts.push([gx, gz]);
  // cut the corners: from each point on, go straight to the furthest one she can walk to in a line
  const out = []; let at = 0;
  while (at < pts.length - 1) { let next = at + 1; for (let k = pts.length - 1; k > at + 1; k--) if (clearWay(pts[at][0], pts[at][1], pts[k][0], pts[k][1])) { next = k; break; } out.push(pts[next]); at = next; }
  pathStat.n++; pathStat.ms = performance.now() - t0;
  return out;
}
/** a place to go, with the way to it */
function goTo(x, z, more = {}) { const way = wayTo(x, z), end = way.length ? way[way.length - 1] : [x, z]; return { x: end[0], z: end[1], gx: x, gz: z, way, again: 4, ...more }; }
const herOnScreen = () => { const v = new THREE.Vector3(girl.x, girl.y + (girl.lift || 0) + .5, girl.z).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };

/* ---------------- doors: a cut from one set to another ----------------
   The picture dips to dark for a moment, as when you step through a doorway, and she stands at the other door. Nothing is
   built: both sides exist already. She has to step out of a door's zone before it takes her again. */
let doorArmed = true, through = null, push = [0, 0];
const fadeEl = document.body.appendChild(document.createElement('div'));
fadeEl.style.cssText = 'position:fixed;inset:0;background:#2c2226;opacity:0;pointer-events:none;z-index:4;transition:opacity .13s linear';
function goThrough(d) { const twin = sets.flatMap(q => q.doors).find(q => q.name === d.name && q !== d); if (!twin || through) return; through = { twin, t: 0, done: false }; fadeEl.style.opacity = 1; sfx.door(1); }
function stepDoors(dt) {
  if (through) {
    through.t += dt;
    if (!through.done && through.t >= .15) {
      const { stand, dir } = through.twin; through.done = true; fadeEl.style.opacity = 0; doorArmed = false;
      girl.x = stand[0]; girl.z = stand[1]; girl.y = heightAt(girl.x, girl.z) ?? 0; girl.dirX = -dir[0]; girl.dirZ = -dir[1]; girl.view = viewFor(girl);
      [uni.x, uni.z] = [[.9, .1], [-.9, .1], [0, 0]].map(([dx, dz]) => [girl.x + dx, girl.z + dz]).find(([x, z]) => heightAt(x, z) !== null && free(x, z, girl.y, uni)) || stand; uni.y = girl.y;
      for (const f of figures) if (f.follows) { [f.x, f.z] = [[-.9, .35], [.9, .35], [0, .5], [0, 0]].map(([dx, dz]) => [girl.x + dx, girl.z + dz]).find(([x, z]) => heightAt(x, z) !== null && free(x, z, girl.y, f)); f.y = girl.y; }   // whoever comes along with her comes through too
      target = null; hold = null; balloon.on = false; camCut = true;
    }
    if (through.t >= .32) through = null;
    return;
  }
  const here = sets.flatMap(q => q.doors).find(d => inZone(d, girl.x, girl.z));
  if (!here) { doorArmed = true; return; }
  if (doorArmed && !playing && push[0] * here.dir[0] + push[1] * here.dir[1] > .5) goThrough(here);   // only when she walks into it, not past it
}

/* ---------------- where she can stand ---------------- */
/** how high the floor is at a spot, or null where there is none. In each set the first floor that holds the spot counts (a
 *  floor of height null is a hole: the pond); where two sets overlap (a bridge's end under the next shore) the higher one */
function floorAt(x, z) {
  let best = null;
  for (const s of sets) if (x > s.box[0] && x < s.box[2] && z > s.box[1] && z < s.box[3]) for (const f of s.floors) if (f.box ? x > f.box[0] && x < f.box[2] && z > f.box[1] && z < f.box[3] : inPoly(f.pts, x, z) && (!f.inset || edgeDist(f.pts, x, z) > f.inset)) { if (f.h !== null && (!best || f.h > best.h)) best = { h: f.h, set: s }; break; }
  return best;
}
const heightAt = (x, z) => { const f = floorAt(x, z); return f ? f.h : null; };
function free(x, z, fromH, me = girl) {
  const h = heightAt(x, z); if (h === null || Math.abs(h - fromH) > .34) return false;
  for (const s of sets) {
    if (x < s.box[0] || x > s.box[2] || z < s.box[1] || z > s.box[3]) continue;
    for (const o of s.solids) if (o.fig !== me && Math.hypot(x - o.x, z - o.z) < o.r + .18) return false;
    for (const [cx, cz, hx, hz] of s.walls) if (Math.abs(x - cx) < hx && Math.abs(z - cz) < hz) return false;
  }
  return true;
}
function move(f, dx, dz) {
  const x0 = f.x, z0 = f.z, ok = tryMove(f, dx, dz);
  if (ok) { const mx = f.x - x0, mz = f.z - z0, l = Math.hypot(mx, mz) || 1, k = .25; f.dirX += (mx / l - f.dirX) * k; f.dirZ += (mz / l - f.dirZ) * k; }
  return ok;
}
function tryMove(f, dx, dz) {
  const fromH = heightAt(f.x, f.z) ?? 0;
  if (free(f.x + dx, f.z + dz, fromH, f)) { f.x += dx; f.z += dz; return true; }
  if (Math.abs(dx) > 1e-4 && free(f.x + dx, f.z, fromH, f)) { f.x += dx; return true; }
  if (Math.abs(dz) > 1e-4 && free(f.x, f.z + dz, fromH, f)) { f.z += dz; return true; }
  return false;
}
/** walking mostly towards the camera shows her front, mostly away her back, else her side (with a margin so it never flickers) */
function viewFor(f) {
  if (!f.views.front) return 'side';
  const [dx, dz] = toScreen(f.dirX, f.dirZ), ax = Math.abs(dx), az = Math.abs(dz);
  if (az > ax * 1.5) return dz > 0 ? 'front' : 'back';
  if (ax > az * 1.1) return 'side';
  return f.view;
}

/* ---------------- input: tap to walk, hold to steer, arrows/WASD ---------------- */
const keys = new Set();
addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); audio(); if (playing && !e.repeat && [' ', 'enter', 's', 'arrowdown'].includes(e.key.toLowerCase())) playAct = true; });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let target = null, hold = null;
function pickAt(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...baseTaps, ...sets.flatMap(s => s.taps), ...sets.flatMap(s => s.ground), ...seaRows.map(r => r.m)], false);
  // a figure is a rectangle of card with a cutout on it: only the cutout (and a finger's width round it) takes the tap
  return hits.find(h => !h.object.userData.fig || solidAt(h.object.userData.fig, h.uv)) || null;
}
/** a finger that hit nothing: was it within a finger's width of something that answers a tap? Measured on the screen, so a
 *  thing that is small because the camera stands far back is as easy to hit as a big one (everything is at least 48 points across) */
function nearTap(cx, cy, reach = 24) {
  const r = canvas.getBoundingClientRect(), v = new THREE.Vector3(); let best = null, bd = reach;
  for (const s of [...baseSpots, ...sets.flatMap(q => q.tapSpots)]) {
    const f = s.obj.children[0]?.children[0]?.userData.fig;
    if (f) v.set(f.x, f.y + f.H * .45, f.z); else v.copy(s.c || (s.c = new THREE.Box3().setFromObject(s.obj).getCenter(new THREE.Vector3())));
    v.project(camera); if (v.z > 1) continue;
    const d = Math.hypot(r.left + (v.x + 1) / 2 * r.width - cx, r.top + (1 - v.y) / 2 * r.height - cy); if (d < bd) { bd = d; best = s; }
  }
  return best;
}
const alphaCache = new WeakMap();
function solidAt(fig, uv) {
  const cv = fig.mat.map.image; let d = alphaCache.get(cv);
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
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -girl.y), new THREE.Vector3());   // nothing when the finger is on the sky
}
canvas.addEventListener('pointerdown', e => {
  audio(); canvas.setPointerCapture(e.pointerId);
  if (playing) {   // while she plays the finger belongs to the toy: on her it lets go, beside her it pushes that way
    const [hx, hy] = herOnScreen(); if (Math.hypot(e.clientX - hx, e.clientY - hy) < 34) playAct = true; else hold = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), since: time };
    return;
  }
  const hit = pickAt(e.clientX, e.clientY);
  if (hit && hit.object.userData.tap) { hit.object.userData.tap(hit); return; }   // (the hit goes along: a field of flowers is one piece and has to know which flower)
  const near = nearTap(e.clientX, e.clientY); if (near) { near.fn(); return; }
  if (hit) target = goTo(hit.point.x, hit.point.z);
  else { const p = groundPoint(e.clientX, e.clientY); if (p) target = goTo(p.x, p.z); }
  hold = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointermove', e => { if (hold && hold.id === e.pointerId) { hold.x = e.clientX; hold.y = e.clientY; } });
const endHold = e => { if (hold && hold.id === e.pointerId) { if (playing) { hold.up = time; return; } if (performance.now() - hold.t > 220) target = null; hold = null; } };
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
  uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2() }, near: { value: camera.near }, far: { value: camera.far }, focus: { value: 14 }, dof: { value: 8 }, range: { value: 1 }, seed: { value: 0 }, eve: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  defines: { TAPS: DOF ? 24 : 1 },
  fragmentShader: `
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near, far, focus, dof, range, seed, eve; varying vec2 vUv;
    float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    vec3 srgb(vec3 c){ c=max(c,0.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(vec3(.0031308),c)); }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+seed)*43758.5453); }
    float cocAt(vec2 uv){ float d=lin(texture2D(tDepth,uv).r); float df=(d-focus)/range; return df>0. ? clamp((df-1.2)/7.,0.,1.) : clamp((-df-1.)/3.5,0.,1.); }
    void main(){
      float coc=cocAt(vUv);
      float r=coc*dof; vec3 acc=vec3(0.); float wsum=0.; vec3 bl=vec3(0.);
      for(int i=0;i<TAPS;i++){ float fi=float(i); float a=fi*2.39996; float rr=sqrt((fi+.5)/24.);
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

let camDist = 15, camH = 6.2, portrait = false, dofBase = 9, camCut = true;
function resize() {
  const w = innerWidth, h = innerHeight; if (!w || !h) return;   // a window with no size yet (a page opened in the background): wait for the real size, or the camera ends up nowhere
  DPR = dprFor(w, h); renderer.setPixelRatio(DPR); renderer.setSize(w, h, false);
  const a = w / h; camera.aspect = a; portrait = a < 1;
  camera.fov = portrait ? 34 : 24; camera.updateProjectionMatrix();
  const pw = Math.floor(w * DPR), ph = Math.floor(h * DPR);
  if (rt) rt.dispose();
  rt = new THREE.WebGLRenderTarget(pw, ph, { type: halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: 4, depthTexture: new THREE.DepthTexture(pw, ph) });
  rt.depthTexture.type = THREE.UnsignedIntType;
  rt.texture.generateMipmaps = true; rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  post.uniforms.tColor.value = rt.texture; post.uniforms.tDepth.value = rt.depthTexture; post.uniforms.res.value.set(pw, ph); dofBase = (portrait ? 6 : 9) * DPR * Math.min(1.4, w / 1100 + .4);
}
addEventListener('resize', resize); resize();

/* ---------------- bake: everything that never moves is glued together, one mesh per kind of paper ----------------
   A diorama is hundreds of little pieces of card, and a phone pays for every piece it draws separately. So once the set is
   built, the pieces that stand still (everything outside a group marked userData.live: trees that sway, the door, the sea
   rows, things on threads, figures) are copied into one mesh per kind of paper, each piece's colour kept in its corners.
   The pieces themselves stay where they are, hidden: a tap still finds them (a hidden mesh still answers a ray), and nothing
   else has to know. A thing that moves as a whole (a tree's crown, a cloud on its thread) is glued the same way inside its
   own group: bake(group) on a live group glues what is in it. */
const baked = { ms: 0, pieces: 0, meshes: 0 };
function bake(root) {
  if (!BAKE) return null;
  const t0 = performance.now(), lots = new Map(), v = new THREE.Vector3(), nm = new THREE.Matrix3(), rel = new THREE.Matrix4();
  root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert();   // glued in the root's own space, so a root that moves takes its glued pieces along
  const walk = o => {
    if (o.userData.live || !o.visible) return;
    if (o.isMesh && o.geometry.attributes.normal && o.geometry.attributes.uv) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.every(m => m.isMeshStandardMaterial)) {
        const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv;
        const groups = Array.isArray(o.material) && geo.groups.length ? geo.groups : [{ start: 0, count: P.count, materialIndex: 0 }];
        rel.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(rel);
        for (const gr of groups) {
          const m0 = mats[gr.materialIndex] || mats[0], sheet = sheetOf(m0), m = sheet || m0, key = m.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
          let lot = lots.get(key); if (!lot) lots.set(key, lot = { m, cast: o.castShadow, recv: o.receiveShadow, p: [], n: [], u: [], c: sheet ? [] : null });
          for (let i = gr.start, e = Math.min(P.count, gr.start + gr.count); i < e; i++) {
            v.fromBufferAttribute(P, i).applyMatrix4(rel); lot.p.push(v.x, v.y, v.z);
            v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); lot.n.push(v.x, v.y, v.z);
            lot.u.push(U.getX(i), U.getY(i)); if (lot.c) lot.c.push(m0.color.r, m0.color.g, m0.color.b);
          }
        }
        if (geo !== o.geometry) geo.dispose();
        o.visible = false; baked.pieces++;
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of root.children) walk(c);
  const out = new THREE.Group(); out.userData.live = true; out.name = 'baked';
  for (const lot of lots.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lot.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(lot.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(lot.u, 2));
    if (lot.c) g.setAttribute('color', new THREE.Float32BufferAttribute(lot.c, 3));
    const m = new THREE.Mesh(g, lot.m); m.castShadow = lot.cast; m.receiveShadow = lot.recv; out.add(m); baked.meshes++;
  }
  root.add(out); baked.ms = performance.now() - t0; return out;
}
/** the sea rows rock, each its own way, so they cannot be glued like the rest. Instead all rows become one mesh in which
 *  every corner remembers its colour and which row it belongs to (aK), and the graphics chip does the rocking from the clock (uTick) */
const seaTick = { value: 0 }, seaMats = new Map();
function bakeSea(rows, root) {
  const lots = new Map(), v = new THREE.Vector3(); root.updateMatrixWorld(true);
  for (const r of rows) {
    const o = r.m, P = o.geometry.attributes.position, N = o.geometry.attributes.normal, U = o.geometry.attributes.uv;
    for (const gr of o.geometry.groups) {
      const m0 = o.material[gr.materialIndex], m = sheetOf(m0); let lot = null;
      for (let i = gr.start, e = Math.min(P.count, gr.start + gr.count); i < e; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld);
        if ((i - gr.start) % 3 === 0) { const key = m.uuid + '|' + Math.floor(v.x / 44) + '|' + Math.floor(r.z / 22); lot = lots.get(key); if (!lot) lots.set(key, lot = { m, p: [], n: [], u: [], k: [], c: [] }); }   // every triangle goes to the piece of sea its first corner lies in
        lot.p.push(v.x - (o.position.x - r.base), v.y, v.z);   // glued at rest; the rocking is added again on the chip
        lot.n.push(N.getX(i), N.getY(i), N.getZ(i)); lot.u.push(U.getX(i), U.getY(i)); lot.k.push(r.k); lot.c.push(m0.color.r, m0.color.g, m0.color.b);
      }
    }
    o.visible = false;
  }
  const out = new THREE.Group(); out.userData.live = true; out.name = 'sea';
  for (const lot of lots.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lot.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(lot.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(lot.u, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(lot.k, 1)); g.setAttribute('color', new THREE.Float32BufferAttribute(lot.c, 3));
    let mat = seaMats.get(lot.m.uuid);   // made once and kept: every set has a sea
    if (!mat) { seaMats.set(lot.m.uuid, mat = lot.m.clone());
      mat.onBeforeCompile = sh => { sh.uniforms.uTick = seaTick; sh.vertexShader = 'attribute float aK; uniform float uTick;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += sin(uTick * .05 + aK * 1.7) * .12;'); };
      mat.customProgramCacheKey = () => 'sea'; }
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; out.add(m);
    g.computeBoundingBox(); seaChunks.push({ m, box: g.boundingBox.clone().expandByScalar(.6) });
  }
  root.add(out); return out;
}
bake(theatre); for (const g of hungs) bake(g);
loadWorld(SETS[ASK.get('set')] ? ASK.get('set') : 'eiland');

/* ---------------- the readout (?fps): how smoothly it runs here and how big she is on this screen ---------------- */
const stat = { fps: 0, worst: 0, her: 0, calls: 0, tris: 0, n: 0, t0: 0, prev: 0, slow: 0, slows: [] };
const statEl = ASK.has('fps') ? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'stat' })) : null;
if (statEl) statEl.style.cssText = 'position:fixed;left:calc(env(safe-area-inset-left) + 10px);bottom:calc(env(safe-area-inset-bottom) + 10px);padding:8px 12px;border-radius:10px;background:#f3ead8;color:#4a3b30;font:600 14px/1.45 ui-rounded,system-ui,sans-serif;box-shadow:0 2px 0 #b9a888;white-space:pre;pointer-events:none';
function measure(now) {
  if (stat.prev) stat.slow = Math.max(stat.slow, now - stat.prev); stat.prev = now; stat.n++;
  if (!stat.t0) stat.t0 = now;
  if (now - stat.t0 < 1000) return;
  stat.fps = stat.n * 1000 / (now - stat.t0); if ((stat.seen = (stat.seen || 0) + 1) > 2) stat.slows.push(stat.slow); if (stat.slows.length > 5) stat.slows.shift();   // the first two seconds are loading, not play
  stat.worst = stat.slows.length ? 1000 / Math.max(...stat.slows) : stat.fps;   // the slowest single frame of the last five seconds, as frames a second
  stat.n = 0; stat.t0 = now; stat.slow = 0; stat.calls = renderer.info.render.calls; stat.tris = renderer.info.render.triangles;
  // her height on the screen in points: from her feet to the top of her head
  const feet = new THREE.Vector3(girl.x, girl.y, girl.z).project(camera), top = new THREE.Vector3(girl.x, girl.y + (1 - kidPoints(girl.kid, 'front').top[1] / girl.h) * girl.H, girl.z).project(camera);
  stat.her = Math.abs(top.y - feet.y) / 2 * innerHeight;
  if (statEl) statEl.textContent = `${stat.fps.toFixed(0)} frames a second (slowest ${stat.worst.toFixed(0)})\nshe is ${stat.her.toFixed(0)} points tall (${shot.name}, ${set.name})\n${stat.calls} draws, ${(stat.tris / 1000).toFixed(0)}k triangles, built in ${world.ms.toFixed(0)} ms\n${innerWidth}×${innerHeight} at ×${+DPR.toFixed(2)}${SHADOWS ? '' : ', no shadows'}${DOF ? '' : ', no soft focus'}${POST ? '' : ', no lens'}${BAKE ? '' : ', nothing glued'}`;
}

/* ---------------- the loop ---------------- */
const camLook = new THREE.Vector3(0, 0, .5), camPos = new THREE.Vector3(); let tracking = null;
const UP = new THREE.Vector3(0, 1, 0), sunDir = new THREE.Vector3(), sunRight = new THREE.Vector3(), sunUp = new THREE.Vector3();
let last = performance.now(), tick = 0, acc = 0, time = 0, wacc = 0, still = false;   // still: the clock of the stop motion stands (for comparing screenshots)
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
  acc += dt; let stepped = false; while (acc >= STEP) { acc -= STEP; if (!still) tick++; stepped = true; }
  wacc += dt; let wsteps = 0; while (wacc >= WSTEP) { wacc -= WSTEP; wsteps++; }

  // her input
  let ix = 0, iz = 0;
  if (keys.has('arrowleft') || keys.has('a')) ix -= 1; if (keys.has('arrowright') || keys.has('d')) ix += 1;
  if (keys.has('arrowup') || keys.has('w')) iz -= 1; if (keys.has('arrowdown') || keys.has('s')) iz += 1;
  if (ix || iz) { target = null; [ix, iz] = toFloor(ix, iz); }   // the stick: left is left on the screen, up is away from the camera, whatever the shot
  if (hold && performance.now() - hold.t > 220) { const p = groundPoint(hold.x, hold.y); if (p) target = { x: p.x, z: p.z }; }
  if (playing) {
    let px = 0; if (keys.has('arrowleft') || keys.has('a')) px -= 1; if (keys.has('arrowright') || keys.has('d')) px += 1;
    if (hold) { const [hx] = herOnScreen(); if (Math.abs(hold.x - hx) > 14) px = Math.sign(hold.x - hx); if (hold.up !== undefined && time - Math.max(hold.up, hold.since + .28) > 0) hold = null; }   // a quick tap still pushes for a moment
    const act = playAct; playAct = false; playing.step(dt, { x: px, act }); ix = iz = 0; target = null;
  }
  if (target && !ix && !iz) {
    while (target.way && target.way.length > 1 && Math.hypot(target.way[0][0] - girl.x, target.way[0][1] - girl.z) < .12) target.way.shift();   // a corner reached: on to the next
    const [tx, tz] = target.way && target.way.length > 1 ? target.way[0] : [target.x, target.z], dx = tx - girl.x, dz = tz - girl.z, d = Math.hypot(dx, dz);
    if (d < .08) {
      // there. If that was only as near as the first look could find (a far tap), look again from here
      if (target.again && Math.hypot(target.gx - girl.x, target.gz - girl.z) > .3) { const more = goTo(target.gx, target.gz, { then: target.then, near: target.near }); more.again = target.again - 1; target = Math.hypot(more.x - girl.x, more.z - girl.z) > .3 ? more : { ...target, again: 0 }; }
      else { const q = target; target = null; if (q.then && Math.hypot((q.gx ?? q.x) - girl.x, (q.gz ?? q.z) - girl.z) < Math.max(.3, q.near || 0)) q.then(); }
    } else { ix = dx / d; iz = dz / d; }
  }
  // never stuck: if she ever stands where she could not walk (a toy let her off inside a tree), she steps to the nearest spot where she can
  if (!playing) { const h = heightAt(girl.x, girl.z); if (h === null || !free(girl.x, girl.z, h)) search: for (let r = .2; r < 4; r += .2) for (let a = 0; a < 12; a++) { const x = girl.x + Math.cos(a * .5236) * r, z = girl.z + Math.sin(a * .5236) * r, hh = heightAt(x, z); if (hh !== null && free(x, z, hh)) { girl.x = x; girl.z = z; break search; } } }
  const speed = 2.3, il = Math.hypot(ix, iz); push = il ? [ix / il, iz / il] : [0, 0]; stepDoors(dt); stepWater(dt); stepWind(dt, stepped); stepTune(dt);
  girl.walking = false;
  if (il > 0) {
    const mx = ix / il * speed * dt, mz = iz / il * speed * dt;
    if (move(girl, mx, mz)) girl.walking = true; else if (target && !hold) { const q = target; target = null; if (q.then && Math.hypot(q.x - girl.x, q.z - girl.z) < q.near) q.then(); }
    { const [sx] = toScreen(ix, iz); if (Math.abs(sx) > .2 * il) girl.face = Math.sign(sx); }
  }
  // the unicorn walks after her
  {
    const dx = girl.x - uni.x, dz = girl.z - uni.z, d = Math.hypot(dx, dz);
    uni.walking = false;
    if (uni.busy) { /* a toy has the unicorn (the seesaw): it stays where the toy puts it */ }
    else if (d > 1.35) { const s = Math.min(3.2, (d - 1.1) * 3) * dt; if (move(uni, dx / d * s, dz / d * s)) uni.walking = true; else if (d > 4) { const cands = [[girl.x - girl.face * .9, girl.z + .3], [girl.x, girl.z - .9], [girl.x, girl.z + .9], [girl.x, girl.z]]; const [cx, cz] = cands.find(([x, z]) => heightAt(x, z) !== null); uni.x = cx; uni.z = cz; } if (Math.abs(dx) > .3) uni.face = Math.sign(dx); }
  }

  // figures: smooth positions, poses that step like stop motion
  for (const f of figures) {
    const ground = f.floatY ?? heightAt(f.x, f.z) ?? f.y;
    f.y += (ground - f.y) * Math.min(1, dt * 14);
    if (f.hopV || f.hop > 0) { f.hop += f.hopV * dt; f.hopV -= 14 * dt; if (f.hop <= 0) { f.hop = 0; f.hopV = 0; } }
    if (f.dive > 0) f.dive = Math.max(0, f.dive - dt);
    const cyc = f.cyc;
    if (cyc && f.walking) f.phase = ((f.phase || 0) + wsteps) % WALK;
    if (stepped || (cyc && f.walking && wsteps)) {
      if (cyc) {
        // walking: the next of twelve drawings, a little bounce on each step, a gentle sway
        const ph = f.phase || 0, sw = Math.sin(ph / WALK * Math.PI * 2);
        if (f.walking) { f.view = viewFor(f); if (f.poseName === 'sit') f.poseName = null; }
        if (f.kid) {   // a sister blinks now and then while she stands (eyes shut for two stop-motion ticks)
          if (tick >= (f.blinkAt || 0) + 2) f.blinkAt = tick + 36 + Math.floor(Math.random() * 36);
          f.eyes = f.asleep || (!still && !f.walking && tick >= f.blinkAt) ? 'shut' : 'open';
        }
        f.setFrame(f.walking ? 1 + ph : 0, f.view);
        f.sitY = f.kid && f.poseName === 'sit' ? (1 - (kidPoints(f.kid, 'side', 'sit').seat[1] + 4) / f.h) * f.H : 0;   // sitting, she sits on the ground
        f.bob = f.walking ? (1 - Math.abs(sw)) * .045 : 0;
        f.tilt = f.walking ? sw * .03 : 0;
        if (!f.walking) f.phase = 0;
      } else { f.bob = 0; f.tilt = 0; }
      if (f.act) f.act(tick);   // what only this one does (the duck bobs and dives)
      // pose = position snapped to the frame, so even a hop moves in little steps
      f.pose.position.y = f.bob + Math.round(f.hop * 24) / 24 - (f.sink || 0) - (f.sitY || 0);
      f.pose.rotation.z = f.tilt * f.face;
      f.mesh.scale.x = f.view === 'side' ? f.face : 1;
    }
    f.g.position.set(f.x, f.y + (f.lift || 0), f.z); f.g.rotation.z = f.lean || 0;   // a toy lifts her and leans her, smoothly, about the point she sits or stands on
    f.g.rotation.y = Math.atan2(camera.position.x - f.x, camera.position.z - f.z) * .85;
  }
  stepBalloon(dt);
  for (let n = 0; n < 2 && warm.length; n++) warm.shift()();   // drawings made ahead, a few per frame
  // trees wobble when tapped, in steps
  if (stepped) {
    // a tree that stands between the camera and her folds down flat to the side, like a page of a pop-up book, and stands
    // up again when she has passed. Only on a set that asks for it (`fold: true`): Oscar, 2026-11-26, liked it but found it odd
    // in the open village, where nobody is lost behind a tree; it is kept for places that hide something. (And only on the set
    // she stands on: the others' trees are glued)
    const cx = camera.position.x, cz = camera.position.z, D = Math.hypot(girl.x - cx, girl.z - cz) || 1, ux = (girl.x - cx) / D, uz = (girl.z - cz) / D, reach = 2.6 / Math.max(.15, camH / camDist);
    for (const q of sets) for (const t of q.trees) {
      const tx = t.x + q.ox - cx, tz = t.z + q.oz - cz, along = tx * ux + tz * uz, side = tx * uz - tz * ux;
      const inWay = q === set && q.fold && !still && along < D - .35 && along > D - reach && Math.abs(side) < 1.05;
      if (inWay && !t.fold) t.lay = side >= 0 ? 1 : -1;   // it falls away from her line of sight, to whichever side it stands on
      t.fold = (t.fold || 0) + ((inWay ? 1 : 0) - (t.fold || 0)) * .4; if (t.fold < .01) t.fold = 0;
      if (t.wob > .01) { t.wob *= .82; t.sway.rotation.z = Math.sin(tick * 1.9) * .09 * t.wob; t.sway.rotation.x = Math.cos(tick * 1.5) * .04 * t.wob; } else t.sway.rotation.set(0, 0, 0);
      if (t.fold) { t.sway.rotation.z += t.fold * 1.5 * (t.lay || 1) * (uz < 0 ? 1 : -1); }
    }
  }
  // confetti (its paper is shared with everything else: never thrown away)
  for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.vy -= (b.g ?? 7) * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt; b.m.rotation.x += b.spin * dt; b.m.rotation.y += b.spin * .7 * dt; b.life -= dt; if (b.life < .3) b.m.scale.setScalar(Math.max(.01, b.life / .3)); if (b.life <= 0) { scene.remove(b.m); bits.splice(i, 1); } }
  // the sea rows rock gently, each its own way
  if (stepped) { if (seaBaked) seaTick.value = tick; else for (const r of seaRows) r.m.position.x = r.base + Math.sin(tick * .05 + r.k * 1.7) * .12; }

  // day and evening: the sun is pulled up out of view and the moon let down on its thread
  eve += (eveTarget - eve) * Math.min(1, dt * 1.6);
  skyMat.uniforms.eve.value = eve; post.uniforms.eve.value = eve;
  key.color.copy(C('#ffdcae', '#a9b8ea', eve)); key.intensity = lerp(3.1, 1.0, eve);
  hemi.color.copy(C('#cfe6e4', '#6a6fa0', eve)); hemi.groundColor.copy(C('#8a6f58', '#4a3848', eve)); hemi.intensity = lerp(.85, 1.05, eve);
  fill.intensity = lerp(.45, .25, eve);
  scene.fog.color.copy(C('#efd2b4', '#5a5478', eve));
  sun.position.y = lerp(4.6, 24, eve); moon.position.y = lerp(22, 4.8, eve);
  for (const s of stars.children) s.position.y = lerp(28, 3.5 + (s.id % 5) * .7, eve);
  { const here = floorAt(girl.x, girl.z); if (here && here.set !== set && !pinned) standOn(here.set); }   // which set she stands on
  for (const q of sets) if (q.step) q.step({ dt, tick, stepped, eve, time });   // each set's own doors, lamps and animals
  // the two real lights go to the two lit lamps nearest her
  { const lit = sets.flatMap(q => q.lamps.filter(Boolean).map(d => ({ d, q }))).filter(o => o.d.intensity > .001).map(o => ({ ...o, far: Math.hypot(o.d.position.x + o.q.ox - girl.x, o.d.position.z + o.q.oz - girl.z) })).sort((a, b) => a.far - b.far);
    lamps.forEach((l, i) => { const o = lit[i]; if (!o) { l.intensity = 0; return; } l.color.set(o.d.color); l.distance = o.d.distance; l.decay = o.d.decay; l.intensity = o.d.intensity; l.position.set(o.d.position.x + o.q.ox, o.d.position.y, o.d.position.z + o.q.oz); }); }

  // camera: a still diorama shot that leans a little towards her
  { const next = shotFor(girl.x, girl.z); if (next !== shot) { shot = next; shotChanges++; }
    const want = playing && playing.shot ? { ...shot, ...playing.shot } : shot, k = camCut ? 1 : 1 - Math.exp(-dt * (playing && playing.shot ? .9 : 1.7)); for (const n of SHOT_KEYS) cam[n] += (want[n] - cam[n]) * k;   // (a toy may bring its own way of looking: the balloon pulls the camera far back)
    const vw = portrait ? cam.tall : cam.span, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    camDist = clamp(vw / 2 / tanH, 8, 110); camH = camDist * (portrait ? cam.riseTall : cam.rise);
    { const far = Math.max(0, camDist - 45); scene.fog.near = 30 + far * 1.6; scene.fog.far = 95 + far * 3; const cf = 140 + far * 3; if (Math.abs(camera.far - cf) > 1) { camera.far = cf; camera.updateProjectionMatrix(); post.uniforms.far.value = cf; } }   // from far back, the haze and the end of the picture move back too
    const [lx, lz] = playing && playing.look ? playing.look : [girl.x, girl.z];   // on a toy the camera looks at the toy, not at her going to and fro
    camLook.lerp(new THREE.Vector3(cam.ax + (lx - cam.ax) * cam.fx, girl.y * cam.fy + .5, cam.az + (lz - cam.az) * cam.fz), camCut ? 1 : Math.min(1, dt * 2)); camCut = false;
    camPos.set(cam.ax + (camLook.x - cam.ax) * cam.lag + Math.sin(cam.yaw) * camDist, camLook.y + camH, camLook.z + Math.cos(cam.yaw) * camDist);
    camera.position.copy(camPos); camera.lookAt(camLook);
    camYaw = Math.atan2(camPos.x - camLook.x, camPos.z - camLook.z);
    if (shadowFollow) {   // the shadow sheet goes where the camera looks, in whole stitches of its own weave, so shadows never crawl
      const d = sunDir.copy(sun3).normalize(), rt = sunRight.crossVectors(UP, d).normalize(), up = sunUp.crossVectors(d, rt), st = 2 * shadowFollow / key.shadow.mapSize.x;
      const a = Math.round(camLook.dot(rt) / st) * st, b = Math.round(camLook.dot(up) / st) * st, c = camLook.dot(d);
      key.target.position.set(0, 0, 0).addScaledVector(rt, a).addScaledVector(up, b).addScaledVector(d, c); key.position.copy(key.target.position).add(sun3);
    }
    post.uniforms.dof.value = dofBase * cam.dof; post.uniforms.range.value = cam.range; }
  post.uniforms.focus.value = camera.position.distanceTo(new THREE.Vector3(girl.x, girl.y + .5, girl.z));
  if (stepped) post.uniforms.seed.value = (tick % 12) * 1.37;

  if (tracking) { const [sx, sz] = toScreen(girl.x - tracking.x, girl.z - tracking.z); tracking.x = girl.x; tracking.z = girl.z; if (sx || sz) { tracking.min = Math.min(tracking.min, (sx * tracking.want[0] + sz * tracking.want[1]) / dt); tracking.n++; } tracking.sx += sx; tracking.sz += sz; if (tracking.last) tracking.slow = Math.max(tracking.slow, now - tracking.last); tracking.last = now; }
  renderer.info.reset();
  // a set the camera cannot see sleeps: its pieces are big glued sheets, and without this every island is drawn all the time
  { camera.updateMatrixWorld(); viewM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); view.setFromProjectionMatrix(viewM); for (const s of sets) s.root.visible = s === set || view.intersectsBox(s.box3); for (const c of seaChunks) c.m.visible = view.intersectsBox(c.box); }
  if (POST) { renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
  else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
  measure(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// for tests and screenshots
window.__p = {
  placeAt(x, z) { girl.x = x; girl.z = z; uni.x = x; uni.z = z - .9; if (heightAt(uni.x, uni.z) === null) { uni.x = x - 1; uni.z = z; } target = null; },
  walkTo(x, z) { target = goTo(x, z); },
  /** how often she had to look for a way round, and how long the last look took */
  ways() { return { ...pathStat }; },
  tap(name) { const f = figures.find(f => f.name === name); const named = sets.map(q => q.names[name]).find(Boolean); if (f) tapFigure(f); else if (named) named(); else if (name === 'tree') { set.trees[0].wob = 1; } },
  evening(on = true) { eveTarget = on ? 1 : 0; eve = eveTarget; },
  screen(name) { const f = figures.find(f => f.name === name); const v = f ? new THREE.Vector3(f.x, f.y + (f.lift || 0) + .4, f.z) : new THREE.Vector3(...sets.map(q => q.spots[name]).find(Boolean)); v.project(camera); const r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; },
  frame() { return girl.frame; },
  still(on = true) { still = on; if (on) tick = 0; },
  stats() { return { set: set.name, sets: sets.map(q => q.name), load: world.ms, px: innerWidth * innerHeight * DPR * DPR, fps: stat.fps, worst: stat.worst, her: stat.her, calls: stat.calls, tris: stat.tris, dpr: DPR, shadows: SHADOWS, dof: DOF, post: POST, bake: BAKE, baked }; },
  /** dress her: __p.wear(['kroon', 'ketting', 'jurkregenboog', 'vleugels', 'ballon']); pose her: __p.pose('sit' | 'hold' | 'up' | null); __p.sleep(true) shuts her eyes */
  wear(ids) { girl.redress(wearOf(ids || [])); return girl.wear; },
  pose(name) { girl.poseName = name || null; },
  sleep(on = true) { girl.asleep = on; },
  face(view) { girl.view = view; },
  doll() { return { who: girl.kid, wear: girl.wear, pose: girl.poseOf(girl.frame), eyes: girl.eyes, warm: warm.length, balloon: balloon.g.visible ? balloon.pos.toArray() : null, hand: girl.point(kidPoints(girl.kid, girl.view, girl.poseOf(girl.frame), girl.frame).hand).toArray(), y: girl.y }; },
  view(name = 'girl') { return figures.find(f => f.name === name).view; },
  uniOk() { return heightAt(uni.x, uni.z) !== null; },
  hop(name) { return figures.find(f => f.name === name).hop; },
  info() { return { set: set.name, lift: girl.lift || 0, pose: girl.poseName, girl: [girl.x, girl.z, girl.y], uni: [uni.x, uni.z], eve, h: heightAt(girl.x, girl.z), ...Object.assign({}, ...sets.map(q => q.info ? q.info() : {})) }; },
  /** throw away what exists and build the set called `name` with its neighbours; gives how long that took */
  load(name) { loadWorld(name); return world.ms; },
  dbg: { get set() { return set; }, scene, renderer, figures },
  /** what exists right now: to see that a set thrown away is really gone */
  count() { const all = k => sets.reduce((n, q) => n + q[k].length, 0); return { set: set.name, ms: world.ms, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs.length, newest: Math.max(...renderer.info.programs.map(p => p.id)), calls: stat.calls, taps: all('taps'), solids: all('solids'), trees: all('trees'), ground: all('ground'), figures: figures.length, things: scene.children.length }; },
  /** which of the set's named places she can walk to from where she starts: a flood over the floor in small steps, by the same rule as her walk */
  reach(step = .15, extra = []) {
    const key = (i, j) => i * 10000 + j, seen = new Map(), [sx, sz] = set.start, todo = [[0, 0]], doors = sets.flatMap(q => q.doors); seen.set(key(5000, 5000), heightAt(sx, sz));
    while (todo.length) { const [i, j] = todo.pop(), h = seen.get(key(i + 5000, j + 5000));
      { const x = sx + i * step, z = sz + j * step, d = doors.find(q => inZone(q, x, z)), twin = d && doors.find(q => q.name === d.name && q !== d);   // a door is a way on
        if (twin) { const ti = Math.round((twin.stand[0] - sx) / step), tj = Math.round((twin.stand[1] - sz) / step), tk = key(ti + 5000, tj + 5000); if (!seen.has(tk)) { seen.set(tk, heightAt(twin.stand[0], twin.stand[1])); todo.push([ti, tj]); } } }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = key(i + di + 5000, j + dj + 5000); if (seen.has(k)) continue; const x = sx + (i + di) * step, z = sz + (j + dj) * step; if (Math.abs(i + di) > 2400 || Math.abs(j + dj) > 2400 || !free(x, z, h)) continue; seen.set(k, heightAt(x, z)); todo.push([i + di, j + dj]); } }
    const at = ([x, z]) => { for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) if (seen.has(key(Math.round((x - sx) / step) + di + 5000, Math.round((z - sz) / step) + dj + 5000))) return true; return false; };
    return { cells: seen.size, extra: extra.map(at), places: Object.fromEntries(sets.flatMap(q => Object.entries(q.places).map(([n, p]) => [(q === set ? '' : q.name + ' ') + n, at(p)]))) };
  },
  /** open every gate of the world */
  open: () => openGates(),
  /** for tests: treat her as standing on the set called `name` wherever she is (null: as usual again) */
  pin(name) { pinned = !!name; if (name) standOn(sets.find(q => q.name === name)); },
  /** the named places of the set she stands on, or of the set called `name` */
  places(name) { return (sets.find(q => q.name === name) || set).places; },
  /** does a finger at this spot on the screen land on something that answers a tap (without the finger's-width margin)? */
  direct(x, y) { const h = pickAt(x, y); return !!(h && h.object.userData.tap); },
  /** whose tap a finger at this spot would get through the margin alone: a figure's name, 'thing', or null */
  near(x, y) { const s = nearTap(x, y); return s ? (s.obj.children[0]?.children[0]?.userData.fig?.name || 'thing') : null; },
  /** the set's shots: which is on, how often it changed, and how tall she is in each on this screen (in points) */
  shots() {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), top = (1 - kidPoints(girl.kid, 'front').top[1] / girl.h) * girl.H;
    return { on: shot.name, changes: shotChanges, yaw: camYaw, list: [...sets.flatMap(q => q.shots.filter(s => s.zone)), set.shots[set.shots.length - 1]].map(s => { const d = clamp((portrait ? s.tall : s.span) / 2 / (tan * camera.aspect), 8, 60), rise = portrait ? s.riseTall : s.rise; return { name: s.name, play: s.play, zone: s.zone || null, her: top / (2 * d * Math.hypot(1, rise) * tan) * innerHeight }; }) };
  },
  /** a place in the world as a spot on the screen */
  point(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; },
  /** how spread out the sets are (lands.js), and how loud the water is right now (0 to 1) */
  spread: SPREAD, water() { return wash ? wash.near : null; }, wind(now) { if (now) gust.next = 0; return { n: gust.n, on: gust.t >= 0, x: gust.x, z: gust.z }; },
  /** where the camera looks and stands */
  cam() { return { look: camLook.toArray(), pos: camPos.toArray() }; },
  /** what she is playing on (a toy's own state), or null */
  toy(name) { const q = sets.map(s => s.toys && s.toys[name]).find(Boolean); return q ? { ...q.state(), on: playing === q.toy } : null; },
  /** can she walk from where she starts to this spot? */
  canReach(x, z) { const r = this.reach(.15, [[x, z]]); return r.extra[0]; },
  /** hold keys down as a child would ('a', 'd', 'w', 's'), or none */
  keys(list = []) { keys.clear(); for (const k of list) keys.add(k); },
  /** follow her for a while: how far she went on the screen's left-right and up-down, and the smallest step along `want` ([right, down]) in any frame: under zero means she turned back */
  track(want) { tracking = want ? { want, min: 1e9, sx: 0, sz: 0, x: girl.x, z: girl.z, n: 0, slow: 0, last: 0 } : null; },
  tracked() { return tracking && { min: tracking.min === 1e9 ? 0 : tracking.min, sx: tracking.sx, sz: tracking.sz, n: tracking.n, slow: tracking.slow }; },   // slow: the longest single frame, in ms
};
