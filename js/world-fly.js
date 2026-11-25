// Flying: a grown unicorn has wings. Her own unicorn once it can carry her (Q.canRide), or an old unicorn from the meadow
// that walks along with her for the day (world-life.js friends). The wing button (or the map) takes off; she flies over
// the islands and the sea with the joystick, the keys, a held finger or a tap; the same button (or the action button)
// lands. A map pin flies her there and lands by itself.
// She only ever lands where she could also have walked to from where she took off (the gates of the adventure stay
// gates): a landing over a place that is still closed glides to the nearest open spot instead.
// world.js asks: on() (she is in the air), drive(kx, kz, dt) (input while flying), toward(x, z) (a tap), camK (how far
// the camera pulls back), and calls update() every frame.
import * as MAP from './map.js';
import * as Q from './quest.js';
import * as ART from './art.js';
import * as WILD from './art-wild.js';
import { sfx } from './audio.js';
import { state } from './state.js';

const ALT = 3.4, SPEED = 8.5;

export function createFlight(ctx) {
  const { THREE, scene, M, kid, uni, makeChar, makeSprite, burst, tex, chars, pick } = ctx;
  const I = M.I, W = M.W;
  let f = null;          // the flight: { look, own, friend, flyer, wings, alt, phase: 'up' | 'fly' | 'down', t, vx, vz, goal, autoLand, allowed, land }
  let camK = 1;

  /** who can carry her into the sky right now: her own unicorn, or an old unicorn walking along with her */
  function carrier() {
    if (MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)) || kid.pos.z >= MAP.OUT_H) return null;
    if (ctx.busy() || ctx.life.swimming() || ctx.life.carrying() || ctx.toys.carrying()) return null;
    if (ctx.mount() === 'fiets') return null;
    if (Q.canRide() && uni.g.visible) return { own: true, look: state.uni };
    const fr = ctx.life.friends().find(c => c.uniKind && c.g.visible && !c.held && !c.fly);
    return fr ? { own: false, friend: fr, look: fr.look } : null;
  }

  /** every outdoor tile she could walk to from here with what is open now (the boat counts, doors do not) */
  function reachable(sx, sz, ride) {
    const re = new Uint8Array(M.block.length), q = [I(sx, sz)]; re[q[0]] = 1;
    const docks = [I(...MAP.BOAT.strand.dock), I(...MAP.BOAT.eiland.dock)];
    const pass = j => { const b = M.block[j]; return b === 0 || b === MAP.LOW || (ride && b === MAP.GAP); };
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, z = Math.floor(i / W);
      if (i === docks[0] && !re[docks[1]]) { re[docks[1]] = 1; q.push(docks[1]); }
      if (i === docks[1] && !re[docks[0]]) { re[docks[0]] = 1; q.push(docks[0]); }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= W || Z >= MAP.OUT_H) continue; const j = I(X, Z);
        if (!re[j] && pass(j)) { re[j] = 1; q.push(j); }
      }
    }
    return re;
  }
  /** a good tile to land on: open ground all round, no bridge, no door, nothing standing there */
  const doorTiles = new Set([...Object.values(MAP.ROOMS).map(r => I(...r.door)), ...ctx.doorTiles()]);
  function landOk(x, z) {
    if (x < 2 || z < 2 || x >= W - 2 || z >= MAP.OUT_H - 2) return false; const i = I(x, z);
    if (!f.allowed[i] || !ctx.walkable(x, z) || M.ground[i] === MAP.BW || M.ground[i] === MAP.WA) return false;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (doorTiles.has(I(x + dx, z + dz))) return false;
    return ctx.walkable(x + 1, z) && ctx.walkable(x - 1, z) && ctx.walkable(x, z + 1) && ctx.walkable(x, z - 1);
  }
  function landingNear(px, pz) {
    const cx = Math.floor(px), cz = Math.floor(pz); let best = null, bd = 1e9;
    for (let r = 0; r < W && !best; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = cx + dx, z = cz + dz;
      if (!landOk(x, z)) continue; const d = Math.hypot(x + .5 - px, z + .5 - pz); if (d < bd) { bd = d; best = [x + .5, z + .5]; }
    }
    return best;
  }

  function makeFlyer(look) {
    const b = { baby: true }, fr = { idle: ART.uniSprite(look, 'idle', false, b), w1: ART.uniSprite(look, 'idle', false, b), w2: ART.uniSprite(look, 'idle', false, b) };
    const c = makeChar(fr, { flippable: true, name: look.name, say: ['Wiii!'], blobW: 1.1 }); c.baseScale = 1.5; c.sit = true; c.zBias = .01; c.flyer = true;
    const mane = look.mane || '#FF7EB6', mk = k => { const m = makeSprite(WILD.wing(mane, 0), { lean: .3, shadow: false }); m.userData.k = k; scene.add(m); return m; };
    const wings = [mk(0), mk(1)];   // the far wing behind her, the near one in front of the girl's legs
    wings.tex = [0, 1, 2].map(k => tex(WILD.wing(mane, k)));
    return { c, wings };
  }
  function dropFlyer() {
    if (!f) return; const c = f.flyer.c; scene.remove(c.g); for (const arr of [chars]) { const i = arr.indexOf(c); if (i >= 0) arr.splice(i, 1); }
    const i = pick.indexOf(c.mesh); if (i >= 0) pick.splice(i, 1); for (const k in c.texs) c.texs[k].dispose(); c.mesh.material.dispose();
    for (const w of f.flyer.wings) { scene.remove(w); w.material.dispose(); } for (const t of f.flyer.wings.tex) t.dispose();
  }

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1d1430', transparent: true, opacity: .32, depthWrite: false }));
  shadow.position.y = .03; shadow.visible = false; scene.add(shadow);
  /* ---------------- clouds: only there while she is up in the sky ---------------- */
  const clouds = [];
  for (let k = 0; k < 12; k++) {
    const m = makeSprite(WILD.wolk(k % 4), { lean: .3, shadow: false, scale: 1.3 + (k % 3) * .3 }); m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0; m.material.depthWrite = false; m.material.alphaTest = .01;
    m.position.set(10 + ((k * 37) % 13) * 10.5, ALT - .6 + (k % 3) * .5, 6 + ((k * 23) % 9) * 9.5); m.visible = false; m.renderOrder = 6; scene.add(m); clouds.push(m);
  }

  /* ---------------- a faint rainbow behind her while she flies: one ribbon made of her last positions ---------------- */
  const BANDS = ['#FF6B6B', '#FFA94D', '#FFE066', '#8CE99A', '#74C0FC', '#B197FC'].map(h => new THREE.Color(h)), N = 36, BH = .075, LIFE = 1.1, FAINT = .38;
  const trail = [];   // { x, y, z, age }, newest first
  const tGeo = new THREE.BufferGeometry(), tPos = new Float32Array(N * BANDS.length * 2 * 3), tCol = new Float32Array(N * BANDS.length * 2 * 4), tIdx = [];
  for (let b = 0; b < BANDS.length; b++) for (let i = 0; i < N - 1; i++) { const a = (b * N + i) * 2; tIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 4)); tGeo.setIndex(tIdx);
  const ribbon = new THREE.Mesh(tGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  ribbon.frustumCulled = false; ribbon.visible = false; ribbon.renderOrder = 5; scene.add(ribbon);
  function stepTrail(dt, tail) {
    for (const p of trail) p.age += dt; while (trail.length && trail[trail.length - 1].age > LIFE) trail.pop();
    if (tail) { const h = trail[0]; if (h && Math.hypot(h.x - tail[0], h.z - tail[2], h.y - tail[1]) < .12) { h.x = tail[0]; h.y = tail[1]; h.z = tail[2]; } else { trail.unshift({ x: tail[0], y: tail[1], z: tail[2], age: 0 }); if (trail.length > N) trail.pop(); } }
    ribbon.visible = trail.length > 1; if (!ribbon.visible) return;
    for (let b = 0; b < BANDS.length; b++) for (let i = 0; i < N; i++) {
      const p = trail[Math.min(i, trail.length - 1)], a = (b * N + i) * 2, fade = i >= trail.length ? 0 : FAINT * (1 - p.age / LIFE) * Math.min(1, i / 3), y = p.y + (BANDS.length / 2 - b) * BH, c = BANDS[b];
      for (let s = 0; s < 2; s++) { const v = a + s; tPos.set([p.x, y - s * BH, p.z], v * 3); tCol.set([c.r, c.g, c.b, Math.max(0, fade)], v * 4); }
    }
    tGeo.attributes.position.needsUpdate = true; tGeo.attributes.color.needsUpdate = true;
  }

  /** up into the sky. `dest` [x, z]: fly there and land by itself (the map) */
  function start(dest, then) {
    if (f) { if (dest) { f.goal = dest; f.autoLand = true; f.then = then || null; } return true; }
    const who = carrier(); if (!who) return false;
    const ride = who.own; f = { ...who, alt: 0, phase: 'up', t: 0, vx: 0, vz: 0, goal: dest || null, autoLand: !!dest, then: then || null };
    ctx.placeAt(kid.pos.x, kid.pos.z, -kid.face, 0);                                  // off any stump or bale she stood on
    f.allowed = reachable(Math.floor(kid.pos.x), Math.floor(kid.pos.z), ride || Q.canRide());
    if (ctx.mount() === 'uni') ctx.setMount(null, true);
    kid.path = []; ctx.clearWalk();
    if (who.own) uni.g.visible = false; else who.friend.g.visible = false;
    f.flyer = makeFlyer(who.look); f.flyer.c.pos.copy(kid.pos); f.flyer.c.face = kid.face;
    kid.sit = true; kid.zBias = -.03; kid.dx = -.26;
    sfx.whoosh(); sfx.sparkle(); burst(kid.pos, 12, true); kid.hop = 0;
    return true;
  }
  /** back down: glide to the nearest place she may stand on, then touch down */
  function land() {
    if (!f || f.phase === 'down') return false;
    const p = landingNear(kid.pos.x + f.vx * .25, kid.pos.z + f.vz * .25); if (!p) return false;
    f.phase = 'down'; f.land = p; f.t = 0; sfx.whoosh(); return true;
  }
  function touchDown() {
    const c = f.flyer.c, own = f.own, friend = f.friend, then = f.autoLand ? f.then : null; dropFlyer(); shadow.visible = false; const look = f.look; f = null;
    kid.sit = false; kid.lift = 0; kid.zBias = .06; kid.dx = 0; kid.squash = .6;
    ctx.placeAt(kid.pos.x, kid.pos.z, -kid.face, 0);
    if (own) { uni.g.visible = true; uni.pos.copy(kid.pos); ctx.setMount('uni', true); }
    else if (friend) { friend.g.visible = true; friend.pos.set(kid.pos.x - kid.face * 1.2, 0, kid.pos.z + .2); if (!ctx.walkable(Math.floor(friend.pos.x), Math.floor(friend.pos.z))) friend.pos.copy(kid.pos); friend.hop = 1; }
    sfx.pop(); sfx.boing(); burst(kid.pos, 10, true); void c; void look;
    if (then) setTimeout(then, 350);
  }

  return {
    on: () => !!f, can: () => !f && !!carrier(), start, land, reachable,
    /** a tap while flying: fly there (and with the button, land) */
    toward(x, z) { if (!f || f.phase === 'down') return; f.goal = [x, z]; f.autoLand = false; },
    get camK() { return camK; },
    info: () => f ? { phase: f.phase, alt: +f.alt.toFixed(2), own: f.own, goal: f.goal, land: f.land } : null,
    landingNear: (x, z) => { if (!f) return null; return landingNear(x, z); },
    drive(kx, kz, dt) {
      if (!f) return;
      if (f.phase === 'down') {                                                      // gliding to the landing spot, then down
        const [lx, lz] = f.land, dx = lx - kid.pos.x, dz = lz - kid.pos.z, d = Math.hypot(dx, dz), s = Math.min(d, Math.max(3, Math.min(SPEED, d * 2)) * dt);
        if (d > .02) { kid.pos.x += dx / d * s; kid.pos.z += dz / d * s; if (Math.abs(dx) > .05) kid.face = Math.sign(dx); }
        f.vx = 0; f.vz = 0; kid.moving = d > .05; return;
      }
      let ix = kx, iz = kz;
      if (ix || iz) f.goal = null, f.autoLand = false, f.then = null;
      else if (f.goal) { const dx = f.goal[0] - kid.pos.x, dz = f.goal[1] - kid.pos.z, d = Math.hypot(dx, dz); if (d < .6) { f.goal = null; if (f.autoLand) land(); } else { const k = Math.min(1, d / 2.5); ix = dx / d * k; iz = dz / d * k; } }
      const l = Math.hypot(ix, iz), m = l > 1 ? 1 / l : 1, k = Math.min(1, dt * 3.2);
      f.vx += (ix * m * SPEED - f.vx) * k; f.vz += (iz * m * SPEED - f.vz) * k;
      if (f.phase === 'up') { f.vx *= .6; f.vz *= .6; }
      kid.pos.x = THREE.MathUtils.clamp(kid.pos.x + f.vx * dt, 3, W - 3); kid.pos.z = THREE.MathUtils.clamp(kid.pos.z + f.vz * dt, 3, MAP.OUT_H - 3);
      if (Math.abs(f.vx) > .3) kid.face = Math.sign(f.vx); kid.moving = Math.hypot(f.vx, f.vz) > .3;
    },
    update(dt, time) {
      const want = f ? (f.phase === 'down' ? 1 + .45 * Math.min(1, f.alt / ALT) : 1.45) : 1; camK += (want - camK) * Math.min(1, dt * 1.6);
      for (const cl of clouds) { const o = Math.max(0, Math.min(.85, (camK - 1.1) * 3)); cl.material.opacity = o; cl.visible = o > .01; cl.position.x += dt * .25; if (cl.position.x > W + 6) cl.position.x = -6; }
      if (!f) return void stepTrail(dt, null);
      f.t += dt; const c = f.flyer.c, sc = c.baseScale;
      if (f.own && uni.g.visible) uni.g.visible = false; if (f.friend && f.friend.g.visible) f.friend.g.visible = false;   // she is the one with the wings now
      if (f.phase === 'up') { f.alt = ALT * Math.min(1, 1 - (1 - Math.min(1, f.t / 1.3)) ** 3); if (f.t >= 1.3) f.phase = 'fly'; }
      else if (f.phase === 'fly') f.alt = ALT + Math.sin(time * 1.6) * .12;
      else { const d = Math.hypot(f.land[0] - kid.pos.x, f.land[1] - kid.pos.z); if (d < .05) { f.alt = Math.max(0, f.alt - dt * 3.2); if (f.alt <= 0) { touchDown(); return; } } else f.alt += (Math.min(ALT, d * .9 + .4) - f.alt) * Math.min(1, dt * 3); }
      c.pos.copy(kid.pos); c.face = kid.face; c.moving = false; c.lift = f.alt;
      shadow.visible = true; shadow.position.x = kid.pos.x; shadow.position.z = kid.pos.z + .1; shadow.scale.set(1.5 - f.alt * .12, 1, .8 - f.alt * .06);
      kid.lift = f.alt + .36 * sc;
      stepTrail(dt, kid.moving && f.alt > .4 ? [kid.pos.x - kid.face * .8, f.alt + .42 * sc / 1.5, kid.pos.z - .12] : null);   // the rainbow streams from her tail
      const flap = f.phase === 'up' || (f.phase === 'down' && f.alt < 1) ? 9 : Math.hypot(f.vx, f.vz) > 2 ? 6 : 3.2, fr = Math.floor(time * flap) % 4, wi = fr === 0 ? 0 : fr === 2 ? 2 : 1;
      for (const w of f.flyer.wings) {
        const near = w.userData.k === 1; w.material.map = f.flyer.wings.tex[near ? wi : (wi + 1) % 3]; w.material.emissiveMap = w.material.map;
        const k = near ? 1.35 : 1.15; w.position.set(kid.pos.x - kid.face * (.12 + .56 * k), f.alt + (near ? .66 : .74) * sc / 1.5, kid.pos.z + (near ? -.05 : -.08)); w.scale.set(k * -kid.face, k, 1);
      }
    },
    dispose() { if (f) dropFlyer(); f = null; for (const cl of clouds) scene.remove(cl); scene.remove(shadow); scene.remove(ribbon); tGeo.dispose(); ribbon.material.dispose(); },
  };
}
