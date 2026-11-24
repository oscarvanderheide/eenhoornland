// The weather of the day (Q.weather(), a new one every morning; the first day is always sunny). It only adds things to
// play with and never gets in the way: rain brings out frogs, autumn leaves lie in piles to jump in (one hides a sleeping
// hedgehog), snow lies in heaps to stomp and there is a snowman whose hat jumps when tapped, and whose carrot nose the
// rabbit would love to have. A pile she flattened stays flat for the rest of the day (Q.kickPile). world.js hands over ctx.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createWeather(ctx) {
  const { THREE, scene, M, makeSprite, burst, bubble, kid, animals, pick } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), now = () => performance.now();
  let wx = Q.weather();

  /* ---------- falling things: rain streaks, snowflakes, leaves (around her, wherever she goes) ---------- */
  const N = 260, pos = new Float32Array(N * 6), seeds = [...Array(N)].map(() => ({ x: rnd(-12, 12), y: rnd(0, 9), z: rnd(-9, 7), s: rnd(.7, 1.3), p: rnd(0, 6) }));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#E8F6FF', transparent: true, opacity: .85, depthWrite: false });
  const rain = new THREE.LineSegments(geo, rainMat); rain.frustumCulled = false; scene.add(rain);
  const fgeo = new THREE.BufferGeometry(), fpos = new Float32Array(N * 3); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const snow = new THREE.Points(fgeo, new THREE.PointsMaterial({ color: '#FFFFFF', size: .2, transparent: true, opacity: .95, depthWrite: false })); snow.frustumCulled = false; scene.add(snow);
  let leafT = 0;

  /* ---------- piles of leaves or snow, a snowman, frogs ---------- */
  const spots = [...M.spawns.bloem, ...M.spawns.paddenstoel, ...M.spawns.wortel].filter(([x, z]) => M.reach0[M.I(x, z)]);
  const pr = PX.rng((Q.quest.seed | 0) + Q.quest.day * 313), piles = [];
  for (let k = 0; k < 8 && spots.length; k++) { const [x, z] = spots.splice(Math.floor(pr() * spots.length), 1)[0]; piles.push({ i: k, x: x + .5, z: z + .55, m: null, hog: k === 3 }); }
  function makePiles() {
    for (const p of piles) { if (p.m) { scene.remove(p.m); p.m = null; } }
    if (wx !== 'herfst' && wx !== 'sneeuw') return;
    for (const p of piles) { if (Q.pileGone(p.i)) continue; p.m = makeSprite(wx === 'sneeuw' ? ART.sneeuwhoop() : ART.bladerhoop(p.i), { lean: .5, shadow: false, scale: 1.1 }); p.m.position.set(p.x, .01, p.z); p.m.userData.alpha = null; scene.add(p.m); }
  }
  function kick(p, big) {
    if (!p.m || !Q.kickPile(p.i)) return; scene.remove(p.m); p.m = null; sfx.brush(); if (big) sfx.boing();
    if (wx === 'herfst') ctx.life.leaves(p.x, p.z - .1, big ? 16 : 9, .5);
    else for (let k = 0; k < (big ? 14 : 8); k++) ctx.life.bit(PX.gridSprite(2, 2, () => '#FFFFFF', { outline: false, key: 'snowbit' }), p.x + rnd(-.3, .3), .2, p.z + .1, { vx: rnd(-2, 2), vy: rnd(2, 4.5), g: 9, life: .8 });
    if (p.hog && wx === 'herfst') {                                              // somebody was sleeping in there
      const h = animals.find(a => a.name === 'Egel'); if (h && !h.held && !h.fly && !h.friend) { h.pos.set(p.x, 0, p.z); h.path = []; h.hop = 1; h.wait = 3; setTimeout(() => bubble(h, 'Hè? Ik sliep!'), 300); }
    }
  }
  // the snowman on the village square
  const sp = ctx.nearestWalkable(MAP.FOUNT.cx - 3, MAP.FOUNT.cz + 2.5) || [MAP.FOUNT.cx - 3, MAP.FOUNT.cz + 3], man = { x: sp[0] + .5, z: sp[1] + .4, taps: 0, nose: true, hatT: 0, m: null };
  man.m = makeSprite(ART.sneeuwpop(true, 0), { lean: .3, scale: 1.25 }); man.m.position.set(man.x, 0, man.z); man.m.material = man.m.material.clone(); scene.add(man.m);
  const setMan = () => { const t = ctx.tex(ART.sneeuwpop(man.nose, man.hatT > 0 ? 1 : 0)); man.m.material.map = t; man.m.material.emissiveMap = t; man.m.material.needsUpdate = true; };
  man.m.userData.tap = () => {
    if (Math.hypot(man.x - kid.pos.x, man.z - kid.pos.z) > 2.2) { ctx.approach(Math.floor(man.x), Math.floor(man.z), () => man.m.userData.tap()); return; }
    man.taps++; man.hatT = .35; man.wob = 1; setMan(); sfx.boing();
    if (man.nose && man.taps % 3 === 0) {                                        // the carrot nose falls off, and the dog comes running for it
      man.nose = false; setMan(); ctx.life.bit(PX.carrot(), man.x + .25, 1.1, man.z + .1, { vx: .8, vy: 2, g: 9, bounce: 1, life: 2.6 }); sfx.pop();
      const r = animals.filter(a => a.name === 'Hondje' && !a.held && !a.fly && !a.friend && !a.cart).sort((a, b) => Math.hypot(a.pos.x - man.x, a.pos.z - man.z) - Math.hypot(b.pos.x - man.x, b.pos.z - man.z))[0];
      if (r) { r.wait = 6; r.path = [new THREE.Vector3(man.x + .8, 0, man.z + .2)]; r.speed = 2.6; setTimeout(() => { bubble(r, '', PX.carrot()); sfx.munch(); r.hop = 1; r.speed = .9; }, 2200); }
      setTimeout(() => { man.nose = true; setMan(); }, 15000);                   // and a new one grows back (magic)
    }
  };
  pick.push(man.m);
  // frogs come out when it rains
  const frogs = [[26, 45], [33, 39], [22, 41]].map(([x, z], k) => { const art = ART.kikker('sit'); const c = ctx.animal({ idle: art, w1: ART.kikker('jump'), w2: art }, { name: 'Kikker', say: ['Kwaak!', 'Kwaak kwaak!'], sound: 'boing', blobW: .4, flippable: true }, [x - 3, z - 2, x + 3, z + 2]); c.frog = true; return c; });

  // on a snowy day the ground is white (water stays blue): a lighter copy of the ground texture, made once
  const sunMap = ctx.groundMesh.material.map; let snowMap = null;
  function snowGround(on) {
    if (on && !snowMap) {
      const src = ctx.groundCanvas, c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0);
      const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
      const stop = MAP.OUT_H * (c.height / MAP.H) * c.width * 4;   // only the islands: no snow in the cave or the castle hall
      for (let i = 0; i < stop; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; if (b > r + 25 && b >= g) continue; const k = .62 + ((i >> 2) * 2654435761 % 7) * .015; d[i] = r + (244 - r) * k; d[i + 1] = g + (248 - g) * k; d[i + 2] = b + (255 - b) * k; }
      x.putImageData(img, 0, 0); snowMap = ctx.tex(c, false); snowMap.colorSpace = sunMap.colorSpace; snowMap.anisotropy = sunMap.anisotropy; snowMap.minFilter = sunMap.minFilter; snowMap.generateMipmaps = true;
    }
    const want = on ? snowMap : sunMap; if (ctx.groundMesh.material.map !== want) { ctx.groundMesh.material.map = want; ctx.groundMesh.material.needsUpdate = true; }
  }
  function sync() {
    wx = Q.weather(); snowGround(wx === 'sneeuw'); rain.visible = wx === 'regen'; snow.visible = wx === 'sneeuw'; man.m.visible = wx === 'sneeuw';
    for (const f of frogs) { f.g.visible = wx === 'regen'; if (!f.g.visible && ctx.life.carrying() === f) ctx.life.setDown(); }
    makePiles();
  }
  const off = Q.on(type => { if (type === 'day') sync(); });
  sync();

  return {
    dispose() { off(); scene.remove(rain); scene.remove(snow); geo.dispose(); fgeo.dispose(); if (snowMap) snowMap.dispose(); },
    info: () => ({ wx, piles: piles.filter(p => p.m).length, frogs: frogs.filter(f => f.g.visible).length, snowman: man.m.visible, nose: man.nose, taps: man.taps }),
    piles: () => piles.map(p => [p.x, p.z, !!p.m]), tapSnowman: () => man.m.userData.tap(), sync,
    /** she jumped: a pile under her feet goes flying */
    stomp() { for (const p of piles) if (p.m && Math.hypot(p.x - kid.pos.x, p.z - kid.pos.z) < .9) kick(p, true); },
    update(dt, time, active) {
      const cx = kid.pos.x, cz = kid.pos.z, inside = cz >= MAP.ROCK_Z;   // indoors it does not rain
      rain.visible = wx === 'regen' && !inside; snow.visible = wx === 'sneeuw' && !inside;
      if (wx === 'regen') { for (let i = 0; i < N; i++) { const s = seeds[i]; s.y -= dt * 14 * s.s; if (s.y < 0) { s.y += 9; s.x = rnd(-12, 12); s.z = rnd(-9, 7); } const x = cx + s.x, z = cz + s.z; pos.set([x, s.y, z, x - .03, s.y + .45, z], i * 6); } geo.attributes.position.needsUpdate = true; }
      if (wx === 'sneeuw') { for (let i = 0; i < N; i++) { const s = seeds[i]; s.y -= dt * 1.1 * s.s; if (s.y < 0) { s.y += 9; s.x = rnd(-12, 12); s.z = rnd(-9, 7); } fpos.set([cx + s.x + Math.sin(time * s.s + s.p) * .4, s.y, cz + s.z], i * 3); } fgeo.attributes.position.needsUpdate = true; }
      if (wx === 'herfst' && active && !inside && (leafT -= dt) < 0) { leafT = rnd(.25, .6); const x = cx + rnd(-8, 8), z = cz + rnd(-6, 4); ctx.life.bit(ART.leaf(2 + Math.floor(Math.random() * 2) % 3), x, 4, z, { vy: 0, g: .6, sway: rnd(2, 4), spin: rnd(-2, 2), life: 6 }); }
      if (man.hatT > 0 && (man.hatT -= dt) <= 0) setMan();
      if (man.wob > 0) { man.wob = Math.max(0, man.wob - dt * 1.6); man.m.rotation.z = Math.sin(man.wob * 22) * .12 * man.wob; }
      if (active && !ctx.mount()) for (const p of piles) if (p.m && kid.moving && kid.hop <= 0 && Math.hypot(p.x - cx, p.z - cz) < .55) kick(p, false);   // walking into a pile
    },
  };
}
