// Everything the bigger island adds on top of world.js: the sea at the beach, fences, pier, castle, extra animals,
// things to collect, the hidden egg, the unicorn meadow and the companion's reactions.
// world.js hands over a small toolbox (ctx); this file never reaches into world.js internals beyond that.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as WILD from './art-wild.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { state } from './state.js';
import { sfx, speak } from './audio.js';

export function createExtras(ctx) {
  const { THREE, scene, M, tex, canvas, spriteGeom, spriteMat, makeSprite, makeChar, animal, animals, chars, pick, burst, bubble, waterUniforms, windowGlows, kid, uni } = ctx;
  const { W, H } = MAP;
  const r = PX.rng(4711);
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  /* ---------------- meadow fence ---------------- */
  {
    const P = MAP.PEN, n = P.z0 + .5;
    const g0 = Math.min(...P.gate.map(g => g[0])), g1 = Math.max(...P.gate.map(g => g[0]));
    const [board, brush] = canvas(16, 14);
    const paint = (color, x, y, w, h) => { brush.fillStyle = color; brush.fillRect(x, y, w, h); };
    for (const y of [4, 9]) {
      paint('#BC9D88', 0, y, 16, 3);
      paint('#F3DEBD', 0, y, 16, 2);
    }
    paint('#C8AC94', 6, 2, 4, 12);
    paint('#FFF3D8', 6, 2, 3, 11);
    paint('#FFF3D8', 7, 1, 2, 1);
    for (const y of [5, 10]) paint('#BA9782', 7, y, 1, 1);
    const geo = new THREE.PlaneGeometry(1, 14 / 16);
    const mat = new THREE.MeshLambertMaterial({ map: tex(board), alphaTest: .5, side: THREE.DoubleSide });
    function panel(x, z, side) {
      const m = shadowed(new THREE.Mesh(geo, mat));
      m.position.set(x, 7 / 16, z);
      if (side) m.rotation.y = Math.PI / 2;
      scene.add(m);
    }
    for (let x = P.x0; x <= P.x1; x++) {
      panel(x + .5, P.z1 + .5, false);
      if (x < g0 || x > g1) panel(x + .5, n, false);
    }
    for (let z = P.z0; z < P.z1; z++) {
      panel(P.x0 + .5, z + 1, true);
      panel(P.x1 + .5, z + 1, true);
    }
    // seen from the south the side panels are edge-on: real posts along them so the sides still read as a fence
    const sidePosts = []; for (let z = P.z0; z <= P.z1; z++) for (const x of [P.x0, P.x1]) sidePosts.push([x + .5, z + .5]);
    const pi = shadowed(new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .82, .16), lam('#FFF3D8'), sidePosts.length)), pd = new THREE.Object3D();
    sidePosts.forEach(([x, z], i) => { pd.position.set(x, .41, z); pd.updateMatrix(); pi.setMatrixAt(i, pd.matrix); }); scene.add(pi);
    // gate arch with a heart: it stands open, this is where the unicorns of earlier adventures live
    const pink = lam('#FF7EB6');
    for (const x of [g0 - .5, g1 + 1.5]) {
      const p = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.24, 1.25, .24), pink)); p.position.set(x, .625, n); scene.add(p);
      const heart = makeSprite(PX.heart(), { lean: .2, shadow: false, scale: 1.1 }); heart.position.set(x, 1.25, n + .02); scene.add(heart);
    }
  }

  /* ---------------- castle ---------------- */
  {
    const C = MAP.CASTLE, g = new THREE.Group(); g.position.set(C.x + C.w / 2, 0, C.z + C.d / 2);
    const stone = (wu, hu, front) => {
      const [c, x] = canvas(Math.round(wu * 16), Math.round(hu * 16)), w = c.width, h = c.height, rr = PX.rng(wu * 100 + hu);
      x.fillStyle = '#E4DFF0'; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) { x.fillStyle = '#B9B2CF'; x.fillRect(0, y + 5, w, 1); const off = (y / 6 % 2) * 6; for (let px = off; px < w; px += 12) { x.fillRect(px, y, 1, 5); if (rr() < .3) { x.fillStyle = rr() < .5 ? '#F2EFF8' : '#D3CDE4'; x.fillRect(px + 1, y, 11, 5); x.fillStyle = '#B9B2CF'; } } }
      const win = (cx, wy) => { x.fillStyle = '#8F8AA3'; x.fillRect(cx - 4, wy, 8, 13); x.fillRect(cx - 3, wy - 1, 6, 1); x.fillStyle = '#3D2B6B'; x.fillRect(cx - 3, wy + 1, 6, 11); x.fillRect(cx - 2, wy, 4, 1); x.fillStyle = '#8FD3FF'; x.fillRect(cx - 2, wy + 2, 2, 4); return [cx / 16, (h - wy - 6) / 16]; };
      const wins = [];
      if (front) {
        const cx = w / 2;
        for (let y = h - 34; y < h; y++) for (let px = -14; px <= 14; px++) { const top = y - (h - 34); if (top < 14 && px * px + (14 - top) ** 2 > 196) continue; const edge = Math.abs(px) > 11 || (top < 14 && px * px + (14 - top) ** 2 > 130); x.fillStyle = edge ? '#F7C548' : (Math.abs(px) < 1 ? '#5E3A24' : ((px + 20) % 6 === 0 ? '#6E4630' : '#A0704E')); x.fillRect(cx + px, y, 1, 1); }
        x.fillStyle = '#F7C548'; x.fillRect(cx - 5, h - 16, 2, 3); x.fillRect(cx + 3, h - 16, 2, 3);
        for (const f of [.16, .34, .66, .84]) wins.push(win(Math.round(w * f), 10));
      } else for (let k = 1; k < wu; k += 2) wins.push(win(k * 16, 10));
      return { c, wins };
    };
    const hW = 2.7, f = stone(C.w, hW, true), s = stone(C.d, hW, false), mat = cv => new THREE.MeshLambertMaterial({ map: tex(cv) }), topM = lam('#D3CDE4');
    const walls = shadowed(new THREE.Mesh(new THREE.BoxGeometry(C.w, hW, C.d), [mat(s.c), mat(s.c), topM, topM, mat(f.c), mat(s.c)])); walls.position.y = hW / 2; g.add(walls);
    for (const [wx, wy] of f.wins) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.36, .7), new THREE.MeshBasicMaterial({ color: '#FFD48A', transparent: true, opacity: 0, depthWrite: false })); m.position.set(wx - C.w / 2, wy, C.d / 2 + .01); g.add(m); windowGlows.push(m); }
    // battlements
    const cren = []; for (let x = -C.w / 2 + .3; x <= C.w / 2 - .25; x += .8) { cren.push([x, C.d / 2 - .2]); cren.push([x, -C.d / 2 + .2]); } for (let z = -C.d / 2 + 1; z <= C.d / 2 - .9; z += .8) { cren.push([-C.w / 2 + .2, z]); cren.push([C.w / 2 - .2, z]); }
    const ci = shadowed(new THREE.InstancedMesh(new THREE.BoxGeometry(.42, .36, .42), lam('#EDEAF6'), cren.length)); const d = new THREE.Object3D(); cren.forEach(([x, z], i) => { d.position.set(x, hW + .18, z); d.updateMatrix(); ci.setMatrixAt(i, d.matrix); }); g.add(ci);
    // keep with a pink roof
    const k = stone(4, 2, false), keep = shadowed(new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3), [mat(k.c), mat(k.c), topM, topM, mat(k.c), mat(k.c)])); keep.position.set(0, hW + 1, -.6); g.add(keep);
    const kr = shadowed(new THREE.Mesh(new THREE.ConeGeometry(3, 1.9, 4), lam('#E86A9A'))); kr.rotation.y = Math.PI / 4; kr.scale.set(1, 1, .78); kr.position.set(0, hW + 2.95, -.6); g.add(kr);
    // four towers with blue hats and little flags
    const tw = stone(6, 4, false), tt = tex(tw.c); tt.wrapS = THREE.RepeatWrapping;
    const pennant = PX.sprite(['k....', 'krrr.', 'krrrr', 'krrr.', 'k....', 'k....', 'k....'], { k: '#5E4A3A', r: '#FFD43B' });
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const x = sx * (C.w / 2 - .85), z = sz * (C.d / 2 - .85), hT = sz > 0 ? 3.7 : 4.4;
      const cyl = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, hT, 14), new THREE.MeshLambertMaterial({ map: tt }))); cyl.position.set(x, hT / 2, z); g.add(cyl);
      const hat = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.7, 14), lam(sz > 0 ? '#6A7FD6' : '#9B72E8'))); hat.position.set(x, hT + .85, z); g.add(hat);
      const fl = makeSprite(pennant, { lean: 0, shadow: false, scale: 1.1 }); fl.position.set(x, hT + 1.6, z); g.add(fl);
    }
    // tap the castle and somebody looks out of a window (world-toys.js)
    // the wall with the gate is the way in; tap a tower or the roof and somebody looks out (world-toys.js)
    g.traverse(o => { if (o.isMesh && !windowGlows.includes(o)) { if (o === walls) o.userData.building = ctx.castle; else o.userData.tap = h => ctx.toys && ctx.toys.peek(h); pick.push(o); } });
    scene.add(g);
  }

  /* ---------------- loose decoration (never blocks) ---------------- */
  function scatter(art, n, ok, scale = 1) {
    const inst = new THREE.InstancedMesh(spriteGeom(art.width, art.height), spriteMat(tex(art)), n); inst.receiveShadow = true;
    const d = new THREE.Object3D(); let k = 0, guard = 0;
    while (k < n && guard++ < n * 40) { const x = 4 + r() * (W - 8), z = 4 + r() * (H - 8); if (!ok(Math.floor(x), Math.floor(z), z)) continue; d.position.set(x, 0, z); d.rotation.set(-.3, 0, 0); d.scale.setScalar(scale); d.updateMatrix(); inst.setMatrixAt(k++, d.matrix); }
    inst.count = k; scene.add(inst);
  }
  const g = (x, z) => M.ground[M.I(x, z)];
  scatter(ART.propArt('fern', 1), 90, (x, z) => M.free(x, z) && g(x, z) === MAP.FO); scatter(ART.propArt('fern', 2), 90, (x, z) => M.free(x, z) && g(x, z) === MAP.FO);
  const beach = (x, z) => M.free(x, z) && g(x, z) === MAP.SA && (M.zone[M.I(x, z)] === 'strand' || M.zone[M.I(x, z)] === 'eiland');
  scatter(ART.starfish(), 9, beach);                                              // (no loose shells for show: every shell on the beach can be picked up)
  for (const art of [ART.ISLE.madelief(), ART.ISLE.klaproos(), ART.ISLE.korenbloem()]) scatter(art, 45, (x, z) => M.free(x, z) && g(x, z) === MAP.GR && M.zone[M.I(x, z)] === 'wei');   // the flower meadow: daisies, poppies, cornflowers
  // the ring of big mushrooms in the forest plays music: every one is a note, tap them (or walk into them)
  const shrooms = [];
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2, m = makeSprite(ART.bigMushroom(), { lean: .25 }), sh = { m, t: 1, x: MAP.NOOK.cx + Math.cos(a) * 1.7, z: MAP.NOOK.cz + Math.sin(a) * 1.4, near: false };
    m.position.set(sh.x, 0, sh.z); scene.add(m); m.userData.alpha = ART.bigMushroom();
    sh.play = () => { sh.t = 0; sfx.chime([0, 2, 4, 5, 7, 4, 2, 5, 3][k]); const n = makeSprite(ART.note(k), { lean: 0, shadow: false }); n.position.set(sh.x, .9, sh.z + .1); scene.add(n); flying.push({ m: n, t: 0 }); };
    m.userData.tap = sh.play; pick.push(m); shrooms.push(sh);
  }

  /* ---------------- more animals ---------------- */
  const one = cv => ({ idle: cv, w1: cv, w2: cv });
  animal(one(ART.deer()), { name: 'Hertje', say: ['Hallo!', 'Wat een bloemen!'], sound: 'boing', blobW: .7, flippable: true }, [74, 44, 82, 50]);
  // every island has animals of its own: nobody lives on two islands
  animal(one(PX.hedgehog()), { name: 'Egel', say: ['Snuf snuf!'], sound: 'pop', blobW: .55, flippable: true }, [36, 12, 46, 16]);
  animal(one(ART.ISLE.uil()), { name: 'Uil', say: ['Oehoe!', 'Oehoe oehoe!'], sound: 'pop', blobW: .45 }, [19, 14, 25, 17]);
  animal({ idle: WILD.eekhoorn(0), w1: WILD.eekhoorn(1), w2: WILD.eekhoorn(0) }, { name: 'Eekhoorn', say: ['Kwiek kwiek!'], sound: 'squeak', blobW: .45, flippable: true }, [53, 15, 59, 18]);   // lives in the treehouse oak
  animal({ idle: WILD.otter(0), w1: WILD.otter(0), w2: WILD.otter(0) }, { name: 'Otter', say: ['Pieuw!'], sound: 'squeak', blobW: .5, flippable: true }, [90, 40, 99, 42]);   // lives by the waterfall pool
  animal({ idle: WILD.varken(0), w1: WILD.varken(0), w2: WILD.varken(0) }, { name: 'Varken', say: ['Knor knor!'], sound: 'boing', blobW: .5, flippable: true }, [22, 56, 33, 60]).baseScale = .74;   // the pig by the mud in the village's south
  animal(one(ART.ISLE.schaap()), { name: 'Schaap', say: ['Bèèè!', 'Bèè bèè!'], sound: 'boing', blobW: .7, flippable: true }, [60, 36, 66, 44]);
  animal(one(ART.crab()), { name: 'Krab', say: ['Klik klak!', 'Knip knip!'], sound: 'pop', blobW: .5 }, [48, 69, 58, 74]);
  animal(one(PX.bunny()), { name: 'Konijn', say: ['Hop hop!'], sound: 'boing', blobW: .5 }, [122, 60, 134, 68]);
  for (let k = 0; k < 3; k++) animal({ idle: WILD.flamingo(0), w1: WILD.flamingo(0), w2: WILD.flamingo(0) }, { name: 'Flamingo', say: ['Pink!'], sound: 'pop', blobW: .45, flippable: true }, [125, 75, 136, 81]);   // by the lagoon
  animal(one(ART.ISLE.papegaai()), { name: 'Papegaai', say: ['Hallo hallo!', 'Kraaa! Mooi!'], sound: 'pop', blobW: .45, flippable: true }, [126, 63, 138, 69]);
  animal(one(ART.ISLE.pauw()), { name: 'Pauw', say: ['Kijk mijn staart!', 'Mi-auw!'], sound: 'sparkle', blobW: .7, flippable: true }, [86, 15, 96, 18]);
  animal({ idle: WILD.schildpad(0), w1: WILD.schildpad(1), w2: WILD.schildpad(0) }, { name: 'Schildpad', say: ['...'], sound: 'pop', blobW: .8, flippable: true }, [51, 79, 66, 84]);   // the sea turtle of the south beach
  animal(one(ART.gull()), { name: 'Meeuw', say: ['Kraa kraa!'], sound: 'pop', blobW: .45, flippable: true }, [62, 69, 74, 74]);
  animal(one(ART.dragon()), { name: 'Draakje', say: ['Rawr! Hihi!', 'Ik ben een lief draakje!', 'Ik pas op het kasteel!'], sound: 'boing', blobW: .7 }, [78, 11, 90, 14]);

  /* ---------------- things to collect ---------------- */
  const itemMats = new Map();
  function itemMesh(art) {
    if (!itemMats.has(art)) itemMats.set(art, spriteMat(tex(art)));
    const m = new THREE.Mesh(spriteGeom(art.width, art.height), itemMats.get(art)); m.rotation.x = -.3; m.receiveShadow = true; return m;
  }
  let items = [];
  function syncItems() {
    for (const it of items) scene.remove(it.mesh); items = [];
    for (const type of Object.keys(M.spawns)) {
      const spots = M.spawns[type];
      for (const idx of Q.activeSpawns(type, spots.length)) {
        const [x, z] = spots[idx], mesh = itemMesh(ART.itemArt(type, idx));
        const it = { type, idx, mesh, x: x + .5, z: z + .55, ph: (x * 7 + z * 13) % 6, float: type === 'munt' || type === 'diamant' };
        mesh.position.set(it.x, 0, it.z); scene.add(mesh); items.push(it);
      }
    }
  }
  /** something that was not lying there this morning: an apple shaken out of a tree. `idx` is remembered as picked for today. */
  function dropItem(type, idx, x, z) {
    if (items.some(it => it.type === type && it.idx === idx) || (Q.quest.picked[type] || []).includes(idx)) return false;
    const mesh = itemMesh(ART.itemArt(type, idx)), it = { type, idx, mesh, x, z, ph: 0, float: false, born: 1 }; mesh.position.set(x, 0, z); scene.add(mesh); items.push(it); return true;
  }
  const flying = [];
  function pickUp(it) {
    scene.remove(it.mesh); items.splice(items.indexOf(it), 1);
    const m = itemMesh(ART.itemArt(it.type, it.idx)); m.position.set(it.x, .3, it.z); scene.add(m); flying.push({ m, t: 0 });
    Q.collect(it.type, it.idx);
    if (it.type === 'munt') { sfx.chime(5); return; }
    sfx.munch(); kid.hop = .5; burst(kid.pos, 5, true); if (uni.g.visible && ctx.mount() !== 'uni') uni.hop = .6;   // an apple from a tree: crunch, eaten on the spot
  }

  /* ---------------- the hidden egg ---------------- */
  let eggMesh = null, eggPos = null, peepT = 0, sparkT = 0;
  const glowTex = (() => { const [c, x] = canvas(32, 32), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,245,200,1)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const eggGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFF1B0', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); eggGlow.visible = false; scene.add(eggGlow);
  function eggSpot() { const list = M.eggSpots[Q.quest.zone] && M.eggSpots[Q.quest.zone].length ? M.eggSpots[Q.quest.zone] : M.eggSpots.bos; return list[Q.quest.spot % list.length]; }
  function syncEgg() {
    if (eggMesh) { scene.remove(eggMesh); eggMesh = null; } eggGlow.visible = false; eggPos = null;
    if (Q.quest.stage !== 'zoek') return;
    const [x, z] = eggSpot(); eggPos = new THREE.Vector3(x + .5, 0, z + .5);
    eggMesh = makeSprite(ART.egg(Q.kind()), { lean: .3 }); eggMesh.position.copy(eggPos); scene.add(eggMesh);
    eggGlow.position.set(eggPos.x, .9, eggPos.z + .1); eggGlow.visible = true;
  }
  function findEgg() {
    const p = eggPos.clone(); if (!Q.foundEgg()) return;
    uni.pos.copy(p); uni.hop = 1; sfx.tada(); burst(p, 12, true); bubble(kid, '!', ART.egg(Q.kind()));
    speak('Jullie hebben het ei gevonden! Het bestaat echt! Wat een mooi ' + Q.kind().name + '! ' + Q.goalText());
  }

  /* ---------------- the fallen star that hatches the egg, and the rainbow fruit ---------------- */
  // Both only lie there while they are wanted. The star flies to the egg, the egg shakes, and out comes the unicorn.
  const glowAt = (col) => { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); g.visible = false; scene.add(g); return g; };
  const star = { mesh: makeSprite(ART.warmItem(Q.quest.kind), { lean: .3, shadow: false, scale: 1.2 }), glow: glowAt('#FFF1B0'), pos: null }, fruit = { mesh: makeSprite(ART.foodItem(Q.quest.kind), { lean: .3, shadow: false, scale: 1.2 }), glow: glowAt('#FFD0F0'), pos: null };
  for (const o of [star, fruit]) { o.mesh.material = o.mesh.material.clone(); o.mesh.material.emissiveIntensity = .8; o.mesh.visible = false; ctx.seeThrough(o.mesh); scene.add(o.mesh); }
  let hatching = false;
  const starSpot = () => M.starSpots[Q.quest.spot % M.starSpots.length];
  // The warm thing is shy: when she comes close it giggles and hops away to another spot in the meadow, twice, and the
  // third time it is out of breath and lets itself be caught. The fruit hangs in the rainbow tree: shake the tree (tap it,
  // jump next to it, throw something at it) and on the second shake it drops.
  const TREE = MAP.RAINBOW_TREE, inTree = new THREE.Vector3(TREE[0] + .5, 1.55, TREE[1] + .62), underTree = new THREE.Vector3(TREE[0] + 1.5, 0, TREE[1] + 1.5);
  function syncGoals() {
    const st = Q.quest.stage;
    if (st === 'ei') { const [x, z] = starSpot(); star.pos = new THREE.Vector3(x + .5, 0, z + .5); star.hops = 0; star.hop = null; } else star.pos = null;
    if (st === 'baby') { fruit.pos = inTree.clone(); fruit.shakes = 0; fruit.fall = null; } else fruit.pos = null;
    for (const o of [star, fruit]) { o.mesh.visible = o.glow.visible = !!o.pos; if (o.pos) { o.mesh.position.copy(o.pos); o.glow.position.set(o.pos.x, .8, o.pos.z + .1); } }
  }
  /** the rainbow tree was shaken (world-life.js tapProp) */
  function shakeTree() {
    if (!fruit.pos || fruit.fall || fruit.pos.y < 1) return;
    fruit.shakes++; sfx.boing();
    if (fruit.shakes >= 2) { fruit.fall = { t: 0, from: fruit.pos.clone() }; sfx.whoosh(); setTimeout(() => { sfx.pop(); bubble(kid, '!', ART.foodItem(Q.quest.kind)); }, 650); }
    else bubble(kid, '', ART.foodItem(Q.quest.kind));
  }
  function hopStar() {
    const cur = star.pos, spots = M.starSpots.map(([x, z]) => new THREE.Vector3(x + .5, 0, z + .5)).filter(p => p.distanceTo(cur) > 2.5).sort((a, b) => a.distanceTo(cur) - b.distanceTo(cur));
    const to = spots.find(p => p.distanceTo(kid.pos) > 4) || spots[0]; if (!to) return false;
    star.hop = { t: 0, from: cur.clone(), to }; star.hops++; sfx.sparkle(); sfx.boing(); bubble(kid, 'Hihi!', ART.warmItem(Q.quest.kind)); return true;
  }
  // Both big moments are shown full-screen from the side (js/cutscene.js, played by main.js through ctx.show, which also
  // saves the new stage first); back in the world she is simply there, and after the fruit the girl is already riding.
  function startHatch() {
    if (hatching) return; hatching = true; const kindDef = Q.kind();
    ctx.show('hatch', { kindDef }).then(() => { hatching = false; syncGoals(); if (!Q.hasUnicorn()) return; uni.hop = 1; sfx.tada(); burst(uni.pos, 16, true); bubble(uni, state.uni.name + '!', PX.heart()); speak('Dit is ' + state.uni.name + '! ' + Q.goalText()); });
  }
  function feed() {
    if (hatching) return; hatching = true;
    ctx.show('feed', {}).then(() => { hatching = false; syncGoals(); if (!Q.canRide()) return; uni.pos.copy(kid.pos); ctx.setMount('uni'); burst(kid.pos, 14, true); speak(Q.goalText()); });
  }

  /* ---------------- the unicorn meadow ---------------- */
  const P = MAP.PEN, penHome = [P.x0 + 1, P.z0 + 1, P.x1 - 1, P.z1 - 1], gate = new THREE.Vector3((P.gate[0][0] + P.gate[1][0] + 1) / 2, 0, P.z0 + .5), penMid = new THREE.Vector3((P.x0 + P.x1 + 1) / 2, 0, (P.z0 + P.z1 + 1) / 2);
  let herd = [];
  function removeChar(c) {
    scene.remove(c.g); for (const arr of [chars, animals]) { const i = arr.indexOf(c); if (i >= 0) arr.splice(i, 1); }
    const i = pick.indexOf(c.mesh); if (i >= 0) pick.splice(i, 1); for (const k in c.texs) c.texs[k].dispose(); c.mesh.material.dispose();
  }
  function syncHerd(arriving) {
    for (const c of herd) removeChar(c); herd = [];
    const list = Q.quest.herd.slice(-8);
    list.forEach((u, i) => {
      const b = { baby: true }, f = { idle: ART.uniSprite(u, 'idle', false, b), w1: ART.uniSprite(u, 'w1', false, b), w2: ART.uniSprite(u, 'w2', false, b), blink: ART.uniSprite(u, 'idle', true, b) };
      const c = animal(f, { flippable: true, name: u.name, say: ['Ik ben ' + u.name + '!', 'Hihihi!', 'Kom je spelen?'], sound: 'sparkle', blobW: .9 }, penHome);
      c.speed = 1.1; c.uniKind = u.kind || 'bos'; c.look = u; if (arriving && i === list.length - 1) c.pos.set(gate.x, 0, P.z0 + 1.5);
      herd.push(c);
    });
  }
  let greeted = false;                                                           // they know her: when she comes to the fence the nearest one looks up

  /* ---------------- the race arch next to the meadow: ride a unicorn against the others (act-race.js) ---------------- */
  // Nobody has to know a race exists: once there is a unicorn to ride, two others wait at the start line under the arch,
  // and walking (or riding) through the arch is the start. Before that the arch is just a pretty gate on the path.
  const race = { armed: true, waiting: [] };
  {
    const [x, z] = MAP.RACE, art = ART.raceArch(), m = makeSprite(art, { lean: .25, scale: 1.2 }); m.position.set(x, 0, z + .3); m.userData.alpha = art; scene.add(m);
    const go = () => { if (Q.raceMounts().length) ctx.onEnter && ctx.onEnter('race'); else { sfx.pop(); bubble(kid, '', Q.quest.stage === 'baby' ? ART.foodItem(Q.quest.kind) : ART.egg(Q.kind())); } };   // no unicorn to ride yet: this is what is missing
    m.userData.tap = () => { sfx.pop(); if (Math.hypot(x - kid.pos.x, z - kid.pos.z) < 1.8) go(); else ctx.walkThen(Math.floor(x), Math.floor(z), () => { race.armed = false; go(); }); }; pick.push(m);
    race.go = go; race.x = x; race.z = z;
    // the two rivals of the race (act-race.js EXTRA), waiting on either side of the start
    [[{ body: '#DCCBFA', mane: '#4FA3F7', horn: '#F7C548' }, -1.25], [{ body: '#FFF0A6', mane: '#FF7EB6', horn: '#D3DAE6' }, 1.25]].forEach(([look, dx]) => {
      const a = ART.uniSprite(look, 'idle', false, { baby: true }), s = makeSprite(ART.hd(a), { lean: .3, scale: .5 }); s.position.set(x + dx, 0, z + .15); if (dx > 0) s.scale.x = -.5; s.visible = false; scene.add(s);
      s.userData.alpha = ART.hd(a); s.userData.tap = () => { sfx.sparkle(); race.hop = { s, t: 0 }; m.userData.tap(); }; pick.push(s); race.waiting.push(s);
    });
  }


  function tapCompanion(c) {
    if (Q.canRide()) { const off = ctx.mount() === 'uni'; ctx.setMount(off ? null : 'uni'); if (off && Math.random() < .2) setTimeout(() => ctx.life.burp(c), 450); return; }   // now and then a burp when she gets off   // tap her to climb on, tap again to get off
    c.hop = 1; sfx.sparkle(); burst(c.pos, 9, true);
    if (Q.quest.stage === 'ei') { bubble(c, 'Brr!', ART.warmItem(Q.quest.kind)); speak('Tik tik! Er beweegt iets in het ei! ' + Q.goalText()); }
    else if (Math.random() < .25) ctx.life.burp(c);
    else { bubble(c, '', ART.foodItem(Q.quest.kind)); speak('Hihihi! Ik ben ' + state.uni.name + '! ' + Q.goalText()); }
  }
  const off = Q.on(type => {
    if (type === 'stage') { ctx.refreshUnicorn(); syncEgg(); syncGoals(); }
    if (type === 'day') { syncItems(); syncHerd(false); }
    if (type === 'herd') syncHerd(true);
  });
  syncItems(); syncEgg(); syncGoals(); syncHerd(false);

  return {
    tapCompanion, eggSpot, dropItem, shakeTree, dispose: off,
    info: () => ({ items: items.length, egg: eggPos && [eggPos.x, eggPos.z], star: star.pos && [star.pos.x, star.pos.z], starHops: star.hops, starMoving: !!star.hop, fruit: fruit.pos && [fruit.pos.x, fruit.pos.z], fruitInTree: !!fruit.pos && fruit.pos.y > 1, gate: [gate.x, gate.z], herd: herd.length, hatching: !!hatching }),
    items: () => items.map(it => ({ type: it.type, x: it.x, z: it.z })),
    /** active: the child can play (not paused, start screen gone) */
    update(dt, time, active) {
      // things lie still until she comes close: then a coin turns to catch the light and a flower nods
      for (const it of items) {
        const close = Math.abs(it.x - kid.pos.x) < 3.2 && Math.abs(it.z - kid.pos.z) < 3.2;
        if (it.born > 0) { it.born = Math.max(0, it.born - dt * 3); it.mesh.scale.setScalar(1 - it.born); }
        else if (it.float) { it.mesh.position.y = .28; it.mesh.scale.x = close ? Math.max(.15, Math.abs(Math.cos(time * 1.6 + it.ph))) * Math.sign(Math.cos(time * 1.6 + it.ph) || 1) : 1; }
        else if (it.type !== 'wortel') it.mesh.rotation.z = close ? Math.sin(time * 3 + it.ph) * .1 : 0;
      }
      for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t += dt * 2.2; f.m.position.y = .3 + f.t * 1.5; f.m.scale.setScalar(Math.max(.01, 1.25 - f.t * f.t)); if (f.t >= 1.1) { scene.remove(f.m); flying.splice(i, 1); } }
      if (eggMesh) { eggMesh.rotation.z = Math.sin(time * 3) * .12; eggGlow.material.opacity = .45 + Math.sin(time * 3) * .25; const s = 1.5 + Math.sin(time * 3) * .25; eggGlow.scale.set(s, s, 1); sparkT -= dt; if (sparkT < 0) { sparkT = .9; burst(eggPos, 2); } }
      if (star.hop) { const h = star.hop; h.t += dt * 1.1; const k = Math.min(1, h.t); star.pos.set(h.from.x + (h.to.x - h.from.x) * k, 0, h.from.z + (h.to.z - h.from.z) * k); star.lift = Math.sin(k * Math.PI) * 1.8; if (k >= 1) { star.hop = null; star.lift = 0; burst(star.pos, 4); } }
      if (fruit.fall) { const f = fruit.fall; f.t += dt * 1.6; const k = Math.min(1, f.t); fruit.pos.set(f.from.x + (underTree.x - f.from.x) * k, f.from.y * (1 - k * k) + Math.sin(k * Math.PI) * .5, f.from.z + (underTree.z - f.from.z) * k); if (k >= 1) { fruit.fall = null; fruit.pos.y = 0; sfx.pop(); burst(fruit.pos, 6, true); } }
      for (const o of [star, fruit]) if (o.pos) {
        const high = o === fruit && (fruit.fall || fruit.pos.y > 1);
        o.mesh.position.set(o.pos.x, high ? o.pos.y : .3 + (o.lift || 0) + Math.sin(time * 2.4) * .1, o.pos.z); o.mesh.rotation.z = high ? Math.sin(time * 1.6) * .1 : Math.sin(time * 1.6) * .2;
        const gs = 2 + Math.sin(time * 3) * .3; o.glow.scale.set(gs, gs, 1); o.glow.material.opacity = .5 + Math.sin(time * 3) * .25; o.glow.position.set(o.mesh.position.x, o.mesh.position.y + .5, o.pos.z + .1);
      }
      for (const sh of shrooms) { if (sh.t < 1) { sh.t = Math.min(1, sh.t + dt * 2.6); const q = Math.sin(sh.t * Math.PI * 3) * .3 * (1 - sh.t); sh.m.scale.set(1 + q, 1 - q, 1); } const near = active && Math.hypot(sh.x - kid.pos.x, sh.z - kid.pos.z) < .75; if (near && !sh.near) sh.play(); sh.near = near; }
      { const near = Math.abs(kid.pos.x - penMid.x) < 7 && Math.abs(kid.pos.z - penMid.z) < 5; if (near && !greeted && herd.length) { const c = herd.filter(c => !c.friend).reduce((a, b) => !a || b.pos.distanceTo(kid.pos) < a.pos.distanceTo(kid.pos) ? b : a, null); if (c) { c.hop = 1; c.face = kid.pos.x >= c.pos.x ? 1 : -1; bubble(c, '', PX.heart()); } } greeted = near; }   // the nearest one looks up and says hello; the others go on grazing
      { const can = Q.raceMounts().length > 0; for (const s of race.waiting) { s.visible = can; s.position.y = can && race.hop && race.hop.s === s ? Math.sin(Math.min(1, race.hop.t) * Math.PI) * .3 : 0; } if (race.hop && (race.hop.t += dt * 2.5) > 1) race.hop = null;
        const under = Math.floor(kid.pos.x) === Math.floor(race.x) && Math.floor(kid.pos.z) === Math.floor(race.z);
        if (!under) race.armed = true; else if (active && race.armed && can) { race.armed = false; kid.path = []; race.go(); } }
      if (!active) return;
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (Math.abs(it.x - kid.pos.x) < .75 && Math.abs(it.z - kid.pos.z) < .75) pickUp(it); }
      if (eggPos) {
        const dd = Math.hypot(eggPos.x - kid.pos.x, eggPos.z - kid.pos.z);
        if (dd < 1.05) findEgg();
        else if (dd < 9) { peepT -= dt; if (peepT < 0) { peepT = .5 + dd * .32; sfx.bubble(); } }   // warmer = faster peeps
      }
      if (star.pos && Q.quest.stage === 'ei' && !star.hop) { const d = Math.hypot(star.pos.x - kid.pos.x, star.pos.z - kid.pos.z); if (d < 2 && star.hops < 2) hopStar(); else if (d < 1.1) startHatch(); }
      if (fruit.pos && !fruit.fall && fruit.pos.y < 1 && Math.hypot(fruit.pos.x - kid.pos.x, fruit.pos.z - kid.pos.z) < 1.2) feed();
    },
  };
}
