// Every island has a toy of its own. None of it is needed for the adventure, none of it can go wrong, and nothing here
// moves until a child does something:
//   dorp     a watering can (filled at the pond or the fountain) and flower pots that grow, a stall where found things
//            are traded for things to wear
//   bos      somebody is hiding in the bushes
//   wei      a kite that flies when you run, dandelions to blow
//   strand   a bucket for sand towers (jump on them to flatten them)
//   eiland   puddles of paint: coloured footprints, and two colours make a third
//   kasteel  tap the castle and somebody looks out of a window
// The bike's ramps and trailer and the boat live in world-play.js. What should stay the way the children left it (the
// plants, the sand towers, what they bought) is saved by quest.js first and drawn after.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as Q from './quest.js';
import { sfx } from './audio.js';

export function createToys(ctx) {
  const { THREE, scene, M, tex, makeSprite, pick, burst, bubble, kid, animals } = ctx;
  const rnd = (a, b) => a + Math.random() * (b - a), v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const near = (x, z, r) => Math.hypot(x - kid.pos.x, z - kid.pos.z) < r;
  const zoneOf = (x, z) => M.zone[M.I(x, z)];
  const texs = new Map(), texOf = art => { if (!texs.has(art)) texs.set(art, tex(art)); return texs.get(art); };
  /** give a sprite another picture */
  function setArt(mesh, art) { const t = texOf(art); mesh.material.map = t; mesh.material.emissiveMap = t; mesh.customDepthMaterial.map = t; mesh.geometry = ctx.spriteGeom(art.width, art.height); mesh.userData.alpha = art; }
  const sprite = (art, x, z, o = {}) => { const m = makeSprite(art, { lean: .3, ...o }); m.position.set(x, o.y || 0, z); m.userData.alpha = art; scene.add(m); return m; };
  const tappable = (m, fn) => { m.userData.tap = fn; pick.push(m); return m; };
  const bit = (...a) => ctx.life.bit(...a);
  /** squash and stretch for a moment: the way everything here says "you touched me" */
  const pops = [];
  function pop(o, amp = .3) { o.pop = 0; o.amp = amp; if (!pops.includes(o)) pops.push(o); }

  /* ================= things she can carry: watering can, bucket, kite ================= */
  const things = {}; let carry = null;
  function thing(id, art, [x, z], scale = 1.1) {
    const t = things[id] = { id, m: sprite(art, x, z, { scale }), x, z, scale, tilt: 0 };
    tappable(t.m, () => { if (carry === t) return putDown(); sfx.pop(); pop(t); near(t.x, t.z, 1.5) ? take(t) : ctx.approach(Math.floor(t.x), Math.floor(t.z), () => take(t)); });
    return t;
  }
  function take(t) { if (carry === t) return; if (carry) putDown(true); carry = t; t.m.castShadow = false; kid.hop = .5; sfx.pop(); if (t === kite) { sfx.whoosh(); kiteP.set(kid.pos.x, .4, kid.pos.z); } }
  function putDown(quiet = false) {
    const t = carry; if (!t) return; carry = null;
    let x = kid.pos.x + kid.face * .55, z = kid.pos.z + .12; if (!ctx.walkable(Math.floor(x), Math.floor(z))) { x = kid.pos.x; z = kid.pos.z + .05; }
    t.x = x; t.z = z; t.m.position.set(x, 0, z); t.m.rotation.set(-.3, 0, 0); t.m.scale.set(t.scale, t.scale, 1); t.m.castShadow = true; t.tilt = 0; pop(t); if (!quiet) sfx.pop();
    if (t === kite) { line.visible = false; for (const b of tail) b.m.visible = false; }
  }
  const can = thing('gieter', ART.gieter(false), MAP.CAN), bucket = thing('emmer', ART.emmer(), MAP.BUCKET), kite = thing('vlieger', ART.vlieger(), MAP.KITE, 1.2);
  can.water = 0;

  /* ================= dorp: water makes the flower pots grow ================= */
  const P = MAP.POND, F = MAP.FOUNT;
  function fill() {
    if (carry !== can || can.water >= 3) return false;
    can.water = 3; setArt(can.m, ART.gieter(true)); sfx.splash(); sfx.bubble(); kid.hop = .4; pop(can);
    for (let i = 0; i < 4; i++) bit(ART.drop(), kid.pos.x + kid.face * .4 + rnd(-.2, .2), .7, kid.pos.z + .15, { vx: rnd(-.8, .8), vy: rnd(1.5, 2.5), g: 7, life: .7 }); return true;
  }
  /** tip the can over (x, z). Returns false, with a hint where water comes from, when it is empty. */
  function pour(x, z) {
    kid.face = x >= kid.pos.x ? 1 : -1;
    if (!can.water) { can.tilt = .5; sfx.pop(); bit(ART.drop(), kid.pos.x + kid.face * .7, .6, kid.pos.z + .15, { g: 5, life: .6 }); bubble(kid, '', ART.drop()); return false; }
    can.water--; can.tilt = .9; sfx.splash(); if (!can.water) setArt(can.m, ART.gieter(false));
    for (let i = 0; i < 7; i++) setTimeout(() => bit(ART.drop(), x + rnd(-.2, .2), .75, z + .1, { vx: rnd(-.3, .3), vy: 0, g: 6, life: .55 }), i * 70);
    return true;
  }
  const pots = MAP.POTS.map(([x, z], i) => {
    const p = { i, x, z, m: sprite(ART.pot(Q.plant(i), i), x, z, { scale: 1.25 }) };
    tappable(p.m, () => { pop(p, .15); near(p.x, p.z + .5, 1.4) ? usePot(p) : ctx.approach(Math.floor(p.x), Math.floor(p.z), () => usePot(p)); });
    return p;
  });
  function usePot(p) {
    const st = Q.plant(p.i), here = v3(p.x, .5, p.z);
    if (carry === can) {
      if (!pour(p.x, p.z)) return;
      setTimeout(() => {
        if (Q.water(p.i)) { setArt(p.m, ART.pot(Q.plant(p.i), p.i)); pop(p, .45); sfx.chime(Q.plant(p.i) * 2); if (Q.plant(p.i) >= Q.PLANT_MAX) { sfx.sparkle(); burst(here, 8, true); } }
        else { pop(p, .3); sfx.chime(7); burst(here, 4, true); }                    // already in bloom: it simply likes the water
      }, 450);
    } else if (st >= Q.PLANT_MAX) {                                                   // picked: into the bag, for a flower crown at the stall
      kid.face = p.x >= kid.pos.x ? 1 : -1; Q.pluck(p.i); setArt(p.m, ART.pot(0, p.i)); pop(p, .4); sfx.chime(4); kid.hop = .6;
      bit(ART.itemArt('bloem', [1, 0, 2, 4][p.i % 4]), p.x, .9, p.z + .1, { vy: 2.4, g: 2.5, life: .9 });
    } else { sfx.pop(); bubble(kid, '', ART.gieter(true)); if (carry !== can) pop(can, .5); }   // it is thirsty: the can wiggles
  }
  const syncPots = () => { for (const p of pots) setArt(p.m, ART.pot(Q.plant(p.i), p.i)); };

  /* ================= strand: sand towers ================= */
  const towers = new Map(), sandOK = (x, z) => M.inb(x, z) && M.ground[M.I(x, z)] === MAP.SA && zoneOf(x, z) === 'strand' && ctx.walkable(x, z);
  function syncSand() {
    const want = new Map(Q.quest.sand.map(([x, z, l]) => [x + ',' + z, [x, z, l]]));
    for (const [k, t] of towers) if (!want.has(k)) { scene.remove(t.m); const i = pick.indexOf(t.m); if (i >= 0) pick.splice(i, 1); towers.delete(k); }
    for (const [k, [x, z, l]] of want) {
      let t = towers.get(k);
      if (!t) { t = { x, z, l, m: sprite(ART.zandtoren(l), x + .5, z + .6, { scale: 1.15 }) }; towers.set(k, t); tappable(t.m, () => tapTower(t)); pop(t, .5); }
      else if (t.l !== l) { t.l = l; setArt(t.m, ART.zandtoren(l)); pop(t, .5); }
    }
  }
  function build(x, z) {
    kid.face = x + .5 >= kid.pos.x ? 1 : -1; bucket.tilt = .7;
    const l = Q.buildSand(x, z); if (!l) { const t = towers.get(x + ',' + z); if (t) pop(t, .2); sfx.pop(); return; }
    syncSand(); sfx.brush(); sfx.pop(); kid.hop = .4;
    for (let i = 0; i < 5; i++) bit(sandGrain, x + .5 + rnd(-.4, .4), .3, z + .7, { vx: rnd(-1, 1), vy: rnd(1, 2), g: 7, life: .6 });
    if (l >= Q.SAND_MAX) { sfx.sparkle(); burst(v3(x + .5, .6, z + .6), 8); }
  }
  const sandGrain = PX.gridSprite(2, 2, () => '#E8C88E', { outline: false });
  function tapTower(t) {
    if (carry === bucket) { ctx.approach(t.x, t.z, () => build(t.x, t.z)); return; }
    pop(t, .25); sfx.pop(); if (t.l < Q.SAND_MAX) { bubble(kid, '', ART.emmer()); pop(bucket, .5); }
  }
  /** a tap on the ground: with the bucket in her hands, a tap on the sand builds a tower there */
  function tapGround(x, z) {
    if (carry !== bucket || !sandOK(x, z)) return false;
    sfx.click(); ctx.showMarker(x + .5, z + .5); ctx.approach(x, z, () => build(x, z)); return true;
  }
  /** the jump button: jumping next to a sand tower flattens it (and nobody minds) */
  function stomp() {
    for (const t of towers.values()) if (near(t.x + .5, t.z + .5, 1.15)) {
      setTimeout(() => {
        if (!Q.stompSand(t.x, t.z)) return; syncSand(); sfx.whoosh(); sfx.brush();
        for (let i = 0; i < 12; i++) bit(sandGrain, t.x + .5 + rnd(-.4, .4), rnd(.1, .7), t.z + .7, { vx: rnd(-2.5, 2.5), vy: rnd(1, 3.5), g: 8, life: .8 });
      }, 300); return true;
    }
    return false;
  }

  /* ================= bos: who is hiding in the bushes? ================= */
  const hides = MAP.HIDES.map(([x, z], k) => {
    const t = ctx.walkable(x, z) ? [x, z] : ctx.nearestWalkable(x + .5, z + .5); if (!t || zoneOf(t[0], t[1]) !== 'bos') return null;
    const h = { x: t[0] + .5, z: t[1] + .62, m: sprite(PX.bush(2 + k % 3), t[0] + .5, t[1] + .62, { lean: .25, scale: 1.2 }), who: null };
    tappable(h.m, () => rustle(h, true)); return h;
  }).filter(Boolean);
  const HIDERS = [[ART.squirrel(), 'pop'], [PX.hedgehog(), 'pop'], [PX.bunny(), 'boing']];
  const hiders = hides.length < 4 ? [] : HIDERS.map(([art, snd], k) => {
    const h = { m: sprite(ART.hd(art), 0, 0, { lean: .25, shadow: false, scale: .5 }), snd, at: hides[k * 2], state: 'hid', t: rnd(0, 3), peek: 0, pos: v3(0, 0, 0), dir: 1 };
    h.at.who = h; return h;
  });
  function rustle(hide, tapped) {
    pop(hide, .35); sfx.brush(); ctx.life.leaves(hide.x, hide.z, 3, .5);
    const h = hide.who; if (!h || h.state !== 'hid') return;
    // found! Out she jumps, laughs, and runs off to hide somewhere else
    h.state = 'out'; h.t = 0; h.dir = kid.pos.x > hide.x ? -1 : 1; h.from = v3(hide.x, .3, hide.z - .1); h.to = v3(hide.x + h.dir * .9, 0, hide.z + .5);
    hide.who = null; sfx[h.snd](); sfx.chime(6); burst(v3(hide.x, .8, hide.z), 6, true); if (tapped) kid.hop = .5;
  }

  /* ================= wei: a kite, and dandelions ================= */
  const kiteP = v3(0, 0, 0), lineGeo = new THREE.BufferGeometry().setFromPoints([v3(0, 0, 0), v3(0, 1, 0)]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#FFFFFF' })); line.visible = false; line.frustumCulled = false; scene.add(line);
  const tail = [0, 1, 2].map(k => ({ m: sprite(ART.strikje(k), 0, 0, { lean: 0, shadow: false, scale: .8 }), p: v3(0, 0, 0) })); for (const b of tail) b.m.visible = false;
  const weiSpots = M.spawns.bloem.filter(([x, z]) => zoneOf(x, z) === 'wei');
  const puffs = weiSpots.slice(-7).map(([x, z]) => { const d = { x: x + .5, z: z + .6, full: true, back: 0, m: sprite(ART.pluis(true), x + .5, z + .6, { shadow: false, scale: 1.1 }) }; tappable(d.m, () => near(d.x, d.z, 1.3) ? blow(d) : ctx.approach(Math.floor(d.x), Math.floor(d.z), () => blow(d))); return d; });
  function blow(d) {
    pop(d, .3); if (!d.full) return; d.full = false; d.back = 40; setArt(d.m, ART.pluis(false)); sfx.brush();
    for (let i = 0; i < 9; i++) bit(ART.pluisje(), d.x + rnd(-.15, .15), .45 + rnd(0, .15), d.z + .05, { vx: rnd(.4, 1.6), vy: rnd(.3, 1), g: -.25, sway: rnd(1.5, 3), life: rnd(2, 3.4) });
  }

  /* ================= eiland: puddles of paint ================= */
  const MIX = { '0,1': '#FF9A3C', '1,2': '#5DC88A', '0,2': '#9B72E8' };
  const puddles = MAP.PAINT.map(([x, z], k) => {
    const t = ctx.walkable(Math.floor(x), Math.floor(z)) ? [Math.floor(x), Math.floor(z)] : ctx.nearestWalkable(x, z); if (!t) return null;
    const m = sprite(ART.verfplas(ART.PAINTS[k]), t[0] + .5, t[1] + .94, { lean: Math.PI / 2, shadow: false, y: .022 });
    const p = { k, x: t[0] + .5, z: t[1] + .5, m, in: false }; tappable(m, () => ctx.walkToTile(t[0], t[1])); return p;
  }).filter(Boolean);
  const NP = 110, printGeo = new THREE.PlaneGeometry(.2, .3); printGeo.rotateX(-Math.PI / 2);
  const prints = new THREE.InstancedMesh(printGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), NP), printAt = [], pd = new THREE.Object3D(), pc = new THREE.Color();
  for (let i = 0; i < NP; i++) { pd.position.set(0, -5, 0); pd.updateMatrix(); prints.setMatrixAt(i, pd.matrix); prints.setColorAt(i, pc.set('#FFFFFF')); printAt.push(null); }
  prints.frustumCulled = false; scene.add(prints);
  let paint = null, printI = 0, lastPrint = v3(0, 0, 0), side = 1, clock = 0;
  function stepIn(p) {
    const fresh = !paint || paint.left <= 0 || paint.base.includes(p.k);
    if (fresh) paint = { base: [p.k], left: 45, n: 0 }; else { paint.base.push(p.k); paint.left = 45; }
    sfx.splash(); kid.hop = .4; pop(p, .25);
    for (let i = 0; i < 6; i++) bit(PX.gridSprite(2, 2, () => ART.PAINTS[p.k], { outline: false, key: 'spat' + p.k }), p.x + rnd(-.3, .3), .15, p.z + .1, { vx: rnd(-1.8, 1.8), vy: rnd(1.5, 3), g: 9, life: .6 });
    if (paint.base.length >= 3) { sfx.sparkle(); burst(v3(p.x, .5, p.z), 8); }      // all three: a rainbow
  }
  const paintCol = () => paint.base.length >= 3 ? PX.RAINBOW[paint.n % 6] : paint.base.length === 2 ? MIX[[...paint.base].sort().join(',')] : ART.PAINTS[paint.base[0]];
  function stamp(dx, dz) {
    const l = Math.hypot(dx, dz) || 1, i = printI++ % NP; side = -side; paint.left--; paint.n++;
    printAt[i] = { x: kid.pos.x - dz / l * .13 * side, z: kid.pos.z + dx / l * .13 * side + .12, a: Math.atan2(dx, dz), born: clock };
    prints.setColorAt(i, pc.set(paintCol())); prints.instanceColor.needsUpdate = true;
  }

  /* ================= kasteel: somebody looks out of a window ================= */
  // (the two windows beside the gate, and three places on top of the wall; the outer windows are behind the towers)
  const C = MAP.CASTLE, WINS = [[.34, 1.42, .3, .04], [.66, 1.42, .3, .04], [.25, 2.72, .42, -.3], [.5, 2.72, .42, -.3], [.75, 2.72, .42, -.3]].map(([f, y, s, dz]) => ({ x: C.x + C.w * f, y, s, z: C.z + C.d + dz, busy: null }));
  const PEEK = [[PX.cat(), 'purr'], [ART.dragon(), 'boing'], [PX.bunny(), 'boing'], [PX.duck(), 'pop'], [PX.puppy(), 'boing'], [PX.cat('#F5B83D'), 'purr']];
  const peekers = []; let peekN = Math.floor(Math.random() * PEEK.length);
  /** h: where the castle was tapped (the nearest free window answers) */
  function peek(h) {
    const hx = h && h.point ? h.point.x : C.x + C.w * Math.random(), free = WINS.filter(w => !w.busy).sort((a, b) => Math.abs(a.x - hx) - Math.abs(b.x - hx));
    if (!free.length) return; const w = free[0], [art, snd] = PEEK[peekN++ % PEEK.length];
    const m = sprite(ART.hd(art), w.x, w.z, { lean: 0, shadow: false, scale: w.s, y: w.y }); m.material = m.material.clone(); m.material.emissiveIntensity = .6;
    w.busy = { m, t: 0, w, base: w.s }; peekers.push(w.busy); sfx[snd](); sfx.chime(peekN % 8);
  }

  /* ================= dorp: the stall ================= */
  const S = MAP.STALL, stall = { m: sprite(ART.kraam(), S.x + S.w / 2, S.z + .92, { lean: .22, scale: 1.05 }) }; let stallT = 3;
  const openStall = () => ctx.onShop();
  tappable(stall.m, () => { sfx.pop(); pop(stall, .08); const at = Math.floor(kid.pos.x) === S.x && Math.floor(kid.pos.z) === S.z + 1; at ? openStall() : ctx.walkThen(S.x, S.z + 1, openStall); });
  /* the balloon from the stall floats along above her */
  const balloon = { m: sprite(PX.balloon('#FF6B6B'), 0, 0, { lean: .15, shadow: false, scale: 1.1 }), p: v3(kid.pos.x, 1.6, kid.pos.z), up: 0 };
  tappable(balloon.m, () => { balloon.up = 1; sfx.boing(); });

  const off = Q.on(type => { if (type === 'garden' || type === 'day') syncPots(); if (type === 'sand' || type === 'day' || type === 'stage') syncSand(); });
  syncSand();

  return {
    dispose: off, peek, stomp, tapGround, putDown, fountain: fill,
    carrying: () => carry && carry.id,
    /** dev / tests */
    take: id => take(things[id]), usePot: i => usePot(pots[i]), build, rustle: i => rustle(hides[i], true), blow: i => blow(puffs[i]), openStall,
    info: () => ({ carry: carry && carry.id, water: can.water, pots: pots.map(p => Q.plant(p.i)), towers: [...towers.values()].map(t => [t.x, t.z, t.l]), hides: hides.map(h => [h.x, h.z, !!h.who]), hiders: hiders.map(h => h.state), puffs: puffs.map(d => [d.x, d.z, d.full]), puddles: puddles.map(p => [p.x, p.z]), paint: paint && { base: paint.base, left: paint.left }, prints: printAt.filter(Boolean).length, peekers: peekers.length, kite: [kiteP.x, kiteP.y, kiteP.z], things: Object.values(things).map(t => [t.id, t.x, t.z]) }),
    /** with a full can in her hands, a tap on an animal waters it. Returns true if it handled the tap. */
    tapAnimal(c) {
      if (carry !== can) return false; if (!near(c.pos.x, c.pos.z, 2.2)) { ctx.approach(Math.floor(c.pos.x), Math.floor(c.pos.z), () => this.tapAnimal(c)); return true; }
      if (!pour(c.pos.x, c.pos.z)) return true;
      setTimeout(() => {
        (sfx[c.sound] || sfx.pop)(); c.hop = 1;
        if (c.water) { c.hopH = .6; burst(c.pos, 6, true); }                           // ducks love it
        else if (c.name === 'Poes') { c.hopH = 1.1; bubble(c, '!'); const t = ctx.randomTile(c); c.path = [v3(t[0] + .5, 0, t[1] + .5)]; c.wait = 3; }   // cats do not
        else { c.shake = .7; for (let i = 0; i < 6; i++) bit(ART.drop(), c.pos.x, .5, c.pos.z + .1, { vx: rnd(-2, 2), vy: rnd(1, 2.5), g: 8, life: .6 }); }
      }, 450); return true;
    },
    update(dt, time, active) {
      clock += dt;
      for (let i = pops.length - 1; i >= 0; i--) { const o = pops[i]; o.pop = Math.min(1, o.pop + dt * 2.4); const q = Math.sin(o.pop * Math.PI * 3) * o.amp * (1 - o.pop), s = o.scale || o.m.userData.s0 || (o.m.userData.s0 = o.m.scale.y); if (o !== carry) o.m.scale.set(s * (1 + q) * Math.sign(o.m.scale.x || 1), s * (1 - q), 1); if (o.pop >= 1) pops.splice(i, 1); }
      for (const a of animals) if (a.shake > 0) { a.shake -= dt; a.mesh.rotation.z = a.shake > 0 ? Math.sin(a.shake * 45) * .25 : 0; }
      /* in her hands */
      if (carry && carry !== kite) {
        const t = carry; t.tilt = Math.max(0, t.tilt - dt); t.x = kid.pos.x; t.z = kid.pos.z;
        t.m.position.set(kid.pos.x + kid.face * .4, kid.mesh.position.y + .26, kid.pos.z + (kid.zBias || 0) + .03); t.m.scale.set(-kid.face * t.scale * .85, t.scale * .85, 1); t.m.rotation.z = kid.face * -Math.min(1, t.tilt * 3) * .9;
        if (active && t === can && can.water < 3 && (Math.hypot((kid.pos.x - P.cx) / (P.rx + 1.1), (kid.pos.z - P.cz) / (P.rz + 1.1)) < 1 || Math.hypot(kid.pos.x - F.cx, kid.pos.z - F.cz - .6) < 2.3)) fill();
      }
      /* the kite: up when she runs, down when she stands */
      if (carry === kite) {
        const fast = ctx.mount() ? 1.35 : 1, h = kid.moving ? 2.5 * fast : 1.25, k = Math.min(1, dt * 2.2);
        kiteP.x += (kid.pos.x - kid.face * (kid.moving ? 1.9 : .9) - kiteP.x) * k; kiteP.y += (h + Math.sin(time * 2.1) * .12 - kiteP.y) * k; kiteP.z += (kid.pos.z - .25 - kiteP.z) * k;
        kite.x = kid.pos.x; kite.z = kid.pos.z; kite.m.position.copy(kiteP); kite.m.rotation.set(-.2, 0, Math.sin(time * 2.6) * .16 - kid.face * .25); kite.m.scale.set(kite.scale, kite.scale, 1);
        const a = lineGeo.attributes.position; a.setXYZ(0, kid.pos.x + kid.face * .25, kid.mesh.position.y + .5, kid.pos.z + .05); a.setXYZ(1, kiteP.x, kiteP.y + .05, kiteP.z); a.needsUpdate = true; line.visible = true;
        let px = kiteP.x, py = kiteP.y, pz = kiteP.z; tail.forEach((b, i) => { const kk = Math.min(1, dt * (9 - i * 2)); b.p.x += (px + Math.sin(time * 5 + i) * .06 - b.p.x) * kk; b.p.y += (py - .26 - b.p.y) * kk; b.p.z += (pz - b.p.z) * kk; b.m.position.copy(b.p); b.m.visible = true; px = b.p.x; py = b.p.y; pz = b.p.z; });
      }
      /* hide and seek */
      for (const h of hiders) {
        h.t += dt; const hide = h.at;
        if (h.state === 'hid') {                                                      // only her ears show; she cannot keep quite still when someone is near
          const close = active && near(hide.x, hide.z, 5.5); h.peek = Math.max(0, h.peek - dt * 1.6);
          if (close && h.t > 3.2) { h.t = rnd(0, 1.2); h.peek = 1; pop(hide, .12); if (near(hide.x, hide.z, 3.5)) sfx.brush(); }
          h.m.position.set(hide.x, .2 + Math.sin(Math.min(1, h.peek) * Math.PI) * .22, hide.z - .1); h.m.scale.set(.5 * h.dir, .5, 1); h.m.rotation.z = 0;
          if (active && near(hide.x, hide.z, .75)) rustle(hide, false);
        } else if (h.state === 'out') {
          const k = Math.min(1, h.t / .45); h.pos.lerpVectors(h.from, h.to, k); h.m.position.set(h.pos.x, h.pos.y + Math.sin(k * Math.PI) * 1.1, h.pos.z); h.m.scale.set(.5 * h.dir, .5, 1); h.m.rotation.z = -h.dir * k * Math.PI * 2;
          if (k >= 1) { h.state = 'laugh'; h.t = 0; h.m.rotation.z = 0; bubble({ pos: h.pos, isUni: false }, '', PX.heart()); }
        } else if (h.state === 'laugh') {
          h.m.position.y = Math.abs(Math.sin(h.t * 9)) * .22;
          if (h.t > 1.3) { const free = hides.filter(x => !x.who && x !== h.at && !near(x.x, x.z, 3)); h.at = free.length ? free[Math.floor(Math.random() * free.length)] : hides.find(x => !x.who) || h.at; h.at.who = h; h.state = 'run'; h.t = 0; h.from = h.pos.clone(); h.dir = h.at.x >= h.pos.x ? 1 : -1; h.dur = Math.max(.5, h.from.distanceTo(v3(h.at.x, 0, h.at.z)) / 5.5); }
        } else {                                                                      // 'run': hop, hop, hop, and into the next bush
          const k = Math.min(1, h.t / h.dur); h.pos.lerpVectors(h.from, v3(h.at.x, 0, h.at.z - .1), k); h.m.position.set(h.pos.x, Math.abs(Math.sin(h.t * 11)) * .3 + (k > .9 ? (k - .9) * 2 : 0), h.pos.z); h.m.scale.set(.5 * h.dir, .5, 1);
          if (k >= 1) { h.state = 'hid'; h.t = 0; h.peek = 0; pop(h.at, .3); if (near(h.at.x, h.at.z, 7)) sfx.brush(); }
        }
      }
      /* dandelions grow back */
      for (const d of puffs) { if (!d.full && (d.back -= dt) < 0 && !near(d.x, d.z, 4)) { d.full = true; setArt(d.m, ART.pluis(true)); } else if (active && d.full && near(d.x, d.z, .6)) blow(d); }
      /* paint */
      if (active) for (const p of puddles) { const inside = near(p.x, p.z, .62); if (inside && !p.in) stepIn(p); p.in = inside; }
      if (paint && paint.left > 0 && active && kid.hop <= 0) { const dx = kid.pos.x - lastPrint.x, dz = kid.pos.z - lastPrint.z, gap = ctx.mount() === 'fiets' ? .17 : .4; if (dx * dx + dz * dz > gap * gap) { stamp(dx, dz); lastPrint.copy(kid.pos); } } else if (!paint || paint.left <= 0) lastPrint.copy(kid.pos);
      for (let i = 0; i < NP; i++) { const p = printAt[i]; if (!p) continue; const age = clock - p.born, s = age < 40 ? 1 : Math.max(0, 1 - (age - 40) / 6); pd.position.set(p.x, .021, p.z); pd.rotation.set(0, p.a, 0); pd.scale.setScalar(Math.max(.001, s)); pd.updateMatrix(); prints.setMatrixAt(i, pd.matrix); if (s <= 0) printAt[i] = null; }
      prints.instanceMatrix.needsUpdate = true;
      /* castle windows */
      for (let i = peekers.length - 1; i >= 0; i--) {
        const p = peekers[i]; p.t += dt; const up = Math.min(1, p.t / .22), down = p.t > 2.3 ? Math.max(0, 1 - (p.t - 2.3) / .2) : 1, s = p.base * up * down;
        p.m.scale.set(Math.max(.001, s), Math.max(.001, s), 1); p.m.rotation.z = Math.sin(p.t * 7) * .22 * down; p.m.position.y = p.w.y + Math.abs(Math.sin(p.t * 5)) * .04;
        if (p.t > 2.5) { scene.remove(p.m); p.m.material.dispose(); p.w.busy = null; peekers.splice(i, 1); }
      }
      /* the stall waves when she could trade something */
      stallT -= dt; if (stallT < 0) { stallT = 5; if (active && near(S.x + 1, S.z + 1, 9) && Q.SHOP.some(it => Q.canBuy(it.id))) { pop(stall, .07); burst(v3(S.x + 1, 1.5, S.z + 1), 3); } }
      /* the balloon */
      const hasB = Q.wearing(ctx.who()).hand === 'ballon'; balloon.m.visible = hasB;
      if (hasB) { const b = balloon, k = Math.min(1, dt * 4); b.up = Math.max(0, b.up - dt * .8); b.p.x += (kid.pos.x - kid.face * .38 - b.p.x) * k; b.p.z += (kid.pos.z - .06 - b.p.z) * k; b.p.y += (kid.mesh.position.y + 1.05 + Math.sin(b.up * Math.PI) * .9 + Math.sin(time * 1.7) * .04 - b.p.y) * k; b.m.position.copy(b.p); b.m.rotation.z = (b.p.x - (kid.pos.x - kid.face * .38)) * .5; }
    },
  };
}
