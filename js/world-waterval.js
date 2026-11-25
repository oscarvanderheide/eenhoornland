// The waterfall in the flower meadow (wei): a cliff in the east lobe with water pouring down into a pool (MAP.FALLS).
// Stepping stones cross the pool, and every stone sings a note when she steps on it, so walking across plays a tune.
// Behind the falling water is the way into the grotto (MAP.ROOMS.val): wet blue stone, six singing crystals in the
// colours of the rainbow (all six rung: a rainbow across the grotto) and a little pool with koi that come to a tap.
// The otter that lives by the pool is in world-ways.js. Nothing here is needed for the adventure.
import * as MAP from './map.js';
import * as PX from './pixel.js';
import * as Q from './quest.js';
import * as ART from './art.js';
import * as WILD from './art-wild.js';
import { sfx } from './audio.js';

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
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(fw + .2, F.h + .15), new THREE.ShaderMaterial({
    uniforms: fu, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float t; varying vec2 vU;
      float h(float n){ return fract(sin(n * 91.7) * 43758.5); }
      void main(){ vec2 p = floor(vU * vec2(${(fw * 16).toFixed(1)}, ${(F.h * 16).toFixed(1)})); float col = p.x;
        float sp = .9 + h(col) * .6, s = fract(p.y / 9. + t * sp + h(col + 7.) * 3.);
        vec3 c = mix(vec3(.62, .86, .98), vec3(.86, .96, 1.), step(.55, s)); if (s > .9) c = vec3(1.);
        float edge = min(vU.x, 1. - vU.x); float a = edge < .04 ? (h(p.y + col) > .5 ? .9 : 0.) : .9;
        if (vU.y < .08) { c = vec3(1.); a = h(p.x * 3. + floor(t * 8.)) > .3 ? .95 : .6; }
        if (vU.y > .97) c = vec3(1.);
        gl_FragColor = vec4(c, a); }`,
  }));
  fall.position.set(F.fall[0] + fw / 2, (F.h + .15) / 2 - .05, fz); fall.renderOrder = 4; scene.add(fall);
  const foam = []; for (let k = 0; k < 6; k++) { const m = makeSprite(WILD.wolk(k % 2), { lean: .4, shadow: false, scale: .35 + (k % 3) * .08 }); m.position.set(F.fall[0] + .3 + k * (fw - .6) / 5, .1, fz + .25); scene.add(m); foam.push(m); }
  const rb = makeSprite(PX.rainbow(), { lean: .2, shadow: false, scale: 1.1 }); rb.material = rb.material.clone(); rb.material.transparent = true; rb.material.opacity = .55; rb.material.depthWrite = false; rb.position.set(F.fall[1] + 1.7, .5, fz + .5); scene.add(rb);   // a rainbow in the spray
  fall.userData.tap = () => { sfx.splash(); ctx.walkToTile(R.door[0], R.door[1]); }; pick.push(fall);

  /* ---------------- the singing stepping stones ---------------- */
  const stones = F.steps.map(([x, z, note], k) => { const m = makeSprite(WILD.stapsteen(k), { lean: 1.45, shadow: false, scale: 1.1 }); m.position.set(x + .5, .035, z + .55); scene.add(m); return { x, z, note, m, dip: 0 }; });
  const rings = [];
  let onStone = null, lastTile = -1, notes = 0;

  /* ---------------- the grotto: six crystals that sing, a rainbow when all six have sung ---------------- */
  const crystals = PX.RAINBOW.map((col, i) => {
    const x = R.x0 + 1.4 + i * 1.55, z = R.z0 + .35, m = makeSprite(WILD.zingkristal(col), { lean: .2, scale: 1.2 }); m.position.set(x, 0, z); scene.add(m);
    const c = { x, z, i, col, m, lit: 0, tex: [tex(WILD.zingkristal(col)), tex(WILD.zingkristal(col, true))] };
    ctx.solid(Math.floor(x), Math.floor(z));                                       // a crystal stands: she walks up to it, not through it
    m.userData.alpha = WILD.zingkristal(col); m.userData.tap = () => { if (near(x, z + 1, 1.5)) ring(c); else ctx.approach(Math.floor(x), Math.floor(z) + 1, () => ring(c)); }; pick.push(m); return c;
  });
  const sung = new Set();
  const arc = makeSprite(PX.rainbow(), { lean: .1, shadow: false, scale: 4 }); arc.material = arc.material.clone(); arc.material.transparent = true; arc.material.opacity = 0; arc.material.depthWrite = false; arc.position.set((R.x0 + R.x1 + 1) / 2 - 2, .4, R.z0 + .2); arc.visible = false; scene.add(arc);
  let arcT = 0;
  function ring(c) {
    c.lit = .7; c.m.material.map = c.tex[1]; c.m.material.emissiveMap = c.tex[1]; sfx.chime(c.i + 1); kid.face = c.x > kid.pos.x ? 1 : -1;
    ctx.life.bit(ART.drop(), c.x, 1.3, c.z + .2, { vy: .5, g: 6, life: .5 });
    sung.add(c.i);
    if (sung.size === 6 && !arc.visible) { arc.visible = true; arcT = 0; setTimeout(() => { sfx.tada(); burst(v3(arc.position.x, .8, arc.position.z + 1), 12, true); if (Q.giftOnce('kristallen', 'munt')) sfx.chime(5); }, 500); }
  }
  // the koi pool
  const P = R.pool, pool = new THREE.Mesh(new THREE.CircleGeometry(1, 32), ctx.waterMat('#2E8FB8', '#5CC0E0', '#E8FAFF', 8)); pool.rotation.x = -Math.PI / 2; pool.scale.set(P.rx + .2, P.rz + .2, 1); pool.position.set(P.cx, .02, P.cz); scene.add(pool);
  const rim = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 32), new THREE.MeshLambertMaterial({ color: '#9CC4D8' })); rim.rotation.x = -Math.PI / 2; rim.scale.set(P.rx + .2, P.rz + .2, 1); rim.position.set(P.cx, .025, P.cz); scene.add(rim);
  const KOI = ['#FF9E3B', '#FFFFFF', '#FF6B6B'];
  const koi = KOI.map((col, k) => { const art = PX.gridSprite(7, 3, (x, y) => (x === 0 && y !== 1) ? col : (x > 0 && x < 6) ? (x === 5 && y === 1 ? '#2B1E3A' : (x + k) % 3 === 0 ? '#FFFFFF' : col) : null); const m = makeSprite(art, { lean: 1.4, shadow: false, scale: 1 }); m.position.set(P.cx, .04, P.cz); scene.add(m); return { m, a: k * 2.1, sp: .5 + k * .12, to: null, jump: 0 }; });
  pool.userData.tap = h => { sfx.splash(); const p = h && h.point ? h.point : v3(P.cx, 0, P.cz); for (const f of koi) f.to = { x: p.x + (Math.random() - .5) * .6, z: p.z + (Math.random() - .5) * .4, t: 2.5 }; koi[Math.floor(Math.random() * 3)].jump = 1; rings.push(ringAt(p.x, p.z)); }; pick.push(pool);
  function ringAt(x, z) { const m = makeSprite(PX.ring(), { lean: Math.PI / 2, shadow: false, scale: .5 }); m.material = m.material.clone(); m.material.transparent = true; m.material.depthWrite = false; m.position.set(x, .05, z); scene.add(m); return { m, t: 0 }; }

  // one rule for every input: next to a crystal (or the pool) the action button rings it (or splashes)
  ctx.addUse(() => {
    if (MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)) !== 'val') return null; if (ctx.toys.carrying()) return null;
    let best = null, bd = 1.5; for (const c of crystals) { const d = Math.hypot(c.x - kid.pos.x, c.z + .7 - kid.pos.z); if (d < bd) { bd = d; best = c; } }
    return best ? { key: 'kristal' + best.i, art: WILD.zingkristal(best.col), run: () => ring(best) } : null;
  });

  return {
    stones: () => stones.map(s => ({ x: s.x, z: s.z, note: s.note })), notes: () => notes, sung: () => [...sung], rainbow: () => arc.visible, ring: i => ring(crystals[i]),
    update(dt, time) {
      fu.t.value = time;
      for (const [k, m] of foam.entries()) { m.position.y = .08 + Math.abs(Math.sin(time * 3 + k)) * .1; m.scale.setScalar(.35 + (k % 3) * .08 + Math.sin(time * 4 + k * 2) * .04); }
      // a stone sings as she steps on it
      const ti = I(Math.floor(kid.pos.x), Math.floor(kid.pos.z));
      if (ti !== lastTile) { lastTile = ti; onStone = stones.find(s => I(s.x, s.z) === ti) || null; if (onStone) { onStone.dip = 1; notes++; sfx.chime(onStone.note); rings.push(ringAt(onStone.x + .5, onStone.z + .55)); } if (ti === I(...R.door)) sfx.splash(); }
      for (const s of stones) { if (s.dip > 0) s.dip = Math.max(0, s.dip - dt * 3); s.m.position.y = .035 - Math.sin(s.dip * Math.PI) * .05; }
      for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; r.m.scale.setScalar(.5 + r.t * 1.6); r.m.material.opacity = Math.max(0, 1 - r.t / .8); if (r.t > .8) { scene.remove(r.m); rings.splice(i, 1); } }
      for (const c of crystals) if (c.lit > 0 && (c.lit -= dt) <= 0) { c.m.material.map = c.tex[0]; c.m.material.emissiveMap = c.tex[0]; }
      if (arc.visible) { arcT += dt; arc.material.opacity = Math.min(.75, arcT * .6); }
      if (arc.visible && MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)) !== 'val') { arc.visible = false; sung.clear(); }   // a new tune every visit
      for (const f of koi) {
        if (f.to && (f.to.t -= dt) > 0) { const dx = f.to.x - f.m.position.x, dz = f.to.z - f.m.position.z, d = Math.hypot(dx, dz); if (d > .05) { f.m.position.x += dx / d * Math.min(d, dt * 1.6); f.m.position.z += dz / d * Math.min(d, dt * 1.6); f.m.scale.x = dx > 0 ? -1 : 1; } }
        else { f.to = null; f.a += dt * f.sp; const nx = P.cx + Math.cos(f.a) * P.rx * .62, nz = P.cz + Math.sin(f.a) * P.rz * .55; f.m.scale.x = -Math.sin(f.a) > 0 ? -1 : 1; f.m.position.x = nx; f.m.position.z = nz; }
        if (f.jump > 0) { f.jump = Math.max(0, f.jump - dt * 1.6); f.m.position.y = .04 + Math.sin((1 - f.jump) * Math.PI) * .7; f.m.rotation.x = -1.4 + (f.jump > 0 ? 1.2 : 0); } else { f.m.position.y = .04; f.m.rotation.x = -1.4; }
      }
    },
    dispose() { for (const r of rings) scene.remove(r.m); },
  };
}
