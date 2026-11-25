// Places to walk into (Zelda style), built from MAP.ROOMS: the cave in the forest, where the first egg lies in a beam of
// sunlight, and the hall inside the castle, with coins to walk over, a chest and the golden door to the castle garden.
// They are real rooms in the same world (carved into the rock below the sea, see map.js), so walking, the unicorn that
// follows, picking up animals and everything else simply works there. Doors are tiles: world.js moves her through them.
// world.js hands over the same toolbox (ctx) as for world-extras.js.
import * as ART from './art.js';
import * as MAP from './map.js';
import * as PX from './pixel.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';
import { state, save } from './state.js';

export function createRooms(ctx) {
  const { THREE, scene, M, tex, canvas, makeSprite, pick, burst, kid } = ctx;
  const R = MAP.ROOMS, lights = [], flames = [], darks = [], v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  /* ---------------- walls ---------------- */
  function wallCanvas(wu, hu, kind) {
    const [c, x] = canvas(Math.max(16, Math.round(wu * 16)), Math.round(hu * 16)), w = c.width, h = c.height, r = PX.rng(wu * 31 + hu * 7 + kind.length);
    if (kind === 'grot') {
      for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) { const n = Math.sin(px * .31 + y * .07) + Math.sin(y * .23 - px * .11) + r() * .6; x.fillStyle = n > 1.2 ? '#CFC2DE' : n > .2 ? '#BBADCD' : n > -.8 ? '#A898BC' : '#9686AC'; x.fillRect(px, y, 1, 1); }
      for (let k = 0; k < w / 6; k++) { x.fillStyle = '#8CC98A'; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 1); }   // moss
      for (let k = 0; k < w / 10; k++) { x.fillStyle = ['#FFB3D9', '#FFFFFF', '#FFE08A'][k % 3]; x.fillRect(Math.floor(r() * w), Math.floor(r() * h * .5 + h * .5), 1, 1); }   // tiny flowers
    } else if (kind === 'val') {                                                  // behind the waterfall: blue stone, wet and glittering
      for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) { const n = Math.sin(px * .27 + y * .11) + Math.sin(y * .31 - px * .09) + r() * .5; x.fillStyle = n > 1.1 ? '#9CC4D8' : n > .1 ? '#86B0C8' : n > -.9 ? '#7299B4' : '#5E82A0'; x.fillRect(px, y, 1, 1); }
      for (let k = 0; k < w / 5; k++) { const dx = Math.floor(r() * w), len = 3 + Math.floor(r() * 8), y0 = Math.floor(r() * h * .5); for (let j = 0; j < len; j++) { x.fillStyle = j === len - 1 ? '#FFFFFF' : '#B8E2F2'; x.fillRect(dx, y0 + j, 1, 1); } }   // trickles
      for (let k = 0; k < w / 8; k++) { x.fillStyle = ['#8CE0C8', '#FFFFFF', '#BFA8FF'][k % 3]; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); }
    } else if (kind === 'hut') {                                                  // the treehouse: planks, and round windows full of leaves
      for (let y = 0; y < h; y++) { const row = Math.floor(y / 5); for (let px = 0; px < w; px++) { const seam = y % 5 === 4 || (px + row * 7) % 23 === 0; x.fillStyle = seam ? '#8A5A33' : ['#C99A62', '#BF8F58', '#D2A66E'][(row + Math.floor((px + row * 5) / 23)) % 3]; x.fillRect(px, y, 1, 1); } }
      for (let wx = 18; wx < w - 12; wx += 40) { const cy = Math.round(h * .42); for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const d = Math.hypot(dx, dy); if (d > 8.5) continue; x.fillStyle = d > 7 ? '#6B4126' : (dx * 3 + dy * 5 + 99) % 7 < 2 ? '#8FD06A' : dy < -2 ? '#BFE8FF' : '#62BC62'; x.fillRect(wx + dx, cy + dy, 1, 1); } }
    } else {
      x.fillStyle = '#D5CCE0'; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) { x.fillStyle = '#A79DB8'; x.fillRect(0, y + 5, w, 1); const off = (y / 6 % 2) * 6; for (let px = off; px < w; px += 12) { x.fillRect(px, y, 1, 5); if (r() < .25) { x.fillStyle = r() < .5 ? '#E4DCEC' : '#C6BCD4'; x.fillRect(px + 1, y, 11, 5); x.fillStyle = '#A79DB8'; } } }
      // banners in the colours of the rainbow
      for (let k = 0, bx = 40; bx < w - 30; bx += 72, k++) { const col = PX.RAINBOW[k % 6]; x.fillStyle = '#F7C548'; x.fillRect(bx - 1, 6, 16, 2); x.fillStyle = col; x.fillRect(bx, 8, 14, 22); for (let t = 0; t < 7; t++) { x.fillRect(bx + t, 30 + Math.floor(t / 2), 1, 1); x.fillRect(bx + 13 - t, 30 + Math.floor(t / 2), 1, 1); } x.fillStyle = '#FFF3A8'; x.fillRect(bx + 5, 14, 4, 4); }
    }
    return c;
  }
  const wallMat = {}; for (const k of ['grot', 'hal', 'hut', 'val']) wallMat[k] = cv => new THREE.MeshLambertMaterial({ map: tex(cv) });
  function wall(kind, x0, z0, x1, z1, h) {   // a box over whole tiles x0..x1, z0..z1
    const w = x1 - x0 + 1, d = z1 - z0 + 1, front = wallCanvas(w, h, kind), side = wallCanvas(d, h, kind), top = new THREE.MeshLambertMaterial({ color: kind === 'grot' ? '#8CC98A' : kind === 'hut' ? '#62BC62' : kind === 'val' ? '#5E82A0' : '#B9B0C9' });
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wallMat[kind](side), wallMat[kind](side), top, top, wallMat[kind](front), wallMat[kind](front)]));
    m.position.set(x0 + w / 2, h / 2, z0 + d / 2); scene.add(m); return m;
  }
  function torch(x, z, y = 1.35, soft = false) {   // in the cave a glowing crystal instead of a flame
    const m = makeSprite(soft ? ART.propArt('kristal', x | 0) : ART.fakkel(0), { lean: 0, shadow: false, scale: 1.1 }); m.position.set(x, y - .3, z); scene.add(m); if (!soft) flames.push(m);
    const l = new THREE.PointLight(soft ? '#FFD6F0' : '#FFB45E', 0, 7, 1.4); l.userData.k = soft ? .35 : 1; l.position.set(x, y + .2, z + .35); scene.add(l); lights.push(l);
  }
  for (const [k, r] of Object.entries(R)) {
    const H2 = k === 'grot' || k === 'val' ? 2.4 : 2.9;
    wall(k, r.x0 - 1, r.z0 - 2, r.x1 + 1, r.z0 - 1, H2);                                   // the back wall
    wall(k, r.x0 - 2, r.z0 - 2, r.x0 - 1, r.z1 + 1, H2); wall(k, r.x1 + 1, r.z0 - 2, r.x1 + 2, r.z1 + 1, H2);   // the side walls
    wall(k, r.x0 - 1, r.z1 + 1, r.exit[0] - 1, r.z1 + 1, .45); wall(k, r.exit[0] + 1, r.z1 + 1, r.x1 + 1, r.z1 + 1, .45);   // a low front wall, so nothing hides her
    { const dark = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0 + 9, 9, 10), new THREE.MeshBasicMaterial({ color: '#120D16' })); dark.position.set((r.x0 + r.x1 + 1) / 2, 4.5, r.z0 - 2 - 5); dark.visible = false; scene.add(dark); darks.push(dark); }   // only while she is inside: from the beach it would black out the screen   // the dark beyond the back wall: no sea to be seen from inside
    if (r.wall) { const gz = r.gate.map(g => g[1]); wall(k, r.wall, r.z0, r.wall, Math.min(...gz) - 1, 1.7); wall(k, r.wall, Math.max(...gz) + 1, r.wall, r.z1, 1.7); }   // the wall between the cave's two rooms
    if (k === 'val') { for (const fx of [.2, .5, .8]) { const l = new THREE.PointLight('#A8E8FF', 0, 9, 1.3); l.userData.k = .55; l.position.set(r.x0 + (r.x1 - r.x0 + 1) * fx, 1.8, r.z0 + 2); scene.add(l); lights.push(l); } continue; }
    if (k === 'hut') { for (const fx of [.25, .75]) { const l = new THREE.PointLight('#FFD9A0', 0, 8, 1.3); l.userData.k = .5; l.position.set(r.x0 + (r.x1 - r.x0 + 1) * fx, 1.9, r.z0 + 1.5); scene.add(l); lights.push(l); } continue; }   // warm daylight through the windows
    const n = k === 'grot' ? 5 : 5; for (let i = 0; i < n; i++) torch(r.x0 + (r.x1 - r.x0 + 1) * (i + .5) / n + (k === 'hal' && i === 2 ? 2.5 : 0), r.z0 + .02, 1.35, k === 'grot');
  }

  /* ---------------- the cave mouth in the forest ---------------- */
  {
    const C = MAP.CAVE, w = C.x1 - C.x0 + 1, d = C.z1 - C.z0 + 1;
    const rock = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 2.1, d), new THREE.MeshLambertMaterial({ map: tex(wallCanvas(w, 2.1, 'grot')) }))); rock.position.set(C.x0 + w / 2, 1.05, C.z0 + d / 2); scene.add(rock);
    for (const [dx, dz, s] of [[1.6, .8, 1.5], [6.8, .6, 1.3], [4.2, -.3, 1.8]]) { const b = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: '#B5A6C8', flatShading: true }))); b.position.set(C.x0 + dx, 2, C.z0 + dz + .6); b.scale.y = .7; scene.add(b); }
    for (const [dx, dz] of [[.6, 2.6], [8.4, 2.7]]) { const m = makeSprite(ART.propArt('fern', dx > 4 ? 2 : 1), { lean: .25 }); m.position.set(C.x0 + dx, 0, C.z0 + dz + .4); scene.add(m); }
    const mouth = makeSprite(ART.grotmond(), { lean: 0, shadow: false, scale: 1.05 }); mouth.position.set(R.grot.door[0] + .5, 0, C.z1 + 1.03); scene.add(mouth);
    mouth.userData.alpha = ART.grotmond(); mouth.userData.tap = () => { sfx.pop(); ctx.walkToTile(R.grot.door[0], R.grot.door[1]); }; pick.push(mouth);
  }

  /* ---------------- the cave: a friendly grotto, light stone, glowing mushrooms, a beam of sunlight on the egg ---------------- */
  const g = R.grot, beam = makeSprite(ART.lichtbundel(), { lean: .45, shadow: false, scale: 1.2 });
  beam.material = beam.material.clone(); beam.material.transparent = true; beam.material.opacity = .45; beam.material.depthWrite = false; beam.material.blending = THREE.AdditiveBlending; beam.material.emissiveIntensity = 1;
  beam.position.set(g.egg[0] + .5, 0, g.egg[1] + .3); scene.add(beam);

  /* ---------------- the cave's puzzle: push the crate onto the button and the crystal gate to the back room sinks ----------------
     Walking into the crate pushes it one tile; a tap on it pushes it the right way (she walks round to the right side
     first). A crate pushed where it can never reach the button any more puffs back to where it started: no getting stuck.
     She can also jump on top of it (ctx.tops). Once open the gate stays open (state.extra.grotOpen).
     Standing on the button herself sinks the bars too, but they come back up when she steps off: the hint to put something heavy there. */
  const pz = { box: g.box.slice(), slide: null, poof: 0, sink: 0, hold: 0, on: false };   // hold: how far the bars are down while she stands on the button herself
  let open = !!state.extra.grotOpen;
  const I = M.I, room1 = (x, z) => x >= g.x0 && x < g.wall && z >= g.z0 && z <= g.z1;
  const isGate = (x, z) => g.gate.some(([a, b]) => a === x && b === z);
  const freeFor = (x, z) => room1(x, z) && !M.block[I(x, z)] && !isGate(x, z);
  const boxMesh = makeSprite(ART.kist(), { lean: .3, scale: 1.05 }); scene.add(boxMesh); boxMesh.userData.alpha = ART.kist();
  const plate = makeSprite(ART.knop(open), { lean: Math.PI / 2, shadow: false }); plate.position.set(g.plate[0] + .5, .02, g.plate[1] + .9); scene.add(plate);
  const setPlate = down => { const t = tex(ART.knop(down)); plate.material.map = t; plate.material.emissiveMap = t; plate.material.needsUpdate = true; };
  const plateGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const [c, x] = canvas(32, 32), r = x.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,190,225,1)'); r.addColorStop(1, 'rgba(255,150,200,0)'); x.fillStyle = r; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  plateGlow.position.set(g.plate[0] + .5, .3, g.plate[1] + .5); scene.add(plateGlow);
  const bars = g.gate.map(([x, z]) => { const m = makeSprite(ART.kristalhek(), { lean: 0, scale: 1.05 }); m.position.set(x + .5, 0, z + .5); scene.add(m); return m; });
  function placeBox(x, z) {
    const [ox, oz] = pz.box; M.block[I(ox, oz)] = 0; ctx.tops.delete(I(ox, oz));
    pz.box = [x, z]; M.block[I(x, z)] = 1; ctx.tops.set(I(x, z), .5);
  }
  if (open) { pz.box = g.plate.slice(); for (const m of bars) m.visible = false; }
  else for (const [x, z] of g.gate) M.block[I(x, z)] = 1;
  placeBox(...pz.box); boxMesh.position.set(pz.box[0] + .5, 0, pz.box[1] + .55);
  /** it can never reach the button again: against a wall it can only slide along that wall */
  function stuck() {
    const [x, z] = pz.box, [px, pzz] = g.plate, wallX = !freeFor(x - 1, z) || !freeFor(x + 1, z), wallZ = !freeFor(x, z - 1) || !freeFor(x, z + 1);
    return (wallX && x !== px) || (wallZ && z !== pzz) || (wallX && wallZ && !(x === px && z === pzz));
  }
  /** push the crate one tile (dx, dz); true if it moved */
  function push(dx, dz) {
    if (open || pz.slide || pz.poof) return false;
    const [x, z] = pz.box, nx = x + dx, nz = z + dz; M.block[I(x, z)] = 0; const ok = freeFor(nx, nz); M.block[I(x, z)] = 1;
    if (!ok) { pz.wob = .3; sfx.pop(); return false; }
    placeBox(nx, nz); pz.slide = { x0: x + .5, z0: z + .55, x1: nx + .5, z1: nz + .55, t: 0 }; sfx.brush ? sfx.brush() : sfx.pop(); kid.hop = .25;
    if (nx === g.plate[0] && nz === g.plate[1]) { open = true; state.extra.grotOpen = true; save(); }   // saved first, the gate sinks after
    return true;
  }
  /** the way to push it next, found by trying every way the crate could go (the room is small) */
  function nextPush() {
    const [bx, bz] = pz.box, key = (x, z) => x + ',' + z, came = new Map([[key(bx, bz), null]]), q = [[bx, bz]];
    M.block[I(bx, bz)] = 0;
    try {
      while (q.length) { const [x, z] = q.shift(); if (x === g.plate[0] && z === g.plate[1]) { let k = key(x, z), step = null; while (came.get(k)) { step = came.get(k); k = step.from; } return step && step.d; }
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (came.has(key(nx, nz)) || !freeFor(nx, nz) || !freeFor(x - dx, z - dz)) continue; came.set(key(nx, nz), { from: key(x, z), d: [dx, dz] }); q.push([nx, nz]); } }
      return null;
    } finally { M.block[I(bx, bz)] = 1; }
  }
  function tapBox() {
    sfx.pop(); if (open) return; const d = nextPush(); if (!d) { pz.poof = 1; return; }
    const [bx, bz] = pz.box, fx = bx - d[0], fz = bz - d[1];
    const there = () => Math.abs(kid.pos.x - (fx + .5)) < .6 && Math.abs(kid.pos.z - (fz + .5)) < .6;
    if (there()) { kid.face = d[0] ? d[0] : kid.face; push(...d); return; }
    ctx.walkThen(fx, fz, () => { if (there()) { kid.face = d[0] ? d[0] : kid.face; push(...d); } });
  }
  boxMesh.userData.tap = tapBox; pick.push(boxMesh);

  /* ---------------- the hall: coins on the floor, a chest, and the golden door to the garden ---------------- */
  const h = R.hal, coins = [];
  const COINS = [[60, 110], [62, 113], [61, 117], [66, 110], [67, 114], [73, 111], [74, 115], [78, 110], [80, 113], [79, 117], [69, 112], [71, 115]];
  function syncCoins() {
    for (const c of coins) scene.remove(c.m); coins.length = 0;
    const got = Q.quest.picked.munt || [];
    COINS.forEach(([x, z], k) => { if (got.includes(3000 + k) || M.block[M.I(x, z)]) return; const m = makeSprite(ART.coin(), { lean: .3, shadow: false }); m.position.set(x + .5, .25, z + .5); scene.add(m); coins.push({ m, x: x + .5, z: z + .5, k, ph: k * .7 }); });
  }
  const rising = [];
  const chest = { x: 72.5, z: 109.4, open: 0, m: makeSprite(ART.schatkist(false), { lean: .3, scale: 1.2 }) };
  chest.m.position.set(chest.x, 0, chest.z); scene.add(chest.m); chest.m.userData.alpha = ART.schatkist(false);
  const setChest = open => { const a = ART.schatkist(open), t = tex(a); chest.m.material.map = t; chest.m.material.emissiveMap = t; chest.m.material.needsUpdate = true; };
  function openChest() {
    chest.open = 2.2; setChest(true); sfx.sparkle();
    const k = [0, 1, 2].find(i => !(Q.quest.picked.munt || []).includes(700 + i));          // three real coins a day (the same ones the old treasure room gave)
    if (k !== undefined) { Q.collect('munt', 700 + k); sfx.chime(5); const m = makeSprite(ART.coin(), { lean: .2, shadow: false, scale: 1.2 }); m.position.set(chest.x, .6, chest.z + .1); scene.add(m); rising.push({ m, t: 0 }); }
    else burst(v3(chest.x, .4, chest.z), 8, true);
  }
  chest.m.userData.tap = () => { sfx.pop(); if (Math.hypot(chest.x - kid.pos.x, chest.z - kid.pos.z) < 1.4) openChest(); else ctx.approach(Math.floor(chest.x), Math.floor(chest.z) + 1, openChest); }; pick.push(chest.m);
  const door = makeSprite(ART.tuinpoort(), { lean: 0, shadow: false, scale: 1.15 }); door.position.set(h.garden[0] + .5, 0, h.z0 + .02); scene.add(door);
  door.userData.alpha = ART.tuinpoort(); door.userData.tap = () => { sfx.pop(); ctx.walkToTile(h.garden[0], h.garden[1]); }; pick.push(door);

  const off = Q.on(type => { if (type === 'day') syncCoins(); });
  syncCoins();

  return {
    dispose: off, lights, openChest, push, tapBox, nextPush,
    /** dev / tests: the crate back where it starts */
    reset() { if (!open) { placeBox(...g.box); boxMesh.position.set(g.box[0] + .5, 0, g.box[1] + .55); } },
    /** she wants into the back room while the gate is shut: off to the crate instead (true if that is what happens) */
    towardGate(x, z) { if (open || x <= g.wall || MAP.roomAt(x, z) !== 'grot' || !room1(Math.floor(kid.pos.x), Math.floor(kid.pos.z))) return false; tapBox(); return true; },
    /** walking into (x, z) pushes the crate when it stands there */
    pushAt(x, z, dx, dz) { return x === pz.box[0] && z === pz.box[1] && push(dx, dz); },
    puzzle: () => ({ box: pz.box.slice(), open, plate: g.plate, hold: pz.hold, on: pz.on }),
    /** which room she is in (or null) */
    where: () => MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)),
    info: () => ({ coins: coins.length, chest: chest.open > 0 }),
    update(dt, time, active) {
      const inRoom = MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)); for (const d of darks) d.visible = !!inRoom;
      beam.material.opacity = .32 + Math.sin(time * .8) * .08;
      for (let i = 0; i < flames.length; i++) { const f = Math.floor(time * 6 + i) % 2, t = tex(ART.fakkel(f)); if (flames[i].userData.f !== f) { flames[i].userData.f = f; flames[i].material.map = t; flames[i].material.emissiveMap = t; } }
      for (const c of coins) { const near = Math.abs(c.x - kid.pos.x) < 3.5 && Math.abs(c.z - kid.pos.z) < 3.5; c.m.scale.x = near ? Math.max(.15, Math.abs(Math.cos(time * 2 + c.ph))) : 1; }
      if (chest.open > 0 && (chest.open -= dt) <= 0) setChest(false);
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.3; f.m.position.y = .6 + f.t * 1.6; f.m.scale.x = Math.cos(f.t * 10) * 1.2; if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
      // the crate slides, puffs back home when it got stuck, and the gate sinks once the button is down
      if (pz.slide) { const sl = pz.slide; sl.t = Math.min(1, sl.t + dt * 4.5); boxMesh.position.set(sl.x0 + (sl.x1 - sl.x0) * sl.t, 0, sl.z0 + (sl.z1 - sl.z0) * sl.t);
        if (sl.t >= 1) { pz.slide = null; if (open) { setPlate(true); sfx.click(); setTimeout(() => { sfx.tada(); burst(v3(g.gate[0][0] + .5, .5, g.gate[0][1] + 1), 14, true); pz.sink = Math.max(.001, pz.hold); }, 450); } else if (stuck()) pz.poof = 1.2; } }
      if (pz.poof > 0 && (pz.poof -= dt) <= 0) { pz.poof = 0; if (!open) { const at = Math.floor(kid.pos.x) === g.box[0] && Math.floor(kid.pos.z) === g.box[1]; if (!at) { burst(v3(boxMesh.position.x, .3, boxMesh.position.z), 8); placeBox(...g.box); boxMesh.position.set(g.box[0] + .5, 0, g.box[1] + .55); sfx.sparkle(); burst(v3(g.box[0] + .5, .3, g.box[1] + .5), 8); } else pz.poof = .5; } }
      if (pz.wob > 0) { pz.wob -= dt; boxMesh.rotation.z = Math.sin(pz.wob * 50) * .05; } else boxMesh.rotation.z = 0;
      if (pz.sink > 0) { pz.sink = Math.min(1, pz.sink + dt * .9); for (const m of bars) { m.position.y = -1.4 * pz.sink; m.rotation.z = Math.sin(time * 40) * .03 * (1 - pz.sink); } if (pz.sink >= 1) { pz.sink = 0; for (const m of bars) m.visible = false; for (const [x, z] of g.gate) M.block[I(x, z)] = 0; } }
      if (!open) {                                                               // she stands on the button: down go the bars, until she steps off
        const on = Math.floor(kid.pos.x) === g.plate[0] && Math.floor(kid.pos.z) === g.plate[1] && !(kid.lift > 0);
        if (on !== pz.on) { pz.on = on; setPlate(on); if (on) { sfx.click(); kid.squash = .4; } else sfx.pop(); }
        pz.hold = on ? Math.min(1, pz.hold + dt * 1.6) : Math.max(0, pz.hold - dt * 2.4);
        if (!pz.sink) for (const m of bars) { m.position.y = -1.4 * pz.hold; m.rotation.z = pz.hold > 0 && pz.hold < 1 ? Math.sin(time * 40) * .03 : 0; }
      }
      plateGlow.visible = !open && !pz.on; if (!open) { const k = Math.sin(time * 3); plateGlow.material.opacity = .45 + .25 * k; plateGlow.scale.setScalar(1.3 * (1 + .08 * k)); }
      if (!active) return;
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (Math.abs(c.x - kid.pos.x) < .7 && Math.abs(c.z - kid.pos.z) < .7) { coins.splice(i, 1); rising.push({ m: c.m, t: 0 }); Q.collect('munt', 3000 + c.k); sfx.chime(5 + (i % 3)); } }
      if (chest.open <= 0 && Math.hypot(chest.x - kid.pos.x, chest.z - kid.pos.z) < .9) openChest();
    },
  };
}
