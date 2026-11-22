// Everything the bigger island adds on top of world.js: the sea at the beach, fences, pier, castle, extra animals,
// things to collect, the hidden egg, the unicorn meadow and the companion's reactions.
// world.js hands over a small toolbox (ctx); this file never reaches into world.js internals beyond that.
import * as PX from './pixel.js';
import * as ART from './art.js';
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
    const P = MAP.PEN, white = lam('#FFF6E3'), posts = [];
    const isGate = (x, z) => P.gate.some(g => g[0] === x && g[1] === z);
    for (let z = P.z0; z <= P.z1; z++) for (let x = P.x0; x <= P.x1; x++) if ((x === P.x0 || x === P.x1 || z === P.z0 || z === P.z1) && !isGate(x, z)) posts.push([x + .5, z + .5]);
    const inst = shadowed(new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .8, .16), white, posts.length)); const d = new THREE.Object3D();
    posts.forEach(([x, z], i) => { d.position.set(x, .4, z); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); }); scene.add(inst);
    const rail = (x0, z0, x1, z1) => { for (const y of [.3, .58]) { const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) + .08, .09, Math.abs(z1 - z0) + .08), white)); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); scene.add(m); } };
    const a = P.x0 + .5, b = P.x1 + .5, n = P.z0 + .5, s = P.z1 + .5, g0 = Math.min(...P.gate.map(g => g[1])), g1 = Math.max(...P.gate.map(g => g[1]));
    rail(a, n, b, n); rail(a, s, b, s); rail(b, n, b, s); rail(a, n, a, g0 - .5); rail(a, g1 + 1.5, a, s);
    // gate arch with a heart
    const pink = lam('#FF7EB6');
    for (const z of [g0 - .5, g1 + 1.5]) {
      const p = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.24, 1.25, .24), pink)); p.position.set(a, .625, z); scene.add(p);
      const heart = makeSprite(PX.heart(), { lean: .2, shadow: false, scale: 1.1 }); heart.position.set(a, 1.25, z + .02); scene.add(heart);
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
    g.traverse(o => { if (o.isMesh && !windowGlows.includes(o)) { o.userData.tap = () => { sfx.tada(); burst(new THREE.Vector3(C.door[0] + .5, 0, C.door[1] + .5), 8); speak('Dit is het kasteel van Eenhoornland! Hier wonen de eenhoorns.'); }; pick.push(o); } });
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
  scatter(ART.starfish(), 22, beach); scatter(ART.shell(1), 18, beach, .7);
  for (const c of ['#FF7EB6', '#FFFFFF', '#B9A3F0']) scatter(PX.smallFlower(c), 70, (x, z) => M.free(x, z) && g(x, z) === MAP.GR && M.zone[M.I(x, z)] === 'wei');   // the flower meadow
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, m = makeSprite(ART.bigMushroom(), { lean: .25 }); m.position.set(MAP.NOOK.cx + Math.cos(a) * 1.7, 0, MAP.NOOK.cz + Math.sin(a) * 1.4); scene.add(m); }

  /* ---------------- more animals ---------------- */
  const one = cv => ({ idle: cv, w1: cv, w2: cv });
  animal(one(PX.flipX(ART.squirrel())), { name: 'Eekhoorn', say: ['Nootjes!', 'Tsjk tsjk!'], sound: 'pop', blobW: .5, flippable: true }, [26, 10, 34, 15]);
  animal(one(PX.flipX(ART.squirrel())), { name: 'Eekhoorn', say: ['Tsjk tsjk!'], sound: 'pop', blobW: .5, flippable: true }, [42, 10, 48, 15]);
  animal(one(ART.deer()), { name: 'Hertje', say: ['Hallo!', 'Het bos is mooi, hè?'], sound: 'boing', blobW: .7, flippable: true }, [26, 10, 35, 16]);
  animal(one(PX.bunny()), { name: 'Konijn', say: ['Hop hop!'], sound: 'boing', blobW: .5 }, [60, 36, 66, 44]);
  animal(one(PX.bunny()), { name: 'Konijn', say: ['Hop hop!', 'Bloemetjes!'], sound: 'boing', blobW: .5 }, [74, 44, 82, 50]);
  animal(one(ART.crab()), { name: 'Krab', say: ['Klik klak!', 'Knip knip!'], sound: 'pop', blobW: .5 }, [48, 69, 58, 74]);
  animal(one(ART.crab()), { name: 'Krab', say: ['Klik klak!'], sound: 'pop', blobW: .5 }, [9, 68, 18, 73]);
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
  const flying = [];
  function pickUp(it) {
    scene.remove(it.mesh); items.splice(items.indexOf(it), 1);
    const m = itemMesh(ART.itemArt(it.type, it.idx)); m.position.set(it.x, .3, it.z); scene.add(m); flying.push({ m, t: 0 });
    const res = Q.collect(it.type, it.idx);
    if (it.type === 'munt') { sfx.chime(5); return; }
    sfx.chime(res.total); if (uni.g.visible && ctx.mount() !== 'uni') uni.hop = .6;       // nothing depends on it: picking things up is simply nice
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
  const star = { mesh: makeSprite(ART.starItem(), { lean: .3, shadow: false, scale: 1.2 }), glow: glowAt('#FFF1B0'), pos: null }, fruit = { mesh: makeSprite(ART.fruit(), { lean: .3, shadow: false, scale: 1.2 }), glow: glowAt('#FFD0F0'), pos: null };
  for (const o of [star, fruit]) { o.mesh.material = o.mesh.material.clone(); o.mesh.material.emissiveIntensity = .8; o.mesh.visible = false; scene.add(o.mesh); }
  let hatching = null; const shells = [];
  const starSpot = () => M.starSpots[Q.quest.spot % M.starSpots.length];
  function syncGoals() {
    const st = Q.quest.stage;
    if (st === 'ei' && !hatching) { const [x, z] = starSpot(); star.pos = new THREE.Vector3(x + .5, 0, z + .5); } else if (!hatching) star.pos = null;
    fruit.pos = st === 'baby' ? new THREE.Vector3(MAP.RAINBOW_TREE[0] + 1.5, 0, MAP.RAINBOW_TREE[1] + 1.5) : null;
    for (const o of [star, fruit]) { o.mesh.visible = o.glow.visible = !!o.pos; if (o.pos) { o.mesh.position.copy(o.pos); o.glow.position.set(o.pos.x, .8, o.pos.z + .1); } }
  }
  function startHatch() { hatching = { t: 0, from: star.pos.clone() }; sfx.sparkle(); bubble(kid, '', ART.starItem()); }
  function finishHatch() {
    const kindDef = Q.kind(), p = uni.pos.clone(); hatching = null; star.pos = null;
    if (!Q.hatch()) { syncGoals(); return; }                                         // saved; the 'stage' event swaps the egg for the unicorn
    uni.mesh.rotation.z = 0; uni.hop = 1; sfx.tada(); burst(p, 16, true); bubble(uni, state.uni.name + '!', PX.heart());
    for (const [part, dir] of [['top', 1], ['bottom', -1]]) { const m = makeSprite(ART.egg(kindDef, part), { lean: .3, shadow: false }); m.position.set(p.x, .3, p.z + .05); scene.add(m); shells.push({ m, vx: dir * 1.6, vy: 2.6, t: 0 }); }
    speak('Krak! Het ei komt uit! Het is een kleine eenhoorn! Ze heet ' + state.uni.name + '. ' + Q.goalText());
  }
  function feed() {
    const p = fruit.pos.clone(); if (!Q.feed()) return;
    sfx.munch(); setTimeout(() => sfx.tada(), 500); uni.hop = 1; burst(uni.pos, 14, true); burst(p, 8); bubble(uni, 'Mmm!', ART.fruit());
    speak('Mmm, regenboogfruit! ' + Q.goalText());
  }

  /* ---------------- the unicorn meadow ---------------- */
  const P = MAP.PEN, penHome = [P.x0 + 1, P.z0 + 1, P.x1 - 1, P.z1 - 1], gate = new THREE.Vector3(P.x0 + .5, 0, (P.gate[0][1] + P.gate[1][1] + 1) / 2);
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
      c.speed = 1.1; if (arriving && i === list.length - 1) c.pos.set(P.x0 + 1.5, 0, gate.z);
      herd.push(c);
    });
  }
  let party = 0;
  function deliver() {
    const name = state.uni.name; if (!Q.weiOpen()) return;
    ctx.setMount(null, true); kid.hop = 1; if (!Q.deliver()) return;
    party = 6; sfx.tada(); for (const c of herd) c.hop = 1;
    bubble(kid, '', ART.bedIcon());
    speak('Hoera! ' + name + ' woont nu in de eenhoornwei, bij alle vriendjes! Wat een feest! De regenboog maakt de brug weer heel. Het wordt avond: ga maar lekker slapen in je huisje.');
  }

  /* ---------------- companion ---------------- */
  function tapCompanion(c) {
    if (Q.canRide()) { ctx.setMount(ctx.mount() === 'uni' ? null : 'uni'); return; }   // tap her to climb on, tap again to get off
    c.hop = 1; sfx.sparkle(); burst(c.pos, 9, true);
    if (Q.quest.stage === 'ei') { bubble(c, 'Brr!', ART.starItem()); speak('Tik tik! Er beweegt iets in het ei! ' + Q.goalText()); }
    else { bubble(c, '', ART.fruit()); speak('Hihihi! Ik ben ' + state.uni.name + '! ' + Q.goalText()); }
  }
  /** the fountain is a wishing well: a few coins buy a sticker. Returns true if it handled the tap. */
  function fountain() {
    if (Q.quest.coins < Q.FOUNTAIN_PRICE) { if (Q.quest.coins) speak('Plons! Met ' + Q.FOUNTAIN_PRICE + ' muntjes mag je een wens doen bij de fontein.'); return false; }
    if (!Q.spendCoins(Q.FOUNTAIN_PRICE)) return false;
    sfx.splash(); burst(new THREE.Vector3(MAP.FOUNT.cx, 0, MAP.FOUNT.cz), 12); ctx.onWish && ctx.onWish(); return true;
  }

  const off = Q.on(type => {
    if (type === 'stage') { ctx.refreshUnicorn(); syncEgg(); syncGoals(); }
    if (type === 'day') syncItems();
    if (type === 'herd') syncHerd(true);
  });
  syncItems(); syncEgg(); syncGoals(); syncHerd(false);

  return {
    tapCompanion, fountain, eggSpot, dispose: off,
    info: () => ({ items: items.length, egg: eggPos && [eggPos.x, eggPos.z], star: star.pos && [star.pos.x, star.pos.z], fruit: fruit.pos && [fruit.pos.x, fruit.pos.z], gate: [gate.x, gate.z], herd: herd.length, hatching: !!hatching }),
    items: () => items.map(it => ({ type: it.type, x: it.x, z: it.z })),
    /** active: the child can play (not paused, start screen gone) */
    update(dt, time, active) {
      for (const it of items) {
        if (it.float) { it.mesh.position.y = .28 + Math.sin(time * 2.4 + it.ph) * .09; it.mesh.scale.x = Math.cos(time * 2.2 + it.ph); if (Math.abs(it.mesh.scale.x) < .15) it.mesh.scale.x = .15; }
        else if (it.type !== 'wortel') it.mesh.position.y = Math.max(0, Math.sin(time * 2.2 + it.ph)) * .07;
      }
      for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t += dt * 2.2; f.m.position.y = .3 + f.t * 1.5; f.m.scale.setScalar(Math.max(.01, 1.25 - f.t * f.t)); if (f.t >= 1.1) { scene.remove(f.m); flying.splice(i, 1); } }
      if (eggMesh) { eggMesh.rotation.z = Math.sin(time * 3) * .12; eggGlow.material.opacity = .45 + Math.sin(time * 3) * .25; const s = 1.5 + Math.sin(time * 3) * .25; eggGlow.scale.set(s, s, 1); sparkT -= dt; if (sparkT < 0) { sparkT = .9; burst(eggPos, 2); } }
      for (const o of [star, fruit]) if (o.pos && !(o === star && hatching)) { o.mesh.position.y = .3 + Math.sin(time * 2.4) * .1; o.mesh.rotation.z = Math.sin(time * 1.6) * .2; const gs = 2 + Math.sin(time * 3) * .3; o.glow.scale.set(gs, gs, 1); o.glow.material.opacity = .5 + Math.sin(time * 3) * .25; }
      if (hatching) {                                                               // 0..1 the star flies to the egg, 1..2.4 the egg shakes harder and harder
        const h = hatching; h.t += dt; const k = Math.min(1, h.t);
        star.mesh.position.set(h.from.x + (uni.pos.x - h.from.x) * k, .3 + Math.sin(k * Math.PI) * 1.2 + k * .3, h.from.z + (uni.pos.z - h.from.z) * k); star.glow.position.copy(star.mesh.position);
        if (h.t > 1) { star.mesh.visible = false; uni.mesh.rotation.z = Math.sin(h.t * 26) * .22 * (h.t - 1); if (Math.floor(h.t * 4) !== Math.floor((h.t - dt) * 4)) { sfx.pop(); uni.hop = .5; burst(uni.pos, 3); } }
        if (h.t > 2.4) finishHatch();
      }
      for (let i = shells.length - 1; i >= 0; i--) { const sh = shells[i]; sh.t += dt; sh.vy -= dt * 7; sh.m.position.x += sh.vx * dt; sh.m.position.y = Math.max(0, sh.m.position.y + sh.vy * dt); sh.m.rotation.z += sh.vx * dt * 2; if (sh.t > 2.5) { scene.remove(sh.m); shells.splice(i, 1); } }
      if (party > 0) { party -= dt; if (Math.floor(party * 2.5) !== Math.floor((party + dt) * 2.5)) { const x = P.x0 + 2 + Math.random() * (P.x1 - P.x0 - 3), z = P.z0 + 1.5 + Math.random() * (P.z1 - P.z0 - 3); burst(new THREE.Vector3(x, 0, z), 7, Math.random() < .5); sfx.sparkle(); for (const c of herd) if (Math.random() < .4) c.hop = 1; } }
      if (!active) return;
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (Math.abs(it.x - kid.pos.x) < .75 && Math.abs(it.z - kid.pos.z) < .75) pickUp(it); }
      if (eggPos) {
        const dd = Math.hypot(eggPos.x - kid.pos.x, eggPos.z - kid.pos.z);
        if (dd < 1.05) findEgg();
        else if (dd < 9) { peepT -= dt; if (peepT < 0) { peepT = .5 + dd * .32; sfx.bubble(); } }   // warmer = faster peeps
      }
      if (star.pos && !hatching && Q.quest.stage === 'ei' && Math.hypot(star.pos.x - kid.pos.x, star.pos.z - kid.pos.z) < 1.1) startHatch();
      if (fruit.pos && Math.hypot(fruit.pos.x - kid.pos.x, fruit.pos.z - kid.pos.z) < 1.2) feed();
      if (Q.weiOpen() && uni.g.visible && Math.hypot(gate.x - kid.pos.x, gate.z - kid.pos.z) < 1.6) deliver();
    },
  };
}
