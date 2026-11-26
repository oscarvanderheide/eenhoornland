// The waterfall in the flower meadow (wei): a cliff in the east lobe with water pouring down into a pool (MAP.FALLS).
// Stepping stones cross the pool, and every stone sings a note when she steps on it, so walking across plays a tune.
// Behind the falling water is the way into the cave (MAP.ROOMS.val), three rooms of wet blue stone in a row, each shut
// from the next by crystal bars until its little puzzle is done (all of it saved, state.extra.val, saved first and
// shown after):
//   A  six singing crystals in the colours of the rainbow and a koi pool. All six sung: a rainbow, and (once the
//      unicorn has hatched, Q.toolReady) the bars to B sink.
//   B  two stone buttons and one big stone (world-keien.js): the stone on one button, herself on the other.
//   C  an underground stream. Three crystal switches (the sword, a tap or ✕) each raise a plank of the bridge; on the
//      far bank stands the chest with the hookshot (she lifts it over her head, world-gift.js). Then the bridge falls
//      into the water, and the hookshot is the way back: a post on each bank (world-haak.js).
// The otter that lives by the pool outside is in world-ways.js.
import * as MAP from './map.js';
import * as PX from './pixel.js';
import * as Q from './quest.js';
import * as ART from './art.js';
import * as WILD from './art-wild.js';
import { sfx, speak } from './audio.js';
import { state, save } from './state.js';

export function createWaterval(ctx) {
  const { THREE, scene, M, makeSprite, pick, burst, kid, tex, canvas } = ctx;
  const F = MAP.FALLS, R = MAP.ROOMS.val, I = M.I, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const near = (x, z, r) => Math.hypot(x - kid.pos.x, z - kid.pos.z) < r;

  /* ---------------- the cliff ---------------- */
  function rockCanvas(wu, hu, seed) {
    const [c, x] = canvas(Math.max(16, Math.round(wu * 16)), Math.round(hu * 16)), w = c.width, h = c.height, r = PX.rng(seed);
    for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) { const n = Math.sin(px * .35 + y * .09 + seed) + Math.sin(y * .27 - px * .13) + r() * .7; x.fillStyle = n > 1.2 ? '#C9CCD8' : n > .2 ? '#B0B4C4' : n > -.8 ? '#9A9EB2' : '#868AA0'; x.fillRect(px, y, 1, 1); }
    for (let k = 0; k < w * 1.5; k++) { const px = Math.floor(r() * w), y = Math.floor(r() * 5); x.fillStyle = r() < .5 ? '#6DB862' : '#84CF73'; x.fillRect(px, y, 1, 1 + Math.floor(r() * 3)); }   // grass hanging over the edge
    for (let k = 0; k < w / 4; k++) { x.fillStyle = '#7BC86C'; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 1); }
    return c;
  }
  // one mesh for the whole cliff (two materials: rock on the sides, grass on top), so it costs two draws, not ninety
  const fallX = x => x >= F.fall[0] && x <= F.fall[1], rockTex = tex(rockCanvas(4, 3, 7)); rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
  const pos = [], nor = [], uv = [], sides = [], tops = [];
  for (let x = F.x0; x <= F.x1; x++) {
    let z0 = null, z1 = null; for (let z = F.z0; z <= F.z1; z++) if (M.ground[I(x, z)] === MAP.RK && M.block[I(x, z)]) { if (z0 === null) z0 = z; z1 = z; }
    if (z0 === null) continue;
    const h = F.h + (fallX(x) ? 0 : .15 + Math.abs(Math.sin(x * 1.7)) * .55), g = new THREE.BoxGeometry(1, h, z1 - z0 + 1).toNonIndexed();
    g.translate(x + .5, h / 2, (z0 + z1 + 1) / 2);
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i += 3) {
      const top = N.getY(i) > .5, list = top ? tops : sides;
      for (let k = 0; k < 3; k++) { const j = i + k, px = P.getX(j), py = P.getY(j), pz = P.getZ(j); list.push([px, py, pz, N.getX(j), N.getY(j), N.getZ(j), Math.abs(N.getX(j)) > .5 ? pz / 4 : px / 4, (h - (h - py)) / 3 + (top ? 0 : 0)]); }
    }
  }
  for (const v of [...sides, ...tops]) { pos.push(v[0], v[1], v[2]); nor.push(v[3], v[4], v[5]); uv.push(v[6], v[7]); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  cg.addGroup(0, sides.length, 0); cg.addGroup(sides.length, tops.length, 1);
  scene.add(shadowed(new THREE.Mesh(cg, [new THREE.MeshLambertMaterial({ map: rockTex }), new THREE.MeshLambertMaterial({ color: '#7BC86C' })])));
  for (const [dx, dz, s] of [[2.5, 1.2, 1.2], [11.5, 1.6, 1.4], [5, .4, .9], [13.4, .8, 1]]) { const b = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: '#B0B4C4', flatShading: true }))); b.position.set(F.x0 + dx, F.h + .3, F.z0 + dz + 1); b.scale.y = .6; scene.add(b); }
  for (const [dx, dz, k] of [[1.5, 2.5, 1], [3.6, 2, 2], [12.4, 2.6, 3], [14, 1.8, 1]]) { const m = makeSprite(ART.propArt('pine', k), { lean: .3 }); m.position.set(F.x0 + dx, F.h, F.z0 + dz + 1); scene.add(m); }

  /* ---------------- the falling water ---------------- */
  const fw = F.fall[1] - F.fall[0] + 1, fz = F.z1 + 1.03;
  const fu = { t: { value: 0 } };
  const fallMat = (wu, hu) => new THREE.ShaderMaterial({
    uniforms: fu, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float t; varying vec2 vU;
      float h(float n){ return fract(sin(n * 91.7) * 43758.5); }
      void main(){ vec2 p = floor(vU * vec2(${(wu * 16).toFixed(1)}, ${(hu * 16).toFixed(1)})); float col = p.x;
        float sp = .9 + h(col) * .6, s = fract(p.y / 9. + t * sp + h(col + 7.) * 3.);
        vec3 c = mix(vec3(.62, .86, .98), vec3(.86, .96, 1.), step(.55, s)); if (s > .9) c = vec3(1.);
        float edge = min(vU.x, 1. - vU.x); float a = edge < .04 ? (h(p.y + col) > .5 ? .9 : 0.) : .9;
        if (vU.y < .08) { c = vec3(1.); a = h(p.x * 3. + floor(t * 8.)) > .3 ? .95 : .6; }
        if (vU.y > .97) c = vec3(1.);
        gl_FragColor = vec4(c, a); }`,
  });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(fw + .2, F.h + .15), fallMat(fw, F.h));
  fall.position.set(F.fall[0] + fw / 2, (F.h + .15) / 2 - .05, fz); fall.renderOrder = 4; scene.add(fall);
  const foam = []; for (let k = 0; k < 6; k++) { const m = makeSprite(WILD.wolk(k % 2), { lean: .4, shadow: false, scale: .35 + (k % 3) * .08 }); m.position.set(F.fall[0] + .3 + k * (fw - .6) / 5, .1, fz + .25); scene.add(m); foam.push(m); }
  fall.userData.tap = () => { sfx.splash(); ctx.walkToTile(R.door[0], R.door[1]); }; pick.push(fall);


  /* ---------------- the singing stepping stones ---------------- */
  const stones = F.steps.map(([x, z, note], k) => { const m = makeSprite(WILD.stapsteen(k), { lean: 1.45, shadow: false, scale: 1.1 }); m.position.set(x + .5, .035, z + .55); scene.add(m); return { x, z, note, m, dip: 0 }; });
  const rings = [];
  let onStone = null, lastTile = -1, notes = 0;


  /* ---------------- the cave: what is solved stays solved ---------------- */
  const st = state.extra.val = Object.assign({ a: false, b: false, sw: [false, false, false], fell: false }, state.extra.val || {});
  const ready = () => Q.hasTool('haak') || Q.toolReady('haak');                    // before the unicorn hatched the cave is a place to sing, no more
  const waiting = () => !Q.hasTool('haak') && Q.toolReady('haak');                 // the hookshot is the goal of the moment
  const [WA, WB] = R.walls, S = R.stream;
  const kx = () => Math.floor(kid.pos.x), kz = () => Math.floor(kid.pos.z);
  const here = () => MAP.roomAt(kx(), kz()) === 'val';
  const inB = (x, z) => x > WA.x && x < WB.x && z >= R.z0 && z <= R.z1;
  const inC = () => here() && kx() > WB.x;
  const onIsland = () => inC() && kx() > S.x1;

  /* the crystal bars between the rooms: shut at runtime (map.js keeps the gate tiles open, so reachability holds) */
  function makeGate(w, open) {
    const bars = w.gate.map(([x, z]) => { const m = makeSprite(ART.kristalhek(), { lean: 0, scale: 1.05 }); m.position.set(x + .5, 0, z + .5); scene.add(m); return m; });
    if (open) for (const m of bars) m.visible = false; else for (const [x, z] of w.gate) M.block[I(x, z)] = 1;
    return { w, bars, sink: 0, hold: 0, want: 0 };
  }
  const gA = makeGate(WA, st.a), gB = makeGate(WB, st.b);
  function openGate(g) { sfx.click(); setTimeout(() => { sfx.tada(); burst(v3(g.w.x + .5, .6, g.w.gate[0][1] + 1), 14, true); g.sink = Math.max(.001, g.hold * .5); }, 450); }
  function stepGate(g, dt, time) {
    if (!g.bars[0].visible) return;
    if (g.sink > 0) {
      g.sink = Math.min(1, g.sink + dt * .9); for (const m of g.bars) { m.position.y = -1.4 * g.sink; m.rotation.z = Math.sin(time * 40) * .03 * (1 - g.sink); }
      if (g.sink >= 1) { g.sink = 0; for (const m of g.bars) m.visible = false; for (const [x, z] of g.w.gate) M.block[I(x, z)] = 0; }
      return;
    }
    g.hold = g.want ? Math.min(1, g.hold + dt * 1.6) : Math.max(0, g.hold - dt * 2.4);   // half down while one button is pressed: a hint, it comes back up
    for (const m of g.bars) { m.position.y = -.7 * g.hold; m.rotation.z = g.hold > 0 && g.hold < 1 ? Math.sin(time * 40) * .03 : 0; }
  }

  /* ---------------- A: six crystals that sing; all six: a rainbow (and the bars to B sink) ---------------- */
  const crystals = PX.RAINBOW.map((col, i) => {
    const x = R.x0 + 1.4 + i * 1.55, z = R.z0 + .35, m = makeSprite(WILD.zingkristal(col), { lean: .2, scale: 1.2 }); m.position.set(x, 0, z); scene.add(m);
    const c = { x, z, i, col, m, lit: 0, on: false, tex: [tex(WILD.zingkristal(col)), tex(WILD.zingkristal(col, true))] };
    ctx.solid(Math.floor(x), Math.floor(z));                                       // a crystal stands: she walks up to it, not through it
    m.userData.alpha = WILD.zingkristal(col); m.userData.tap = () => { if (near(x, z + 1, 1.5)) ring(c); else ctx.approach(Math.floor(x), Math.floor(z) + 1, () => ring(c)); }; pick.push(m); return c;
  });
  const sung = new Set();
  const arc = makeSprite(PX.rainbow(), { lean: .1, shadow: false, scale: 4 }); arc.material = arc.material.clone(); arc.material.transparent = true; arc.material.opacity = 0; arc.material.depthWrite = false; arc.position.set((R.x0 + WA.x) / 2, .4, R.z0 + .2); arc.visible = false; scene.add(arc);
  let arcT = 0;
  function ring(c) {
    c.lit = .7; sfx.chime(c.i + 1); kid.face = c.x > kid.pos.x ? 1 : -1;
    ctx.life.bit(ART.drop(), c.x, 1.3, c.z + .2, { vy: .5, g: 6, life: .5 });
    sung.add(c.i);
    if (sung.size === 6 && !arc.visible) {
      arc.visible = true; arcT = 0;
      const opens = ready() && !st.a; if (opens) { st.a = true; save(); }       // saved first, the bars sink after
      setTimeout(() => { sfx.tada(); burst(v3(arc.position.x, .8, arc.position.z + 1), 12, true); if (Q.giftOnce('kristallen', 'munt')) sfx.chime(5); if (opens) openGate(gA); }, 500);
    }
  }
  // the koi pool
  const P = R.pool, pool = new THREE.Mesh(new THREE.CircleGeometry(1, 32), ctx.waterMat('#2E8FB8', '#5CC0E0', '#E8FAFF', 8)); pool.rotation.x = -Math.PI / 2; pool.scale.set(P.rx + .2, P.rz + .2, 1); pool.position.set(P.cx, .02, P.cz); scene.add(pool);
  const rim = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 32), new THREE.MeshLambertMaterial({ color: '#9CC4D8' })); rim.rotation.x = -Math.PI / 2; rim.scale.set(P.rx + .2, P.rz + .2, 1); rim.position.set(P.cx, .025, P.cz); scene.add(rim);
  const KOI = ['#FF9E3B', '#FFFFFF', '#FF6B6B'];
  const koi = KOI.map((col, k) => { const art = PX.gridSprite(7, 3, (x, y) => (x === 0 && y !== 1) ? col : (x > 0 && x < 6) ? (x === 5 && y === 1 ? '#2B1E3A' : (x + k) % 3 === 0 ? '#FFFFFF' : col) : null); const m = makeSprite(art, { lean: 1.4, shadow: false, scale: 1 }); m.position.set(P.cx, .04, P.cz); scene.add(m); return { m, a: k * 2.1, sp: .5 + k * .12, to: null, jump: 0 }; });
  pool.userData.tap = h => { sfx.splash(); const p = h && h.point ? h.point : v3(P.cx, 0, P.cz); for (const f of koi) f.to = { x: p.x + (Math.random() - .5) * .6, z: p.z + (Math.random() - .5) * .4, t: 2.5 }; koi[Math.floor(Math.random() * 3)].jump = 1; rings.push(ringAt(p.x, p.z)); }; pick.push(pool);
  function ringAt(x, z) { const m = makeSprite(PX.ring(), { lean: Math.PI / 2, shadow: false, scale: .5 }); m.material = m.material.clone(); m.material.transparent = true; m.material.depthWrite = false; m.position.set(x, .05, z); scene.add(m); return { m, t: 0 }; }

  /* ---------------- B: two buttons, one big stone: the stone on one, herself on the other ---------------- */
  const glowTex = (() => { const [c, x] = canvas(32, 32), r = x.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(190,235,255,1)'); r.addColorStop(1, 'rgba(150,210,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const glow = () => { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); scene.add(g); return g; };
  const plates = R.plates.map(([x, z]) => {
    const m = makeSprite(ART.knop(st.b), { lean: Math.PI / 2, shadow: false, scale: .9 }); m.position.set(x + .5, .02, z + .5); scene.add(m);
    const gl = glow(); gl.position.set(x + .5, .3, z + .5); return { x, z, m, gl, down: st.b, bob: 0 };
  });
  const setPlate = (p, down) => { const t = tex(ART.knop(down)); p.m.material.map = t; p.m.material.emissiveMap = t; p.m.material.needsUpdate = true; p.down = down; };
  const theStone = () => ctx.keien && ctx.keien.stones().find(s => s.tag === 'val');
  const weighs = (x, z) => !!(ctx.keien && ctx.keien.at(x, z)) || (kx() === x && kz() === z && !(kid.lift > .05) && !(kid.path[0] && kid.path[0].jump)) || ctx.animals.some(a => a.g.visible && !a.held && !a.fly && Math.floor(a.pos.x) === x && Math.floor(a.pos.z) === z);
  let hintT = 0;

  /* ---------------- C: the stream, the switches, the bridge, the chest ---------------- */
  const sw0 = S.x0, sw = S.x1 - S.x0 + 1, sd = R.z1 - R.z0 + 2;
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(sw, sd), ctx.waterMat('#1F5F8B', '#2E86B8', '#CFF4FF', 6)); stream.rotation.x = -Math.PI / 2; stream.position.set(sw0 + sw / 2, .015, R.z0 + sd / 2); scene.add(stream);
  for (const ex of [sw0, S.x1 + 1]) { const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.12, .14, sd), new THREE.MeshLambertMaterial({ color: '#5E82A0' }))); b.position.set(ex, .07, R.z0 + sd / 2); scene.add(b); }   // the banks
  const cascade = new THREE.Mesh(new THREE.PlaneGeometry(sw + .1, 2.4), fallMat(sw, 2.4)); cascade.position.set(sw0 + sw / 2, 1.2, R.z0 + .03); cascade.renderOrder = 4; scene.add(cascade);   // it pours out of the back wall
  const spray = []; for (let k = 0; k < 3; k++) { const m = makeSprite(WILD.wolk(k % 2), { lean: .4, shadow: false, scale: .3 }); m.position.set(sw0 + .5 + k, .1, R.z0 + .35); scene.add(m); spray.push(m); }
  const planks = Array.from({ length: sw }, (_, k) => {
    const m = makeSprite(WILD.plank(k), { lean: Math.PI / 2, shadow: false, scale: 1 }); m.position.set(sw0 + k + .5, .04, R.bridge + .5); scene.add(m);
    const p = { k, x: sw0 + k, m, up: st.sw[k] && !st.fell, t: 1, dir: 0 };
    if (!p.up) { m.visible = false; M.block[I(p.x, R.bridge)] = 1; }
    return p;
  });
  function raise(p) { p.up = true; p.dir = 1; p.t = 0; p.m.visible = true; sfx.splash(); rings.push(ringAt(p.x + .5, R.bridge + .5)); }
  function drop(p, wait) { p.up = false; p.dir = -1; p.t = -wait; M.block[I(p.x, R.bridge)] = 1; }
  const switches = R.switches.map(([x, z], k) => {
    const art = WILD.knopKristal(false, k), m = makeSprite(art, { lean: .25, scale: 1.05 }); m.position.set(x + .5, 0, z + .55); scene.add(m); m.userData.alpha = art;
    const s = { k, x, z, m, wob: 0, flash: 0, shown: null };
    m.userData.tap = () => { if (near(x + .5, z + .5, 1.6)) hit(s); else if (!ctx.approach(x, z, () => hit(s))) s.wob = .4; };
    pick.push(m); return s;
  });
  const lit = s => (st.sw[s.k] && !st.fell) || s.flash > 0;
  function hit(s) {
    s.wob = .5; kid.face = s.x + .5 > kid.pos.x ? 1 : -1;
    if (st.fell || st.sw[s.k]) { s.flash = .5; sfx.chime(s.k * 2 + 2); return; }   // the bridge is gone for good (the hookshot is the way now) or this one is on already
    st.sw[s.k] = true; save(); sfx.chime(s.k * 2 + 1); burst(v3(s.x + .5, .9, s.z + .6), 6, true);
    raise(planks[s.k]);
    if (st.sw.every(Boolean)) setTimeout(() => { sfx.tada(); burst(v3(sw0 + sw / 2, .4, R.bridge + .5), 12, true); }, 700);
  }
  ctx.strikes = ctx.strikes || [];
  ctx.strikes.push((cx, cz, r) => { if (!inC()) return; for (const s of switches) if (Math.hypot(s.x + .5 - cx, s.z + .5 - cz) < r + .45) hit(s); });

  const [chx, chz] = R.chest, chestArt = o => ART.schatkist(o), chest = makeSprite(chestArt(false), { lean: .3, scale: 1.05 }); chest.position.set(chx + .5, 0, chz + .55); chest.userData.alpha = chestArt(false); scene.add(chest);
  const setChest = open => { const art = chestArt(open), t = tex(art); chest.material.map = t; chest.material.emissiveMap = t; chest.material.needsUpdate = true; chest.userData.alpha = art; if (chest.customDepthMaterial) chest.customDepthMaterial.map = t; };
  let chestShown = null, chestWob = 0, fellT = -1;
  function syncChest() { const on = ready(); if (on === chestShown) return; chestShown = on; chest.visible = on; setChest(Q.hasTool('haak')); }
  function openChest() {
    if (!waiting()) { chestWob = .4; sfx.pop(); return; }
    if (!Q.giveTool('haak')) return;                                               // saved first, shown after
    setChest(true); sfx.chime(6); burst(v3(chx + .5, .7, chz + .6), 10, true); kid.face = chx + .5 > kid.pos.x ? 1 : -1;
    ctx.gift.give(ART.toolIcon('haak'), v3(chx + .5, .6, chz + .7), () => { speak(Q.TOOLS.haak.found); });
  }
  chest.userData.tap = () => { if (near(chx + .5, chz + .5, 1.7)) openChest(); else if (!ctx.approach(chx, chz, openChest)) chestWob = .3; };
  pick.push(chest);

  // one rule for every input: next to a crystal, a switch or the chest the action button does what a tap does
  ctx.addUse(() => {
    if (!here() || ctx.toys.carrying() || (ctx.keien && ctx.keien.holding())) return null;
    let best = null, bd = 1.5;
    for (const c of crystals) { const d = Math.hypot(c.x - kid.pos.x, c.z + .7 - kid.pos.z); if (d < bd) { bd = d; best = { key: 'kristal' + c.i, art: WILD.zingkristal(c.col), run: () => ring(c) }; } }
    for (const s of switches) { const d = Math.hypot(s.x + .5 - kid.pos.x, s.z + .5 - kid.pos.z); if (d < bd) { bd = d; best = { key: 'knop' + s.k, art: WILD.knopKristal(lit(s), s.k), run: () => hit(s) }; } }
    if (chest.visible && waiting()) { const d = Math.hypot(chx + .5 - kid.pos.x, chz + .5 - kid.pos.z); if (d < 1.6) best = { key: 'kist', art: chestArt(false), run: openChest }; }
    return best;
  });

  return {
    stones: () => stones.map(s => ({ x: s.x, z: s.z, note: s.note })), notes: () => notes, sung: () => [...sung], rainbow: () => arc.visible, ring: i => ring(crystals[i]),
    /** the cave's puzzles (tests) */
    cave: () => ({ a: st.a, b: st.b, sw: st.sw.slice(), fell: st.fell, plates: plates.map(p => p.down), chest: R.chest, shown: !!chestShown, waiting: waiting(), bridge: planks.map(p => !M.block[I(p.x, R.bridge)]) }),
    hit: k => hit(switches[k]), openChest,
    /** dev / tests: solve rooms up to n (1: A, 2: B, 3: the bridge) */
    solve(n = 3) { if (n >= 1 && !st.a) { st.a = true; openGate(gA); } if (n >= 2 && !st.b) { st.b = true; plates.forEach(p => setPlate(p, true)); openGate(gB); } if (n >= 3) switches.forEach(s => { if (!st.sw[s.k]) hit(s); }); save(); },
    /** where the hookshot waits (the map's goal marker): the waterfall from outside, the chest inside; null once it is hers */
    spot: () => waiting() ? (here() ? R.chest.slice() : R.door.slice()) : null,
    /** walking into the chest or a switch answers like a tap */
    bumpAt(x, z) { if (x === chx && z === chz && chest.visible) { openChest(); return true; } const s = switches.find(s => s.x === x && s.z === z); if (s) { hit(s); return true; } return false; },
    update(dt, time, act) {
      fu.t.value = time; syncChest();
      for (const [k, m] of foam.entries()) { m.position.y = .08 + Math.abs(Math.sin(time * 3 + k)) * .1; m.scale.setScalar(.35 + (k % 3) * .08 + Math.sin(time * 4 + k * 2) * .04); }
      // a stone sings as she steps on it
      const ti = I(kx(), kz()), inCave = here();
      if (ti !== lastTile) { lastTile = ti; onStone = stones.find(s => I(s.x, s.z) === ti) || null; if (onStone) { onStone.dip = 1; notes++; sfx.chime(onStone.note); rings.push(ringAt(onStone.x + .5, onStone.z + .55)); } if (ti === I(...R.door)) sfx.splash(); }
      for (const s of stones) { if (s.dip > 0) s.dip = Math.max(0, s.dip - dt * 3); s.m.position.y = .035 - Math.sin(s.dip * Math.PI) * .05; }
      for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; r.m.scale.setScalar(.5 + r.t * 1.6); r.m.material.opacity = Math.max(0, 1 - r.t / .8); if (r.t > .8) { scene.remove(r.m); rings.splice(i, 1); } }
      // while the hookshot waits, the waterfall sparkles (the way in), and inside the chest does
      if (waiting() && !inCave && Math.random() < dt * 3) ctx.life.bit(PX.sparkle('#FFF6D0'), F.fall[0] + Math.random() * fw, .4 + Math.random() * (F.h - .6), fz + .15, { vx: 0, vy: .3, g: 0, life: 1 });
      if (!inCave) { if (sung.size || arc.visible) { arc.visible = false; sung.clear(); } }   // a new tune every visit
      // A: rung crystals keep glowing until all six have sung
      for (const c of crystals) { if (c.lit > 0) c.lit -= dt; const on = c.lit > 0 || (sung.has(c.i) && !arc.visible); if (on !== c.on) { c.on = on; c.m.material.map = c.tex[on ? 1 : 0]; c.m.material.emissiveMap = c.tex[on ? 1 : 0]; } }
      if (arc.visible) { arcT += dt; arc.material.opacity = Math.min(.75, arcT * .6); }
      for (const f of koi) {
        if (f.to && (f.to.t -= dt) > 0) { const dx = f.to.x - f.m.position.x, dz = f.to.z - f.m.position.z, d = Math.hypot(dx, dz); if (d > .05) { f.m.position.x += dx / d * Math.min(d, dt * 1.6); f.m.position.z += dz / d * Math.min(d, dt * 1.6); f.m.scale.x = dx > 0 ? -1 : 1; } }
        else { f.to = null; f.a += dt * f.sp; const nx = P.cx + Math.cos(f.a) * P.rx * .62, nz = P.cz + Math.sin(f.a) * P.rz * .55; f.m.scale.x = -Math.sin(f.a) > 0 ? -1 : 1; f.m.position.x = nx; f.m.position.z = nz; }
        if (f.jump > 0) { f.jump = Math.max(0, f.jump - dt * 1.6); f.m.position.y = .04 + Math.sin((1 - f.jump) * Math.PI) * .7; f.m.rotation.x = -1.4 + (f.jump > 0 ? 1.2 : 0); } else { f.m.position.y = .04; f.m.rotation.x = -1.4; }
      }
      // B: the buttons
      const stone = theStone();
      if (!st.b) {
        for (const p of plates) { const d = weighs(p.x, p.z); if (d !== p.down) { setPlate(p, d); (d ? sfx.click : sfx.pop)(); if (d && kx() === p.x && kz() === p.z) kid.squash = .4; } }
        const n = plates.filter(p => p.down).length; gB.want = n === 1 ? 1 : 0;
        if (n === 2) { st.b = true; save(); gB.want = 0; openGate(gB); }               // both at once: open for good
        else if (inCave && kx() > WA.x && kx() < WB.x && (hintT -= dt) < 0) {           // nothing yet: the stone wiggles, the empty buttons bob
          hintT = 3.5; if (stone && stone !== ctx.keien.holding() && !plates.some(p => p.x === stone.x && p.z === stone.z)) stone.wob = .6; for (const p of plates) if (!p.down) p.bob = .5;
        }
        // the stone belongs in this room until the bars are open: put down anywhere else, it puffs back
        if (stone && stone !== ctx.keien.holding() && !stone.slide && !inB(stone.x, stone.z)) { burst(v3(stone.x + .5, .3, stone.z + .5), 8); if (ctx.keien.slideTo(stone, R.stone[0], R.stone[1], .01)) { sfx.sparkle(); burst(v3(R.stone[0] + .5, .3, R.stone[1] + .5), 8); } }
      }
      for (const p of plates) { p.gl.visible = !st.b && !p.down; if (p.gl.visible) { const k = Math.sin(time * 3); p.gl.material.opacity = .45 + .25 * k; p.gl.scale.setScalar(1.3 * (1 + .08 * k)); } if (p.bob > 0) { p.bob -= dt; p.m.position.y = .02 + Math.abs(Math.sin(p.bob * 12)) * .06; } }
      stepGate(gA, dt, time); stepGate(gB, dt, time);
      // C: the switches, the planks, the chest
      for (const s of switches) {
        if (s.flash > 0) s.flash -= dt; const on = lit(s); if (on !== s.shown) { s.shown = on; const art = WILD.knopKristal(on, s.k), t = tex(art); s.m.material.map = t; s.m.material.emissiveMap = t; s.m.userData.alpha = art; }
        if (s.wob > 0) { s.wob -= dt; s.m.rotation.z = Math.sin(s.wob * 40) * .05; } else s.m.rotation.z = 0;
        if (!on && !st.fell && st.b && inC() && !onIsland()) s.m.position.y = Math.abs(Math.sin(time * 2.4 + s.k)) * .04; else s.m.position.y = 0;   // the next thing to do: they bob a little
      }
      for (const p of planks) {
        if (p.dir > 0) { p.t = Math.min(1, p.t + dt * 2); p.m.position.y = -.3 + .34 * p.t; p.m.rotation.z = (1 - p.t) * .3; if (p.t >= 1) { p.dir = 0; M.block[I(p.x, R.bridge)] = 0; } }
        else if (p.dir < 0) { p.t += dt; if (p.t > 0) { if (!p.splashed) { p.splashed = true; sfx.splash(); rings.push(ringAt(p.x + .5, R.bridge + .5)); } p.m.position.y = .04 - p.t * .5; p.m.rotation.z = p.t * .8; if (p.t > .8) { p.dir = 0; p.m.visible = false; } } else { p.m.position.x = p.x + .5 + Math.sin(time * 50) * .03; } }
      }
      if (chestWob > 0) { chestWob -= dt; chest.rotation.z = Math.sin(chestWob * 40) * .05; } else chest.rotation.z = 0;
      if (chest.visible && waiting() && inC() && Math.random() < dt * 2) ctx.life.bit(PX.sparkle('#FFF6D0'), chx + .2 + Math.random() * .6, .5 + Math.random() * .5, chz + .7, { vx: 0, vy: .5, g: 0, life: 1 });
      // the hookshot is hers and she is on the far bank: the bridge falls into the stream, the posts are the way back
      if (!st.fell && Q.hasTool('haak') && st.sw.every(Boolean) && onIsland() && !ctx.gift.active() && !ctx.busy()) {
        st.fell = true; st.sw = [false, false, false]; save();                        // saved first: the planks fall after
        sfx.bonk(); kid.squash = .3; planks.forEach((p, k) => drop(p, .8 + k * .3)); fellT = 0;
      }
      if (fellT >= 0) { fellT += dt; if (fellT > 2.2) { fellT = -1; ctx.bubble(kid, '', ART.toolIcon('haak')); } }
      // stranded on the far bank (the bridge is gone): the post across the stream sparkles until she hooks over
      if (st.fell && onIsland() && Math.random() < dt * 3) { const [px, pz] = R.posts[0]; ctx.life.bit(PX.sparkle('#FFE08A'), px + .3 + Math.random() * .4, .6 + Math.random() * .8, pz + .7, { vx: 0, vy: .4, g: 0, life: .9 }); }
      for (const [k, m] of spray.entries()) m.position.y = .08 + Math.abs(Math.sin(time * 3 + k * 1.7)) * .08;
    },
    dispose() { for (const r of rings) scene.remove(r.m); },
  };
}
