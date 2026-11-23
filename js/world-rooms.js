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

export function createRooms(ctx) {
  const { THREE, scene, M, tex, canvas, makeSprite, pick, burst, kid } = ctx;
  const R = MAP.ROOMS, lights = [], flames = [], darks = [], v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  /* ---------------- walls ---------------- */
  function wallCanvas(wu, hu, kind) {
    const [c, x] = canvas(Math.max(16, Math.round(wu * 16)), Math.round(hu * 16)), w = c.width, h = c.height, r = PX.rng(wu * 31 + hu * 7 + kind.length);
    if (kind === 'grot') {
      for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) { const n = Math.sin(px * .31 + y * .07) + Math.sin(y * .23 - px * .11) + r() * .6; x.fillStyle = n > 1.2 ? '#6E6272' : n > .2 ? '#5A4E5C' : n > -.8 ? '#4A3F4C' : '#3B3240'; x.fillRect(px, y, 1, 1); }
      for (let k = 0; k < w / 6; k++) { x.fillStyle = '#7C6E80'; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 1); }
    } else {
      x.fillStyle = '#D5CCE0'; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) { x.fillStyle = '#A79DB8'; x.fillRect(0, y + 5, w, 1); const off = (y / 6 % 2) * 6; for (let px = off; px < w; px += 12) { x.fillRect(px, y, 1, 5); if (r() < .25) { x.fillStyle = r() < .5 ? '#E4DCEC' : '#C6BCD4'; x.fillRect(px + 1, y, 11, 5); x.fillStyle = '#A79DB8'; } } }
      // banners in the colours of the rainbow
      for (let k = 0, bx = 40; bx < w - 30; bx += 72, k++) { const col = PX.RAINBOW[k % 6]; x.fillStyle = '#F7C548'; x.fillRect(bx - 1, 6, 16, 2); x.fillStyle = col; x.fillRect(bx, 8, 14, 22); for (let t = 0; t < 7; t++) { x.fillRect(bx + t, 30 + Math.floor(t / 2), 1, 1); x.fillRect(bx + 13 - t, 30 + Math.floor(t / 2), 1, 1); } x.fillStyle = '#FFF3A8'; x.fillRect(bx + 5, 14, 4, 4); }
    }
    return c;
  }
  const wallMat = {}; for (const k of ['grot', 'hal']) wallMat[k] = cv => new THREE.MeshLambertMaterial({ map: tex(cv) });
  function wall(kind, x0, z0, x1, z1, h) {   // a box over whole tiles x0..x1, z0..z1
    const w = x1 - x0 + 1, d = z1 - z0 + 1, front = wallCanvas(w, h, kind), side = wallCanvas(d, h, kind), top = new THREE.MeshLambertMaterial({ color: kind === 'grot' ? '#3B3240' : '#B9B0C9' });
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wallMat[kind](side), wallMat[kind](side), top, top, wallMat[kind](front), wallMat[kind](front)]));
    m.position.set(x0 + w / 2, h / 2, z0 + d / 2); scene.add(m); return m;
  }
  function torch(x, z, y = 1.35) {
    const m = makeSprite(ART.fakkel(0), { lean: 0, shadow: false, scale: 1.1 }); m.position.set(x, y - .3, z); scene.add(m); flames.push(m);
    const l = new THREE.PointLight('#FFB45E', 0, 7, 1.4); l.position.set(x, y + .2, z + .35); scene.add(l); lights.push(l);
  }
  for (const [k, r] of Object.entries(R)) {
    const H2 = k === 'grot' ? 2.4 : 2.9;
    wall(k, r.x0 - 1, r.z0 - 2, r.x1 + 1, r.z0 - 1, H2);                                   // the back wall
    wall(k, r.x0 - 2, r.z0 - 2, r.x0 - 1, r.z1 + 1, H2); wall(k, r.x1 + 1, r.z0 - 2, r.x1 + 2, r.z1 + 1, H2);   // the side walls
    wall(k, r.x0 - 1, r.z1 + 1, r.exit[0] - 1, r.z1 + 1, .45); wall(k, r.exit[0] + 1, r.z1 + 1, r.x1 + 1, r.z1 + 1, .45);   // a low front wall, so nothing hides her
    { const dark = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0 + 9, 9, 10), new THREE.MeshBasicMaterial({ color: '#120D16' })); dark.position.set((r.x0 + r.x1 + 1) / 2, 4.5, r.z0 - 2 - 5); dark.visible = false; scene.add(dark); darks.push(dark); }   // only while she is inside: from the beach it would black out the screen   // the dark beyond the back wall: no sea to be seen from inside
    const n = k === 'grot' ? 3 : 5; for (let i = 0; i < n; i++) torch(r.x0 + (r.x1 - r.x0 + 1) * (i + .5) / n + (k === 'hal' && i === 2 ? 2.5 : 0), r.z0 + .02);
  }

  /* ---------------- the cave mouth in the forest ---------------- */
  {
    const C = MAP.CAVE, w = C.x1 - C.x0 + 1, d = C.z1 - C.z0 + 1;
    const rock = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 2.1, d), new THREE.MeshLambertMaterial({ map: tex(wallCanvas(w, 2.1, 'grot')) }))); rock.position.set(C.x0 + w / 2, 1.05, C.z0 + d / 2); scene.add(rock);
    for (const [dx, dz, s] of [[1.6, .8, 1.5], [6.8, .6, 1.3], [4.2, -.3, 1.8]]) { const b = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: '#6E6272', flatShading: true }))); b.position.set(C.x0 + dx, 2, C.z0 + dz + .6); b.scale.y = .7; scene.add(b); }
    for (const [dx, dz] of [[.6, 2.6], [8.4, 2.7]]) { const m = makeSprite(ART.propArt('fern', dx > 4 ? 2 : 1), { lean: .25 }); m.position.set(C.x0 + dx, 0, C.z0 + dz + .4); scene.add(m); }
    const mouth = makeSprite(ART.grotmond(), { lean: 0, shadow: false, scale: 1.05 }); mouth.position.set(R.grot.door[0] + .5, 0, C.z1 + 1.03); scene.add(mouth);
    mouth.userData.alpha = ART.grotmond(); mouth.userData.tap = () => { sfx.pop(); ctx.walkToTile(R.grot.door[0], R.grot.door[1]); }; pick.push(mouth);
  }

  /* ---------------- the cave: a beam of sunlight on the egg, bats that flutter off when she comes in ---------------- */
  const g = R.grot, beam = makeSprite(ART.lichtbundel(), { lean: .45, shadow: false, scale: 1.2 });
  beam.material = beam.material.clone(); beam.material.transparent = true; beam.material.opacity = .45; beam.material.depthWrite = false; beam.material.blending = THREE.AdditiveBlending; beam.material.emissiveIntensity = 1;
  beam.position.set(g.egg[0] + .5, 0, g.egg[1] + .3); scene.add(beam);
  const bats = [[22.5, 2], [26, 2.2], [30.5, 1.9], [33, 2.1]].map(([x, y], k) => { const m = makeSprite(ART.vleermuis(0), { lean: 0, shadow: false }); m.rotation.z = Math.PI; m.position.set(x, y, g.z0 + .1); scene.add(m); return { m, x, y, k, fly: -1 }; });
  let wasIn = false;
  function scareBats() { sfx.whoosh(); bats.forEach(b => { b.fly = 0; b.vx = (b.k % 2 ? 1 : -1) * (1.5 + Math.random()); }); }

  /* ---------------- the hall: coins on the floor, a chest, and the golden door to the garden ---------------- */
  const h = R.hal, coins = [];
  const COINS = [[60, 98], [62, 101], [61, 105], [66, 98], [67, 102], [73, 99], [74, 103], [78, 98], [80, 101], [79, 105], [69, 100], [71, 103]];
  function syncCoins() {
    for (const c of coins) scene.remove(c.m); coins.length = 0;
    const got = Q.quest.picked.munt || [];
    COINS.forEach(([x, z], k) => { if (got.includes(3000 + k) || M.block[M.I(x, z)]) return; const m = makeSprite(ART.coin(), { lean: .3, shadow: false }); m.position.set(x + .5, .25, z + .5); scene.add(m); coins.push({ m, x: x + .5, z: z + .5, k, ph: k * .7 }); });
  }
  const rising = [];
  const chest = { x: 72.5, z: 97.4, open: 0, m: makeSprite(ART.schatkist(false), { lean: .3, scale: 1.2 }) };
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
    dispose: off, lights, openChest,
    /** which room she is in (or null) */
    where: () => MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)),
    info: () => ({ coins: coins.length, chest: chest.open > 0, bats: bats.filter(b => b.fly >= 0).length }),
    update(dt, time, active) {
      const inRoom = MAP.roomAt(Math.floor(kid.pos.x), Math.floor(kid.pos.z)), inGrot = inRoom === 'grot'; for (const d of darks) d.visible = !!inRoom;
      if (inGrot && !wasIn) scareBats(); wasIn = inGrot;
      for (const b of bats) {
        if (b.fly < 0) { b.m.rotation.z = Math.PI + Math.sin(time * 1.3 + b.k) * .08; continue; }
        b.fly += dt; b.m.rotation.z = 0; b.m.position.set(b.x + b.vx * b.fly * 2, b.y + Math.sin(b.fly * 9) * .15 + b.fly * .2, g.z0 + .1 + b.fly * 1.2);
        if (Math.floor(b.fly * 8) % 2 !== (b.f | 0)) { b.f = Math.floor(b.fly * 8) % 2; const t = tex(ART.vleermuis(b.f)); b.m.material.map = t; b.m.material.emissiveMap = t; }
        if (b.fly > 4) { b.fly = -1; b.m.position.set(b.x, b.y, g.z0 + .1); }                // back to sleep on the ceiling
      }
      beam.material.opacity = .32 + Math.sin(time * .8) * .08;
      for (let i = 0; i < flames.length; i++) { const f = Math.floor(time * 6 + i) % 2, t = tex(ART.fakkel(f)); if (flames[i].userData.f !== f) { flames[i].userData.f = f; flames[i].material.map = t; flames[i].material.emissiveMap = t; } }
      for (const c of coins) { const near = Math.abs(c.x - kid.pos.x) < 3.5 && Math.abs(c.z - kid.pos.z) < 3.5; c.m.scale.x = near ? Math.max(.15, Math.abs(Math.cos(time * 2 + c.ph))) : 1; }
      if (chest.open > 0 && (chest.open -= dt) <= 0) setChest(false);
      for (let i = rising.length - 1; i >= 0; i--) { const f = rising[i]; f.t += dt * 1.3; f.m.position.y = .6 + f.t * 1.6; f.m.scale.x = Math.cos(f.t * 10) * 1.2; if (f.t >= 1) { scene.remove(f.m); rising.splice(i, 1); } }
      if (!active) return;
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (Math.abs(c.x - kid.pos.x) < .7 && Math.abs(c.z - kid.pos.z) < .7) { coins.splice(i, 1); rising.push({ m: c.m, t: 0 }); Q.collect('munt', 3000 + c.k); sfx.chime(5 + (i % 3)); } }
      if (chest.open <= 0 && Math.hypot(chest.x - kid.pos.x, chest.z - kid.pos.z) < .9) openChest();
    },
  };
}
